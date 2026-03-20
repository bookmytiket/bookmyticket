"use client";
import { useState } from "react";

// --- Confetti ---
function Confetti() {
  const pieces = ['🎉', '🎊', '✨', '🎈', '⭐', '💫', '🎁', '🌟'];
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
      {Array.from({ length: 24 }).map((_, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            fontSize: Math.random() * 14 + 10,
            top: `${Math.random() * 60}%`,
            left: `${Math.random() * 100}%`,
            animation: `fall ${Math.random() * 2 + 1}s ease-in forwards`,
            opacity: 1,
          }}
        >
          {pieces[i % pieces.length]}
        </span>
      ))}
      <style>{`
        @keyframes fall {
          0% { transform: translateY(-40px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(200px) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// --- Success Modal (after Get Code) ---
function SuccessModal({ coupon, onClose }) {
  const [copied, setCopied] = useState(false);
  const code = coupon.couponCode || "COUPONCODE";

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRedeem = () => {
    if (coupon.redirectUrl) window.open(coupon.redirectUrl, "_blank");
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 9999, backdropFilter: "blur(4px)"
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 20,
          padding: "40px 36px 32px",
          width: "100%", maxWidth: 420,
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        <Confetti />
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 14, right: 16,
            background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af",
            zIndex: 1
          }}
        >×</button>

        <div style={{ fontSize: 40, marginBottom: 12, position: "relative", zIndex: 1 }}>🎉</div>
        <h3 style={{ fontSize: 22, fontWeight: 900, color: "#111827", margin: "0 0 6px", position: "relative", zIndex: 1 }}>
          Purchase Successful!
        </h3>
        <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 24px", position: "relative", zIndex: 1 }}>
          Your coupon is ready to use.
        </p>

        {/* Coupon Code Box */}
        <div style={{
          border: "2px dashed #f97316",
          borderRadius: 12,
          padding: "14px 20px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          background: "#fff7ed",
          position: "relative", zIndex: 1
        }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", marginBottom: 4 }}>
              COUPON CODE
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#f97316", letterSpacing: 1 }}>
              {code}
            </div>
          </div>
          <button
            onClick={handleCopy}
            style={{
              background: "none", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 4,
              fontSize: 13, color: copied ? "#16a34a" : "#6366f1", fontWeight: 700
            }}
          >
            {copied ? "✓ Copied!" : "⎘ Copy"}
          </button>
        </div>

        {/* Redeem Now */}
        <button
          onClick={handleRedeem}
          style={{
            width: "100%",
            background: "linear-gradient(90deg, #f97316 0%, #ef4444 100%)",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: "14px",
            fontSize: 15,
            fontWeight: 800,
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            position: "relative", zIndex: 1
          }}
        >
          Redeem Now ↗
        </button>
      </div>
    </div>
  );
}

// --- Coupon Detail Modal ---
function CouponDetailModal({ coupon, onClose }) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [openSection, setOpenSection] = useState(null);

  const daysLeft = Math.max(0, Math.round((coupon.endDate - Date.now()) / (1000 * 60 * 60 * 24)));
  const expiryDate = new Date(coupon.endDate).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9000, backdropFilter: "blur(6px)", padding: 20
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: "#f9f9fb",
            borderRadius: 20,
            width: "100%", maxWidth: 860,
            display: "flex",
            overflow: "hidden",
            boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
            maxHeight: "90vh",
            overflowY: "auto",
          }}
        >
          {/* Left Panel */}
          <div style={{ flex: 1.2, padding: 28, display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Banner */}
            <div style={{
              borderRadius: 14,
              overflow: "hidden",
              height: 200,
              background: coupon.bannerUrl ? `url(${coupon.bannerUrl}) center/cover` : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              position: "relative",
            }}>
              {!coupon.bannerUrl && (
                <div style={{
                  position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: 18, fontWeight: 800, padding: 20, textAlign: "center"
                }}>
                  {coupon.title}
                </div>
              )}
            </div>

            {/* Brand Info */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {coupon.logoUrl ? (
                  <img src={coupon.logoUrl} alt="brand" style={{ width: 40, height: 40, objectFit: "contain", borderRadius: 8, border: "1px solid #e5e7eb", padding: 4 }} />
                ) : (
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 14 }}>
                    {(coupon.brandName || "B")[0]}
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{coupon.brandName || "Partner Brand"}</div>
                  <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                    ✓ verified partner
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}>
                🕐 {daysLeft} days left
              </div>
            </div>

            <h2 style={{ fontSize: 18, fontWeight: 900, color: "#111827", margin: 0 }}>{coupon.title}</h2>
            <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.6, margin: 0 }}>{coupon.description}</p>

            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6b7280", borderTop: "1px solid #f0f0f0", paddingTop: 10 }}>
              📅 Expires on: <strong>{expiryDate}</strong>
            </div>
          </div>

          {/* Right Panel */}
          <div style={{ flex: 1, background: "#fff", padding: 28, display: "flex", flexDirection: "column", gap: 20, borderLeft: "1px solid #f0f0f0" }}>
            {/* Get Code Section */}
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 12 }}>Avail Your Coupon Code</div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{
                  flex: 1, background: "#f3f4f6", borderRadius: 8, padding: "10px 14px",
                  letterSpacing: 5, textAlign: "center", color: "#9ca3af", fontSize: 15, userSelect: "none"
                }}>
                  {"•".repeat(coupon.couponCode?.length || 10)}
                </div>
                <button
                  onClick={() => setShowSuccess(true)}
                  style={{
                    background: "#1e3a8a",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "10px 18px",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                    whiteSpace: "nowrap"
                  }}
                >
                  Get Code
                </button>
              </div>
            </div>

            {/* Accordions */}
            {[
              { key: "desc", label: "🎁 Description", content: coupon.description },
              { key: "redeem", label: "🎟 How To Redeem", content: coupon.howToRedeem || "1. Click 'Get Code' to reveal your coupon code.\n2. Visit the brand's website using 'Redeem Now'.\n3. Apply the code at checkout to avail the discount." },
              { key: "terms", label: "⚠️ Terms & Conditions", content: coupon.termsAndConditions || "Valid for new and existing customers. Cannot be combined with other offers. Valid until the expiry date." },
            ].map(({ key, label, content }) => (
              <div key={key} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <button
                  onClick={() => setOpenSection(openSection === key ? null : key)}
                  style={{
                    width: "100%", background: "none", border: "none", cursor: "pointer",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "12px 0", fontSize: 13, fontWeight: 700, color: "#374151"
                  }}
                >
                  {label}
                  <span style={{ fontSize: 16, color: "#9ca3af" }}>{openSection === key ? "▲" : "▼"}</span>
                </button>
                {openSection === key && (
                  <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.7, margin: "0 0 12px", whiteSpace: "pre-line" }}>
                    {content}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 16, right: 20, background: "rgba(0,0,0,0.4)",
              border: "none", borderRadius: "50%", width: 32, height: 32,
              color: "#fff", fontSize: 18, cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center"
            }}
          >×</button>
        </div>
      </div>

      {showSuccess && <SuccessModal coupon={coupon} onClose={() => { setShowSuccess(false); onClose(); }} />}
    </>
  );
}

// --- Coupon Ad Card (Reference style) ---
function CouponCard({ coupon, onClick }) {
  const daysLeft = Math.max(0, Math.round((coupon.endDate - Date.now()) / (1000 * 60 * 60 * 24)));
  const discountLabel = coupon.discountType === "Percentage"
    ? `${coupon.discountValue}% OFF`
    : `₹${coupon.discountValue} OFF`;

  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: 16,
        overflow: "hidden",
        background: "#fff",
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        cursor: "pointer",
        transition: "transform 0.2s, box-shadow 0.2s",
        display: "flex",
        flexDirection: "column",
        flex: "0 0 240px",
        maxWidth: 255,
        border: "1px solid #f0f0f0",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-5px)";
        e.currentTarget.style.boxShadow = "0 10px 28px rgba(0,0,0,0.14)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.08)";
      }}
    >
      {/* Banner Image */}
      <div style={{
        height: 120,
        background: coupon.bannerUrl
          ? `url(${coupon.bannerUrl}) center/cover`
          : "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Logo inside banner */}
        {coupon.logoUrl && (
          <div style={{
            position: "absolute", top: 8, left: 8,
            background: "#fff",
            borderRadius: 8,
            padding: "4px 8px",
            display: "flex", alignItems: "center", gap: 6,
            boxShadow: "0 1px 4px rgba(0,0,0,0.15)"
          }}>
            <img src={coupon.logoUrl} alt="logo" style={{ height: 18, objectFit: "contain" }} />
          </div>
        )}
        {/* Discount sticker badge */}
        <div style={{
          position: "absolute", top: 8, right: 8,
          background: "#fff",
          borderRadius: 6,
          padding: "3px 8px",
          fontSize: 11,
          fontWeight: 900,
          color: "#7c3aed",
          boxShadow: "0 1px 4px rgba(0,0,0,0.15)"
        }}>
          {discountLabel}
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: "12px 14px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Brand name */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          {coupon.logoUrl ? (
            <img src={coupon.logoUrl} alt="brand" style={{ height: 16, objectFit: "contain" }} />
          ) : null}
          <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
            {coupon.brandName || "Partner Brand"}
          </span>
        </div>

        {/* Title */}
        <div style={{ fontSize: 14, fontWeight: 800, color: "#111827", lineHeight: 1.35, marginBottom: 6 }}>
          {coupon.title}
        </div>

        {/* Description */}
        <div style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.5, flexGrow: 1 }}>
          {coupon.description?.slice(0, 65)}{coupon.description?.length > 65 ? "…" : ""}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
          <span style={{ fontSize: 10, color: "#9ca3af" }}>
            {daysLeft > 0 ? `${daysLeft} days left` : "Ends today!"}
          </span>
          <span style={{
            fontSize: 10,
            background: coupon.redemptionMethod === "Online" ? "#eff6ff" : "#f0fdf4",
            color: coupon.redemptionMethod === "Online" ? "#2563eb" : "#16a34a",
            borderRadius: 4,
            padding: "2px 7px",
            fontWeight: 700,
          }}>
            {coupon.redemptionMethod}
          </span>
        </div>
      </div>
    </div>
  );
}

// --- Main Export ---
export default function BrandCouponsSection({ coupons, title = "Exclusive Brand Coupons", subtitle = "Save more with special offers from our partner brands" }) {
  const [selected, setSelected] = useState(null);

  if (!coupons || coupons.length === 0) return null;

  return (
    <>
      <section style={{
        width: "100%",
        padding: "48px 0 40px",
        background: "#fff",
        borderTop: "1px solid #f0f0f0",
      }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          {/* Section Header */}
          <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 22 }}>🏷️</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "1.2px" }}>
                  Partner Deals
                </span>
              </div>
              <h2 style={{ fontSize: 26, fontWeight: 900, color: "#111827", margin: 0, lineHeight: 1.2 }}>
                {title}
              </h2>
              <p style={{ fontSize: 14, color: "#6b7280", marginTop: 4, margin: 0 }}>
                {subtitle}
              </p>
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>
              {coupons.length} active deal{coupons.length !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Scrollable Cards */}
          <div style={{
            display: "flex",
            gap: 18,
            overflowX: "auto",
            paddingBottom: 12,
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}>
            {coupons.map((coupon) => (
              <CouponCard
                key={coupon._id}
                coupon={coupon}
                onClick={() => setSelected(coupon)}
              />
            ))}
          </div>
        </div>
      </section>

      {selected && (
        <CouponDetailModal
          coupon={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
