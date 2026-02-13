import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { TextureLoader, RepeatWrapping } from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import * as THREE from "three";

const BASE_YAW_SPEED = 0.09;

export default function RealCan({
  hakiPulseActive,
  onClick,
  onHoverChange,
  arSessionActive,
  arScale,
  arRotationY,
  arPosition,
}) {
  const meshRef = useRef();
  const dropletsTextureRaw = useLoader(TextureLoader, "/textures/droplets_normal.jpg");
  const labelTexture = useLoader(TextureLoader, "/coca-label.jpg");
  const canObj = useLoader(OBJLoader, "/14025_Soda_Can_v3_l3.obj");

  const baseObj = useMemo(() => canObj.clone(true), [canObj]);
  const overlayObj = useMemo(() => canObj.clone(true), [canObj]);
  const dropletsTexture = useMemo(() => {
    const tx = dropletsTextureRaw.clone();
    tx.wrapS = RepeatWrapping;
    tx.wrapT = RepeatWrapping;
    tx.repeat.set(2, 3);
    tx.flipY = false;
    return tx;
  }, [dropletsTextureRaw]);

  useLayoutEffect(() => {
    baseObj.traverse((child) => {
      if (!child.isMesh) return;
      child.material = new THREE.MeshStandardMaterial({
        map: labelTexture,
        metalness: 0.58,
        roughness: 0.26,
        envMapIntensity: 1.9,
        emissive: new THREE.Color("#20070a"),
        emissiveIntensity: 0.03,
      });
      child.castShadow = true;
      child.receiveShadow = true;
    });

    overlayObj.traverse((child) => {
      if (!child.isMesh) return;
      child.material = new THREE.MeshPhysicalMaterial({
        normalMap: dropletsTexture,
        normalScale: new THREE.Vector2(0.6, 0.6),
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        roughness: 0.18,
        transmission: 0.2,
        transparent: true,
        opacity: 0.35,
        envMapIntensity: 1.4,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      });
      child.castShadow = false;
      child.receiveShadow = false;
    });
  }, [baseObj, dropletsTexture, labelTexture, overlayObj]);

  const dropletsRef = useRef();

  useLayoutEffect(() => {
    dropletsRef.current = dropletsTexture;
  }, [dropletsTexture]);

  useFrame((state, delta) => {
    if (dropletsRef.current) {
      dropletsRef.current.offset.y -= 0.0004;
      dropletsRef.current.offset.x = Math.sin(state.clock.elapsedTime * 0.22) * 0.012;
    }

    if (!meshRef.current) return;

    if (arSessionActive) {
      const p = arPosition ?? [0, -0.2, -1.1];
      meshRef.current.position.set(p[0], p[1], p[2]);
      meshRef.current.rotation.set(0, arRotationY, 0);
      meshRef.current.scale.setScalar(arScale);
      return;
    }

    meshRef.current.position.set(0, -0.6, 0);
    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, 0, 0.12);
    meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, 0, 0.12);
    meshRef.current.rotation.y += BASE_YAW_SPEED * delta;

    const targetScale = hakiPulseActive ? 1.05 : 1;
    meshRef.current.scale.setScalar(
      THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, hakiPulseActive ? 0.14 : 0.08),
    );

    baseObj.traverse((child) => {
      if (!child.isMesh) return;
      child.material.envMapIntensity = THREE.MathUtils.lerp(
        child.material.envMapIntensity,
        hakiPulseActive ? 2.7 : 1.9,
        0.08,
      );
      child.material.emissiveIntensity = THREE.MathUtils.lerp(
        child.material.emissiveIntensity,
        hakiPulseActive ? 0.22 : 0.03,
        0.1,
      );
    });
  });

  return (
    <group
      ref={meshRef}
      onClick={onClick}
      onPointerOver={() => onHoverChange(true)}
      onPointerOut={() => onHoverChange(false)}
    >
      <primitive object={baseObj} />
      <primitive object={overlayObj} />
    </group>
  );
}
