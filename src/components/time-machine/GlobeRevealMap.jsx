import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Users, MapPin, Sparkles, X, Send, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

const geocodeCity = async (city) => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`);
    const data = await res.json();
    if (data.length > 0) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  } catch {}
  return null;
};

function FlyTo({ coords }) {
  const map = useMap();
  useEffect(() => { if (coords) map.flyTo(coords, 12, { animate: true, duration: 2.5 }); }, [coords, map]);
  return null;
}

const youIcon = L.divIcon({
  className: "",
  html: `<div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
    <div style="position:absolute;width:44px;height:44px;border-radius:50%;background:rgba(124,58,237,0.2);animation:ping 1.5s cubic-bezier(0,0,.2,1) infinite;"></div>
    <div style="position:absolute;width:28px;height:28px;border-radius:50%;background:rgba(124,58,237,0.35);animation:ping 1.5s cubic-bezier(0,0,.2,1) infinite;animation-delay:.3s;"></div>
    <div style="width:20px;height:20px;border-radius:50%;background:#7c3aed;border:3px solid white;box-shadow:0 0 16px rgba(124,58,237,.9);"></div>
    <style>@keyframes ping{75%,100%{transform:scale(2.4);opacity:0;}}</style>
  </div>`,
  iconSize: [44, 44], iconAnchor: [22, 22],
});

const makeMatchIcon = (index, isSelected) => L.divIcon({
  className: "",
  html: `<div style="animation:dropIn .5s ease forwards;animation-delay:${index * 0.12}s;opacity:0;transform:translateY(-30px);cursor:pointer;">
    <div style="width:42px;height:42px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:linear-gradient(135deg,${isSelected ? '#7c3aed,#4338ca' : '#f59e0b,#ef4444'});border:3px solid white;box-shadow:0 4px 20px rgba(${isSelected ? '124,58,237' : '239,68,68'},.6);transition:all .3s;">
      <div style="width:12px;height:12px;background:white;border-radius:50%;transform:rotate(45deg);margin:11px auto 0;"></div>
    </div>
    ${isSelected ? '<div style="position:absolute;top:-8px;left:50%;transform:translateX(-50%);background:#7c3aed;color:white;font-size:9px;padding:2px 5px;border-radius:8px;white-space:nowrap;font-weight:700;">Tap again</div>' : ''}
  </div>
  <style>@keyframes dropIn{to{opacity:1;transform:translateY(0);}}</style>`,
  iconSize: [42, 42], iconAnchor: [21, 42],
});

// ── Globe Visual ──────────────────────────────────────────────────────────────
const STARS = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  w: Math.random() * 2.5 + 1,
  top: Math.random() * 100,
  left: Math.random() * 100,
  dur: 1.5 + Math.random() * 2,
  delay: Math.random() * 2,
}));

function GlobeVisual() {
  return (
    <div style={{ position: "relative", width: 220, height: 220 }}>
      <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        style={{ position: "absolute", inset: -20, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.4) 0%, transparent 70%)" }} />
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        style={{ width: 220, height: 220, borderRadius: "50%",
          background: "radial-gradient(ellipse at 35% 35%, #60a5fa 0%, #3b82f6 25%, #1d4ed8 50%, #1e3a8a 75%, #0f172a 100%)",
          boxShadow: "inset -30px -20px 60px rgba(0,0,0,0.6), inset 15px 15px 40px rgba(255,255,255,0.15), 0 0 60px rgba(59,130,246,0.6), 0 0 120px rgba(124,58,237,0.3)",
          position: "relative", overflow: "hidden" }}>
        <div style={{ position:"absolute", top:"18%", left:"22%", width:"32%", height:"28%", borderRadius:"40% 60% 50% 40%", background:"rgba(34,197,94,0.6)" }} />
        <div style={{ position:"absolute", top:"33%", left:"55%", width:"26%", height:"32%", borderRadius:"50% 40% 60% 50%", background:"rgba(34,197,94,0.55)" }} />
        <div style={{ position:"absolute", top:"55%", left:"28%", width:"22%", height:"20%", borderRadius:"50%", background:"rgba(34,197,94,0.5)" }} />
        <div style={{ position:"absolute", top:"13%", left:"60%", width:"16%", height:"20%", borderRadius:"50% 60% 40% 55%", background:"rgba(34,197,94,0.45)" }} />
        {[22, 44, 66].map(t => <div key={t} style={{ position:"absolute", top:`${t}%`, left:0, right:0, height:1, background:"rgba(255,255,255,0.08)" }} />)}
        <div style={{ position:"absolute", top:"8%", left:"12%", width:"36%", height:"32%", borderRadius:"50%", background:"radial-gradient(circle, rgba(255,255,255,0.22) 0%, transparent 70%)" }} />
      </motion.div>
      <motion.div animate={{ rotateZ: 360 }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        style={{ position:"absolute", inset:-10, borderRadius:"50%", border:"2px solid rgba(124,58,237,0.35)" }} />
    </div>
  );
}

// ── Match Bottom Sheet ────────────────────────────────────────────────────────
function MatchSheet({ match, myMemory, user, onClose, onRequestSent }) {
  const [status, setStatus] = useState("idle"); // idle | sending | sent

  const sendRequest = async () => {
    setStatus("sending");
    try {
      const summary = `You were both in ${myMemory?.city} around ${myMemory?.year}`;
      await base44.entities.MatchRequest.create({
        from_user: user?.email,
        to_user: match.created_by,
        from_memory_id: myMemory?.id || "",
        to_memory_id: match.id,
        status: "pending",
        match_summary: summary,
        match_score: 50,
      });
      setStatus("sent");
      setTimeout(() => { onRequestSent?.(); onClose(); }, 1800);
    } catch {
      setStatus("idle");
    }
  };

  const initial = (match.nickname || match.created_by || "?")[0].toUpperCase();
  const colors = ["#7c3aed", "#2563eb", "#059669", "#dc2626", "#d97706"];
  const color = colors[initial.charCodeAt(0) % colors.length];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: "absolute", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 350 }}
        onClick={e => e.stopPropagation()}
        style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "linear-gradient(180deg, #13131f 0%, #0d0d1a 100%)",
          borderRadius: "24px 24px 0 0",
          padding: "8px 24px 40px",
          border: "1px solid rgba(255,255,255,0.08)",
          borderBottom: "none",
        }}
      >
        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)", margin: "8px auto 20px" }} />

        {/* Close */}
        <button onClick={onClose} style={{ position:"absolute", top:16, right:20, width:32, height:32, borderRadius:"50%", background:"rgba(255,255,255,0.08)", border:"none", color:"white", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <X size={16} />
        </button>

        {/* Avatar + name */}
        <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:20 }}>
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type:"spring", delay:0.1 }}
            style={{ width:64, height:64, borderRadius:20, background:`linear-gradient(135deg, ${color}, ${color}99)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, fontWeight:800, color:"white", boxShadow:`0 0 24px ${color}60` }}
          >
            {initial}
          </motion.div>
          <div>
            <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.15 }}
              style={{ fontSize:20, fontWeight:700, color:"white" }}>
              {match.nickname || "Someone"}
            </motion.div>
            <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.2 }}
              style={{ fontSize:13, color:"rgba(255,255,255,0.45)", marginTop:2 }}>
              {match.city}{match.area ? `, ${match.area}` : ""}
            </motion.div>
          </div>
        </div>

        {/* Info pills */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }}
          style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:20 }}>
          {[
            { icon:"📅", label: `${match.year}${match.year_end ? `–${match.year_end}` : ""}` },
            { icon:"📍", label: match.city },
            ...(match.contexts || []).slice(0,2).map(c => ({ icon:"✨", label: c })),
          ].map((p, i) => (
            <div key={i} style={{ background:"rgba(124,58,237,0.15)", border:"1px solid rgba(124,58,237,0.3)", borderRadius:20, padding:"5px 12px", fontSize:12, color:"#c4b5fd", display:"flex", alignItems:"center", gap:5 }}>
              <span>{p.icon}</span> {p.label}
            </div>
          ))}
        </motion.div>

        {/* Shared memory highlight */}
        {myMemory?.city?.toLowerCase() === match.city?.toLowerCase() && (
          <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} transition={{ delay:0.3 }}
            style={{ background:"linear-gradient(135deg, rgba(124,58,237,0.2), rgba(99,102,241,0.15))", border:"1px solid rgba(124,58,237,0.3)", borderRadius:16, padding:"12px 16px", marginBottom:20, display:"flex", alignItems:"center", gap:10 }}>
            <Sparkles size={18} color="#fbbf24" />
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:"#e9d5ff" }}>Shared Memory!</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginTop:2 }}>You were both in {match.city} at the same time</div>
            </div>
          </motion.div>
        )}

        {/* Action button */}
        <motion.button
          initial={{ opacity:0, y:20 }}
          animate={{ opacity:1, y:0 }}
          transition={{ delay:0.35, type:"spring" }}
          whileTap={{ scale: 0.95 }}
          onClick={status === "idle" ? sendRequest : undefined}
          disabled={status === "sending" || status === "sent"}
          style={{
            width:"100%", padding:"16px", borderRadius:18, border:"none", cursor: status === "idle" ? "pointer" : "default",
            background: status === "sent"
              ? "linear-gradient(135deg, #059669, #10b981)"
              : "linear-gradient(135deg, #7c3aed, #4338ca)",
            boxShadow: `0 8px 32px ${status === "sent" ? "rgba(5,150,105,0.4)" : "rgba(124,58,237,0.4)"}`,
            display:"flex", alignItems:"center", justifyContent:"center", gap:10,
            fontSize:16, fontWeight:700, color:"white",
            transition:"all 0.3s",
          }}
        >
          <AnimatePresence mode="wait">
            {status === "idle" && (
              <motion.div key="idle" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                style={{ display:"flex", alignItems:"center", gap:10 }}>
                <Send size={18} /> Send Connection Request
              </motion.div>
            )}
            {status === "sending" && (
              <motion.div key="sending" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                style={{ display:"flex", alignItems:"center", gap:10 }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease:"linear" }}
                  style={{ width:18, height:18, border:"2px solid white", borderTopColor:"transparent", borderRadius:"50%" }} />
                Sending...
              </motion.div>
            )}
            {status === "sent" && (
              <motion.div key="sent" initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:"spring" }}
                style={{ display:"flex", alignItems:"center", gap:10 }}>
                <CheckCircle size={18} /> Request Sent!
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function GlobeRevealMap({ myMemory, allMemories = [], user, onContinue }) {
  const [phase, setPhase] = useState("globe");
  const [cityCoords, setCityCoords] = useState(null);
  const [matches, setMatches] = useState([]);
  const [pinsReady, setPinsReady] = useState(false);
  const [statusText, setStatusText] = useState("Scanning the globe...");
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [, setSentTo] = useState(new Set());

  // Stable match positions (computed once)
  const [matchPositions] = useState(() =>
    allMemories
      .filter(m => m.created_by !== user?.email && m.open_to_connect)
      .map(m => ({ match: m, offset: [(Math.random() - 0.5) * 0.06, (Math.random() - 0.5) * 0.06] }))
  );

  useEffect(() => {
    const filtered = allMemories.filter(m => {
      if (m.created_by === user?.email) return false;
      if (!m.open_to_connect) return false;
      return m.city?.toLowerCase() === myMemory?.city?.toLowerCase();
    });
    setMatches(filtered);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setCityCoords([pos.coords.latitude, pos.coords.longitude]),
        () => { if (myMemory?.city) geocodeCity(myMemory.city).then(setCityCoords); },
        { timeout: 5000 }
      );
    } else if (myMemory?.city) {
      geocodeCity(myMemory.city).then(setCityCoords);
    }

    const t1 = setTimeout(() => setStatusText("Locking onto your location..."), 900);
    const t2 = setTimeout(() => setStatusText(`Finding people in ${myMemory?.city || "your city"}...`), 1800);
    const t3 = setTimeout(() => setPhase("reveal"), 2800);
    const t4 = setTimeout(() => setPhase("map"), 3600);
    const t5 = setTimeout(() => setPinsReady(true), 5800);
    return () => [t1,t2,t3,t4,t5].forEach(clearTimeout);
  }, []);

  const handlePinClick = useCallback((match) => {
    setSelectedMatch(prev => prev?.id === match.id ? null : match);
  }, []);

  return (
    <div style={{ position:"fixed", inset:0, zIndex:9999, background:"#060612", overflow:"hidden" }}>
      <AnimatePresence mode="wait">

        {/* GLOBE */}
        {phase === "globe" && (
          <motion.div key="globe" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"radial-gradient(ellipse at center, #0d0d2b 0%, #060612 70%)" }}>
            {STARS.map(s => (
              <motion.div key={s.id} animate={{ opacity:[0.2,1,0.2] }} transition={{ duration:s.dur, repeat:Infinity, delay:s.delay }}
                style={{ position:"absolute", width:s.w, height:s.w, borderRadius:"50%", background:"white", top:`${s.top}%`, left:`${s.left}%` }} />
            ))}
            <GlobeVisual />
            <AnimatePresence mode="wait">
              <motion.p key={statusText} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                style={{ color:"rgba(255,255,255,0.8)", fontSize:16, fontWeight:500, marginTop:32, letterSpacing:0.5 }}>
                {statusText}
              </motion.p>
            </AnimatePresence>
            <div style={{ display:"flex", gap:6, marginTop:16 }}>
              {[0,1,2].map(i => (
                <motion.div key={i} animate={{ scale:[1,1.4,1], opacity:[0.4,1,0.4] }}
                  transition={{ duration:0.9, repeat:Infinity, delay:i*0.2 }}
                  style={{ width:6, height:6, borderRadius:"50%", background:"#7c3aed" }} />
              ))}
            </div>
          </motion.div>
        )}

        {/* BURST */}
        {phase === "reveal" && (
          <motion.div key="reveal"
            initial={{ scale:0, opacity:1 }} animate={{ scale:30, opacity:0 }}
            transition={{ duration:0.75, ease:[0.16,1,0.3,1] }}
            style={{ position:"absolute", width:220, height:220, borderRadius:"50%", background:"radial-gradient(circle, #4338ca, #1d4ed8)", top:"50%", left:"50%", marginLeft:-110, marginTop:-110 }} />
        )}

        {/* MAP */}
        {phase === "map" && (
          <motion.div key="map" initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.5 }}
            style={{ position:"absolute", inset:0 }}>
            <MapContainer center={cityCoords || [20.5937,78.9629]} zoom={cityCoords ? 4 : 5}
              style={{ height:"100%", width:"100%" }} zoomControl={false}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="© CartoDB" />
              {cityCoords && <FlyTo coords={cityCoords} />}
              {cityCoords && (
                <Marker position={cityCoords} icon={youIcon} />
              )}
              {pinsReady && matchPositions
                .filter(({ match }) => match.city?.toLowerCase() === myMemory?.city?.toLowerCase())
                .map(({ match, offset }, i) => {
                  const pos = [
                    (cityCoords?.[0] || 20.59) + offset[0],
                    (cityCoords?.[1] || 78.96) + offset[1],
                  ];
                  const isSelected = selectedMatch?.id === match.id;
                  return (
                    <Marker
                      key={match.id}
                      position={pos}
                      icon={makeMatchIcon(i, isSelected)}
                      eventHandlers={{ click: () => handlePinClick(match) }}
                    />
                  );
                })}
            </MapContainer>

            {/* Top bar */}
            <div style={{ position:"absolute", top:0, left:0, right:0, zIndex:1000, padding:"16px 20px",
              background:"linear-gradient(to bottom, rgba(6,6,18,0.92) 0%, transparent 100%)", pointerEvents:"none" }}>
              <motion.div initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }}
                style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:38, height:38, borderRadius:12, background:"rgba(124,58,237,0.25)", border:"1px solid rgba(124,58,237,0.4)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <MapPin size={18} color="#a78bfa" />
                </div>
                <div>
                  <div style={{ color:"white", fontWeight:700, fontSize:15 }}>{myMemory?.city}</div>
                  <div style={{ color:"rgba(255,255,255,0.45)", fontSize:12 }}>{myMemory?.year}{myMemory?.year_end ? ` – ${myMemory.year_end}` : ""}</div>
                </div>
              </motion.div>
            </div>

            {/* Badge */}
            <motion.div initial={{ opacity:0, scale:0.5 }} animate={{ opacity:1, scale:1 }}
              transition={{ delay: pinsReady ? 0.2 : 3.2, type:"spring" }}
              style={{ position:"absolute", bottom:110, left:"50%", transform:"translateX(-50%)", zIndex:1000,
                background: matches.length > 0 ? "linear-gradient(135deg,#7c3aed,#4338ca)" : "rgba(20,20,40,0.95)",
                border:"1px solid rgba(124,58,237,0.35)", borderRadius:24, padding:"10px 22px",
                display:"flex", alignItems:"center", gap:8, backdropFilter:"blur(16px)",
                boxShadow:"0 8px 32px rgba(124,58,237,0.3)", whiteSpace:"nowrap" }}>
              {matches.length > 0 ? (
                <><Users size={15} color="white" />
                  <span style={{ color:"white", fontWeight:700, fontSize:13 }}>{matches.length} {matches.length===1?"person":"people"} found! Tap a pin</span>
                  <Sparkles size={13} color="#fbbf24" />
                </>
              ) : (
                <><Sparkles size={15} color="#a78bfa" />
                  <span style={{ color:"rgba(255,255,255,0.75)", fontWeight:600, fontSize:12 }}>Be the first in {myMemory?.city}!</span>
                </>
              )}
            </motion.div>

            {/* Continue */}
            <motion.button
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.9 }}
              whileTap={{ scale:0.95 }}
              onClick={onContinue}
              style={{ position:"absolute", bottom:44, left:"50%", transform:"translateX(-50%)", zIndex:1000,
                background:"white", color:"#1e1144", fontWeight:700, fontSize:15, border:"none",
                borderRadius:16, padding:"14px 36px", cursor:"pointer",
                boxShadow:"0 4px 28px rgba(0,0,0,0.45)" }}>
              {matches.length > 0 ? `View ${matches.length} Matches →` : "Explore →"}
            </motion.button>

            {/* Tap hint */}
            {pinsReady && matches.length > 0 && !selectedMatch && (
              <motion.div initial={{ opacity:0 }} animate={{ opacity:[0,1,1,0] }} transition={{ duration:3, delay:1.5 }}
                style={{ position:"absolute", top:"45%", left:"50%", transform:"translateX(-50%)", zIndex:1000,
                  background:"rgba(0,0,0,0.7)", borderRadius:12, padding:"8px 16px",
                  color:"rgba(255,255,255,0.8)", fontSize:13, pointerEvents:"none", whiteSpace:"nowrap" }}>
                👆 Tap a pin to connect
              </motion.div>
            )}

            {/* Match bottom sheet */}
            <AnimatePresence>
              {selectedMatch && (
                <MatchSheet
                  key={selectedMatch.id}
                  match={selectedMatch}
                  myMemory={myMemory}
                  user={user}
                  onClose={() => setSelectedMatch(null)}
                  onRequestSent={() => setSentTo(prev => new Set([...prev, selectedMatch.id]))}
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
