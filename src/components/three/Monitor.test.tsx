import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import "../../../__mocks__/threeTestHarness";
import {
    resetThreeTestState,
    useGLTFMock,
} from "../../../__mocks__/threeTestHarness";
import Monitor from "./Monitor";

describe("Monitor", () => {
    beforeEach(() => {
        resetThreeTestState();
    });

    it("renders and loads the monitor model", () => {
        const { container } = render(<Monitor proximityPosition={[0, 0, 0]} />);

        expect(useGLTFMock).toHaveBeenCalledWith("/models/monitor.glb");
        expect(container.querySelector("primitive")).toBeInTheDocument();
    });
});
