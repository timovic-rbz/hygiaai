"use client";
import { useEffect, useMemo, useState } from "react";
import { fetchEmployeesSafe, apiFetch, fetchAssignmentsSafe, fetchCustomersSafe } from "@/lib/api";
import { Coffee, Clock, Settings, X } from "lucide-react";

type Employee = { 
	id: string; 
	name: string; 
	is_active?: boolean; 
	phone?: string; 
	email?: string;
	break_duration_minutes?: number;
	daily_break_count?: number;
};

export default function EmployeesPage() {
	const [employees, setEmployees] = useState<Employee[]>([]);
	const [form, setForm] = useState<{ name: string; email?: string; phone?: string; break_duration_minutes: number; daily_break_count: number }>({ 
		name: "", 
		break_duration_minutes: 30,
		daily_break_count: 1
	});
	const [loading, setLoading] = useState(false);
	const [assignments, setAssignments] = useState<any[]>([]);
	const [customers, setCustomers] = useState<any[]>([]);
	const [selectedEmployee, setSelectedEmployee] = useState<string>("");
	const [absenceDate, setAbsenceDate] = useState<string>(new Date().toISOString().slice(0, 10));
	const [absenceType, setAbsenceType] = useState<string>("sick");
	
	// Break settings modal
	const [showBreakSettings, setShowBreakSettings] = useState(false);
	const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
	const [breakForm, setBreakForm] = useState({ break_duration_minutes: 30, daily_break_count: 1 });

	useEffect(() => {
		(async () => {
			const [emps, asg, cs] = await Promise.all([fetchEmployeesSafe(), fetchAssignmentsSafe(), fetchCustomersSafe()]);
			setEmployees(emps);
			setAssignments(asg);
			setCustomers(cs);
		})();
	}, []);

	async function addEmployee(e: React.FormEvent) {
		e.preventDefault();
		if (!form.name.trim()) return;
		setLoading(true);
		try {
			let created: Employee | null = null;
			try {
				created = await apiFetch<Employee>("/employees", "POST", {
					name: form.name.trim(),
					email: form.email || undefined,
					phone: form.phone || undefined,
					is_active: true,
					break_duration_minutes: form.break_duration_minutes,
					daily_break_count: form.daily_break_count,
				});
			} catch {
				created = { 
					id: `tmp-${Date.now()}`, 
					name: form.name.trim(), 
					email: form.email, 
					phone: form.phone, 
					is_active: true,
					break_duration_minutes: form.break_duration_minutes,
					daily_break_count: form.daily_break_count
				};
			}
			setEmployees(prev => [created!, ...prev]);
			setForm({ name: "", break_duration_minutes: 30, daily_break_count: 1 });
		} finally {
			setLoading(false);
		}
	}

	async function toggleActive(emp: Employee) {
		const next = !emp.is_active;
		setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, is_active: next } : e));
		try {
			await apiFetch(`/employees/${emp.id}`, "PUT", { is_active: next });
		} catch {
			// ignore in placeholder
		}
	}

	function openBreakSettings(emp: Employee) {
		setEditingEmployee(emp);
		setBreakForm({
			break_duration_minutes: emp.break_duration_minutes || 30,
			daily_break_count: emp.daily_break_count || 1
		});
		setShowBreakSettings(true);
	}

	async function saveBreakSettings() {
		if (!editingEmployee) return;
		setLoading(true);
		try {
			await apiFetch(`/employees/${editingEmployee.id}`, "PUT", {
				break_duration_minutes: breakForm.break_duration_minutes,
				daily_break_count: breakForm.daily_break_count
			});
			setEmployees(prev => prev.map(e => 
				e.id === editingEmployee.id 
					? { ...e, ...breakForm }
					: e
			));
			setShowBreakSettings(false);
			setEditingEmployee(null);
		} catch {
			alert("Fehler beim Speichern");
		} finally {
			setLoading(false);
		}
	}

	// attendance (stored locally)
	function saveAbsence() {
		if (!selectedEmployee) return;
		const key = `hygia.attendance.${selectedEmployee}`;
		const arr = JSON.parse(localStorage.getItem(key) || "[]");
		arr.push({ date: absenceDate, type: absenceType });
		localStorage.setItem(key, JSON.stringify(arr));
		alert("Gespeichert (lokal). Backend-Unterstützung kann ergänzt werden.");
	}

	const idToDuration = useMemo(() => {
		const m = new Map<string, number>();
		for (const c of customers) m.set(String(c.id), Number(c.duration_minutes || 0));
		return m;
	}, [customers]);

	function parseSpentMinutes(a: any): number | null {
		const notes = String(a.notes || "");
		const m = notes.match(/spent_minutes\s*=\s*(\d+)/i);
		return m ? Number(m[1] || 0) : null;
	}

	function sumFor(empId: string, daysBack: number): number {
		const end = new Date();
		const start = new Date();
		start.setDate(end.getDate() - daysBack);
		const startISO = start.toISOString().slice(0, 10);
		const endISO = end.toISOString().slice(0, 10);
		let total = 0;
		for (const a of assignments) {
			if (String(a.employee_id) !== empId) continue;
			const d = String(a.date);
			if (d < startISO || d > endISO) continue;
			const spent = parseSpentMinutes(a);
			if (spent != null) total += spent;
			else total += idToDuration.get(String(a.customer_id)) || 0;
		}
		return total;
	}
	function minutesToHours(mins: number): string {
		return (mins / 60).toFixed(1).replace(".", ",");
	}

	return (
		<div className="grid gap-6">
			<h1 className="text-2xl font-semibold">Mitarbeiter</h1>
			
			{/* Abwesenheit */}
			<div className="card p-4 grid gap-3">
				<p className="stat-label">Abwesenheit erfassen</p>
				<div className="grid gap-3 md:grid-cols-6">
					<select className="select md:col-span-2" value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)}>
						<option value="">Mitarbeiter wählen …</option>
						{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
					</select>
					<input className="input md:col-span-2" type="date" value={absenceDate} onChange={e => setAbsenceDate(e.target.value)} />
					<select className="select md:col-span-1" value={absenceType} onChange={e => setAbsenceType(e.target.value)}>
						<option value="sick">Krank</option>
						<option value="vacation">Urlaub</option>
					</select>
					<button className="btn btn-ghost md:col-span-1 h-10 self-end" onClick={saveAbsence}>Speichern</button>
				</div>
			</div>
			
			{/* Neuer Mitarbeiter */}
			<div className="card p-4">
				<p className="stat-label mb-3">Neuer Mitarbeiter</p>
				<form onSubmit={addEmployee} className="grid gap-3 md:grid-cols-6">
					<input className="input md:col-span-2" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
					<input className="input md:col-span-2" placeholder="E-Mail (optional)" value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} />
					<input className="input md:col-span-2" placeholder="Telefon (optional)" value={form.phone || ""} onChange={e => setForm({ ...form, phone: e.target.value })} />
					
					{/* Pausenzeit-Einstellungen im Formular */}
					<div className="md:col-span-2 flex items-center gap-2">
						<Coffee className="h-4 w-4 text-amber-400" />
						<input 
							type="number" 
							className="input w-20" 
							placeholder="30" 
							min="5" 
							max="120"
							value={form.break_duration_minutes} 
							onChange={e => setForm({ ...form, break_duration_minutes: Number(e.target.value) })} 
						/>
						<span className="text-sm text-white/50">Min. Pause</span>
					</div>
					<div className="md:col-span-2 flex items-center gap-2">
						<Clock className="h-4 w-4 text-white/40" />
						<input 
							type="number" 
							className="input w-16" 
							placeholder="1" 
							min="1" 
							max="5"
							value={form.daily_break_count} 
							onChange={e => setForm({ ...form, daily_break_count: Number(e.target.value) })} 
						/>
						<span className="text-sm text-white/50">Pausen/Tag</span>
					</div>
					
					<button className="btn btn-primary md:col-span-2 h-10 self-end" type="submit" disabled={loading}>
						{loading ? "Speichern..." : "Hinzufügen"}
					</button>
				</form>
			</div>
			
			{/* Mitarbeiter-Liste */}
			<div className="card p-4 overflow-x-auto">
				<table className="table">
					<thead>
						<tr>
							<th>Name</th>
							<th>Heute (min)</th>
							<th>7 Tage (Std)</th>
							<th>30 Tage (Std)</th>
							<th>Pause</th>
							<th>Status</th>
							<th>Aktionen</th>
						</tr>
					</thead>
					<tbody>
						{employees.map(e => (
							<tr key={e.id}>
								<td>
									<div className="font-medium">{e.name}</div>
									{e.email && <div className="text-xs text-white/50">{e.email}</div>}
								</td>
								<td>{sumFor(e.id, 0)}</td>
								<td>{minutesToHours(sumFor(e.id, 6))}</td>
								<td>{minutesToHours(sumFor(e.id, 29))}</td>
								<td>
									<button 
										onClick={() => openBreakSettings(e)}
										className="flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300 transition-colors"
									>
										<Coffee className="h-4 w-4" />
										{e.break_duration_minutes || 30}m × {e.daily_break_count || 1}
									</button>
								</td>
								<td>
									<span className={`badge ${e.is_active ? "text-turquoise-400 border-turquoise-400/30" : "text-white/60"}`}>
										{e.is_active ? "Aktiv" : "Inaktiv"}
									</span>
								</td>
								<td className="flex gap-2">
									<button onClick={() => toggleActive(e)} className="btn btn-outline btn-sm">
										{e.is_active ? "Deaktivieren" : "Aktivieren"}
									</button>
									<button 
										onClick={() => openBreakSettings(e)} 
										className="btn btn-ghost btn-sm"
										title="Pausenzeiten bearbeiten"
									>
										<Settings className="h-4 w-4" />
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Break Settings Modal */}
			{showBreakSettings && editingEmployee && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
					<div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
						<div className="flex items-center justify-between mb-6">
							<div>
								<h2 className="text-xl font-semibold text-white">Pausenzeiten</h2>
								<p className="text-sm text-white/50">{editingEmployee.name}</p>
							</div>
							<button 
								onClick={() => setShowBreakSettings(false)}
								className="text-white/40 hover:text-white transition-colors"
							>
								<X className="h-5 w-5" />
							</button>
						</div>
						
						<div className="space-y-4">
							<div>
								<label className="block text-sm text-white/70 mb-2">Pausendauer (Minuten)</label>
								<div className="flex items-center gap-3">
									<input 
										type="range" 
										min="5" 
										max="60" 
										step="5"
										value={breakForm.break_duration_minutes}
										onChange={e => setBreakForm({ ...breakForm, break_duration_minutes: Number(e.target.value) })}
										className="flex-1 accent-amber-500"
									/>
									<div className="flex items-center gap-2 rounded-lg bg-amber-500/20 px-3 py-2">
										<Coffee className="h-4 w-4 text-amber-400" />
										<span className="font-mono font-bold text-amber-400">{breakForm.break_duration_minutes}</span>
									</div>
								</div>
								<p className="mt-1 text-xs text-white/40">
									Standard: 30 Minuten
								</p>
							</div>
							
							<div>
								<label className="block text-sm text-white/70 mb-2">Anzahl Pausen pro Tag</label>
								<div className="flex gap-2">
									{[1, 2, 3].map(n => (
										<button
											key={n}
											onClick={() => setBreakForm({ ...breakForm, daily_break_count: n })}
											className={`flex-1 rounded-xl py-3 text-sm font-medium transition-all ${
												breakForm.daily_break_count === n
													? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
													: "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
											}`}
										>
											{n}× Pause
										</button>
									))}
								</div>
							</div>
							
							<div className="rounded-xl bg-white/5 p-4 mt-4">
								<p className="text-sm text-white/70">
									<strong className="text-white">Gesamte Pausenzeit:</strong>{" "}
									{breakForm.break_duration_minutes * breakForm.daily_break_count} Minuten pro Tag
								</p>
							</div>
						</div>
						
						<div className="flex gap-3 mt-6">
							<button 
								onClick={() => setShowBreakSettings(false)}
								className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10 transition-colors"
							>
								Abbrechen
							</button>
							<button 
								onClick={saveBreakSettings}
								disabled={loading}
								className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 text-sm font-medium text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all disabled:opacity-50"
							>
								{loading ? "Speichern..." : "Speichern"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
