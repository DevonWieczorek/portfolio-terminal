import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import AskGPT from "./AskGPT";

// Mock fetch for OpenAI API
beforeEach(() => {
    global.fetch = jest.fn(() =>
        Promise.resolve({
            ok: true,
            json: () =>
                Promise.resolve({ response: "Test response from GPT." }),
        })
    ) as jest.Mock;
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("AskGPT", () => {
    it("renders input and submit button", () => {
        render(<AskGPT onShowResponse={jest.fn()} />);
        expect(
            screen.getByPlaceholderText(/ask a question to devon-gpt/i)
        ).toBeInTheDocument();
    });

    it("submits a query and displays response", async () => {
        render(<AskGPT onShowResponse={jest.fn()} />);
        const input = screen.getByPlaceholderText(
            /ask a question to devon-gpt/i
        );
        fireEvent.change(input, { target: { value: "What is your name?" } });
        fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
        await waitFor(() =>
            expect(
                screen.getByText(/test response from gpt/i)
            ).toBeInTheDocument()
        );
    });

    it("shows loading indicator when fetching", async () => {
        let resolveFetch: any;
        (global.fetch as jest.Mock).mockImplementationOnce(
            () =>
                new Promise(resolve => {
                    resolveFetch = resolve;
                })
        );
        render(<AskGPT onShowResponse={jest.fn()} />);
        const input = screen.getByPlaceholderText(
            /ask a question to devon-gpt/i
        );
        fireEvent.change(input, { target: { value: "Loading test" } });
        fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
        resolveFetch({
            ok: true,
            json: () => Promise.resolve({ response: "Done" }),
        });
        await waitFor(() =>
            expect(screen.getByText(/done/i)).toBeInTheDocument()
        );
    });
});
