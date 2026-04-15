import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Search, MessageCircle, User, Sparkles } from "lucide-react";

const navItems = [
  { name: "TimeMachine", icon: Clock,          label: "Travel"   },
  { name: "Discover",    icon: Search,          label: "Discover" },
  { name: "Matches",     icon: Sparkles,        label: "Matches"  },
  { name: "Messages",    icon: MessageCircle,   label: "Chat"     },
  { name: "Profile",     icon: User,            label: "Profile"  },
];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const hideNav = ["Home"].includes(currentPageName);

  const isActive = (pageName) => {
    const pageUrl = createPageUrl(pageName);
    return location.pathname === pageUrl || location.pathname === "/" && pageName === "Home";
  };

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", overflow: "hidden", background: "#FAF9F6" }}>
      <style>{`
        :root {
          --color-deep: #1e1144;
          --color-violet: #5b21b6;
          --color-indigo: #4338ca;
          --color-amber: #f59e0b;
          --color-cream: #FAF9F6;
        }
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #FAF9F6;
          overscroll-behavior: none;
          -webkit-overflow-scrolling: touch;
        }
        .gradient-deep { background: linear-gradient(135deg, #1e1144 0%, #312e81 50%, #4338ca 100%); }
        .gradient-warm { background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); }
        .glass {
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
        }
        .text-gradient {
          background: linear-gradient(135deg, #5b21b6, #4338ca);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        /* Scrollable content inside pages */
        .page-scroll {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-y: contain;
        }
        /* Hide scrollbar */
        .page-scroll::-webkit-scrollbar { display: none; }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>

      {/* Page content */}
      <div className="page-scroll" style={{ flex: 1, paddingTop: "env(safe-area-inset-top)", paddingBottom: hideNav || !user ? "env(safe-area-inset-bottom, 0px)" : 72 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ minHeight: "100%" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom nav */}
      {!hideNav && user && (
        <nav style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderTop: "1px solid rgba(0,0,0,0.06)",
          zIndex: 9999,
          paddingBottom: "env(safe-area-inset-bottom, 4px)",
        }}>
          <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", justifyContent: "space-around", alignItems: "center", padding: "6px 8px" }}>
            {navItems.map((item) => {
              const active = isActive(item.name);
              return (
                <Link key={item.name} to={createPageUrl(item.name)} style={{ textDecoration: "none" }}>
                  <motion.div
                    whileTap={{ scale: 0.82 }}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "4px 12px", borderRadius: 16, cursor: "pointer" }}
                  >
                    <motion.div
                      animate={active ? { scale: [1, 1.25, 1], y: [0, -4, 0] } : { scale: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      style={{
                        width: 44, height: 36,
                        borderRadius: 14,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: active ? "linear-gradient(135deg,#ede9fe,#ddd6fe)" : "transparent",
                        boxShadow: active ? "0 0 12px rgba(124,58,237,0.25)" : "none",
                        transition: "background 0.3s, box-shadow 0.3s",
                        position: "relative",
                      }}
                    >
                      {active && (
                        <motion.div
                          layoutId="nav-glow"
                          style={{
                            position: "absolute", inset: 0, borderRadius: 14,
                            background: "linear-gradient(135deg,rgba(124,58,237,0.15),rgba(99,102,241,0.15))",
                          }}
                        />
                      )}
                      <motion.div
                        animate={active ? { rotate: [0, -10, 10, 0] } : { rotate: 0 }}
                        transition={{ duration: 0.4, delay: 0.05 }}
                      >
                        <item.icon
                          style={{
                            width: 22, height: 22,
                            color: active ? "#7c3aed" : "#9ca3af",
                            strokeWidth: active ? 2.5 : 1.5,
                            transition: "color 0.3s",
                          }}
                        />
                      </motion.div>
                    </motion.div>

                    <motion.span
                      animate={{ color: active ? "#7c3aed" : "#9ca3af", fontWeight: active ? 700 : 500 }}
                      style={{ fontSize: 10, letterSpacing: 0.3 }}
                    >
                      {item.label}
                    </motion.span>

                    {/* Active dot */}
                    {active && (
                      <motion.div
                        layoutId="nav-dot"
                        style={{ width: 4, height: 4, borderRadius: 2, background: "#7c3aed", marginTop: -2 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
