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
        const realUseRef = React.useRef;
        let callCount = 0;

        const useRefSpy = jest
            .spyOn(React, "useRef")
            .mockImplementation((initialValue: unknown) => {
                callCount += 1;
                if (callCount === 1) {
                    return { current: null } as React.MutableRefObject<unknown>;
                }
                return realUseRef(initialValue);
            });

        const { container } = render(
            <BoundingBox>
                <mesh />
            </BoundingBox>
        );

        expect(container.querySelectorAll("group").length).toBeGreaterThan(0);
        useRefSpy.mockRestore();
    });
});
