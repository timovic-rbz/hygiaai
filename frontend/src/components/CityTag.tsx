import clsx from "clsx";
import { MapPin } from "lucide-react";
import { createCityToken } from "@/config/cityColors";

interface CityTagProps {
	city?: string | null;
	className?: string;
	showIcon?: boolean;
	compact?: boolean;
}

export default function CityTag({ city, className, showIcon = true, compact = false }: CityTagProps) {
	const label = city || "Unbekannt";
	const token = createCityToken(city);

	return (
		<span
			className={clsx(
				"inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold transition",
				compact && "text-[10px] px-2",
				className,
			)}
			style={{
				backgroundColor: token.background,
				borderColor: token.border,
				color: token.text,
				boxShadow: `0 8px 20px ${token.shadow}`,
			}}
		>
			{showIcon && <MapPin className="h-3.5 w-3.5" style={{ color: token.color }} />}
			<span>{label}</span>
		</span>
	);
}
