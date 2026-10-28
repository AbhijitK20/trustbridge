"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import * as THREE from "three";
import { useMediaQuery } from "./ui";

type Mode = "evidence" | "seal";

function EvidenceStack({ quality }: { quality: "high" | "low" }) {
  const group = useRef<THREE.Group>(null);
  const pointer = useThree((state) => state.pointer);

  useFrame((state, delta) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    group.current.rotation.y += delta * 0.13;
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      pointer.y * 0.16 + 0.42,
      0.04,
    );
    group.current.rotation.z = THREE.MathUtils.lerp(
      group.current.rotation.z,
      pointer.x * 0.1 + Math.sin(t * 0.4) * 0.02,
      0.04,
    );
    group.current.position.y = Math.sin(t * 0.7) * 0.08;
  });

  const plates = [
    { y: -0.64, r: 1.44, top: "#233a30" },
    { y: 0, r: 1.14, top: "#2b463a" },
    { y: 0.64, r: 0.84, top: "#33523f" },
  ];
  const segments = quality === "high" ? 64 : 32;

  return (
    <group ref={group} rotation={[0.42, 0, 0]}>
      {plates.map((plate, index) => (
        <group key={index} position={[0, plate.y, 0]}>
          <mesh>
            <cylinderGeometry args={[plate.r, plate.r, 0.16, segments]} />
            <meshStandardMaterial
              color="#c9a45c"
              metalness={0.95}
              roughness={0.24}
              envMapIntensity={2.6}
            />
          </mesh>
          <mesh position={[0, 0.085, 0]}>
            <cylinderGeometry args={[plate.r * 0.93, plate.r * 0.93, 0.02, segments]} />
            <meshStandardMaterial color={plate.top} metalness={0.45} roughness={0.5} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
            <torusGeometry args={[plate.r + 0.02, 0.013, 8, quality === "high" ? 160 : 64]} />
            <meshBasicMaterial color="#e7d4a8" toneMapped={false} transparent opacity={0.75} />
          </mesh>
        </group>
      ))}

      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.85, 0.02, 10, quality === "high" ? 180 : 72]} />
        <meshBasicMaterial color="#b08a46" toneMapped={false} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

function SealMark() {
  const group = useRef<THREE.Group>(null);
  const stone = useRef<THREE.Mesh>(null);
  const pointer = useThree((state) => state.pointer);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (group.current) {
      group.current.rotation.y += delta * 0.16;
      group.current.rotation.x = THREE.MathUtils.lerp(
        group.current.rotation.x,
        pointer.y * 0.2 + Math.sin(t * 0.3) * 0.04,
        0.04,
      );
      group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, pointer.x * 0.12, 0.04);
    }
    if (stone.current) {
      stone.current.rotation.y -= delta * 0.24;
      stone.current.rotation.x += delta * 0.08;
    }
  });

  return (
    <group ref={group} scale={1.04}>
      <mesh rotation={[Math.PI / 2.35, 0, 0]}>
        <torusGeometry args={[1.72, 0.13, 40, 180]} />
        <meshStandardMaterial
          color="#d8b574"
          metalness={0.35}
          roughness={0.38}
          envMapIntensity={1.8}
          emissive="#5a441c"
          emissiveIntensity={0.4}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2.35, 0, 0]} scale={1.008}>
        <torusGeometry args={[1.72, 0.135, 20, 30, Math.PI * 0.42]} />
        <meshStandardMaterial
          color="#e7d4a8"
          emissive="#8a6a2f"
          emissiveIntensity={0.5}
          metalness={0.7}
          roughness={0.28}
        />
      </mesh>
      <mesh ref={stone}>
        <icosahedronGeometry args={[0.66, 4]} />
        <meshStandardMaterial
          color="#8f3323"
          metalness={0}
          roughness={0.42}
          emissive="#4a140c"
          emissiveIntensity={0.55}
          envMapIntensity={1.2}
        />
      </mesh>
      <mesh rotation={[Math.PI / 1.7, 0.34, 0]}>
        <torusGeometry args={[2.08, 0.02, 10, 140, Math.PI * 1.3]} />
        <meshBasicMaterial color="#e7d4a8" toneMapped={false} />
      </mesh>
    </group>
  );
}

export default function InnerScene({
  mode = "evidence",
  className,
}: {
  mode?: Mode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const high = useMediaQuery("(min-width: 900px)");
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => setVisible(entries.some((entry) => entry.isIntersecting)),
      { rootMargin: "120px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  if (reduced) return null;

  return (
    <div ref={ref} className={className} aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 6.4], fov: 34 }}
        dpr={high ? [1, 1.6] : [1, 1.2]}
        frameloop={visible ? "always" : "demand"}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={1.6} />
        <directionalLight position={[4, 6, 5]} intensity={2.2} color="#fff3df" />
        <pointLight position={[-5, -2, 3]} intensity={25} color="#e0a45a" distance={12} />
        <pointLight position={[3, -4, -4]} intensity={8} color="#4a3524" distance={14} />
        <Suspense fallback={null}>
          <Environment resolution={64} frames={1}>
            <Lightformer intensity={3} position={[0, 4, -4]} scale={[8, 4, 1]} color="#f7ead0" />
            <Lightformer intensity={1.2} position={[-5, 0, 2]} scale={[4, 6, 1]} color="#c9a45c" />
            <Lightformer intensity={0.8} position={[5, -2, 1]} scale={[4, 4, 1]} color="#3b2a1c" />
          </Environment>
          {mode === "seal" ? <SealMark /> : <EvidenceStack quality={high ? "high" : "low"} />}
        </Suspense>
      </Canvas>
    </div>
  );
}
