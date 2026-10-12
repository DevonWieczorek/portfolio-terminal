import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import "../../../__mocks__/threeTestHarness";
import { resetThreeTestState } from "../../../__mocks__/threeTestHarness";
import Effects from "./Effects";

describe("Effects", () => {
    beforeEach(() => {
        resetThreeTestState();
    });

    it("renders bloom from the scene settings", () => {
        render(<Effects />);

        const bloom = screen.getByTestId("bloom");
        expect(bloom).toHaveAttribute("data-intensity", "1.2");
        expect(bloom).toHaveAttribute("data-threshold", "1");
    });

    it("renders ambient occlusion from the scene settings", () => {
        render(<Effects />);

        const ao = screen.getByTestId("n8ao");
        expect(ao).toHaveAttribute("data-intensity", "3");
        expect(ao).toHaveAttribute("data-radius", "2");
    });

    it("renders a vignette from the scene settings", () => {
        render(<Effects />);

        const vignette = screen.getByTestId("vignette");
        expect(vignette).toHaveAttribute("data-offset", "0.3");
        expect(vignette).toHaveAttribute("data-darkness", "0.45");
    });

    it("restores ACES tone mapping as the final pass", () => {
        render(<Effects />);

        expect(screen.getByTestId("tone-mapping")).toHaveAttribute(
            "data-mode",
            "6"
        );
    });
});
