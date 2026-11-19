import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ControlsTutorial, {
    COMPLETE_DELAY_MS,
    EXIT_DURATION_MS,
} from "./ControlsTutorial";

const renderTutorial = (
    props: Partial<React.ComponentProps<typeof ControlsTutorial>> = {}
) => {
    const onOpen = jest.fn();
    const onClose = jest.fn();
    const utils = render(
        <ControlsTutorial
            isOpen
            canOpen
            onOpen={onOpen}
            onClose={onClose}
            {...props}
        />
    );
    return { ...utils, onOpen, onClose };
};

const press = (code: string) => {
    fireEvent.keyDown(window, { code });
    fireEvent.keyUp(window, { code });
};

describe("ControlsTutorial", () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("shows every control", () => {
        renderTutorial();

        expect(screen.getByRole("dialog")).toBeInTheDocument();
        ["Walk", "Turn camera", "Slide camera", "Zoom"].forEach(label =>
            expect(screen.getByText(label)).toBeInTheDocument()
        );
    });

    it("lights up a key while it's held and ticks off its control", () => {
        renderTutorial();
        const keyA = screen.getByLabelText("A");

        fireEvent.keyDown(window, { code: "KeyA" });
        expect(keyA.className).toContain("pressed");
        expect(screen.getAllByLabelText("Done")).toHaveLength(1);

        fireEvent.keyUp(window, { code: "KeyA" });
        expect(keyA.className).not.toContain("pressed");
    });

    it("counts scrolling as trying zoom", () => {
        renderTutorial();

        fireEvent.wheel(window);

        expect(screen.getAllByLabelText("Done")).toHaveLength(1);
    });

    it("closes itself once every control has been tried", () => {
        const { onClose } = renderTutorial();

        ["ArrowUp", "KeyD", "KeyW", "KeyO"].forEach(press);
        expect(screen.getByText(/all set/i)).toBeInTheDocument();
        expect(onClose).not.toHaveBeenCalled();

        act(() => {
            jest.advanceTimersByTime(COMPLETE_DELAY_MS);
        });
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("closes on Enter or Escape", () => {
        const { onClose } = renderTutorial();

        fireEvent.keyDown(window, { code: "Enter" });
        fireEvent.keyDown(window, { code: "Escape" });

        expect(onClose).toHaveBeenCalledTimes(2);
    });

    it("swaps to a reopen button after closing, which H also triggers", () => {
        const { rerender, onOpen, onClose } = renderTutorial();

        rerender(
            <ControlsTutorial
                isOpen={false}
                canOpen
                onOpen={onOpen}
                onClose={onClose}
            />
        );
        act(() => {
            jest.advanceTimersByTime(EXIT_DURATION_MS);
        });

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        fireEvent.click(screen.getByLabelText("Show controls"));
        fireEvent.keyDown(window, { code: "KeyH" });
        expect(onOpen).toHaveBeenCalledTimes(2);
    });

    it("hides the reopen button and ignores H when it can't open", () => {
        const { onOpen } = renderTutorial({ isOpen: false, canOpen: false });

        fireEvent.keyDown(window, { code: "KeyH" });

        expect(
            screen.queryByLabelText("Show controls")
        ).not.toBeInTheDocument();
        expect(onOpen).not.toHaveBeenCalled();
    });
});
