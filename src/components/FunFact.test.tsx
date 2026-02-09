import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import FunFact from "./FunFact";

describe("FunFact", () => {
    it("renders a fun fact", () => {
        render(<FunFact />);
        expect(screen.getByText(/devon fun fact/i)).toBeInTheDocument();
        // At least one of the initial fun facts should be present
        expect(
            [
                /film buff/i,
                /skateboarding company/i,
                /musician/i,
                /travel/i,
            ].some(regex => screen.queryByText(regex))
        ).toBe(true);
    });
});
