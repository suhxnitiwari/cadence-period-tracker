import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from './lib/api.js';
import { deriveKeys, entryId, encryptJson, decryptJson, randomBytes, bytesToHex, importShareKey, b64url } from './lib/crypto.js';
import { saveKeys, loadKeys, clearKeys } from './lib/keystore.js';
import { analyze, isEmptyLog } from './lib/cycles.js';
import { todayISO } from './lib/dates.js';
import { buildIcs } from './lib/ics.js';
import { buildSnapshot } from './lib/share.js';

export const DEFAULT_SETTINGS = {
  displayName: '',
  typicalCycle: 28,
  typicalPeriod: 5,
  showFertility: false,
  customSymptoms: [],
  calendar: { enabled: false, title: 'Period likely', includeFertile: false },
};

const Store = createContext(null);
export const useStore = () => useContext(Store);

const EMPTY = { days: {}, settings: DEFAULT_SETTINGS, shares: [], requests: {}, calendarToken: null };

export function StoreProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = still checking
  const [keys, setKeys] = useState(null);
  const [data, setData] = useState(EMPTY);
  const [today, setToday] = useState(todayISO());

  // Keep "today" correct if the tab stays open past midnight.
  useEffect(() => {
    const id = setInterval(() => setToday(todayISO()), 60_000);
    return () => clearInterval(id);
  }, []);

  const writeEntry = useCallback(async (name, value, k = keys) => {
    const id = await entryId(k.macKey, name);
    if (value === null) return api.del(`/entries/${id}`);
    const blob = await encryptJson(k.encKey, value, id);
    return api.put(`/entries/${id}`, blob);
  }, [keys]);

  const loadAll = useCallback(async (k) => {
    const [entries, cal] = await Promise.all([api.get('/entries'), api.get('/calendar')]);
    const next = { ...EMPTY, days: {}, calendarToken: cal.token };
    for (const e of entries) {
      let value;
      try {
        value = await decryptJson(k.encKey, e, e.id);
      } catch {
        continue; // not decryptable with these keys: skip, never crash
      }
      if (value.type === 'day') next.days[value.date] = value.log;
      else if (value.type === 'settings') next.settings = { ...DEFAULT_SETTINGS, ...value.settings, calendar: { ...DEFAULT_SETTINGS.calendar, ...value.settings.calendar } };
      else if (value.type === 'shares') next.shares = value.shares;
      else if (value.type === 'requests') next.requests = value.requests;
    }
    setData(next);
  }, []);

  // Restore a session on load.
  useEffect(() => {
    (async () => {
      try {
        const me = await api.get('/auth/me');
        const stored = await loadKeys();
        if (!stored) {
          await api.post('/auth/logout');
          return setUser(null);
        }
        await loadAll(stored);
        setKeys(stored);
        setUser(me);
      } catch {
        setUser(null);
      }
    })();
  }, [loadAll]);

  const begin = async (me, derived) => {
    const k = { encKey: derived.encKey, macKey: derived.macKey };
    await saveKeys(k);
    await loadAll(k);
    setKeys(k);
    setUser(me);
    return k;
  };

  const signup = async (username, password) => {
    const salt = bytesToHex(randomBytes(16));
    const derived = await deriveKeys(password, salt);
    const me = await api.post('/auth/signup', { username, authKey: derived.authKey, salt });
    const k = await begin(me, derived);
    await writeEntry('settings', { type: 'settings', settings: DEFAULT_SETTINGS }, k);
  };

  const login = async (username, password) => {
    const { salt } = await api.get(`/auth/salt/${encodeURIComponent(username.trim().toLowerCase())}`);
    const derived = await deriveKeys(password, salt);
    const me = await api.post('/auth/login', { username, authKey: derived.authKey });
    await begin(me, derived);
  };

  const reset = async () => {
    await clearKeys();
    setKeys(null);
    setData(EMPTY);
    setUser(null);
  };

  const logout = async () => {
    await api.post('/auth/logout').catch(() => {});
    await reset();
  };

  const deleteAccount = async () => {
    await api.del('/account');
    await reset();
  };

  const saveDay = async (date, log) => {
    const clean = isEmptyLog(log) ? null : log;
    setData((d) => {
      const days = { ...d.days };
      if (clean) days[date] = clean;
      else delete days[date];
      return { ...d, days };
    });
    await writeEntry(`day:${date}`, clean && { type: 'day', date, log: clean });
  };

  const saveDays = async (updates) => {
    setData((d) => ({ ...d, days: { ...d.days, ...updates } }));
    const blobs = await Promise.all(Object.entries(updates).map(async ([date, log]) => {
      const id = await entryId(keys.macKey, `day:${date}`);
      return { id, ...(await encryptJson(keys.encKey, { type: 'day', date, log }, id)) };
    }));
    for (let i = 0; i < blobs.length; i += 1000) await api.post('/entries/bulk', { entries: blobs.slice(i, i + 1000) });
  };

  const saveSettings = async (patch) => {
    const settings = { ...data.settings, ...patch };
    setData((d) => ({ ...d, settings }));
    await writeEntry('settings', { type: 'settings', settings });
  };

  const saveRequests = async (requests) => {
    setData((d) => ({ ...d, requests }));
    await writeEntry('requests', { type: 'requests', requests });
  };

  const saveShares = async (shares) => {
    setData((d) => ({ ...d, shares }));
    await writeEntry('shares', { type: 'shares', shares });
  };

  const addShare = async ({ label, fields }) => {
    const token = b64url(randomBytes(18));
    const raw = b64url(randomBytes(32));
    await saveShares([...data.shares, { token, raw, label, fields }]);
  };

  const removeShare = async (token) => {
    await api.del(`/shares/${token}`);
    await saveShares(data.shares.filter((s) => s.token !== token));
  };

  const setCalendarToken = (calendarToken) => setData((d) => ({ ...d, calendarToken }));

  const analysis = useMemo(() => analyze(data.days, data.settings, today), [data.days, data.settings, today]);

  // Keep share links and the calendar feed in sync with the latest data.
  const published = useRef({});
  useEffect(() => {
    if (!user || !keys) return;
    const timer = setTimeout(async () => {
      for (const share of data.shares) {
        const snap = buildSnapshot({ share, analysis, days: data.days, requests: data.requests, displayName: data.settings.displayName });
        const sig = JSON.stringify(snap);
        if (published.current[share.token] === sig) continue;
        const key = await importShareKey(share.raw);
        await api.put(`/shares/${share.token}`, await encryptJson(key, snap, share.token));
        published.current[share.token] = sig;
      }
      const cal = data.settings.calendar;
      if (cal.enabled) {
        const ics = buildIcs(analysis.predictions, { title: cal.title, includeFertile: cal.includeFertile && analysis.showFertile, stamp: new Date(0) });
        if (published.current.calendar !== ics) {
          const { token } = await api.put('/calendar', { ics });
          published.current.calendar = ics;
          if (token !== data.calendarToken) setCalendarToken(token);
        }
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [user, keys, data, analysis]);

  const value = {
    user, today, analysis, ...data,
    signup, login, logout, deleteAccount,
    saveDay, saveDays, saveSettings, saveRequests, addShare, removeShare, setCalendarToken,
    resetPublished: () => { published.current = {}; },
  };
  return <Store.Provider value={value}>{children}</Store.Provider>;
}
