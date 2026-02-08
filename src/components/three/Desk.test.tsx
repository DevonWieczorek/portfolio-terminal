import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import "../../../__mocks__/threeTestHarness";
import {
    resetThreeTestState,
    useGLTFMock,
} from "../../../__mocks__/threeTestHarness";
import Desk from "./Desk";

describe("Desk", () => {
    beforeEach(() => {
        resetThreeTestState();
    });

    it("renders desk and monitor models", () => {
        const { container } = render(<Desk proximityPosition={[0, 0, 0]} />);

        expect(useGLTFMock).toHaveBeenCalledWith("/models/l_shaped_desk.glb");
        expect(
            container.querySelectorAll("primitive").length
        ).toBeGreaterThanOrEqual(2);
    });
});
