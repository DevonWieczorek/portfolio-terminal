import React, { useRef } from "react";
import { render } from "@testing-library/react";
import * as THREE from "three";
import "../../__mocks__/threeTestHarness";
import {
    experienceState,
    frameCallbacks,
    resetThreeTestState,
} from "../../__mocks__/threeTestHarness";
import { useCameraSeeThrough } from "./use-camera-see-through";

const material = new THREE.MeshStandardMaterial();
const group = new THREE.Group();
group.add(new THREE.Mesh(new THREE.BoxGeometry(), material));

const Subject = () => {
    const ref = useRef<THREE.Object3D>(group);
    useCameraSeeThrough(ref, 1);
    return null;
};

const camera = new THREE.PerspectiveCamera();

const runFrames = (count: number) => {
    for (let i = 0; i < count; i++) {
        frameCallbacks.at(-1)?.({ camera }, 1 / 60);
    }
};

describe("useCameraSeeThrough", () => {
    beforeEach(() => {
        resetThreeTestState();
        group.position.set(0, 0, 0);
        group.visible = true;
        material.opacity = 1;
        material.transparent = false;
        camera.position.set(0, 6, 5);
    });

    it("stays opaque while the camera follows the character", () => {
        render(<Subject />);
        runFrames(60);

        expect(group.visible).toBe(true);
        expect(material.opacity).toBe(1);
    });

    it("fades out when it blocks the shot, and back in once clear", () => {
        experienceState.mode = "inspect";
        experienceState.targetMode = "inspect";
        Object.assign(experienceState, {
            cameraOverride: { position: [0, 6, 5], lookAt: [0, 6, -5] },
        });
        render(<Subject />);

        runFrames(5);
        expect(material.transparent).toBe(true);
        expect(material.opacity).toBeLessThan(1);

        runFrames(60);
        expect(group.visible).toBe(false);

        group.position.set(4, 0, 0);
        runFrames(60);
        expect(group.visible).toBe(true);
        expect(material.opacity).toBe(1);
        expect(material.transparent).toBe(false);
    });

    it("fades back in as soon as the camera heads back to the scene", () => {
        experienceState.mode = "inspect";
        experienceState.targetMode = "inspect";
        Object.assign(experienceState, {
            cameraOverride: { position: [0, 6, 5], lookAt: [0, 6, -5] },
        });
        render(<Subject />);
        runFrames(60);
        expect(group.visible).toBe(false);

        // Escape: still mid-transition, but the camera has been released
        experienceState.targetMode = "scene";
        experienceState.isTransitioning = true;
        runFrames(30);
        expect(group.visible).toBe(true);
        expect(material.opacity).toBe(1);
    });
});
