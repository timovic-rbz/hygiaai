/* eslint-disable @next/next/no-img-element */
"use client";
import { fetchCustomersSafe, fetchAssignmentsSafe, apiFetch } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import ServiceTag from "@/components/ServiceTag";

type Customer = {
	id?: string;
	name: string;
	address?: string;
	city?: string;
	phone?: string;
	email?: string;
	service_tags?: string[];
	duration_minutes?: number;
	is_active?: boolean;
	notes?: string;
	is_existing_customer?: boolean;
};

export default function CustomersPage() {
	const [customers, setCustomers] = useState<Customer[]>([]);
	const [city, setCity] = useState("");
	const [street, setStreet] = useState("");
	const [service, setService] = useState("");
	const [search, setSearch] = useState("");
	const [assignments, setAssignments] = useState<any[]>([]);
	const [form, setForm] = useState<Customer>({ name: "", city: "", duration_minutes: 60, service_tags: [], is_existing_customer: false });
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		(async () => {
			const [cs, as] = await Promise.all([fetchCustomersSafe(), fetchAssignmentsSafe()]);
			setCustomers(cs);
			setAssignments(as);
		})();
	}, []);

	const lastCleanedMap = useMemo(() => {
		const map = new Map<string, string>();
		for (const a of assignments) {
			if (!a.customer_id || !a.date) continue;
			const prev = map.get(a.customer_id);
			if (!prev || String(a.date) > prev) {
				map.set(a.customer_id, String(a.date));
			}
		}
		return map;
	}, [assignments]);

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		return customers.filter(c => {
			const cityOk = !city || (c.city || "").toLowerCase().includes(city.toLowerCase());
			const streetOk = !street || (c.address || "").toLowerCase().includes(street.toLowerCase());
			const serviceOk = !service || (c.service_tags || []).some(t => (t || "").toLowerCase().includes(service.toLowerCase()));
			const searchOk = !q || (c.name.toLowerCase().includes(q) || (c.city || "").toLowerCase().includes(q) || (c.address || "").toLowerCase().includes(q));
			return cityOk && streetOk && serviceOk && searchOk;
		});
	}, [customers, city, street, service, search]);

	async function addCustomer(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		try {
			const payload = {
				name: form.name,
				city: form.city,
				address: form.address,
				phone: form.phone,
				email: form.email,
				notes: form.notes,
				service_tags: form.service_tags,
				duration_minutes: Number(form.duration_minutes || 0),
				is_active: true,
				is_existing_customer: form.is_existing_customer
			};
			let created: Customer | null = null;
			try {
				created = await apiFetch<Customer>("/customers", "POST", payload);
			} catch {
				// fallback: optimistic add
				created = { ...payload, id: `tmp-${Date.now()}` };
			}
			setCustomers(prev => [created!, ...prev]);
			setForm({ name: "", city: "", duration_minutes: 60, service_tags: [], is_existing_customer: false });
		} finally {
			setLoading(false);
		}
	}

	async function editNotes(c: Customer) {
		const current = c.notes || "";
		// simple inline prompt for demo
		const next = window.prompt(`Notizen für ${c.name}:`, current);
		if (next === null) return;
		try {
			await apiFetch(`/customers/${c.id}`, "PUT", { notes: next });
		} catch {
			// ignore network errors in demo
		}
		setCustomers(prev => prev.map(x => x.id === c.id ? { ...x, notes: next } : x));
	}

	async function toggleExisting(c: Customer) {
		const nextVal = !c.is_existing_customer;
		if (!c.id) return;
		try {
			await apiFetch(`/customers/${c.id}`, "PUT", { is_existing_customer: nextVal });
			setCustomers(prev => prev.map(x => x.id === c.id ? { ...x, is_existing_customer: nextVal } : x));
		} catch {
			alert("Fehler beim Aktualisieren");
		}
	}

	return (
		<div className="grid gap-6">
			<h1 className="text-2xl font-semibold">Kunden</h1>

			<div className="card p-4 grid gap-3">
				<div className="flex gap-3">
					<input className="input flex-1" placeholder="Suche (Name oder Stadt)" value={search} onChange={e => setSearch(e.target.value)} />
					<input className="input w-48" placeholder="Filter Stadt" value={city} onChange={e => setCity(e.target.value)} />
					<input className="input w-64" placeholder="Filter Straße" value={street} onChange={e => setStreet(e.target.value)} />
					<input className="input w-64" placeholder="Filter Dienstleistung" value={service} onChange={e => setService(e.target.value)} />
				</div>
			</div>

			<div className="card p-4 grid gap-3">
				<form onSubmit={addCustomer} className="grid gap-3 md:grid-cols-6">
					<input className="input md:col-span-2" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
					<input className="input md:col-span-2" placeholder="Stadt" value={form.city || ""} onChange={e => setForm({ ...form, city: e.target.value })} />
					<input className="input md:col-span-2" placeholder="Adresse (Straße, Nr.)" value={form.address || ""} onChange={e => setForm({ ...form, address: e.target.value })} />
					<input className="input md:col-span-2" placeholder="E-Mail" value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} />
					<input className="input md:col-span-2" placeholder="Telefon" value={form.phone || ""} onChange={e => setForm({ ...form, phone: e.target.value })} />
					<input className="input md:col-span-2" placeholder="Dienstleistungen (Komma)" value={(form.service_tags || []).join(", ")} onChange={e => setForm({ ...form, service_tags: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} />
					<input className="input md:col-span-1" type="number" placeholder="Dauer (Min)" value={form.duration_minutes || 0} onChange={e => setForm({ ...form, duration_minutes: Number(e.target.value) })} />
					<div className="md:col-span-1 flex items-center gap-2 bg-white/5 rounded px-2">
						<input type="checkbox" className="checkbox" checked={form.is_existing_customer || false} onChange={e => setForm({ ...form, is_existing_customer: e.target.checked })} />
						<span className="text-sm text-white/70">Bestandskunde</span>
					</div>
					<textarea className="textarea md:col-span-4" placeholder="Notizen (Schlüsselort, Ansprechpartner, Zusatzleistungen)" value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} />
					<button className="btn btn-primary md:col-span-1 h-10 self-end" disabled={loading} type="submit">{loading ? "Speichern..." : "Hinzufügen"}</button>
				</form>
			</div>

			<div className="card p-4">
				<div className="overflow-x-auto">
					<table className="table">
						<thead>
							<tr>
								<th>Name</th>
								<th>Stadt</th>
								<th>Dienstleistungen</th>
								<th>Status</th>
								<th>Notizen</th>
								<th>Aktionen</th>
							</tr>
						</thead>
						<tbody>
							{filtered.map(c => (
								<tr key={c.id || c.name}>
									<td title={`Zuletzt gereinigt: ${lastCleanedMap.get(c.id || "") || "—"}`}>
										<div className="font-medium">{c.name}</div>
										<div className="text-xs text-white/50">{c.address}</div>
									</td>
									<td className="text-white/70">{c.city || "-"}</td>
									<td className="text-white/70">
										<div className="flex flex-wrap gap-1">
											{(c.service_tags || []).length ? (c.service_tags || []).map(t => <ServiceTag key={t} label={t} />) : <span className="text-white/50">—</span>}
										</div>
									</td>
									<td>
										{c.is_existing_customer ? (
											<span className="badge bg-turquoise-500/20 text-turquoise-400 border-turquoise-500/40">Bestandskunde</span>
										) : (
											<span className="badge bg-white/5 text-white/50">Neukunde</span>
										)}
									</td>
									<td className="text-white/70 max-w-[200px] truncate" title={c.notes || ""}>{c.notes || "—"}</td>
									<td className="flex gap-2">
										{c.id && (
											<>
												<button className="btn btn-ghost btn-sm" onClick={() => editNotes(c)}>Notizen</button>
												<button className="btn btn-ghost btn-sm" onClick={() => toggleExisting(c)}>
													{c.is_existing_customer ? "Zu Neukunde" : "Zu Bestand"}
												</button>
											</>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
