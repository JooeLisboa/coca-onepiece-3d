import { motion, AnimatePresence } from "framer-motion";

const Motion = motion;

const STEPS = [
  "Arraste para girar a cena",
  "Clique na lata para ativar Haki",
  "Abra no celular para AR",
];

export default function OnboardingOverlay({ visible, stepIndex, onDismissForever }) {
  return (
    <div className="onboarding-wrap" aria-live="polite">
      <AnimatePresence>
        {visible && (
          <Motion.div
            className="onboarding-card"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            <p className="kicker">Onboarding</p>
            <p>{STEPS[stepIndex] ?? STEPS[STEPS.length - 1]}</p>
            <button type="button" className="link-btn" onClick={onDismissForever}>
              Não mostrar novamente
            </button>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
