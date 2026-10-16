import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import "../../../__mocks__/threeTestHarness";
import {
    resetThreeTestState,
    useGLTFMock,
} from "../../../__mocks__/threeTestHarness";
import Shelf from "./Shelf";

describe("Shelf", () => {
    beforeEach(() => {
        resetThreeTestState();
    });

    it("renders the shelf model from scene config", () => {
        const { container } = render(<Shelf />);

        expect(useGLTFMock).toHaveBeenCalledWith("/models/cartoon_shelf.glb");
        expect(container.querySelector("primitive")).toBeInTheDocument();
    });
});
