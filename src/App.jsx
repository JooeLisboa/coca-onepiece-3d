import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls, Sparkles, ContactShadows, Html, useProgress } from "@react-three/drei";
import { motion } from "framer-motion";
import * as THREE from "three";
import ThousandSunny from "./components/ThousandSunny";
import RealCan from "./components/RealCan";
import IntroOverlay from "./components/IntroOverlay";
import OnboardingOverlay from "./components/OnboardingOverlay";
import "./App.css";

const Motion = motion;
const CONTACT_EMAIL = "crew@grandline-coke.studio";

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="loader">Carregando {progress.toFixed(0)}%</div>
    </Html>
  );
}

function Scene({
  introActive,
  introProgress,
  hakiPulseActive,
  onHaki,
  onHover,
  onDragged,
  firstDragDone,
}) {
  return (
    <>
      <color attach="background" args={["#04070d"]} />
      <ambientLight intensity={hakiPulseActive ? 0.55 : 0.35} />
      <directionalLight position={[3, 5, 4]} intensity={hakiPulseActive ? 2.2 : 1.2} color={hakiPulseActive ? "#ffd39f" : "#ffffff"} />
      <directionalLight position={[-6, 3, -6]} intensity={hakiPulseActive ? 1.1 : 0.4} color="#5b8dc7" />

      <ThousandSunny mode={introActive ? "intro" : "loop"} progress={introProgress} onIntroDone={() => {}} />

      <group position={[0, 0, 0]}>
        <RealCan hakiPulseActive={hakiPulseActive} onClick={onHaki} onHoverChange={onHover} />
      </group>

      <Sparkles count={hakiPulseActive ? 180 : 70} scale={[8, 4, 8]} size={hakiPulseActive ? 2.8 : 1.2} speed={hakiPulseActive ? 1.2 : 0.45} color={hakiPulseActive ? "#ffedca" : "#ffe5c3"} />
      <ContactShadows position={[0, -1.55, 0]} opacity={0.4} blur={2.8} scale={12} />
      <Environment preset="sunset" />

      <OrbitControls
        enableZoom={false}
        minPolarAngle={Math.PI / 2.4}
        maxPolarAngle={Math.PI / 1.8}
        minAzimuthAngle={-0.8}
        maxAzimuthAngle={0.8}
        onStart={() => onDragged()}
      />

      {firstDragDone && (
        <Html position={[0, -0.1, 1.2]} center>
          <div className="drag-hint">Girar</div>
        </Html>
      )}
    </>
  );
}

const CHAPTERS = ["Hero", "Narrativa", "Colecionável", "Making Of"];

export default function App() {
  const demoMode = useMemo(() => new URLSearchParams(window.location.search).get("demo") === "1", []);
  const [introSeen] = useState(() => localStorage.getItem("intro_seen") === "1");
  const [introStarted, setIntroStarted] = useState(demoMode || introSeen);
  const [introActive, setIntroActive] = useState(!(demoMode && introSeen));
  const [introProgress, setIntroProgress] = useState(0);
  const [forceLongIntro, setForceLongIntro] = useState(false);

  const [hakiPulseActive, setHakiPulseActive] = useState(false);
  const hakiCountRef = useRef(Number(localStorage.getItem("haki_count") ?? 0));
  const [toast, setToast] = useState("");
  const [canHovered, setCanHovered] = useState(false);
  const [firstDragDone, setFirstDragDone] = useState(false);
  const [showTurnHint, setShowTurnHint] = useState(false);

  const [onboardingSeen, setOnboardingSeen] = useState(() => localStorage.getItem("onboarding_seen") === "1");
  const [onboardingVisible, setOnboardingVisible] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  const [collectible, setCollectible] = useState(() => {
    const saved = localStorage.getItem("collectible_item");
    return saved ? JSON.parse(saved) : null;
  });
  const [collectibleOpen, setCollectibleOpen] = useState(false);
  const [uiSafeArea, setUiSafeArea] = useState(true);

  const [activeChapter, setActiveChapter] = useState(1);
  const [muted, setMuted] = useState(true);
  const [interacted, setInteracted] = useState(false);
  const chapterSfxRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = introActive ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [introActive]);

  useEffect(() => {
    const onFirst = () => setInteracted(true);
    window.addEventListener("pointerdown", onFirst, { once: true });
    return () => window.removeEventListener("pointerdown", onFirst);
  }, []);

  useEffect(() => {
    chapterSfxRef.current = new Audio("/audio/paper_unroll.mp3");
    chapterSfxRef.current.volume = 0.2;
    return () => chapterSfxRef.current?.pause();
  }, []);

  useEffect(() => {
    if (demoMode) return;
    if (onboardingSeen || introActive) return;

    const kickoff = setTimeout(() => {
      setOnboardingVisible(true);
      setOnboardingStep(0);
    }, 0);

    const timers = [
      kickoff,
      setTimeout(() => setOnboardingStep(1), 2500),
      setTimeout(() => setOnboardingStep(2), 5200),
      setTimeout(() => {
        setOnboardingVisible(false);
        localStorage.setItem("onboarding_seen", "1");
        setOnboardingSeen(true);
      }, 8000),
    ];

    return () => timers.forEach((t) => clearTimeout(t));
  }, [demoMode, introActive, onboardingSeen]);

  useEffect(() => {
    if (collectible) return;
    const timer = setTimeout(() => {
      const id = Math.random().toString(36).slice(2, 8).toUpperCase();
      const item = { id, unlockedAt: new Date().toISOString(), name: "Stamp Grand Line" };
      setCollectible(item);
      localStorage.setItem("collectible_item", JSON.stringify(item));
      setToast("Você desbloqueou um item");
    }, 20000);
    return () => clearTimeout(timer);
  }, [collectible]);

  useEffect(() => {
    const sections = document.querySelectorAll("[data-chapter]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const idx = Number(entry.target.getAttribute("data-chapter") || "1");
          setActiveChapter(idx);
          if (interacted && !muted) {
            chapterSfxRef.current.currentTime = 0;
            chapterSfxRef.current.play().catch(() => {});
          }
        });
      },
      { threshold: 0.6 },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [interacted, muted]);

  useEffect(() => {
    if (!introActive || !introStarted) return;
    const durationMs = introSeen && !forceLongIntro ? 1500 : 10000;
    const start = performance.now();
    let raf = 0;
    const tick = (now) => {
      const p = Math.min((now - start) / durationMs, 1);
      setIntroProgress(p);
      if (p < 1) {
        raf = requestAnimationFrame(tick);
        return;
      }
      localStorage.setItem("intro_seen", "1");
      setIntroActive(false);
      setForceLongIntro(false);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [forceLongIntro, introActive, introSeen, introStarted]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!canHovered) return;
    document.body.style.cursor = "grab";
    return () => {
      document.body.style.cursor = "default";
    };
  }, [canHovered]);

  const triggerHaki = useCallback(() => {
    setInteracted(true);
    setHakiPulseActive(true);
    hakiCountRef.current += 1;
    localStorage.setItem("haki_count", String(hakiCountRef.current));
    if (hakiCountRef.current >= 3 && !collectible) {
      const item = {
        id: Math.random().toString(36).slice(2, 8).toUpperCase(),
        unlockedAt: new Date().toISOString(),
        name: "Wanted Ticket: Straw Hat Edition",
      };
      setCollectible(item);
      localStorage.setItem("collectible_item", JSON.stringify(item));
      setToast("Você desbloqueou um item");
    }
    setToast("Haki ativado");
    setTimeout(() => setHakiPulseActive(false), 2500);
  }, [collectible]);

  const dismissOnboardingForever = useCallback(() => {
    setOnboardingVisible(false);
    setOnboardingSeen(true);
    localStorage.setItem("onboarding_seen", "1");
  }, []);

  const copyCollectibleText = useCallback(() => {
    if (!collectible) return;
    const txt = `${collectible.name} | ID ${collectible.id} | ${new Date(collectible.unlockedAt).toLocaleString("pt-BR")}`;
    navigator.clipboard.writeText(txt).then(() => setToast("Texto copiado"));
  }, [collectible]);

  const copyDemoLink = useCallback(() => {
    const url = `${window.location.origin}${window.location.pathname}?demo=1`;
    navigator.clipboard.writeText(url).then(() => setToast("Link demo copiado"));
  }, []);

  const replayIntro = useCallback(() => {
    setIntroStarted(true);
    setIntroActive(true);
    setIntroProgress(0);
    setForceLongIntro(true);
  }, []);

  return (
    <div className={`app-shell ${uiSafeArea ? "safe-area" : ""}`}>
      <div className="bg-layer" />

      <div className="canvas-layer">
        <Canvas camera={{ position: [0, 0.5, 6], fov: 42 }} shadows>
          <Loader />
          <Scene
            introActive={introActive}
            introProgress={introProgress}
            hakiPulseActive={hakiPulseActive}
            onHaki={triggerHaki}
            onHover={setCanHovered}
            onDragged={() => {
              if (!firstDragDone) {
                setFirstDragDone(true);
                setShowTurnHint(true);
                setTimeout(() => setShowTurnHint(false), 2000);
              }
            }}
            firstDragDone={showTurnHint}
          />
        </Canvas>
      </div>

      <div className="ui-overlay pointer-none">
        <header className="top-ui pointer-auto">
          <span className="badge">Coca-Cola x One Piece</span>
          {demoMode && <span className="badge demo">DEMO MODE</span>}
          <button type="button" className="btn btn-ghost" onClick={() => setMuted((v) => !v)}>
            {muted ? "Som off" : "Som on"}
          </button>
        </header>

        <main className="story">
          <section className="chapter hero" data-chapter="1">
            <Motion.h1 initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}>
              Portfólio vivo: Grand Line Edition
            </Motion.h1>
            <p>Direção visual 3D, WebXR e microinterações para uma experiência compartilhável.</p>
            <div className="row pointer-auto">
              <Motion.button whileHover={{ y: -2, scale: 1.02 }} className="btn btn-primary">
                Explorar capítulos
              </Motion.button>
              <Motion.a whileHover={{ y: -2 }} className="btn btn-ghost" href={`mailto:${CONTACT_EMAIL}`}>
                Contato
              </Motion.a>
            </div>
            {canHovered && <div className="mini-tooltip">Clique para Haki</div>}
          </section>

          <section className="chapter panel" data-chapter="2">
            <h2>Narrativa interativa</h2>
            <ul>
              <li>Intro em 3 fases com progressão cinematográfica (8–12s).</li>
              <li>Lata fixa com giro lento, textura molhada e pulse temporal de Haki.</li>
              <li>Thousand Sunny em loop horizontal contínuo atrás da lata.</li>
            </ul>
          </section>

          <section className="chapter panel" data-chapter="3">
            <h2>Colecionável</h2>
            <p>Ative Haki 3x ou permaneça 20s para desbloquear o item premium.</p>
            <div className="row pointer-auto">
              <button type="button" className="btn btn-secondary" disabled={!collectible} onClick={() => setCollectibleOpen(true)}>
                Ver colecionável
              </button>
            </div>
          </section>

          <section className="chapter panel" data-chapter="4">
            <h2>Making Of</h2>
            <p>Stack: React 19, R3F/drei, Framer Motion, WebXR-ready.</p>
            <ul>
              <li>Camadas separadas para background, canvas, overlays e UI.</li>
              <li>Onboarding guiado persistido em localStorage.</li>
              <li>Modo demo com controles rápidos para apresentação.</li>
            </ul>
            <div className="row pointer-auto">
              <button type="button" className="btn btn-primary" onClick={replayIntro}>
                Rever abertura
              </button>
              <button type="button" className="btn btn-ghost" onClick={copyDemoLink}>
                Copiar link demo
              </button>
            </div>
          </section>
        </main>
      </div>

      <div className="chapter-indicator">{activeChapter}/{CHAPTERS.length}</div>

      {demoMode && (
        <div className="demo-panel pointer-auto">
          <button type="button" className="btn" onClick={replayIntro}>Play Intro</button>
          <button type="button" className="btn" onClick={triggerHaki}>Trigger Haki</button>
          <button type="button" className="btn" onClick={copyDemoLink}>Show AR (copy link)</button>
          <button type="button" className="btn" onClick={() => setUiSafeArea((v) => !v)}>Toggle UI safe area</button>
        </div>
      )}

      {introActive && (
        <IntroOverlay
          introStarted={introStarted}
          introProgress={introProgress}
          isShortVersion={introSeen && !forceLongIntro}
          onStart={() => {
            setInteracted(true);
            setIntroStarted(true);
          }}
          onSkip={() => {
            localStorage.setItem("intro_seen", "1");
            setIntroActive(false);
            setIntroStarted(true);
          }}
        />
      )}

      <OnboardingOverlay visible={onboardingVisible} stepIndex={onboardingStep} onDismissForever={dismissOnboardingForever} />

      {collectibleOpen && collectible && (
        <div className="modal-backdrop pointer-auto" onClick={() => setCollectibleOpen(false)}>
          <div className="collectible-card" onClick={(e) => e.stopPropagation()}>
            <p className="kicker">Unlocked collectible</p>
            <h3>{collectible.name}</h3>
            <p>ID #{collectible.id}</p>
            <p>{new Date(collectible.unlockedAt).toLocaleString("pt-BR")}</p>
            <div className="row">
              <button type="button" className="btn btn-primary" onClick={copyCollectibleText}>Copiar texto</button>
              <button type="button" className="btn btn-ghost" onClick={() => setCollectibleOpen(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
