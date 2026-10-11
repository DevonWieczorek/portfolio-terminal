import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as THREE from "three";
import "../../../__mocks__/threeTestHarness";
import {
    resetThreeTestState,
    useGLTFMock,
} from "../../../__mocks__/threeTestHarness";
import Bass from "./Bass";

describe("Bass", () => {
    beforeEach(() => {
        resetThreeTestState();
    });

    it("renders and loads the default bass model", () => {
        const { container } = render(<Bass position={[0, 1, 2]} />);

        expect(useGLTFMock).toHaveBeenCalledWith(
            "/models/bass-guitar-configurable.glb"
        );
        expect(container.querySelector("primitive")).toBeInTheDocument();
    });

    it("recolors a per-instance copy of the body material", () => {
        const bodyMaterial = new THREE.MeshStandardMaterial({
            name: "body_paint",
            color: "#5fa58b",
        });
        const scene = new THREE.Group();
        scene.add(new THREE.Mesh(new THREE.BufferGeometry(), bodyMaterial));
        useGLTFMock.mockReturnValueOnce({ scene });

        render(<Bass position={[0, 0, 0]} bodyColor="#b3242c" />);

        expect(bodyMaterial.color.getHexString()).toBe("5fa58b");
    });
});
