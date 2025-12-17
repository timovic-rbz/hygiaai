export const CITY_COLORS_RAW: Record<string, string> = {
    "Leverkusen": "#1F77FF",
    "Köln": "#FF3838",
    "Langenfeld": "#00C853",
    "Monheim": "#FF9500",
    "Düsseldorf": "#AF52DE",
    "Opladen": "#00A8E8",
    "Solingen": "#FFC300",
    "Wersten (D'dorf)": "#FF5EBC",
    "Haan": "#2ECC40",
    "Hilden": "#8E5A2F",
    "Erkrath": "#4A4A4A",
    "Baumberg": "#2E7D32",
};

const NORMALIZED = Object.fromEntries(
    Object.entries(CITY_COLORS_RAW).map(([city, color]) => [city.trim().toLowerCase(), color]),
);

export const DEFAULT_CITY_COLOR = "#999999";

export function normalizeCity(city?: string | null) {
    return city?.trim().toLowerCase() || null;
}

export function getCityColor(city?: string | null) {
    const normalized = normalizeCity(city);
    if (!normalized) return DEFAULT_CITY_COLOR;
    return NORMALIZED[normalized] || DEFAULT_CITY_COLOR;
}

export function hexToRgb(hex: string) {
    let normalized = hex.replace("#", "");
    if (normalized.length === 3) {
        normalized = normalized
            .split("")
            .map((c) => c + c)
            .join("");
    }
    const bigint = parseInt(normalized, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return { r, g, b };
}

export function hexToRgba(hex: string, alpha = 1) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${Math.min(1, Math.max(0, alpha))})`;
}

export function getReadableTextColor(hex: string) {
    const { r, g, b } = hexToRgb(hex);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? "#04111d" : "#f5f7fb";
}

export function createCityToken(city?: string | null) {
    const color = getCityColor(city);
    return {
        color,
        background: hexToRgba(color, 0.18),
        border: hexToRgba(color, 0.45),
        shadow: hexToRgba(color, 0.25),
        text: getReadableTextColor(color),
    };
}
