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

// Distance from an object's origin to the back (-Z) of its bounding box.
// Offsetting the object by this along +Z puts its back face at z = 0, so it
// sits flush against whatever surface its parent is positioned on.
const getBackOffset = (object: THREE.Object3D) => {
    object.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(object);
    return box.isEmpty() ? 0 : -box.min.z;
};

export { getModelDimensions, getBackOffset };
