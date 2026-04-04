import { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const STARS = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2.5 + 0.5,
  delay: Math.random() * 4,
  duration: Math.random() * 6 + 4,
}));

const inputClass =
  'w-full px-4 py-3.5 rounded-2xl bg-white/8 border border-white/15 text-white placeholder-white/30 focus:outline-none focus:border-violet-400/70 focus:bg-white/12 transition-all duration-300 text-sm';

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [shake, setShake] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: 'https://time-machine-production-8ed3.up.railway.app' },
        });
        if (signUpError) throw signUpError;
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        navigate('/Onboarding');
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        const nickname = data?.user?.user_metadata?.nickname;
        const redirect = searchParams.get('redirect');
        if (redirect) {
          navigate(decodeURIComponent(redirect));
        } else if (nickname) {
          navigate('/Discover');
        } else {
          navigate('/Onboarding');
        }
      }
    } catch (err) {
      setError(err.message);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: 'https://time-machine-production-8ed3.up.railway.app/login',
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err) {
      setError(err.message);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setResetSent(false);
  };

  return (
    <div
      className="fixed inset-0 overflow-hidden flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #060612 0%, #0d0624 40%, #140838 70%, #0a0420 100%)' }}
    >
      {/* Glow orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.4) 0%, transparent 70%)' }}
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.25, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(67,56,202,0.35) 0%, transparent 70%)' }}
        />
      </div>

      {/* Stars */}
      <div className="absolute inset-0 pointer-events-none">
        {STARS.map(s => (
          <motion.div
            key={s.id}
            className="absolute rounded-full bg-white"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size }}
            animate={{ opacity: [0.1, 0.8, 0.1], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm mx-4 z-10"
      >
        {/* Logo */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-3xl"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(67,56,202,0.3))',
              border: '1px solid rgba(124,58,237,0.4)',
              boxShadow: '0 0 30px rgba(124,58,237,0.3)',
            }}
          >
            🕰️
          </motion.div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Time Machine</h1>
          <p className="text-white/40 text-sm mt-1">Reconnect with your past</p>
        </motion.div>

        {/* Glass card */}
        <motion.div
          animate={shake ? { x: [-8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 28,
            boxShadow: '0 8px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
            padding: '32px 28px',
          }}
        >
          <AnimatePresence mode="wait">

            {/* LOGIN */}
            {mode === 'login' && (
              <motion.div key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
              >
                <h2 className="text-xl font-bold text-white mb-1">Welcome back</h2>
                <p className="text-white/40 text-xs mb-6">Sign in to continue your journey</p>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1.5 ml-1">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      className={inputClass} placeholder="you@example.com" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5 ml-1">
                      <label className="text-xs font-medium text-white/50">Password</label>
                      <button type="button" onClick={() => switchMode('forgot')}
                        className="text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium">
                        Forgot password?
                      </button>
                    </div>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                      className={inputClass} placeholder="••••••••" />
                  </div>
                  {error && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-xs bg-red-400/10 rounded-xl px-3 py-2 border border-red-400/20">
                      {error}
                    </motion.p>
                  )}
                  <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.97 }}
                    className="w-full py-3.5 rounded-2xl text-white font-semibold text-sm mt-2 transition-all disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #4338ca)', boxShadow: '0 4px 24px rgba(124,58,237,0.4)' }}
                  >
                    {loading
                      ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in...</span>
                      : 'Sign in'}
                  </motion.button>
                </form>
                <p className="text-center text-white/30 text-xs mt-5">
                  Don't have an account?{' '}
                  <button onClick={() => switchMode('signup')} className="text-violet-400 font-semibold hover:text-violet-300 transition-colors">
                    Sign up
                  </button>
                </p>
              </motion.div>
            )}

            {/* SIGN UP */}
            {mode === 'signup' && (
              <motion.div key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <h2 className="text-xl font-bold text-white mb-1">Create account</h2>
                <p className="text-white/40 text-xs mb-6">Start your time travel adventure</p>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1.5 ml-1">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      className={inputClass} placeholder="you@example.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1.5 ml-1">Password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                      className={inputClass} placeholder="At least 6 characters" />
                  </div>
                  {error && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-xs bg-red-400/10 rounded-xl px-3 py-2 border border-red-400/20">
                      {error}
                    </motion.p>
                  )}
                  <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.97 }}
                    className="w-full py-3.5 rounded-2xl text-white font-semibold text-sm mt-2 transition-all disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #4338ca)', boxShadow: '0 4px 24px rgba(124,58,237,0.4)' }}
                  >
                    {loading
                      ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account...</span>
                      : 'Create account'}
                  </motion.button>
                </form>
                <p className="text-center text-white/30 text-xs mt-5">
                  Already have an account?{' '}
                  <button onClick={() => switchMode('login')} className="text-violet-400 font-semibold hover:text-violet-300 transition-colors">
                    Sign in
                  </button>
                </p>
              </motion.div>
            )}

            {/* FORGOT PASSWORD */}
            {mode === 'forgot' && (
              <motion.div key="forgot"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25 }}
              >
                <button onClick={() => switchMode('login')}
                  className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs mb-5 transition-colors">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M19 12H5M12 5l-7 7 7 7" />
                  </svg>
                  Back to sign in
                </button>

                {resetSent ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-4">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center text-2xl"
                      style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
                      ✉️
                    </div>
                    <h2 className="text-lg font-bold text-white mb-2">Check your email</h2>
                    <p className="text-white/40 text-xs leading-relaxed">
                      We sent a reset link to<br />
                      <span className="text-white/70 font-medium">{resetEmail}</span>
                    </p>
                  </motion.div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-white mb-1">Reset password</h2>
                    <p className="text-white/40 text-xs mb-6">Enter your email and we'll send a reset link</p>
                    <form onSubmit={handleForgotPassword} className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-white/50 mb-1.5 ml-1">Email</label>
                        <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required
                          className={inputClass} placeholder="you@example.com" />
                      </div>
                      {error && (
                        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                          className="text-red-400 text-xs bg-red-400/10 rounded-xl px-3 py-2 border border-red-400/20">
                          {error}
                        </motion.p>
                      )}
                      <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.97 }}
                        className="w-full py-3.5 rounded-2xl text-white font-semibold text-sm mt-2 transition-all disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg, #7c3aed, #4338ca)', boxShadow: '0 4px 24px rgba(124,58,237,0.4)' }}
                      >
                        {loading
                          ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</span>
                          : 'Send reset link'}
                      </motion.button>
                    </form>
                  </>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-white/20 text-xs mt-6"
        >
          Your memories are safe with us 🔒
        </motion.p>
      </motion.div>
    </div>
  );
}
