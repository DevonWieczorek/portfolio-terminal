import { useScene } from "../lib/contexts/SceneContext";

export default function Desk() {
  const { roomSize } = useScene();
  
  // L-shaped desk positioned snug in northwest corner
  const cornerX = -roomSize / 2 + 0.1; // Very close to west wall
  const cornerZ = -roomSize / 2 + 0.1; // Very close to north wall
  const deskHeight = 1.2;
  const deskThickness = 0.15;
  
  return (
    <group>
      {/* L-shaped desk */}
      <group>
        {/* Horizontal part of L (along north wall) */}
        <mesh position={[cornerX + 2.5, deskHeight, cornerZ + 1]}>
          <boxGeometry args={[5, deskThickness, 2]} />
          <meshLambertMaterial color="#8B4513" />
        </mesh>
        
        {/* Vertical part of L (along west wall) */}
        <mesh position={[cornerX + 1, deskHeight, cornerZ + 3.5]}>
          <boxGeometry args={[2, deskThickness, 3]} />
          <meshLambertMaterial color="#8B4513" />
        </mesh>
        
        {/* Desk legs for horizontal section */}
        <mesh position={[cornerX + 0.2, deskHeight/2, cornerZ + 0.2]}>
          <boxGeometry args={[0.15, deskHeight, 0.15]} />
          <meshLambertMaterial color="#654321" />
        </mesh>
        <mesh position={[cornerX + 4.8, deskHeight/2, cornerZ + 0.2]}>
          <boxGeometry args={[0.15, deskHeight, 0.15]} />
          <meshLambertMaterial color="#654321" />
        </mesh>
        <mesh position={[cornerX + 4.8, deskHeight/2, cornerZ + 1.8]}>
          <boxGeometry args={[0.15, deskHeight, 0.15]} />
          <meshLambertMaterial color="#654321" />
        </mesh>
        
        {/* Desk legs for vertical section */}
        <mesh position={[cornerX + 0.2, deskHeight/2, cornerZ + 2.2]}>
          <boxGeometry args={[0.15, deskHeight, 0.15]} />
          <meshLambertMaterial color="#654321" />
        </mesh>
        <mesh position={[cornerX + 1.8, deskHeight/2, cornerZ + 2.2]}>
          <boxGeometry args={[0.15, deskHeight, 0.15]} />
          <meshLambertMaterial color="#654321" />
        </mesh>
        <mesh position={[cornerX + 1.8, deskHeight/2, cornerZ + 4.8]}>
          <boxGeometry args={[0.15, deskHeight, 0.15]} />
          <meshLambertMaterial color="#654321" />
        </mesh>
      </group>
      
      {/* Monitor positioned on horizontal section */}
      <group position={[cornerX + 3, deskHeight + deskThickness + 0.15, cornerZ + 0.3]}>
        {/* Monitor screen */}
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[1.2, 1, 0.8]} />
          <meshLambertMaterial color="#F5F5DC" />
        </mesh>
        
        {/* Monitor screen (dark) */}
        <mesh position={[0, 0.5, 0.41]}>
          <boxGeometry args={[1, 0.8, 0.01]} />
          <meshLambertMaterial color="#000000" />
        </mesh>
        
        {/* Monitor base */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.8, 0.3, 0.8]} />
          <meshLambertMaterial color="#D3D3D3" />
        </mesh>
      </group>
      
      {/* Invisible collision boxes */}
      <group>
        {/* Collision for horizontal desk section */}
        <mesh position={[cornerX + 2.5, deskHeight/2, cornerZ + 1]} visible={false}>
          <boxGeometry args={[5.2, deskHeight*2, 2.2]} />
        </mesh>
        
        {/* Collision for vertical desk section */}
        <mesh position={[cornerX + 1, deskHeight/2, cornerZ + 3.5]} visible={false}>
          <boxGeometry args={[2.2, deskHeight*2, 3.2]} />
        </mesh>
        
        {/* Collision for monitor */}
        <mesh position={[cornerX + 3, deskHeight + 0.6, cornerZ + 0.3]} visible={false}>
          <boxGeometry args={[1.4, 1.2, 1]} />
        </mesh>
      </group>
    </group>
  );
}