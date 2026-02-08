import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import "../../../__mocks__/threeTestHarness";
import { resetThreeTestState } from "../../../__mocks__/threeTestHarness";
import Character from "./Character";

describe("Character", () => {
    beforeEach(() => {
        resetThreeTestState();
    });

    it("renders character geometry", () => {
        const useEffectSpy = jest
            .spyOn(React, "useEffect")
            .mockImplementation(() => {});

        const { container } = render(<Character />);

        expect(container.querySelector("group")).toBeInTheDocument();
        useEffectSpy.mockRestore();
    });
});
