/* eslint-disable @next/next/no-img-element */
"use client";
import { useEffect, useMemo, useState } from "react";
import { fetchAssignmentsSafe, fetchCustomersSafe } from "@/lib/api";
import ServiceTag from "@/components/ServiceTag";

type Assignment = {
  id: string;
  date: string;
  customer_id: string;
  employee_id?: string;
  service_type?: string;
  start_time?: string | null;
};

export default function WeekPlannerPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [weekStart, setWeekStart] = useState<string>(() => {
    const d = new Date();
    const day = d.getDay(); // 0 So, 1 Mo, ...
    const diff = (day + 6) % 7; // Montag als Start
    d.setDate(d.getDate() - diff);
    return d.toISOString().slice(0, 10);
  });

  useEffect(() => {
    (async () => {
      const [as, cs] = await Promise.all([fetchAssignmentsSafe(), fetchCustomersSafe()]);
      setAssignments(as as any);
      setCustomers(cs as any);
    })();
  }, []);

  function shiftWeek(delta: number) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7 * delta);
    setWeekStart(d.toISOString().slice(0, 10));
  }

  const days = useMemo(() => {
    const base = new Date(weekStart);
    const arr: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      arr.push(d.toISOString().slice(0, 10));
    }
    return arr;
  }, [weekStart]);

  const idToCustomer = useMemo(() => {
    const m = new Map<string, any>();
    for (const c of customers) m.set(String(c.id), c);
    return m;
  }, [customers]);

  const byDay = useMemo(() => {
    const map = new Map<string, Assignment[]>();
    for (const d of days) map.set(d, []);
    for (const a of assignments) {
      const k = String(a.date);
      if (map.has(k)) map.get(k)!.push(a);
    }
    return map;
  }, [assignments, days]);

  const fmt = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" });
  };

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Wochenplaner</h1>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={() => shiftWeek(-1)}>Vorige Woche</button>
          <button className="btn btn-ghost" onClick={() => setWeekStart(() => {
            const d = new Date();
            const day = d.getDay();
            const diff = (day + 6) % 7;
            d.setDate(d.getDate() - diff);
            return d.toISOString().slice(0, 10);
          })}>Diese Woche</button>
          <button className="btn btn-ghost" onClick={() => shiftWeek(1)}>Nächste Woche</button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {days.map((d) => (
          <div key={d} className="card p-4">
            <div className="flex items-center justify-between">
              <div className="text-lg font-medium">{fmt(d)}</div>
              <div className="text-white/60 text-sm">{(byDay.get(d) || []).length} Einsätze</div>
            </div>
            <ul className="mt-4 grid gap-3">
              {(byDay.get(d) || []).map((a) => {
                const c = idToCustomer.get(String(a.customer_id));
                return (
                  <li key={a.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                    <div>
                      <div className="font-medium">{c?.name || a.customer_id}</div>
                      <div className="text-white/60 text-sm">{c?.city || "—"}</div>
                      <div className="text-white/60 text-sm flex gap-1 flex-wrap mt-1">
                        {a.service_type ? <ServiceTag label={a.service_type} /> : "—"}
                      </div>
                    </div>
                    <div className="text-white/60 text-sm">
                      {a.start_time ? a.start_time.slice(0, 5) : ""}
                    </div>
                  </li>
                );
              })}
              {(byDay.get(d) || []).length === 0 && (
                <li className="text-white/60 text-sm">Keine Einsätze.</li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}



