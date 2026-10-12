import { memo } from "react";
// #if DEBUG
import { useControls } from "leva";
// #endif
import { useScene } from "@/lib/contexts/SceneContext";

type BaseboardControls = {
    baseboardHeight: number;
    baseboardColor: string;
};

const Baseboards = memo(() => {
    const { baseboard } = useScene();

    let baseboardHeight: number, baseboardColor: string;

    // #if DEBUG
    ({ baseboardHeight, baseboardColor } = useControls(
        "Baseboards",
        {
            baseboardHeight: {
                value: baseboard.height,
                min: 0.1,
                max: 2,
                step: 0.05,
            },
            baseboardColor: baseboard.color,
        },
        { collapsed: true }
    ) as BaseboardControls);
    // #endif

    // #if !DEBUG
    baseboardHeight = baseboard.height;
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
                    <mesh
                        position={[
                            0,
                            baseboardHeight / 2,
                            baseboard.thickness / 2,
                        ]}
                        receiveShadow
                    >
                        <boxGeometry
                            args={[
                                length,
                                baseboardHeight,
                                baseboard.thickness,
                            ]}
                        />
                        <meshStandardMaterial
                            color={baseboardColor}
                            roughness={0.5}
                        />
                    </mesh>
                </group>
            ))}
        </group>
    );
});
Baseboards.displayName = "Baseboards";

export default Baseboards;
