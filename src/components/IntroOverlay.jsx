import { motion } from "framer-motion";

const Motion = motion;

export default function IntroOverlay({ started, progress, shortIntro, onStart, onSkip }) {
  const phaseA = progress < 0.18;
  const phaseB = progress >= 0.18 && progress < 0.82;
  const phaseC = progress >= 0.82;

  return (
    <div className="intro-overlay" role="dialog" aria-live="polite">
      {!started ? (
        <Motion.div className="intro-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p className="intro-kicker">Abertura Cinemática</p>
          <h2>Embarque na Grand Line</h2>
          <p>Uma passagem do Thousand Sunny antes da experiência principal.</p>
          <div className="intro-actions">
            <button type="button" className="btn btn-primary" onClick={onStart}>
              Iniciar
            </button>
            <button type="button" className="btn btn-ghost" onClick={onSkip}>
              Pular
            </button>
          </div>
        </Motion.div>
      ) : (
        <Motion.div className="intro-card intro-card-live" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {phaseA && <h2>Embarque na Grand Line</h2>}
          {phaseB && <h2>Thousand Sunny atravessando o horizonte</h2>}
          {phaseC && <h2>Bem-vindo ao palco</h2>}
          <p>{shortIntro ? "Versão curta" : "Sequência completa"}</p>
          <div className="intro-progress">
            <span style={{ width: `${progress * 100}%` }} />
          </div>
          <button type="button" className="btn btn-ghost" onClick={onSkip}>
            Pular
          </button>
        </Motion.div>
      )}
      {phaseC && started && <div className="intro-wipe" />}
    </div>
  );
}
