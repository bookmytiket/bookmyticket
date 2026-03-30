"use client";

import Link from "next/link";

export default function ServicesPage() {
  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 18px" }}>
      <h1 style={{ fontSize: 34, fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 10 }}>
        Services
      </h1>
      <p style={{ color: "#475569", marginBottom: 18 }}>
        This page is a placeholder for your services content.
      </p>
      <Link href="/" style={{ color: "#f84464", fontWeight: 800, textDecoration: "none" }}>
        ← Back to events
      </Link>
    </main>
  );
}

