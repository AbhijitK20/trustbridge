"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";

type Quality = "high" | "low";

function Dust({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const array = new Float32Array(count * 3);
    let seed = 0x9e3779b9;
    const random = () => {
      seed = (seed + 0x6d2b79f5) >>> 0;
      let t = seed;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    for (let i = 0; i < count; i += 1) {
      const radius = 2.9 + random() * 2.6;
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);
      array[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      array[i * 3 + 1] = radius * Math.cos(phi) * 0.72;
      array[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    return array;
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.045;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.22) * 0.08;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.032}
        color="#e7d4a8"
        transparent
        opacity={0.65}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function Seal({ quality }: { quality: Quality }) {
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const arcA = useRef<THREE.Mesh>(null);
  const arcB = useRef<THREE.Mesh>(null);
  const pointer = useThree((state) => state.pointer);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (group.current) {
      group.current.rotation.y += delta * 0.16;
      group.current.rotation.x = THREE.MathUtils.lerp(
        group.current.rotation.x,
        pointer.y * 0.18 + Math.sin(t * 0.3) * 0.04,
        0.04,
      );
      group.current.rotation.z = THREE.MathUtils.lerp(
        group.current.rotation.z,
        pointer.x * 0.12,
        0.04,
      );
    }
    if (core.current) {
      core.current.rotation.y -= delta * 0.24;
      core.current.rotation.x += delta * 0.08;
    }
    if (arcA.current) arcA.current.rotation.z = t * 0.34;
    if (arcB.current) arcB.current.rotation.z = -t * 0.22;
  });

  return (
    <group ref={group} scale={1.06}>
      <mesh rotation={[Math.PI / 2.35, 0, 0]}>
        <torusGeometry args={[2.02, 0.145, 48, 220]} />
        <meshStandardMaterial
          color="#c9a45c"
          metalness={0.94}
          roughness={0.24}
          envMapIntensity={2.9}
        />
      </mesh>

      <mesh rotation={[Math.PI / 2.35, 0, 0]} scale={1.007}>
        <torusGeometry args={[2.02, 0.15, 24, 32, Math.PI * 0.42]} />
        <meshStandardMaterial
          color="#e7d4a8"
          emissive="#8a6a2f"
          emissiveIntensity={0.55}
          metalness={0.7}
          roughness={0.28}
        />
      </mesh>

      <mesh ref={arcA} rotation={[Math.PI / 1.7, 0.34, 0]}>
        <torusGeometry args={[2.42, 0.024, 12, 180, Math.PI * 1.3]} />
        <meshBasicMaterial color="#e7d4a8" toneMapped={false} />
      </mesh>

      <mesh ref={arcB} rotation={[Math.PI / 2.9, -0.5, 0.4]}>
        <torusGeometry args={[2.62, 0.012, 8, 140, Math.PI * 0.85]} />
        <meshBasicMaterial color="#b08a46" toneMapped={false} transparent opacity={0.6} />
      </mesh>

      <mesh ref={core}>
        <icosahedronGeometry args={[0.78, quality === "high" ? 8 : 3]} />
        <meshPhysicalMaterial
          color="#75281b"
          transmission={quality === "high" ? 0.55 : 0.2}
          thickness={1.6}
          roughness={0.18}
          metalness={0}
          ior={1.52}
          clearcoat={1}
          clearcoatRoughness={0.14}
          envMapIntensity={2.2}
          emissive="#2c0a05"
          emissiveIntensity={0.4}
        />
      </mesh>

      <mesh scale={1.28}>
        <icosahedronGeometry args={[0.92, 1]} />
        <meshBasicMaterial
          color="#e7d4a8"
          wireframe
          transparent
          opacity={0.12}
          toneMapped={false}
        />
      </mesh>

      {[0, 1, 2].map((index) => {
        const angle = (index / 3) * Math.PI * 2;
        return (
          <mesh
            key={index}
            position={[Math.cos(angle) * 2.02, Math.sin(angle) * 0.3, Math.sin(angle) * 2.02]}
          >
            <sphereGeometry args={[0.055, 20, 20]} />
            <meshStandardMaterial
              color="#f3e7cc"
              emissive="#c9a45c"
              emissiveIntensity={0.7}
              metalness={0.4}
              roughness={0.2}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export default function VaultScene({ quality = "high" }: { quality?: Quality }) {
  return (
    <Canvas
      dpr={quality === "high" ? [1, 1.8] : [1, 1.3]}
      camera={{ position: [0, 0, 10.2], fov: 35 }}
      gl={{ antialias: quality === "high", alpha: true, powerPreference: "high-performance" }}
      style={{ pointerEvents: "none" }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.55} />
        <directionalLight position={[4, 6, 5]} intensity={1.5} color="#fff3df" />
        <pointLight position={[-5, -2, 3]} intensity={18} color="#e7d4a8" distance={12} />
        <pointLight position={[3, -4, -4]} intensity={10} color="#4a3524" distance={14} />

        <Environment resolution={quality === "high" ? 256 : 128} frames={1}>
          <Lightformer
            form="ring"
            intensity={6}
            color="#e7d4a8"
            scale={7}
            position={[4, 3, -5]}
          />
          <Lightformer
            form="rect"
            intensity={5}
            color="#F3EFE6"
            scale={[9, 3, 1]}
            position={[-5, 1, 3]}
            rotation={[0, Math.PI / 3, 0]}
          />
          <Lightformer
            form="ring"
            intensity={5}
            color="#f0dcb0"
            scale={4}
            position={[-4, -3, -4]}
          />
          <Lightformer
            form="rect"
            intensity={2.4}
            color="#3b2a1c"
            scale={[7, 7, 1]}
            position={[0, -5, -3]}
          />
        </Environment>

        <Seal quality={quality} />
        <Dust count={quality === "high" ? 520 : 180} />
      </Suspense>
    </Canvas>
  );
}
