import { memo, useRef } from "react";
import { CuboidCollider, type RapierCollider } from "@react-three/rapier";
import type { Group } from "three";
// #if DEBUG
import { useColliderFollow } from "@/hooks/use-collider-follow";
// #endif
import { OBSTACLE_GROUPS } from "@/lib/constants/physics";

interface ObstacleProps {
    size: Coordinate;
    position: Coordinate;
}

// Invisible solid box the character can't walk through. Render it inside the
// object it blocks, so it moves with that object.
const Obstacle = memo(function Obstacle({ size, position }: ObstacleProps) {
    const groupRef = useRef<Group>(null);
    const colliderRef = useRef<RapierCollider>(null);

    // #if DEBUG
    useColliderFollow(colliderRef, groupRef);
    // #endif

    return (
        <group ref={groupRef} position={position}>
            <CuboidCollider
                ref={colliderRef}
                args={[size[0] / 2, size[1] / 2, size[2] / 2]}
                collisionGroups={OBSTACLE_GROUPS}
            />
        </group>
    );
});
Obstacle.displayName = "Obstacle";

export default Obstacle;
