"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, X, Globe } from 'lucide-react';
import { useAuth } from './AuthContext';
import EmojiBackground from './EmojiBackground';

export default function MobileLoginPopup({ onClose, onLoginSuccess }) {
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(identifier, password);
      if (result.success) {
        if (onLoginSuccess) onLoginSuccess();
        onClose();
      } else {
        setError(result.error || "Invalid credentials");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await loginWithGoogle();
      if (!result.success) {
        setError(result.error || "Google login failed");
      }
    } catch (err) {
      setError("An error occurred during Google login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(8px)',
      padding: '20px'
    }}>
      {/* Phone Mockup Frame */}
      <div style={{
        width: '340px',
        maxWidth: '95vw',
        height: '640px',
        maxHeight: '92vh',
        backgroundColor: '#fff',
        borderRadius: '44px',
        border: '12px solid #1a1a1a',
        position: 'relative',
        boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      }}>
        {/* Floating Emojis Background */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.4 }}>
            <EmojiBackground />
        </div>

        {/* Notch */}
        <div style={{
          width: '110px',
          height: '28px',
          backgroundColor: '#1a1a1a',
          position: 'absolute',
          top: '0',
          left: '50%',
          transform: 'translateX(-50%)',
          borderBottomLeftRadius: '18px',
          borderBottomRightRadius: '18px',
          zIndex: 10
        }} />

        {/* Status Bar */}
        <div style={{
          padding: '16px 24px 8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          fontWeight: '700',
          color: '#000',
          zIndex: 9
        }}>
          <span>{currentTime}</span>
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <Globe size={14} />
            <div style={{ width: '22px', height: '11px', border: '1.5px solid #000', borderRadius: '3px', position: 'relative' }}>
              <div style={{ width: '85%', height: '100%', backgroundColor: '#22c55e' }} />
            </div>
          </div>
        </div>

        {/* Internal Content */}
        <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', zIndex: 1, position: 'relative' }}>
          <button 
            onClick={onClose}
            style={{ 
              position: 'absolute', right: '10px', top: '0', 
              background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' 
            }}
          >
            <X size={24} />
          </button>

          <div style={{ textAlign: 'center', marginTop: '0px', marginBottom: '16px' }}>
            <img src="/logo.png" alt="Logo" style={{ height: '32px', marginBottom: '8px' }} />
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#1e1b4b', margin: '0' }}>Welcome</h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Sign in to your account</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input 
              type="text" 
              placeholder="Username / Email"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              style={{
                width: '100%', padding: '14px 16px', borderRadius: '12px',
                border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none'
              }}
            />
            <div style={{ position: 'relative' }}>
              <input 
                type={showPass ? "text" : "password"} 
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: '12px',
                  border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none'
                }}
              />
              <button 
                type="button" 
                onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: '12px', top: '14px', background: 'none', border: 'none', color: '#94a3b8' }}
              >
                {showPass ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>

            {error && <p style={{ color: '#ef4444', fontSize: '12px', margin: '0', fontWeight: 600 }}>{error}</p>}

            <button 
              type="submit" 
              disabled={loading}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                background: 'linear-gradient(135deg, #f84464 0%, #c026d3 100%)',
                color: '#fff', fontWeight: 800, fontSize: '15px', cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(248, 68, 100, 0.3)', marginTop: '8px'
              }}
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <button style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
              Forgot password?
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0', gap: '10px' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>OR</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{
              width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0',
              backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '10px', cursor: 'pointer', transition: '0.2s',
              opacity: loading ? 0.7 : 1
            }}
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18" height="18" />
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>Continue with Google</span>
          </button>

          <div style={{ marginTop: 'auto', textAlign: 'center', paddingBottom: '20px' }}>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>
              <span style={{ cursor: 'pointer' }}>Terms</span> & <span style={{ cursor: 'pointer' }}>Privacy</span>
            </p>
            <p style={{ fontSize: '14px', color: '#475569', margin: 0 }}>
              New here? <span onClick={() => { onClose(); router.push('/signin?mode=signup'); }} style={{ color: '#f84464', fontWeight: 800, cursor: 'pointer' }}>Create account</span>
            </p>
          </div>
        </div>

        <style>{`
          @keyframes popIn {
            from { transform: scale(0.8); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}
