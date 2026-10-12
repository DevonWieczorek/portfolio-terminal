import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import "../../../__mocks__/threeTestHarness";
import { resetThreeTestState } from "../../../__mocks__/threeTestHarness";
import Lights from "./Lights";

describe("Lights", () => {
    beforeEach(() => {
        resetThreeTestState();
    });

    it("renders ambient fill, an overhead key light, and ceiling fixtures", () => {
        const { container } = render(<Lights />);

        expect(container.querySelectorAll("hemispherelight")).toHaveLength(1);
        expect(container.querySelectorAll("directionallight")).toHaveLength(1);
        expect(container.querySelectorAll("pointlight")).toHaveLength(4);
    });

    it("bakes a panel per fixture plus two rims into the environment", () => {
        render(<Lights />);

        expect(screen.getByTestId("environment")).toBeInTheDocument();
        expect(screen.getAllByTestId("lightformer")).toHaveLength(6);
    });
});
