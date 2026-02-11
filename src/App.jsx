import React, { useRef, Suspense, useLayoutEffect, useState } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import {
  Float,
  Sparkles,
  Environment,
  Html,
  useProgress,
  ContactShadows,
  Cloud,
  OrbitControls,
  CameraShake, // <--- CORRIGIDO: O nome correto é CameraShake
} from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import { TextureLoader } from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import * as THREE from "three";

// --- LOADER ---
function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center">
        <span className="text-red-600 font-black tracking-widest text-4xl animate-pulse">
          {progress.toFixed(0)}%
        </span>
        <span className="text-white text-xs tracking-[0.5em] mt-2 uppercase">
          Carregando Tesouro
        </span>
      </div>
    </Html>
  );
}

// --- EFEITO GEAR SECOND (VAPOR/FUMAÇA) ---
function GearSecondSteam({ active }) {
  const color = active ? "#ff0000" : "#8b0000";
  const speed = active ? 1.5 : 0.8;

  return (
    <group position={[0, -1, 0]}>
      <Cloud
        opacity={0.3}
        speed={speed}
        width={3}
        depth={0.5}
        segments={10}
        bounds={[2, 2, 2]}
        color={color}
        position={[0, 0, -1]}
      />
      <Cloud
        opacity={0.2}
        speed={speed * 0.7}
        width={2}
        depth={0.2}
        segments={5}
        color="#ffffff"
        position={[0, 1, 0]}
      />
    </group>
  );
}

// --- LUZES DINÂMICAS (Reagem ao Haki) ---
function DynamicLights({ hover }) {
  const spotlightRef = useRef();

  useFrame(() => {
    if (spotlightRef.current) {
      const targetInt = hover ? 20 : 6;
      const targetColor = hover
        ? new THREE.Color("#ff0000")
        : new THREE.Color("white");

      spotlightRef.current.intensity = THREE.MathUtils.lerp(
        spotlightRef.current.intensity,
        targetInt,
        0.1,
      );
      spotlightRef.current.color.lerp(targetColor, 0.1);
    }
  });

  return (
    <>
      <spotLight
        ref={spotlightRef}
        position={[5, 10, 7]}
        angle={0.5}
        penumbra={1}
        castShadow
      />
      <spotLight
        position={[-5, 2, -5]}
        intensity={hover ? 0 : 8}
        color="#00ffff"
      />
      <spotLight
        position={[5, 2, -5]}
        intensity={hover ? 0 : 8}
        color="#ffaa00"
      />
      <ambientLight intensity={hover ? 0.2 : 0.6} />
    </>
  );
}

// --- LATA 3D (Mapeamento Direto) ---
function RealCan({ hovered, ...props }) {
  const meshRef = useRef();
  const obj = useLoader(OBJLoader, "/14025_Soda_Can_v3_l3.obj"); //
  const texture = useLoader(TextureLoader, "/coca-label.jpg"); //

  // Se o rótulo estiver invertido, descomente:
  // texture.flipY = true;

  useLayoutEffect(() => {
    obj.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          map: texture,
          metalness: 0.6,
          roughness: 0.2,
          envMapIntensity: 2,
        });
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [obj, texture]);

  useFrame((state, delta) => {
    const speed = hovered ? 3 : 0.5;
    if (meshRef.current) {
      meshRef.current.rotation.z -= delta * speed;
      // Tremor físico da lata
      if (hovered) {
        meshRef.current.position.x = (Math.random() - 0.5) * 0.05;
      } else {
        meshRef.current.position.x = 0;
      }
    }
  });

  return (
    <Float
      speed={hovered ? 10 : 2}
      rotationIntensity={hovered ? 0.5 : 0.2}
      floatIntensity={1}
      floatingRange={[-0.1, 0.1]}
    >
      <primitive
        object={obj}
        ref={meshRef}
        scale={0.2}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -2, 0]}
        {...props}
      />
    </Float>
  );
}

// --- MODAL WANTED ---
const WantedModal = ({ onClose }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
  >
    <div className="relative bg-[#f3eacb] text-[#3e2723] p-8 max-w-md w-full shadow-2xl rotate-1 border-8 border-double border-[#5d4037]">
      <div className="text-center space-y-4 relative z-10">
        <h2 className="text-5xl font-black tracking-widest font-serif uppercase scale-y-150">
          WANTED
        </h2>
        <p className="font-serif italic text-lg opacity-80">DEAD OR ALIVE</p>

        <div className="w-full aspect-square bg-gray-900 border-4 border-[#3e2723] flex items-center justify-center overflow-hidden relative">
          <div className="absolute inset-0 bg-red-900 opacity-20"></div>
          <h3 className="text-white font-black text-4xl uppercase -rotate-12 drop-shadow-lg z-10">
            Você
          </h3>
        </div>

        <h3 className="text-3xl font-black uppercase font-serif">
          PIRATA LENDÁRIO
        </h3>
        <div className="flex items-center justify-center gap-2 text-2xl font-bold font-serif border-t-2 border-b-2 border-[#3e2723] py-2">
          <span className="text-sm self-start mt-1">฿</span>
          <span>3.000.000.000</span>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full bg-red-700 text-white font-bold py-3 uppercase tracking-widest hover:bg-red-800 transition-colors shadow-lg"
        >
          Fechar Recompensa
        </button>
      </div>
    </div>
  </motion.div>
);

// --- APP ---
export default function App() {
  const [hovered, setHovered] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div
      className="w-screen h-screen relative overflow-hidden bg-cover bg-center bg-no-repeat bg-black"
      style={{ backgroundImage: "url('/bg-onepiece.jpg')" }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-black/60 pointer-events-none z-0"></div>

      {/* UI */}
      <div
        className={`absolute inset-0 z-10 flex flex-col justify-between items-center py-10 px-4 pointer-events-none select-none transition-opacity duration-500 ${modalOpen ? "opacity-0" : "opacity-100"}`}
      >
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-center mt-6"
        >
          <p className="text-red-500 font-sans tracking-[0.3em] text-xs md:text-sm uppercase font-bold drop-shadow-md mb-2">
            Abra a Felicidade na Grand Line
          </p>
          <h1 className="text-white font-sans text-5xl md:text-7xl font-black uppercase italic leading-tight drop-shadow-2xl">
            SABOR <span className="text-red-600">LENDÁRIO</span>
          </h1>
        </motion.div>

        {/* BOTÃO CAVEIRA */}
        <div
          className="mb-12 z-50 pointer-events-auto"
          onClick={() => setModalOpen(true)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group relative flex flex-col items-center justify-center gap-2 cursor-pointer"
          >
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 bg-red-600 blur-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-500 rounded-full"></div>
              <svg
                viewBox="0 0 512 512"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full drop-shadow-[0_5px_10px_rgba(0,0,0,0.8)] fill-white group-hover:fill-red-100 transition-colors duration-300"
              >
                <path d="M441.5 107.1c-14.4-14.4-37.7-14.4-52.1 0l-37.5 37.5c-28.9-19-63.5-30.1-100.9-30.1-37.4 0-72 11.1-100.9 30.1L112.6 107c-14.4-14.4-37.7-14.4-52.1 0-14.4 14.4-14.4 37.7 0 52.1l37.5 37.5C79.1 225.5 68 260.1 68 297.5c0 37.4 11.1 72 30.1 100.9l-37.5 37.5c-14.4 14.4-14.4 37.7 0 52.1s37.7 14.4 52.1 0l37.5-37.5c28.9 19 63.5 30.1 100.9 30.1s72-11.1 100.9-30.1l37.5 37.5c14.4 14.4 37.7 14.4 52.1 0s14.4-37.7 0-52.1l-37.5-37.5c19-28.9 30.1-63.5 30.1-100.9 0-37.4-11.1-72-30.1-100.9l37.5-37.5c14.4-14.5 14.4-37.7 0-52.1zM251 405.6c-59.7 0-108-48.3-108-108s48.3-108 108-108 108 48.3 108 108-48.3 108-108 108z" />
                <circle
                  cx="210"
                  cy="280"
                  r="15"
                  className="fill-transparent group-hover:fill-red-600 animate-pulse"
                />
                <circle
                  cx="292"
                  cy="280"
                  r="15"
                  className="fill-transparent group-hover:fill-red-600 animate-pulse"
                />
              </svg>
            </div>
            <div className="bg-gradient-to-r from-red-900 via-red-700 to-red-900 border-2 border-[#d4af37] px-6 py-1.5 transform skew-x-[-10deg] shadow-[0_10px_20px_rgba(0,0,0,0.5)] group-hover:shadow-[0_0_25px_rgba(255,0,0,0.6)] transition-all">
              <span className="block transform skew-x-[10deg] text-white font-sans font-black uppercase tracking-widest text-base md:text-lg drop-shadow-md whitespace-nowrap">
                Reivindicar Tesouro
              </span>
            </div>
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {modalOpen && <WantedModal onClose={() => setModalOpen(false)} />}
      </AnimatePresence>

      {/* CENA 3D */}
      <div
        className="absolute inset-0 z-0"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Canvas
          shadows
          camera={{ position: [0, 0, 6], fov: 40 }}
          gl={{ alpha: true }}
        >
          <Suspense fallback={<Loader />}>
            <DynamicLights hover={hovered} />
            <Environment preset="city" />

            {/* CameraShake: O efeito de tremor visual */}
            <CameraShake
              maxYaw={hovered ? 0.05 : 0}
              maxPitch={hovered ? 0.05 : 0}
              maxRoll={hovered ? 0.05 : 0}
              yawFrequency={hovered ? 0.5 : 0}
              pitchFrequency={hovered ? 0.5 : 0}
              rollFrequency={hovered ? 0.5 : 0}
              intensity={1}
            />

            <GearSecondSteam active={hovered} />

            {hovered && (
              <>
                <Sparkles
                  count={100}
                  scale={8}
                  size={15}
                  speed={5}
                  opacity={1}
                  color="black"
                  position={[0, 0, 1]}
                  noise={2}
                />
                <Sparkles
                  count={50}
                  scale={6}
                  size={10}
                  speed={4}
                  opacity={1}
                  color="#ff0000"
                  position={[0, 0, 1]}
                  noise={1}
                />
              </>
            )}

            <Sparkles
              count={40}
              scale={10}
              size={3}
              speed={0.4}
              opacity={0.5}
              color="#ffd700"
              position={[0, -2, 0]}
            />

            <RealCan hovered={hovered} />
            <ContactShadows
              position={[0, -2.5, 0]}
              opacity={0.6}
              scale={10}
              blur={2.5}
              far={4}
            />
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              autoRotate={!hovered}
              autoRotateSpeed={0.5}
              minPolarAngle={Math.PI / 3}
              maxPolarAngle={Math.PI / 1.5}
            />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}
