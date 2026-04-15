import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Sparkles, MessageCircle, Eye, Image, UserCheck, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  { icon: UserCheck, text: "Send & accept connection requests" },
  { icon: MessageCircle, text: "Chat with people from your past" },
  { icon: Eye,         text: "View full profiles — bio & about" },
  { icon: Image,       text: "Browse their photo gallery" },
  { icon: Sparkles,    text: "Unlock all future features" },
];

const PLANS = [
  {
    key: "monthly",
    label: "Monthly",
    price: "9.99",
    period: "/ month",
    badge: null,
    total: null,
  },
  {
    key: "yearly",
    label: "Yearly",
    price: "4.99",
    period: "/ month",
    badge: "Save 50%",
    total: "billed as 59.99 / year",
  },
];

export default function PaywallModal({ onClose, onSubscribe }) {
  const [selected, setSelected] = useState("yearly");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      await onSubscribe?.(selected);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Sheet */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="relative w-full sm:max-w-md bg-[#0f0825] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="px-6 pt-8 pb-5 text-center relative">
            {/* Glow orbs */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-violet-600/30 rounded-full blur-3xl pointer-events-none" />

            <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 mb-4 shadow-lg shadow-amber-500/30">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Unlock Time Machine
            </h2>
            <p className="text-white/60 text-sm leading-relaxed max-w-xs mx-auto">
              Connect with people from your past. See who they've become. Start a conversation.
            </p>
          </div>

          {/* Features */}
          <div className="px-6 mb-5 space-y-2.5">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <span className="text-white/80 text-sm">{text}</span>
                <Check className="w-4 h-4 text-emerald-400 ml-auto flex-shrink-0" />
              </div>
            ))}
          </div>

          {/* Plan selector */}
          <div className="px-6 mb-5 grid grid-cols-2 gap-3">
            {PLANS.map((plan) => (
              <button
                key={plan.key}
                onClick={() => setSelected(plan.key)}
                className={`relative rounded-2xl border-2 p-4 text-left transition-all ${
                  selected === plan.key
                    ? "border-violet-500 bg-violet-500/15"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-2.5 left-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {plan.badge}
                  </span>
                )}
                <p className="text-white font-semibold text-sm mb-0.5">{plan.label}</p>
                <p className="text-2xl font-bold text-white leading-tight">
                  ${plan.price}
                  <span className="text-xs font-normal text-white/50 ml-1">{plan.period}</span>
                </p>
                {plan.total && (
                  <p className="text-[10px] text-white/40 mt-1">{plan.total}</p>
                )}
                {!plan.total && (
                  <p className="text-[10px] text-white/40 mt-1">cancel anytime</p>
                )}
              </button>
            ))}
          </div>

          {/* CTA */}
          <div className="px-6 pb-8 space-y-3">
            <Button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-base shadow-lg shadow-violet-500/30 gap-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing…
                </span>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Start {selected === "yearly" ? "Yearly" : "Monthly"} Membership
                </>
              )}
            </Button>
            <button
              onClick={onClose}
              className="w-full text-center text-white/30 text-xs py-1 hover:text-white/50 transition-colors"
            >
              Maybe later
            </button>
          </div>

          {/* Legal */}
          <div className="px-6 pb-6 text-center">
            <p className="text-white/20 text-[10px] leading-relaxed">
              Subscription auto-renews. Cancel anytime in App Store settings.
              By subscribing you agree to our Terms & Privacy Policy.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
