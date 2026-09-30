import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { loadState, saveState, eraseState, requestPersistence, EMPTY_STATE, newProfile } from './lib/storage.js';
import { analyze, isEmptyLog, PERIOD_FLOWS } from './lib/cycles.js';
import { addDays, todayISO } from './lib/dates.js';
import { ageFrom, voiceForAge, currentGrade, placeFor } from './lib/profile.js';
import { personFor } from './lib/voice.js';
import { useSync } from './lib/useSync.js';
import { privateCategories } from './lib/syncCore.js';

const Store = createContext(null);
export const useStore = () => useContext(Store);

export function StoreProvider({ children }) {
  const [state, setState] = useState(null); // null while loading
  const [today, setToday] = useState(todayISO());
  const [saveError, setSaveError] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    loadState().then((s) => { loaded.current = true; setState(s); }).catch(() => { loaded.current = true; setState(EMPTY_STATE); });
    requestPersistence();
    const id = setInterval(() => setToday(todayISO()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Persist every change locally.
  useEffect(() => {
    if (!loaded.current || !state) return;
    saveState(state).then(() => setSaveError(false)).catch(() => setSaveError(true));
  }, [state]);

  // Opt-in encrypted sync for any profile that's been paired with another phone.
  const syncStatus = useSync(state, setState);

  /** Update the active profile. */
  const update = (fn) => setState((s) => {
    const p = s.profiles[s.activeId];
    return { ...s, profiles: { ...s.profiles, [s.activeId]: { ...p, ...fn(p) } } };
  });

  const setDay = (date, log) => update((p) => {
    const days = { ...p.days };
    const { estimated, ...rest } = log ?? {}; // any edit makes a remembered date real data
    if (isEmptyLog(rest)) delete days[date];
    else days[date] = rest;
    return { days };
  });

  const actions = {
    /** Onboarding: creates a profile (the first one, or another one later) and switches to it. */
    createProfile: ({ relation, name, stage, goals, lastStart, birth, grade }) => setState((s) => {
      const p = newProfile({ relation, name: name?.trim() ?? '' });
      p.profile = { stage, goals, birth, grade: grade ? { value: grade, setOn: today } : null };
      p.settings.voice = relation === 'child' ? 'grown' : voiceForAge(ageFrom(birth, today), stage);
      if (lastStart) p.days = { [lastStart]: { flow: 'yes', estimated: true } };
      return { ...s, activeId: p.id, profiles: { ...s.profiles, [p.id]: p } };
    }),
    /** Pairing: adds a profile that another phone is sharing, then sync fills it in. */
    addSyncedProfile: ({ relation, sync, name = '' }) => setState((s) => {
      const p = newProfile({ relation, name: name.trim() });
      p.profile = { stage: 'few', goals: [], birth: null, grade: null };
      p.sync = sync;
      return { ...s, activeId: p.id, profiles: { ...s.profiles, [p.id]: p } };
    }),
    switchProfile: (id) => setState((s) => (s.profiles[id] ? { ...s, activeId: id } : s)),
    renameProfile: (name) => update(() => ({ name: name.trim() })),
    removeProfile: (id) => setState((s) => {
      const profiles = { ...s.profiles };
      delete profiles[id];
      const activeId = s.activeId === id ? Object.keys(profiles)[0] ?? null : s.activeId;
      return { ...s, profiles, activeId };
    }),
    setSync: (sync) => update(() => ({ sync })),

    setStage: (stage) => update((p) => ({ profile: { ...p.profile, stage } })),
    setGoals: (goals) => update((p) => ({ profile: { ...p.profile, goals } })),
    setBirth: (birth) => update((p) => ({ profile: { ...p.profile, birth } })),
    setGrade: (value) => update((p) => ({ profile: { ...p.profile, grade: value ? { value, setOn: today } : null } })),
    setDay,

    /** One tap: "My period started." */
    startPeriod: (date = today, flow = null) => update((p) => ({
      openPeriod: date,
      days: { ...p.days, [date]: { ...p.days[date], flow: flow ?? (PERIOD_FLOWS.has(p.days[date]?.flow) ? p.days[date].flow : 'yes') } },
      profile: p.profile?.stage === 'notYet' ? { ...p.profile, stage: 'new' } : p.profile,
    })),

    /** One tap: "My period ended." Fills any days she didn't log so the history is complete. */
    endPeriod: (lastDay = today) => update((p) => {
      const days = { ...p.days };
      const start = p.openPeriod ?? lastDay;
      for (let d = start; d <= lastDay; d = addDays(d, 1)) {
        if (!PERIOD_FLOWS.has(days[d]?.flow)) days[d] = { ...days[d], flow: 'yes' };
      }
      return { days, openPeriod: null };
    }),
    cancelOpenPeriod: () => update(() => ({ openPeriod: null })),

    /** Log a whole past period at once from the calendar. */
    logRange: (start, end) => update((p) => {
      const days = { ...p.days };
      for (let d = start; d <= end; d = addDays(d, 1)) {
        if (!PERIOD_FLOWS.has(days[d]?.flow)) days[d] = { ...days[d], flow: 'yes' };
      }
      return { days };
    }),

    addPlan: (plan) => update((p) => ({ plans: [...p.plans, { ...plan, id: crypto.randomUUID() }].sort((a, b) => a.start.localeCompare(b.start)) })),
    removePlan: (id) => update((p) => ({ plans: p.plans.filter((x) => x.id !== id) })),
    setCalendarWindow: (calendarWindow) => update(() => ({ calendarWindow })),
    saveSettings: (patch) => update((p) => ({ settings: { ...p.settings, ...patch } })),
    setPouch: (pouch) => update(() => ({ pouch })),
    importDays: (incoming) => update((p) => ({ days: { ...p.days, ...incoming } })),

    // Device-wide
    setLock: (lock) => setState((s) => ({ ...s, lock })),
    eraseEverything: async () => {
      await eraseState();
      setState(EMPTY_STATE);
    },
  };

  const active = state?.profiles[state.activeId] ?? null;
  const analysis = useMemo(
    () => active && analyze(active.days, { openPeriod: active.openPeriod }, today),
    [active, today],
  );

  if (!state) return null;
  const age = active?.profile ? ageFrom(active.profile.birth, today) : null;
  const grade = active?.profile ? currentGrade(active.profile.grade, today) : null;
  const profiles = Object.values(state.profiles);

  const value = {
    // The active profile's data, exposed exactly as pages expect it
    profile: active?.profile ?? null,
    days: active?.days ?? {},
    openPeriod: active?.openPeriod ?? null,
    settings: active?.settings ?? newProfile().settings,
    pouch: active?.pouch ?? null,
    plans: active?.plans ?? [],
    calendarWindow: active?.calendarWindow ?? null,
    sync: active?.sync ?? null,
    person: personFor(active),
    hidden: privateCategories(active), // on a parent's phone: what she keeps private
    activeId: state.activeId,
    profiles,
    lock: state.lock,
    today, analysis, saveError, age, grade, place: placeFor(grade), syncStatus: syncStatus[state.activeId] ?? null,
    ...actions,
  };
  return <Store.Provider value={value}>{children}</Store.Provider>;
}
