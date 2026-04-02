import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import { Clock, Search, MessageCircle, User, Sparkles } from "lucide-react";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const hideNav = ["Home"].includes(currentPageName);

  const navItems = [
    { name: "TimeMachine", icon: Clock, label: "Travel" },
    { name: "Discover", icon: Search, label: "Discover" },
    { name: "Matches", icon: Sparkles, label: "Matches" },
    { name: "Messages", icon: MessageCircle, label: "Chat" },
    { name: "Profile", icon: User, label: "Profile" },
  ];

  const isActive = (pageName) => {
    const pageUrl = createPageUrl(pageName);
    return location.pathname === pageUrl;
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col">
      <style>{`
        :root {
          --color-deep: #1e1144;
          --color-violet: #5b21b6;
          --color-indigo: #4338ca;
          --color-amber: #f59e0b;
          --color-warm: #fef3c7;
          --color-cream: #FAF9F6;
        }
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #FAF9F6;
        }
        .gradient-deep {
          background: linear-gradient(135deg, #1e1144 0%, #312e81 50%, #4338ca 100%);
        }
        .gradient-warm {
          background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
        }
        .glass {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .text-gradient {
          background: linear-gradient(135deg, #5b21b6, #4338ca);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      <div className="flex-1 pb-20">
        {children}
      </div>

      {!hideNav && user && (
        <nav className="fixed bottom-0 left-0 right-0 glass border-t border-white/20 z-50">
          <div className="max-w-lg mx-auto flex justify-around items-center py-2 px-4">
            {navItems.map((item) => {
              const active = isActive(item.name);
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.name)}
                  className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all duration-300 ${
                    active
                      ? "text-violet-700"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <div className={`p-1.5 rounded-xl transition-all duration-300 ${
                    active ? "bg-violet-100" : ""
                  }`}>
                    <item.icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.5} />
                  </div>
                  <span className={`text-[10px] font-medium ${active ? "font-semibold" : ""}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}