"use client";
import React, { useState, useEffect } from "react";
import {
  Wallet, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2,
  XCircle, Loader2, AlertCircle, ChevronRight, Building2,
  Banknote, CreditCard, RefreshCw, Plus
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthContext";

const STATUS_CONFIG = {
  pending:    { color: "#f97316", bg: "#fff7ed", label: "Pending Review",  icon: Clock },
  approved:   { color: "#3b82f6", bg: "#eff6ff", label: "Approved",        icon: CheckCircle2 },
  processing: { color: "#a855f7", bg: "#faf5ff", label: "Processing",      icon: Loader2 },
  paid:       { color: "#22c55e", bg: "#f0fdf4", label: "Paid",            icon: CheckCircle2 },
  rejected:   { color: "#ef4444", bg: "#fef2f2", label: "Rejected",        icon: XCircle },
};

export default function PayoutRequestPanel({ requesterType = "organiser" }) {
  const { user } = useAuth();
  const [payouts, setPayouts] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);

  const [form, setForm] = useState({
    amount: "",
    payment_mode: "bank_transfer",
    bank_name: "",
    account_number: "",
    ifsc_code: "",
    upi_id: "",
    notes: "",
  });

  const fetchData = async () => {
    if (!user?.id) return;
    setLoading(true);

    // Fetch profile and wallet balance based on requesterType
    let pid = null;
    let walletTable = "organiser_wallet";
    let walletCol = "organiser_id";

    if (requesterType === "organiser") {
      const { data: org } = await supabase.from("organisers").select("id").eq("id", user.id).maybeSingle();
      if (org) pid = org.id;
    } else {
      const { data: prov } = await supabase.from("service_providers").select("id").eq("organiser_id", user.id).maybeSingle();
      if (prov) pid = prov.id;
      walletTable = "provider_wallets";
      walletCol = "provider_id";
    }

    if (pid) {
      const { data: walletData } = await supabase
        .from(walletTable)
        .select("*")
        .eq(walletCol, pid)
        .maybeSingle();
      setWallet(walletData);
    } else {
      setWallet(null);
    }

    // Fetch existing payout requests
    const { data: payoutData } = await supabase
      .from("payout_requests")
      .select("*")
      .eq("requester_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setPayouts(payoutData || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    const amount = Number(form.amount);
    if (!amount || amount <= 0) { setFormError("Enter a valid amount"); return; }
    if (wallet && amount > (wallet.balance || 0)) { setFormError("Insufficient wallet balance"); return; }
    if (form.payment_mode === "bank_transfer" && (!form.account_number || !form.ifsc_code)) {
      setFormError("Bank account and IFSC are required"); return;
    }
    if (form.payment_mode === "upi" && !form.upi_id) {
      setFormError("UPI ID is required"); return;
    }

    setSubmitting(true);
    const gst = +(amount * 0.18).toFixed(2);
    const commission = +(amount * 0.05).toFixed(2);
    const net = +(amount - gst - commission).toFixed(2);

    const { error, data: reqData } = await supabase.from("payout_requests").insert({
      requester_id: user.id,
      requester_type: requesterType,
      amount,
      gst_amount: gst,
      commission_amount: commission,
      net_amount: net,
      currency: "INR",
      payment_mode: form.payment_mode,
      bank_name: form.bank_name || null,
      account_number: form.account_number || null,
      ifsc_code: form.ifsc_code || null,
      upi_id: form.upi_id || null,
      status: "pending",
    }).select().single();

    if (error) { setSubmitting(false); setFormError(error.message); return; }

    // Deduct balance and create transaction
    if (wallet) {
      const pid = requesterType === "organiser" ? wallet.organiser_id : wallet.provider_id;
      const walletTable = requesterType === "organiser" ? "organiser_wallet" : "provider_wallets";
      const walletCol = requesterType === "organiser" ? "organiser_id" : "provider_id";

      if (pid) {
        await supabase.from(walletTable).update({
          balance: wallet.balance - amount
        }).eq(walletCol, pid);

        await supabase.from("wallet_transactions").insert({
          provider_id: pid,
          provider_type: requesterType === "organiser" ? "organiser" : "service",
          amount: amount,
          type: "debit",
          description: "Payout Request Deduction",
          reference_id: reqData?.id
        });
      }
    }

    setSubmitting(false);
    setFormSuccess(true);
    setShowForm(false);
    setForm({ amount: "", payment_mode: "bank_transfer", bank_name: "", account_number: "", ifsc_code: "", upi_id: "", notes: "" });
    fetchData();
  };

  const availableBalance = wallet?.balance || 0;
  const totalRequested = payouts.filter(p => p.status === "pending" || p.status === "processing").reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>

      {/* Wallet Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "28px" }}>
        {[
          { label: "Available Balance", value: `₹${availableBalance.toLocaleString("en-IN")}`, color: "#22c55e", bg: "#f0fdf4", icon: Wallet },
          { label: "Total Earned",      value: `₹${(wallet?.total_earned || 0).toLocaleString("en-IN")}`, color: "#3b82f6", bg: "#eff6ff", icon: ArrowDownLeft },
          { label: "Total Withdrawn",   value: `₹${(wallet?.total_withdrawn || 0).toLocaleString("en-IN")}`, color: "#a855f7", bg: "#faf5ff", icon: ArrowUpRight },
          { label: "In Review",         value: `₹${totalRequested.toLocaleString("en-IN")}`, color: "#f97316", bg: "#fff7ed", icon: Clock },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} style={{ background: bg, borderRadius: "16px", padding: "20px", border: `1px solid ${color}20` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", color }}>
                <Icon size={16} />
              </div>
              <span style={{ fontSize: "11px", fontWeight: 900, color, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
            </div>
            <p style={{ margin: 0, fontSize: "24px", fontWeight: 900, color: "#0f172a" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Action Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h3 style={{ margin: 0, fontWeight: 900, fontSize: "18px", color: "#0f172a" }}>Payout Requests</h3>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={fetchData} style={{ padding: "8px 14px", background: "#f1f5f9", border: "none", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700, color: "#64748b" }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={() => { setShowForm(true); setFormSuccess(false); }}
            disabled={availableBalance <= 0}
            style={{
              padding: "10px 20px", background: availableBalance > 0 ? "linear-gradient(135deg, #f84464, #c026d3)" : "#e2e8f0",
              color: availableBalance > 0 ? "#fff" : "#94a3b8",
              border: "none", borderRadius: "12px", cursor: availableBalance > 0 ? "pointer" : "not-allowed",
              fontWeight: 800, fontSize: "13px", display: "flex", alignItems: "center", gap: "6px",
              boxShadow: availableBalance > 0 ? "0 4px 12px rgba(248,68,100,0.3)" : "none",
            }}
          >
            <Plus size={16} /> Request Payout
          </button>
        </div>
      </div>

      {formSuccess && (
        <div style={{ padding: "14px 18px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", marginBottom: "20px", display: "flex", gap: "10px", alignItems: "center" }}>
          <CheckCircle2 size={18} style={{ color: "#22c55e", flexShrink: 0 }} />
          <p style={{ margin: 0, fontWeight: 700, fontSize: "14px", color: "#15803d" }}>Payout request submitted! We'll process it within 3-5 business days.</p>
        </div>
      )}

      {/* Payout Form */}
      {showForm && (
        <div style={{ background: "#fff", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "28px", marginBottom: "28px", boxShadow: "0 8px 24px rgba(0,0,0,0.04)" }}>
          <h4 style={{ margin: "0 0 20px", fontWeight: 900, fontSize: "16px", color: "#0f172a" }}>New Payout Request</h4>

          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={labelStyle}>Amount (₹) *</label>
                <input
                  type="number" required min="100" max={availableBalance}
                  value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder={`Max: ₹${availableBalance.toLocaleString("en-IN")}`}
                  style={inputStyle}
                />
                {form.amount > 0 && (
                  <p style={{ fontSize: "11px", color: "#94a3b8", margin: "4px 0 0" }}>
                    GST (18%): ₹{+(form.amount * 0.18).toFixed(2)} · Commission (5%): ₹{+(form.amount * 0.05).toFixed(2)} · <strong>Net: ₹{+(form.amount * 0.77).toFixed(2)}</strong>
                  </p>
                )}
              </div>
              <div>
                <label style={labelStyle}>Payment Mode *</label>
                <select value={form.payment_mode} onChange={e => setForm(f => ({ ...f, payment_mode: e.target.value }))} style={inputStyle}>
                  <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
                  <option value="upi">UPI</option>
                </select>
              </div>
            </div>

            {form.payment_mode === "bank_transfer" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={labelStyle}>Bank Name</label>
                  <input value={form.bank_name} onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))} placeholder="SBI, HDFC..." style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Account Number *</label>
                  <input required value={form.account_number} onChange={e => setForm(f => ({ ...f, account_number: e.target.value }))} placeholder="XXXXXXXXXX" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>IFSC Code *</label>
                  <input required value={form.ifsc_code} onChange={e => setForm(f => ({ ...f, ifsc_code: e.target.value }))} placeholder="SBIN0000001" style={inputStyle} />
                </div>
              </div>
            )}

            {form.payment_mode === "upi" && (
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>UPI ID *</label>
                <input required value={form.upi_id} onChange={e => setForm(f => ({ ...f, upi_id: e.target.value }))} placeholder="yourname@upi" style={{ ...inputStyle, maxWidth: "300px" }} />
              </div>
            )}

            {formError && (
              <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", marginBottom: "16px", display: "flex", gap: "8px", alignItems: "center" }}>
                <AlertCircle size={14} style={{ color: "#ef4444" }} />
                <p style={{ margin: 0, fontSize: "13px", color: "#ef4444", fontWeight: 600 }}>{formError}</p>
              </div>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="submit" disabled={submitting}
                style={{ padding: "12px 28px", background: "linear-gradient(135deg, #f84464, #c026d3)", color: "#fff", border: "none", borderRadius: "12px", fontWeight: 800, cursor: submitting ? "wait" : "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 12px rgba(248,68,100,0.3)" }}
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Banknote size={16} />}
                {submitting ? "Submitting..." : "Submit Request"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: "12px 20px", background: "#f1f5f9", border: "none", borderRadius: "12px", fontWeight: 700, cursor: "pointer", color: "#64748b" }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Payout History */}
      {loading ? (
        <div style={{ display: "grid", gap: "12px" }}>
          {[1,2,3].map(i => <div key={i} style={{ height: "80px", background: "#f8fafc", borderRadius: "14px" }} />)}
        </div>
      ) : payouts.length === 0 ? (
        <div style={{ padding: "60px", textAlign: "center", border: "1px dashed #e2e8f0", borderRadius: "16px" }}>
          <Wallet size={40} style={{ color: "#e2e8f0", marginBottom: "12px" }} />
          <p style={{ fontWeight: 700, color: "#94a3b8", margin: 0 }}>No payout requests yet</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {payouts.map(p => {
            const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending;
            const StatusIcon = cfg.icon;
            return (
              <div key={p.id} style={{ background: "#fff", border: "1px solid #f1f5f9", borderRadius: "14px", padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                  <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", color: cfg.color, flexShrink: 0 }}>
                    <StatusIcon size={18} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 900, fontSize: "15px", color: "#0f172a" }}>
                      ₹{p.amount?.toLocaleString("en-IN")} → Net ₹{p.net_amount?.toLocaleString("en-IN")}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>
                      {p.payment_mode?.replace("_", " ").toUpperCase()} · {new Date(p.created_at).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ padding: "5px 12px", borderRadius: "50px", background: cfg.bg, color: cfg.color, fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {cfg.label}
                  </span>
                  {p.transaction_ref && (
                    <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#94a3b8" }}>Ref: {p.transaction_ref}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const labelStyle = { display: "block", fontSize: "11px", fontWeight: 900, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" };
const inputStyle = { width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "14px", fontWeight: 600, outline: "none", boxSizing: "border-box", background: "#f8fafc" };
