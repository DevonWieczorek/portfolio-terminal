import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import "../../../__mocks__/threeTestHarness";
import {
    resetThreeTestState,
    useGLTFMock,
} from "../../../__mocks__/threeTestHarness";
import Bass from "./Bass";

describe("Bass", () => {
    beforeEach(() => {
        resetThreeTestState();
    });

    it("renders and loads the default bass model", () => {
        const { container } = render(<Bass position={[0, 1, 2]} />);

        expect(useGLTFMock).toHaveBeenCalledWith("/models/bass-1.glb");
        expect(container.querySelector("primitive")).toBeInTheDocument();
    });
});
