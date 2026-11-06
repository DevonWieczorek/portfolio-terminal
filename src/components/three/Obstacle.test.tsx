import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import "../../../__mocks__/threeTestHarness";
import { resetThreeTestState } from "../../../__mocks__/threeTestHarness";
import Obstacle from "./Obstacle";

describe("Obstacle", () => {
    beforeEach(() => {
        resetThreeTestState();
    });

    it("renders a collider at its position", () => {
        const { container } = render(
            <Obstacle size={[2, 4, 6]} position={[1, 2, 3]} />
        );

        expect(
            container.querySelector("object3D[name='cuboid-collider']")
        ).toBeInTheDocument();
    });
});
