import React from "react";

export default function ARButton({ disabled, unsupportedReason, onClick }) {
  return (
    <div className="fixed bottom-6 right-4 z-[70] flex flex-col items-end gap-2">
      <button
        onClick={onClick}
        disabled={disabled}
        title={
          disabled
            ? unsupportedReason || "AR não disponível neste dispositivo."
            : "Abrir experiência em realidade aumentada"
        }
        className="pointer-events-auto rounded-xl border border-[#d4af37]/60 bg-gradient-to-r from-[#090c1a] via-[#101a36] to-[#3d0e15] px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white shadow-[0_0_25px_rgba(212,175,55,0.25)] transition-all enabled:hover:shadow-[0_0_30px_rgba(255,0,0,0.45)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Ver na sua mesa (AR)
      </button>
      {disabled && (
        <span className="rounded-md bg-black/60 px-2 py-1 text-[10px] uppercase tracking-wider text-white/80">
          {unsupportedReason || "AR indisponível"}
        </span>
      )}
    </div>
  );
}
