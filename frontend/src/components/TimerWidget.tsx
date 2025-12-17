"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { 
  Clock, Play, Square, User, X, Car, Coffee, 
  ChevronDown, MapPin, AlertCircle, Check 
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type TimerMode = "idle" | "work" | "travel" | "break";

type Assignment = {
  id: string;
  date: string;
  start_time: string | null;
  customer_id: string;
  service_type: string | null;
};

type Customer = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  duration_minutes: number | null;
};

type TimeEntry = {
  id: string;
  entry_type: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
};

type TodayAssignment = {
  assignment: Assignment;
  customer: Customer;
};

export default function TimerWidget() {
  // State
  const [now, setNow] = useState<Date | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [timerMode, setTimerMode] = useState<TimerMode>("idle");
  const [timerStart, setTimerStart] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  // Break timer (countdown)
  const [breakDuration, setBreakDuration] = useState(30); // minutes
  const [breakRemaining, setBreakRemaining] = useState(0); // seconds
  
  // Employee & Assignment
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [todayAssignments, setTodayAssignments] = useState<TodayAssignment[]>([]);
  const [currentAssignment, setCurrentAssignment] = useState<TodayAssignment | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  
  // UI
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load employees on mount
  useEffect(() => {
    setNow(new Date());
    fetch(`${API_BASE}/employees`)
      .then(r => r.json())
      .then(data => {
        const active = data.filter((e: any) => e.is_active);
        setEmployees(active);
        // Auto-select first employee for demo
        if (active.length > 0 && !selectedEmployeeId) {
          setSelectedEmployeeId(active[0].id);
        }
      })
      .catch(() => {});
  }, []);

  // Load today's assignments when employee changes
  useEffect(() => {
    if (!selectedEmployeeId) return;
    
    // Load today's assignments
    fetch(`${API_BASE}/timer/today/${selectedEmployeeId}`)
      .then(r => r.json())
      .then(data => {
        setTodayAssignments(data || []);
      })
      .catch(() => setTodayAssignments([]));
    
    // Load current/next assignment
    fetch(`${API_BASE}/timer/current/${selectedEmployeeId}`)
      .then(r => r.json())
      .then(data => {
        if (data.assignment && data.customer) {
          setCurrentAssignment({ assignment: data.assignment, customer: data.customer });
          setSelectedCustomerId(data.customer.id);
        } else {
          setCurrentAssignment(null);
        }
      })
      .catch(() => setCurrentAssignment(null));
    
    // Check for active timer
    fetch(`${API_BASE}/timer/active/${selectedEmployeeId}`)
      .then(r => r.json())
      .then(data => {
        if (data.active_entry) {
          setActiveEntry(data.active_entry);
          setTimerMode(data.active_entry.entry_type as TimerMode);
          setTimerStart(new Date(data.active_entry.started_at).getTime());
        }
      })
      .catch(() => {});
    
    // Load break settings
    fetch(`${API_BASE}/timer/break-settings/${selectedEmployeeId}`)
      .then(r => r.json())
      .then(data => {
        setBreakDuration(data.break_duration_minutes || 30);
      })
      .catch(() => {});
      
  }, [selectedEmployeeId]);

  // Timer tick
  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
      
      if (timerStart && timerMode !== "break") {
        setElapsedSeconds(Math.max(0, Math.round((Date.now() - timerStart) / 1000)));
      }
      
      if (timerMode === "break" && breakRemaining > 0) {
        setBreakRemaining(prev => Math.max(0, prev - 1));
      }
    }, 1000);
    
    return () => clearInterval(id);
  }, [timerStart, timerMode, breakRemaining]);

  // Formatted time
  const formattedNow = useMemo(() => {
    if (!now) return "";
    return now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  }, [now]);

  const formatDuration = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const pad = (v: number) => String(v).padStart(2, "0");
    if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
    return `${pad(minutes)}:${pad(secs)}`;
  }, []);

  // Get current customer info
  const currentCustomer = useMemo(() => {
    if (selectedCustomerId) {
      const found = todayAssignments.find(a => a.customer.id === selectedCustomerId);
      return found?.customer || null;
    }
    return currentAssignment?.customer || null;
  }, [selectedCustomerId, todayAssignments, currentAssignment]);

  const currentAssignmentData = useMemo(() => {
    if (selectedCustomerId) {
      const found = todayAssignments.find(a => a.customer.id === selectedCustomerId);
      return found?.assignment || null;
    }
    return currentAssignment?.assignment || null;
  }, [selectedCustomerId, todayAssignments, currentAssignment]);

  // Actions
  async function startTimer(mode: "work" | "travel") {
    if (!selectedEmployeeId || !currentCustomer || !currentAssignmentData) {
      alert("Bitte wähle zuerst einen Kunden aus.");
      return;
    }
    
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        employee_id: selectedEmployeeId,
        customer_id: currentCustomer.id,
        assignment_id: currentAssignmentData.id,
        entry_type: mode
      });
      
      const res = await fetch(`${API_BASE}/timer/start?${params}`, { method: "POST" });
      const data = await res.json();
      
      if (data.success && data.entry) {
        setActiveEntry(data.entry);
        setTimerMode(mode);
        setTimerStart(Date.now());
        setElapsedSeconds(0);
        setIsExpanded(false);
      } else {
        alert(data.detail || "Fehler beim Starten");
      }
    } catch (e) {
      // Fallback: local timer
      setTimerMode(mode);
      setTimerStart(Date.now());
      setElapsedSeconds(0);
      setIsExpanded(false);
    } finally {
      setIsLoading(false);
    }
  }

  async function stopTimer() {
    setIsLoading(true);
    try {
      if (activeEntry) {
        await fetch(`${API_BASE}/timer/stop/${activeEntry.id}`, { method: "POST" });
      }
      
      const mins = Math.round(elapsedSeconds / 60);
      const customerName = currentCustomer?.name || "Kunde";
      
      if (timerMode === "work" && mins > 0) {
        alert(`✅ Einsatz beendet!\n\nKunde: ${customerName}\nArbeitszeit: ${formatDuration(elapsedSeconds)} (${mins} Min.)`);
      } else if (timerMode === "travel" && mins > 0) {
        alert(`🚗 Fahrt beendet!\n\nZum Kunden: ${customerName}\nFahrtzeit: ${formatDuration(elapsedSeconds)} (${mins} Min.)`);
      }
    } catch (e) {
      // Ignore
    } finally {
      setTimerMode("idle");
      setTimerStart(null);
      setElapsedSeconds(0);
      setActiveEntry(null);
      setIsLoading(false);
    }
  }

  function startBreak() {
    setTimerMode("break");
    setBreakRemaining(breakDuration * 60);
    setIsExpanded(false);
  }

  function endBreak() {
    setTimerMode("idle");
    setBreakRemaining(0);
  }

  if (!now) return null;

  const isRunning = timerMode !== "idle";
  const breakProgress = breakDuration > 0 ? ((breakDuration * 60 - breakRemaining) / (breakDuration * 60)) * 100 : 0;

  return (
    <div className="fixed bottom-5 left-5 z-40">
      {/* Expanded Panel */}
      {isExpanded && !isRunning && (
        <div className="absolute bottom-full left-0 mb-3 w-80 rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl backdrop-blur-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h3 className="text-sm font-medium text-white">Zeiterfassung</h3>
            <button onClick={() => setIsExpanded(false)} className="text-white/40 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          
          {/* Employee Select */}
          <div className="border-b border-white/5 px-4 py-3">
            <label className="text-xs text-white/40 uppercase tracking-wider">Mitarbeiter</label>
            <select 
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-brand/50 focus:outline-none"
            >
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
          
          {/* Current/Selected Customer */}
          <div className="border-b border-white/5 px-4 py-3">
            <div className="flex items-center justify-between">
              <label className="text-xs text-white/40 uppercase tracking-wider">Aktueller Kunde</label>
              <button 
                onClick={() => setShowCustomerSelect(!showCustomerSelect)}
                className="text-xs text-brand hover:text-brand-400"
              >
                {showCustomerSelect ? "Schließen" : "Ändern"}
              </button>
            </div>
            
            {currentCustomer ? (
              <div className="mt-2 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/20">
                  <User className="h-5 w-5 text-brand" />
                </div>
                <div>
                  <p className="font-medium text-white">{currentCustomer.name}</p>
                  <p className="text-xs text-white/50 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {currentCustomer.city || "—"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-2 flex items-center gap-2 text-amber-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Kein Einsatz geplant</span>
              </div>
            )}
            
            {/* Customer Select Dropdown */}
            {showCustomerSelect && todayAssignments.length > 0 && (
              <div className="mt-3 max-h-40 overflow-y-auto space-y-1">
                {todayAssignments.map(({ assignment, customer }) => (
                  <button
                    key={assignment.id}
                    onClick={() => {
                      setSelectedCustomerId(customer.id);
                      setShowCustomerSelect(false);
                    }}
                    className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      selectedCustomerId === customer.id 
                        ? "bg-brand/20 text-white" 
                        : "bg-white/5 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-xs text-white/50">
                        {assignment.start_time ? assignment.start_time.slice(0, 5) : "—"} · {customer.city}
                      </p>
                    </div>
                    {selectedCustomerId === customer.id && (
                      <Check className="h-4 w-4 text-brand" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="p-4 space-y-2">
            <button
              onClick={() => startTimer("work")}
              disabled={!currentCustomer || isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-blue-500 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-brand/25 transition-all hover:shadow-brand/40 disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              Arbeitszeit starten
            </button>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => startTimer("travel")}
                disabled={!currentCustomer || isLoading}
                className="flex items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/20 disabled:opacity-50"
              >
                <Car className="h-4 w-4" />
                Fahrt
              </button>
              
              <button
                onClick={startBreak}
                className="flex items-center justify-center gap-2 rounded-xl bg-amber-500/20 px-3 py-2.5 text-sm font-medium text-amber-300 transition-colors hover:bg-amber-500/30"
              >
                <Coffee className="h-4 w-4" />
                Pause ({breakDuration}m)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Widget */}
      <div className={`flex items-center gap-2 rounded-2xl border backdrop-blur-xl transition-all ${
        timerMode === "work" 
          ? "border-brand/30 bg-brand/10 shadow-lg shadow-brand/20" 
          : timerMode === "travel"
          ? "border-blue-500/30 bg-blue-500/10 shadow-lg shadow-blue-500/20"
          : timerMode === "break"
          ? "border-amber-500/30 bg-amber-500/10 shadow-lg shadow-amber-500/20"
          : "border-white/10 bg-slate-900/90"
      }`}>
        {/* Timer Display */}
        <button
          onClick={() => !isRunning && setIsExpanded(!isExpanded)}
          className={`flex items-center gap-3 px-4 py-3 transition-colors ${!isRunning ? "hover:bg-white/5 rounded-l-2xl" : ""}`}
        >
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
            timerMode === "work" ? "bg-brand/20" :
            timerMode === "travel" ? "bg-blue-500/20" :
            timerMode === "break" ? "bg-amber-500/20" :
            "bg-white/10"
          }`}>
            {timerMode === "work" && <Play className="h-5 w-5 text-brand" />}
            {timerMode === "travel" && <Car className="h-5 w-5 text-blue-400" />}
            {timerMode === "break" && <Coffee className="h-5 w-5 text-amber-400" />}
            {timerMode === "idle" && <Clock className="h-5 w-5 text-white/60" />}
          </div>
          
          <div className="text-left">
            <div className="text-xs text-white/50">{formattedNow}</div>
            <div className={`text-lg font-mono font-bold ${
              timerMode === "work" ? "text-brand" :
              timerMode === "travel" ? "text-blue-400" :
              timerMode === "break" ? "text-amber-400" :
              "text-white"
            }`}>
              {timerMode === "break" ? formatDuration(breakRemaining) : formatDuration(elapsedSeconds)}
            </div>
          </div>
        </button>

        {/* Customer/Mode Info */}
        {isRunning && (
          <div className="border-l border-white/10 px-3 py-2 max-w-[140px]">
            <span className="text-xs text-white/50">
              {timerMode === "work" ? "Bei Kunde" : timerMode === "travel" ? "Fahrt zu" : "Pause"}
            </span>
            {timerMode !== "break" && currentCustomer && (
              <p className="text-sm font-medium text-white truncate">{currentCustomer.name}</p>
            )}
            {timerMode === "break" && (
              <div className="mt-1 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div 
                  className="h-full bg-amber-400 transition-all duration-1000" 
                  style={{ width: `${breakProgress}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Stop Button */}
        {isRunning && (
          <div className="pr-3">
            <button
              onClick={timerMode === "break" ? endBreak : stopTimer}
              disabled={isLoading}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                timerMode === "break"
                  ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
                  : "bg-rose-500/20 text-rose-300 hover:bg-rose-500/30"
              }`}
            >
              <Square className="h-3.5 w-3.5" />
              {timerMode === "break" ? "Beenden" : "Stopp"}
            </button>
          </div>
        )}

        {/* Expand Button when idle */}
        {!isRunning && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="pr-3"
          >
            <ChevronDown className={`h-5 w-5 text-white/40 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>
    </div>
  );
}
