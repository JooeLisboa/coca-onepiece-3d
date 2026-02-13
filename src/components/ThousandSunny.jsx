import React, { Suspense, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

const MODEL_URL = "/models/thousand_sunny.glb";

function BoatRig({ object, mode, progress, scale }) {
  const root = useRef();

  useFrame((state) => {
    if (!root.current) return;
    const t = state.clock.elapsedTime;

    if (mode === "intro") {
      const p = THREE.MathUtils.clamp(progress, 0, 1);
      const z = THREE.MathUtils.lerp(-120, 10, p);
      const x = THREE.MathUtils.lerp(-8, 6, p);
      root.current.position.set(x, -1.1 + Math.sin(p * Math.PI) * 0.2, z);
      root.current.rotation.set(0, THREE.MathUtils.lerp(-0.35, 0.42, p), 0);
      return;
    }

    const cycle = ((t % 24) / 24) * 2;
    const pingPong = cycle <= 1 ? cycle : 2 - cycle;
    const x = THREE.MathUtils.lerp(-10, 10, pingPong);
    root.current.position.set(x, -1.42 + Math.sin(t * 0.7) * 0.1, -14);
    root.current.rotation.set(0, (cycle <= 1 ? -0.32 : 0.32) + Math.sin(t * 0.45) * 0.08, 0);
  });

  return (
    <group ref={root} scale={scale}>
      {object}
    </group>
  );
}

function ThousandSunnyModel({ mode, progress }) {
  const gltf = useGLTF(MODEL_URL);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  useEffect(() => {
    scene.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = false;
      child.receiveShadow = false;
      child.raycast = () => null;
      child.material = child.material.clone();
      child.material.roughness = 0.62;
      child.material.metalness = 0.12;
      child.material.color?.multiply(new THREE.Color("#a9bed7"));
    });
  }, [scene]);

  return <BoatRig object={<primitive object={scene} />} mode={mode} progress={progress} scale={0.62} />;
}

function ThousandSunnyFallback({ mode, progress }) {
  return (
    <BoatRig
      mode={mode}
      progress={progress}
      scale={0.7}
      object={
        <mesh>
          <boxGeometry args={[1.6, 0.4, 0.5]} />
          <meshStandardMaterial color="#4c6788" roughness={0.7} />
        </mesh>
      }
    />
  );
}

export default function ThousandSunny({ hasModel = true, mode = "loop", progress = 0, onIntroDone }) {
  const introDoneSent = useRef(false);

  useEffect(() => {
    if (hasModel) useGLTF.preload(MODEL_URL);
  }, [hasModel]);

  useEffect(() => {
    if (mode !== "intro") {
      introDoneSent.current = false;
      return;
    }
    if (progress >= 1 && !introDoneSent.current) {
      introDoneSent.current = true;
      onIntroDone?.();
    }
  }, [mode, onIntroDone, progress]);

  if (!hasModel) return <ThousandSunnyFallback mode={mode} progress={progress} />;
  return (
    <Suspense fallback={<ThousandSunnyFallback mode={mode} progress={progress} />}>
      <ThousandSunnyModel mode={mode} progress={progress} />
    </Suspense>
  );
}
