import { interactionGroups } from "@react-three/rapier";

// Fixed simulation rate. Rapier steps at this rate no matter the display's
// refresh rate, and interpolates rendered positions between steps.
export const PHYSICS_TIMESTEP = 1 / 60;

// Collision layers. A collider is a member of one layer and only interacts
// with colliders whose layer is in its filter list (and vice versa).
enum Layer {
    Player,
    Obstacle,
    Interaction,
}

export const PLAYER_GROUPS = interactionGroups(Layer.Player, [
    Layer.Obstacle,
    Layer.Interaction,
]);
export const OBSTACLE_GROUPS = interactionGroups(Layer.Obstacle, [
    Layer.Player,
]);
export const INTERACTION_GROUPS = interactionGroups(Layer.Interaction, [
    Layer.Player,
]);
