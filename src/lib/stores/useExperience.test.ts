import { useExperience, type CameraTarget } from "./useExperience";

const TARGET: CameraTarget = { position: [1, 2, 3], lookAt: [0, 0, 0] };
const initialState = useExperience.getState();

describe("useExperience inspect mode", () => {
    beforeEach(() => {
        useExperience.setState(initialState, true);
    });

    it("flies to the target and settles without a blackout", () => {
        useExperience.getState().enterInspect(TARGET);
        expect(useExperience.getState()).toMatchObject({
            mode: "scene",
            targetMode: "inspect",
            isTransitioning: true,
            cameraOverride: TARGET,
        });

        useExperience.getState().completeTransition();
        expect(useExperience.getState()).toMatchObject({
            mode: "inspect",
            isTransitioning: false,
            isBlackout: false,
            cameraOverride: TARGET,
        });
    });

    it("returns control to the scene at once and releases the camera", () => {
        useExperience.getState().enterInspect(TARGET);
        useExperience.getState().completeTransition();

        useExperience.getState().exitInspect();
        expect(useExperience.getState()).toMatchObject({
            mode: "scene",
            targetMode: "scene",
            isTransitioning: false,
            cameraOverride: null,
        });
    });

    it("ignores requests mid-transition or from the terminal", () => {
        useExperience.getState().enterInspect(TARGET);
        useExperience.getState().exitInspect();
        expect(useExperience.getState().targetMode).toBe("inspect");

        useExperience.setState({ ...initialState, mode: "terminal" });
        useExperience.getState().enterInspect(TARGET);
        expect(useExperience.getState().targetMode).toBe("scene");
    });
});
