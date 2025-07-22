import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Terminal from "./Terminal";

beforeAll(() => {
	window.scrollTo = jest.fn();
});

describe("Terminal", () => {
	it("renders and shows help and clear output on mount", () => {
		render(<Terminal onCommand={jest.fn()} />);
		expect(screen.getByText(/commands:/i)).toBeInTheDocument();
		expect(screen.getByText(/help/i)).toBeInTheDocument();
	});

	it("handles resume command", () => {
		render(<Terminal onCommand={jest.fn()} />);
		const input = screen.getByRole("textbox");
		fireEvent.change(input, { target: { value: "resume" } });
		fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
		expect(screen.getByText(/devon wieczorek/i)).toBeInTheDocument();
		expect(
			screen.getByText(/senior software engineer/i)
		).toBeInTheDocument();
	});

	it("handles contact command", () => {
		render(<Terminal onCommand={jest.fn()} />);
		const input = screen.getByRole("textbox");
		fireEvent.change(input, { target: { value: "contact" } });
		fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
		expect(
			screen.getByText(/devon.wieczorek@icloud.com/i)
		).toBeInTheDocument();
		expect(screen.getByText(/github/i)).toBeInTheDocument();
	});

	it("handles fun-fact command", () => {
		render(<Terminal onCommand={jest.fn()} />);
		const input = screen.getByRole("textbox");
		fireEvent.change(input, { target: { value: "fun-fact" } });
		fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
		expect(screen.getByText(/devon fun fact/i)).toBeInTheDocument();
	});

	it("handles help command", () => {
		render(<Terminal onCommand={jest.fn()} />);
		const input = screen.getByRole("textbox");
		fireEvent.change(input, { target: { value: "help" } });
		fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
		expect(screen.getByText(/commands:/i)).toBeInTheDocument();
	});

	it("handles clear command", () => {
		render(<Terminal onCommand={jest.fn()} />);
		const input = screen.getByRole("textbox");
		fireEvent.change(input, { target: { value: "clear" } });
		fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
		// After clear, help is shown again
		expect(screen.getByText(/commands:/i)).toBeInTheDocument();
	});

	it("shows error for unknown command", () => {
		render(<Terminal onCommand={jest.fn()} />);
		const input = screen.getByRole("textbox");
		fireEvent.change(input, { target: { value: "unknowncmd" } });
		fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
		expect(screen.getByText(/command not recognized/i)).toBeInTheDocument();
	});
});
