"use client";

const SPONSORS = [];

// Duplicate for seamless infinite scroll
const DOUBLED = [...SPONSORS, ...SPONSORS];

export default function Sponsors() {
    if (SPONSORS.length === 0) return null;
    return (
        <section style={{ width: "100%", background: "#f8fafc", padding: "48px 0", overflow: "hidden" }}>
            <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "0 20px 0", textAlign: "center", marginBottom: "32px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.1em" }}>✦ Partners</span>
                <h2 style={{
                    fontSize: "28px",
                    fontWeight: 900,
                    color: "#111827",
                    margin: "8px 0 0",
                    fontFamily: "var(--font-heading)",
                    letterSpacing: "-0.04em",
                    lineHeight: 1.1
                }}>
                    Our Official <span style={{
                        background: 'linear-gradient(135deg, #f84464 0%, #c026d3 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        display: 'inline-block'
                    }}>Sponsors</span>
                </h2>
            </div>

            {/* Infinite scroll ribbon */}
            <div style={{ width: "100%", overflow: "hidden", position: "relative" }}>
                {/* Left fade */}
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "80px", background: "linear-gradient(to right, #f8fafc, transparent)", zIndex: 2 }} />
                {/* Right fade */}
                <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "80px", background: "linear-gradient(to left, #f8fafc, transparent)", zIndex: 2 }} />

                <div style={{
                    display: "flex",
                    gap: "40px",
                    animation: "sponsorScroll 22s linear infinite",
                    width: "max-content",
                    alignItems: "center",
                }}>
                    {DOUBLED.map((s, i) => (
                        <div key={`${s.id}-${i}`} style={{
                            flexShrink: 0,
                            padding: "12px 24px",
                            background: "#fff",
                            borderRadius: "12px",
                            border: "1px solid #e5e7eb",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            transition: "all 0.3s ease",
                            cursor: "pointer",
                            height: "64px",
                            minWidth: "140px",
                        }}
                            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(99,102,241,0.15)"; e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.querySelector("img").style.filter = "none"; e.currentTarget.querySelector("img").style.opacity = "1"; }}
                            onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.querySelector("img").style.filter = "grayscale(100%)"; e.currentTarget.querySelector("img").style.opacity = "0.55"; }}
                        >
                            <img
                                src={s.logo}
                                alt={s.name}
                                style={{
                                    maxHeight: "36px", maxWidth: "120px", objectFit: "contain",
                                    filter: "grayscale(100%)", opacity: "0.55",
                                    transition: "all 0.3s ease",
                                }}
                                onError={e => { e.currentTarget.style.display = "none"; e.currentTarget.parentElement.querySelector("span") && (e.currentTarget.parentElement.querySelector("span").style.display = "block"); }}
                            />
                            <span style={{ display: "none", fontWeight: 800, color: "#6b7280", fontSize: "14px" }}>{s.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
        @keyframes sponsorScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
        </section>
    );
}
