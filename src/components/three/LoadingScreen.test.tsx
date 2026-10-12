import React from "react";
import { act, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import "../../../__mocks__/threeTestHarness";
import {
    resetThreeTestState,
    sceneState,
    setProgress,
} from "../../../__mocks__/threeTestHarness";
import LoadingScreen, {
    labelForAsset,
    LINE_STAGGER_MS,
    REVEAL_DURATION_MS,
} from "./LoadingScreen";

describe("LoadingScreen", () => {
    beforeEach(() => {
        resetThreeTestState();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("maps asset urls to friendly boot log labels", () => {
        expect(labelForAsset("/models/l_shaped_desk.glb")).toBe(
            "assembling desk"
        );
        expect(labelForAsset("/models/bass-guitar-configurable.glb")).toBe(
            "tuning bass"
        );
        expect(labelForAsset("/textures/unknown_thing.png")).toBe(
            "loading unknown_thing"
        );
        expect(labelForAsset("blob:http://localhost/af289f7c")).toBeNull();
    });

    it("logs each loaded asset once", () => {
        render(<LoadingScreen isReady={false} />);

        act(() => setProgress({ item: "/img/duck-hunt-deck.jpg" }));
        act(() => setProgress({ item: "/img/manson-deck.png" }));
        act(() => {
            jest.advanceTimersByTime(LINE_STAGGER_MS * 2);
        });

        expect(screen.getAllByText(/waxing skate decks/)).toHaveLength(1);
    });

    it("prints lines that load together one at a time", () => {
        const { rerender } = render(<LoadingScreen isReady={false} />);

        act(() => setProgress({ item: "/models/l_shaped_desk.glb" }));
        act(() => setProgress({ item: "/models/monitor.glb" }));
        rerender(<LoadingScreen isReady />);

        expect(screen.queryByText(/assembling desk/)).not.toBeInTheDocument();

        act(() => {
            jest.advanceTimersByTime(LINE_STAGGER_MS);
        });

        expect(screen.getByText(/assembling desk/)).toBeInTheDocument();
        expect(
            screen.queryByText(/plugging in monitor/)
        ).not.toBeInTheDocument();
        expect(screen.queryByText(/welcome in/)).not.toBeInTheDocument();

        act(() => {
            jest.advanceTimersByTime(LINE_STAGGER_MS);
        });

        expect(screen.getByText(/plugging in monitor/)).toBeInTheDocument();
        expect(screen.getByText(/welcome in/)).toBeInTheDocument();
    });

    it("holds progress below 100 until the room is ready", () => {
        setProgress({ progress: 100 });
        const { rerender } = render(<LoadingScreen isReady={false} />);

        expect(screen.getByRole("progressbar")).toHaveAttribute(
            "aria-valuenow",
            "99"
        );

        rerender(<LoadingScreen isReady />);

        expect(screen.getByRole("progressbar")).toHaveAttribute(
            "aria-valuenow",
            "100"
        );
    });

    it("stays up for the minimum duration, then reveals and unmounts", () => {
        render(<LoadingScreen isReady />);

        act(() => {
            jest.advanceTimersByTime(sceneState.loaderMinDuration - 1);
        });

        expect(screen.getByRole("status")).not.toHaveClass("revealing");

        act(() => {
            jest.advanceTimersByTime(1);
        });

        expect(screen.getByRole("status")).toHaveClass("revealing");

        act(() => {
            jest.advanceTimersByTime(REVEAL_DURATION_MS);
        });

        expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("reveals right away when loading outlasts the minimum duration", () => {
        const { rerender } = render(<LoadingScreen isReady={false} />);

        act(() => {
            jest.advanceTimersByTime(sceneState.loaderMinDuration + 500);
        });
        rerender(<LoadingScreen isReady />);
        act(() => {
            jest.advanceTimersByTime(0);
        });

        expect(screen.getByRole("status")).toHaveClass("revealing");
    });
});
