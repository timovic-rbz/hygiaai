"use client";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

type Assignment = {
  id: string;
  date: string;
  customer_id: string;
  employee_id?: string;
  service_type?: string;
  start_time?: string | null;
  status?: string | null;
  notes?: string | null;
};

type Props = {
  assignments: Assignment[];
  idToNameEntries: [string, string][];
};

function getTimerKey(id: string) {
  return `hygia.timer.${id}`;
}

function parseSpentMinutes(notes?: string | null): number | null {
  if (!notes) return null;
  const m = notes.match(/spent_minutes\s*=\s*(\d+)/i);
  return m ? Number(m[1] || 0) : null;
}

export default function TodayPlan({ assignments: initial, idToNameEntries }: Props) {
  const [items, setItems] = useState<Assignment[]>(initial);
  const idToName = useMemo(() => new Map<string, string>(idToNameEntries), [idToNameEntries]);
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  function isRunning(id: string) {
    return !!localStorage.getItem(getTimerKey(id));
  }
  function getElapsedMinutes(id: string) {
    const start = localStorage.getItem(getTimerKey(id));
    if (!start) return 0;
    const ms = now - Number(start);
    return Math.max(0, Math.round(ms / 60000));
  }

  function startTimer(id: string) {
    if (isRunning(id)) return;
    localStorage.setItem(getTimerKey(id), String(Date.now()));
  }
  async function stopTimer(id: string) {
    const start = localStorage.getItem(getTimerKey(id));
    if (!start) return;
    const minutes = Math.max(1, Math.round((Date.now() - Number(start)) / 60000));
    localStorage.removeItem(getTimerKey(id));
    await saveSpentMinutes(id, minutes);
  }
  async function markDoneWithPrompt(id: string) {
    const input = window.prompt("Wie viele Minuten wart ihr vor Ort?", "60");
    if (!input) return;
    const minutes = Math.max(0, Number(input));
    await saveSpentMinutes(id, minutes);
  }

  async function saveSpentMinutes(id: string, minutes: number) {
    // Update backend: set status=done and append spent_minutes tag to notes
    const item = items.find(i => i.id === id);
    const baseNotes = (item?.notes || "").trim();
    const withoutOld = baseNotes.replace(/(?:^|\s)\[spent_minutes=.*?\]/i, "").trim();
    const notes = `${withoutOld} [spent_minutes=${minutes}]`.trim();
    try {
      await apiFetch(`/assignments/${id}`, "PUT", { status: "done", notes });
    } catch {
      // ignore network errors in demo
    }
    setItems(prev => prev.map(a => a.id === id ? { ...a, status: "done", notes } : a));
  }

  return (
    <ul className="mt-4 grid gap-3">
      {items.map((a) => {
        const name = idToName.get(a.customer_id) || a.customer_id;
        const minutesSaved = parseSpentMinutes(a.notes);
        const running = isRunning(a.id);
        const elapsed = getElapsedMinutes(a.id);
        return (
          <li key={a.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
            <div>
              <div className="font-medium">{name}</div>
              <div className="text-white/60 text-sm">{a.service_type || "—"}</div>
              {minutesSaved != null && (
                <div className="text-white/60 text-xs mt-1">Erfasste Zeit: {minutesSaved} min</div>
              )}
              {running && (
                <div className="text-turquoise-400 text-xs mt-1">Timer läuft: {elapsed} min</div>
              )}
            </div>
            <div className="flex gap-2">
              {!running && <button className="btn btn-outline btn-sm" onClick={() => startTimer(a.id)}>Start</button>}
              {running && <button className="btn btn-ghost btn-sm" onClick={() => stopTimer(a.id)}>Stopp & Speichern</button>}
              <button className="btn btn-primary btn-sm" onClick={() => markDoneWithPrompt(a.id)}>{a.status === "done" ? "Zeit ändern" : "Abhaken"}</button>
            </div>
          </li>
        );
      })}
      {items.length === 0 && (
        <li className="text-white/60 text-sm">Keine Einsätze geplant.</li>
      )}
    </ul>
  );
}


