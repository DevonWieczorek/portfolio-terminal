import { useRef, useEffect, useState, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useMovement } from "@/lib/stores/useMovement";
import { useScene } from "@/lib/contexts/SceneContext";
import * as THREE from "three";
import { useExperience } from "@/lib/stores/useExperience";

export default function Camera() {
  const { camera } = useThree();
  const { position } = useMovement();
  const { roomSize, wallThickness, cameraBuffer, cameraOffset, zoomSettings } = useScene();
  const { mode, targetMode, isTransitioning, cameraOverride, isBlackout, startBlackout, completeTransition } = useExperience(state => ({
    mode: state.mode,
    targetMode: state.targetMode,
    isTransitioning: state.isTransitioning,
    cameraOverride: state.cameraOverride,
    isBlackout: state.isBlackout,
    startBlackout: state.startBlackout,
    completeTransition: state.completeTransition,
  }));

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
  const overridePosition = useMemo(() => new THREE.Vector3(), []);
  const overrideLookAt = useMemo(() => new THREE.Vector3(), []);
  const smoothLookAt = useRef(new THREE.Vector3());
  const desiredPosition = useMemo(() => new THREE.Vector3(), []);
  const desiredLookAt = useMemo(() => new THREE.Vector3(), []);
  const modeRef = useRef(mode);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // Mouse wheel zoom controls
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (modeRef.current !== "scene") {
        return;
      }

      event.preventDefault();
      const delta = event.deltaY * -0.001;
      setZoom(prevZoom => Math.max(minZoom, Math.min(maxZoom, prevZoom + delta * zoomSpeed)));
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (modeRef.current !== "scene") {
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
  }, [minZoom, maxZoom, zoomSpeed]);

  useFrame(() => {
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
    const baseLerpSpeed = (adjustedCameraX !== idealCameraX || adjustedCameraZ !== idealCameraZ) ? 0.08 : 0.05;
    const shouldUseOverride = Boolean(cameraOverride) && (mode === "terminal" || (isTransitioning && targetMode === "terminal"));

    if (cameraOverride) {
      overridePosition.set(...cameraOverride.position);
      overrideLookAt.set(...cameraOverride.lookAt);
    }

    desiredPosition.copy(shouldUseOverride ? overridePosition : targetPosition.current);
    desiredLookAt.copy(shouldUseOverride ? overrideLookAt : targetLookAt.current);

    const lerpSpeed = shouldUseOverride ? 0.12 : baseLerpSpeed;

    camera.position.lerp(desiredPosition, lerpSpeed);

    if (smoothLookAt.current.lengthSq() === 0) {
      smoothLookAt.current.copy(desiredLookAt);
    }

    const lookAtLerp = shouldUseOverride ? 0.18 : 0.1;
    smoothLookAt.current.lerp(desiredLookAt, lookAtLerp);
    camera.lookAt(smoothLookAt.current);

    if (isTransitioning && !isBlackout) {
      const distanceToTarget = camera.position.distanceTo(desiredPosition);
      const threshold = shouldUseOverride ? 0.08 : 0.6;

      if (distanceToTarget < threshold) {
        if (targetMode === "terminal") {
          startBlackout();
        } else {
          completeTransition();
        }
      }
    }
  });

  return null;
}
