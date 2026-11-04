import { memo } from "react";
import { RoundedBox } from "@react-three/drei";
// #if DEBUG
import { useControls } from "leva";
// #endif
import { useScene } from "@/lib/contexts/SceneContext";

type BaseboardControls = {
    baseboardHeight: number;
    baseboardBevelRadius: number;
    baseboardColor: string;
};

const Baseboards = memo(() => {
    const { baseboard } = useScene();

    let baseboardHeight: number,
        baseboardBevelRadius: number,
        baseboardColor: string;

    // #if DEBUG
    ({ baseboardHeight, baseboardBevelRadius, baseboardColor } = useControls(
        "Baseboards",
        {
            baseboardHeight: {
                value: baseboard.height,
                min: 0.1,
                max: 2,
                step: 0.05,
            },
            baseboardBevelRadius: {
                value: baseboard.bevelRadius,
                min: 0,
                max: 0.07,
                step: 0.005,
            },
            baseboardColor: baseboard.color,
        },
        { collapsed: true }
    ) as BaseboardControls);
    // #endif

    // #if !DEBUG
    baseboardHeight = baseboard.height;
    baseboardBevelRadius = baseboard.bevelRadius;
    baseboardColor = baseboard.color;
    // #endif

    return (
        <group>
            {baseboard.runs.map(({ position, length, rotationY }) => (
                <group
                    key={`${position.x},${position.z}`}
                    position={[position.x, position.y, position.z]}
                    rotation={[0, rotationY, 0]}
                >
                    {/* Offset so the run rests on the floor with its back
                        flush against the wall */}
                    <RoundedBox
                        args={[length, baseboardHeight, baseboard.thickness]}
                        radius={baseboardBevelRadius}
                        smoothness={2}
                        position={[
                            0,
                            baseboardHeight / 2,
                            baseboard.thickness / 2,
                        ]}
                        receiveShadow
                    >
                        <meshStandardMaterial
                            color={baseboardColor}
                            roughness={0.5}
                        />
                    </RoundedBox>
                </group>
            ))}
        </group>
    );
});
Baseboards.displayName = "Baseboards";

export default Baseboards;
