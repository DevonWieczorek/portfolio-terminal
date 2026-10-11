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

    it("recolors per-instance copies of the body and pickguard materials", () => {
        const bodyMaterial = new THREE.MeshStandardMaterial({
            name: "body_paint",
            color: "#5fa58b",
        });
        const pickguardMaterial = new THREE.MeshStandardMaterial({
            name: "tortoise",
            color: "#cac0ab",
        });
        const scene = new THREE.Group();
        scene.add(new THREE.Mesh(new THREE.BufferGeometry(), bodyMaterial));
        scene.add(
            new THREE.Mesh(new THREE.BufferGeometry(), pickguardMaterial)
        );
        useGLTFMock.mockReturnValueOnce({ scene });

        render(
            <Bass
                position={[0, 0, 0]}
                bodyColor="#f4a6c1"
                pickguardColor="#1c1c1c"
            />
        );

        expect(bodyMaterial.color.getHexString()).toBe("5fa58b");
        expect(pickguardMaterial.color.getHexString()).toBe("cac0ab");
    });
});
