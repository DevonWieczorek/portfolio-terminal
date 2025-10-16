import { useRef, useEffect, useState, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useMovement } from "../lib/stores/useMovement";
import { useScene } from "../lib/contexts/SceneContext";
import { useExperience } from "../lib/stores/useExperience";
import * as THREE from "three";

export default function Camera() {
  const { camera } = useThree();
  const { position } = useMovement();
  const { roomSize, wallThickness, cameraBuffer, cameraOffset, zoomSettings } = useScene();
  const experience = useExperience((state) => state.experience);
  const target = useExperience((state) => state.target);
  const monitorTransform = useExperience((state) => state.monitorTransform);
  const setExperience = useExperience((state) => state.setExperience);

  // Camera zoom settings from context
  const [zoom, setZoom] = useState(zoomSettings.default);
  const minZoom = zoomSettings.min;
  const maxZoom = zoomSettings.max;
  const zoomSpeed = zoomSettings.speed;

  // Camera follow settings from context
  const baseCameraOffset = new THREE.Vector3(cameraOffset.x, cameraOffset.y, cameraOffset.z);
  const lookAtOffset = new THREE.Vector3(0, 2, 0);

  // Smooth camera movement
  const targetPosition = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());
  const monitorTargetPosition = useMemo(() => new THREE.Vector3(), []);
  const monitorLookAt = useMemo(() => new THREE.Vector3(), []);
  const monitorDirection = useMemo(() => new THREE.Vector3(), []);
  const monitorUp = useMemo(() => new THREE.Vector3(), []);
  const monitorFocusTarget = useMemo(() => new THREE.Vector3(), []);

  // Mouse wheel zoom controls
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (target === "terminal") {
        return;
      }

      event.preventDefault();
      const delta = event.deltaY * -0.001;
      setZoom(prevZoom => Math.max(minZoom, Math.min(maxZoom, prevZoom + delta * zoomSpeed)));
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (target === "terminal") {
        return;
      }

      if (event.key === 'i' || event.key === 'I') {
        setZoom(prevZoom => Math.max(minZoom, prevZoom - zoomSpeed));
      } else if (event.key === 'o' || event.key === 'O') {
        setZoom(prevZoom => Math.min(maxZoom, prevZoom + zoomSpeed));
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [maxZoom, minZoom, target, zoomSpeed]);

  useFrame(() => {
    if (target === 'terminal' && monitorTransform) {
      monitorLookAt.fromArray(monitorTransform.position);
      monitorDirection.fromArray(monitorTransform.direction).normalize();
      monitorUp.fromArray(monitorTransform.up).normalize();

      const [sizeX, sizeY, sizeZ] = monitorTransform.size;
      const focusDistance = Math.max(sizeZ, sizeX, 0.75) * 1.85;
      const verticalOffset = Math.max(sizeY, 0.5) * 0.25;
      const focusLift = Math.max(sizeY, 0.5) * 0.05;

      monitorTargetPosition
        .copy(monitorLookAt)
        .add(monitorDirection.clone().multiplyScalar(focusDistance))
        .add(monitorUp.clone().multiplyScalar(verticalOffset));

      monitorFocusTarget
        .copy(monitorLookAt)
        .add(monitorUp.clone().multiplyScalar(focusLift));

      camera.position.lerp(monitorTargetPosition, 0.08);
      camera.lookAt(monitorFocusTarget);

      if (experience !== 'terminal' && camera.position.distanceTo(monitorTargetPosition) < 0.05) {
        camera.position.copy(monitorTargetPosition);
        camera.lookAt(monitorFocusTarget);
        setExperience('terminal');
      }

      return;
    }

    // Calculate camera offset based on zoom
    const cameraOffset = baseCameraOffset.clone().multiplyScalar(zoom);

    // Room boundary limits
    const maxX = roomSize / 2 - wallThickness - cameraBuffer;
    const minX = -roomSize / 2 + wallThickness + cameraBuffer;
    const maxZ = roomSize / 2 - wallThickness - cameraBuffer;
    const minZ = -roomSize / 2 + wallThickness + cameraBuffer;

    // Calculate ideal camera position
    let idealCameraX = position.x + cameraOffset.x;
    let idealCameraZ = position.z + cameraOffset.z;

    // Check if we need to adjust camera position due to wall proximity
    let adjustedCameraX = idealCameraX;
    let adjustedCameraZ = idealCameraZ;

    // Handle front/back wall proximity (Z-axis)
    if (idealCameraZ > maxZ) {
      // Camera would go past front wall, move it forward gradually
      const overflow = idealCameraZ - maxZ;
      adjustedCameraZ = maxZ;
      // Adjust height slightly to maintain good viewing angle
      cameraOffset.y = Math.min(cameraOffset.y + overflow * 0.5, cameraOffset.y * 1.5);
    } else if (idealCameraZ < minZ) {
      // Camera would go past back wall
      const overflow = minZ - idealCameraZ;
      adjustedCameraZ = minZ;
      cameraOffset.y = Math.min(cameraOffset.y + overflow * 0.5, cameraOffset.y * 1.5);
    }

    // Handle left/right wall proximity (X-axis)
    if (idealCameraX > maxX) {
      adjustedCameraX = maxX;
    } else if (idealCameraX < minX) {
      adjustedCameraX = minX;
    }

    // Set final target position
    targetPosition.current.set(
      adjustedCameraX,
      position.y + cameraOffset.y,
      adjustedCameraZ
    );

    targetLookAt.current.set(
      position.x + lookAtOffset.x,
      position.y + lookAtOffset.y,
      position.z + lookAtOffset.z
    );

    // Ensure camera stays at reasonable height
    targetPosition.current.y = Math.max(3, targetPosition.current.y);

    // Smooth camera movement with slightly faster response for boundary situations
    const lerpSpeed = (adjustedCameraX !== idealCameraX || adjustedCameraZ !== idealCameraZ || (target === 'scene' && experience !== 'scene')) ? 0.08 : 0.05;
    camera.position.lerp(targetPosition.current, lerpSpeed);
    camera.lookAt(targetLookAt.current);

    if (target === 'scene' && experience !== 'scene') {
      if (camera.position.distanceTo(targetPosition.current) < 0.6) {
        setExperience('scene');
      }
    }
  });

  return null;
}
