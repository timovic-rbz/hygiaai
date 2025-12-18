export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function apiFetch<T>(path: string, method: HttpMethod = "GET", body?: any): Promise<T> {
	const url = `${API_BASE}${path}`;
	const headers: Record<string, string> = { "Content-Type": "application/json" };
	const res = await fetch(url, {
		method,
		headers,
		body: body ? JSON.stringify(body) : undefined,
		cache: "no-store",
	});
	if (!res.ok) {
		throw new Error(`Request failed: ${res.status}`);
	}
	return (await res.json()) as T;
}

// Helpers with graceful fallbacks to placeholder data
export async function fetchCustomersSafe() {
	try {
		return await apiFetch<any[]>("/customers");
	} catch {
		return [
			{ id: "c1", name: "Kunde Alpha", city: "München", service_tags: ["Unterhaltsreinigung"], duration_minutes: 60, lat: 48.14, lng: 11.58, is_active: true },
			{ id: "c2", name: "Kunde Beta", city: "München", service_tags: ["Glasreinigung"], duration_minutes: 45, lat: 48.15, lng: 11.56, is_active: true },
		];
	}
}

export async function fetchEmployeesSafe() {
	try {
		return await apiFetch<any[]>("/employees");
	} catch {
		return [
			{ id: "e1", name: "Max Mustermann", is_active: true },
			{ id: "e2", name: "Erika Musterfrau", is_active: true },
		];
	}
}

export async function autoPlanSafe(payload: any) {
	try {
		return await apiFetch<any>("/planning/auto", "POST", payload);
	} catch {
		return {
			ordered_customers: [
				{ id: "c1", name: "Kunde Alpha", lat: 48.14, lng: 11.58, duration_minutes: 60, service_tags: ["Unterhaltsreinigung"] },
				{ id: "c2", name: "Kunde Beta", lat: 48.15, lng: 11.56, duration_minutes: 45, service_tags: ["Glasreinigung"] },
			],
			total_duration_minutes: 120,
		};
	}
}

export async function fetchAssignmentsSafe() {
	try {
		return await apiFetch<any[]>("/assignments");
	} catch {
		const today = new Date().toISOString().slice(0, 10);
		return [
			{ id: "a1", date: today, customer_id: "c1", employee_id: "e1", service_type: "Unterhaltsreinigung" },
			{ id: "a2", date: today, customer_id: "c2", employee_id: "e2", service_type: "Glasreinigung" },
			{ id: "a3", date: "2025-01-01", customer_id: "c1", employee_id: "e1", service_type: "Treppenhaus" },
		];
	}
}

export async function fetchPhotosByCustomer(customerId: string) {
	return await apiFetch<any[]>(`/photos/by-customer/${customerId}`);
}

export async function fetchPhotosByAppointment(appointmentId: string) {
	return await apiFetch<any[]>(`/photos/by-appointment/${appointmentId}`);
}

export async function uploadPhoto(formData: FormData) {
	const res = await fetch(`${API_BASE}/photos/upload`, {
		method: "POST",
		body: formData,
	});
	if (!res.ok) {
		throw new Error("Upload failed");
	}
	return await res.json();
}

export async function sharePhoto(photoId: string) {
	return await apiFetch<{ share_token: string; share_url: string }>(`/photos/${photoId}/share`, "POST");
}

export async function fetchInvoiceReminders() {
	try {
		return await apiFetch<any[]>("/invoice-reminders");
	} catch {
		// Fallback demo data
		return [
			{ id: "ir1", customer_name: "Kunde Alpha", amount: 150.00, due_date: "2025-01-15", status: "pending" },
			{ id: "ir2", customer_name: "Kunde Beta", amount: 280.50, due_date: "2025-01-20", status: "pending" },
		];
	}
}

export async function updateInvoiceReminder(id: string, status: string) {
	try {
		return await apiFetch<any>(`/invoice-reminders/${id}`, "PUT", { status });
	} catch {
		return { id, status };
	}
}


