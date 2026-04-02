import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, MapPin, Calendar, Send, Clock, Plus, List, Map } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MapView from "../components/discover/MapView";

export default function Discover() {
  const [user, setUser] = useState(null);
  const [sendingTo, setSendingTo] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

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
    if (!myMemories.length) return [];
    const sentTo = new Set(sentRequests.map((r) => r.to_user));
    const matches = [];

    allMemories.forEach((mem) => {
      if (mem.created_by === user.email) return;
      if (sentTo.has(mem.created_by)) return;

      myMemories.forEach((mine) => {
        const score = calculateScore(mine, mem);
        if (score >= 30) {
          matches.push({ ...mem, score, myMemory: mine });
        }
      });
    });

    return matches.sort((a, b) => b.score - a.score);
  };

  const matches = getMatches();
  const isLoading = loadingMine || loadingAll;

  const handleSendFromMap = (match) => {
    setSendingTo(match.id);
    sendRequestMutation.mutate({ match, myMemory: match.myMemory });
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <div className="max-w-lg mx-auto px-5 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Discover</h1>
              <p className="text-gray-500 text-sm">People who shared your moments</p>
            </div>
            {matches.length > 0 && (
              <div className="flex gap-1 bg-white rounded-2xl p-1 border border-gray-200">
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-xl transition-all ${
                    viewMode === "list"
                      ? "bg-violet-100 text-violet-700"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("map")}
                  className={`p-2 rounded-xl transition-all ${
                    viewMode === "map"
                      ? "bg-violet-100 text-violet-700"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <Map className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          </div>
        ) : myMemories.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-violet-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No memories yet</h3>
            <p className="text-gray-500 mb-6 text-sm">Add your first time memory to start discovering matches</p>
            <Link to={createPageUrl("TimeMachine")}>
              <Button className="bg-[#1e1144] hover:bg-[#2d1a6b] rounded-2xl h-12 px-6 gap-2">
                <Plus className="w-4 h-4" />
                Add a Memory
              </Button>
            </Link>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-amber-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No matches yet</h3>
            <p className="text-gray-500 mb-6 text-sm max-w-xs mx-auto">
              As more people join, you'll discover connections from your past.
            </p>
            <Link to={createPageUrl("TimeMachine")}>
              <Button variant="outline" className="rounded-2xl h-12 px-6 gap-2">
                <Plus className="w-4 h-4" />
                Add Another Memory
              </Button>
            </Link>
          </div>
        ) : viewMode === "map" ? (
          <MapView
            matches={matches}
            onSendRequest={handleSendFromMap}
            sendingTo={sendingTo}
          />
        ) : (
          <div className="space-y-4">
            {matches.map((match, i) => (
              <motion.div
                key={`${match.id}-${i}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{match.nickname || "Someone"}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {match.month ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][match.month - 1] + " " : ""}
                          {match.year}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{match.city}{match.area ? `, ${match.area}` : ""}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold px-3 py-1.5 rounded-xl">
                    {match.score}%
                  </div>
                </div>

                {match.institution_name && (
                  <div className="bg-violet-50 rounded-xl p-3 mb-4">
                    <p className="text-violet-800 text-sm">
                      <span className="font-semibold">Connection:</span> {match.institution_name}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {match.contexts?.map((c) => (
                    <Badge key={c} variant="secondary" className="text-xs capitalize rounded-lg">
                      {c}
                    </Badge>
                  ))}
                </div>

                <Button
                  onClick={() => {
                    setSendingTo(match.id);
                    sendRequestMutation.mutate({ match, myMemory: match.myMemory });
                  }}
                  disabled={sendingTo === match.id}
                  className="w-full h-12 rounded-2xl bg-[#1e1144] hover:bg-[#2d1a6b] gap-2 font-semibold"
                >
                  {sendingTo === match.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Connection Request
                    </>
                  )}
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}