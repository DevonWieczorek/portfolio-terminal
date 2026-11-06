import React from "react";
import { act, renderHook } from "@testing-library/react";
import { MessageProvider, useMessage } from "./MessageContext";

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MessageProvider>{children}</MessageProvider>
);

describe("MessageContext", () => {
    it("clears any message when called without text", () => {
        const { result } = renderHook(useMessage, { wrapper });

        act(() => result.current.setMessage("Hello"));
        act(() => result.current.clearMessage());

        expect(result.current.message).toBe("");
    });

    it("clears only the matching message when given text", () => {
        const { result } = renderHook(useMessage, { wrapper });

        act(() => result.current.setMessage("Newer"));
        act(() => result.current.clearMessage("Older"));

        expect(result.current.message).toBe("Newer");

        act(() => result.current.clearMessage("Newer"));

        expect(result.current.message).toBe("");
    });
});
