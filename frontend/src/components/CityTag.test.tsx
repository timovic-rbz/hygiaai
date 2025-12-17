import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CityTag from "./CityTag";

describe("CityTag", () => {
	it("renders the label and icon by default", () => {
		render(<CityTag city="Köln" />);
		expect(screen.getByText("Köln")).toBeInTheDocument();
	});

	it("falls back to neutral label when city missing", () => {
		render(<CityTag city={undefined} showIcon={false} />);
		expect(screen.getByText("Unbekannt")).toBeInTheDocument();
	});

	it("applies compact styling", () => {
		render(<CityTag city="Leverkusen" compact showIcon={false} />);
		const tag = screen.getByText("Leverkusen").closest("span");
		expect(tag).toHaveClass("text-[10px]");
	});
});
