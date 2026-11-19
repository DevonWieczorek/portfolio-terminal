import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import "../../../__mocks__/threeTestHarness";
import {
    resetThreeTestState,
    useTextureMock as textureMock,
} from "../../../__mocks__/threeTestHarness";
import type { SurfaceTextures } from "@/hooks/use-surface-textures";
import WindowWall from "./WindowWall";

const renderAt = (hours: number) => {
    jest.setSystemTime(new Date(2026, 5, 21, hours));
    const textures = textureMock({
        map: "/textures/wall_albedo.jpg",
    }) as unknown as SurfaceTextures;
    return render(
        <WindowWall
            textures={textures}
            tileSize={3.281}
            roughness={0.35}
            normalScale={1}
            color="#F2F0E8"
        />
    );
};

describe("WindowWall", () => {
    beforeEach(() => {
        resetThreeTestState();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("renders the wall, the trim, the sky and the sun's occluder", () => {
        const { container } = renderAt(12);

        // Wall + 10 trim pieces + sky dome + occluder
        expect(container.querySelectorAll("mesh")).toHaveLength(13);
        expect(container.querySelectorAll("spheregeometry")).toHaveLength(1);
        expect(container.querySelectorAll("spotlight")).toHaveLength(1);
    });

    it("tiles cloned wall textures in world units", () => {
        renderAt(12);

        const [source] = textureMock.mock.results.map(result => result.value);
        expect(source.map.repeat.set).not.toHaveBeenCalled();
    });

    it("lets the sun in at midday and keeps it out at night", () => {
        const { container, unmount } = renderAt(13);
        const noon = Number(
            container.querySelector("spotlight")?.getAttribute("intensity")
        );
        unmount();

        const night = Number(
            renderAt(2)
                .container.querySelector("spotlight")
                ?.getAttribute("intensity")
        );

        expect(noon).toBeGreaterThan(0);
        expect(night).toBe(0);
    });
});
