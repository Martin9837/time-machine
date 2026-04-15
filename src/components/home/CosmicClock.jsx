import React, { useMemo } from "react";
import "./CosmicClock.css";

const CX = 150; const CY = 150; // SVG centre

// ── helpers ───────────────────────────────────────────────────────────────────
function polar(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

// ── Sub-components ────────────────────────────────────────────────────────────

/** Rotating dashed ring */
function Ring({ r, dasharray, duration, ccw, color, opacity = 0.6, strokeWidth = 1.5 }) {
  const cls = `cc-ring ${ccw ? "cc-ring-ccw" : "cc-ring-cw"}`;
  return (
    <g className={cls} style={{ animationDuration: duration }}>
      <circle
        cx={CX} cy={CY} r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={dasharray}
        opacity={opacity}
        className="cc-glow"
        style={{ animationDuration: "3.5s" }}
      />
    </g>
  );
}

/** Tick marks ring */
function Ticks({ count, r1, r2, color, opacity, strokeWidth = 1, majorEvery, majorR2, majorColor, majorStrokeWidth = 2 }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const isMajor = majorEvery && i % majorEvery === 0;
        const [x1, y1] = polar(CX, CY, r1, i * (360 / count));
        const [x2, y2] = polar(CX, CY, isMajor ? (majorR2 || r2 + 4) : r2, i * (360 / count));
        return (
          <line
            key={i}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={isMajor ? (majorColor || color) : color}
            strokeWidth={isMajor ? majorStrokeWidth : strokeWidth}
            opacity={isMajor ? Math.min(opacity + 0.3, 1) : opacity}
          />
        );
      })}
    </>
  );
}

/** Cardinal markers (N/E/S/W style bright dots) */
function CardinalMarkers({ r }) {
  return (
    <>
      {[0, 90, 180, 270].map((a, i) => {
        const [x, y] = polar(CX, CY, r, a);
        return (
          <circle key={i} cx={x} cy={y} r={3.5}
            fill="#00ddff" opacity={0.9}
            style={{ filter: "drop-shadow(0 0 4px #00aaff)" }}
          />
        );
      })}
    </>
  );
}

/** Star field */
function StarField({ count = 55, seed = 42 }) {
  const stars = useMemo(() => {
    // deterministic pseudo-random
    let s = seed;
    const rand = () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
    return Array.from({ length: count }, (_) => ({
      x: rand() * 300,
      y: rand() * 300,
      r: rand() * 1.3 + 0.4,
      delay: rand() * 4,
      dur: rand() * 2 + 1.5,
    }));
  }, [count, seed]);

  return (
    <>
      {stars.map((s, _i) => (
        <circle key={_i} cx={s.x} cy={s.y} r={s.r}
          fill="white"
          className="cc-star"
          style={{ animationDelay: `${s.delay}s`, animationDuration: `${s.dur}s` }}
        />
      ))}
    </>
  );
}

/** Scanning sweep line */
function ScanLine() {
  return (
    <g className="cc-ring cc-ring-cw" style={{ animationDuration: "6s" }}>
      <line x1={CX} y1={CY} x2={CX} y2={CY - 128}
        stroke="url(#scanGrad)"
        strokeWidth={1.5}
        opacity={0.7}
        className="cc-beam"
        style={{ animationDuration: "6s" }}
      />
    </g>
  );
}

// ── Floating orbs (positioned outside SVG) ────────────────────────────────────
const ORB_DEFS = [
  { angle: 15,  dist: 148, size: 11, color: "#ff7700", delay: "0s",    dur: "3.2s", alt: false },
  { angle: 68,  dist: 138, size: 7,  color: "#ffaa00", delay: "0.6s",  dur: "4.1s", alt: true  },
  { angle: 128, dist: 155, size: 13, color: "#ff5500", delay: "1.1s",  dur: "3.6s", alt: false },
  { angle: 178, dist: 142, size: 8,  color: "#ff9900", delay: "1.7s",  dur: "2.9s", alt: true  },
  { angle: 230, dist: 152, size: 10, color: "#ffcc00", delay: "0.9s",  dur: "3.8s", alt: false },
  { angle: 285, dist: 145, size: 6,  color: "#ff8800", delay: "2.1s",  dur: "3.3s", alt: true  },
  { angle: 340, dist: 150, size: 9,  color: "#ff6600", delay: "0.4s",  dur: "4.4s", alt: false },
  { angle: 50,  dist: 168, size: 5,  color: "#ffbb00", delay: "1.4s",  dur: "3.0s", alt: true  },
  { angle: 160, dist: 163, size: 8,  color: "#ff7700", delay: "2.6s",  dur: "2.7s", alt: false },
  { angle: 310, dist: 170, size: 6,  color: "#ff9900", delay: "0.7s",  dur: "3.9s", alt: true  },
  { angle: 95,  dist: 162, size: 4,  color: "#ffdd00", delay: "1.9s",  dur: "4.7s", alt: false },
  { angle: 250, dist: 172, size: 7,  color: "#ff5500", delay: "3.1s",  dur: "3.5s", alt: true  },
];

function FloatingOrbs({ containerSize }) {
  const half = containerSize / 2;
  return (
    <>
      {ORB_DEFS.map((orb, i) => {
        const rad = ((orb.angle - 90) * Math.PI) / 180;
        // dist is in SVG units (out of 300); scale to container
        const scale = containerSize / 300;
        const cx = half + orb.dist * scale * Math.cos(rad);
        const cy = half + orb.dist * scale * Math.sin(rad);
        const s = orb.size * scale;
        return (
          <div
            key={i}
            className={orb.alt ? "cc-orb-alt" : "cc-orb"}
            style={{
              width: s,
              height: s,
              left: cx - s / 2,
              top: cy - s / 2,
              background: orb.color,
              boxShadow: `0 0 ${s * 1.5}px ${orb.color}, 0 0 ${s * 3}px ${orb.color}88, 0 0 ${s * 5}px ${orb.color}44`,
              animationDelay: orb.delay,
              animationDuration: orb.dur,
            }}
          />
        );
      })}
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CosmicClock({ size = 300 }) {
  return (
    <div
      className="relative select-none"
      style={{ width: size, height: size, margin: "0 auto" }}
    >
      {/* Outer ambient glow */}
      <div className="cc-outer-glow" />

      {/* Floating orbs */}
      <FloatingOrbs containerSize={size} />

      {/* SVG clock */}
      <svg
        viewBox="0 0 300 300"
        width={size}
        height={size}
        style={{ position: "relative", zIndex: 1, overflow: "visible" }}
      >
        <defs>
          {/* Scan line gradient */}
          <linearGradient id="scanGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#00aaff" stopOpacity="0" />
            <stop offset="100%" stopColor="#00ffff" stopOpacity="0.9" />
          </linearGradient>

          {/* Center glow gradient */}
          <radialGradient id="centerGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#00ffff" stopOpacity="1" />
            <stop offset="40%"  stopColor="#0088ff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0033cc" stopOpacity="0.6" />
          </radialGradient>

          {/* Inner disc gradient */}
          <radialGradient id="discGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#001833" stopOpacity="1" />
            <stop offset="60%"  stopColor="#000d1a" stopOpacity="1" />
            <stop offset="100%" stopColor="#000510" stopOpacity="1" />
          </radialGradient>

          {/* Outer disc gradient */}
          <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#001030" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#000010" stopOpacity="0.98" />
          </radialGradient>

          {/* Ring glow filter */}
          <filter id="ringGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Background disc ── */}
        <circle cx={CX} cy={CY} r={135} fill="url(#bgGrad)" />

        {/* ── Star field ── */}
        <StarField count={60} />

        {/* ── Outer ambient ring (static faint) ── */}
        <circle cx={CX} cy={CY} r={135}
          fill="none" stroke="#0044aa" strokeWidth={0.5} opacity={0.25}
        />

        {/* ── Rotating rings (outermost → innermost) ── */}
        <Ring r={128} dasharray="3 8"  duration="90s"  ccw={true}  color="#0055cc" opacity={0.35} strokeWidth={1}   />
        <Ring r={118} dasharray="8 5"  duration="60s"  ccw={false} color="#0077ee" opacity={0.50} strokeWidth={1.5} />
        <Ring r={106} dasharray="14 4" duration="42s"  ccw={true}  color="#00aaff" opacity={0.60} strokeWidth={1.5} />
        <Ring r={94}  dasharray="3 5"  duration="25s"  ccw={false} color="#00ccff" opacity={0.45} strokeWidth={1}   />
        <Ring r={80}  dasharray="7 3"  duration="14s"  ccw={true}  color="#44aaff" opacity={0.70} strokeWidth={2}   />

        {/* ── Inner disc ── */}
        <circle cx={CX} cy={CY} r={73} fill="url(#discGrad)" />

        {/* ── Tick marks ── */}
        <g filter="url(#ringGlow)">
          <Ticks
            count={60} r1={75} r2={79}
            color="#00aaff" opacity={0.4} strokeWidth={0.8}
            majorEvery={5} majorR2={82} majorColor="#00ddff" majorStrokeWidth={1.5}
          />
        </g>

        {/* ── Cardinal bright marks ── */}
        <CardinalMarkers r={68} />

        {/* ── Inner small ring ── */}
        <Ring r={62} dasharray="5 3" duration="8s" ccw={false} color="#0099ff" opacity={0.8} strokeWidth={1.5} />

        {/* ── Crosshair energy beams ── */}
        <g className="cc-beam" style={{ animationDuration: "2.8s" }}>
          <line x1={CX - 58} y1={CY} x2={CX + 58} y2={CY} stroke="url(#scanGrad)" strokeWidth={0.8} style={{ transform: "rotate(90deg)", transformOrigin: "150px 150px" }} />
        </g>
        <g className="cc-beam" style={{ animationDuration: "3.4s", animationDelay: "0.7s" }}>
          <line x1={CX} y1={CY - 58} x2={CX} y2={CY + 58} stroke="#00aaff" strokeWidth={0.8} opacity={0.5} />
        </g>
        <g className="cc-beam" style={{ animationDuration: "2.1s", animationDelay: "1.2s" }}>
          {[45, 135].map((angle, i) => {
            const [x1, y1] = polar(CX, CY, 2, angle);
            const [x2, y2] = polar(CX, CY, 56, angle);
            const [x3, y3] = polar(CX, CY, 2, angle + 180);
            const [x4, y4] = polar(CX, CY, 56, angle + 180);
            return (
              <g key={i}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#0066ff" strokeWidth={0.6} opacity={0.4} />
                <line x1={x3} y1={y3} x2={x4} y2={y4} stroke="#0066ff" strokeWidth={0.6} opacity={0.4} />
              </g>
            );
          })}
        </g>

        {/* ── Scanning sweep ── */}
        <ScanLine />

        {/* ── Inner detail ring ── */}
        <Ring r={42} dasharray="4 8" duration="18s" ccw={true} color="#0088ff" opacity={0.5} strokeWidth={1} />

        {/* ── Center glow disc ── */}
        <circle cx={CX} cy={CY} r={22}
          fill="#001833"
          stroke="#00aaff"
          strokeWidth={1.5}
          opacity={0.9}
          style={{ filter: "drop-shadow(0 0 8px #0088ff)" }}
        />

        {/* ── Centre dot (brightest point) ── */}
        <circle cx={CX} cy={CY} r={6}
          fill="url(#centerGrad)"
          style={{
            filter: "drop-shadow(0 0 8px #00ccff) drop-shadow(0 0 20px #0055ff)",
            animation: "cosmic-pulse-glow 1.8s ease-in-out infinite",
          }}
        />
        <circle cx={CX} cy={CY} r={2.5} fill="white" opacity={0.95} />

        {/* ── Outer decorative dots on rim ── */}
        {Array.from({ length: 24 }, (_, i) => {
          const [x, y] = polar(CX, CY, 132, i * 15);
          const isBright = i % 6 === 0;
          return (
            <circle key={i} cx={x} cy={y} r={isBright ? 2 : 1}
              fill={isBright ? "#00ccff" : "#0055aa"}
              opacity={isBright ? 0.9 : 0.5}
            />
          );
        })}
      </svg>
    </div>
  );
}
