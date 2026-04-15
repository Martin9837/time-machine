import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Check, X, Loader2, Sparkles, Send, MessageCircle,
  Inbox, List, Map as MapIcon, Lock, Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import ConnectionsMapView from "../components/matches/ConnectionsMapView";
import PaywallModal from "../components/membership/PaywallModal";
import { useMembership } from "../hooks/useMembership";

export default function Matches() {
  const [connectedView, setConnectedView] = useState("list");
  const [showPaywall, setShowPaywall] = useState(false);
  const queryClient = useQueryClient();
  const { isMember, user } = useMembership();

  const { data: incoming = [], isLoading: loadingIn } = useQuery({
    queryKey: ["incoming-requests", user?.email],
    queryFn: () => base44.entities.MatchRequest.filter({ to_user: user.email, status: "pending" }),
    enabled: !!user,
  });

  const { data: outgoing = [], isLoading: loadingOut } = useQuery({
    queryKey: ["outgoing-requests", user?.email],
    queryFn: () => base44.entities.MatchRequest.filter({ from_user: user.email }),
    enabled: !!user,
  });

  const { data: accepted = [], isLoading: loadingAccepted } = useQuery({
    queryKey: ["accepted-matches", user?.email],
    queryFn: async () => {
      const asFrom = await base44.entities.MatchRequest.filter({ from_user: user.email, status: "accepted" });
      const asTo = await base44.entities.MatchRequest.filter({ to_user: user.email, status: "accepted" });
      return [...asFrom, ...asTo];
    },
    enabled: !!user,
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.MatchRequest.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incoming-requests"] });
      queryClient.invalidateQueries({ queryKey: ["accepted-matches"] });
    },
  });

  const isLoading = loadingIn || loadingOut || loadingAccepted;

  const avatarLetter = (email) => (email || "?")[0].toUpperCase();
  const displayName = (email) => email?.split("@")[0] || "Unknown";

  const EmptyState = ({ icon: Icon, title, subtitle, iconBg = "bg-gray-100", iconColor = "text-gray-400" }) => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className={`w-18 h-18 rounded-3xl ${iconBg} flex items-center justify-center mx-auto mb-4`}
        style={{ width: 72, height: 72 }}>
        <Icon className={`w-9 h-9 ${iconColor}`} />
      </div>
      <h3 className="font-bold text-gray-800 text-base mb-1">{title}</h3>
      <p className="text-gray-400 text-sm max-w-xs">{subtitle}</p>
    </div>
  );

  const StatusBadge = ({ status }) => {
    const map = {
      accepted: { bg: "#dcfce7", color: "#15803d", label: "Connected" },
      declined: { bg: "#fee2e2", color: "#b91c1c", label: "Declined" },
      pending:  { bg: "#fef9c3", color: "#92400e", label: "Pending" },
    };
    const s = map[status] || map.pending;
    return (
      <span className="text-xs font-semibold px-2.5 py-1 rounded-xl" style={{ background: s.bg, color: s.color }}>
        {s.label}
      </span>
    );
  };

  const RequestCard = ({ request, type }) => {
    const otherUser = type === "incoming" ? request.from_user : request.to_user;
    const isPending = request.status === "pending";
    const isAccepted = request.status === "accepted";

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
      >
        <div className="p-5">
          {/* Top row: avatar + name + status */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #5b21b6, #4338ca)" }}>
              {avatarLetter(otherUser)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm truncate">{displayName(otherUser)}</p>
              {request.match_score && (
                <p className="text-xs text-violet-500 font-medium">{request.match_score}% match</p>
              )}
            </div>
            <StatusBadge status={request.status} />
          </div>

          {/* Match summary */}
          {request.match_summary && (
            <div className="bg-gray-50 rounded-2xl px-3 py-2.5 mb-4">
              <p className="text-xs text-gray-500 leading-relaxed">{request.match_summary}</p>
            </div>
          )}

          {/* Actions */}
          {type === "incoming" && isPending && (
            isMember ? (
              <div className="flex gap-2">
                <button
                  onClick={() => respondMutation.mutate({ id: request.id, status: "accepted" })}
                  disabled={respondMutation.isPending}
                  className="flex-1 h-11 rounded-2xl flex items-center justify-center gap-2 text-white text-sm font-semibold"
                  style={{ background: "linear-gradient(135deg, #5b21b6, #4338ca)" }}
                >
                  <Check className="w-4 h-4" /> Accept
                </button>
                <button
                  onClick={() => respondMutation.mutate({ id: request.id, status: "declined" })}
                  disabled={respondMutation.isPending}
                  className="flex-1 h-11 rounded-2xl border-2 border-gray-200 flex items-center justify-center gap-2 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-all"
                >
                  <X className="w-4 h-4" /> Decline
                </button>
              </div>
            ) : (
              <button onClick={() => setShowPaywall(true)}
                className="w-full h-11 rounded-2xl border-2 border-dashed border-violet-200 flex items-center justify-center gap-2 text-violet-500 text-sm font-semibold hover:bg-violet-50 transition-all">
                <Lock className="w-4 h-4" /> Upgrade to Accept
              </button>
            )
          )}

          {isAccepted && (
            isMember ? (
              <Link to={createPageUrl(`Messages?matchId=${request.id}`)}>
                <button className="w-full h-11 rounded-2xl flex items-center justify-center gap-2 text-white text-sm font-semibold"
                  style={{ background: "linear-gradient(135deg, #1e1144, #4338ca)" }}>
                  <MessageCircle className="w-4 h-4" /> Open Chat
                </button>
              </Link>
            ) : (
              <button onClick={() => setShowPaywall(true)}
                className="w-full h-11 rounded-2xl border-2 border-dashed border-violet-200 flex items-center justify-center gap-2 text-violet-500 text-sm font-semibold hover:bg-violet-50 transition-all">
                <Lock className="w-4 h-4" /> Upgrade to Chat
              </button>
            )
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <div className="max-w-lg mx-auto px-4 pt-5 pb-8">

        {/* Header */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Matches</h1>
          <p className="text-sm text-gray-400 mt-0.5">Your past connections, rediscovered</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          </div>
        ) : (
          <Tabs defaultValue="incoming" className="w-full">
            {/* Tab bar */}
            <TabsList className="w-full bg-white rounded-2xl p-1 h-13 mb-5 border border-gray-100 shadow-sm"
              style={{ height: 52 }}>
              <TabsTrigger value="incoming"
                className="flex-1 rounded-xl text-sm font-semibold data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                Incoming {incoming.length > 0 && (
                  <span className="ml-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {incoming.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="sent"
                className="flex-1 rounded-xl text-sm font-semibold data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                Sent
              </TabsTrigger>
              <TabsTrigger value="connected"
                className="flex-1 rounded-xl text-sm font-semibold data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                Connected {accepted.length > 0 && (
                  <span className="ml-1.5 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {accepted.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="incoming" className="space-y-3">
              {incoming.length === 0
                ? <EmptyState icon={Inbox} iconBg="bg-violet-50" iconColor="text-violet-400"
                    title="No requests yet" subtitle="When someone wants to connect with you, you'll see them here" />
                : incoming.map((r) => <RequestCard key={r.id} request={r} type="incoming" />)
              }
            </TabsContent>

            <TabsContent value="sent" className="space-y-3">
              {outgoing.length === 0
                ? <EmptyState icon={Send} iconBg="bg-blue-50" iconColor="text-blue-400"
                    title="No requests sent" subtitle="Discover matches and send connection requests to start connecting" />
                : outgoing.map((r) => <RequestCard key={r.id} request={r} type="outgoing" />)
              }
            </TabsContent>

            <TabsContent value="connected">
              {accepted.length === 0 ? (
                <EmptyState icon={Sparkles} iconBg="bg-amber-50" iconColor="text-amber-400"
                  title="No connections yet" subtitle="Accept incoming requests or wait for yours to be accepted" />
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-500 font-medium">{accepted.length} connection{accepted.length !== 1 ? "s" : ""}</p>
                    <div className="flex items-center bg-white border border-gray-100 rounded-xl p-1 gap-1 shadow-sm">
                      {[{ v: "list", Icon: List }, { v: "map", Icon: MapIcon }].map(({ v, Icon }) => (
                        <button key={v} onClick={() => setConnectedView(v)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            connectedView === v ? "bg-violet-600 text-white shadow" : "text-gray-500"
                          }`}>
                          <Icon className="w-3.5 h-3.5" />
                          {v === "list" ? "List" : "Map"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {connectedView === "map"
                    ? <ConnectionsMapView accepted={accepted} user={user} />
                    : <div className="space-y-3">{accepted.map((r) => <RequestCard key={r.id} request={r} type="connected" />)}</div>
                  }
                </>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} onSubscribe={async () => setShowPaywall(false)} />}
    </div>
  );
}
