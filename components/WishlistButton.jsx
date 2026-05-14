"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Heart, Bookmark, BookmarkCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthContext";

export default function WishlistButton({ eventId, size = 20, className = "" }) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.id || !eventId) return;
    supabase
      .from("user_wishlists")
      .select("id")
      .eq("user_id", user.id)
      .eq("event_id", eventId)
      .maybeSingle()
      .then(({ data }) => setSaved(!!data));
  }, [user?.id, eventId]);

  const toggle = useCallback(async (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) {
      window.location.href = "/signin?redirect=" + encodeURIComponent(window.location.pathname);
      return;
    }
    setLoading(true);
    if (saved) {
      await supabase.from("user_wishlists").delete().eq("user_id", user.id).eq("event_id", eventId);
      setSaved(false);
    } else {
      await supabase.from("user_wishlists").insert({ user_id: user.id, event_id: eventId });
      setSaved(true);
    }
    setLoading(false);
  }, [user, eventId, saved]);

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={className}
      title={saved ? "Remove from Wishlist" : "Save to Wishlist"}
      style={{
        background: saved ? "linear-gradient(135deg, #f84464, #c026d3)" : "rgba(255,255,255,0.9)",
        border: "none",
        borderRadius: "50%",
        width: size + 16,
        height: size + 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: loading ? "wait" : "pointer",
        transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: saved ? "0 4px 12px rgba(248,68,100,0.35)" : "0 2px 8px rgba(0,0,0,0.12)",
        transform: loading ? "scale(0.9)" : "scale(1)",
        backdropFilter: "blur(8px)",
      }}
    >
      <Bookmark
        size={size}
        fill={saved ? "#fff" : "none"}
        stroke={saved ? "#fff" : "#64748b"}
        strokeWidth={2}
      />
    </button>
  );
}
