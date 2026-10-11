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
    jest.restoreAllMocks();
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

    it("displays the server error message on a non-ok response", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            json: () =>
                Promise.resolve({
                    error: "devon-gpt is temporarily unavailable.",
                }),
        });
        render(<AskGPT onShowResponse={jest.fn()} />);
        const input = screen.getByPlaceholderText(
            /ask a question to devon-gpt/i
        );
        fireEvent.change(input, { target: { value: "Quota test" } });
        fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
        await waitFor(() =>
            expect(
                screen.getByText(/devon-gpt is temporarily unavailable/i)
            ).toBeInTheDocument()
        );
    });

    it("shows the generic error when a successful response is not JSON", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.reject(new SyntaxError("Unexpected end")),
        });
        jest.spyOn(console, "error").mockImplementation(() => {});
        render(<AskGPT onShowResponse={jest.fn()} />);
        const input = screen.getByPlaceholderText(
            /ask a question to devon-gpt/i
        );
        fireEvent.change(input, { target: { value: "Bad body test" } });
        fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
        await waitFor(() =>
            expect(
                screen.getByText(/an error occurred while processing/i)
            ).toBeInTheDocument()
        );
    });

    it("shows the generic error when an error response is not JSON", async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            json: () => Promise.reject(new SyntaxError("Unexpected token")),
        });
        jest.spyOn(console, "error").mockImplementation(() => {});
        render(<AskGPT onShowResponse={jest.fn()} />);
        const input = screen.getByPlaceholderText(
            /ask a question to devon-gpt/i
        );
        fireEvent.change(input, { target: { value: "Bad error body" } });
        fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
        await waitFor(() =>
            expect(
                screen.getByText(/an error occurred while processing/i)
            ).toBeInTheDocument()
        );
    });
});
