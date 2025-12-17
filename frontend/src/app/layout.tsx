import "../styles/globals.css";
import type { Metadata } from "next";
import AssistantWidget from "@/components/AssistantWidget";
import TimerWidget from "@/components/TimerWidget";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";

export const metadata: Metadata = {
	title: "HygiaAI",
	description: "Intelligentes Planungstool für Gebäudereinigungen",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="de">
			<body className="bg-[radial-gradient(circle_at_top,_rgba(20,184,155,0.08),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.12),_transparent_55%),#050b16]">
				<div className="flex min-h-screen text-white">
					<Sidebar />
					<main className="flex-1 px-4 py-6 md:px-8">
						<div className="mx-auto flex max-w-6xl flex-col gap-6">
							<TopBar />
							{children}
						</div>
					</main>
				</div>
				<TimerWidget />
				<AssistantWidget />
			</body>
		</html>
	);
}
