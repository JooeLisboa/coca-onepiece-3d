import { motion } from "framer-motion";

const Motion = motion;

export default function FooterDock({ onReplayIntro }) {
  return (
    <footer className="footer-dock pointer-auto" id="making-of">
      <div>
        <h3>Contato</h3>
        <p>
          <a href="https://github.com" target="_blank" rel="noreferrer">Github</a> ·{" "}
          <a href="https://linkedin.com" target="_blank" rel="noreferrer">LinkedIn</a> ·{" "}
          <a href="mailto:crew@grandline-coke.studio">Email</a>
        </p>
      </div>
      <div>
        <h3>Making of</h3>
        <p className="stack">React + R3F + drei + Framer Motion + WebXR-ready</p>
        <ul>
          <li>Intro em 3 fases com fallback visual.</li>
          <li>Lata com pivot interno e película molhada.</li>
          <li>Haki pulse temporal com VFX e micro-shake.</li>
          <li>HUD minimalista com camadas de UI limpas.</li>
        </ul>
      </div>
      <Motion.button whileHover={{ y: -2 }} type="button" className="btn btn-secondary" onClick={onReplayIntro}>
        Rever Intro
      </Motion.button>
    </footer>
  );
}
