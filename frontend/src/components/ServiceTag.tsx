type Props = { label: string };

const colorMap: Record<string, string> = {
	"glasreinigung": "bg-blue-500/20 text-blue-300 border-blue-500/30",
	"treppenhaus": "bg-green-500/20 text-green-300 border-green-500/30",
	"treppenhausreinigung": "bg-green-500/20 text-green-300 border-green-500/30",
	"unterhalt": "bg-orange-500/20 text-orange-300 border-orange-500/30",
	"unterhaltsreinigung": "bg-orange-500/20 text-orange-300 border-orange-500/30",
	"photovoltaik": "bg-teal-500/20 text-teal-300 border-teal-500/30",
	"photovoltaikreinigung": "bg-teal-500/20 text-teal-300 border-teal-500/30",
	"sonder": "bg-purple-500/20 text-purple-300 border-purple-500/30",
	"sonderreinigung": "bg-purple-500/20 text-purple-300 border-purple-500/30",
};

export default function ServiceTag({ label }: Props) {
	const key = (label || "").toLowerCase();
	const cls = Object.keys(colorMap).find(k => key.includes(k));
	const color = cls ? colorMap[cls] : "bg-white/10 text-white/80 border-white/20";
	return (
		<span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${color}`}>
			{label}
		</span>
	);
}


