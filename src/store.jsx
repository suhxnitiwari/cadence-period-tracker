import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { loadState, saveState, eraseState, requestPersistence, EMPTY_STATE } from './lib/storage.js';
import { analyze, isEmptyLog, PERIOD_FLOWS } from './lib/cycles.js';
import { addDays, todayISO } from './lib/dates.js';
import { ageFrom, voiceForAge, currentGrade, placeFor } from './lib/profile.js';

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

  const update = (fn) => setState((s) => ({ ...s, ...fn(s) }));

  const setDay = (date, log) => update((s) => {
    const days = { ...s.days };
    const { estimated, ...rest } = log ?? {}; // any edit makes a remembered date real data
    if (isEmptyLog(rest)) delete days[date];
    else days[date] = rest;
    return { days };
  });

  const actions = {
    finishOnboarding: ({ stage, goals, lastStart, birth, grade }) => update((s) => ({
      profile: { stage, goals, birth, grade: grade ? { value: grade, setOn: today } : null },
      settings: { ...s.settings, voice: voiceForAge(ageFrom(birth, today), stage) },
      days: lastStart ? { ...s.days, [lastStart]: { flow: 'yes', estimated: true } } : s.days,
    })),
    setStage: (stage) => update((s) => ({ profile: { ...s.profile, stage } })),
    setGoals: (goals) => update((s) => ({ profile: { ...s.profile, goals } })),
    setBirth: (birth) => update((s) => ({ profile: { ...s.profile, birth } })),
    setGrade: (value) => update((s) => ({ profile: { ...s.profile, grade: value ? { value, setOn: today } : null } })),
    setDay,

    /** One tap: "My period started." */
    startPeriod: (date = today, flow = null) => update((s) => ({
      openPeriod: date,
      days: { ...s.days, [date]: { ...s.days[date], flow: flow ?? (PERIOD_FLOWS.has(s.days[date]?.flow) ? s.days[date].flow : 'yes') } },
      profile: s.profile?.stage === 'notYet' ? { ...s.profile, stage: 'new' } : s.profile,
    })),

    /** One tap: "My period ended." Fills any days she didn't log so the history is complete. */
    endPeriod: (lastDay = today) => update((s) => {
      const days = { ...s.days };
      const start = s.openPeriod ?? lastDay;
      for (let d = start; d <= lastDay; d = addDays(d, 1)) {
        if (!PERIOD_FLOWS.has(days[d]?.flow)) days[d] = { ...days[d], flow: 'yes' };
      }
      return { days, openPeriod: null };
    }),
    cancelOpenPeriod: () => update(() => ({ openPeriod: null })),

    /** Log a whole past period at once from the calendar. */
    logRange: (start, end) => update((s) => {
      const days = { ...s.days };
      for (let d = start; d <= end; d = addDays(d, 1)) {
        if (!PERIOD_FLOWS.has(days[d]?.flow)) days[d] = { ...days[d], flow: 'yes' };
      }
      return { days };
    }),

    addPlan: (plan) => update((s) => ({ plans: [...s.plans, { ...plan, id: crypto.randomUUID() }].sort((a, b) => a.start.localeCompare(b.start)) })),
    removePlan: (id) => update((s) => ({ plans: s.plans.filter((p) => p.id !== id) })),
    setCalendarWindow: (calendarWindow) => update(() => ({ calendarWindow })),
    setLock: (lock) => update(() => ({ lock })),
    saveSettings: (patch) => update((s) => ({ settings: { ...s.settings, ...patch } })),
    setPouch: (pouch) => update(() => ({ pouch })),
    importDays: (incoming) => update((s) => ({ days: { ...s.days, ...incoming } })),
    eraseEverything: async () => {
      await eraseState();
      setState(EMPTY_STATE);
    },
  };

  const analysis = useMemo(
    () => state && analyze(state.days, { openPeriod: state.openPeriod }, today),
    [state, today],
  );

  const age = state?.profile ? ageFrom(state.profile.birth, today) : null;
  const grade = state?.profile ? currentGrade(state.profile.grade, today) : null;

  if (!state) return null;
  return <Store.Provider value={{ ...state, today, analysis, saveError, age, grade, place: placeFor(grade), ...actions }}>{children}</Store.Provider>;
}
