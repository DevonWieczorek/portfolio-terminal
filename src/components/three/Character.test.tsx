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

        const { container } = render(<Character />);

        expect(container.querySelector("group")).toBeInTheDocument();
        useRefSpy.mockRestore();
    });
});
