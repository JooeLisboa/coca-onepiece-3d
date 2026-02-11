import { useCallback, useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

/**
 * Native WebXR AR session with real hit-test.
 * Handles lifecycle + cleanup to avoid leaks across multiple openings.
 */
export default function XRExperience({
  arRequested,
  onSessionStateChange,
  onHitPose,
  onSelect,
}) {
  const { gl } = useThree();
  const sessionRef = useRef(null);
  const hitTestSourceRef = useRef(null);
  const localSpaceRef = useRef(null);

  const cleanupSessionRefs = useCallback(() => {
    if (hitTestSourceRef.current) {
      hitTestSourceRef.current.cancel();
      hitTestSourceRef.current = null;
    }
    localSpaceRef.current = null;
    sessionRef.current = null;
  }, []);

  useFrame((_, __, xrFrame) => {
    if (!xrFrame || !hitTestSourceRef.current || !localSpaceRef.current) {
      return;
    }

    const hitTestResults = xrFrame.getHitTestResults(hitTestSourceRef.current);
    if (hitTestResults.length === 0) {
      onHitPose(null);
      return;
    }

    const pose = hitTestResults[0].getPose(localSpaceRef.current);
    if (!pose) {
      onHitPose(null);
      return;
    }

    const { position, orientation } = pose.transform;
    onHitPose({
      position: [position.x, position.y, position.z],
      quaternion: [orientation.x, orientation.y, orientation.z, orientation.w],
    });
  });

  useEffect(() => {
    if (!arRequested) return undefined;

    let disposed = false;
    let handleEnd;
    let handleSelect;

    const startArSession = async () => {
      try {
        if (!navigator.xr) {
          onSessionStateChange(false, "AR não disponível neste dispositivo.");
          return;
        }

        const supported = await navigator.xr
          .isSessionSupported("immersive-ar")
          .catch(() => false);

        if (!supported) {
          onSessionStateChange(false, "AR não disponível neste dispositivo.");
          return;
        }

        const session = await navigator.xr.requestSession("immersive-ar", {
          requiredFeatures: ["hit-test", "local"],
          optionalFeatures: ["local-floor", "dom-overlay"],
          domOverlay: { root: document.body },
        });

        if (disposed) {
          await session.end().catch(() => {});
          return;
        }

        sessionRef.current = session;
        // eslint-disable-next-line react-hooks/immutability
        gl.xr.enabled = true;
        gl.xr.setReferenceSpaceType("local");
        await gl.xr.setSession(session);

        const localReferenceSpace = await session.requestReferenceSpace("local");
        const viewerSpace = await session.requestReferenceSpace("viewer");
        const hitTestSource = await session.requestHitTestSource({
          space: viewerSpace,
        });

        localSpaceRef.current = localReferenceSpace;
        hitTestSourceRef.current = hitTestSource;

        handleSelect = () => onSelect();
        handleEnd = () => {
          cleanupSessionRefs();
          onHitPose(null);
          onSessionStateChange(false);
        };

        session.addEventListener("select", handleSelect);
        session.addEventListener("end", handleEnd);

        onSessionStateChange(true);
      } catch {
        cleanupSessionRefs();
        onSessionStateChange(false, "AR não disponível neste dispositivo.");
      }
    };

    startArSession();

    return () => {
      disposed = true;
      const session = sessionRef.current;
      if (session && handleSelect) {
        session.removeEventListener("select", handleSelect);
      }
      if (session && handleEnd) {
        session.removeEventListener("end", handleEnd);
      }

      if (session) {
        session.end().catch(() => {});
      }

      cleanupSessionRefs();
      onHitPose(null);
    };
  }, [arRequested, cleanupSessionRefs, gl, onHitPose, onSelect, onSessionStateChange]);

  return null;
}
