import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import "../../../__mocks__/threeTestHarness";
import {
    resetThreeTestState,
    useTextureMock,
} from "../../../__mocks__/threeTestHarness";
import PictureFrames from "./PictureFrames";

describe("PictureFrames", () => {
    beforeEach(() => {
        resetThreeTestState();
    });

    it("renders a mat and print for every frame", () => {
        const { container } = render(<PictureFrames />);

        expect(container.querySelectorAll("boxGeometry")).toHaveLength(4);
        expect(container.querySelectorAll("planeGeometry")).toHaveLength(4);
    });

    it("loads a texture only for frames with an image", () => {
        render(<PictureFrames />);

        expect(useTextureMock).toHaveBeenCalledTimes(1);
        expect(useTextureMock).toHaveBeenCalledWith("/img/frames/photo-1.jpg");
    });
});
