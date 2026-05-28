"use client";
import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthContext';
import { useToast } from '@/context/ToastContext';

export default function ChangePasswordModal() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [mounted, setMounted] = React.useState(false);
  const [passwords, setPasswords] = useState({ new: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const pathname = typeof window !== 'undefined' ? window.location.pathname : "";
  if (!mounted || !user || !user.is_temporary_password || pathname === '/change-password') return null;

  const handleChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (passwords.new.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (passwords.new !== passwords.confirm) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Update Password
      const { error: authErr } = await supabase.auth.updateUser({
        password: passwords.new
      });
      if (authErr) throw authErr;

      // 2. Update Profile to clear flag
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ 
            is_temporary_password: false,
            force_password_change: false 
        })
        .eq('id', user.id);
      
      if (profileErr) throw profileErr;

      // 3. Clear flags in other roles to ensure AuthContext picks up the change
      await Promise.allSettled([
          supabase.from('vendors').update({ is_temporary_password: false, force_password_change: false }).eq('id', user.id),
          supabase.from('organisers').update({ is_temporary_password: false, force_password_change: false }).eq('id', user.id)
      ]);

      showToast("Password updated successfully! Welcome aboard.", "success");
      
      // Reload page to refresh user profile state
      window.location.reload();
    } catch (err) {
      setError(err.message || "Failed to update password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999999, backdropFilter: "blur(8px)", padding: "20px" }}>
      <div style={{ backgroundColor: "#ffffff", width: "100%", maxWidth: "440px", borderRadius: "24px", border: "1px solid #e2e8f0", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", overflow: "hidden" }}>
        <div style={{ background: "linear-gradient(135deg, #10b981 0%, #3b82f6 100%)", padding: "32px 24px", textAlign: "center" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "16px", backgroundColor: "rgba(255,255,255,0.2)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px auto" }}>
            <ShieldCheck size={32} />
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: 900, color: "#fff", margin: 0, letterSpacing: "-0.5px" }}>Secure Your Account</h2>
          <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "14px", marginTop: "8px", fontWeight: 500 }}>For your security, please change your temporary password to continue.</p>
        </div>

        <div style={{ padding: "32px 24px" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {error && (
              <div style={{ backgroundColor: "#fef2f2", color: "#dc2626", padding: "12px 16px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, border: "1px solid #fecaca", display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "#64748b", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>NEW PASSWORD</label>
              <div style={{ position: "relative" }}>
                <input 
                  type={showPass ? "text" : "password"} 
                  name="new"
                  value={passwords.new}
                  onChange={handleChange}
                  placeholder="Minimum 8 characters"
                  required
                  style={{ width: "100%", padding: "14px 44px 14px 16px", borderRadius: "12px", border: "1.5px solid #e2e8f0", backgroundColor: "#f8fafc", color: "#0f172a", fontSize: "15px", outline: "none", transition: "all 0.2s", boxSizing: "border-box" }}
                />
                <button 
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748b", cursor: "pointer" }}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "#64748b", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>CONFIRM NEW PASSWORD</label>
              <input 
                type={showPass ? "text" : "password"} 
                name="confirm"
                value={passwords.confirm}
                onChange={handleChange}
                placeholder="Repeat your new password"
                required
                style={{ width: "100%", padding: "14px 16px", borderRadius: "12px", border: "1.5px solid #e2e8f0", backgroundColor: "#f8fafc", color: "#0f172a", fontSize: "15px", outline: "none", transition: "all 0.2s", boxSizing: "border-box" }}
              />
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              style={{ 
                width: "100%", 
                padding: "16px", 
                borderRadius: "14px", 
                background: "linear-gradient(135deg, #10b981 0%, #3b82f6 100%)", 
                color: "#fff", 
                border: "none", 
                fontWeight: 800, 
                fontSize: "16px", 
                cursor: "pointer", 
                marginTop: "8px",
                opacity: isSubmitting ? 0.7 : 1,
                boxShadow: "0 10px 15px -3px rgba(16, 185, 129, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
            >
              {isSubmitting ? "Updating Password..." : "Update Password & Continue"}
            </button>

            <button 
              type="button"
              onClick={logout}
              style={{ background: "none", border: "none", color: "#64748b", fontSize: "13px", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
            >
              Logout and change later
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
