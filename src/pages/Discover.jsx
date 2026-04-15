import React, { useState, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2, Sparkles, MapPin, Calendar, Send, Clock,
  Plus, List, Map as MapIcon, Lock, ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import PaywallModal from "../components/membership/PaywallModal";
import { useMembership } from "../hooks/useMembership";

const MapView = lazy(() => import("../components/discover/MapView"));

const SCORE_COLOR = (s) =>
  s >= 70 ? { bg: "#dcfce7", text: "#15803d" } :
  s >= 50 ? { bg: "#fef9c3", text: "#92400e" } :
            { bg: "#ede9fe", text: "#5b21b6" };

export default function Discover() {
  const [sendingTo, setSendingTo] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [showPaywall, setShowPaywall] = useState(false);
  const queryClient = useQueryClient();

  const { isMember, isLoading: memberLoading, user } = useMembership();

  const { data: myMemories = [], isLoading: loadingMine } = useQuery({
    queryKey: ["my-memories", user?.email],
    queryFn: () => base44.entities.TimeMemory.filter({ created_by: user.email }),
    enabled: !!user,
  });

  const { data: allMemories = [], isLoading: loadingAll } = useQuery({
    queryKey: ["all-memories"],
    queryFn: () => base44.entities.TimeMemory.filter({ open_to_connect: true }),
    enabled: !!user,
  });

  const { data: sentRequests = [] } = useQuery({
    queryKey: ["sent-requests", user?.email],
    queryFn: () => base44.entities.MatchRequest.filter({ from_user: user.email }),
    enabled: !!user,
  });

  const sendRequestMutation = useMutation({
    mutationFn: async ({ match, myMemory }) => {
      const summary = `You were both in ${myMemory.city}${myMemory.area ? `, ${myMemory.area}` : ""} around ${myMemory.year}`;
      await base44.entities.MatchRequest.create({
        from_user: user.email,
        to_user: match.created_by,
        from_memory_id: myMemory.id,
        to_memory_id: match.id,
        status: "pending",
        match_summary: summary,
        match_score: calculateScore(myMemory, match),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sent-requests"] });
      setSendingTo(null);
    },
    onError: () => setSendingTo(null),
  });

  const calculateScore = (a, b) => {
    let score = 0;
    if (a.city?.toLowerCase() === b.city?.toLowerCase()) score += 30;
    if (a.area?.toLowerCase() === b.area?.toLowerCase() && a.area) score += 20;
    if (Math.abs(a.year - b.year) <= 2) score += 20;
    if (a.institution_name?.toLowerCase() === b.institution_name?.toLowerCase() && a.institution_name) score += 25;
    const sharedCtx = a.contexts?.filter((c) => b.contexts?.includes(c));
    if (sharedCtx?.length > 0) score += 5;
    return Math.min(score, 100);
  };

  const getMatches = () => {
    if (!user || !myMemories.length) return [];
    const sentTo = new Set(sentRequests.map((r) => r.to_user));
    const bestByUser = new globalThis.Map();
    allMemories.forEach((mem) => {
      if (mem.created_by === user.email) return;
      if (sentTo.has(mem.created_by)) return;
      myMemories.forEach((mine) => {
        const score = calculateScore(mine, mem);
        if (score >= 30) {
          const existing = bestByUser.get(mem.created_by);
          if (!existing || score > existing.score) {
            bestByUser.set(mem.created_by, { ...mem, score, myMemory: mine });
          }
        }
      });
    });
    return Array.from(bestByUser.values()).sort((a, b) => b.score - a.score);
  };

  const matches = getMatches();
  const isLoading = loadingMine || loadingAll || memberLoading;

  const handleSendRequest = (match) => {
    if (!isMember) { setShowPaywall(true); return; }
    setSendingTo(match.id);
    sendRequestMutation.mutate({ match, myMemory: match.myMemory });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <div className="max-w-lg mx-auto px-4 pt-5 pb-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">Discover</h1>
            <p className="text-sm text-gray-400 mt-0.5">People who shared your moments</p>
          </div>
          {matches.length > 0 && (
            <div className="flex gap-1 bg-white rounded-2xl p-1 border border-gray-100 shadow-sm">
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-xl transition-all ${viewMode === "list" ? "bg-violet-100 text-violet-700" : "text-gray-400"}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`p-2 rounded-xl transition-all ${viewMode === "map" ? "bg-violet-100 text-violet-700" : "text-gray-400"}`}
              >
                <MapIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* ── Upgrade banner ── */}
        {!isMember && matches.length > 0 && (
          <motion.button
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setShowPaywall(true)}
            className="w-full mb-5 rounded-2xl overflow-hidden text-left"
            style={{ background: "linear-gradient(135deg, #1e1144 0%, #4338ca 100%)" }}
          >
            <div className="flex items-center gap-4 p-4">
              <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">
                  {matches.length} {matches.length === 1 ? "match" : "matches"} waiting for you
                </p>
                <p className="text-white/60 text-xs mt-0.5">Upgrade to connect with them</p>
              </div>
              <div className="flex items-center gap-1 bg-amber-400 text-[#1e1144] text-xs font-bold px-3 py-1.5 rounded-xl flex-shrink-0">
                Unlock <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </motion.button>
        )}

        {/* ── Empty: no memories ── */}
        {myMemories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center mx-auto mb-5">
              <Clock className="w-10 h-10 text-violet-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No memories yet</h3>
            <p className="text-gray-400 text-sm mb-6 max-w-xs">Add your first time memory to start discovering people from your past</p>
            <Link to={createPageUrl("TimeMachine")}>
              <button className="flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm text-white shadow-lg"
                style={{ background: "linear-gradient(135deg, #1e1144, #4338ca)" }}>
                <Plus className="w-4 h-4" /> Add a Memory
              </button>
            </Link>
          </div>

        /* ── Empty: no matches ── */
        ) : matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mx-auto mb-5">
              <Sparkles className="w-10 h-10 text-amber-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No matches yet</h3>
            <p className="text-gray-400 text-sm mb-6 max-w-xs">As more people join, you'll find connections from your past</p>
            <Link to={createPageUrl("TimeMachine")}>
              <button className="flex items-center gap-2 px-6 py-3 rounded-2xl border-2 border-gray-200 font-semibold text-sm text-gray-600 hover:border-violet-300 hover:bg-violet-50 transition-all">
                <Plus className="w-4 h-4" /> Add Another Memory
              </button>
            </Link>
          </div>

        /* ── Map view ── */
        ) : viewMode === "map" ? (
          <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-violet-500" /></div>}>
            <MapView matches={matches} onSendRequest={handleSendRequest} sendingTo={sendingTo} locked={!isMember} />
          </Suspense>

        /* ── List view ── */
        ) : (
          <div className="space-y-3">
            {matches.map((match, i) => {
              const scoreStyle = SCORE_COLOR(match.score);
              return (
                <motion.div
                  key={`${match.id}-${i}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
                >
                  {/* Card top strip */}
                  <div className="px-5 pt-5 pb-4">
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      {isMember ? (
                        <div className="w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center text-white text-xl font-bold shadow-sm"
                          style={{ background: "linear-gradient(135deg, #5b21b6, #4338ca)" }}>
                          {(match.nickname || match.created_by)?.[0]?.toUpperCase() || "?"}
                        </div>
                      ) : (
                        <div className="relative w-14 h-14 flex-shrink-0">
                          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold"
                            style={{ background: "linear-gradient(135deg, #5b21b6, #4338ca)", filter: "blur(6px)" }}>?</div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                              <Lock className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h3 className="font-bold text-gray-900 text-base leading-tight truncate">
                            {match.nickname || "Someone from your past"}
                          </h3>
                          <span className="flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-xl"
                            style={{ background: scoreStyle.bg, color: scoreStyle.text }}>
                            {match.score}% match
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            {match.year}{match.year_end && match.year_end !== match.year ? `–${match.year_end}` : ""}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            {match.city}{match.area ? `, ${match.area}` : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Institution */}
                    {match.institution_name && (
                      <div className="mt-3 bg-violet-50 rounded-xl px-3 py-2">
                        <p className="text-xs text-violet-700 font-medium">
                          {isMember ? match.institution_name : (
                            <span className="blur-sm select-none">{match.institution_name}</span>
                          )}
                        </p>
                      </div>
                    )}

                    {/* Tags */}
                    {match.contexts?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {match.contexts.slice(0, 4).map((c) => (
                          <span key={c} className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg capitalize font-medium">
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  <div className="px-5 pb-5">
                    {isMember ? (
                      <button
                        onClick={() => handleSendRequest(match)}
                        disabled={sendingTo === match.id}
                        className="w-full h-12 rounded-2xl flex items-center justify-center gap-2 text-white text-sm font-semibold transition-opacity disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, #1e1144, #4338ca)" }}
                      >
                        {sendingTo === match.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <><Send className="w-4 h-4" /> Send Connection Request</>}
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowPaywall(true)}
                        className="w-full h-12 rounded-2xl border-2 border-dashed border-violet-200 flex items-center justify-center gap-2 text-violet-500 text-sm font-semibold hover:bg-violet-50 transition-all"
                      >
                        <Lock className="w-4 h-4" /> Upgrade to Connect
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {showPaywall && (
        <PaywallModal onClose={() => setShowPaywall(false)} onSubscribe={async () => setShowPaywall(false)} />
      )}
    </div>
  );
}
