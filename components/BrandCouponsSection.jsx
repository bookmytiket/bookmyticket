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
