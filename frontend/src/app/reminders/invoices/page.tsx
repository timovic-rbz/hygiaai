"use client";

import { useEffect, useState } from "react";
import { fetchInvoiceReminders, updateInvoiceReminder } from "@/lib/api";
import CityTag from "@/components/CityTag";

type InvoiceReminder = {
	id: string;
	customer_id: string;
	object_id: string;
	count_at_trigger: number;
	price: number;
	status: string;
	date: string;
};

export default function InvoiceRemindersPage() {
	const [items, setItems] = useState<InvoiceReminder[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		(async () => {
			try {
				const data = await fetchInvoiceReminders();
				setItems(data);
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	async function markAsSent(id: string) {
		await updateInvoiceReminder(id, "sent");
		setItems(prev => prev.map(item => (item.id === id ? { ...item, status: "sent" } : item)));
	}

	return (
		<div className="space-y-6">
			<div className="glass-panel p-6 md:p-8 space-y-2">
				<p className="text-xs uppercase tracking-[0.4em] text-white/40">Reminder</p>
				<h1 className="text-4xl font-semibold tracking-tight">Rechnungs-Erinnerungen</h1>
				<p className="text-white/70 max-w-3xl">Hier siehst du alle automatisch erzeugten Rechnungshinweise nach abgeschlossenen Reinigungszyklen.</p>
			</div>

			<div className="card p-4">
				<div className="overflow-x-auto">
					<table className="table">
						<thead>
							<tr>
								<th>Kunde</th>
								<th>Objekt</th>
								<th>Auslöser</th>
								<th>Datum</th>
								<th>Preis</th>
								<th>Status</th>
								<th>Aktion</th>
							</tr>
						</thead>
						<tbody>
							{items.map(item => (
								<tr key={item.id}>
									<td>{item.customer_id}</td>
									<td><CityTag city={item.object_id} showIcon={false} /></td>
									<td>{item.count_at_trigger} Einsätze</td>
									<td>{new Date(item.date).toLocaleString("de-DE")}</td>
									<td>{item.price.toFixed(2)} €</td>
									<td>
										<span className={`pill ${item.status === "sent" ? "pill-positive" : "pill-neutral"}`}>
											{item.status}
										</span>
									</td>
									<td>
										<button className="btn btn-secondary btn-sm" disabled={item.status === "sent"} onClick={() => markAsSent(item.id)}>
											Als gesendet markieren
										</button>
									</td>
								</tr>
							))}
							{!loading && items.length === 0 && (
								<tr>
									<td colSpan={7} className="text-center text-white/50 py-6">Noch keine Reminder generiert.</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
