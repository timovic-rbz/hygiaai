"use client";
import { useState, useEffect } from "react";
import { apiFetch, fetchCustomersSafe } from "@/lib/api";

type CalculationResponse = {
	net_price: number;
	travel_fee: number;
	total_price: number;
	details: any;
};

export default function CalculatorPage() {
	const [category, setCategory] = useState("pv");
	const [city, setCity] = useState("");
	const [isExisting, setIsExisting] = useState(false);
	const [customers, setCustomers] = useState<any[]>([]);
	const [selectedCustomerId, setSelectedCustomerId] = useState("");

	// Payload inputs
	const [inputs, setInputs] = useState<any>({
		pv_modules_count: 10,
		is_difficult_access: false,
		is_very_dirty: false,
		
		units: 5,
		frequency_per_month: 4,
		sqm: 50,
		has_cellar: false,
		windows_count: 0,
		
		glass_count_in: 0,
		glass_count_out: 0,
		glass_sqm_in: 0,
		glass_sqm_out: 0,
		glass_height_surcharge: false,
		glass_difficult_access: false,
		frame_cleaning: false,
		
		maintenance_sqm: 100,
		hours_estimated: 2,
	});

	// Stairwell / Glass sub-methods
	const [stairwellMethod, setStairwellMethod] = useState("units"); // Only for display/logic hint, backend uses config. But calculator might override? 
	// Actually backend uses Config.Method. So frontend inputs might be irrelevant if config says otherwise.
	// Wait, the prompt said "The company should choose which one to use". That implies settings.
	// But for *Offer Calculation*, can we override? My backend logic currently uses Config.Method strictly for Stairwell.
	// For Glass, it accepts "calculation_method" in request.
	
	const [glassMethod, setGlassMethod] = useState("window");

	const [result, setResult] = useState<CalculationResponse | null>(null);

	useEffect(() => {
		fetchCustomersSafe().then(setCustomers);
	}, []);

	function onCustomerChange(id: string) {
		setSelectedCustomerId(id);
		if (!id) {
			setCity("");
			setIsExisting(false);
			return;
		}
		const c = customers.find(x => x.id === id);
		if (c) {
			setCity(c.city || "");
			setIsExisting(!!c.is_existing_customer);
		}
	}

	async function calculate() {
		const payload: any = {
			service_category: category,
			city,
			is_existing_customer: isExisting,
			...inputs
		};
		// Glass method override
		if (category === "glass") payload.calculation_method = glassMethod;

		try {
			const res = await apiFetch<CalculationResponse>("/pricing/calculate", "POST", payload);
			setResult(res);
		} catch (e) {
			alert("Fehler bei der Berechnung");
		}
	}

	return (
		<div className="grid gap-6 max-w-4xl">
			<h1 className="text-2xl font-semibold">Preis-Kalkulator</h1>

			<div className="card p-6 grid gap-6 md:grid-cols-2">
				<div className="space-y-4">
					<h3 className="font-medium border-b border-white/10 pb-2">Basis-Daten</h3>
					
					<div>
						<label className="label block mb-1">Kunde (optional)</label>
						<select className="select w-full" value={selectedCustomerId} onChange={e => onCustomerChange(e.target.value)}>
							<option value="">-- Manuelle Eingabe --</option>
							{customers.map(c => (
								<option key={c.id} value={c.id}>{c.name} ({c.city})</option>
							))}
						</select>
					</div>

					<div>
						<label className="label block mb-1">Stadt (für Anfahrt)</label>
						<input className="input w-full" value={city} onChange={e => setCity(e.target.value)} placeholder="München" />
					</div>

					<div className="flex items-center gap-2 bg-white/5 p-2 rounded">
						<input type="checkbox" className="checkbox" checked={isExisting} onChange={e => setIsExisting(e.target.checked)} />
						<span>Bestandskunde (keine Anfahrt)</span>
					</div>

					<div>
						<label className="label block mb-1">Gewerk</label>
						<select className="select w-full" value={category} onChange={e => setCategory(e.target.value)}>
							<option value="pv">PV-Reinigung</option>
							<option value="stairwell">Treppenhaus</option>
							<option value="glass">Glasreinigung</option>
							<option value="maintenance">Unterhalt</option>
						</select>
					</div>
				</div>

				<div className="space-y-4 border-l border-white/10 pl-6">
					<h3 className="font-medium border-b border-white/10 pb-2">Leistungs-Daten</h3>

					{category === "pv" && (
						<>
							<div>
								<label className="label">Anzahl Module</label>
								<input type="number" className="input w-full" value={inputs.pv_modules_count} onChange={e => setInputs({...inputs, pv_modules_count: Number(e.target.value)})} />
							</div>
							<div className="flex flex-col gap-2 mt-2">
								<label className="flex items-center gap-2">
									<input type="checkbox" className="checkbox" checked={inputs.is_difficult_access} onChange={e => setInputs({...inputs, is_difficult_access: e.target.checked})} />
									<span>Schwer zugänglich</span>
								</label>
								<label className="flex items-center gap-2">
									<input type="checkbox" className="checkbox" checked={inputs.is_very_dirty} onChange={e => setInputs({...inputs, is_very_dirty: e.target.checked})} />
									<span>Stark verschmutzt</span>
								</label>
							</div>
						</>
					)}

					{category === "stairwell" && (
						<>
							<p className="text-xs text-white/50 mb-2">Berechnungsmethode hängt von den Einstellungen ab.</p>
							<div>
								<label className="label">Wohneinheiten</label>
								<input type="number" className="input w-full" value={inputs.units} onChange={e => setInputs({...inputs, units: Number(e.target.value)})} />
							</div>
							<div>
								<label className="label">Frequenz (pro Monat)</label>
								<input type="number" className="input w-full" value={inputs.frequency_per_month} onChange={e => setInputs({...inputs, frequency_per_month: Number(e.target.value)})} />
								<div className="text-xs text-white/50">4 = Wöchentlich, 2 = 14-tägig, 1 = Monatlich</div>
							</div>
							<div className="mt-2">
								<label className="label">Fläche (m²)</label>
								<input type="number" className="input w-full" value={inputs.sqm} onChange={e => setInputs({...inputs, sqm: Number(e.target.value)})} />
							</div>
							<div className="mt-2 flex items-center gap-2">
								<input type="checkbox" className="checkbox" checked={inputs.has_cellar} onChange={e => setInputs({...inputs, has_cellar: e.target.checked})} />
								<span>Mit Keller</span>
							</div>
						</>
					)}

					{category === "glass" && (
						<>
							<div className="flex gap-4 mb-2">
								<label className="flex items-center gap-1"><input type="radio" checked={glassMethod === "window"} onChange={() => setGlassMethod("window")} /> Pro Fenster</label>
								<label className="flex items-center gap-1"><input type="radio" checked={glassMethod === "sqm"} onChange={() => setGlassMethod("sqm")} /> Pro m²</label>
							</div>
							
							{glassMethod === "window" ? (
								<div className="grid grid-cols-2 gap-2">
									<div>
										<label className="label text-xs">Anzahl Innen</label>
										<input type="number" className="input w-full" value={inputs.glass_count_in} onChange={e => setInputs({...inputs, glass_count_in: Number(e.target.value)})} />
									</div>
									<div>
										<label className="label text-xs">Anzahl Außen</label>
										<input type="number" className="input w-full" value={inputs.glass_count_out} onChange={e => setInputs({...inputs, glass_count_out: Number(e.target.value)})} />
									</div>
								</div>
							) : (
								<div className="grid grid-cols-2 gap-2">
									<div>
										<label className="label text-xs">m² Innen</label>
										<input type="number" className="input w-full" value={inputs.glass_sqm_in} onChange={e => setInputs({...inputs, glass_sqm_in: Number(e.target.value)})} />
									</div>
									<div>
										<label className="label text-xs">m² Außen</label>
										<input type="number" className="input w-full" value={inputs.glass_sqm_out} onChange={e => setInputs({...inputs, glass_sqm_out: Number(e.target.value)})} />
									</div>
								</div>
							)}

							<div className="flex flex-col gap-2 mt-2">
								<label className="flex items-center gap-2">
									<input type="checkbox" className="checkbox" checked={inputs.glass_height_surcharge} onChange={e => setInputs({...inputs, glass_height_surcharge: e.target.checked})} />
									<span>Höhen-Zuschlag</span>
								</label>
								<label className="flex items-center gap-2">
									<input type="checkbox" className="checkbox" checked={inputs.glass_difficult_access} onChange={e => setInputs({...inputs, glass_difficult_access: e.target.checked})} />
									<span>Schwer zugänglich</span>
								</label>
								{glassMethod === "sqm" && (
									<label className="flex items-center gap-2">
										<input type="checkbox" className="checkbox" checked={inputs.frame_cleaning} onChange={e => setInputs({...inputs, frame_cleaning: e.target.checked})} />
										<span>Rahmenreinigung</span>
									</label>
								)}
							</div>
						</>
					)}

					{category === "maintenance" && (
						<>
							<div>
								<label className="label">Fläche (m²)</label>
								<input type="number" className="input w-full" value={inputs.maintenance_sqm} onChange={e => setInputs({...inputs, maintenance_sqm: Number(e.target.value)})} />
							</div>
							<div className="mt-2">
								<label className="label">Stunden (geschätzt)</label>
								<input type="number" className="input w-full" value={inputs.hours_estimated} onChange={e => setInputs({...inputs, hours_estimated: Number(e.target.value)})} />
								<div className="text-xs text-white/50">Wenn > 0, wird Stunden-Satz verwendet.</div>
							</div>
						</>
					)}

					<button onClick={calculate} className="btn btn-primary w-full mt-4">Preis berechnen</button>
				</div>
			</div>

			{result && (
				<div className="card p-6 bg-gradient-to-br from-gray-800 to-gray-900 border border-turquoise-500/30">
					<h2 className="text-xl font-medium mb-4 text-turquoise-400">Ergebnis</h2>
					<div className="grid grid-cols-3 gap-4 text-center">
						<div className="p-3 bg-white/5 rounded">
							<div className="text-sm text-white/60">Netto</div>
							<div className="text-xl font-bold">{result.net_price.toFixed(2)} €</div>
						</div>
						<div className="p-3 bg-white/5 rounded">
							<div className="text-sm text-white/60">Anfahrt</div>
							<div className="text-xl font-bold">{result.travel_fee.toFixed(2)} €</div>
							<div className="text-xs text-white/40 mt-1">{result.details.travel_details}</div>
						</div>
						<div className="p-3 bg-turquoise-500/10 rounded border border-turquoise-500/50">
							<div className="text-sm text-turquoise-300">Gesamt</div>
							<div className="text-2xl font-bold text-white">{result.total_price.toFixed(2)} €</div>
						</div>
					</div>
					<div className="mt-4 text-sm text-white/50 font-mono bg-black/30 p-3 rounded overflow-auto">
						Details: {JSON.stringify(result.details, null, 2)}
					</div>
				</div>
			)}
		</div>
	);
}

