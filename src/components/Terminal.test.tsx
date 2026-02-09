import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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

    it("handles resume command", async () => {
        render(<Terminal onCommand={jest.fn()} />);
        const input = screen.getByRole("textbox");
        fireEvent.change(input, { target: { value: "resume" } });
        fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
        await waitFor(() =>
            expect(
                screen.getAllByText(/devon wieczorek/i).length
            ).toBeGreaterThan(1)
        );
        expect(
            screen.getAllByText(/senior software engineer/i).length
        ).toBeGreaterThan(0);
    });

    it("handles contact command", async () => {
        render(<Terminal onCommand={jest.fn()} />);
        const input = screen.getByRole("textbox");
        fireEvent.change(input, { target: { value: "contact" } });
        fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
        await waitFor(() =>
            expect(
                screen.getByText(/devon.wieczorek@icloud.com/i)
            ).toBeInTheDocument()
        );
        expect(screen.getByText(/github/i)).toBeInTheDocument();
    });

    it("handles fun-fact command", async () => {
        render(<Terminal onCommand={jest.fn()} />);
        const input = screen.getByRole("textbox");
        fireEvent.change(input, { target: { value: "fun-fact" } });
        fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
        await waitFor(() =>
            expect(screen.getByText(/devon fun fact/i)).toBeInTheDocument()
        );
    });

    it("handles help command", async () => {
        render(<Terminal onCommand={jest.fn()} />);
        const input = screen.getByRole("textbox");
        fireEvent.change(input, { target: { value: "help" } });
        fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
        await waitFor(() =>
            expect(screen.getAllByText(/commands:/i).length).toBeGreaterThan(1)
        );
    });

    it("handles clear command", async () => {
        render(<Terminal onCommand={jest.fn()} />);
        const input = screen.getByRole("textbox");
        fireEvent.change(input, { target: { value: "clear" } });
        fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
        await waitFor(() =>
            expect(screen.queryByText(/commands:/i)).not.toBeInTheDocument()
        );
    });

    it("shows error for unknown command", async () => {
        render(<Terminal onCommand={jest.fn()} />);
        const input = screen.getByRole("textbox");
        fireEvent.change(input, { target: { value: "unknowncmd" } });
        fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
        await waitFor(() =>
            expect(
                screen.getByText(/command not recognized/i)
            ).toBeInTheDocument()
        );
    });
});
