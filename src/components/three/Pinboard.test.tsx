import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import "../../../__mocks__/threeTestHarness";
import {
    resetThreeTestState,
    useGLTFMock,
} from "../../../__mocks__/threeTestHarness";
import Pinboard from "./Pinboard";

describe("Pinboard", () => {
    beforeEach(() => {
        resetThreeTestState();
    });

    it("renders the pinboard model from scene config", () => {
        const { container } = render(<Pinboard />);

        expect(useGLTFMock).toHaveBeenCalledWith(
            "/models/cartoon_pinboard.glb"
        );
        expect(container.querySelector("primitive")).toBeInTheDocument();
    });
});
