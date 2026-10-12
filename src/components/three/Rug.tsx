import { memo } from "react";
// #if DEBUG
import { useControls } from "leva";
// #endif
import { useScene } from "@/lib/contexts/SceneContext";

type RugControls = {
    rugX: number;
    rugZ: number;
    rugRadius: number;
    rugColor: string;
    rugBorderColor: string;
};

// Kept paper-thin so the character's blob shadow still sits above it
const BORDER_HEIGHT = 0.01;
const CENTER_HEIGHT = 0.015;
const SEGMENTS = 64;

const Rug = memo(() => {
    const { rug } = useScene();

    let rugX: number,
        rugZ: number,
        rugRadius: number,
        rugColor: string,
        rugBorderColor: string;

    // #if DEBUG
    ({ rugX, rugZ, rugRadius, rugColor, rugBorderColor } = useControls(
        "Rug",
        {
            rugX: { value: rug.position.x, min: -14, max: 14, step: 0.1 },
            rugZ: { value: rug.position.z, min: -14, max: 14, step: 0.1 },
            rugRadius: { value: rug.radius, min: 1, max: 12, step: 0.1 },
            rugColor: rug.color,
            rugBorderColor: rug.borderColor,
        },
        { collapsed: true }
    ) as RugControls);
    // #endif

    // #if !DEBUG
    rugX = rug.position.x;
    rugZ = rug.position.z;
    rugRadius = rug.radius;
    rugColor = rug.color;
    rugBorderColor = rug.borderColor;
    // #endif

    const centerRadius = Math.max(0, rugRadius - rug.borderWidth);

    return (
        <group position={[rugX, 0, rugZ]}>
            <mesh position={[0, BORDER_HEIGHT / 2, 0]} receiveShadow>
                <cylinderGeometry
                    args={[rugRadius, rugRadius, BORDER_HEIGHT, SEGMENTS]}
                />
                <meshStandardMaterial color={rugBorderColor} roughness={1} />
            </mesh>
            <mesh position={[0, CENTER_HEIGHT / 2, 0]} receiveShadow>
                <cylinderGeometry
                    args={[centerRadius, centerRadius, CENTER_HEIGHT, SEGMENTS]}
                />
                <meshStandardMaterial color={rugColor} roughness={1} />
            </mesh>
        </group>
    );
});
Rug.displayName = "Rug";

export default Rug;
