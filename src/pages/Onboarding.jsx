import { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const EMOJIS = ['✨', '🌟', '💫', '🌠', '⭐', '🎇', '🎆'];

export default function Onboarding() {
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);
  const [emoji] = useState(EMOJIS[Math.floor(Math.random() * EMOJIS.length)]);
  const navigate = useNavigate();

  // Guard: if nickname already set, go straight to Discover
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate('/login'); return; }
      if (session.user?.user_metadata?.nickname) {
        navigate('/Discover');
      } else {
        setChecking(false);
      }
    });
  }, [navigate]);

  const handleContinue = async (e) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.updateUser({
        data: { nickname: nickname.trim() },
      });
      if (error) throw error;
      navigate('/Discover');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="fixed inset-0 flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #060612, #0d0624, #140838)' }}>
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 overflow-hidden flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #060612 0%, #0d0624 40%, #140838 70%, #0a0420 100%)' }}
    >
      {/* Background glow */}
      <motion.div
        animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 w-full max-w-sm mx-4 text-center">

        {/* Animated emoji */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          className="text-6xl mb-6"
        >
          {emoji}
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-white mb-2">What should we<br />call you?</h1>
          <p className="text-white/40 text-sm mb-10">
            This is how you'll appear to people you connect with
          </p>
        </motion.div>

        {/* Input card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.45, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 28,
            boxShadow: '0 8px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
            padding: '28px 24px',
          }}
        >
          <form onSubmit={handleContinue} className="space-y-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <input
                type="text"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                required
                autoFocus
                maxLength={30}
                className="w-full px-5 py-4 rounded-2xl bg-white/8 border border-white/15 text-white text-center text-lg font-semibold placeholder-white/25 focus:outline-none focus:border-violet-400/70 focus:bg-white/12 transition-all duration-300"
                placeholder="Your nickname..."
              />
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-red-400 text-xs bg-red-400/10 rounded-xl px-3 py-2 border border-red-400/20"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={loading || !nickname.trim()}
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="w-full py-4 rounded-2xl text-white font-bold text-base transition-all disabled:opacity-40"
              style={{
                background: nickname.trim()
                  ? 'linear-gradient(135deg, #7c3aed, #4338ca)'
                  : 'rgba(124,58,237,0.3)',
                boxShadow: nickname.trim() ? '0 4px 30px rgba(124,58,237,0.5)' : 'none',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Setting up...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Let's go
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    →
                  </motion.span>
                </span>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Step indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex items-center justify-center gap-1.5 mt-8"
        >
          {[0, 1, 2].map(i => (
            <div key={i} className="rounded-full transition-all"
              style={{
                width: i === 0 ? 20 : 6,
                height: 6,
                background: i === 0 ? '#7c3aed' : 'rgba(255,255,255,0.2)',
              }}
            />
          ))}
        </motion.div>
        <p className="text-white/20 text-xs mt-3">Step 1 of 1 — takes 5 seconds</p>
      </div>
    </div>
  );
}
