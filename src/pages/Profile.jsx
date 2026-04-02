import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { LogOut, Plus, Calendar, MapPin, Building2, Clock, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import MemoryCard from "../components/discover/MemoryCard";

export default function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: memories = [], isLoading, refetch } = useQuery({
    queryKey: ["profile-memories", user?.email],
    queryFn: () => base44.entities.TimeMemory.filter({ created_by: user.email }, "-created_date"),
    enabled: !!user,
  });

  const handleDelete = async (id) => {
    await base44.entities.TimeMemory.delete(id);
    refetch();
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <div className="max-w-lg mx-auto px-5 py-6">
        {/* Profile Header */}
        <div className="gradient-deep rounded-3xl p-6 text-white mb-6 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">
                  {user?.full_name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{user?.full_name || "Loading..."}</h2>
                  <p className="text-white/60 text-sm">{user?.email}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-6 mt-4">
              <div>
                <p className="text-2xl font-bold">{memories.length}</p>
                <p className="text-white/50 text-xs">Memories</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {[...new Set(memories.map((m) => m.city))].length}
                </p>
                <p className="text-white/50 text-xs">Cities</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {memories.length > 0
                    ? `${Math.min(...memories.map((m) => m.year))}–${Math.max(...memories.map((m) => m.year))}`
                    : "—"}
                </p>
                <p className="text-white/50 text-xs">Time Span</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          <Link to={createPageUrl("TimeMachine")} className="flex-1">
            <Button className="w-full h-12 rounded-2xl bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 gap-2 font-semibold shadow-sm">
              <Plus className="w-4 h-4" />
              Add Memory
            </Button>
          </Link>
          <Button
            onClick={() => base44.auth.logout()}
            variant="ghost"
            className="h-12 rounded-2xl text-gray-400 hover:text-red-500 hover:bg-red-50 gap-2"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>

        {/* Memories Timeline */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Your Memories</h3>
          <p className="text-gray-500 text-sm">Your journey through time</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 rounded-3xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : memories.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">No memories yet. Start your time travel!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {memories.map((memory, i) => (
              <div key={memory.id} className="relative">
                <MemoryCard memory={memory} index={i} />
                <button
                  onClick={() => handleDelete(memory.id)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/20 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/30 transition-all z-10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}