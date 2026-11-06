import React from "react";
import { act, render } from "@testing-library/react";
import "@testing-library/jest-dom";
import "../../../__mocks__/threeTestHarness";
import {
    experienceState,
    messageState,
    resetThreeTestState,
    sensorProps,
} from "../../../__mocks__/threeTestHarness";
import InteractionZone from "./InteractionZone";

const MESSAGE = "Test message";

const renderZone = (props: Partial<Parameters<typeof InteractionZone>[0]>) =>
    render(
        <InteractionZone
            message={MESSAGE}
            size={[4, 2, 6]}
            center={[1, 0, 0]}
            {...props}
        />
    );

const enterZone = () => act(() => sensorProps.at(-1)?.onIntersectionEnter?.());
const exitZone = () => act(() => sensorProps.at(-1)?.onIntersectionExit?.());

describe("InteractionZone", () => {
    beforeEach(() => {
        resetThreeTestState();
    });

    it("renders a sensor collider", () => {
        renderZone({});

        expect(sensorProps.at(-1)).toEqual(
            expect.objectContaining({ sensor: true })
        );
    });

    it("shows its message when the character enters", () => {
        renderZone({});

        enterZone();

        expect(messageState.setMessage).toHaveBeenCalledWith(MESSAGE, null);
    });

    it("clears its message when the character leaves", () => {
        renderZone({});
        enterZone();

        exitZone();

        // MessageContext only clears it if it's still the one showing
        expect(messageState.clearMessage).toHaveBeenCalledWith(MESSAGE);
    });

    it("reclaims the message when another zone gives it up", () => {
        const { rerender } = renderZone({});
        enterZone();
        // A new size array gets past memo, so the zone rereads the message
        const rerenderZone = () =>
            rerender(
                <InteractionZone
                    message={MESSAGE}
                    size={[4, 2, 6]}
                    center={[1, 0, 0]}
                />
            );

        const callsOnEnter = messageState.setMessage.mock.calls.length;

        messageState.message = "Overlapping zone";
        rerenderZone();
        expect(messageState.setMessage).toHaveBeenCalledTimes(callsOnEnter);

        messageState.message = "";
        rerenderZone();
        expect(messageState.setMessage).toHaveBeenCalledTimes(callsOnEnter + 1);
    });

    it("waits for camera transitions to finish", () => {
        experienceState.isTransitioning = true;
        renderZone({});

        enterZone();

        expect(messageState.setMessage).not.toHaveBeenCalled();
    });

    it("passes the computed camera target to onEnter", () => {
        const target = {
            position: [1, 2, 3] as Coordinate,
            lookAt: [0, 0, 0] as Coordinate,
        };
        const onEnter = jest.fn();
        const computeCameraTarget = jest.fn(() => target);
        const { container } = renderZone({ onEnter, computeCameraTarget });
        Object.assign(container.querySelector("group")!, {
            getWorldQuaternion: (quaternion: unknown) => quaternion,
        });

        enterZone();
        const [, interaction] = messageState.setMessage.mock.calls[0];
        interaction.onEnter();

        expect(computeCameraTarget).toHaveBeenCalledWith(
            expect.objectContaining({ group: container.querySelector("group") })
        );
        expect(onEnter).toHaveBeenCalledWith(target);
    });
});
