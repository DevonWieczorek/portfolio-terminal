import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import "../../../__mocks__/threeTestHarness";
import {
    resetThreeTestState,
    useGLTFMock,
} from "../../../__mocks__/threeTestHarness";
import Skateboard from "./Skateboard";

describe("Skateboard", () => {
    beforeEach(() => {
        resetThreeTestState();
    });

    it("renders and loads the default skateboard model", () => {
        const { container } = render(<Skateboard position={[0, 0, 0]} />);

        expect(useGLTFMock).toHaveBeenCalledWith(
            "/models/skateboard_deck_2.glb"
        );
        expect(container.querySelector("primitive")).toBeInTheDocument();
    });
});
