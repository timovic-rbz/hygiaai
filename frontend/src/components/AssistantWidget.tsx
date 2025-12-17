"use client";
import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";

type Msg = { role: "user" | "assistant"; content: string };

export default function AssistantWidget() {
	const [open, setOpen] = useState(false);
	const [messages, setMessages] = useState<Msg[]>([
		{ role: "assistant", content: "Hallo! Wie kann ich heute bei der Planung helfen?" }
	]);
	const [input, setInput] = useState("");
	const [sending, setSending] = useState(false);
	const listRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (listRef.current) {
			listRef.current.scrollTop = listRef.current.scrollHeight;
		}
	}, [messages, open]);

	async function send() {
		const text = input.trim();
		if (!text) return;
		setInput("");
		setMessages(prev => [...prev, { role: "user", content: text }]);
		setSending(true);
		try {
			let reply = "Ich konnte keine Verbindung zum Backend herstellen. Dies ist eine Beispiel-Antwort.";
			try {
				const res = await apiFetch<{ reply: string }>("/assistant/query", "POST", { prompt: text });
				reply = res.reply || reply;
			} catch {}
			setMessages(prev => [...prev, { role: "assistant", content: reply }]);
		} finally {
			setSending(false);
		}
	}

	function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			void send();
		}
	}

	return (
		<>
			<button
				onClick={() => setOpen(v => !v)}
				className="fixed bottom-5 right-5 btn btn-primary shadow-card"
				aria-label="HygiaAI-Assistent"
			>
				HygiaAI‑Assistent
			</button>
			{open && (
				<div className="fixed bottom-20 right-5 w-[360px] max-w-[92vw] bg-gray-900/90 border border-white/10 rounded-xl shadow-card backdrop-blur">
					<div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
						<div className="font-medium">HygiaAI‑Assistent</div>
						<button className="btn btn-ghost" onClick={() => setOpen(false)}>Schließen</button>
					</div>
					<div ref={listRef} className="px-4 py-3 max-h-80 overflow-auto space-y-2">
						{messages.map((m, i) => (
							<div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
								<div className={`px-3 py-2 rounded-lg max-w-[80%] text-sm leading-relaxed ${m.role === "user" ? "bg-turquoise-500 text-black" : "bg-white/5 text-white"}`}>
									{m.content}
								</div>
							</div>
						))}
						{sending && (
							<div className="text-white/60 text-sm">Antwort wird erstellt…</div>
						)}
					</div>
					<div className="px-3 py-3 border-t border-white/10 flex gap-2">
						<input
							value={input}
							onChange={e => setInput(e.target.value)}
							onKeyDown={onKeyDown}
							className="input flex-1"
							placeholder="Nachricht eingeben…"
						/>
						<button onClick={send} disabled={sending || !input.trim()} className="btn btn-primary">Senden</button>
					</div>
				</div>
			)}
		</>
	);
}


