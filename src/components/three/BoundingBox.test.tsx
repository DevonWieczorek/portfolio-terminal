import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import "../../../__mocks__/threeTestHarness";
import { resetThreeTestState } from "../../../__mocks__/threeTestHarness";
import BoundingBox from "./BoundingBox";

describe("BoundingBox", () => {
    beforeEach(() => {
        resetThreeTestState();
    });

    it("renders children and wrapper groups", () => {
        const useEffectSpy = jest
            .spyOn(React, "useEffect")
            .mockImplementation(() => {});

        const { container } = render(
            <BoundingBox>
                <mesh />
            </BoundingBox>
        );

        expect(container.querySelectorAll("group").length).toBeGreaterThan(0);
        useEffectSpy.mockRestore();
    });
});
