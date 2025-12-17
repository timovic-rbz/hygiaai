import { describe, expect, it } from "vitest";
import { CITY_COLORS_RAW, DEFAULT_CITY_COLOR, getCityColor, createCityToken } from "./cityColors";

describe("city color mapping", () => {
	it("returns configured colors case-insensitively", () => {
		for (const [city, hex] of Object.entries(CITY_COLORS_RAW)) {
			expect(getCityColor(city)).toBe(hex);
			expect(getCityColor(city.toUpperCase())).toBe(hex);
		}
	});

	it("falls back to default when city unknown", () => {
		expect(getCityColor("Nichtliste")) .toBe(DEFAULT_CITY_COLOR);
		expect(getCityColor(undefined)).toBe(DEFAULT_CITY_COLOR);
	});

	it("creates token with derived rgba values", () => {
		const token = createCityToken("Köln");
		expect(token.color).toBe(CITY_COLORS_RAW["Köln"]);
		expect(token.background).toContain("rgba");
		expect(token.text.length).toBeGreaterThan(0);
	});
});
