import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as THREE from "three";
import "../../../__mocks__/threeTestHarness";
import {
    messageState,
    resetThreeTestState,
    useTextureMock,
} from "../../../__mocks__/threeTestHarness";
import { INTRO_MESSAGE } from "@/lib/constants/sceneMessages";
import Room from "./Room";

describe("Room", () => {
    beforeEach(() => {
        resetThreeTestState();
    });

    it("renders floor and room walls", () => {
        const { container } = render(<Room />);

        expect(useTextureMock).toHaveBeenCalledWith({
            map: "/textures/floor_albedo.jpg",
            normalMap: "/textures/floor_normal.jpg",
        });
        expect(useTextureMock).toHaveBeenCalledWith({
            map: "/textures/wall_albedo.jpg",
        });
        expect(
            container.querySelectorAll("mesh").length
        ).toBeGreaterThanOrEqual(6);
        expect(messageState.setMessage).toHaveBeenCalledWith(INTRO_MESSAGE);
    });

    it("tiles each surface by its size over the tile size", () => {
        render(<Room />);

        const [floor, wall] = useTextureMock.mock.results.map(
            result => result.value
        );
        expect(floor.map.repeat.set).toHaveBeenCalledWith(
            30 / 6.562,
            30 / 6.562
        );
        expect(wall.map.repeat.set).toHaveBeenCalledWith(
            30 / 3.281,
            12 / 3.281
        );
        expect(floor.map.colorSpace).toBe(THREE.SRGBColorSpace);
        expect(floor.normalMap.colorSpace).toBe("");
    });
});
