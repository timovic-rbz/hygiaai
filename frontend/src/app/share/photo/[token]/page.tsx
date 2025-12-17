"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function SharedPhotoPage() {
	const params = useParams<{ token: string }>();
	const [photo, setPhoto] = useState<any>(null);
	const [error, setError] = useState<string>("");

	useEffect(() => {
		if (!params?.token) return;
		(async () => {
			try {
				const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
				const res = await fetch(`${apiBase}/share/photo/${params.token}`);
				if (!res.ok) throw new Error("not found");
				setPhoto(await res.json());
			} catch {
				setError("Dieses Foto konnte nicht geladen werden.");
			}
		})();
	}, [params?.token]);

	if (error) {
		return <div className="p-8 text-center text-red-400">{error}</div>;
	}

	if (!photo) {
		return <div className="p-8 text-center text-white/60">Lade Foto …</div>;
	}

	const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
	const url = photo.file_url?.startsWith("http") ? photo.file_url : `${apiBase}${photo.file_url}`;

	return (
		<div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-gray-950 text-white">
			<div className="max-w-3xl w-full bg-gray-900 p-4 rounded-xl">
				<h1 className="text-xl font-semibold mb-2">Foto-Dokumentation</h1>
				<img src={url} alt="Shared" className="rounded-lg w-full object-contain max-h-[70vh]" />
				<div className="mt-3 text-sm text-white/70">{photo.note || "Keine Notiz"}</div>
				<div className="text-xs text-white/50 mt-1">
					Hochgeladen am {new Date(photo.created_at).toLocaleString("de-DE")}
				</div>
			</div>
		</div>
	);
}

