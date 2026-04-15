import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { base44 } from "@/api/base44Client";
import { ArrowRight, Sparkles, Shield, Users, Clock } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  { icon: Clock,     title: "Travel Back in Time",    desc: "Enter a year and place from your past" },
  { icon: Users,     title: "Find Lost Connections",  desc: "Discover people who shared your moments" },
  { icon: Shield,    title: "Privacy First",          desc: "You control what you share, always" },
];

export default function Home() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setChecking(false); }).catch(() => setChecking(false));
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 50% 20%, #0d1a3a 0%, #060b1a 55%, #000008 100%)",
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Ambient blobs */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "8%", left: "50%", transform: "translateX(-50%)", width: 400, height: 400, background: "rgba(29,78,216,0.12)", borderRadius: "50%", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", top: "30%", left: "-15%", width: 280, height: 280, background: "rgba(109,40,217,0.10)", borderRadius: "50%", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", top: "40%", right: "-15%", width: 260, height: 260, background: "rgba(67,56,202,0.10)", borderRadius: "50%", filter: "blur(60px)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "24px 24px 32px", maxWidth: 480, margin: "0 auto", width: "100%" }}>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}
        >
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 99, padding: "8px 18px",
          }}>
            <Sparkles style={{ width: 14, height: 14, color: "#fbbf24" }} />
            <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: 600 }}>
              Reconnect with your past
            </span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          style={{ textAlign: "center", marginBottom: 36 }}
        >
          <h1 style={{
            fontSize: 52, fontWeight: 800, color: "white",
            letterSpacing: "-0.03em", lineHeight: 1.05,
            margin: "0 0 16px",
          }}>
            Time<br />Machine
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, lineHeight: 1.65, maxWidth: 320, margin: "0 auto" }}>
            Travel back to wherever life shaped you. Find the people who were there too, and see where they are now.
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          style={{ marginBottom: 32 }}
        >
          {!checking && (
            user ? (
              <Link to={createPageUrl("TimeMachine")}>
                <button style={{
                  width: "100%", height: 56, borderRadius: 20, border: "none",
                  background: "white", color: "#0d1a3a",
                  fontWeight: 700, fontSize: 16, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
                }}>
                  Engage Time Machine <ArrowRight style={{ width: 20, height: 20 }} />
                </button>
              </Link>
            ) : (
              <button
                onClick={() => base44.auth.redirectToLogin()}
                style={{
                  width: "100%", height: 56, borderRadius: 20, border: "none",
                  background: "white", color: "#0d1a3a",
                  fontWeight: 700, fontSize: 16, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
                }}
              >
                Get Started <ArrowRight style={{ width: 20, height: 20 }} />
              </button>
            )
          )}
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.65 }}
          style={{ display: "flex", flexDirection: "column", gap: 10 }}
        >
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + i * 0.1 }}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                background: "rgba(255,255,255,0.06)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 18, padding: "14px 16px",
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 13,
                background: "rgba(255,255,255,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <f.icon style={{ width: 20, height: 20, color: "#fbbf24" }} />
              </div>
              <div>
                <p style={{ color: "white", fontWeight: 600, fontSize: 13, margin: 0 }}>{f.title}</p>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, margin: "2px 0 0" }}>{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Footer */}
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", paddingBottom: 24 }}>
        <p style={{ color: "rgba(255,255,255,0.15)", fontSize: 11 }}>Your memories, your connections, your rules.</p>
      </div>
    </div>
  );
}
