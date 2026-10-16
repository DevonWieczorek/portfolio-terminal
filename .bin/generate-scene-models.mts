import { writeFileSync } from "node:fs";
import path from "node:path";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

// Builds the cartoon desk, monitor, door, pinboard and shelf models from simple bevelled shapes and
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

// Deterministic pseudo-random numbers, so regenerating gives identical models
const seededRandom = (seed: number) => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Thin cylinder stretched between two points, for yarn and tonearms
const strand = (
    name: string,
    from: THREE.Vector3,
    to: THREE.Vector3,
    radius: number,
    meshMaterial: THREE.Material
) => {
    const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, from.distanceTo(to), 8),
        meshMaterial
    );
    mesh.name = name;
    mesh.position.copy(from).add(to).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        to.clone().sub(from).normalize()
    );
    return mesh;
};

// Pinboard: a cork board in a light wood frame, authored 1 unit tall and
// centered on the origin, with its back flat against the wall at z = 0 and
// facing +Z. Notes, polaroids and pins sit on the cork at slight angles.
const PINBOARD = {
    width: 1.5,
    frameWidth: 0.06,
    frameDepth: 0.05,
    corkDepth: 0.03,
};

const buildPinboard = () => {
    const pinboard = new THREE.Group();
    pinboard.name = "Pinboard";

    const frameMaterial = material("PinboardFrame", "#E8D2AE", {
        roughness: 0.75,
    });
    const corkMaterial = material("PinboardCork", "#C9A27A", {
        roughness: 0.95,
    });
    const paperMaterial = material("PinboardPaper", "#FAF7F0", {
        roughness: 0.85,
    });
    const inkMaterial = material("PinboardInk", "#3F4B5E", { roughness: 0.8 });
    const yarnMaterial = material("PinboardYarn", "#E8504F", {
        roughness: 0.9,
    });
    const pinMaterials = ["#E8504F", "#3F8FD8", "#F2C14E", "#5DBB63"].map(
        (color, index) =>
            material(`PinboardPin${index + 1}`, color, { roughness: 0.4 })
    );

    const { width, frameWidth, frameDepth, corkDepth } = PINBOARD;
    const height = 1;

    pinboard.add(
        roundedBox(
            "PinboardCork",
            [width - frameWidth, height - frameWidth, corkDepth],
            [0, 0, corkDepth / 2],
            0.008,
            corkMaterial
        )
    );
    // Frame: rails across the top and bottom, stiles up the sides
    [-1, 1].forEach(side => {
        pinboard.add(
            roundedBox(
                side < 0 ? "PinboardFrameBottom" : "PinboardFrameTop",
                [width, frameWidth, frameDepth],
                [0, side * (height / 2 - frameWidth / 2), frameDepth / 2],
                0.018,
                frameMaterial
            )
        );
        pinboard.add(
            roundedBox(
                side < 0 ? "PinboardFrameLeft" : "PinboardFrameRight",
                [frameWidth, height - frameWidth * 2 + 0.002, frameDepth],
                [side * (width / 2 - frameWidth / 2), 0, frameDepth / 2],
                0.018,
                frameMaterial
            )
        );
    });

    let pinIndex = 0;
    const pin = (x: number, y: number, z: number) => {
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.02, 16, 12),
            pinMaterials[pinIndex % pinMaterials.length]
        );
        mesh.name = `PinboardPin${++pinIndex}`;
        mesh.scale.z = 0.8;
        mesh.position.set(x, y, z);
        pinboard.add(mesh);
        return mesh.position.clone();
    };

    // A pinned item: a flat card rotated a little around its pin, which sits
    // near its top edge
    const pinned = (
        name: string,
        [cardWidth, cardHeight]: [number, number],
        [x, y]: [number, number],
        tilt: number,
        cardMaterial: THREE.Material,
        decorate: (card: THREE.Group, top: number) => void
    ) => {
        const card = new THREE.Group();
        card.name = name;
        card.position.set(x, y, corkDepth);
        card.rotation.z = tilt;
        card.add(
            roundedBox(
                `${name}Card`,
                [cardWidth, cardHeight, 0.006],
                [0, 0, 0.003],
                0.0025,
                cardMaterial
            )
        );
        decorate(card, cardHeight / 2);
        pinboard.add(card);
        const pinOffset = new THREE.Vector3(0, cardHeight / 2 - 0.03, 0)
            .applyAxisAngle(new THREE.Vector3(0, 0, 1), tilt)
            .add(card.position);
        return pin(pinOffset.x, pinOffset.y, corkDepth + 0.018);
    };

    const scribbles = (
        card: THREE.Group,
        lines: number,
        lineWidth: number,
        startY: number,
        spacing: number,
        random: () => number
    ) => {
        for (let index = 0; index < lines; index++) {
            const lengthScale =
                index === lines - 1 ? 0.55 : 0.8 + random() * 0.2;
            const lineLength = lineWidth * lengthScale;
            card.add(
                roundedBox(
                    `${card.name}Line${index + 1}`,
                    [lineLength, 0.009, 0.002],
                    [
                        -lineWidth / 2 + lineLength / 2,
                        startY - index * spacing,
                        0.007,
                    ],
                    0.001,
                    inkMaterial
                )
            );
        }
    };

    const random = seededRandom(7);

    // Resume-style sheet with a colored header band
    pinned(
        "PinboardSheet",
        [0.3, 0.38],
        [-0.43, 0.04],
        0.035,
        paperMaterial,
        (card, top) => {
            card.add(
                roundedBox(
                    "PinboardSheetHeader",
                    [0.24, 0.045, 0.002],
                    [0, top - 0.075, 0.007],
                    0.001,
                    material("PinboardSheetHeader", "#7FB4DE")
                )
            );
            scribbles(card, 8, 0.22, top - 0.135, 0.03, random);
        }
    );

    // Polaroids linked with red yarn
    const photoColors = ["#7FB4DE", "#97C98C", "#F09A8C"];
    const polaroids: [number, number, number][] = [
        [-0.1, 0.17, -0.08],
        [0.18, 0.21, 0.06],
        [0.47, 0.13, -0.045],
    ];
    const polaroidPins = polaroids.map(([x, y, tilt], index) =>
        pinned(
            `PinboardPolaroid${index + 1}`,
            [0.2, 0.24],
            [x, y],
            tilt,
            paperMaterial,
            card => {
                card.add(
                    roundedBox(
                        `PinboardPhoto${index + 1}`,
                        [0.165, 0.155, 0.002],
                        [0, 0.022, 0.007],
                        0.001,
                        material(
                            `PinboardPhoto${index + 1}`,
                            photoColors[index],
                            {
                                roughness: 0.4,
                            }
                        )
                    )
                );
            }
        )
    );
    polaroidPins.slice(1).forEach((to, index) => {
        const from = polaroidPins[index];
        pinboard.add(
            strand(
                `PinboardYarn${index + 1}`,
                new THREE.Vector3(from.x, from.y, corkDepth + 0.012),
                new THREE.Vector3(to.x, to.y, corkDepth + 0.012),
                0.004,
                yarnMaterial
            )
        );
    });

    // Pastel sticky notes along the bottom
    const notes: [number, number, number, string][] = [
        [-0.07, -0.22, 0.1, "#F6E27A"],
        [0.17, -0.2, -0.07, "#F4A7B9"],
        [0.42, -0.24, 0.05, "#9CCBEA"],
    ];
    notes.forEach(([x, y, tilt, color], index) => {
        pinned(
            `PinboardNote${index + 1}`,
            [0.15, 0.15],
            [x, y],
            tilt,
            material(`PinboardNote${index + 1}`, color),
            (card, top) => scribbles(card, 3, 0.1, top - 0.06, 0.03, random)
        );
    });

    return pinboard;
};

// Shelf: a low cube shelf of records and books, authored with its bottom
// center at the origin, its back flat against the wall at z = 0, its top
// 1 unit high, and facing +Z. A turntable and a plant sit on top. Its width
// and depth must match SHELF_PROPORTIONS in SceneContext, which the
// character's collision uses.
const SHELF = {
    width: 1.8,
    depth: 0.43,
    legHeight: 0.07,
    panel: 0.05,
    columns: 3,
    rows: 2,
};

const buildShelf = () => {
    const shelf = new THREE.Group();
    shelf.name = "Shelf";

    const bodyMaterial = material("ShelfBody", "#E8D2AE", { roughness: 0.75 });
    const backMaterial = material("ShelfBack", "#BFD8D2");
    const legMaterial = material("ShelfLegs", "#3F4B5E", { roughness: 0.7 });
    const nearBlack = material("ShelfVinyl", "#23262B", { roughness: 0.35 });
    const darkMaterial = material("ShelfDark", "#3A3F47", { roughness: 0.6 });
    const offWhite = material("ShelfOffWhite", "#F2EDE4");
    const coverColors = [
        "#F09A8C",
        "#7FB4DE",
        "#F6E27A",
        "#97C98C",
        "#C9A0DC",
        "#2E3138",
        "#FFFDF7",
        "#E8504F",
        "#4E7FA8",
        "#F2A65A",
    ];
    const coverMaterials = coverColors.map((color, index) =>
        material(`ShelfCover${index + 1}`, color)
    );
    const random = seededRandom(42);
    const pick = <T,>(items: T[]) => items[Math.floor(random() * items.length)];

    const { width, depth, legHeight, panel, columns, rows } = SHELF;
    const bodyHeight = 1 - legHeight;
    const cubbyWidth = (width - panel * (columns + 1)) / columns;
    const cubbyHeight = (bodyHeight - panel * (rows + 1)) / rows;
    const backDepth = 0.02;
    const cubbyDepth = depth - backDepth;
    const middleZ = backDepth + cubbyDepth / 2;

    // Short tapered legs, like the desk's
    [-1, 1].forEach(sideX => {
        [0.07, depth - 0.07].forEach((z, index) => {
            shelf.add(
                cylinder(
                    `ShelfLeg${sideX < 0 ? "Left" : "Right"}${index + 1}`,
                    0.032,
                    0.024,
                    legHeight,
                    [sideX * (width / 2 - 0.09), legHeight / 2, z],
                    legMaterial
                )
            );
        });
    });

    // Carcass: top, bottom and middle boards, then sides and dividers
    for (let row = 0; row <= rows; row++) {
        shelf.add(
            roundedBox(
                `ShelfBoard${row + 1}`,
                [width, panel, depth],
                [
                    0,
                    legHeight + panel / 2 + row * (cubbyHeight + panel),
                    depth / 2,
                ],
                row === 0 || row === rows ? 0.02 : 0.008,
                bodyMaterial
            )
        );
    }
    for (let column = 0; column <= columns; column++) {
        shelf.add(
            roundedBox(
                `ShelfUpright${column + 1}`,
                [panel, bodyHeight - panel * 2 + 0.002, depth],
                [
                    -width / 2 + panel / 2 + column * (cubbyWidth + panel),
                    legHeight + bodyHeight / 2,
                    depth / 2,
                ],
                column === 0 || column === columns ? 0.02 : 0.008,
                bodyMaterial
            )
        );
    }
    shelf.add(
        roundedBox(
            "ShelfBack",
            [width - panel, bodyHeight - panel, backDepth],
            [0, legHeight + bodyHeight / 2, backDepth / 2],
            0.006,
            backMaterial
        )
    );

    // Cubby origin: its floor's left edge, centered in depth
    const cubby = (column: number, row: number) => ({
        left: -width / 2 + panel + column * (cubbyWidth + panel),
        floor: legHeight + panel + row * (cubbyHeight + panel),
    });

    // Upright spines packed from the left, ending with one leaning on the row
    type Spine = {
        thickness: number;
        height: number;
        depth: number;
        band: boolean;
    };
    const fillRow = (
        name: string,
        column: number,
        row: number,
        spines: Spine[],
        fill: number
    ) => {
        const { left, floor } = cubby(column, row);
        let x = left + 0.012;
        const limit = left + cubbyWidth * fill;
        let index = 0;
        let last: Spine | undefined;
        for (const spine of spines) {
            if (x + spine.thickness > limit) {
                break;
            }
            const cover = pick(coverMaterials);
            const jitter = (random() - 0.5) * 0.02;
            shelf.add(
                roundedBox(
                    `${name}${++index}`,
                    [spine.thickness, spine.height, spine.depth],
                    [
                        x + spine.thickness / 2,
                        floor + spine.height / 2,
                        middleZ + jitter,
                    ],
                    Math.min(0.004, spine.thickness / 3),
                    cover
                )
            );
            if (spine.band) {
                shelf.add(
                    roundedBox(
                        `${name}${index}Band`,
                        [spine.thickness + 0.002, 0.02, 0.004],
                        [
                            x + spine.thickness / 2,
                            floor + spine.height * 0.75,
                            middleZ + jitter + spine.depth / 2,
                        ],
                        0.001,
                        cover === coverMaterials[6] ? darkMaterial : offWhite
                    )
                );
            }
            x += spine.thickness + 0.002;
            last = spine;
        }

        // Lean the next spine back against the row, its top touching the
        // last upright and its bottom corner on the shelf
        const leaning = spines[index] ?? last;
        if (!leaning) {
            return;
        }
        const angle = 0.32;
        const pivotX = x + leaning.height * Math.sin(angle);
        const lean = roundedBox(
            `${name}Leaning`,
            [leaning.thickness, leaning.height, leaning.depth],
            [
                pivotX +
                    (leaning.thickness / 2) * Math.cos(angle) -
                    (leaning.height / 2) * Math.sin(angle),
                floor +
                    (leaning.thickness / 2) * Math.sin(angle) +
                    (leaning.height / 2) * Math.cos(angle),
                middleZ,
            ],
            Math.min(0.004, leaning.thickness / 3),
            pick(coverMaterials)
        );
        lean.rotation.z = angle;
        shelf.add(lean);
    };

    const records = (count: number): Spine[] =>
        Array.from({ length: count }, () => ({
            thickness: 0.014,
            height: 0.333,
            depth: 0.333,
            band: false,
        }));
    const books = (count: number): Spine[] =>
        Array.from({ length: count }, () => ({
            thickness: 0.032 + random() * 0.028,
            height: 0.22 + random() * 0.13,
            depth: 0.24 + random() * 0.05,
            band: random() > 0.45,
        }));

    // Top row: records, books, records. Bottom row: bin, records, books.
    fillRow("ShelfRecordA", 0, 1, records(40), 0.78);
    fillRow("ShelfBookA", 1, 1, books(14), 0.6);
    fillRow("ShelfRecordB", 2, 1, records(40), 0.62);
    fillRow("ShelfRecordC", 1, 0, records(40), 0.85);
    fillRow("ShelfBookB", 2, 0, books(14), 0.55);

    // A flat stack of books beside the upright ones
    {
        const { left, floor } = cubby(1, 1);
        let y = floor;
        [0.05, 0.04, 0.045].forEach((thickness, index) => {
            const stackBook = roundedBox(
                `ShelfBookStack${index + 1}`,
                [0.17 - index * 0.015, thickness, 0.25],
                [
                    left + cubbyWidth - 0.11 + (random() - 0.5) * 0.02,
                    y + thickness / 2,
                    middleZ,
                ],
                0.006,
                pick(coverMaterials)
            );
            stackBook.rotation.y = (random() - 0.5) * 0.2;
            shelf.add(stackBook);
            y += thickness;
        });
    }

    // Fabric bin with a handle slot in the bottom-left cubby
    {
        const { left, floor } = cubby(0, 0);
        const binHeight = cubbyHeight - 0.03;
        const binDepth = cubbyDepth - 0.03;
        shelf.add(
            roundedBox(
                "ShelfBin",
                [cubbyWidth - 0.03, binHeight, binDepth],
                [
                    left + cubbyWidth / 2,
                    floor + binHeight / 2,
                    depth - 0.015 - binDepth / 2,
                ],
                0.03,
                material("ShelfBin", "#F09A8C", { roughness: 0.95 })
            )
        );
        shelf.add(
            roundedBox(
                "ShelfBinHandle",
                [0.14, 0.04, 0.01],
                [
                    left + cubbyWidth / 2,
                    floor + binHeight - 0.07,
                    depth - 0.012,
                ],
                0.018,
                darkMaterial
            )
        );
    }

    // Turntable on top: plinth, platter, record, label and tonearm
    {
        const x = -0.48;
        const z = depth / 2;
        const plinthHeight = 0.08;
        shelf.add(
            roundedBox(
                "TurntablePlinth",
                [0.46, plinthHeight, 0.36],
                [x, 1 + plinthHeight / 2, z],
                0.025,
                offWhite
            )
        );
        const top = 1 + plinthHeight;
        shelf.add(
            cylinder(
                "TurntablePlatter",
                0.155,
                0.155,
                0.02,
                [x - 0.04, top + 0.01, z],
                darkMaterial
            )
        );
        shelf.add(
            cylinder(
                "TurntableRecord",
                0.148,
                0.148,
                0.008,
                [x - 0.04, top + 0.024, z],
                nearBlack
            )
        );
        shelf.add(
            cylinder(
                "TurntableLabel",
                0.05,
                0.05,
                0.01,
                [x - 0.04, top + 0.025, z],
                material("TurntableLabel", "#F09A8C")
            )
        );
        shelf.add(
            cylinder(
                "TurntableSpindle",
                0.006,
                0.006,
                0.03,
                [x - 0.04, top + 0.03, z],
                offWhite
            )
        );
        const pivot = new THREE.Vector3(x + 0.17, top + 0.05, z - 0.12);
        shelf.add(
            cylinder(
                "TonearmBase",
                0.025,
                0.03,
                0.05,
                [pivot.x, top + 0.025, pivot.z],
                darkMaterial
            )
        );
        const head = new THREE.Vector3(x + 0.04, top + 0.04, z + 0.08);
        shelf.add(strand("Tonearm", pivot, head, 0.006, offWhite));
        shelf.add(
            roundedBox(
                "TonearmHead",
                [0.03, 0.015, 0.045],
                [head.x, head.y, head.z],
                0.005,
                darkMaterial
            )
        );
        const button = cylinder(
            "TurntableButton",
            0.018,
            0.018,
            0.012,
            [x + 0.17, top + 0.006, z + 0.12],
            material("TurntableButton", "#5DBB63", { roughness: 0.5 })
        );
        shelf.add(button);
    }

    // Potted plant: a coral pot with a bushy cluster of leaves
    {
        const x = 0.6;
        const z = depth / 2;
        const potHeight = 0.16;
        shelf.add(
            cylinder(
                "PlantPot",
                0.1,
                0.075,
                potHeight,
                [x, 1 + potHeight / 2, z],
                material("PlantPot", "#F09A8C", { roughness: 0.7 })
            )
        );
        shelf.add(
            cylinder(
                "PlantPotRim",
                0.11,
                0.11,
                0.03,
                [x, 1 + potHeight - 0.015, z],
                material("PlantPotRim", "#E88A7C", { roughness: 0.7 })
            )
        );
        const leafMaterials = [
            material("PlantLeafDark", "#5E9E5A"),
            material("PlantLeafLight", "#7DBB6E"),
        ];
        const leaves: [number, number, number, number][] = [
            [0, 0.27, 0, 0.11],
            [-0.08, 0.22, 0.03, 0.08],
            [0.08, 0.23, -0.02, 0.085],
            [0.02, 0.21, 0.08, 0.075],
            [-0.03, 0.22, -0.08, 0.075],
            [0.04, 0.35, 0.02, 0.07],
        ];
        leaves.forEach(([lx, ly, lz, radius], index) => {
            const leaf = new THREE.Mesh(
                new THREE.SphereGeometry(radius, 18, 14),
                leafMaterials[index % 2]
            );
            leaf.name = `PlantLeaves${index + 1}`;
            leaf.position.set(x + lx, 1 + ly, z + lz);
            shelf.add(leaf);
        });
    }

    // A short stack of records lying flat between them
    {
        let y = 1;
        [0, 1, 2].forEach(index => {
            const sleeve = roundedBox(
                `ShelfTopRecord${index + 1}`,
                [0.333, 0.014, 0.333],
                [0.08, y + 0.007, depth / 2],
                0.004,
                pick(coverMaterials)
            );
            sleeve.rotation.y = (random() - 0.5) * 0.3;
            shelf.add(sleeve);
            y += 0.015;
        });
    }

    return shelf;
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
    .then(() => exportModel(buildPinboard(), "cartoon_pinboard.glb"))
    .then(() => exportModel(buildShelf(), "cartoon_shelf.glb"))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
