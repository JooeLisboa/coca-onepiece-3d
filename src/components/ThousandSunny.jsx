import { Suspense, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

const MODEL_URL = "/models/thousand_sunny.glb";

const expoOut = (t) => (t === 1 ? 1 : 1 - 2 ** (-10 * t));
const smoothstep = (t) => t * t * (3 - 2 * t);

function BoatRig({ object, mode, progress, onIntroDone, scale = 0.6 }) {
  const ref = useRef();
  const introDoneRef = useRef(false);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;

    if (mode === "intro") {
      const p = THREE.MathUtils.clamp(progress, 0, 1);
      const eased = expoOut(smoothstep(p));
      const z = THREE.MathUtils.lerp(-25, 8, eased);
      const x = THREE.MathUtils.lerp(-10, 8, eased);
      ref.current.position.set(x, -1.1 + Math.sin(eased * Math.PI) * 0.2, z);
      ref.current.rotation.set(0, THREE.MathUtils.lerp(-0.28, 0.38, eased), 0);

      if (p >= 1 && !introDoneRef.current) {
        introDoneRef.current = true;
        onIntroDone?.();
      }
      return;
    }

    introDoneRef.current = false;
    const cycle = ((t % 24) / 24) * 2;
    const ping = cycle <= 1 ? cycle : 2 - cycle;
    ref.current.position.set(THREE.MathUtils.lerp(-10, 10, ping), -1.35 + Math.sin(t * 0.8) * 0.09, -6.5);
    ref.current.rotation.set(0, (cycle <= 1 ? -0.22 : 0.22) + Math.sin(t * 0.45) * 0.06, 0);
  });

  return (
    <group ref={ref} scale={scale}>
      {object}
    </group>
  );
}

function Model({ mode, progress, onIntroDone }) {
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
    });
  }, [scene]);

  return <BoatRig object={<primitive object={scene} />} mode={mode} progress={progress} onIntroDone={onIntroDone} />;
}

function Fallback({ mode, progress, onIntroDone }) {
  return (
    <BoatRig
      mode={mode}
      progress={progress}
      onIntroDone={onIntroDone}
      scale={0.7}
      object={
        <mesh>
          <boxGeometry args={[1.6, 0.4, 0.5]} />
          <meshStandardMaterial color="#56718f" roughness={0.7} />
        </mesh>
      }
    />
  );
}

export default function ThousandSunny({ hasModel = true, mode = "loop", progress = 0, onIntroDone }) {
  useEffect(() => {
    if (hasModel) useGLTF.preload(MODEL_URL);
  }, [hasModel]);

  if (!hasModel) return <Fallback mode={mode} progress={progress} onIntroDone={onIntroDone} />;

  return (
    <Suspense fallback={<Fallback mode={mode} progress={progress} onIntroDone={onIntroDone} />}>
      <Model mode={mode} progress={progress} onIntroDone={onIntroDone} />
    </Suspense>
  );
}
