import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { CameraShake, Cloud, ContactShadows, Environment, Html, OrbitControls, Sparkles, useProgress } from "@react-three/drei";
import { motion } from "framer-motion";

const Motion = motion;
import * as THREE from "three";
import ThousandSunny from "./components/ThousandSunny";
import RealCan from "./components/RealCan";
import IntroOverlay from "./components/IntroOverlay";
import FooterDock from "./components/FooterDock";
import "./App.css";

function SceneLoader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="loader">Carregando assets {progress.toFixed(0)}%</div>
    </Html>
  );
}

function HakiRing({ active }) {
  const ref = useRef();

  useFrame((_, delta) => {
    if (!ref.current) return;
    const targetScale = active ? 2.2 : 0.1;
    const targetOpacity = active ? 0.7 : 0;
    ref.current.scale.x = THREE.MathUtils.lerp(ref.current.scale.x, targetScale, active ? 0.15 : 0.25);
    ref.current.scale.y = THREE.MathUtils.lerp(ref.current.scale.y, targetScale, active ? 0.15 : 0.25);
    ref.current.material.opacity = THREE.MathUtils.lerp(ref.current.material.opacity, targetOpacity, 0.2);
    ref.current.rotation.z += delta * 0.6;
  });

  return (
    <mesh ref={ref} position={[1.6, -0.25, -0.6]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.65, 0.95, 64]} />
      <meshStandardMaterial color="#ff4d52" emissive="#d9202f" emissiveIntensity={1.2} transparent opacity={0} />
    </mesh>
  );
}

function Stage({ introDone, introProgress, hakiPulse, canHovered, onCanHover, onCanClick, onIntroDone, onDragStart }) {
  return (
    <>
      <ambientLight intensity={hakiPulse ? 0.55 : 0.34} />
      <directionalLight position={[3, 4, 3]} intensity={hakiPulse ? 2.8 : 1.4} color={hakiPulse ? "#ffd0a3" : "#ffffff"} />
      <directionalLight position={[-5, 3, -3]} intensity={hakiPulse ? 1.4 : 0.5} color="#6ba5ff" />

      <ThousandSunny mode={introDone ? "loop" : "intro"} progress={introProgress} onIntroDone={onIntroDone} />
      <RealCan hakiPulse={hakiPulse} hovered={canHovered} onHoverChange={onCanHover} onClick={onCanClick} />

      <Sparkles count={hakiPulse ? 210 : 70} scale={[10, 5, 10]} size={hakiPulse ? 3 : 1.1} speed={hakiPulse ? 1.35 : 0.45} color={hakiPulse ? "#ffca6d" : "#ffd9ac"} />
      <Cloud position={[1.6, -0.6, -1.2]} opacity={hakiPulse ? 0.32 : 0.09} speed={hakiPulse ? 0.95 : 0.35} width={2.8} depth={0.8} color={hakiPulse ? "#ff6b5e" : "#a9b6ca"} />
      <HakiRing active={hakiPulse} />
      <ContactShadows position={[1.6, -1.62, -0.6]} opacity={0.4} scale={7} blur={2.8} />
      <Environment preset="sunset" />
      <CameraShake yawFrequency={hakiPulse ? 1.1 : 0} pitchFrequency={hakiPulse ? 1.1 : 0} rollFrequency={hakiPulse ? 0.5 : 0} yawAmplitude={hakiPulse ? 0.02 : 0} pitchAmplitude={hakiPulse ? 0.015 : 0} rollAmplitude={hakiPulse ? 0.01 : 0} />

      {introDone && (
        <OrbitControls
          enableZoom={false}
          minPolarAngle={Math.PI / 2.45}
          maxPolarAngle={Math.PI / 1.75}
          minAzimuthAngle={-0.9}
          maxAzimuthAngle={0.9}
          onStart={onDragStart}
        />
      )}
    </>
  );
}

export default function App() {
  const introSeen = useMemo(() => localStorage.getItem("intro_seen") === "1", []);
  const [introStarted, setIntroStarted] = useState(introSeen);
  const [introDone, setIntroDone] = useState(introSeen);
  const [introProgress, setIntroProgress] = useState(0);
  const [forceReplay, setForceReplay] = useState(false);

  const [hakiPulse, setHakiPulse] = useState(false);
  const [canHovered, setCanHovered] = useState(false);
  const [dragHint, setDragHint] = useState(false);
  const [muted, setMuted] = useState(true);
  const [userHasInteracted, setUserHasInteracted] = useState(false);
  const [toast, setToast] = useState("");
  const [showEaster, setShowEaster] = useState(false);

  const hakiSfxRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = introDone ? "auto" : "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [introDone]);

  useEffect(() => {
    hakiSfxRef.current = new Audio("/audio/haki_impact.mp3");
    hakiSfxRef.current.volume = 0.45;
    return () => hakiSfxRef.current?.pause();
  }, []);

  useEffect(() => {
    if (introDone || !introStarted) return;
    const duration = introSeen && !forceReplay ? 800 : 8500;
    const startAt = performance.now();
    let raf = 0;

    const step = (now) => {
      const p = Math.min((now - startAt) / duration, 1);
      setIntroProgress(p);
      if (p < 1) {
        raf = requestAnimationFrame(step);
        return;
      }
      localStorage.setItem("intro_seen", "1");
      setIntroDone(true);
      setForceReplay(false);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [forceReplay, introDone, introSeen, introStarted]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 1800);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!canHovered) return;
    document.body.style.cursor = "pointer";
    return () => {
      document.body.style.cursor = "default";
    };
  }, [canHovered]);

  const triggerHaki = useCallback(() => {
    setUserHasInteracted(true);
    setHakiPulse(true);
    setToast("Haki ativado");

    if (!muted && hakiSfxRef.current) {
      hakiSfxRef.current.currentTime = 0;
      hakiSfxRef.current.play().catch(() => {});
    }

    setTimeout(() => setHakiPulse(false), 2500);
  }, [muted]);

  const replayIntro = useCallback(() => {
    setIntroProgress(0);
    setIntroDone(false);
    setIntroStarted(true);
    setForceReplay(true);
  }, []);

  return (
    <div className="app-shell">
      <div className="canvas-layer">
        <Canvas camera={{ position: [0, 0.5, 5.2], fov: 42 }} shadows>
          <SceneLoader />
          <Stage
            introDone={introDone}
            introProgress={introProgress}
            hakiPulse={hakiPulse}
            canHovered={canHovered}
            onCanHover={setCanHovered}
            onCanClick={triggerHaki}
            onIntroDone={() => {}}
            onDragStart={() => {
              if (dragHint) return;
              setDragHint(true);
              setTimeout(() => setDragHint(false), 2000);
            }}
          />
        </Canvas>
      </div>

      <div className="hud pointer-none">
        <div className="hud-left pointer-auto">Coca-Cola x One Piece (Concept)</div>
        <div className="hud-right pointer-auto">
          <button type="button" className="chip" onClick={() => { setUserHasInteracted(true); setMuted((v) => !v); }}>
            {muted ? "Som Off" : "Som On"}
          </button>
          <button type="button" className="chip" onClick={() => setToast("Abra no celular para AR")}>AR</button>
          <button type="button" className="chip" onClick={() => setShowEaster((v) => !v)}>Easter</button>
        </div>

        <div className="hero-center">
          <h1>Grand Line Coke</h1>
          <p>Uma peça conceitual de portfólio vivo em React + R3F + WebXR.</p>
          <Motion.button
            whileHover={{ y: -2 }}
            type="button"
            className="btn btn-primary pointer-auto"
            onClick={() => document.getElementById("making-of")?.scrollIntoView({ behavior: "smooth" })}
          >
            Explorar
          </Motion.button>
          {canHovered && <span className="micro-tip">Clique para Haki</span>}
          {dragHint && <span className="micro-tip">Girar</span>}
        </div>
      </div>

      {showEaster && <div className="easter-toast pointer-auto">🏴‍☠️ Easter desbloqueado: Grand Line Stamp</div>}

      <FooterDock onReplayIntro={replayIntro} />

      {!introDone && (
        <IntroOverlay
          started={introStarted}
          progress={introProgress}
          shortIntro={introSeen && !forceReplay}
          onStart={() => {
            setUserHasInteracted(true);
            setIntroStarted(true);
          }}
          onSkip={() => {
            localStorage.setItem("intro_seen", "1");
            setIntroDone(true);
            setIntroStarted(true);
          }}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
      {!userHasInteracted && <button type="button" className="interaction-cue pointer-auto" onClick={() => setUserHasInteracted(true)}>Ativar interação</button>}
    </div>
  );
}
