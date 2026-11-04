import { memo } from "react";
// #if DEBUG
import { useControls } from "leva";
// #endif
import { useScene } from "@/lib/contexts/SceneContext";

type RugControls = {
    rugX: number;
    rugZ: number;
    rugWidth: number;
    rugDepth: number;
    rugBorderHeight: number;
    rugCenterHeight: number;
    rugColor: string;
    rugBorderColor: string;
};

const ROUGHNESS = 0.9;

const Rug = memo(() => {
    const { rug } = useScene();

    let rugX: number,
        rugZ: number,
        rugWidth: number,
        rugDepth: number,
        rugBorderHeight: number,
        rugCenterHeight: number,
        rugColor: string,
        rugBorderColor: string;

    // #if DEBUG
    ({
        rugX,
        rugZ,
        rugWidth,
        rugDepth,
        rugBorderHeight,
        rugCenterHeight,
        rugColor,
        rugBorderColor,
    } = useControls(
        "Rug",
        {
            rugX: { value: rug.position.x, min: -14, max: 14, step: 0.1 },
            rugZ: { value: rug.position.z, min: -14, max: 14, step: 0.1 },
            rugWidth: { value: rug.width, min: 2, max: 28, step: 0.1 },
            rugDepth: { value: rug.depth, min: 2, max: 28, step: 0.1 },
            rugBorderHeight: {
                value: rug.borderHeight,
                min: 0.001,
                max: 0.1,
                step: 0.001,
            },
            rugCenterHeight: {
                value: rug.centerHeight,
                min: 0.001,
                max: 0.1,
                step: 0.001,
            },
            rugColor: rug.color,
            rugBorderColor: rug.borderColor,
        },
        { collapsed: true }
    ) as RugControls);
    // #endif

    // #if !DEBUG
    rugX = rug.position.x;
    rugZ = rug.position.z;
    rugWidth = rug.width;
    rugDepth = rug.depth;
    rugBorderHeight = rug.borderHeight;
    rugCenterHeight = rug.centerHeight;
    rugColor = rug.color;
    rugBorderColor = rug.borderColor;
    // #endif

    const centerWidth = Math.max(0, rugWidth - rug.borderWidth * 2);
    const centerDepth = Math.max(0, rugDepth - rug.borderWidth * 2);

    return (
        <group position={[rugX, 0, rugZ]}>
            <mesh position={[0, rugBorderHeight / 2, 0]} receiveShadow>
                <boxGeometry args={[rugWidth, rugBorderHeight, rugDepth]} />
                <meshStandardMaterial
                    color={rugBorderColor}
                    roughness={ROUGHNESS}
                />
            </mesh>
            <mesh position={[0, rugCenterHeight / 2, 0]} receiveShadow>
                <boxGeometry
                    args={[centerWidth, rugCenterHeight, centerDepth]}
                />
                <meshStandardMaterial color={rugColor} roughness={ROUGHNESS} />
            </mesh>
        </group>
    );
});
Rug.displayName = "Rug";

export default Rug;
