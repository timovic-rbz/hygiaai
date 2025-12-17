import { cn } from "@/lib/cn";
import { HTMLAttributes } from "react";

type BadgeVariant = "default" | "success" | "warning" | "danger";

const variants: Record<BadgeVariant, string> = {
	default: "",
	success: "badge-success",
	warning: "badge-warning",
	danger: "badge-danger",
};

export function Badge({ className, variant = "default", ...props }: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
	return (
		<span
			className={cn("badge", variants[variant], className)}
			{...props}
		/>
	);
}

