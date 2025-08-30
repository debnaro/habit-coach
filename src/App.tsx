import { useEffect, useMemo, useState } from "react";
import "./App.css";

type Habit = { id: string; name: string; type: "do" | "dont" };

const STORAGE_KEY = "habitCoachDataV1";
const todayKey = () => new Date().toISOString().slice(0, 10);

const defaultHabits: Habit[] = [
  { id: "do_teeth", name: "Umývať si zuby (2×)", type: "do" },
  { id: "do_exercise", name: "Cvičenie", type: "do" },
  { id: "do_meditation", name: "Meditácia", type: "do" },
  { id: "do_trading_window", name: "Trading iba v určený čas", type: "do" },
  { id: "do_time_self", name: "Čas pre seba", type: "do" },
  { id: "do_time_wife", name: "Čas so ženou", type: "do" },
  { id: "do_time_son", name: "Čas so synom", type: "do" },
  { id: "dont_overeat", name: "Neprejedám sa", type: "dont" },
  { id: "dont_junk", name: "Nejem nezdravé veci", type: "dont" },
  { id: "dont_cola", name: "Nepijem kolu", type: "dont" },
  { id: "dont_alcohol", name: "Nepijem alkohol", type: "dont" },
  { id: "dont_porn", name: "Nepozerám porno", type: "dont" },
  { id: "dont_other_women", name: "Nemyslím na iné ženy", type: "dont" },
  { id: "dont_social", name: "Neskrolujem sociálne siete", type: "dont" },
];

const defaultIfThen: Record<string, string> = {
  dont_overeat: "Ak cítim chuť sa prejedať → pohár vody a 3 nádychy.",
  dont_junk: "Ak lákajú nezdravosti → dám si jablko alebo proteín.",
  dont_cola: "Ak chcem kolu → perlivá voda s citrónom.",
  dont_alcohol: "Ak príde chuť na alkohol → bylinkový čaj a krátka prechádzka.",
  dont_porn: "Ak príde chuť na porno → 20 drepov a idem do inej miestnosti.",
  dont_other_women: "Ak prídu myšlienky → 'Moja žena je dar'.",
  dont_social: "Ak chcem scrollovať → 3 vety do denníka.",
};

function addDays(date: Date, delta: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + delta);
  return d;
}
function getLastNDates(n: number) {
  const base = new Date();
  return Array.from({ length: n }, (_, i) => addDays(base, -(n - 1 - i)));
}
function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

export default function App() {
  const [habits, setHabits] = useState<Habit[]>(defaultHabits);
  const [logs, setLogs] = useState<Record<string, Record<string, boolean>>>({});
  const [ifThen, setIfThen] = useState(defaultIfThen);
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [hydrated, setHydrated] = useState(false);

  // form na pridanie
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"do" | "dont">("do");
  const dayLog = logs[selectedDate] || {};

  // load
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.habits) setHabits(data.habits);
        if (data.logs) setLogs(data.logs);
        if (data.ifThen) setIfThen({ ...defaultIfThen, ...data.ifThen });
      }
    } catch {}
    setHydrated(true);
  }, []);

  // save
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ habits, logs, ifThen }));
  }, [habits, logs, ifThen, hydrated]);

  const doHabits = useMemo(() => habits.filter((h) => h.type === "do"), [habits]);
  const dontHabits = useMemo(() => habits.filter((h) => h.type === "dont"), [habits]);

  const percentComplete = useMemo(() => {
    const all = habits.length || 1;
    const done = habits.reduce((acc, h) => acc + (dayLog[h.id] ? 1 : 0), 0);
    return Math.round((done / all) * 100);
  }, [dayLog, habits]);

  function toggleHabit(id: string) {
    setLogs((prev) => {
      const day = { ...(prev[selectedDate] || {}) };
      day[id] = !day[id];
      return { ...prev, [selectedDate]: day };
    });
  }

  function addHabit() {
    const trimmed = newName.trim();
    if (!trimmed) return;

    // vytvor jedinečné id
    const base = (newType === "do" ? "do_" : "dont_") + slugify(trimmed);
    let id = base || (newType === "do" ? "do_custom" : "dont_custom");
    let i = 1;
    const ids = new Set(habits.map((h) => h.id));
    while (ids.has(id)) {
      id = `${base}_${i++}`;
    }

    const newHabit: Habit = { id, name: trimmed, type: newType };
    setHabits((prev) => [...prev, newHabit]);
    setNewName("");
  }

  function deleteHabit(habitId: string) {
    // zmaž zo zoznamu návykov
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
    // a vyčisti logy pre všetky dni
    setLogs((prev) => {
      const next: typeof prev = {};
      for (const [dateKey, day] of Object.entries(prev)) {
        const copy = { ...day };
        delete copy[habitId];
        next[dateKey] = copy;
      }
      return next;
    });
  }

  const weekDates = getLastNDates(7);

  return (
    <div className="wrap">
      <header className="topbar">
        <div className="brand">Habit Coach</div>
        <div className="controls">
          <label>Dátum:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <button onClick={() => setSelectedDate(todayKey())}>Dnes</button>
        </div>
      </header>

      {/* PRIDÁVANIE NOVÝCH NÁVYKOV */}
      <section className="card adder">
        <h3>Pridať nový habit</h3>
        <div className="adderRow">
          <input
            className="textInput"
            placeholder="Názov (napr. 10 min chôdza)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addHabit();
            }}
          />
          <div className="typeToggle">
            <label>
              <input
                type="radio"
                name="habitType"
                value="do"
                checked={newType === "do"}
                onChange={() => setNewType("do")}
              />
              <span>CHCEM</span>
            </label>
            <label>
              <input
                type="radio"
                name="habitType"
                value="dont"
                checked={newType === "dont"}
                onChange={() => setNewType("dont")}
              />
              <span>NECHCEM</span>
            </label>
          </div>
          <button className="primaryBtn" onClick={addHabit}>Pridať</button>
        </div>
        <div className="adderHint">Tip: stlač Enter pre rýchle pridanie</div>
      </section>

      <section className="progress">
        <div className="bar">
          <div className="barFill" style={{ width: `${percentComplete}%` }} />
        </div>
        <div className="barText">Dnešný progres: {percentComplete}%</div>
      </section>

      <main className="grid">
        <section className="card green">
          <h2>CHCEM</h2>
          {doHabits.map((h) => (
            <label key={h.id} className="row">
              <input
                type="checkbox"
                checked={!!dayLog[h.id]}
                onChange={() => toggleHabit(h.id)}
              />
              <div className="rowText">
                <div className="title">{h.name}</div>
                <div className="hint">Zaškrtni, keď si vykonal</div>
              </div>
              <button className="xBtn" onClick={() => deleteHabit(h.id)} aria-label="Odstrániť">
                ×
              </button>
            </label>
          ))}
        </section>

        <section className="card red">
          <h2>NECHCEM</h2>
          {dontHabits.map((h) => (
            <div key={h.id} className="stack">
              <label className="row">
                <input
                  type="checkbox"
                  checked={!!dayLog[h.id]}
                  onChange={() => toggleHabit(h.id)}
                />
                <div className="rowText">
                  <div className="title">{h.name}</div>
                  <div className="hint">Zaškrtni, keď si odolal</div>
                </div>
                <button className="xBtn" onClick={() => deleteHabit(h.id)} aria-label="Odstrániť">
                  ×
                </button>
              </label>
              {ifThen[h.id] && <div className="ifthen">{ifThen[h.id]}</div>}
            </div>
          ))}
        </section>
      </main>

      <section className="card weekly">
        <h3>Tento týždeň</h3>
        <div className="weekGrid">
          {weekDates.map((d) => {
            const key = d.toISOString().slice(0, 10);
            const dl = logs[key] || {};
            const total = habits.length || 1;
            const done = habits.reduce((acc, h) => acc + (dl[h.id] ? 1 : 0), 0);
            const pct = Math.round((done / total) * 100);
            return (
              <div key={key} className="dayCard">
                <div className="dayPct">{pct}%</div>
                <div className="miniBar">
                  <div className="miniFill" style={{ width: `${pct}%` }} />
                </div>
                <div className="dayDate">
                  {d.toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="foot">
        <div>🟢 PWA pripravené — pridať na plochu v Androide.</div>
      </footer>
    </div>
  );
}