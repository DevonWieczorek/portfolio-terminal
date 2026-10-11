interface MoveVector {
    x: number;
    z: number;
}

/**
 * Rotates camera-space input (-z into the screen, +x screen right) by the
 * camera's orbit angle around Y so movement follows the current view.
 */
const toCameraRelative = (
    inputX: number,
    inputZ: number,
    cameraYaw: number
): MoveVector => {
    const cos = Math.cos(cameraYaw);
    const sin = Math.sin(cameraYaw);

    return {
        x: inputX * cos + inputZ * sin,
        z: inputZ * cos - inputX * sin,
    };
};

/** Character rotation (around Y) that faces a direction; 0 faces -z. */
const getFacingRotation = ({ x, z }: MoveVector) => Math.atan2(-x, -z);

export { toCameraRelative, getFacingRotation };
