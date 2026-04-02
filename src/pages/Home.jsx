import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { base44 } from "@/api/base44Client";
import { Clock, ArrowRight, Sparkles, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function Home() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setChecking(false);
    }).catch(() => setChecking(false));
  }, []);

  const features = [
    { icon: Clock, title: "Travel Back in Time", desc: "Enter a year and place from your past" },
    { icon: Users, title: "Find Lost Connections", desc: "Discover people who shared your moments" },
    { icon: Shield, title: "Privacy First", desc: "You control what you share, always" },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Hero */}
      <div className="gradient-deep min-h-screen flex flex-col">
        {/* Floating orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 -left-20 w-60 h-60 bg-violet-500/20 rounded-full blur-3xl" />
          <div className="absolute top-40 right-0 w-80 h-80 bg-indigo-400/15 rounded-full blur-3xl" />
          <div className="absolute bottom-40 left-10 w-40 h-40 bg-amber-400/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center px-6 max-w-lg mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 mb-8">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-white/80 text-sm font-medium">Reconnect with your past</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight leading-tight">
              Time<br />Machine
            </h1>
            <p className="text-lg text-white/60 max-w-sm mx-auto leading-relaxed">
              Travel back to the places and moments that shaped you. Find the people who were there too.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="space-y-4 mb-12"
          >
            {!checking && (
              user ? (
                <Link to={createPageUrl("TimeMachine")}>
                  <Button className="w-full h-14 bg-white text-[#1e1144] hover:bg-white/90 rounded-2xl text-base font-semibold shadow-xl shadow-black/20 gap-2">
                    Start Time Traveling
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              ) : (
                <Button
                  onClick={() => base44.auth.redirectToLogin()}
                  className="w-full h-14 bg-white text-[#1e1144] hover:bg-white/90 rounded-2xl text-base font-semibold shadow-xl shadow-black/20 gap-2"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </Button>
              )
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="space-y-4"
          >
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-4 bg-white/5 backdrop-blur-sm border border-white/5 rounded-2xl p-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">{f.title}</h3>
                  <p className="text-white/50 text-xs">{f.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        <div className="relative z-10 text-center pb-8 text-white/30 text-xs">
          Your memories, your connections, your rules.
        </div>
      </div>
    </div>
  );
}