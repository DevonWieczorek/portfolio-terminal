import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import "../../../__mocks__/threeTestHarness";
import {
    resetThreeTestState,
    runFrameCallbacks,
} from "../../../__mocks__/threeTestHarness";
import MonitorScreen from "./MonitorScreen";

function createContextMock() {
    return {
        canvas: { width: 512, height: 427 },
        fillRect: jest.fn(),
        fillText: jest.fn(),
        measureText: jest.fn(() => ({ width: 100 })),
        createRadialGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
    };
}

describe("MonitorScreen", () => {
    let context: ReturnType<typeof createContextMock>;
    let getContextSpy: jest.SpyInstance;

    beforeEach(() => {
        resetThreeTestState();
        context = createContextMock();
        getContextSpy = jest
            .spyOn(HTMLCanvasElement.prototype, "getContext")
            // getContext is overloaded per context type, so cast the stub
            .mockImplementation(
                (() => context) as unknown as HTMLCanvasElement["getContext"]
            );
    });

    afterEach(() => {
        getContextSpy.mockRestore();
    });

    it("renders a screen plane", () => {
        const { container } = render(<MonitorScreen />);

        expect(container.querySelector("planegeometry")).toBeInTheDocument();
    });

    it("types the session out over time", () => {
        render(<MonitorScreen />);

        runFrameCallbacks(0);
        const typedAtStart = context.fillText.mock.calls.map(([text]) => text);
        expect(typedAtStart).toEqual(["devon@portfolio:~$ "]);

        context.fillText.mockClear();
        // Past the typing animation, but before the loop restarts
        runFrameCallbacks(5);
        const typedLater = context.fillText.mock.calls.map(([text]) => text);
        expect(typedLater).toContain("devon@portfolio:~$ whoami");
        expect(typedLater).toContain("Devon Wieczorek");
    });

    it("only redraws when the visible frame changes", () => {
        render(<MonitorScreen />);

        runFrameCallbacks(0);
        const drawCount = context.fillText.mock.calls.length;
        runFrameCallbacks(0.01);

        expect(context.fillText).toHaveBeenCalledTimes(drawCount);
    });
});
