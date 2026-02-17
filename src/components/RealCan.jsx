import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { TextureLoader, RepeatWrapping } from "three";
import * as THREE from "three";

const CAN_POSITION = [1.6, -0.25, -0.6];
const CAN_SCALE = 0.4;
const YAW_SPEED = 0.08;

export default function RealCan({ hakiPulse, hovered, onHoverChange, onClick }) {
  const rootRef = useRef();
  const pivotRef = useRef();
  const baseObjRaw = useLoader(OBJLoader, "/14025_Soda_Can_v3_l3.obj");
  const label = useLoader(TextureLoader, "/coca-label.jpg");
  const dropsRaw = useLoader(TextureLoader, "/textures/droplets_normal.jpg");

  const baseObj = useMemo(() => baseObjRaw.clone(true), [baseObjRaw]);
  const overlayObj = useMemo(() => baseObjRaw.clone(true), [baseObjRaw]);
  const drops = useMemo(() => {
    const tex = dropsRaw.clone();
    tex.wrapS = RepeatWrapping;
    tex.wrapT = RepeatWrapping;
    tex.repeat.set(2, 3);
    tex.flipY = false;
    return tex;
  }, [dropsRaw]);

  useLayoutEffect(() => {
    baseObj.traverse((child) => {
      if (!child.isMesh) return;
      child.material = new THREE.MeshStandardMaterial({
        map: label,
        metalness: 0.7,
        roughness: 0.18,
        envMapIntensity: 2.4,
        emissive: new THREE.Color("#180509"),
        emissiveIntensity: 0.06,
      });
      child.castShadow = true;
      child.receiveShadow = true;
    });

    overlayObj.traverse((child) => {
      if (!child.isMesh) return;
      child.material = new THREE.MeshPhysicalMaterial({
        normalMap: drops,
        normalScale: new THREE.Vector2(0.52, 0.52),
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        roughness: 0.12,
        transmission: 0.2,
        transparent: true,
        opacity: 0.32,
        envMapIntensity: 2,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      });
    });
  }, [baseObj, drops, label, overlayObj]);

  const dropsRef = useRef();

  useLayoutEffect(() => {
    dropsRef.current = drops;
  }, [drops]);

  useFrame((state, delta) => {
    if (rootRef.current) {
      rootRef.current.position.set(CAN_POSITION[0], CAN_POSITION[1], CAN_POSITION[2]);
      rootRef.current.rotation.y += YAW_SPEED * delta;
    }

    if (pivotRef.current) {
      // Pivot interno: corrige orientação do OBJ mantendo rotação global limpa no root
      pivotRef.current.rotation.set(-Math.PI / 2, 0, 0);
      pivotRef.current.scale.setScalar(CAN_SCALE);
    }

    if (dropsRef.current) {
      dropsRef.current.offset.y -= 0.00035;
      dropsRef.current.offset.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.012;
    }

    baseObj.traverse((child) => {
      if (!child.isMesh) return;
      child.material.emissiveIntensity = THREE.MathUtils.lerp(
        child.material.emissiveIntensity,
        hakiPulse ? 0.26 : hovered ? 0.14 : 0.06,
        0.12,
      );
      child.material.envMapIntensity = THREE.MathUtils.lerp(
        child.material.envMapIntensity,
        hakiPulse ? 3.2 : hovered ? 2.9 : 2.4,
        0.09,
      );
    });
  });

  return (
    <group
      ref={rootRef}
      onClick={onClick}
      onPointerOver={() => onHoverChange(true)}
      onPointerOut={() => onHoverChange(false)}
    >
      <group ref={pivotRef}>
        <primitive object={baseObj} />
        <primitive object={overlayObj} />
      </group>
    </group>
  );
}
