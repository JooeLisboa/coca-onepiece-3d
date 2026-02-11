import React, {
  useRef,
  Suspense,
  useLayoutEffect,
  useState,
  useEffect,
} from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import {
  Float,
  Sparkles,
  Environment,
  Html,
  useProgress,
  ContactShadows,
  Cloud,
  OrbitControls,
  CameraShake,
} from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import { TextureLoader } from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import * as THREE from "three";

// --- LOADER DE ONDA (Wave Loader) ---
function WaveLoader() {
  const { progress } = useProgress();

  return (
    <Html center zIndexRange={[100, 0]}>
      <div className="fixed inset-0 w-screen h-screen bg-black flex flex-col items-center justify-center z-[999] overflow-hidden">
        <div className="relative z-20 text-center mix-blend-difference">
          <h1 className="text-9xl font-black text-white tracking-tighter opacity-80">
            {progress.toFixed(0)}%
          </h1>
          <p className="text-white text-sm tracking-[0.8em] uppercase mt-4 animate-pulse">
            Carregando Grand Line
          </p>
        </div>

        {/* Onda subindo */}
        <motion.div
          className="absolute bottom-0 left-0 w-full bg-[#8b0000]"
          initial={{ height: "0%" }}
          animate={{ height: `${progress}%` }}
          transition={{ type: "spring", stiffness: 50, damping: 20 }}
        >
          {/* Animação CSS da onda no topo */}
          <div className="absolute -top-[40px] left-0 w-[200%] h-[60px] flex animate-wave">
            <svg
              className="w-full h-full fill-[#8b0000]"
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
            >
              <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" />
            </svg>
          </div>
        </motion.div>
      </div>
    </Html>
  );
}

// --- EFEITO GEAR SECOND (VAPOR) ---
function GearSecondSteam({ active }) {
  const color = active ? "#ff0000" : "#8b0000";
  // Velocidade mais controlada
  const speed = active ? 1.0 : 0.5;
  const opacity = active ? 0.4 : 0.1;

  return (
    <group position={[0, -1, 0]}>
      <Cloud
        opacity={opacity}
        speed={speed}
        width={3}
        depth={0.5}
        segments={10}
        bounds={[2, 2, 2]}
        color={color}
        position={[0, 0, -1]}
      />
      {active && (
        <Cloud
          opacity={0.3}
          speed={speed * 0.7}
          width={2}
          depth={0.2}
          segments={5}
          color="#ffffff"
          position={[0, 1, 0]}
        />
      )}
    </group>
  );
}

// --- LUZES DINÂMICAS ---
function DynamicLights({ active }) {
  const spotlightRef = useRef();

  useFrame(() => {
    if (spotlightRef.current) {
      const targetInt = active ? 25 : 8;
      const targetColor = active
        ? new THREE.Color("#ff0000")
        : new THREE.Color("white");
      spotlightRef.current.intensity = THREE.MathUtils.lerp(
        spotlightRef.current.intensity,
        targetInt,
        0.05,
      );
      spotlightRef.current.color.lerp(targetColor, 0.05);
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
        intensity={active ? 0 : 8}
        color="#00ffff"
      />
      <spotLight
        position={[5, 2, -5]}
        intensity={active ? 0 : 8}
        color="#ffaa00"
      />
      <ambientLight intensity={active ? 0.1 : 0.6} />
    </>
  );
}

// --- LATA 3D (CORRIGIDA: SEM GIRO LOUCO) ---
function RealCan({ active, onClick, ...props }) {
  const meshRef = useRef();
  const obj = useLoader(OBJLoader, "/14025_Soda_Can_v3_l3.obj");
  const texture = useLoader(TextureLoader, "/coca-label.jpg");

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
    if (meshRef.current) {
      if (active) {
        // CORREÇÃO: Removemos a rotação contínua (rotation.y += ...)
        // Agora ela apenas treme de energia (Haki)
        meshRef.current.position.x = (Math.random() - 0.5) * 0.03;
        meshRef.current.position.z = (Math.random() - 0.5) * 0.03;
        // Leve escala pulsante
        const scale = 0.2 + Math.sin(state.clock.elapsedTime * 10) * 0.002;
        meshRef.current.scale.set(scale, scale, scale);
      } else {
        meshRef.current.position.x = 0;
        meshRef.current.position.z = 0;
        meshRef.current.scale.set(0.2, 0.2, 0.2);
      }
    }
  });

  return (
    <Float
      speed={active ? 0 : 2} // Para de flutuar suave se ativo (fica tenso)
      rotationIntensity={active ? 0 : 0.2}
      floatIntensity={active ? 0 : 1}
    >
      <primitive
        object={obj}
        ref={meshRef}
        scale={0.2}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -2, 0]}
        onClick={onClick}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "auto")}
        {...props}
      />
    </Float>
  );
}

// --- MODAL WANTED ---
const WantedModal = ({ onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.8, rotate: -5 }}
      animate={{ scale: 1, rotate: 0 }}
      exit={{ scale: 0.8, rotate: 5 }}
      className="relative bg-[#f3eacb] text-[#3e2723] w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border-8 border-double border-[#5d4037] p-6 md:p-8"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="absolute inset-0 opacity-10 bg-repeat pointer-events-none mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.4'/%3E%3C/svg%3E")`,
        }}
      ></div>

      <div className="text-center space-y-3 relative z-10 flex flex-col items-center">
        <div className="w-full border-b-4 border-[#3e2723] mb-2 pb-2">
          <h2
            className="text-5xl md:text-6xl font-black tracking-widest font-serif uppercase"
            style={{ transform: "scaleY(1.3)" }}
          >
            WANTED
          </h2>
          <p className="font-serif italic text-lg opacity-80 mt-1">
            DEAD OR ALIVE
          </p>
        </div>
        <div className="w-full aspect-[4/3] bg-gray-900 border-4 border-[#3e2723] flex items-center justify-center overflow-hidden relative shadow-inner">
          <div className="absolute inset-0 bg-red-900/30"></div>
          <h3 className="text-white font-black text-4xl uppercase -rotate-12 drop-shadow-lg z-10">
            Você
          </h3>
        </div>
        <div className="w-full mt-4">
          <h3 className="text-3xl md:text-4xl font-black uppercase font-serif tracking-wide">
            PIRATA LENDÁRIO
          </h3>
          <div className="flex items-center justify-between px-4 text-2xl md:text-3xl font-bold font-serif border-t-4 border-b-4 border-[#3e2723] py-3 mt-2">
            <span className="text-xl self-start mt-1">฿</span>
            <span className="tracking-widest">3.000.000.000</span>
            <span className="text-sm self-end mb-1">-</span>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest mt-2 text-left w-full pl-2">
            Marine HQ / Coca-Cola Corp
          </p>
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full bg-[#8b0000] text-[#f3eacb] font-bold py-3 uppercase tracking-[0.2em] hover:bg-red-700 transition-colors shadow-lg border-2 border-[#3e2723]"
        >
          Capturar Recompensa
        </button>
      </div>
    </motion.div>
  </motion.div>
);

// --- APP PRINCIPAL ---
export default function App() {
  const [active, setActive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div
      className="w-screen h-screen relative overflow-hidden bg-cover bg-center bg-no-repeat bg-black"
      style={{ backgroundImage: "url('/bg-onepiece.jpg')" }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-black/60 pointer-events-none z-0"></div>

      <style>{`
        @keyframes wave {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-wave {
          animation: wave 4s linear infinite;
        }
      `}</style>

      {/* UI - MARKETING */}
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
          <p className="text-white/40 text-[10px] mt-4 tracking-widest uppercase animate-pulse">
            {active
              ? "MODO HAKI ATIVADO - CLIQUE NOVAMENTE PARA ACALMAR"
              : "CLIQUE NA LATA PARA LIBERAR O PODER"}
          </p>
        </motion.div>

        {/* BOTÃO CAVEIRA */}
        <div
          className="mb-12 z-50 pointer-events-auto"
          onClick={() => setModalOpen(true)}
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
      <div className="absolute inset-0 z-0">
        <Canvas
          shadows
          camera={{ position: [0, 0, 6], fov: 40 }}
          gl={{ alpha: true }}
        >
          <Suspense fallback={<WaveLoader />}>
            <DynamicLights active={active} />
            <Environment preset="city" />

            <CameraShake
              maxYaw={active ? 0.05 : 0}
              maxPitch={active ? 0.05 : 0}
              maxRoll={active ? 0.05 : 0}
              yawFrequency={active ? 0.5 : 0}
              pitchFrequency={active ? 0.5 : 0}
              rollFrequency={active ? 0.5 : 0}
              intensity={1}
            />

            <GearSecondSteam active={active} />

            {active && (
              <>
                <Sparkles
                  count={150}
                  scale={10}
                  size={15}
                  speed={5}
                  opacity={1}
                  color="black"
                  position={[0, 0, 1]}
                  noise={3}
                />
                <Sparkles
                  count={80}
                  scale={8}
                  size={10}
                  speed={4}
                  opacity={1}
                  color="#ff0000"
                  position={[0, 0, 1]}
                  noise={2}
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

            <RealCan active={active} onClick={() => setActive(!active)} />
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
              enableDamping={true}
              dampingFactor={0.05}
              rotateSpeed={0.4}
              autoRotate={!active}
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
