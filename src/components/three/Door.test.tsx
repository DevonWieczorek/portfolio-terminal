import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import "../../../__mocks__/threeTestHarness";
import {
    resetThreeTestState,
    useGLTFMock,
} from "../../../__mocks__/threeTestHarness";
import Door from "./Door";

describe("Door", () => {
    beforeEach(() => {
        resetThreeTestState();
    });

    it("renders the door model on the wall from scene config", () => {
        const { container } = render(<Door />);

        expect(useGLTFMock).toHaveBeenCalledWith("/models/cartoon_door.glb");
        expect(container.querySelector("primitive")).toBeInTheDocument();
    });
});
