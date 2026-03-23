"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X, Check, Trash2 } from "lucide-react";

export default function CookieNotification() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("bmt_cookie_consent");
    if (!consent) {
      setShow(true);
    }
  }, []);

  const clearBrowserStorage = () => {
    // Save consent first as we are clearing everything
    sessionStorage.clear();
    localStorage.clear();
  };

  const handleProceed = () => {
    clearBrowserStorage();
    localStorage.setItem("bmt_cookie_consent", "accepted");
    setShow(false);
    // Refresh to ensure all states are clean
    window.location.reload();
  };

  const handleCancel = () => {
    localStorage.setItem("bmt_cookie_consent", "rejected");
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 10001,
            width: "min(400px, 90vw)",
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(12px)",
            borderRadius: "20px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
            border: "1px solid rgba(0,0,0,0.05)",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
            <div
              style={{
                background: "#f84464",
                borderRadius: "12px",
                padding: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
              }}
            >
              <Cookie size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: "17px",
                  fontWeight: 700,
                  color: "#1f2937",
                  marginBottom: "4px",
                }}
              >
                Cookie Settings & Privacy
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  lineHeight: "1.5",
                  color: "#6b7280",
                }}
              >
                We use cookies to improve your experience. Proceeding will also{" "}
                <span style={{ fontWeight: 600, color: "#ef4444" }}>
                  clear previous cache
                </span>{" "}
                for a secure login.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={handleProceed}
              style={{
                flex: 1,
                background: "#f84464",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                padding: "12px 16px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "transform 0.2s, background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <Trash2 size={16} />
              Proceed & Clear
            </button>
            <button
              onClick={handleCancel}
              style={{
                background: "#f3f4f6",
                color: "#4b5563",
                border: "none",
                borderRadius: "12px",
                padding: "12px 20px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#e5e7eb")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#f3f4f6")}
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
