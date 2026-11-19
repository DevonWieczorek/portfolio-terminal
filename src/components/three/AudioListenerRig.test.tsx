import React from "react";
import { render } from "@testing-library/react";
import { AudioListener } from "three";
import "../../../__mocks__/threeTestHarness";
import {
    resetThreeTestState,
    useThreeMock,
} from "../../../__mocks__/threeTestHarness";
import { useAudio } from "@/lib/stores/useAudio";
import AudioListenerRig from "./AudioListenerRig";

describe("AudioListenerRig", () => {
    const camera = { add: jest.fn(), remove: jest.fn() };

    beforeEach(() => {
        resetThreeTestState();
        useThreeMock.mockReturnValue({ camera } as never);
        camera.add.mockClear();
        camera.remove.mockClear();
    });

    it("unlocks audio on the first key press", () => {
        const unlock = jest.fn();
        useAudio.setState({ listener: null, unlock });
        render(<AudioListenerRig />);

        window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" }));
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" }));

        expect(unlock).toHaveBeenCalledTimes(1);
    });

    it("mounts the listener on the camera and removes it on unmount", () => {
        const listener = {} as AudioListener;
        useAudio.setState({ listener });
        const { unmount } = render(<AudioListenerRig />);

        expect(camera.add).toHaveBeenCalledWith(listener);
        unmount();
        expect(camera.remove).toHaveBeenCalledWith(listener);
    });
});
