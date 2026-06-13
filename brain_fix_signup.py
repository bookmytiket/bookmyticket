import sys

def run():
    with open('/home/raja/bookmyticket/app/signup/page.jsx', 'r') as f:
        lines = f.readlines()
        
    # Replace the import
    for i in range(len(lines)):
        if "from \"lucide-react\";" in lines[i] and "Eye" in lines[i]:
            lines[i] = lines[i].replace("}", ", MessageCircle }")
            break
            
    # Remove validation checks
    for i in range(len(lines)):
        if "if (!formData.agreeTerms)" in lines[i]:
            lines[i] = ""
        if "if (formData.password !== formData.confirmPassword)" in lines[i]:
            lines[i] = ""
            
    # Replace RIGHT SECTION
    start_idx = -1
    for i in range(len(lines)):
        if "{/* RIGHT SECTION: REGISTRATION FORM */}" in lines[i]:
            start_idx = i
            break
            
    end_idx = -1
    for i in range(len(lines)):
        if "    );" in lines[i]:
            end_idx = i - 1  # Keep the last </div>
            break
            
    if start_idx == -1 or end_idx == -1:
        print(f"Error: Could not find indices. Start: {start_idx}, End: {end_idx}")
        sys.exit(1)
        
    replacement = """            {/* RIGHT SECTION: REGISTRATION FORM */}
            <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative overflow-y-auto" style={{ background: "#f8fafc" }}>
                <Link href="/" className="absolute top-8 left-8 text-slate-400 hover:text-slate-800 flex items-center gap-2 font-semibold transition-colors lg:hidden">
                    <ChevronLeft size={20} /> Back
                </Link>

                <div className="w-full max-w-[480px]">
                    {success ? (
                        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center animate-in fade-in zoom-in duration-300 shadow-xl shadow-slate-200/50">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 size={32} />
                            </div>
                            <h3 className="text-2xl font-bold text-green-800 mb-2">Welcome Aboard!</h3>
                            <p className="text-green-600 font-medium mb-6">Your account has been created successfully. Redirecting you...</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden p-8 sm:p-10">
                            
                            {/* Header Info Box */}
                            <div style={{ background: "#fffbeb", border: "1px solid #fef3c7", padding: "16px", borderRadius: "12px", display: "flex", gap: "16px", marginBottom: "32px" }}>
                                <div style={{ color: "#d97706", marginTop: "2px", border: "1px solid #fcd34d", borderRadius: "8px", padding: "6px", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Mail size={20} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#1e293b", margin: "0 0 4px" }}>Sign up with Email and Password</h3>
                                    <p style={{ fontSize: "13px", color: "#64748b", margin: 0, lineHeight: 1.4 }}>Use the email address and password for registering</p>
                                </div>
                            </div>

                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-semibold flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></div> {error}
                                </div>
                            )}

                            <form onSubmit={handleEmailSignup}>
                                {/* Name Field */}
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 800, color: "#1e293b", marginBottom: "8px" }}>Name</label>
                                <input type="text" name="fullName" required placeholder="Enter your name" value={formData.fullName} onChange={handleInputChange} style={{ width: "100%", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "14px", outline: "none" }} />
                                
                                {/* Email Field */}
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 800, color: "#1e293b", marginBottom: "8px", marginTop: "24px" }}>Email Address</label>
                                <input type="email" name="email" required placeholder="you@example.com" value={formData.email} onChange={handleInputChange} style={{ width: "100%", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "14px", outline: "none" }} />
                                
                                {/* Mobile Field */}
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 800, color: "#1e293b", marginBottom: "8px", marginTop: "24px" }}>Mobile number</label>
                                <div style={{ display: "flex", alignItems: "center", border: "1px solid #e2e8f0", borderRadius: "10px", paddingRight: "14px", overflow: "hidden" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "14px", borderRight: "1px solid #e2e8f0", background: "#f8fafc" }}>
                                        <span>🇮🇳</span>
                                        <span style={{ fontSize: "14px", color: "#334155", fontWeight: 500 }}>+91</span>
                                    </div>
                                    <input type="tel" name="mobile" required placeholder="9876543210" value={formData.mobile} onChange={handleInputChange} style={{ flex: 1, border: "none", outline: "none", padding: "14px", background: "transparent", fontSize: "14px" }} />
                                    <MessageCircle size={20} color="#22c55e" />
                                </div>

                                {/* Password Field */}
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 800, color: "#1e293b", marginBottom: "8px", marginTop: "24px" }}>Password</label>
                                <div style={{ position: "relative" }}>
                                    <input type={showPass ? "text" : "password"} name="password" required placeholder="Enter your password" value={formData.password} onChange={handleInputChange} style={{ width: "100%", padding: "14px", paddingRight: "50px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "14px", outline: "none" }} />
                                    <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: "16px", top: "14px", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}>
                                        {showPass ? <Eye size={18} /> : <EyeOff size={18} />}
                                    </button>
                                </div>

                                {/* Submit Button */}
                                <button type="submit" disabled={loading} style={{ width: "100%", padding: "16px", background: "#000", color: "#fff", border: "none", borderRadius: "12px", fontWeight: 700, fontSize: "15px", cursor: "pointer", marginTop: "32px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: loading ? 0.7 : 1 }}>
                                    {loading ? "Creating..." : "→] sign up"}
                                </button>
                            </form>
                            
                            <div className="mt-8 text-center">
                                <p className="text-slate-500 font-medium text-sm">
                                    Already have an account? <Link href="/signin" className="text-pink-600 font-bold hover:underline">Sign In here</Link>
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>\n"""

    new_lines = lines[:start_idx] + [replacement] + lines[end_idx:]
    
    with open('/home/raja/bookmyticket/app/signup/page.jsx', 'w') as f:
        f.writelines(new_lines)

run()
