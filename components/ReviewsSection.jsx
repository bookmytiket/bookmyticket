"use client";
import React, { useState, useEffect } from "react";
import { Star, ThumbsUp, Camera, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthContext";

function StarRating({ value, onChange, readonly = false, size = 24 }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: "4px" }}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          style={{
            background: "none", border: "none", cursor: readonly ? "default" : "pointer",
            padding: "2px", transition: "transform 0.15s",
            transform: !readonly && hovered >= star ? "scale(1.2)" : "scale(1)",
          }}
        >
          <Star
            size={size}
            fill={(hovered || value) >= star ? "#f59e0b" : "none"}
            stroke={(hovered || value) >= star ? "#f59e0b" : "#d1d5db"}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}

// ── Public Review Card ─────────────────────────────────────────────────────────
export function ReviewCard({ review }) {
  const initials = (review.profiles?.full_name || review.user_name || "U").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{
      background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9",
      padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{
            width: "40px", height: "40px", borderRadius: "50%",
            background: "linear-gradient(135deg, #f84464, #c026d3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 900, fontSize: "14px",
          }}>{initials}</div>
          <div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: "14px", color: "#0f172a" }}>
              {review.profiles?.full_name || "Verified Attendee"}
            </p>
            {review.is_verified && (
              <span style={{ fontSize: "10px", color: "#22c55e", fontWeight: 700, display: "flex", alignItems: "center", gap: "3px" }}>
                <CheckCircle2 size={10} /> Verified Booking
              </span>
            )}
          </div>
        </div>
        <StarRating value={review.rating} readonly size={14} />
      </div>
      {review.title && <p style={{ margin: "0 0 6px", fontWeight: 800, fontSize: "14px", color: "#0f172a" }}>{review.title}</p>}
      <p style={{ margin: 0, fontSize: "13px", color: "#64748b", lineHeight: 1.6, fontWeight: 500 }}>{review.content}</p>
      {review.organiser_reply && (
        <div style={{ marginTop: "12px", padding: "12px", background: "#f8fafc", borderRadius: "10px", borderLeft: "3px solid #c026d3" }}>
          <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: 900, color: "#c026d3", textTransform: "uppercase", letterSpacing: "0.05em" }}>Organiser Reply</p>
          <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>{review.organiser_reply}</p>
        </div>
      )}
      <p style={{ margin: "10px 0 0", fontSize: "11px", color: "#cbd5e1", fontWeight: 600 }}>
        {new Date(review.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
      </p>
    </div>
  );
}

// ── Write Review Modal ─────────────────────────────────────────────────────────
export function WriteReviewModal({ eventId, bookingId, onClose, onSubmit }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ rating: 0, title: "", content: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (form.rating === 0) { setError("Please select a star rating"); return; }
    if (form.content.length < 20) { setError("Review must be at least 20 characters"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/reviews/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: eventId,
          booking_id: bookingId || null,
          rating: form.rating,
          title: form.title || null,
          content: form.content,
          user_id: user.id
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit review");
      setDone(true);
      onSubmit?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
      zIndex: 11000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: "24px", padding: "32px", maxWidth: "480px", width: "100%",
        position: "relative", boxShadow: "0 40px 80px rgba(0,0,0,0.2)",
      }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
          <X size={20} />
        </button>

        {done ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <CheckCircle2 size={64} style={{ color: "#22c55e", marginBottom: "16px" }} />
            <h3 style={{ margin: "0 0 8px", fontWeight: 900, fontSize: "22px", color: "#0f172a" }}>Thank you!</h3>
            <p style={{ color: "#64748b", margin: "0 0 24px" }}>Your review has been submitted.</p>
            <button onClick={onClose} style={{ padding: "12px 32px", background: "linear-gradient(135deg, #f84464, #c026d3)", color: "#fff", border: "none", borderRadius: "50px", fontWeight: 800, cursor: "pointer" }}>
              Done
            </button>
          </div>
        ) : (
          <>
            <h3 style={{ margin: "0 0 6px", fontWeight: 900, fontSize: "20px", color: "#0f172a" }}>Write a Review</h3>
            <p style={{ margin: "0 0 24px", color: "#94a3b8", fontSize: "13px", fontWeight: 600 }}>Share your experience with the community</p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 900, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>Your Rating *</label>
                <StarRating value={form.rating} onChange={r => setForm(f => ({ ...f, rating: r }))} size={32} />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 900, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Review Title</label>
                <input
                  value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Summarize your experience..."
                  style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "14px", fontWeight: 600, outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 900, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Your Review *</label>
                <textarea
                  required value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="Tell others what you loved, what could be improved..."
                  rows={4}
                  style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "14px", fontWeight: 500, outline: "none", resize: "vertical", boxSizing: "border-box" }}
                />
                <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#94a3b8" }}>{form.content.length} / 20 min characters</p>
              </div>

              {error && (
                <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", marginBottom: "16px", display: "flex", gap: "8px", alignItems: "center" }}>
                  <AlertCircle size={14} style={{ color: "#ef4444", flexShrink: 0 }} />
                  <p style={{ margin: 0, fontSize: "13px", color: "#ef4444", fontWeight: 600 }}>{error}</p>
                </div>
              )}

              <button
                type="submit" disabled={loading}
                style={{
                  width: "100%", padding: "14px", background: "linear-gradient(135deg, #f84464, #c026d3)",
                  color: "#fff", border: "none", borderRadius: "14px", fontWeight: 900, fontSize: "14px",
                  cursor: loading ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  boxShadow: "0 8px 20px rgba(248,68,100,0.3)",
                }}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : "Submit Review"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ── Reviews List Section ───────────────────────────────────────────────────────
export default function ReviewsSection({ eventId, bookingId }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [userReview, setUserReview] = useState(null);

  useEffect(() => {
    if (!eventId) return;
    supabase.from("reviews")
      .select("*, profiles(full_name, avatar_url)")
      .eq("event_id", eventId)
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => { setReviews(data || []); setLoading(false); });
  }, [eventId]);

  useEffect(() => {
    if (!user?.id || !eventId) return;
    supabase.from("reviews").select("id").eq("event_id", eventId).eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setUserReview(data));
  }, [user?.id, eventId]);

  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 0;

  return (
    <div>
      {/* Summary */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h3 style={{ margin: "0 0 4px", fontWeight: 900, fontSize: "20px", color: "#0f172a" }}>
            Reviews {reviews.length > 0 && <span style={{ color: "#94a3b8", fontWeight: 600, fontSize: "16px" }}>({reviews.length})</span>}
          </h3>
          {reviews.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <StarRating value={Math.round(avg)} readonly size={16} />
              <span style={{ fontWeight: 800, color: "#0f172a" }}>{avg}</span>
              <span style={{ color: "#94a3b8", fontSize: "13px" }}>out of 5</span>
            </div>
          )}
        </div>
        {user && !userReview && (
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: "10px 20px", background: "linear-gradient(135deg, #f84464, #c026d3)",
              color: "#fff", border: "none", borderRadius: "50px", fontWeight: 800,
              fontSize: "13px", cursor: "pointer", boxShadow: "0 4px 12px rgba(248,68,100,0.3)",
            }}
          >
            ✏️ Write a Review
          </button>
        )}
      </div>

      {/* Reviews Grid */}
      {loading ? (
        <div style={{ display: "grid", gap: "16px" }}>
          {[1,2].map(i => <div key={i} style={{ height: "120px", background: "#f8fafc", borderRadius: "16px", animation: "pulse 1.5s infinite" }} />)}
        </div>
      ) : reviews.length === 0 ? (
        <div style={{ padding: "40px", textAlign: "center", border: "1px dashed #e2e8f0", borderRadius: "16px" }}>
          <Star size={36} style={{ color: "#e2e8f0", marginBottom: "12px" }} />
          <p style={{ fontWeight: 700, color: "#94a3b8", margin: 0 }}>No reviews yet</p>
          <p style={{ fontSize: "13px", color: "#cbd5e1", margin: "4px 0 0" }}>Be the first to share your experience</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
        </div>
      )}

      {showModal && (
        <WriteReviewModal
          eventId={eventId}
          bookingId={bookingId}
          onClose={() => setShowModal(false)}
          onSubmit={() => {
            setShowModal(false);
            setUserReview({ id: "new" });
            supabase.from("reviews").select("*, profiles(full_name)").eq("event_id", eventId).eq("is_approved", true).order("created_at", { ascending: false })
              .then(({ data }) => setReviews(data || []));
          }}
        />
      )}
    </div>
  );
}
