import sys

def run():
    with open('/home/raja/bookmyticket/app/signin/page.js', 'r') as f:
        lines = f.readlines()
        
    start_idx = 941  # 0-indexed for line 942
    end_idx = 1526   # 0-indexed for line 1527 (everything from 1527 onwards is kept)
        
    replacement = """                <div style={{ width: "100%", maxWidth: "480px", margin: "0 auto", position: "relative", zIndex: 10 }}>
                    
                    {/* Header Logo for Mobile (optional, but good to have) */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "30px" }} className="hide-on-desktop">
                        <Link href="/">
                            <img src="/logo.png" alt="BookMyTicket" style={{ height: '50px', width: 'auto', objectFit: 'contain' }} />
                        </Link>
                    </div>

                    {/* Toggle Bar */}
                    {(mode === "email_password" || mode === "login_otp" || mode === "login_otp_verify" || mode === "signin") && (
                        <div style={{ display: "flex", background: "#f3f4f6", padding: "6px", borderRadius: "12px", marginBottom: "24px" }}>
                            <button 
                                type="button"
                                onClick={() => { setMode("login_otp"); setLoginError(""); }}
                                style={{ flex: 1, padding: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "14px", transition: "all 0.2s ease", background: mode === "login_otp" || mode === "login_otp_verify" ? "#000" : "transparent", color: mode === "login_otp" || mode === "login_otp_verify" ? "#fff" : "#6b7280" }}
                            >
                                <Smartphone size={16} /> Email OTP
                            </button>
                            <button 
                                type="button"
                                onClick={() => { setMode("email_password"); setLoginError(""); }}
                                style={{ flex: 1, padding: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "14px", transition: "all 0.2s ease", background: mode === "email_password" || mode === "signin" ? "#000" : "transparent", color: mode === "email_password" || mode === "signin" ? "#fff" : "#6b7280" }}
                            >
                                <Mail size={16} /> Email & Password
                            </button>
                        </div>
                    )}

                    {/* Main Card */}
                    <div style={{ background: "#ffffff", borderRadius: "24px", padding: "40px 32px", boxShadow: "0 10px 40px -10px rgba(0,0,0,0.08)", border: "1px solid #f1f5f9" }}>
                        
                        {/* ══ LOGIN OTP SEND ══ */}
                        {(mode === "login_otp") && (
                            <>
                                <div style={{ background: "#fffbeb", border: "1px solid #fef3c7", padding: "16px", borderRadius: "12px", display: "flex", gap: "16px", marginBottom: "24px" }}>
                                    <div style={{ color: "#d97706", marginTop: "2px" }}><Mail size={20} /></div>
                                    <div>
                                        <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#92400e", margin: "0 0 4px" }}>Sign in with Email OTP</h3>
                                        <p style={{ fontSize: "13px", color: "#b45309", margin: 0, lineHeight: 1.4 }}>Receive a secure code in your inbox</p>
                                    </div>
                                </div>
                                <form onSubmit={handleLoginSendOTP}>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 800, color: "#1e293b", marginBottom: "8px" }}>Email Address</label>
                                    <input type="email" required placeholder="you@example.com" value={identifier} onChange={e => setIdentifier(e.target.value)} style={{...inp, padding: "14px", borderRadius: "10px", marginBottom: "24px", borderColor: "#e2e8f0"}} />
                                    
                                    {loginError && <div style={{ padding: "12px", background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: "10px", marginBottom: "20px", color: "#b91c1c", fontSize: "13px", fontWeight: 600 }}>⚠ {loginError}</div>}
                                    
                                    <button type="submit" disabled={loading} style={{ width: "100%", padding: "14px", background: "#000", color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "15px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: loading ? 0.7 : 1 }}>
                                        {loading ? "Sending..." : "Get OTP"}
                                    </button>
                                </form>
                                <div style={{ textAlign: "center", marginTop: "24px" }}>
                                    <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                                        Don't have an account? <Link href="/signup" style={{ color: "#f84464", fontWeight: 700, textDecoration: "none" }}>Sign up</Link>
                                    </p>
                                </div>
                            </>
                        )}

                        {/* ══ LOGIN OTP VERIFY ══ */}
                        {mode === "login_otp_verify" && (
                            <>
                                <div style={{ textAlign: "center", marginBottom: "24px" }}>
                                    <h1 style={{ fontSize: "24px", fontWeight: 900, color: "#1e1b4b", margin: "0 0 8px" }}>Verify OTP</h1>
                                    <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>Enter the code sent to <strong>{otpEmail}</strong></p>
                                </div>
                                <form onSubmit={handleLoginVerifyOTP}>
                                    <input type="text" required placeholder="000000" value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} style={{...inp, textAlign: "center", letterSpacing: "8px", fontSize: "24px", fontWeight: "bold", padding: "16px", borderRadius: "10px", marginBottom: "24px"}} autoFocus />
                                    {loginError && <div style={{ padding: "12px", background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: "10px", marginBottom: "20px", color: "#b91c1c", fontSize: "13px", fontWeight: 600 }}>⚠ {loginError}</div>}
                                    <button type="submit" disabled={loading || otpCode.length !== 6} style={{ width: "100%", padding: "14px", background: "#000", color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "15px", cursor: "pointer", opacity: (loading || otpCode.length !== 6) ? 0.7 : 1 }}>
                                        {loading ? "Verifying..." : "Verify & Login"}
                                    </button>
                                </form>
                                <div style={{ textAlign: "center", marginTop: "24px" }}>
                                    <button onClick={() => { setMode("login_otp"); setLoginError(""); }} style={{ background: "none", border: "none", color: "#a855f7", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}>Resend or Change Email</button>
                                </div>
                            </>
                        )}

                        {/* ══ LOGIN EMAIL PASSWORD ══ */}
                        {(mode === "email_password" || mode === "signin") && (
                            <>
                                <div style={{ background: "#fffbeb", border: "1px solid #fef3c7", padding: "16px", borderRadius: "12px", display: "flex", gap: "16px", marginBottom: "24px" }}>
                                    <div style={{ color: "#d97706", marginTop: "2px" }}><Mail size={20} /></div>
                                    <div>
                                        <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#92400e", margin: "0 0 4px" }}>Sign in with Email</h3>
                                        <p style={{ fontSize: "13px", color: "#b45309", margin: 0, lineHeight: 1.4 }}>Use the email address and password you used when registering</p>
                                    </div>
                                </div>
                                
                                <form onSubmit={(e) => handleLogin(e, true)}>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 800, color: "#1e293b", marginBottom: "8px" }}>Email Address</label>
                                    <input type="email" required placeholder="you@example.com" value={identifier} onChange={e => setIdentifier(e.target.value)} style={{...inp, padding: "14px", borderRadius: "10px", marginBottom: "20px", borderColor: "#e2e8f0"}} />

                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                        <label style={{ fontSize: "13px", fontWeight: 800, color: "#1e293b", margin: 0 }}>Password</label>
                                        <button type="button" onClick={() => setMode("forgot")} style={{ background: "none", border: "none", fontSize: "13px", color: "#334155", fontWeight: 700, cursor: "pointer", padding: 0 }}>Forgot password?</button>
                                    </div>
                                    <div style={{ position: "relative", marginBottom: "24px" }}>
                                        <input type={showPass ? "text" : "password"} required placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} style={{ ...inp, padding: "14px", paddingRight: "50px", borderRadius: "10px", margin: 0, borderColor: "#e2e8f0" }} />
                                        <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: "absolute", right: "16px", top: "14px", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}>
                                            {showPass ? <Eye size={18} /> : <EyeOff size={18} />}
                                        </button>
                                    </div>

                                    {loginError && <div style={{ padding: "12px", background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: "10px", marginBottom: "20px", color: "#b91c1c", fontSize: "13px", fontWeight: 600 }}>⚠ {loginError}</div>}

                                    <button type="submit" disabled={loading} style={{ width: "100%", padding: "14px", background: "#000", color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "15px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: loading ? 0.85 : 1 }}>
                                        →] Sign In
                                    </button>
                                </form>
                                <div style={{ textAlign: "center", marginTop: "24px" }}>
                                    <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                                        Don't have an account? <Link href="/signup" style={{ color: "#f84464", fontWeight: 700, textDecoration: "none" }}>Sign up</Link>
                                    </p>
                                </div>
                            </>
                        )}

                        {/* ══ FORGOT PASSWORD ══ */}
                        {mode === "forgot" && (
                            <>
                                <div style={{ textAlign: "center", marginBottom: "28px" }}>
                                    <h2 style={{ fontSize: "24px", fontWeight: 900, color: "#1e1b4b", margin: "0 0 8px" }}>Reset Password</h2>
                                    <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>Enter your email to receive a reset link</p>
                                </div>
                                {forgotSuccess ? (
                                    <div style={{ textAlign: "center", padding: "24px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px" }}>
                                        <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#16a34a", margin: "0 0 16px" }}>Check your email</h3>
                                        <button onClick={() => setMode("email_password")} style={{ width: "100%", padding: "12px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, cursor: "pointer" }}>Back to Log In</button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleForgotPassword}>
                                        <label style={{ display: "block", fontSize: "13px", fontWeight: 800, color: "#1e293b", marginBottom: "8px" }}>Email Address</label>
                                        <input type="email" required placeholder="you@example.com" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} style={{...inp, padding: "14px", borderRadius: "10px", marginBottom: "24px", borderColor: "#e2e8f0"}} />
                                        {forgotError && <p style={{ fontSize: "13px", color: "#ef4444", marginBottom: "20px" }}>⚠ {forgotError}</p>}
                                        <button type="submit" style={{ width: "100%", padding: "14px", background: "#000", color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "15px", cursor: "pointer" }}>Send Reset Link</button>
                                        <div style={{ textAlign: "center", marginTop: "20px" }}>
                                            <button type="button" onClick={() => setMode("email_password")} style={{ background: "none", border: "none", color: "#64748b", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}>← Back to Sign In</button>
                                        </div>
                                    </form>
                                )}
                            </>
                        )}
                        
                        {/* ══ VERIFY OTP ══ */}
                        {mode === "verify-otp" && (
                            <>
                                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                                    <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#1e293b" }}>Verify</h2>
                                    <p style={{ fontSize: "14px", color: "#64748b" }}>OTP sent to {otpEmail}</p>
                                </div>

                                <form onSubmit={handleVerifyOTP}>
                                    <input
                                        type="text" required
                                        placeholder="000000"
                                        maxLength={6}
                                        value={otpCode}
                                        onChange={e => setOtpCode(e.target.value.replace(/\D/g, ""))}
                                        style={{ ...inp, letterSpacing: "4px", fontSize: "24px", textAlign: "center", fontWeight: 700, padding: "16px", borderRadius: "10px", marginBottom: "24px" }}
                                        autoFocus
                                    />
                                    {otpError && <p style={{ fontSize: "13px", color: "#ef4444", marginBottom: "12px" }}>⚠ {otpError}</p>}
                                    <button type="submit" style={{ width: "100%", padding: "14px", background: "#000", color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "15px", cursor: "pointer" }}>Verify Code</button>
                                </form>
                            </>
                        )}
                    </div>
                </div>\n"""

    new_lines = lines[:start_idx] + [replacement] + lines[end_idx:]
    
    with open('/home/raja/bookmyticket/app/signin/page.js', 'w') as f:
        f.writelines(new_lines)

run()
