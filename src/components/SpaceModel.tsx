import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars, Float } from '@react-three/drei'
import { Suspense } from 'react'
import * as THREE from 'three'

function Wheel({ position }: { position: [number, number, number] }) {
  return <mesh position={position} rotation={[Math.PI / 2, 0, 0]} castShadow>
    <cylinderGeometry args={[0.32, 0.32, 0.16, 20]} />
    <meshStandardMaterial color="#252a31" roughness={0.9} />
    <mesh position={[0, 0.09, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.14, 0.14, 0.03, 16]} />
      <meshStandardMaterial color="#a8a18d" metalness={0.6} />
    </mesh>
  </mesh>
}
function Rover({ lunar = false }: { lunar?: boolean }) {
  const bodyColor = lunar ? '#c4a66a' : '#d58a36'
  return <group>
    <mesh position={[0, 0.95, 0]} castShadow>
      <boxGeometry args={lunar ? [1.8, 0.24, 1.15] : [1.25, 0.72, 1.05]} />
      <meshStandardMaterial color={bodyColor} metalness={0.45} roughness={0.55} />
    </mesh>
    {!lunar && <>
      <mesh position={[0, 1.48, 0.08]}><cylinderGeometry args={[0.22, 0.25, 0.5, 16]} /><meshStandardMaterial color="#c9c3b2" /></mesh>
      <mesh position={[0, 1.8, 0.08]}><boxGeometry args={[0.5, 0.25, 0.08]} /><meshStandardMaterial color="#d8d0b8" /></mesh>
      <mesh position={[-0.48, 1.15, 0]}><boxGeometry args={[0.12, 0.6, 0.9]} /><meshStandardMaterial color="#c2a56e" /></mesh>
    </>}
    {lunar && <mesh position={[0, 1.35, 0]}><boxGeometry args={[0.42, 0.4, 0.45]} /><meshStandardMaterial color="#d6d1bd" /></mesh>}
    {[-0.72, 0.72].map((x) => [-0.52, 0.52].map((z) => <Wheel key={`${x}-${z}`} position={[x, 0.42, z]} />))}
    <mesh position={[0, 0.5, 0]}><boxGeometry args={[1.6, 0.08, 0.08]} /><meshStandardMaterial color="#aaa" /></mesh>
  </group>
}
function Helicopter() {
  return <group>
    <mesh position={[0, 0.35, 0]}><boxGeometry args={[0.8, 0.22, 0.55]} /><meshStandardMaterial color="#d8d0bb" metalness={0.4} /></mesh>
    <mesh position={[0, 0.05, 0]}><boxGeometry args={[0.12, 0.5, 0.12]} /><meshStandardMaterial color="#9b9a91" /></mesh>
    <mesh position={[0, 0.68, 0]}><cylinderGeometry args={[0.08, 0.08, 0.18, 12]} /><meshStandardMaterial color="#777" /></mesh>
    <mesh position={[0, 0.8, 0]}><boxGeometry args={[2.5, 0.035, 0.08]} /><meshStandardMaterial color="#303944" /></mesh>
    <mesh position={[0, 0.8, 0]} rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[2.5, 0.035, 0.08]} /><meshStandardMaterial color="#303944" /></mesh>
    <mesh position={[0.52, 0.28, 0]}><boxGeometry args={[0.5, 0.05, 0.05]} /><meshStandardMaterial color="#a7a08c" /></mesh>
    <mesh position={[0.76, 0.28, 0]}><boxGeometry args={[0.08, 0.4, 0.08]} /><meshStandardMaterial color="#aaa" /></mesh>
    <mesh position={[0.76, 0.5, 0]}><boxGeometry args={[0.45, 0.025, 0.05]} /><meshStandardMaterial color="#333" /></mesh>
    <mesh position={[-0.32, -0.05, 0.2]}><cylinderGeometry args={[0.035, 0.035, 0.45, 8]} /><meshStandardMaterial color="#888" /></mesh>
    <mesh position={[0.32, -0.05, 0.2]}><cylinderGeometry args={[0.035, 0.035, 0.45, 8]} /><meshStandardMaterial color="#888" /></mesh>
  </group>
}
function Scene({ id }: { id: string }) {
  return <Canvas camera={{ position: [4, 3, 5], fov: 42 }} shadows dpr={[1, 1.7]}>
    <color attach="background" args={['#0a1220']} />
    <ambientLight intensity={1.2} />
    <directionalLight position={[5, 8, 5]} intensity={2.4} castShadow />
    <pointLight position={[-4, 2, -3]} color="#72b9ff" intensity={1.5} />
    <Stars radius={55} depth={35} count={1000} factor={2} saturation={0} fade speed={0.5} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
      <circleGeometry args={[5, 64]} />
      <meshStandardMaterial color={id === 'lrv' ? '#817765' : '#7a4c39'} roughness={1} />
    </mesh>
    <Suspense fallback={null}>
      <Float speed={1.1} rotationIntensity={0.08} floatIntensity={0.1}>
        {id === 'ingenuity' ? <Helicopter /> : <Rover lunar={id === 'lrv'} />}
      </Float>
    </Suspense>
    <OrbitControls enablePan={false} minDistance={3} maxDistance={9} />
  </Canvas>
}
export default function SpaceModel({ id }: { id: string }) {
  return <div className="model-wrap" role="img" aria-label={`Interactive 3D conceptual model of ${id}. Drag to rotate and scroll to zoom.`}>
    <Scene id={id} />
    <div className="model-hint">↔ DRAG TO ROTATE · SCROLL TO ZOOM</div>
  </div>
}
