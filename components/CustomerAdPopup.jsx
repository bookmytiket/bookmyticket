"use client";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Sparkles } from "lucide-react";
import { useSupabaseQuery } from "@/hooks/useSupabase";
import { useAuth } from "./AuthContext";
import { resolveBannerRedirect } from "@/lib/bannerHelper";

const STORAGE_PREFIX = "bmt_adpopup_";
const LAST_ID_KEY = `${STORAGE_PREFIX}last_id`;
const INITIAL_DELAY_MS = 3000; // show 3s after login/page load
const SESSION_SHOWN_KEY = `${STORAGE_PREFIX}shown_this_tab`;

function shouldShowPopup(popupId, showEveryMinutes) {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}seen_${popupId}`);
    if (!raw) return true; // never seen
    const lastSeen = parseInt(raw, 10);
    const ageMs = Date.now() - lastSeen;
    const intervalMs = showEveryMinutes * 60 * 1000;
    return ageMs >= intervalMs;
  } catch {
    return true;
  }
}

function markPopupSeen(popupId) {
  try {
    const now = String(Date.now());
    localStorage.setItem(`${STORAGE_PREFIX}seen_${popupId}`, now);
    localStorage.setItem(LAST_ID_KEY, popupId);
  } catch {}
}

const DEFAULT_GRADIENTS = [
  "linear-gradient(135deg, #f84464 0%, #c026d3 100%)",
  "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
  "linear-gradient(135deg, #f97316 0%, #ef4444 100%)",
  "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
  "linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)",
];

export default function CustomerAdPopup() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();
  
  const { data: activePopupsRaw, error: popupError } = useSupabaseQuery('ad_popups', (q) => q.select('*').eq('is_active', true), []);
  
  // Constants
  const SESSION_SHOWN_KEY = "bmt_ad_shown_this_session";
  const LAST_ID_KEY = "bmt_last_ad_index";
  const INITIAL_DELAY_MS = 2500; // Show after 2.5s on home page
  const DISPLAY_DURATION_MS = 5000; // 5s visibility

  const activePopups = useMemo(() => {
    if (popupError || !activePopupsRaw) return [];
    return activePopupsRaw.map(p => ({
       ...p,
       imageUrl: p.image_url,
       ctaText: p.cta_text,
       badgeText: p.badge_text,
       bgColor: p.bg_color,
       showEveryMinutes: p.show_every_minutes,
       redirectUrl: p.redirect_url,
       redirectType: p.redirect_type,
       redirectId: p.redirect_id
    }));
  }, [activePopupsRaw, popupError]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [currentPopup, setCurrentPopup] = useState(null);
  const [timeLeft, setTimeLeft] = useState(5);
  const [progress, setProgress] = useState(100);
  const hasTriggered = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine which popup to show next (Mixed Rotation logic)
  const findNextPopup = useCallback(
    (popups) => {
      if (!popups?.length || typeof window === "undefined") return null;
      
      const lastIndexRaw = localStorage.getItem(`${LAST_ID_KEY}_index`);
      const lastIndex = lastIndexRaw ? parseInt(lastIndexRaw, 10) : -1;
      const nextIndex = (lastIndex + 1) % popups.length;
      
      localStorage.setItem(`${LAST_ID_KEY}_index`, String(nextIndex));
      return { popup: popups[nextIndex], index: nextIndex };
    },
    []
  );
 
  // Trigger popup on page load or when user logs in
  useEffect(() => {
    // Only trigger on Home Page as requested
    if (!mounted || !activePopups.length || hasTriggered.current || pathname !== "/") return;
    
    // Check if shown in this session
    if (typeof window !== "undefined" && sessionStorage.getItem(SESSION_SHOWN_KEY)) return;

    const timer = setTimeout(() => {
      const result = findNextPopup(activePopups);
      if (result) {
        setCurrentPopup(result.popup);
        setCurrentIndex(result.index);
        setVisible(true);
        hasTriggered.current = true;
        
        // Mark as shown in session
        if (typeof window !== "undefined") {
          sessionStorage.setItem(SESSION_SHOWN_KEY, "true");
        }
      }
    }, INITIAL_DELAY_MS);

    return () => clearTimeout(timer);
  }, [mounted, activePopups.length, user, findNextPopup, pathname]);
 
  const handleClose = useCallback(() => {
    if (currentPopup) markPopupSeen(currentPopup.id);
    setVisible(false);
  }, [currentPopup]);

  // Auto-close timer
  useEffect(() => {
    if (!visible) return;

    setTimeLeft(DISPLAY_DURATION_MS / 1000);
    setProgress(100);

    const timer = setTimeout(() => {
      handleClose();
    }, DISPLAY_DURATION_MS);

    const progressTimer = setInterval(() => {
      setProgress((prev) => Math.max(0, prev - (100 / (DISPLAY_DURATION_MS / 100))));
    }, 100);

    const countdownTimer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(progressTimer);
      clearInterval(countdownTimer);
    };
  }, [visible, handleClose]);

  const handleCTA = useCallback(() => {
    const targetUrl = resolveBannerRedirect(
      currentPopup?.redirectType,
      currentPopup?.redirectId,
      currentPopup?.redirectUrl
    );
    
    if (targetUrl && targetUrl !== "#") {
      if (targetUrl.startsWith('http')) {
        window.open(targetUrl, "_blank", "noopener,noreferrer");
      } else {
        // For local routes, we can use router.push if we had it, 
        // but since this is a global popup, we might use window.location or import useRouter.
        // Let's use window.location.href for simplicity or check if we can use router.
        window.location.href = targetUrl;
      }
    }
    handleClose();
  }, [currentPopup, handleClose]);

  if (!mounted || !currentPopup) return null;
  if (pathname?.startsWith("/vendor")) return null;

  const gradientBg =
    currentPopup.bgColor ||
    DEFAULT_GRADIENTS[currentIndex % DEFAULT_GRADIENTS.length];
  const hasImage = !!currentPopup.imageUrl;

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={handleClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.65)",
              backdropFilter: "blur(6px)",
              zIndex: 9998,
              cursor: "pointer",
            }}
          />

          {/* Popup Card */}
          <motion.div
            key="popup"
            initial={{ opacity: 0, scale: 0.85, x: "-50%", y: "-40%" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            exit={{ opacity: 0, scale: 0.9, x: "-50%", y: "-40%" }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              zIndex: 9999,
              width: "min(92vw, 460px)",
              borderRadius: "24px",
              overflow: "hidden",
              boxShadow: "0 32px 80px rgba(0,0,0,0.35)",
              background: "#fff",
            }}
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              style={{
                position: "absolute",
                top: "14px",
                right: "14px",
                zIndex: 10,
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.92)",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                transition: "transform 0.2s, background 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.1)";
                e.currentTarget.style.background = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
              aria-label="Close advertisement"
            >
              <X size={16} color="#374151" />
            </button>

            {/* Hero Section */}
            <div
              style={{
                position: "relative",
                height: hasImage ? "220px" : "160px",
                background: hasImage ? "#0f172a" : (currentPopup.bgColor || gradientBg),
                overflow: "hidden",
              }}
            >
              {hasImage ? (
                <img
                  src={currentPopup.imageUrl}
                  alt={currentPopup.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: 0.85,
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.parentElement.style.background = gradientBg;
                  }}
                />
              ) : null}

              {/* Overlay shimmer on image */}
              {hasImage && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%)",
                  }}
                />
              )}

              {/* Badge */}
              {currentPopup.badgeText && (
                <motion.div
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  style={{
                    position: "absolute",
                    top: "18px",
                    left: "18px",
                    background: "rgba(255,255,255,0.2)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.35)",
                    borderRadius: "20px",
                    padding: "5px 14px",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <Sparkles size={12} />
                  {currentPopup.badgeText}
                </motion.div>
              )}

              {/* Title over image or gradient */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                style={{
                  position: "absolute",
                  bottom: "18px",
                  left: "20px",
                  right: "50px",
                }}
              >
                <p
                  style={{
                    color: "rgba(255,255,255,0.85)",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    marginBottom: "4px",
                  }}
                >
                  Special Offer
                </p>
                <h2
                  style={{
                    color: "#fff",
                    fontSize: "22px",
                    fontWeight: 900,
                    lineHeight: 1.15,
                    margin: 0,
                    textShadow: "0 2px 8px rgba(0,0,0,0.3)",
                  }}
                >
                  {currentPopup.title}
                </h2>
              </motion.div>
            </div>

            {/* Body */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{ padding: "22px 24px 28px" }}
            >
              {currentPopup.description && (
                <p
                  style={{
                    color: "#4b5563",
                    fontSize: "15px",
                    lineHeight: 1.6,
                    marginBottom: "20px",
                    marginTop: 0,
                  }}
                >
                  {currentPopup.description}
                </p>
              )}

              {/* CTA Button */}
              {currentPopup.redirectUrl && (
                <button
                  onClick={handleCTA}
                  style={{
                    width: "100%",
                    background: gradientBg,
                    color: "#fff",
                    border: "none",
                    borderRadius: "14px",
                    padding: "15px 24px",
                    fontSize: "16px",
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
                    transition: "transform 0.18s, box-shadow 0.18s",
                    letterSpacing: "0.01em",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 8px 28px rgba(0,0,0,0.24)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 20px rgba(0,0,0,0.18)";
                  }}
                >
                  {currentPopup.ctaText || "Book Now"}
                  <ExternalLink size={16} />
                </button>
              )}

              {/* Skip link */}
              <button
                onClick={handleClose}
                style={{
                  display: "block",
                  width: "100%",
                  marginTop: "12px",
                  background: "none",
                  border: "none",
                  color: "#9ca3af",
                  fontSize: "13px",
                  cursor: "pointer",
                  padding: "4px",
                  textAlign: "center",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#6b7280")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
              >
                No thanks, maybe later
              </button>
            </motion.div>

            {/* Auto-close Progress Bar */}
            <div style={{ width: "100%", height: "4px", background: "#f3f4f6", position: "relative" }}>
              <motion.div 
                initial={{ width: "100%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
                style={{ 
                  height: "100%", 
                  background: gradientBg, 
                  position: "absolute",
                  left: 0,
                  top: 0
                }} 
              />
            </div>
            
            <div style={{ textAlign: "center", padding: "8px 0", fontSize: "11px", color: "#9ca3af", fontWeight: 600 }}>
              Closing in {timeLeft}s
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
