import { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CosmicClock from '@/components/home/CosmicClock';

const STARS = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2.5 + 0.5,
  delay: Math.random() * 4,
  duration: Math.random() * 6 + 4,
}));

const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: 16,
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.15)',
  color: '#ffffff',
  fontSize: 14,
  outline: 'none',
  transition: 'all 0.3s',
};

function Input({ style, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      style={{
        ...inputStyle,
        border: focused ? '1px solid rgba(167,139,250,0.7)' : '1px solid rgba(255,255,255,0.15)',
        background: focused ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.08)',
        ...style,
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

export default function Login() {
  const [mode, setMode] = useState('login');
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
        if (redirect) navigate(decodeURIComponent(redirect));
        else if (nickname) navigate('/Discover');
        else navigate('/Onboarding');
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
    <div style={{
      position: 'fixed', inset: 0, overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #060612 0%, #0d0624 40%, #140838 70%, #0a0420 100%)',
    }}>
      {/* Glow orbs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: '-20%', left: '-20%',
            width: '70%', height: '70%', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.4) 0%, transparent 70%)',
          }}
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.25, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          style={{
            position: 'absolute', bottom: '-10%', right: '-10%',
            width: '60%', height: '60%', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(67,56,202,0.35) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Stars */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {STARS.map(s => (
          <motion.div key={s.id}
            animate={{ opacity: [0.1, 0.8, 0.1], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute', left: `${s.x}%`, top: `${s.y}%`,
              width: s.size, height: s.size, borderRadius: '50%', background: '#fff',
            }}
          />
        ))}
      </div>

      {/* Card container */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'relative', width: '100%', maxWidth: 360, margin: '0 16px', zIndex: 10 }}
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 28 }}
        >
          <div style={{ margin: '0 auto 12px' }}>
            <CosmicClock size={100} />
          </div>
          <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>
            Time Machine
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 }}>
            Reconnect with your past
          </p>
        </motion.div>

        {/* Glass card */}
        <motion.div
          animate={shake ? { x: [-8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            background: 'rgba(255,255,255,0.07)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(255,255,255,0.13)',
            borderRadius: 28,
            boxShadow: '0 8px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
            padding: '32px 28px',
          }}
        >
          <AnimatePresence mode="wait">

            {/* ── LOGIN ── */}
            {mode === 'login' && (
              <motion.div key="login"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.22 }}
              >
                <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>
                  Welcome back
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 24 }}>
                  Sign in to continue your journey
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 500, marginBottom: 6, marginLeft: 4 }}>
                      Email
                    </label>
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      required placeholder="you@example.com" />
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, marginLeft: 4 }}>
                      <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 500 }}>
                        Password
                      </label>
                      <button type="button" onClick={() => switchMode('forgot')}
                        style={{ color: '#a78bfa', fontSize: 11, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        Forgot password?
                      </button>
                    </div>
                    <Input type="password" value={password} onChange={e => setPassword(e.target.value)}
                      required minLength={6} placeholder="••••••••" />
                  </div>

                  {error && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      style={{ color: '#f87171', fontSize: 12, background: 'rgba(248,113,113,0.1)', borderRadius: 12, padding: '8px 12px', border: '1px solid rgba(248,113,113,0.2)', margin: 0 }}>
                      {error}
                    </motion.p>
                  )}

                  <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.97 }}
                    style={{
                      width: '100%', padding: '14px 0', borderRadius: 16, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                      color: '#fff', fontWeight: 700, fontSize: 14, marginTop: 4,
                      background: 'linear-gradient(135deg, #7c3aed, #4338ca)',
                      boxShadow: '0 4px 24px rgba(124,58,237,0.45)',
                      opacity: loading ? 0.6 : 1,
                    }}
                  >
                    {loading
                      ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                          Signing in...
                        </span>
                      : 'Sign in'}
                  </motion.button>
                </form>

                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 20 }}>
                  Don't have an account?{' '}
                  <button onClick={() => switchMode('signup')}
                    style={{ color: '#a78bfa', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    Sign up
                  </button>
                </p>
              </motion.div>
            )}

            {/* ── SIGN UP ── */}
            {mode === 'signup' && (
              <motion.div key="signup"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }}
              >
                <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>
                  Create account
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 24 }}>
                  Start your time travel adventure
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 500, marginBottom: 6, marginLeft: 4 }}>
                      Email
                    </label>
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      required placeholder="you@example.com" />
                  </div>

                  <div>
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 500, marginBottom: 6, marginLeft: 4 }}>
                      Password
                    </label>
                    <Input type="password" value={password} onChange={e => setPassword(e.target.value)}
                      required minLength={6} placeholder="At least 6 characters" />
                  </div>

                  {error && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      style={{ color: '#f87171', fontSize: 12, background: 'rgba(248,113,113,0.1)', borderRadius: 12, padding: '8px 12px', border: '1px solid rgba(248,113,113,0.2)', margin: 0 }}>
                      {error}
                    </motion.p>
                  )}

                  <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.97 }}
                    style={{
                      width: '100%', padding: '14px 0', borderRadius: 16, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                      color: '#fff', fontWeight: 700, fontSize: 14, marginTop: 4,
                      background: 'linear-gradient(135deg, #7c3aed, #4338ca)',
                      boxShadow: '0 4px 24px rgba(124,58,237,0.45)',
                      opacity: loading ? 0.6 : 1,
                    }}
                  >
                    {loading
                      ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                          Creating account...
                        </span>
                      : 'Create account'}
                  </motion.button>
                </form>

                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 20 }}>
                  Already have an account?{' '}
                  <button onClick={() => switchMode('login')}
                    style={{ color: '#a78bfa', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    Sign in
                  </button>
                </p>
              </motion.div>
            )}

            {/* ── FORGOT PASSWORD ── */}
            {mode === 'forgot' && (
              <motion.div key="forgot"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.22 }}
              >
                <button onClick={() => switchMode('login')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.4)', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 20 }}>
                  ← Back to sign in
                </button>

                {resetSent ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    style={{ textAlign: 'center', padding: '16px 0' }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                      background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
                    }}>✉️</div>
                    <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>
                      Check your email
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, lineHeight: 1.6 }}>
                      We sent a reset link to<br />
                      <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{resetEmail}</span>
                    </p>
                  </motion.div>
                ) : (
                  <>
                    <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>
                      Reset password
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 24 }}>
                      Enter your email and we'll send a reset link
                    </p>

                    <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 500, marginBottom: 6, marginLeft: 4 }}>
                          Email
                        </label>
                        <Input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)}
                          required placeholder="you@example.com" />
                      </div>

                      {error && (
                        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                          style={{ color: '#f87171', fontSize: 12, background: 'rgba(248,113,113,0.1)', borderRadius: 12, padding: '8px 12px', border: '1px solid rgba(248,113,113,0.2)', margin: 0 }}>
                          {error}
                        </motion.p>
                      )}

                      <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.97 }}
                        style={{
                          width: '100%', padding: '14px 0', borderRadius: 16, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                          color: '#fff', fontWeight: 700, fontSize: 14, marginTop: 4,
                          background: 'linear-gradient(135deg, #7c3aed, #4338ca)',
                          boxShadow: '0 4px 24px rgba(124,58,237,0.45)',
                          opacity: loading ? 0.6 : 1,
                        }}
                      >
                        {loading
                          ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                              <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                              Sending...
                            </span>
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
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 11, marginTop: 24 }}
        >
          Your memories are safe with us 🔒
        </motion.p>
      </motion.div>

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
