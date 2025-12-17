import { fetchCustomersSafe, fetchAssignmentsSafe, fetchEmployeesSafe } from "@/lib/api";
import { Calendar, Users, Clock, TrendingUp, MapPin, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default async function Page() {
	const [customers, assignments, employees] = await Promise.all([
		fetchCustomersSafe(),
		fetchAssignmentsSafe(),
		fetchEmployeesSafe()
	]);
	
	const today = new Date().toISOString().slice(0, 10);
	const todaysAssignments = assignments.filter((a: any) => String(a.date) === today);
	const activeCustomers = customers.filter((c: any) => c.is_active !== false);
	const activeEmployees = employees.filter((e: any) => e.is_active !== false);
	const idToName = new Map<string, string>((customers as any[]).map((c: any) => [c.id, c.name]));
	const idToCity = new Map<string, string>((customers as any[]).map((c: any) => [c.id, c.city || ""]));
	
	const avgDuration = Math.round(
		activeCustomers.reduce((sum: number, c: any) => sum + (Number(c.duration_minutes || 0)), 0) /
		(Math.max(1, activeCustomers.filter((c: any) => Number(c.duration_minutes || 0) > 0).length))
	);

	// Calculate weekly stats
	const weekStart = new Date();
	weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
	const weekStartISO = weekStart.toISOString().slice(0, 10);
	const weekEnd = new Date(weekStart);
	weekEnd.setDate(weekEnd.getDate() + 6);
	const weekEndISO = weekEnd.toISOString().slice(0, 10);
	
	const weekAssignments = assignments.filter((a: any) => {
		const d = String(a.date);
		return d >= weekStartISO && d <= weekEndISO;
	});

	const completionRate = weekAssignments.length > 0 
		? Math.round((weekAssignments.filter((a: any) => a.status === 'completed').length / weekAssignments.length) * 100)
		: 0;

	return (
		<div className="space-y-8">
			{/* Hero Section */}
			<section className="glass-panel p-8 space-y-4">
				<p className="text-xs uppercase tracking-[0.4em] text-white/40">Dashboard</p>
				<h1 className="text-4xl font-semibold tracking-tight">
					Willkommen zurück
				</h1>
				<p className="text-white/70 max-w-2xl">
					Hier ist dein Überblick für heute. Du hast <span className="text-brand font-medium">{todaysAssignments.length} Einsätze</span> geplant.
				</p>
			</section>

			{/* Stats Grid */}
			<section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<div className="stat-card group hover:border-brand/30 transition-colors">
					<div className="flex items-center justify-between">
						<span className="stat-label">Heute</span>
						<Calendar className="h-5 w-5 text-brand/60 group-hover:text-brand transition-colors" />
					</div>
					<span className="stat-value text-3xl">{todaysAssignments.length}</span>
					<span className="text-xs text-white/50">Einsätze geplant</span>
				</div>

				<div className="stat-card group hover:border-blue-500/30 transition-colors">
					<div className="flex items-center justify-between">
						<span className="stat-label">Kunden</span>
						<Users className="h-5 w-5 text-blue-400/60 group-hover:text-blue-400 transition-colors" />
					</div>
					<span className="stat-value text-3xl">{activeCustomers.length}</span>
					<span className="text-xs text-white/50">aktive Objekte</span>
				</div>

				<div className="stat-card group hover:border-amber-500/30 transition-colors">
					<div className="flex items-center justify-between">
						<span className="stat-label">Ø Dauer</span>
						<Clock className="h-5 w-5 text-amber-400/60 group-hover:text-amber-400 transition-colors" />
					</div>
					<span className="stat-value text-3xl">{isFinite(avgDuration) ? avgDuration : 0}</span>
					<span className="text-xs text-white/50">Minuten pro Einsatz</span>
				</div>

				<div className="stat-card group hover:border-emerald-500/30 transition-colors">
					<div className="flex items-center justify-between">
						<span className="stat-label">Team</span>
						<TrendingUp className="h-5 w-5 text-emerald-400/60 group-hover:text-emerald-400 transition-colors" />
					</div>
					<span className="stat-value text-3xl">{activeEmployees.length}</span>
					<span className="text-xs text-white/50">aktive Mitarbeiter</span>
				</div>
			</section>

			{/* Main Content Grid */}
			<div className="grid gap-6 lg:grid-cols-2">
				{/* Today's Plan */}
				<section className="card space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="stat-label">Heutige Planung</p>
							<h2 className="text-xl font-semibold">Einsätze</h2>
						</div>
						<Link href="/planning/week" className="btn-action-primary">
							<Calendar className="h-4 w-4" />
							Planer öffnen
						</Link>
					</div>
					
					<div className="divider" />
					
					<ul className="space-y-3">
						{todaysAssignments.slice(0, 5).map((a: any) => (
							<li key={a.id} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 transition-colors hover:bg-white/10">
								<div className="flex items-center gap-3">
									<div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/20">
										<CheckCircle2 className="h-5 w-5 text-brand" />
									</div>
									<div>
										<div className="font-medium text-white">{idToName.get(a.customer_id) || a.customer_id}</div>
										<div className="flex items-center gap-2 text-sm text-white/50">
											<MapPin className="h-3 w-3" />
											{idToCity.get(a.customer_id) || "—"}
										</div>
									</div>
								</div>
								<div className="text-right">
									<div className="text-sm font-medium text-white/80">
										{a.start_time ? String(a.start_time).slice(0, 5) : "—"}
									</div>
									<div className="text-xs text-white/40">{a.service_type || "Reinigung"}</div>
								</div>
							</li>
						))}
						{todaysAssignments.length === 0 && (
							<li className="empty-state py-8">
								<Calendar className="empty-state-icon" />
								<p>Keine Einsätze für heute geplant</p>
								<Link href="/planning/week" className="btn-action text-sm mt-2">
									Jetzt planen
								</Link>
							</li>
						)}
					</ul>
					
					{todaysAssignments.length > 5 && (
						<Link href="/planning/week" className="block text-center text-sm text-brand hover:text-brand-400 transition-colors">
							+{todaysAssignments.length - 5} weitere anzeigen
						</Link>
					)}
				</section>

				{/* Quick Stats / Week Overview */}
				<section className="card space-y-4">
					<div>
						<p className="stat-label">Diese Woche</p>
						<h2 className="text-xl font-semibold">Wochenübersicht</h2>
					</div>
					
					<div className="divider" />
					
					<div className="grid gap-4">
						<div className="rounded-xl bg-white/5 p-4">
							<div className="flex items-center justify-between mb-2">
								<span className="text-sm text-white/60">Geplante Einsätze</span>
								<span className="text-lg font-bold text-white">{weekAssignments.length}</span>
							</div>
							<div className="progress-bar">
								<div className="progress-bar-fill" style={{ width: `${Math.min(100, weekAssignments.length * 5)}%` }} />
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">
								<div className="text-2xl font-bold text-emerald-400">{completionRate}%</div>
								<div className="text-xs text-emerald-300/70">Abschlussrate</div>
							</div>
							<div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4">
								<div className="text-2xl font-bold text-blue-400">{activeEmployees.length}</div>
								<div className="text-xs text-blue-300/70">Verfügbar</div>
							</div>
						</div>
					</div>

					<div className="divider" />

					{/* Quick Actions */}
					<div className="space-y-2">
						<p className="text-xs uppercase tracking-wider text-white/40">Schnellaktionen</p>
						<div className="grid grid-cols-2 gap-2">
							<Link href="/customers" className="btn-action text-sm justify-center">
								<Users className="h-4 w-4" />
								Neuer Kunde
							</Link>
							<Link href="/employees" className="btn-action text-sm justify-center">
								<Users className="h-4 w-4" />
								Neuer Mitarbeiter
							</Link>
							<Link href="/onboarding" className="btn-action text-sm justify-center col-span-2">
								<TrendingUp className="h-4 w-4" />
								Onboarding starten
							</Link>
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}
