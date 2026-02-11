import React, { Suspense, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

const MODEL_URL = "/models/thousand_sunny.glb";

function ThousandSunnyModel() {
  const root = useRef();
  const gltf = useGLTF(MODEL_URL);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  useEffect(() => {
    scene.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = false;
      child.receiveShadow = false;
      child.material = child.material.clone();
      child.material.roughness = 0.6;
      child.material.metalness = 0.15;
      child.material.color?.multiply(new THREE.Color("#9db4d2"));
    });
  }, [scene]);

  useFrame((state) => {
    if (!root.current) return;
    const t = state.clock.elapsedTime;
    root.current.position.y = -1.45 + Math.sin(t * 0.35) * 0.08;
    root.current.rotation.y = -0.4 + Math.sin(t * 0.22) * 0.12;
  });

  return (
    <group ref={root} position={[-7, -1.45, -14]} scale={0.6}>
      <primitive object={scene} />
    </group>
  );
}

function ThousandSunnyFallback() {
  const root = useRef();

  useFrame((state) => {
    if (!root.current) return;
    const t = state.clock.elapsedTime;
    root.current.position.y = -1.5 + Math.sin(t * 0.35) * 0.08;
    root.current.rotation.y = -0.4 + Math.sin(t * 0.22) * 0.12;
  });

  return (
    <group ref={root} position={[-7, -1.5, -14]} scale={0.7}>
      <mesh>
        <boxGeometry args={[1.5, 0.2, 0.45]} />
        <meshStandardMaterial color="#355173" roughness={0.6} />
      </mesh>
      <mesh position={[0.2, 0.32, 0]}>
        <boxGeometry args={[0.8, 0.35, 0.3]} />
        <meshStandardMaterial color="#58779c" roughness={0.7} />
      </mesh>
      <mesh position={[0.2, 0.95, 0]}>
        <boxGeometry args={[0.04, 1, 0.04]} />
        <meshStandardMaterial color="#dad0b2" roughness={0.8} />
      </mesh>
      <mesh position={[0.45, 1.08, 0]} rotation={[0, 0, -0.15]}>
        <planeGeometry args={[0.7, 0.45]} />
        <meshStandardMaterial color="#f2ead0" side={THREE.DoubleSide} roughness={0.95} />
      </mesh>
    </group>
  );
}

export default function ThousandSunny({ hasModel }) {
  useEffect(() => {
    if (hasModel) {
      useGLTF.preload(MODEL_URL);
    }
  }, [hasModel]);

  if (!hasModel) return <ThousandSunnyFallback />;

  return (
    <Suspense fallback={<ThousandSunnyFallback />}>
      <ThousandSunnyModel />
    </Suspense>
  );
}
