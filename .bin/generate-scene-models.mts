import { writeFileSync } from "node:fs";
import path from "node:path";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

// Builds the cartoon desk, monitor and door models from simple bevelled shapes and
// writes them to public/models. Run with `yarn generate-scene-models`.

// GLTFExporter reads its output through FileReader, which Node lacks
class NodeFileReader {
    result: ArrayBuffer | null = null;
    onloadend: (() => void) | null = null;

    readAsArrayBuffer(blob: Blob) {
        blob.arrayBuffer().then(buffer => {
            this.result = buffer;
            this.onloadend?.();
        });
    }
}
(globalThis as { FileReader?: unknown }).FileReader = NodeFileReader;

const outputDirectory = path.resolve(import.meta.dirname, "../public/models");

const material = (
    name: string,
    color: string,
    {
        roughness = 0.8,
        metalness = 0,
        emissive = "#000000",
        emissiveIntensity = 0,
    } = {}
) => {
    const result = new THREE.MeshStandardMaterial({
        name,
        color,
        roughness,
        metalness,
        emissive,
        emissiveIntensity,
    });
    return result;
};

const roundedBox = (
    name: string,
    [width, height, depth]: [number, number, number],
    [x, y, z]: [number, number, number],
    radius: number,
    meshMaterial: THREE.Material
) => {
    const mesh = new THREE.Mesh(
        new RoundedBoxGeometry(width, height, depth, 4, radius),
        meshMaterial
    );
    mesh.name = name;
    mesh.position.set(x, y, z);
    return mesh;
};

const cylinder = (
    name: string,
    radiusTop: number,
    radiusBottom: number,
    height: number,
    [x, y, z]: [number, number, number],
    meshMaterial: THREE.Material
) => {
    const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 24),
        meshMaterial
    );
    mesh.name = name;
    mesh.position.set(x, y, z);
    return mesh;
};

// Rounded-corner L outline in (x, z), extruded downward from y = 0 with a
// bevel so the top's edges catch highlights like the GLTF props do
const lShapedTop = (
    width: number,
    depth: number,
    backArmDepth: number,
    sideArmWidth: number,
    thickness: number,
    cornerRadius: number,
    bevel: number
) => {
    // Inset by the bevel so the finished top matches the footprint exactly
    const x0 = bevel;
    const z0 = bevel;
    const x1 = width - bevel;
    const z1 = depth - bevel;
    const xArm = sideArmWidth - bevel;
    const zArm = backArmDepth - bevel;
    const r = cornerRadius;

    // Shape y is -z because the extrusion is rotated to lie flat below
    const shape = new THREE.Shape();
    shape.moveTo(x0 + r, -z0);
    shape.lineTo(x1 - r, -z0);
    shape.quadraticCurveTo(x1, -z0, x1, -z0 - r);
    shape.lineTo(x1, -zArm + r);
    shape.quadraticCurveTo(x1, -zArm, x1 - r, -zArm);
    shape.lineTo(xArm + r, -zArm);
    // Inner corner of the L is filleted the other way
    shape.quadraticCurveTo(xArm, -zArm, xArm, -zArm - r);
    shape.lineTo(xArm, -z1 + r);
    shape.quadraticCurveTo(xArm, -z1, xArm - r, -z1);
    shape.lineTo(x0 + r, -z1);
    shape.quadraticCurveTo(x0, -z1, x0, -z1 + r);
    shape.lineTo(x0, -z0 - r);
    shape.quadraticCurveTo(x0, -z0, x0 + r, -z0);

    const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: thickness - bevel * 2,
        bevelEnabled: true,
        bevelThickness: bevel,
        bevelSize: bevel,
        bevelSegments: 4,
        curveSegments: 12,
    });
    geometry.rotateX(-Math.PI / 2);
    // Rotation leaves the slab spanning y = 0..thickness - 2 * bevel plus the
    // bevel on each side; drop it so its top surface sits at y = 0
    geometry.translate(0, -(thickness - bevel), 0);
    return geometry;
};

// Desk: authored with its back-left corner at the origin and the top surface
// at y = 1, so the scene can scale it by the desk height. The footprint must
// match DESK_PROPORTIONS in SceneContext, which the character's collision uses.
const DESK = {
    width: 2.566,
    depth: 2.258,
    backArmDepth: 0.846,
    sideArmWidth: 0.909,
    topThickness: 0.09,
};

const buildDesk = () => {
    const desk = new THREE.Group();
    desk.name = "Desk";

    const topMaterial = material("DeskTop", "#E8D2AE", { roughness: 0.75 });
    const legMaterial = material("DeskLegs", "#3F4B5E", { roughness: 0.7 });
    const cabinetMaterial = material("DeskCabinet", "#F2EDE4");
    const knobMaterial = material("DeskKnobs", "#2E3138", { roughness: 0.5 });
    const drawerMaterials = [
        material("DrawerSky", "#7FB4DE"),
        material("DrawerCoral", "#F09A8C"),
        material("DrawerSage", "#97C98C"),
    ];

    const top = new THREE.Mesh(
        lShapedTop(
            DESK.width,
            DESK.depth,
            DESK.backArmDepth,
            DESK.sideArmWidth,
            DESK.topThickness,
            0.08,
            0.025
        ),
        topMaterial
    );
    top.name = "DeskTop";
    top.position.y = 1;
    desk.add(top);

    const underTop = 1 - DESK.topThickness;

    // Chunky slightly tapered legs, inset from the corners
    const legInset = 0.11;
    const legPositions: [number, number][] = [
        [legInset, legInset],
        [DESK.width - legInset, legInset],
        [DESK.width - legInset, DESK.backArmDepth - legInset],
        [DESK.sideArmWidth - legInset, DESK.backArmDepth + 0.05],
    ];
    legPositions.forEach(([x, z], index) => {
        desk.add(
            cylinder(
                `DeskLeg${index + 1}`,
                0.055,
                0.045,
                underTop,
                [x, underTop / 2, z],
                legMaterial
            )
        );
    });

    // Drawer pedestal under the front end of the side arm
    const cabinetWidth = DESK.sideArmWidth - 0.16;
    const cabinetDepth = 0.8;
    const cabinetX = DESK.sideArmWidth / 2;
    const cabinetZ = DESK.depth - 0.08 - cabinetDepth / 2;
    desk.add(
        roundedBox(
            "DeskCabinet",
            [cabinetWidth, underTop, cabinetDepth],
            [cabinetX, underTop / 2, cabinetZ],
            0.04,
            cabinetMaterial
        )
    );

    // Drawers face +Z, out into the room
    const drawerGap = 0.035;
    const drawerHeight = (underTop - drawerGap * 4) / 3;
    const drawerFrontZ = cabinetZ + cabinetDepth / 2;
    drawerMaterials.forEach((drawerMaterial, index) => {
        const y =
            underTop -
            drawerGap -
            drawerHeight / 2 -
            index * (drawerHeight + drawerGap);
        desk.add(
            roundedBox(
                `Drawer${index + 1}`,
                [cabinetWidth - 0.08, drawerHeight, 0.05],
                [cabinetX, y, drawerFrontZ],
                0.02,
                drawerMaterial
            )
        );
        const knob = new THREE.Mesh(
            new THREE.SphereGeometry(0.035, 16, 12),
            knobMaterial
        );
        knob.name = `DrawerKnob${index + 1}`;
        knob.scale.z = 0.7;
        knob.position.set(cabinetX, y, drawerFrontZ + 0.045);
        desk.add(knob);
    });

    return desk;
};

// Monitor: a chunky retro CRT authored 1 unit tall, centered on the origin and
// facing +Z. The glass is a flat panel whose front face and size are exported
// below, so the animated screen in the scene lines up with it exactly.
const MONITOR_SCREEN = {
    centerY: 0.1,
    glassWidth: 0.74,
    glassHeight: 0.58,
    glassFrontZ: 0.425,
};

const buildMonitor = () => {
    const monitor = new THREE.Group();
    monitor.name = "Monitor";

    const caseMaterial = material("MonitorCase", "#EEE7DC");
    const bezelMaterial = material("MonitorBezel", "#D8CEBF");
    const glassMaterial = material("MonitorGlass", "#16191E", {
        roughness: 0.3,
    });
    const buttonMaterial = material("MonitorButton", "#F08470", {
        roughness: 0.6,
    });
    const ledMaterial = material("MonitorLed", "#5CFF7A", {
        roughness: 0.4,
        emissive: "#5CFF7A",
        emissiveIntensity: 2,
    });

    // Foot and neck
    monitor.add(
        roundedBox(
            "MonitorFoot",
            [0.56, 0.06, 0.46],
            [0, -0.47, 0],
            0.025,
            caseMaterial
        )
    );
    monitor.add(
        cylinder("MonitorNeck", 0.09, 0.12, 0.08, [0, -0.41, 0], caseMaterial)
    );

    // Front shell and the tube housing behind it
    monitor.add(
        roundedBox(
            "MonitorShell",
            [0.96, 0.88, 0.5],
            [0, 0.06, 0.15],
            0.09,
            caseMaterial
        )
    );
    monitor.add(
        roundedBox(
            "MonitorHousing",
            [0.7, 0.62, 0.4],
            [0, 0.07, -0.18],
            0.1,
            caseMaterial
        )
    );

    // Recessed bezel ring, then the glass sitting proud of it
    monitor.add(
        roundedBox(
            "MonitorBezel",
            [0.84, 0.68, 0.04],
            [0, MONITOR_SCREEN.centerY, 0.39],
            0.05,
            bezelMaterial
        )
    );
    monitor.add(
        roundedBox(
            "MonitorGlass",
            [MONITOR_SCREEN.glassWidth, MONITOR_SCREEN.glassHeight, 0.04],
            [0, MONITOR_SCREEN.centerY, MONITOR_SCREEN.glassFrontZ - 0.02],
            0.015,
            glassMaterial
        )
    );

    // Chin details: power button and status light
    const button = cylinder(
        "MonitorPowerButton",
        0.035,
        0.035,
        0.03,
        [0.33, -0.27, 0.4],
        buttonMaterial
    );
    button.rotation.x = Math.PI / 2;
    monitor.add(button);
    const led = new THREE.Mesh(
        new THREE.SphereGeometry(0.014, 12, 8),
        ledMaterial
    );
    led.name = "MonitorLed";
    led.position.set(0.25, -0.27, 0.402);
    monitor.add(led);

    // Vent slots along the top of the shell
    for (let index = 0; index < 5; index++) {
        monitor.add(
            roundedBox(
                `MonitorVent${index + 1}`,
                [0.06, 0.012, 0.22],
                [-0.2 + index * 0.1, 0.498, 0.12],
                0.005,
                bezelMaterial
            )
        );
    }

    return monitor;
};

// Door: a chunky panelled door in an off-white casing, authored 1 unit tall
// with its bottom center at the origin, its back flat against the wall at
// z = 0, and facing +Z. Its plinth-to-plinth width (width plus the plinths'
// overhang) must match DOOR_PROPORTIONS in SceneContext, which splits the
// baseboard around it.
const DOOR = {
    width: 0.56,
    casingWidth: 0.075,
    casingDepth: 0.045,
    headHeight: 0.07,
    capHeight: 0.025,
    plinthHeight: 0.09,
};

const buildDoor = () => {
    const door = new THREE.Group();
    door.name = "Door";

    const casingMaterial = material("DoorCasing", "#FFFDF7", {
        roughness: 0.5,
    });
    const slabMaterial = material("DoorSlab", "#4E7FA8", { roughness: 0.7 });
    const panelMaterial = material("DoorPanels", "#5A8DB8", {
        roughness: 0.65,
    });
    const shadowMaterial = material("DoorGap", "#2E3138", { roughness: 0.9 });
    const brassMaterial = material("DoorBrass", "#E2B65A", {
        roughness: 0.35,
        metalness: 0.6,
    });
    const hingeMaterial = material("DoorHinges", "#3A3F47", {
        roughness: 0.5,
        metalness: 0.4,
    });

    const openingWidth = DOOR.width - DOOR.casingWidth * 2;
    const headTop = 1 - DOOR.capHeight;
    const openingHeight = headTop - DOOR.headHeight;
    const sideX = DOOR.width / 2 - DOOR.casingWidth / 2;

    // Dark backing so the gap around the slab reads as a crisp outline
    door.add(
        roundedBox(
            "DoorGap",
            [openingWidth + 0.02, openingHeight + 0.01, 0.006],
            [0, (openingHeight + 0.01) / 2, 0.003],
            0.002,
            shadowMaterial
        )
    );

    // Casing: side legs on plinth blocks, a head, and a cap that overhangs
    [-1, 1].forEach(side => {
        door.add(
            roundedBox(
                side < 0 ? "DoorCasingLeft" : "DoorCasingRight",
                [DOOR.casingWidth, headTop, DOOR.casingDepth],
                [side * sideX, headTop / 2, DOOR.casingDepth / 2],
                0.012,
                casingMaterial
            )
        );
        door.add(
            roundedBox(
                side < 0 ? "DoorPlinthLeft" : "DoorPlinthRight",
                [
                    DOOR.casingWidth + 0.012,
                    DOOR.plinthHeight,
                    DOOR.casingDepth + 0.01,
                ],
                [
                    side * sideX,
                    DOOR.plinthHeight / 2,
                    (DOOR.casingDepth + 0.01) / 2,
                ],
                0.01,
                casingMaterial
            )
        );
    });
    door.add(
        roundedBox(
            "DoorHead",
            [DOOR.width, DOOR.headHeight, DOOR.casingDepth],
            [0, headTop - DOOR.headHeight / 2, DOOR.casingDepth / 2],
            0.012,
            casingMaterial
        )
    );
    door.add(
        roundedBox(
            "DoorCap",
            [DOOR.width + 0.04, DOOR.capHeight, DOOR.casingDepth + 0.018],
            [0, 1 - DOOR.capHeight / 2, (DOOR.casingDepth + 0.018) / 2],
            0.01,
            casingMaterial
        )
    );

    // Slab recessed slightly behind the casing face
    const gap = 0.006;
    const slabWidth = openingWidth - gap * 2;
    const slabHeight = openingHeight - gap;
    const slabThickness = 0.03;
    const slabFrontZ = 0.006 + slabThickness;
    door.add(
        roundedBox(
            "DoorSlab",
            [slabWidth, slabHeight, slabThickness],
            [0, slabHeight / 2, slabFrontZ - slabThickness / 2],
            0.01,
            slabMaterial
        )
    );

    // Four raised panels: short ones above the lock rail, tall ones below
    const stile = 0.05;
    const panelWidth = (slabWidth - stile * 3) / 2;
    const panelDepth = 0.014;
    const bottomRail = 0.075;
    const lockRail = 0.06;
    const topRail = 0.06;
    const lowerHeight = (slabHeight - bottomRail - lockRail - topRail) * 0.58;
    const upperHeight =
        slabHeight - bottomRail - lockRail - topRail - lowerHeight;
    const panelRows: [string, number, number][] = [
        ["Lower", bottomRail + lowerHeight / 2, lowerHeight],
        [
            "Upper",
            bottomRail + lowerHeight + lockRail + upperHeight / 2,
            upperHeight,
        ],
    ];
    panelRows.forEach(([row, y, height]) => {
        [-1, 1].forEach(side => {
            door.add(
                roundedBox(
                    `DoorPanel${row}${side < 0 ? "Left" : "Right"}`,
                    [panelWidth, height, panelDepth],
                    [
                        side * (stile / 2 + panelWidth / 2),
                        y,
                        slabFrontZ + panelDepth / 2 - 0.004,
                    ],
                    0.006,
                    panelMaterial
                )
            );
        });
    });

    // Round brass knob on a backplate, at the lock rail
    const knobX = slabWidth / 2 - 0.045;
    const knobY = bottomRail + lowerHeight + lockRail / 2;
    const backplate = cylinder(
        "DoorKnobPlate",
        0.024,
        0.024,
        0.008,
        [knobX, knobY, slabFrontZ + 0.004],
        brassMaterial
    );
    backplate.rotation.x = Math.PI / 2;
    door.add(backplate);
    const neck = cylinder(
        "DoorKnobNeck",
        0.008,
        0.011,
        0.026,
        [knobX, knobY, slabFrontZ + 0.018],
        brassMaterial
    );
    neck.rotation.x = Math.PI / 2;
    door.add(neck);
    const knob = new THREE.Mesh(
        new THREE.SphereGeometry(0.024, 20, 14),
        brassMaterial
    );
    knob.name = "DoorKnob";
    knob.scale.z = 0.8;
    knob.position.set(knobX, knobY, slabFrontZ + 0.038);
    door.add(knob);

    // Hinges on the opposite edge
    [0.16, openingHeight - 0.16].forEach((y, index) => {
        door.add(
            roundedBox(
                `DoorHinge${index + 1}`,
                [0.016, 0.06, 0.012],
                [-slabWidth / 2 - 0.002, y, slabFrontZ - 0.002],
                0.004,
                hingeMaterial
            )
        );
    });

    return door;
};

const exportModel = (object: THREE.Object3D, fileName: string) =>
    new Promise<void>((resolve, reject) => {
        new GLTFExporter().parse(
            object,
            result => {
                writeFileSync(
                    path.join(outputDirectory, fileName),
                    Buffer.from(result as ArrayBuffer)
                );
                console.log(`Wrote public/models/${fileName}`);
                resolve();
            },
            reject,
            { binary: true }
        );
    });

exportModel(buildDesk(), "cartoon_desk.glb")
    .then(() => exportModel(buildMonitor(), "cartoon_monitor.glb"))
    .then(() => exportModel(buildDoor(), "cartoon_door.glb"))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
