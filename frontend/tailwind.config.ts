import type { Config } from "tailwindcss";

const config: Config = {
	darkMode: "class",
	content: [
		"./src/app/**/*.{ts,tsx}",
		"./src/components/**/*.{ts,tsx}",
	],
	theme: {
		extend: {
			fontFamily: {
				sans: ["'Inter'", "system-ui", "sans-serif"],
			},
			colors: {
				brand: {
					50: "#e8fbf6",
					100: "#c8f4e6",
					200: "#a1ead5",
					300: "#6edfc3",
					400: "#3fd3b1",
					500: "#14b89b",
					600: "#0a9b82",
					700: "#0a7a67",
					800: "#095f51",
					900: "#074d43",
				},
				navy: {
					900: "#050b16",
					800: "#0b1425",
					700: "#0f1d36",
					600: "#132545",
				},
				surface: {
					DEFAULT: "#0f172a",
					100: "#111c30",
					200: "#15233e",
					300: "#1d2f52",
				},
			},
			boxShadow: {
				card: "0 20px 45px rgba(15,23,42,0.25)",
				soft: "0 4px 30px rgba(54, 78, 113, 0.15)",
			},
			borderRadius: {
				xl: "1.25rem",
				"2xl": "1.75rem",
			},
			animation: {
				"fade-in": "fade-in 0.3s ease forwards",
			},
			keyframes: {
				"fade-in": {
					from: { opacity: "0", transform: "translateY(4px)" },
					to: { opacity: "1", transform: "translateY(0)" },
				},
			},
		},
	},
	plugins: [],
};

export default config;


