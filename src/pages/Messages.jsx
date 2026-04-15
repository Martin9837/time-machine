import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send, Loader2, Shield, MessageCircle, Lock, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import PaywallModal from "../components/membership/PaywallModal";
import { useMembership } from "../hooks/useMembership";

export default function Messages() {
  const [message, setMessage] = useState("");
  const [showPaywall, setShowPaywall] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const queryClient = useQueryClient();
  const { isMember, isLoading: memberLoading, user } = useMembership();

  const urlParams = new URLSearchParams(window.location.search);
  const matchId = urlParams.get("matchId");

  const { data: acceptedMatches = [], isLoading: loadingMatches } = useQuery({
    queryKey: ["chat-matches", user?.email],
    queryFn: async () => {
      const asFrom = await base44.entities.MatchRequest.filter({ from_user: user.email, status: "accepted" });
      const asTo = await base44.entities.MatchRequest.filter({ to_user: user.email, status: "accepted" });
      return [...asFrom, ...asTo];
    },
    enabled: !!user && !matchId,
  });

  const { data: matchRequest } = useQuery({
    queryKey: ["match", matchId],
    queryFn: async () => {
      const results = await base44.entities.MatchRequest.filter({ id: matchId, status: "accepted" });
      return results[0] || null;
    },
    enabled: !!matchId && !!user,
  });

  const { data: messages = [], isLoading: loadingMsgs } = useQuery({
    queryKey: ["messages", matchId],
    queryFn: () => base44.entities.ChatMessage.filter({ match_request_id: matchId }, "-created_date", 100),
    enabled: !!matchId,
    refetchInterval: 3000,
  });

  const sendMutation = useMutation({
    mutationFn: async (content) => {
      if (!matchRequest || !user) throw new Error("Not ready");
      const receiver = matchRequest.from_user === user.email ? matchRequest.to_user : matchRequest.from_user;
      await base44.entities.ChatMessage.create({
        match_request_id: matchId,
        sender: user.email,
        receiver,
        content,
      });
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["messages", matchId] });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMutation.mutate(message.trim());
  };

  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.created_date) - new Date(b.created_date)
  );

  // ── Paywall gate ──────────────────────────────────────────────────────────────
  if (!memberLoading && !isMember) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
          style={{ background: "linear-gradient(135deg, #ede9fe, #ddd6fe)" }}>
          <Lock className="w-10 h-10 text-violet-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Members Only</h2>
        <p className="text-gray-400 text-sm max-w-xs mb-8 leading-relaxed">
          Upgrade to Time Machine Premium to start chatting with people from your past.
        </p>
        <button
          onClick={() => setShowPaywall(true)}
          className="flex items-center gap-2 h-14 px-8 rounded-2xl text-white font-bold text-base shadow-lg"
          style={{ background: "linear-gradient(135deg, #7c3aed, #4338ca)", boxShadow: "0 8px 24px rgba(124,58,237,0.35)" }}
        >
          <Lock className="w-5 h-5" /> Unlock Messaging
        </button>
        {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} onSubscribe={async () => setShowPaywall(false)} />}
      </div>
    );
  }

  // ── Conversation list ─────────────────────────────────────────────────────────
  if (!matchId) {
    return (
      <div className="min-h-screen bg-[#FAF9F6]">
        <div className="max-w-lg mx-auto px-4 pt-5 pb-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            <p className="text-sm text-gray-400 mt-0.5">Chat with your connections</p>
          </div>

          {loadingMatches ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
          ) : acceptedMatches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
                style={{ background: "linear-gradient(135deg, #ede9fe, #ddd6fe)" }}>
                <MessageCircle className="w-10 h-10 text-violet-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No conversations yet</h3>
              <p className="text-gray-400 text-sm max-w-xs">
                When you and someone from your past both accept, you can chat here
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {acceptedMatches.map((match) => {
                const other = match.from_user === user?.email ? match.to_user : match.from_user;
                const initial = (other?.[0] || "?").toUpperCase();
                const name = other?.split("@")[0] || "Unknown";
                return (
                  <Link key={match.id} to={createPageUrl(`Messages?matchId=${match.id}`)}>
                    <motion.div
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-4 bg-white rounded-3xl p-4 border border-gray-100 shadow-sm"
                    >
                      <div className="w-13 h-13 rounded-2xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
                        style={{ width: 52, height: 52, background: "linear-gradient(135deg, #5b21b6, #4338ca)" }}>
                        {initial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm">{name}</p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {match.match_summary || "Tap to start chatting"}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Chat view ─────────────────────────────────────────────────────────────────
  const otherUser = matchRequest
    ? matchRequest.from_user === user?.email ? matchRequest.to_user : matchRequest.from_user
    : "";
  const otherInitial = (otherUser?.[0] || "?").toUpperCase();
  const otherName = otherUser?.split("@")[0] || "Chat";

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", background: "#FAF9F6" }}>

      {/* ── Chat header ── */}
      <div style={{
        background: "rgba(255,255,255,0.9)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        padding: "12px 16px",
        zIndex: 40,
      }}>
        <div style={{ maxWidth: 512, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <Link to={createPageUrl("Messages")}>
            <div style={{
              width: 40, height: 40, borderRadius: 14, background: "#f3f4f6",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ArrowLeft style={{ width: 20, height: 20, color: "#4b5563" }} />
            </div>
          </Link>
          <div style={{
            width: 40, height: 40, borderRadius: 14,
            background: "linear-gradient(135deg, #5b21b6, #4338ca)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontWeight: 700, fontSize: 16,
          }}>
            {otherInitial}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, color: "#111827", fontSize: 15 }}>{otherName}</p>
            {matchRequest?.match_summary && (
              <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{matchRequest.match_summary}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Privacy banner ── */}
      <div style={{ maxWidth: 512, margin: "0 auto", width: "100%", padding: "12px 16px 0" }}>
        <div style={{
          background: "#f5f3ff", border: "1px solid #ede9fe",
          borderRadius: 16, padding: "10px 14px",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <Shield style={{ width: 14, height: 14, color: "#7c3aed", flexShrink: 0 }} />
          <p style={{ fontSize: 11, color: "#6d28d9", lineHeight: 1.4 }}>
            Messages are private. Be kind and respectful.
          </p>
        </div>
      </div>

      {/* ── Messages area ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", maxWidth: 512, margin: "0 auto", width: "100%" }}>
        {loadingMsgs ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
            <Loader2 style={{ width: 24, height: 24, color: "#8b5cf6" }} className="animate-spin" />
          </div>
        ) : sortedMessages.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af", fontSize: 13 }}>
            Say hello to {otherName}! 👋
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sortedMessages.map((msg, idx) => {
              const isMine = msg.sender === user?.email;
              const prevMsg = sortedMessages[idx - 1];
              const showTime = !prevMsg ||
                new Date(msg.created_date) - new Date(prevMsg.created_date) > 5 * 60 * 1000;

              return (
                <React.Fragment key={msg.id}>
                  {showTime && msg.created_date && (
                    <div style={{ textAlign: "center", padding: "4px 0" }}>
                      <span style={{ fontSize: 10, color: "#9ca3af", background: "#f3f4f6", padding: "3px 10px", borderRadius: 99 }}>
                        {format(new Date(msg.created_date), "MMM d · h:mm a")}
                      </span>
                    </div>
                  )}
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start" }}
                  >
                    <div style={{
                      maxWidth: "78%",
                      padding: "10px 14px",
                      borderRadius: isMine ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                      background: isMine ? "linear-gradient(135deg, #1e1144, #3730a3)" : "white",
                      color: isMine ? "white" : "#111827",
                      boxShadow: isMine ? "0 4px 12px rgba(30,17,68,0.25)" : "0 1px 4px rgba(0,0,0,0.08)",
                      border: isMine ? "none" : "1px solid #f3f4f6",
                    }}>
                      <p style={{ fontSize: 14, lineHeight: 1.5, margin: 0 }}>{msg.content}</p>
                    </div>
                  </motion.div>
                </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ── Input area ── */}
      <div style={{
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(0,0,0,0.06)",
        padding: "12px 16px",
        paddingBottom: "max(12px, env(safe-area-inset-bottom))",
      }}>
        <form onSubmit={handleSend} style={{
          maxWidth: 512, margin: "0 auto",
          display: "flex", gap: 10, alignItems: "center",
        }}>
          <input
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message…"
            style={{
              flex: 1, height: 48, borderRadius: 20,
              border: "1.5px solid #e5e7eb", background: "#f9fafb",
              padding: "0 16px", fontSize: 14, color: "#111827",
              outline: "none", transition: "border-color 0.2s",
            }}
            onFocus={(e) => e.target.style.borderColor = "#7c3aed"}
            onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
          />
          <button
            type="submit"
            disabled={!message.trim() || sendMutation.isPending || !matchRequest}
            style={{
              width: 48, height: 48, borderRadius: 16, border: "none",
              background: message.trim() ? "linear-gradient(135deg, #1e1144, #4338ca)" : "#e5e7eb",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: message.trim() ? "pointer" : "not-allowed",
              transition: "background 0.2s, transform 0.1s",
              flexShrink: 0,
            }}
          >
            {sendMutation.isPending
              ? <Loader2 style={{ width: 18, height: 18, color: "white" }} className="animate-spin" />
              : <Send style={{ width: 18, height: 18, color: message.trim() ? "white" : "#9ca3af" }} />}
          </button>
        </form>
      </div>
    </div>
  );
}
