import React, { useEffect, useState } from "react";
import CosmicClock from "./CosmicClock";

/**
 * Full-screen animated splash screen shown on first app launch.
 * Renders for `duration` ms then fades out, calling `onDone` when hidden.
 */
export default function AnimatedSplash({ duration = 2600, onDone }) {
  // 0 = fully visible, 1 = fading, 2 = gone
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const showTimer = setTimeout(() => setPhase(1), duration);
    return () => clearTimeout(showTimer);
  }, [duration]);

  const handleTransitionEnd = () => {
    if (phase === 1) {
      setPhase(2);
      onDone?.();
    }
  };

  if (phase === 2) return null;

  return (
    <div
      onTransitionEnd={handleTransitionEnd}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(ellipse at 50% 40%, #0d1a3a 0%, #060b1a 55%, #000008 100%)",
        opacity: phase === 1 ? 0 : 1,
        transition: "opacity 0.7s ease-out",
        userSelect: "none",
        pointerEvents: phase === 1 ? "none" : "auto",
      }}
    >
      {/* Ambient glow blobs */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "5%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 320,
            height: 320,
            background: "rgba(29,78,216,0.12)",
            borderRadius: "50%",
            filter: "blur(60px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "-10%",
            width: 200,
            height: 200,
            background: "rgba(109,40,217,0.10)",
            borderRadius: "50%",
            filter: "blur(50px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "25%",
            right: "-10%",
            width: 200,
            height: 200,
            background: "rgba(67,56,202,0.10)",
            borderRadius: "50%",
            filter: "blur(50px)",
          }}
        />
      </div>

      {/* Clock */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <CosmicClock size={260} />
      </div>

      {/* App name */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          marginTop: 32,
          textAlign: "center",
        }}
      >
        <h1
          style={{
            color: "white",
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          Time Machine
        </h1>
        <p
          style={{
            color: "rgba(255,255,255,0.45)",
            fontSize: 13,
            marginTop: 8,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Reconnect with your past
        </p>
      </div>
    </div>
  );
}
