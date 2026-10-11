import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as THREE from "three";
import "../../../__mocks__/threeTestHarness";
import {
    resetThreeTestState,
    useGLTFMock,
    useTextureMock,
} from "../../../__mocks__/threeTestHarness";
import Skateboard from "./Skateboard";

const GRAPHIC_PATH = "/textures/decks/duck-hunt.jpg";

describe("Skateboard", () => {
    beforeEach(() => {
        resetThreeTestState();
    });

    it("renders and loads the default skateboard model and graphic", () => {
        const { container } = render(
            <Skateboard position={[0, 0, 0]} graphicPath={GRAPHIC_PATH} />
        );

        expect(useGLTFMock).toHaveBeenCalledWith(
            "/models/brew-crew-deck-configurable.glb"
        );
        expect(useTextureMock).toHaveBeenCalledWith(GRAPHIC_PATH);
        expect(container.querySelector("primitive")).toBeInTheDocument();
    });

    it("applies the graphic to a per-instance copy of the graphic material", () => {
        const graphicMaterial = new THREE.MeshStandardMaterial({
            name: "graphic",
        });
        const graphicMesh = new THREE.Mesh(
            new THREE.BufferGeometry(),
            graphicMaterial
        );
        const scene = new THREE.Group();
        scene.add(graphicMesh);
        useGLTFMock.mockReturnValueOnce({ scene });
        const texture = new THREE.Texture();
        useTextureMock.mockReturnValueOnce(
            texture as unknown as ReturnType<typeof useTextureMock>
        );

        render(<Skateboard position={[0, 0, 0]} graphicPath={GRAPHIC_PATH} />);

        expect(graphicMaterial.map).toBeNull();
        expect(texture.flipY).toBe(false);
    });
});
