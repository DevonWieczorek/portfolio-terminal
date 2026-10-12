import React from "react";
import { act, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import "../../../__mocks__/threeTestHarness";
import {
    resetThreeTestState,
    setProgress,
} from "../../../__mocks__/threeTestHarness";
import LoadingScreen, {
    labelForAsset,
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

        expect(screen.getAllByText(/waxing skate decks/)).toHaveLength(1);
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

    it("unmounts after the reveal animation", () => {
        render(<LoadingScreen isReady />);

        expect(screen.getByRole("status")).toBeInTheDocument();

        act(() => {
            jest.advanceTimersByTime(REVEAL_DURATION_MS);
        });

        expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
});
