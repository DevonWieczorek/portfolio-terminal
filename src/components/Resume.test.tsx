import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Resume from "./Resume";

describe("Resume", () => {
	it("renders name, title, and contact info", () => {
		render(<Resume />);
		expect(screen.getByText(/devon wieczorek/i)).toBeInTheDocument();
    expect(
        screen.getAllByText(/senior software engineer/i).length
    ).toBeGreaterThan(0);
		expect(
			screen.getByText(/devon.wieczorek@icloud.com/i)
		).toBeInTheDocument();
		expect(
			screen.getByText(/linkedin.com\/in\/devonwieczorek/i)
		).toBeInTheDocument();
		expect(
			screen.getByText(/github.com\/devonwieczorek/i)
		).toBeInTheDocument();
	});

	it("renders professional summary, skills, and experience sections", () => {
		render(<Resume />);
		expect(screen.getByText(/professional summary/i)).toBeInTheDocument();
		expect(screen.getByText(/skills/i)).toBeInTheDocument();
		expect(
			screen.getByText(/professional experience/i)
		).toBeInTheDocument();
	});
});
