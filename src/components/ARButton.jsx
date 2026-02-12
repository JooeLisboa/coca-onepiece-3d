import React from "react";

export default function ARButton({ arSupported, arSupportChecked, arSessionActive, onClick }) {
  const checking = !arSupportChecked;
  const unsupported = arSupportChecked && !arSupported;

  let label = "Ver em AR";
  if (checking) label = "Verificando AR…";
  if (unsupported) label = "Abrir no celular para AR";
  if (arSessionActive) label = "AR ativo";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={checking || arSessionActive}
      className="control-chip control-chip-ar"
      aria-label={label}
      title={label}
    >
      {label}
    </button>
  );
}
