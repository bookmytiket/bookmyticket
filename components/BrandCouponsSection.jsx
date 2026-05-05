"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, Calendar, Gift, Ticket, AlertTriangle, 
  ChevronDown, Check, Copy 
} from "lucide-react";
import CouponModal from "./CouponModal";


// --- Coupon Ad Card (Reference style) ---
function CouponCard({ coupon, onClick }) {
  const daysLeft = Math.max(0, Math.round(((coupon.endDate || Date.now()) - Date.now()) / (1000 * 60 * 60 * 24)));
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
        flexDirection: "row",
        flex: "0 0 380px",
        width: 380,
        height: 140,
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
      {/* Landscape Image - Left Side */}
      <div style={{
        width: 140,
        height: "100%",
        background: coupon.bannerUrl
          ? `url(${coupon.bannerUrl}) center/cover`
          : "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
        position: "relative",
        overflow: "hidden",
        flexShrink: 0
      }}>
        {/* Logo sticker badge */}
        {coupon.logoUrl && (
          <div style={{
            position: "absolute", top: 8, left: 8,
            background: "rgba(255,255,255,0.9)",
            borderRadius: 6,
            padding: "4px",
            display: "flex", alignItems: "center",
            boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
            backdropFilter: "blur(4px)"
          }}>
            <img src={coupon.logoUrl} alt="logo" style={{ height: 14, objectFit: "contain" }} />
          </div>
        )}
      </div>

      {/* Card body - Right Side */}
      <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          {/* Brand & Discount Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#f84464", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {coupon.brandName || "Partner"}
            </span>
            <span style={{
              background: "linear-gradient(135deg, #f84464 0%, #c026d3 100%)",
              borderRadius: 6,
              padding: "2px 8px",
              fontSize: 10,
              fontWeight: 900,
              color: "#fff",
            }}>
              {discountLabel}
            </span>
          </div>

          {/* Title */}
          <div style={{ fontSize: 14, fontWeight: 800, color: "#111827", lineHeight: 1.3, marginBottom: 4, display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {coupon.title}
          </div>

          {/* Description */}
          <div style={{ fontSize: 10, color: "#6b7280", lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {coupon.description}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid #f9fafb" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af" }}>
            {daysLeft > 0 ? `${daysLeft}D Left` : "Ends Today"}
          </span>
          <span style={{
            fontSize: 10,
            color: "#f84464",
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.5px"
          }}>
            GET DEAL →
          </span>
        </div>
      </div>
    </div>
  );
}

// --- Main Export ---
export default function BrandCouponsSection({ coupons, title = "Exclusive Brand Coupons", subtitle = "Save more with special offers from our partner brands" }) {
  const router = useRouter();
  const [selectedCoupon, setSelectedCoupon] = useState(null);

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
              <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#111827', margin: 0, letterSpacing: '-0.04em', lineHeight: 1.1, fontFamily: 'var(--font-heading)' }}>
                {(() => {
                  const words = title.split(' ');
                  const last = words.pop();
                  return (
                    <>
                      {words.join(' ')}{words.length > 0 ? ' ' : ''}
                      <span style={{
                        background: 'linear-gradient(135deg, #f84464 0%, #c026d3 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        display: 'inline-block'
                      }}>{last}</span>
                    </>
                  );
                })()}
              </h2>
              <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: 4, margin: 0, fontWeight: 500 }}>
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
                onClick={() => setSelectedCoupon(coupon)}
              />
            ))}
          </div>
        </div>
      </section>
      
      <CouponModal 
        coupon={selectedCoupon} 
        onClose={() => setSelectedCoupon(null)} 
      />
    </>
  );
}
