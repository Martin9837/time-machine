import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Check, X, Loader2, Sparkles, Send, MessageCircle, Inbox } from "lucide-react";
import { motion } from "framer-motion";

export default function Matches() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

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

  const RequestCard = ({ request, type }) => {
    const otherUser = type === "incoming" ? request.from_user : request.to_user;
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {otherUser?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{otherUser?.split("@")[0]}</p>
              {request.match_score && (
                <span className="text-xs text-violet-600 font-medium">{request.match_score}% match</span>
              )}
            </div>
          </div>
          {request.status !== "pending" && (
            <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${
              request.status === "accepted" ? "bg-green-100 text-green-700" :
              request.status === "declined" ? "bg-red-100 text-red-700" :
              "bg-gray-100 text-gray-600"
            }`}>
              {request.status}
            </span>
          )}
        </div>

        {request.match_summary && (
          <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 mb-4">{request.match_summary}</p>
        )}

        {type === "incoming" && request.status === "pending" && (
          <div className="flex gap-2">
            <Button
              onClick={() => respondMutation.mutate({ id: request.id, status: "accepted" })}
              className="flex-1 h-11 rounded-xl bg-violet-600 hover:bg-violet-700 gap-2"
            >
              <Check className="w-4 h-4" /> Accept
            </Button>
            <Button
              variant="outline"
              onClick={() => respondMutation.mutate({ id: request.id, status: "declined" })}
              className="flex-1 h-11 rounded-xl gap-2"
            >
              <X className="w-4 h-4" /> Decline
            </Button>
          </div>
        )}

        {request.status === "accepted" && (
          <Link to={createPageUrl(`Messages?matchId=${request.id}`)}>
            <Button className="w-full h-11 rounded-xl bg-[#1e1144] hover:bg-[#2d1a6b] gap-2">
              <MessageCircle className="w-4 h-4" /> Open Chat
            </Button>
          </Link>
        )}
      </motion.div>
    );
  };

  const EmptyState = ({ icon: Icon, title, subtitle }) => (
    <div className="text-center py-12">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>
      <p className="text-gray-500 text-sm">{subtitle}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <div className="max-w-lg mx-auto px-5 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Matches</h1>
          <p className="text-gray-500 text-sm">Your past connections, rediscovered</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          </div>
        ) : (
          <Tabs defaultValue="incoming" className="w-full">
            <TabsList className="w-full bg-gray-100 rounded-2xl p-1 h-12 mb-6">
              <TabsTrigger value="incoming" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium">
                Incoming {incoming.length > 0 && `(${incoming.length})`}
              </TabsTrigger>
              <TabsTrigger value="sent" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium">
                Sent
              </TabsTrigger>
              <TabsTrigger value="connected" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium">
                Connected
              </TabsTrigger>
            </TabsList>

            <TabsContent value="incoming" className="space-y-3">
              {incoming.length === 0 ? (
                <EmptyState icon={Inbox} title="No requests yet" subtitle="When someone wants to connect, you'll see it here" />
              ) : (
                incoming.map((r) => <RequestCard key={r.id} request={r} type="incoming" />)
              )}
            </TabsContent>

            <TabsContent value="sent" className="space-y-3">
              {outgoing.length === 0 ? (
                <EmptyState icon={Send} title="No requests sent" subtitle="Discover matches and send connection requests" />
              ) : (
                outgoing.map((r) => <RequestCard key={r.id} request={r} type="outgoing" />)
              )}
            </TabsContent>

            <TabsContent value="connected" className="space-y-3">
              {accepted.length === 0 ? (
                <EmptyState icon={Sparkles} title="No connections yet" subtitle="Mutual matches will appear here" />
              ) : (
                accepted.map((r) => <RequestCard key={r.id} request={r} type="connected" />)
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}