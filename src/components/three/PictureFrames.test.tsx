import React from "react";
import { act, render } from "@testing-library/react";
import "@testing-library/jest-dom";
import type { Vector3 } from "three";
import "../../../__mocks__/threeTestHarness";
import {
    experienceState,
    messageState,
    resetThreeTestState,
    sensorProps,
    useTextureMock,
} from "../../../__mocks__/threeTestHarness";
import PictureFrames from "./PictureFrames";

const INSPECT_MESSAGE = "Press ENTER to take a closer look at the photos.";
const EXIT_MESSAGE = "Press ESC to step back.";

describe("PictureFrames", () => {
    beforeEach(() => {
        resetThreeTestState();
    });

    it("renders a mat and print for every frame", () => {
        const { container } = render(<PictureFrames />);

        expect(
            container.querySelectorAll('meshStandardMaterial[color="#FAF7F0"]')
        ).toHaveLength(4);
        expect(container.querySelectorAll("planeGeometry")).toHaveLength(4);
    });

    it("loads a texture only for frames with an image", () => {
        render(<PictureFrames />);

        expect(useTextureMock).toHaveBeenCalledTimes(1);
        expect(useTextureMock).toHaveBeenCalledWith("/img/frames/photo-1.jpg");
    });

    it("flies the camera out from the wall to face the photos on ENTER", () => {
        const { container } = render(<PictureFrames />);
        // The zone's origin is the parent of the group holding its collider.
        // Stands in for a world transform that shifts everything by +10 on x.
        const origin = container.querySelector(
            'object3D[name="cuboid-collider"]'
        )!.parentElement!.parentElement!;
        Object.assign(origin, {
            getWorldQuaternion: (quaternion: unknown) => quaternion,
            localToWorld: (vector: Vector3) => vector.setX(vector.x + 10),
        });

        act(() => sensorProps.at(-1)?.onIntersectionEnter?.());
        expect(messageState.setMessage).toHaveBeenLastCalledWith(
            INSPECT_MESSAGE,
            expect.objectContaining({ onEnter: expect.any(Function) })
        );

        const [, interaction] = messageState.setMessage.mock.lastCall;
        act(() => interaction.onEnter());

        expect(experienceState.enterInspect).toHaveBeenCalledWith({
            position: [10, 0, 6.5],
            lookAt: [10, 0, 0],
        });
    });

    it("tells the visitor how to step back while inspecting", () => {
        experienceState.mode = "inspect";
        const { unmount } = render(<PictureFrames />);

        expect(messageState.setMessage).toHaveBeenCalledWith(EXIT_MESSAGE);

        unmount();
        expect(messageState.clearMessage).toHaveBeenCalledWith(EXIT_MESSAGE);
    });
});
