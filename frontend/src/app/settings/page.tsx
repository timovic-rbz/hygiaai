"use client";
import { useEffect, useState } from "react";
import PricingSettings from "@/components/PricingSettings";

export default function SettingsPage() {
	const [apiUrl, setApiUrl] = useState<string>("");
	const [theme, setTheme] = useState<string>("dark");
	const [openrouter, setOpenrouter] = useState<string>("");
	const [health, setHealth] = useState<string>("");

	useEffect(() => {
		// load demo settings
		setApiUrl(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000");
		const saved = typeof window !== "undefined" ? localStorage.getItem("hygia-settings") : null;
		if (saved) {
			try {
				const v = JSON.parse(saved);
				setTheme(v.theme || "dark");
				setOpenrouter(v.openrouter || "");
			} catch {}
		}
	}, []);

	function save() {
		localStorage.setItem("hygia-settings", JSON.stringify({ theme, openrouter }));
		alert("Gespeichert (lokal). Produktions-Setup nutzt Umgebungsvariablen und Backend.");
	}

	async function testBackend() {
		setHealth("Teste …");
		try {
			const res = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") + "/health", { cache: "no-store" });
			const data = await res.json();
			setHealth(data.ok ? "Backend OK" : "Unerwartete Antwort");
		} catch {
			setHealth("Keine Verbindung");
		}
	}

	return (
		<div className="grid gap-8">
			<h1 className="text-2xl font-semibold">Einstellungen</h1>

			<section>
				<h2 className="text-xl font-medium mb-4">Preise & Kalkulation</h2>
				<PricingSettings />
			</section>

			<section>
				<h2 className="text-xl font-medium mb-4">Allgemein</h2>
				<div className="card p-4 grid gap-4 max-w-2xl">
					<div>
						<div className="text-white/60 text-sm mb-1">Frontend API URL (NEXT_PUBLIC_API_URL)</div>
						<input className="input w-full" value={apiUrl} onChange={e => setApiUrl(e.target.value)} disabled />
						<div className="text-white/50 text-xs mt-1">Diese Variable wird zur Build-Zeit gesetzt.</div>
					</div>
					<div>
						<div className="text-white/60 text-sm mb-1">OpenRouter API Key</div>
						<input className="input w-full" placeholder="sk-..." value={openrouter} onChange={e => setOpenrouter(e.target.value)} />
					</div>
					<div>
						<div className="text-white/60 text-sm mb-1">Theme</div>
						<select className="select" value={theme} onChange={e => setTheme(e.target.value)}>
							<option value="dark">Dunkel</option>
							<option value="light">Hell</option>
						</select>
					</div>
					<div className="flex gap-3 items-center">
						<button onClick={save} className="btn btn-primary">Speichern</button>
						<button onClick={testBackend} className="btn btn-ghost">Backend testen</button>
						{health && <span className="text-white/70 text-sm">{health}</span>}
					</div>
				</div>
			</section>
		</div>
	);
}
