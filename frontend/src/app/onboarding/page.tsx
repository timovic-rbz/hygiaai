import Link from "next/link";
import CityTag from "@/components/CityTag";

const demoOnboardings = [
	{ id: "obj-1", name: "Kunde Alpha – HQ", city: "Leverkusen", progress: 0.65, manager: "Team Nord" },
	{ id: "obj-2", name: "Kunde Beta – Campus", city: "Köln", progress: 0.35, manager: "Team Mitte" },
];

const demoTasks = [
	{ id: "task-1", title: "Material anliefern", object: "Kunde Alpha – HQ", city: "Leverkusen", due: "22. Nov", status: "overdue" },
	{ id: "task-2", title: "Key-Card Übergabe", object: "Kunde Beta – Campus", city: "Köln", due: "24. Nov", status: "open" },
	{ id: "task-3", title: "Serientermine buchen", object: "Kunde Beta – Campus", city: "Köln", due: "25. Nov", status: "open" },
];

export default function OnboardingPage() {
	const openTasks = demoTasks.filter((t) => t.status !== "done");

	return (
		<div className="space-y-8">
			<section className="glass-panel p-6 md:p-8 space-y-3">
				<p className="text-xs uppercase tracking-[0.4em] text-white/40">Onboarding</p>
				<h1 className="text-4xl font-semibold tracking-tight">Objekte smart einführen</h1>
				<p className="text-white/70 max-w-3xl">
					Verfolge Onboarding-Pakete, offene Tasks und Übergaben. Jede Stadt erhält ihre eigene Farbe, damit du sofort erkennst, wo noch To-dos offen sind.
				</p>
				<div className="grid gap-4 sm:grid-cols-3">
					<div className="stat-card">
						<span className="stat-label">Objekte im Onboarding</span>
						<span className="stat-value text-3xl">{demoOnboardings.length}</span>
						<span className="text-xs text-white/50">laufende Pakete</span>
					</div>
					<div className="stat-card">
						<span className="stat-label">Offene Aufgaben</span>
						<span className="stat-value text-3xl">{openTasks.length}</span>
						<span className="text-xs text-white/50">inkl. Überfällige</span>
					</div>
					<div className="stat-card">
						<span className="stat-label">Überfällig</span>
						<span className="stat-value text-3xl">{openTasks.filter((t) => t.status === "overdue").length}</span>
						<span className="text-xs text-white/50">schnell klären</span>
					</div>
				</div>
			</section>

			<section className="card space-y-4">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<p className="stat-label">Aktive Onboardings</p>
						<h2 className="text-2xl font-semibold">Mini-Dashboard</h2>
					</div>
					<div className="flex flex-wrap gap-2 text-sm">
						<Link className="btn-primary" href="/customers">+ Neues Objekt anlegen</Link>
						<Link className="btn-secondary" href="/planning">Onboarding starten</Link>
						<Link className="btn-ghost" href="/settings">Pakete anpassen</Link>
					</div>
				</div>
				<div className="grid gap-3 md:grid-cols-2">
					{demoOnboardings.map((entry) => (
						<div key={entry.id} className="rounded-3xl border border-white/10 bg-white/5 p-4 space-y-3">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-semibold text-white">{entry.name}</p>
									<CityTag city={entry.city} showIcon={false} />
								</div>
								<span className="text-xs text-white/50">{Math.round(entry.progress * 100)} %</span>
							</div>
							<div className="h-2 rounded-full bg-white/10">
								<div className="h-full rounded-full bg-brand" style={{ width: `${entry.progress * 100}%` }} />
							</div>
							<p className="text-xs text-white/50">Verantwortlich: {entry.manager}</p>
						</div>
					))}
				</div>
			</section>

			<section className="card space-y-4">
				<div className="flex items-center justify-between">
					<div>
						<p className="stat-label">Aufgabenliste</p>
						<h2 className="text-xl font-semibold">Tasks & Übergaben</h2>
					</div>
					<span className="pill pill-neutral">{openTasks.length} offen</span>
				</div>
				<ul className="space-y-3">
					{openTasks.map((task) => (
						<li key={task.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col gap-1">
							<div className="flex items-center justify-between">
								<span className="font-semibold text-white">{task.title}</span>
								<span className={`text-xs ${task.status === "overdue" ? "text-rose-300" : "text-white/50"}`}>{task.due}</span>
							</div>
							<p className="text-sm text-white/70">{task.object}</p>
							<CityTag city={task.city} showIcon={false} compact />
						</li>
					))}
					{openTasks.length === 0 && <li className="empty-state text-sm">Alle Tasks erledigt!</li>}
				</ul>
			</section>
		</div>
	);
}
