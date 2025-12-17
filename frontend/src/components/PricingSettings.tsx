"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

// Types matching Backend
type PricingSettingsData = {
	pv_config: {
		tiers: { min: number; max: number | null; price: number }[];
		surcharge_difficult_percent: number;
		surcharge_dirty_fix: number;
	};
	stairwell_config: {
		method: string;
		price_per_unit_weekly: number;
		price_per_unit_biweekly: number;
		price_per_unit_monthly: number;
		base_price_obj: number;
		price_sqm_upto: number;
		threshold_sqm: number;
		price_sqm_after: number;
		base_price_sqm: number;
		flat_price: number;
		cellar_price: number;
		window_price: number;
	};
	glass_config: {
		price_window_in: number;
		price_window_out: number;
		surcharge_height: number;
		surcharge_difficult_percent: number;
		price_sqm_in: number;
		price_sqm_out: number;
		surcharge_frame_percent: number;
	};
	maintenance_config: {
		price_sqm: number;
		hourly_rate: number;
		extras: Record<string, number>;
	};
};

const DEFAULT_SETTINGS: PricingSettingsData = {
	pv_config: {
		tiers: [
			{ min: 0, max: 10, price: 12 },
			{ min: 11, max: 25, price: 10 },
			{ min: 26, max: null, price: 8 },
		],
		surcharge_difficult_percent: 20,
		surcharge_dirty_fix: 15,
	},
	stairwell_config: {
		method: "units",
		price_per_unit_weekly: 15,
		price_per_unit_biweekly: 20,
		price_per_unit_monthly: 25,
		base_price_obj: 30,
		price_sqm_upto: 6,
		threshold_sqm: 120,
		price_sqm_after: 4,
		base_price_sqm: 40,
		flat_price: 120,
		cellar_price: 25,
		window_price: 5,
	},
	glass_config: {
		price_window_in: 4,
		price_window_out: 5,
		surcharge_height: 15,
		surcharge_difficult_percent: 20,
		price_sqm_in: 6,
		price_sqm_out: 7,
		surcharge_frame_percent: 15,
	},
	maintenance_config: {
		price_sqm: 2.8,
		hourly_rate: 38,
		extras: {},
	},
};

type CityPricing = {
	id?: string;
	city_name: string;
	travel_fee: number;
	min_order_value?: number;
	surcharge_percent?: number;
};

export default function PricingSettings() {
	const [settings, setSettings] = useState<PricingSettingsData | null>(null);
	const [cities, setCities] = useState<CityPricing[]>([]);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState("pv");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Load Data
	useEffect(() => {
		loadAll();
	}, []);

	async function loadAll() {
		setLoading(true);
		setError(null);
		try {
			const [s, c] = await Promise.all([
				apiFetch<PricingSettingsData>("/pricing/settings"),
				apiFetch<CityPricing[]>("/pricing/cities")
			]);
			setSettings(s);
			setCities(c);
		} catch (e) {
			console.error(e);
			setError("Backend nicht erreichbar – Standardwerte geladen. Bitte später speichern, um eigene Werte zu sichern.");
			setSettings(DEFAULT_SETTINGS);
			setCities([]);
		} finally {
			setLoading(false);
		}
	}

	async function saveSettings() {
		if (!settings) return;
		setSaving(true);
		try {
			await apiFetch("/pricing/settings", "PUT", settings);
			alert("Einstellungen gespeichert.");
		} catch (e) {
			alert("Fehler beim Speichern.");
		} finally {
			setSaving(false);
		}
	}

	// Helper for nested updates
	function updateConfig(category: keyof PricingSettingsData, field: string, value: any) {
		if (!settings) return;
		setSettings({
			...settings,
			[category]: {
				...settings[category],
				[field]: value
			}
		});
	}

	// --- PV Helpers ---
	function addPvTier() {
		if (!settings) return;
		const newTier = { min: 0, max: 10, price: 0 };
		const tiers = [...settings.pv_config.tiers, newTier];
		updateConfig("pv_config", "tiers", tiers);
	}
	function updatePvTier(idx: number, field: string, val: any) {
		if (!settings) return;
		const tiers = [...settings.pv_config.tiers];
		tiers[idx] = { ...tiers[idx], [field]: val };
		updateConfig("pv_config", "tiers", tiers);
	}
	function removePvTier(idx: number) {
		if (!settings) return;
		const tiers = settings.pv_config.tiers.filter((_, i) => i !== idx);
		updateConfig("pv_config", "tiers", tiers);
	}

	// --- City Helpers ---
	async function addCity() {
		const name = prompt("Name der Stadt:");
		if (!name) return;
		try {
			await apiFetch("/pricing/cities", "POST", { city_name: name, travel_fee: 0 });
			loadAll();
		} catch { alert("Fehler"); }
	}
	async function updateCity(id: string, data: Partial<CityPricing>) {
		try {
			await apiFetch(`/pricing/cities/${id}`, "PUT", data);
			// Optimistic update
			setCities(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
		} catch { alert("Fehler"); }
	}
	async function deleteCity(id: string) {
		if (!confirm("Stadt löschen?")) return;
		try {
			await apiFetch(`/pricing/cities/${id}`, "DELETE");
			setCities(prev => prev.filter(c => c.id !== id));
		} catch { alert("Fehler"); }
	}


	if (loading && !settings) return <div className="p-4 text-white/50">Lade Einstellungen...</div>;
	if (!settings) return <div className="p-4 text-red-400">Keine Einstellungen verfügbar.</div>;

	return (
		<div className="card p-0 overflow-hidden">
			<div className="border-b border-white/10 bg-white/5 flex overflow-x-auto">
				{["pv", "stairwell", "glass", "maintenance", "cities"].map(tab => (
					<button
						key={tab}
						onClick={() => setActiveTab(tab)}
						className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${activeTab === tab ? "bg-turquoise-500/20 text-turquoise-400 border-b-2 border-turquoise-400" : "text-white/60 hover:bg-white/5"}`}
					>
						{tab === "pv" && "PV-Reinigung"}
						{tab === "stairwell" && "Treppenhaus"}
						{tab === "glass" && "Glasreinigung"}
						{tab === "maintenance" && "Unterhalt"}
						{tab === "cities" && "Anfahrt & Städte"}
					</button>
				))}
			</div>

			<div className="p-6 space-y-4">
				{error && <div className="alert alert-warning text-sm">{error}</div>}
				{/* PV TAB */}
				{activeTab === "pv" && (
					<div className="space-y-6">
						<h3 className="text-lg font-medium">PV-Reinigung: Preisstaffeln</h3>
						<div className="space-y-2">
							{settings.pv_config.tiers.map((tier, i) => (
								<div key={i} className="flex items-center gap-2">
									<span className="text-sm w-16">Ab</span>
									<input type="number" className="input w-24" value={tier.min} onChange={e => updatePvTier(i, "min", Number(e.target.value))} />
									<span className="text-sm">bis</span>
									<input
										type="number"
										className="input w-24"
										placeholder="∞"
										value={tier.max ?? ""}
										onChange={e => updatePvTier(i, "max", e.target.value ? Number(e.target.value) : null)}
									/>
									<span className="text-sm">Module:</span>
									<input type="number" className="input w-24" value={tier.price} onChange={e => updatePvTier(i, "price", Number(e.target.value))} />
									<span className="text-sm">€ / Modul</span>
									<button onClick={() => removePvTier(i)} className="btn btn-ghost text-red-400 hover:bg-red-400/10">×</button>
								</div>
							))}
							<button onClick={addPvTier} className="btn btn-outline btn-sm mt-2">+ Staffel hinzufügen</button>
						</div>

						<h3 className="text-lg font-medium pt-4 border-t border-white/10">Zuschläge</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="label block mb-1">Schwere Zugänglichkeit (%)</label>
								<input
									type="number"
									className="input w-full"
									value={settings.pv_config.surcharge_difficult_percent}
									onChange={e => updateConfig("pv_config", "surcharge_difficult_percent", Number(e.target.value))}
								/>
							</div>
							<div>
								<label className="label block mb-1">Starke Verschmutzung (Fix €)</label>
								<input
									type="number"
									className="input w-full"
									value={settings.pv_config.surcharge_dirty_fix}
									onChange={e => updateConfig("pv_config", "surcharge_dirty_fix", Number(e.target.value))}
								/>
							</div>
						</div>
					</div>
				)}

				{/* STAIRWELL TAB */}
				{activeTab === "stairwell" && (
					<div className="space-y-6">
						<div className="flex gap-4 items-center">
							<label className="font-medium">Methode:</label>
							<select
								className="select"
								value={settings.stairwell_config.method}
								onChange={e => updateConfig("stairwell_config", "method", e.target.value)}
							>
								<option value="units">Nach Wohneinheiten (WE)</option>
								<option value="sqm">Nach m²</option>
								<option value="flat">Pauschale</option>
							</select>
						</div>

						{settings.stairwell_config.method === "units" && (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="label block mb-1">Preis pro WE (wöchentlich)</label>
									<input type="number" className="input w-full" value={settings.stairwell_config.price_per_unit_weekly} onChange={e => updateConfig("stairwell_config", "price_per_unit_weekly", Number(e.target.value))} />
								</div>
								<div>
									<label className="label block mb-1">Preis pro WE (alle 2 Wochen)</label>
									<input type="number" className="input w-full" value={settings.stairwell_config.price_per_unit_biweekly} onChange={e => updateConfig("stairwell_config", "price_per_unit_biweekly", Number(e.target.value))} />
								</div>
								<div>
									<label className="label block mb-1">Preis pro WE (monatlich)</label>
									<input type="number" className="input w-full" value={settings.stairwell_config.price_per_unit_monthly} onChange={e => updateConfig("stairwell_config", "price_per_unit_monthly", Number(e.target.value))} />
								</div>
								<div>
									<label className="label block mb-1">Grundpreis Objekt (€)</label>
									<input type="number" className="input w-full" value={settings.stairwell_config.base_price_obj} onChange={e => updateConfig("stairwell_config", "base_price_obj", Number(e.target.value))} />
								</div>
							</div>
						)}

						{settings.stairwell_config.method === "sqm" && (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="label block mb-1">Schwellwert (m²)</label>
									<input type="number" className="input w-full" value={settings.stairwell_config.threshold_sqm} onChange={e => updateConfig("stairwell_config", "threshold_sqm", Number(e.target.value))} />
								</div>
								<div>
									<label className="label block mb-1">Grundpreis m² (€)</label>
									<input type="number" className="input w-full" value={settings.stairwell_config.base_price_sqm} onChange={e => updateConfig("stairwell_config", "base_price_sqm", Number(e.target.value))} />
								</div>
								<div>
									<label className="label block mb-1">Preis bis Schwellwert (€/m²)</label>
									<input type="number" className="input w-full" value={settings.stairwell_config.price_sqm_upto} onChange={e => updateConfig("stairwell_config", "price_sqm_upto", Number(e.target.value))} />
								</div>
								<div>
									<label className="label block mb-1">Preis ab Schwellwert (€/m²)</label>
									<input type="number" className="input w-full" value={settings.stairwell_config.price_sqm_after} onChange={e => updateConfig("stairwell_config", "price_sqm_after", Number(e.target.value))} />
								</div>
							</div>
						)}

						{settings.stairwell_config.method === "flat" && (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="label block mb-1">Standardpreis Treppenhaus (€)</label>
									<input type="number" className="input w-full" value={settings.stairwell_config.flat_price} onChange={e => updateConfig("stairwell_config", "flat_price", Number(e.target.value))} />
								</div>
								<div>
									<label className="label block mb-1">Aufpreis Kellerreinigung (€)</label>
									<input type="number" className="input w-full" value={settings.stairwell_config.cellar_price} onChange={e => updateConfig("stairwell_config", "cellar_price", Number(e.target.value))} />
								</div>
								<div>
									<label className="label block mb-1">Preis pro Fenster (€)</label>
									<input type="number" className="input w-full" value={settings.stairwell_config.window_price} onChange={e => updateConfig("stairwell_config", "window_price", Number(e.target.value))} />
								</div>
							</div>
						)}
					</div>
				)}

				{/* GLASS TAB */}
				{activeTab === "glass" && (
					<div className="space-y-6">
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
							<div className="card bg-white/5 p-4">
								<h4 className="font-medium mb-4 text-turquoise-400">Kalkulation pro Fenster</h4>
								<div className="space-y-3">
									<div>
										<label className="text-xs text-white/60">Preis innen (€)</label>
										<input className="input w-full" type="number" value={settings.glass_config.price_window_in} onChange={e => updateConfig("glass_config", "price_window_in", Number(e.target.value))} />
									</div>
									<div>
										<label className="text-xs text-white/60">Preis außen (€)</label>
										<input className="input w-full" type="number" value={settings.glass_config.price_window_out} onChange={e => updateConfig("glass_config", "price_window_out", Number(e.target.value))} />
									</div>
									<div>
										<label className="text-xs text-white/60">Aufschlag Höhe (Fix €)</label>
										<input className="input w-full" type="number" value={settings.glass_config.surcharge_height} onChange={e => updateConfig("glass_config", "surcharge_height", Number(e.target.value))} />
									</div>
									<div>
										<label className="text-xs text-white/60">Schwere Zugänglichkeit (%)</label>
										<input className="input w-full" type="number" value={settings.glass_config.surcharge_difficult_percent} onChange={e => updateConfig("glass_config", "surcharge_difficult_percent", Number(e.target.value))} />
									</div>
								</div>
							</div>

							<div className="card bg-white/5 p-4">
								<h4 className="font-medium mb-4 text-turquoise-400">Kalkulation pro m²</h4>
								<div className="space-y-3">
									<div>
										<label className="text-xs text-white/60">Preis innen (€/m²)</label>
										<input className="input w-full" type="number" value={settings.glass_config.price_sqm_in} onChange={e => updateConfig("glass_config", "price_sqm_in", Number(e.target.value))} />
									</div>
									<div>
										<label className="text-xs text-white/60">Preis außen (€/m²)</label>
										<input className="input w-full" type="number" value={settings.glass_config.price_sqm_out} onChange={e => updateConfig("glass_config", "price_sqm_out", Number(e.target.value))} />
									</div>
									<div>
										<label className="text-xs text-white/60">Aufschlag Rahmen (%)</label>
										<input className="input w-full" type="number" value={settings.glass_config.surcharge_frame_percent} onChange={e => updateConfig("glass_config", "surcharge_frame_percent", Number(e.target.value))} />
									</div>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* MAINTENANCE TAB */}
				{activeTab === "maintenance" && (
					<div className="space-y-4 max-w-md">
						<div>
							<label className="label block mb-1">Preis pro m² Bürofläche (€)</label>
							<input className="input w-full" type="number" value={settings.maintenance_config.price_sqm} onChange={e => updateConfig("maintenance_config", "price_sqm", Number(e.target.value))} />
						</div>
						<div>
							<label className="label block mb-1">Standard-Stundensatz (€/h)</label>
							<input className="input w-full" type="number" value={settings.maintenance_config.hourly_rate} onChange={e => updateConfig("maintenance_config", "hourly_rate", Number(e.target.value))} />
						</div>
					</div>
				)}

				{/* CITIES TAB */}
				{activeTab === "cities" && (
					<div className="space-y-6">
						<div className="flex justify-between items-center">
							<p className="text-sm text-white/60">Bestandskunden zahlen keine Anfahrtspauschale (automatisch).</p>
							<button onClick={addCity} className="btn btn-primary btn-sm">+ Stadt hinzufügen</button>
						</div>
						<div className="grid gap-3">
							{cities.map(city => (
								<div key={city.id} className="flex flex-wrap items-center gap-4 bg-white/5 p-3 rounded-lg">
									<div className="w-32 font-medium">{city.city_name}</div>
									<div className="flex items-center gap-2">
										<span className="text-xs text-white/50">Anfahrt €</span>
										<input
											className="input w-20 text-right"
											type="number"
											value={city.travel_fee}
											onChange={e => updateCity(city.id!, { travel_fee: Number(e.target.value) })}
										/>
									</div>
									<div className="flex items-center gap-2">
										<span className="text-xs text-white/50">Min. Auftrag €</span>
										<input
											className="input w-20 text-right"
											type="number"
											value={city.min_order_value || 0}
											onChange={e => updateCity(city.id!, { min_order_value: Number(e.target.value) })}
										/>
									</div>
									<div className="flex items-center gap-2">
										<span className="text-xs text-white/50">Zuschlag %</span>
										<input
											className="input w-16 text-right"
											type="number"
											value={city.surcharge_percent || 0}
											onChange={e => updateCity(city.id!, { surcharge_percent: Number(e.target.value) })}
										/>
									</div>
									<button onClick={() => deleteCity(city.id!)} className="btn btn-ghost btn-sm text-red-400 ml-auto">Löschen</button>
								</div>
							))}
							{cities.length === 0 && <div className="text-white/40 italic">Keine Städte konfiguriert.</div>}
						</div>
					</div>
				)}
			</div>

			{activeTab !== "cities" && (
				<div className="p-6 border-t border-white/10 bg-white/5 flex justify-end">
					<button onClick={saveSettings} disabled={saving} className="btn btn-primary min-w-[120px]">
						{saving ? "Speichert..." : "Einstellungen speichern"}
					</button>
				</div>
			)}
		</div>
	);
}

