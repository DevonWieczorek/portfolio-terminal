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

export { getModelDimensions };
