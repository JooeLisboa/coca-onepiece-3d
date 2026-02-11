import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { PositionalAudio } from "@react-three/drei";
import * as THREE from "three";

const AMBIENCE_BASE_VOLUME = 0.22;

/**
 * Scene audio graph with a single AudioListener on camera.
 * Includes short ambience ducking while one-shots are playing.
 */
export default function AudioController({
  muted,
  userHasInteracted,
  hakiTrigger,
  paperTrigger,
}) {
  const { camera } = useThree();
  const listener = useMemo(() => new THREE.AudioListener(), []);
  const ambienceRef = useRef();
  const hakiRef = useRef();
  const paperRef = useRef();
  const duckTimerRef = useRef(null);

  useEffect(() => {
    if (!camera.children.includes(listener)) {
      camera.add(listener);
    }

    return () => {
      camera.remove(listener);
    };
  }, [camera, listener]);

  useEffect(() => {
    if (!userHasInteracted) return;
    listener.context?.resume?.().catch(() => {});
  }, [listener, userHasInteracted]);

  const duckAmbience = useCallback(
    (durationMs = 520) => {
      const ambience = ambienceRef.current;
      if (!ambience || muted) return;

      if (duckTimerRef.current) {
        clearTimeout(duckTimerRef.current);
        duckTimerRef.current = null;
      }

      ambience.setVolume(0.1);
      duckTimerRef.current = setTimeout(() => {
        ambience.setVolume(muted ? 0 : AMBIENCE_BASE_VOLUME);
        duckTimerRef.current = null;
      }, durationMs);
    },
    [muted],
  );

  useEffect(() => {
    const ambience = ambienceRef.current;
    if (!ambience) return;

    ambience.setVolume(muted ? 0 : AMBIENCE_BASE_VOLUME);

    if (!userHasInteracted || muted) {
      ambience.pause();
      return;
    }

    if (!ambience.isPlaying) {
      ambience.play();
    }
  }, [muted, userHasInteracted]);

  useEffect(() => {
    const haki = hakiRef.current;
    if (!haki || muted || !userHasInteracted || hakiTrigger === 0) return;
    if (haki.isPlaying) haki.stop();
    haki.setVolume(0.9);
    duckAmbience(520);
    haki.play();
  }, [duckAmbience, hakiTrigger, muted, userHasInteracted]);

  useEffect(() => {
    const paper = paperRef.current;
    if (!paper || muted || !userHasInteracted || paperTrigger === 0) return;
    if (paper.isPlaying) paper.stop();
    paper.setVolume(0.7);
    duckAmbience(620);
    paper.play();
  }, [duckAmbience, paperTrigger, muted, userHasInteracted]);

  useEffect(
    () => () => {
      if (duckTimerRef.current) clearTimeout(duckTimerRef.current);
    },
    [],
  );

  return (
    <>
      <group position={[-6, 0.8, -10]}>
        <PositionalAudio
          ref={ambienceRef}
          listener={listener}
          url="/audio/ambience_ocean.mp3"
          distance={35}
          loop
          autoplay={false}
        />
      </group>

      <group position={[0, -1.6, 0.3]}>
        <PositionalAudio
          ref={hakiRef}
          listener={listener}
          url="/audio/haki_impact.mp3"
          distance={8}
          loop={false}
          autoplay={false}
        />
      </group>

      <group position={[0, 1, 2]}>
        <PositionalAudio
          ref={paperRef}
          listener={listener}
          url="/audio/paper_unroll.mp3"
          distance={10}
          loop={false}
          autoplay={false}
        />
      </group>
    </>
  );
}
