const AUDIO_MUTE_KEY = "coca-onepiece-audio-muted";

/** Persist mute preference for subsequent visits. */
export function persistMutePreference(muted) {
  localStorage.setItem(AUDIO_MUTE_KEY, JSON.stringify(Boolean(muted)));
}

/** Read mute preference from localStorage; defaults to false. */
export function readMutePreference() {
  try {
    return JSON.parse(localStorage.getItem(AUDIO_MUTE_KEY) ?? "false") === true;
  } catch {
    return false;
  }
}

/**
 * Listen for first trusted interaction so audio can start after user intent.
 * Returns cleanup for all listeners.
 */
export function listenForFirstInteraction(onInteract) {
  let done = false;

  const markInteracted = () => {
    if (done) return;
    done = true;
    onInteract();
    cleanup();
  };

  const options = { passive: true };
  const events = ["pointerdown", "touchstart", "keydown"];

  events.forEach((eventName) =>
    window.addEventListener(eventName, markInteracted, options),
  );

  const cleanup = () => {
    events.forEach((eventName) =>
      window.removeEventListener(eventName, markInteracted, options),
    );
  };

  return cleanup;
}
