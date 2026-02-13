import { motion } from "framer-motion";

const Motion = motion;

export default function IntroOverlay({
  introStarted,
  introProgress,
  isShortVersion,
  onStart,
  onSkip,
}) {
  const inPhase1 = introProgress < 0.2;
  const inPhase2 = introProgress >= 0.2 && introProgress < 0.82;
  const inPhase3 = introProgress >= 0.82;

  return (
    <div className="intro-overlay" role="dialog" aria-live="polite">
      {!introStarted ? (
        <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="intro-panel">
          <p className="intro-kicker">Coca-Cola x One Piece</p>
          <h2>Prepare-se para embarcar</h2>
          <p>Abertura cinematográfica com passagem do Thousand Sunny.</p>
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
        <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="intro-panel intro-panel-active">
          {inPhase1 && <h2>Prepare-se para embarcar</h2>}
          {inPhase2 && <h2>Thousand Sunny em aproximação</h2>}
          {inPhase3 && <h2>Bem-vindo ao palco</h2>}
          <p>{isShortVersion ? "Versão curta" : "Abertura completa"}</p>
          <div className="intro-progress-track">
            <div className="intro-progress-fill" style={{ width: `${introProgress * 100}%` }} />
          </div>
          <button type="button" className="btn btn-ghost" onClick={onSkip}>
            Pular
          </button>
        </Motion.div>
      )}
    </div>
  );
}
