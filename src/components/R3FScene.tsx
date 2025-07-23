"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, PerspectiveCamera } from "@react-three/drei";
import { useState, useRef, useEffect } from "react";
import { Vector3 } from "three";
import Terminal from "./Terminal";
import { SceneProvider, useScene } from "@/scene/SceneContext";

function Room() {
  const { room } = useScene();
  const half = room.size / 2;
  const wallHeight = room.height;
  const thickness = room.wallThickness;

  return (
    <>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[room.size, room.size]} />
        <meshStandardMaterial color={"#d3b38c"} />
      </mesh>
      {/* Walls */}
      <mesh position={[0, wallHeight / 2, -half]} receiveShadow>
        <boxGeometry args={[room.size, wallHeight, thickness]} />
        <meshStandardMaterial color={"#f5f5dc"} />
      </mesh>
      <mesh position={[0, wallHeight / 2, half]} receiveShadow>
        <boxGeometry args={[room.size, wallHeight, thickness]} />
        <meshStandardMaterial color={"#f5f5dc"} />
      </mesh>
      <mesh position={[-half, wallHeight / 2, 0]} receiveShadow>
        <boxGeometry args={[thickness, wallHeight, room.size]} />
        <meshStandardMaterial color={"#f5f5dc"} />
      </mesh>
      <mesh position={[half, wallHeight / 2, 0]} receiveShadow>
        <boxGeometry args={[thickness, wallHeight, room.size]} />
        <meshStandardMaterial color={"#f5f5dc"} />
      </mesh>
    </>
  );
}

function Desk({ onActivate }: { onActivate: () => void }) {
  const { room } = useScene();
  const size = 150;
  const half = room.size / 2;

  // L-shaped desk pieces
  const north = [half - size / 2 - 20, 75, half - size / 2];
  const east = [half - size / 2, 75, half - size / 2 - size];

  return (
    <>
      <mesh position={north as any} castShadow>
        <boxGeometry args={[size, 50, size]} />
        <meshStandardMaterial color={"#654321"} />
      </mesh>
      <mesh position={east as any} castShadow>
        <boxGeometry args={[size, 50, size]} />
        <meshStandardMaterial color={"#654321"} />
      </mesh>
      <mesh
        position={[north[0], north[1] + 50, north[2] - 20] as any}
        onClick={onActivate}
        castShadow
      >
        <boxGeometry args={[40, 40, 10]} />
        <meshStandardMaterial color="black" />
        <Html position={[0, 30, 0]} distanceFactor={15} center>
          <button
            style={{ padding: "4px 8px", cursor: "pointer" }}
            onClick={onActivate}
          >
            Open Terminal
          </button>
        </Html>
      </mesh>
    </>
  );
}

function Player() {
  const { movement } = useScene();
  const ref = useRef<any>();
  const velocity = useRef(new Vector3(0, 0, 0));

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!ref.current) return;
      const speed = movement.speed;
      switch (e.key) {
        case "ArrowUp":
        case "w":
          velocity.current.z = -speed;
          break;
        case "ArrowDown":
        case "s":
          velocity.current.z = speed;
          break;
        case "ArrowLeft":
        case "a":
          velocity.current.x = -speed;
          break;
        case "ArrowRight":
        case "d":
          velocity.current.x = speed;
          break;
        default:
          break;
      }
    };
    const stop = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "ArrowDown":
        case "s":
          velocity.current.z = 0;
          break;
        case "ArrowLeft":
        case "a":
        case "ArrowRight":
        case "d":
          velocity.current.x = 0;
          break;
      }
    };
    window.addEventListener("keydown", handleKey);
    window.addEventListener("keyup", stop);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("keyup", stop);
    };
  }, [movement.speed]);

  useFrame(() => {
    if (ref.current) {
      ref.current.position.add(velocity.current);
      const b = movement.boundary;
      ref.current.position.x = Math.max(-b, Math.min(b, ref.current.position.x));
      ref.current.position.z = Math.max(-b, Math.min(b, ref.current.position.z));
    }
  });

  return (
    <mesh ref={ref} position={[0, 25, 0]} castShadow>
      <boxGeometry args={[50, 50, 50]} />
      <meshStandardMaterial color="skyblue" />
    </mesh>
  );
}

export default function R3FScene() {
  const { camera } = useScene();
  const camRef = useRef<any>();
  const [showTerminal, setShowTerminal] = useState(false);
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    if (zoom) {
      const t = setTimeout(() => setShowTerminal(true), 1500);
      return () => clearTimeout(t);
    }
  }, [zoom]);

  useFrame(() => {
    if (zoom && camRef.current) {
      const target = new Vector3(420, 120, 420);
      camRef.current.position.lerp(target, 0.05);
      camRef.current.lookAt(440, 120, 400);
    }
  });

  return (
    <SceneProvider>
      <div style={{ width: "100%", height: "100vh" }}>
        <Canvas shadows>
          <PerspectiveCamera
            ref={camRef}
            makeDefault
            position={[0, camera.offset[1], camera.offset[2]]}
          />
          <ambientLight intensity={0.5} />
          <directionalLight position={[0, 300, 300]} intensity={0.8} castShadow />
          <Room />
          <Desk onActivate={() => setZoom(true)} />
          <Player />
          <OrbitControls
            maxDistance={camera.zoom.max}
            minDistance={camera.zoom.min}
            enablePan={false}
          />
        </Canvas>
        {showTerminal && (
          <div
            style={{ position: "absolute", top: 0, left: 0, width: "100%" }}
          >
            <Terminal onCommand={() => {}} />
          </div>
        )}
      </div>
    </SceneProvider>
  );
}
