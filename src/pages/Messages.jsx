import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Loader2, Shield, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function Messages() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const matchId = urlParams.get("matchId");

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  // If no matchId, show all accepted matches as conversations
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
      const all = await base44.entities.MatchRequest.filter({ status: "accepted" });
      return all.find((m) => m.id === matchId);
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

  // Conversation list view
  if (!matchId) {
    return (
      <div className="min-h-screen bg-[#FAF9F6]">
        <div className="max-w-lg mx-auto px-5 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Messages</h1>
            <p className="text-gray-500 text-sm">Chat with your connections</p>
          </div>

          {loadingMatches ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
          ) : acceptedMatches.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No conversations yet</h3>
              <p className="text-gray-500 text-sm">When you connect with someone, you can chat here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {acceptedMatches.map((match) => {
                const other = match.from_user === user?.email ? match.to_user : match.from_user;
                return (
                  <Link
                    key={match.id}
                    to={createPageUrl(`Messages?matchId=${match.id}`)}
                    className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-sm transition-all"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                      {other?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{other?.split("@")[0]}</p>
                      <p className="text-sm text-gray-500 truncate">{match.match_summary || "Tap to chat"}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  const otherUser = matchRequest
    ? matchRequest.from_user === user?.email
      ? matchRequest.to_user
      : matchRequest.from_user
    : "";

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col">
      {/* Chat Header */}
      <div className="glass border-b border-gray-100 px-4 py-3 sticky top-0 z-40">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link
            to={createPageUrl("Messages")}
            className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
            {otherUser?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">{otherUser?.split("@")[0]}</p>
            <p className="text-xs text-gray-500">{matchRequest?.match_summary}</p>
          </div>
        </div>
      </div>

      {/* Privacy banner */}
      <div className="max-w-lg mx-auto w-full px-5 mt-3">
        <div className="bg-violet-50 border border-violet-100 rounded-2xl p-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-violet-500 flex-shrink-0" />
          <p className="text-xs text-violet-700">Messages are private. Be kind and respectful.</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 max-w-lg mx-auto w-full">
        {loadingMsgs ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
          </div>
        ) : sortedMessages.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-400 text-sm">Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedMessages.map((msg, i) => {
              const isMine = msg.sender === user?.email;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      isMine
                        ? "bg-[#1e1144] text-white rounded-br-md"
                        : "bg-white border border-gray-100 text-gray-900 rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${isMine ? "text-white/50" : "text-gray-400"}`}>
                      {msg.created_date ? format(new Date(msg.created_date), "h:mm a") : ""}
                    </p>
                  </div>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="glass border-t border-gray-100 p-4 sticky bottom-0">
        <form onSubmit={handleSend} className="max-w-lg mx-auto flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 h-12 rounded-2xl border-gray-200 bg-white focus:ring-violet-500"
          />
          <Button
            type="submit"
            disabled={!message.trim() || sendMutation.isPending}
            className="h-12 w-12 rounded-2xl bg-[#1e1144] hover:bg-[#2d1a6b] p-0"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}