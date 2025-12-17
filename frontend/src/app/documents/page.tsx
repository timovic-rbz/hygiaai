"use client";

import { useMemo, useState } from "react";
import { FileText, UploadCloud } from "lucide-react";
import CityTag from "@/components/CityTag";

const demoDocuments = [
	{ id: "doc-1", name: "Reinigungsplan HQ", city: "Leverkusen", type: "PDF", size: "1.2 MB", updated: "19. Nov 2025", owner: "Team Nord" },
	{ id: "doc-2", name: "Objekt-Checkliste Beta", city: "Köln", type: "DOCX", size: "820 KB", updated: "18. Nov 2025", owner: "Team Mitte" },
	{ id: "doc-3", name: "Sicherheitsblatt Glas", city: "Monheim", type: "PDF", size: "540 KB", updated: "17. Nov 2025", owner: "HQ" },
];

const categories = [
	{ id: "plans", label: "Reinigungspläne", count: 8 },
	{ id: "safety", label: "Sicherheit", count: 4 },
	{ id: "briefings", label: "Briefings", count: 6 },
];

export default function DocumentsPage() {
	const [filter, setFilter] = useState("all");
	const filteredDocs = useMemo(() => {
		if (filter === "all") return demoDocuments;
		return demoDocuments.filter((doc) => doc.city === filter);
	}, [filter]);

	return (
		<div className="space-y-8">
			<section className="glass-panel p-6 md:p-8 space-y-3">
				<p className="text-xs uppercase tracking-[0.4em] text-white/40">Dokumente</p>
				<h1 className="text-4xl font-semibold tracking-tight">Reinigungspläne & Unterlagen</h1>
				<p className="text-white/70 max-w-3xl">
					Behalte alle Reinigungsdokumente, Checklisten und Übergabeprotokolle zentral im Blick. Lade neue Dateien hoch und teile sie mit Teams vor Ort.
				</p>
				<div className="flex flex-wrap gap-3 text-sm">
					<button className={`btn-primary`}>
						<UploadCloud className="h-4 w-4" />
						<span>Dokument hochladen</span>
					</button>
					<div className="flex gap-2 text-xs text-white/60">
						<span>Filter nach Stadt:</span>
						<div className="flex flex-wrap gap-2">
							<button className={`pill ${filter === "all" ? "pill-positive" : "pill-neutral"}`} onClick={() => setFilter("all")}>
								Alle
							</button>
							{Array.from(new Set(demoDocuments.map((d) => d.city))).map((city) => (
								<button key={city} className={`pill ${filter === city ? "pill-positive" : "pill-neutral"}`} onClick={() => setFilter(city)}>
									<CityTag city={city} showIcon={false} compact />
								</button>
							))}
						</div>
					</div>
				</div>
			</section>

			<section className="grid gap-4 sm:grid-cols-3">
				{categories.map((cat) => (
					<div key={cat.id} className="rounded-3xl border border-white/10 bg-white/5 p-4 space-y-1">
						<p className="text-xs uppercase tracking-[0.4em] text-white/40">{cat.label}</p>
						<p className="text-3xl font-semibold text-white">{cat.count}</p>
						<p className="text-white/60 text-sm">Dokumente im Ordner</p>
					</div>
				))}
			</section>

			<section className="card space-y-4">
				<div className="flex items-center justify-between flex-wrap gap-3">
					<div>
						<p className="stat-label">Alle Dateien</p>
						<h2 className="text-2xl font-semibold">Ablage</h2>
					</div>
					<p className="text-sm text-white/50">{filteredDocs.length} Dateien sichtbar</p>
				</div>
				<div className="overflow-x-auto">
					<table className="table">
						<thead>
							<tr>
								<th>Datei</th>
								<th>Standort</th>
								<th>Typ</th>
								<th>Größe</th>
								<th>Aktualisiert</th>
								<th>Owner</th>
							</tr>
						</thead>
						<tbody>
							{filteredDocs.map((doc) => (
								<tr key={doc.id}>
									<td className="flex items-center gap-2 text-white">
										<FileText className="h-4 w-4 text-white/50" />
										{doc.name}
									</td>
									<td><CityTag city={doc.city} showIcon={false} /></td>
									<td className="text-white/70">{doc.type}</td>
									<td className="text-white/70">{doc.size}</td>
									<td className="text-white/70">{doc.updated}</td>
									<td className="text-white/70">{doc.owner}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</section>
		</div>
	);
}
