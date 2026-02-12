import React, {
  useRef,
  Suspense,
  useLayoutEffect,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
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
  CameraShake,
} from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import { TextureLoader, RepeatWrapping } from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import * as THREE from "three";
import AudioController from "./components/AudioController";
import ThousandSunny from "./components/ThousandSunny";
import ARButton from "./components/ARButton";
import XRExperience from "./components/XRExperience";
import {
  listenForFirstInteraction,
  persistMutePreference,
  readMutePreference,
} from "./lib/audioGate";
import "./App.css";

const Motion = motion;

function WaveLoader() {
  const { progress } = useProgress();

  return (
    <Html center zIndexRange={[100, 0]}>
      <div className="loader-screen" role="status" aria-live="polite">
        <div className="loader-content">
          <h2>{progress.toFixed(0)}%</h2>
          <p>Carregando experiência…</p>
        </div>
        <Motion.div
          className="loader-bar"
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{ ease: "easeOut", duration: 0.25 }}
        />
      </div>
    </Html>
  );
}

function GearSecondSteam({ active }) {
  return (
    <group position={[0, -1, 0]}>
      <Cloud
        opacity={active ? 0.35 : 0.08}
        speed={active ? 1 : 0.45}
        width={3}
        depth={0.5}
        segments={10}
        bounds={[2, 2, 2]}
        color={active ? "#ff0000" : "#8b0000"}
        position={[0, 0, -1]}
      />
      {active && (
        <Cloud
          opacity={0.25}
          speed={0.7}
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

function DynamicLights({ active }) {
  const spotlightRef = useRef();

  useFrame(() => {
    if (!spotlightRef.current) return;
    const targetInt = active ? 24 : 8;
    const targetColor = active ? new THREE.Color("#ff0000") : new THREE.Color("white");
    spotlightRef.current.intensity = THREE.MathUtils.lerp(
      spotlightRef.current.intensity,
      targetInt,
      0.05,
    );
    spotlightRef.current.color.lerp(targetColor, 0.05);
  });

  return (
    <>
      <spotLight ref={spotlightRef} position={[5, 10, 7]} angle={0.5} penumbra={1} castShadow />
      <spotLight position={[-5, 2, -5]} intensity={active ? 0 : 8} color="#00ffff" />
      <spotLight position={[5, 2, -5]} intensity={active ? 0 : 8} color="#ffaa00" />
      <ambientLight intensity={active ? 0.1 : 0.6} />
    </>
  );
}

function RealCan({ active, onClick, arSessionActive, arScale, arRotationY, arPosition, arPlaced }) {
  const meshRef = useRef();
  const loadedDropletsTexture = useLoader(TextureLoader, "/textures/droplets_normal.jpg");
  const obj = useLoader(OBJLoader, "/14025_Soda_Can_v3_l3.obj");
  const texture = useLoader(TextureLoader, "/coca-label.jpg");

  const baseObj = useMemo(() => obj.clone(true), [obj]);
  const overlayObj = useMemo(() => obj.clone(true), [obj]);
  const dropletsTexture = useMemo(() => {
    const textureCopy = loadedDropletsTexture.clone();
    textureCopy.wrapS = RepeatWrapping;
    textureCopy.wrapT = RepeatWrapping;
    textureCopy.repeat.set(2, 3);
    textureCopy.flipY = false;
    return textureCopy;
  }, [loadedDropletsTexture]);

  useLayoutEffect(() => {
    baseObj.traverse((child) => {
      if (!child.isMesh) return;
      child.material = new THREE.MeshStandardMaterial({
        map: texture,
        metalness: 0.65,
        roughness: 0.2,
        envMapIntensity: 2,
      });
      child.castShadow = true;
      child.receiveShadow = true;
    });

    overlayObj.traverse((child) => {
      if (!child.isMesh) return;
      child.material = new THREE.MeshPhysicalMaterial({
        normalMap: dropletsTexture,
        normalScale: new THREE.Vector2(0.55, 0.55),
        metalness: 0.2,
        roughness: 0.12,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        transmission: 0.2,
        transparent: true,
        opacity: 0.36,
        envMapIntensity: 1.4,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      });
      child.castShadow = false;
      child.receiveShadow = false;
    });
  }, [baseObj, overlayObj, dropletsTexture, texture]);

  useFrame((state) => {
    dropletsTexture.offset.y -= 0.00035;
    dropletsTexture.offset.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.01;

    if (!meshRef.current) return;

    if (arSessionActive) {
      const targetPosition = arPosition ?? [0, -0.2, -1.1];
      meshRef.current.position.set(targetPosition[0], targetPosition[1], targetPosition[2]);
      meshRef.current.rotation.set(0, arRotationY, 0);
      meshRef.current.scale.setScalar(arScale);
      return;
    }

    const targetY = active ? 0.32 : 0;
    const targetRotX = active ? Math.sin(state.clock.elapsedTime * 6) * 0.03 : 0;
    const targetRotY = active ? state.clock.elapsedTime * 0.8 : state.clock.elapsedTime * 0.45;
    const targetScale = active ? 1.08 : 1;

    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.06);
    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetRotX, 0.1);
    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRotY, 0.035);
    meshRef.current.scale.setScalar(
      THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, active ? 0.08 : 0.05),
    );
  });

  return (
    <Float speed={1.8} rotationIntensity={0.08} floatIntensity={0.3} floatingRange={[-0.15, 0.15]}>
      <group
        ref={meshRef}
        position={[0, 0, 0]}
        onClick={onClick}
        onPointerDown={onClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onClick();
          }
        }}
      >
        <primitive object={baseObj} scale={2.6} />
        <primitive object={overlayObj} scale={2.62} />
        <mesh position={[0, -2.0, 0]} visible={!arSessionActive || arPlaced}>
          <circleGeometry args={[0.9, 42]} />
          <meshBasicMaterial color={active ? "#5c0000" : "#0b0b0b"} transparent opacity={active ? 0.35 : 0.22} />
        </mesh>
      </group>
    </Float>
  );
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.18 } },
};

const WantedModal = ({ onClose }) => (
  <Motion.div
    className="wanted-backdrop"
    variants={modalVariants}
    initial="hidden"
    animate="visible"
    exit="exit"
    onClick={onClose}
  >
    <Motion.div className="wanted-modal" onClick={(event) => event.stopPropagation()}>
      <p className="wanted-tag">Wanted poster</p>
      <h2>WANTED</h2>
      <p className="wanted-sub">DEAD OR ALIVE</p>
      <div className="wanted-photo">Você</div>
      <p className="wanted-name">Pirata Lendário</p>
      <p className="wanted-bounty">฿ 3.000.000.000</p>
      <button onClick={onClose} className="btn btn-secondary">
        Fechar
      </button>
    </Motion.div>
  </Motion.div>
);

function chapterScroll(id) {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function App() {
  const [active, setActive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [hakiTrigger, setHakiTrigger] = useState(0);
  const [paperTrigger, setPaperTrigger] = useState(0);
  const [hasSunnyModel, setHasSunnyModel] = useState(false);
  const [userHasInteracted, setUserHasInteracted] = useState(false);
  const [muted, setMuted] = useState(() => readMutePreference());

  const [arSupported, setArSupported] = useState(false);
  const [arSupportChecked, setArSupportChecked] = useState(false);
  const [arRequested, setArRequested] = useState(false);
  const [arSessionActive, setArSessionActive] = useState(false);
  const [arScale, setArScale] = useState(1);
  const [arRotationY, setArRotationY] = useState(0);
  const [arPlaced, setArPlaced] = useState(false);
  const [arHitPose, setArHitPose] = useState(null);
  const [arAnchorPosition, setArAnchorPosition] = useState(null);

  const [toast, setToast] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);

  const demoMode = useMemo(() => new URLSearchParams(window.location.search).get("demo") === "1", []);

  useEffect(() => {
    const cleanup = listenForFirstInteraction(() => {
      setUserHasInteracted(true);
    });

    fetch("/models/thousand_sunny.glb", { method: "HEAD" })
      .then((response) => setHasSunnyModel(response.ok))
      .catch(() => setHasSunnyModel(false));

    const checkArSupport = async () => {
      if (!navigator.xr) {
        setArSupported(false);
        setArSupportChecked(true);
        return;
      }

      const supported = await navigator.xr.isSessionSupported("immersive-ar").catch(() => false);
      setArSupported(Boolean(supported));
      setArSupportChecked(true);
    };

    checkArSupport();

    const hasSeenTooltip = localStorage.getItem("coca-onepiece-tooltip-seen") === "1";
    if (demoMode || !hasSeenTooltip) {
      setShowTooltip(true);
      const timeout = setTimeout(() => {
        setShowTooltip(false);
        localStorage.setItem("coca-onepiece-tooltip-seen", "1");
      }, 6000);
      return () => {
        clearTimeout(timeout);
        cleanup();
      };
    }

    return cleanup;
  }, [demoMode]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(timeout);
  }, [toast]);

  const toggleMute = () => {
    setMuted((prev) => {
      const next = !prev;
      persistMutePreference(next);
      return next;
    });
  };

  const handleCanClick = () => {
    setUserHasInteracted(true);
    setActive((prev) => !prev);
    setHakiTrigger((prev) => prev + 1);
  };

  const handleOpenModal = () => {
    setModalOpen(true);
    setPaperTrigger((prev) => prev + 1);
  };

  const onSessionStateChange = useCallback((activeState) => {
    setArSessionActive(activeState);
    if (!activeState) {
      setArRequested(false);
      setArPlaced(false);
      setArHitPose(null);
      setArAnchorPosition(null);
    }
  }, []);

  const onHitPose = useCallback(
    (hitPose) => {
      setArHitPose(hitPose);
      if (!arPlaced && hitPose?.position) {
        setArAnchorPosition(hitPose.position);
      }
    },
    [arPlaced],
  );

  const handleArSelect = useCallback(() => {
    if (arPlaced || !arHitPose?.position) return;
    setArAnchorPosition(arHitPose.position);
    setArPlaced(true);
  }, [arHitPose, arPlaced]);

  const handleArClick = async () => {
    setUserHasInteracted(true);
    if (!arSupportChecked) return;

    if (!arSupported) {
      const currentUrl = window.location.href;
      try {
        await navigator.clipboard.writeText(currentUrl);
        setToast("Link copiado. Abra no celular.");
      } catch {
        setToast("Copie este link e abra no celular.");
      }
      return;
    }

    setArPlaced(false);
    setArAnchorPosition(null);
    setArRequested(true);
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText("portfolio@example.com");
      setToast("Email copiado.");
    } catch {
      setToast("Não foi possível copiar o email.");
    }
  };

  const githubUrl = "https://github.com";

  return (
    <div className="app-shell">
      <div className="stage-layer" aria-hidden="true">
        <Canvas shadows camera={{ position: [0, 0, 6], fov: 40 }} gl={{ alpha: true }}>
          <Suspense fallback={<WaveLoader />}>
            <XRExperience
              arRequested={arRequested}
              onSessionStateChange={onSessionStateChange}
              onHitPose={onHitPose}
              onSelect={handleArSelect}
            />
            <DynamicLights active={active} />
            <Environment preset="city" />
            <AudioController
              muted={muted}
              userHasInteracted={userHasInteracted}
              hakiTrigger={hakiTrigger}
              paperTrigger={paperTrigger}
            />
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
            <ThousandSunny hasModel={hasSunnyModel} />
            {active && (
              <>
                <Sparkles count={120} scale={8} size={12} speed={4.2} opacity={1} color="black" position={[0, 0, 1]} noise={3} />
                <Sparkles count={65} scale={7} size={9} speed={3.8} opacity={1} color="#ff0000" position={[0, 0, 1]} noise={2} />
              </>
            )}
            <Sparkles count={34} scale={10} size={3} speed={0.4} opacity={0.5} color="#ffd700" position={[0, -2, 0]} />
            <RealCan
              active={active}
              onClick={handleCanClick}
              arSessionActive={arSessionActive}
              arScale={arScale}
              arRotationY={arRotationY}
              arPosition={arAnchorPosition}
              arPlaced={arPlaced}
            />
            <ContactShadows position={[0, -2.5, 0]} opacity={0.6} scale={10} blur={2.5} far={4} />
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              enableDamping
              dampingFactor={0.05}
              rotateSpeed={0.45}
              autoRotate={!active && !arSessionActive}
              autoRotateSpeed={0.5}
              minPolarAngle={Math.PI / 3.2}
              maxPolarAngle={Math.PI / 1.42}
            />
          </Suspense>
        </Canvas>
      </div>

      <div className="stage-overlays" aria-hidden="true" />

      <main className="story-layer">
        <section id="hero" className="chapter hero" aria-label="Hero">
          <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="hero-content"
          >
            <p className="kicker">Experiência interativa</p>
            <h1>Sabor Lendário</h1>
            <p className="subtitle">
              Experiência 3D interativa inspirada em aventura e colecionáveis.
            </p>
            <p className="microcopy">
              Arraste para girar. Clique na lata para ativar o modo Haki.
            </p>
            <div className="hero-ctas">
              <button className="btn btn-primary" onClick={() => chapterScroll("interacao")}>
                Explorar agora
              </button>
              <button className="btn btn-ghost" onClick={() => chapterScroll("making-of")}>
                Ver making of
              </button>
            </div>
          </Motion.div>

          <div className="hero-controls" aria-label="Controles">
            <button onClick={toggleMute} className="control-chip" aria-label="Alternar som">
              Som: {muted ? "Off" : "On"}
            </button>
            <ARButton
              arSupported={arSupported}
              arSupportChecked={arSupportChecked}
              arSessionActive={arSessionActive}
              onClick={handleArClick}
            />
            <button onClick={handleOpenModal} className="control-chip control-chip-secondary">
              Easter egg
            </button>
          </div>

          <AnimatePresence>
            {showTooltip && (
              <Motion.div
                className="tooltip-guide"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <p>Arraste para girar</p>
                <p>Clique na lata para ativar</p>
              </Motion.div>
            )}
          </AnimatePresence>

          {demoMode && (
            <aside className="demo-mode" aria-label="Roteiro demo">
              <strong>DEMO MODE</strong>
              <ol>
                <li>Apresente a hero e arraste a lata.</li>
                <li>Clique na lata para ativar Haki.</li>
                <li>Mostre AR no celular com link copiado.</li>
              </ol>
            </aside>
          )}
        </section>

        <section id="interacao" className="chapter panel" aria-label="Como interagir">
          <Motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: 0.3 }}>
            <h2>Como interagir</h2>
            <div className="cards-grid">
              <article className="info-card"><h3>Gire a lata (arraste)</h3><p>Use toque ou mouse para explorar a peça em tempo real.</p></article>
              <article className="info-card"><h3>Clique para ativar efeito</h3><p>Ative o modo Haki e veja partículas, vapor e luz cinemática.</p></article>
              <article className="info-card"><h3>Veja em AR no celular</h3><p>Abra em um dispositivo móvel para projetar a cena no ambiente.</p></article>
            </div>
          </Motion.div>
        </section>

        <section id="making-of" className="chapter panel" aria-label="Como foi feito">
          <Motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: 0.3 }}>
            <h2>Como foi feito</h2>
            <p className="stack">React + Three.js (R3F/drei) · WebXR · WebAudio gate</p>
            <ul className="bullet-list">
              <li>Performance: lazy load, assets controlados e fallback elegante.</li>
              <li>Stage sticky com narrativa curta para leitura focada.</li>
              <li>UI premium com overlays, contraste e estados acessíveis.</li>
            </ul>
          </Motion.div>
        </section>

        <section id="contato" className="chapter panel" aria-label="Contato">
          <Motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: 0.3 }}>
            <h2>Contato</h2>
            <div className="contact-actions">
              <a className="btn btn-ghost" href={githubUrl} target="_blank" rel="noreferrer">GitHub</a>
              <a className="btn btn-ghost" href="#">LinkedIn</a>
              <a className="btn btn-ghost" href="mailto:portfolio@example.com">Email</a>
              <button className="btn btn-secondary" onClick={handleCopyEmail}>Copiar email</button>
            </div>
          </Motion.div>
        </section>

        <footer className="chapter footer">
          <p>Projeto conceitual para portfólio. Não afiliado. Marcas pertencem aos seus donos.</p>
        </footer>
      </main>

      {arSessionActive && arPlaced && (
        <div className="ar-adjustments">
          <p>Ajustes AR</p>
          <label>
            Escala
            <input
              type="range"
              min="0.6"
              max="1.7"
              step="0.05"
              value={arScale}
              onChange={(e) => setArScale(Number(e.target.value))}
            />
          </label>
          <label>
            Rotação
            <input
              type="range"
              min={-Math.PI}
              max={Math.PI}
              step="0.05"
              value={arRotationY}
              onChange={(e) => setArRotationY(Number(e.target.value))}
            />
          </label>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}

      <AnimatePresence>
        {modalOpen && <WantedModal onClose={() => setModalOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
