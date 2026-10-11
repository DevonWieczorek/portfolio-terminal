import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Create loader and scene
const loader = new GLTFLoader();
const scene = new THREE.Scene();

const getModelDimensions = (src: string = "") => {
    loader.load(src, function (gltf) {
        const model = gltf.scene;

        // Add model to scene (optional)
        scene.add(model);

        // Compute bounding box for the entire model
        const box = new THREE.Box3().setFromObject(model);

        // Calculate size (width, height, depth) in meters
        const size = box.getSize(new THREE.Vector3());

        console.log("Model dimensions in meters:", {
            width: size.x,
            height: size.y,
            depth: size.z,
        });
    });
};

// Bounding box of an object's meshes in its parent's space. Transforms above
// the object are ignored, so the result is stable once the object is mounted.
const getModelBounds = (object: THREE.Object3D) => {
    const bounds = new THREE.Box3();
    const meshBounds = new THREE.Box3();
    const toParent = new THREE.Matrix4();

    object.updateMatrixWorld(true);
    const parentInverse = object.parent
        ? object.parent.matrixWorld.clone().invert()
        : new THREE.Matrix4();

    object.traverse(child => {
        if (!(child instanceof THREE.Mesh)) return;
        if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();

        toParent.multiplyMatrices(parentInverse, child.matrixWorld);
        meshBounds.copy(child.geometry.boundingBox).applyMatrix4(toParent);
        bounds.union(meshBounds);
    });

    return bounds;
};

// Distance from an object's origin to the back (-Z) of its bounding box.
// Offsetting the object by this along +Z puts its back face at z = 0, so it
// sits flush against whatever surface its parent is positioned on.
const getBackOffset = (object: THREE.Object3D) => {
    const bounds = getModelBounds(object);
    return bounds.isEmpty() ? 0 : -bounds.min.z;
};

export { getModelDimensions, getModelBounds, getBackOffset };
