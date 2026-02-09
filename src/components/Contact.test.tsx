import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Contact from "./Contact";

describe("Contact", () => {
    it("renders contact email and github link", () => {
        render(<Contact />);
        expect(
            screen.getByText(/devon.wieczorek@icloud.com/i)
        ).toBeInTheDocument();
        expect(screen.getByText(/github/i)).toBeInTheDocument();
        expect(
            screen.getByRole("link", { name: /devon.wieczorek@icloud.com/i })
        ).toHaveAttribute(
            "href",
            expect.stringContaining("mailto:devon.wieczorek@icloud.com")
        );
        expect(screen.getByRole("link", { name: /github/i })).toHaveAttribute(
            "href",
            expect.stringMatching(/github\.com\/devonwieczorek/i)
        );
    });
});
