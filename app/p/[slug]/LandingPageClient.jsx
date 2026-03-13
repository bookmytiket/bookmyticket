"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function LandingPageClient({ slug }) {
    const page = useQuery(api.pages.getBySlug, { slug });

    if (page === undefined) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#0f172a", color: "#fff" }}>
                <p>Loading...</p>
            </div>
        );
    }

    if (!page) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", flexWrap: "wrap", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#0f172a", color: "#fff" }}>
                <Navbar />
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <h1 style={{ fontSize: "2rem" }}>404 - Page Not Found</h1>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#0f172a", color: "#fff" }}>
            <Navbar />
            <div style={{
                flex: 1,
                maxWidth: "1000px",
                margin: "120px auto 60px",
                padding: "0 20px",
                width: "100%"
            }}>
                <h1 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "40px", textAlign: "center", background: "linear-gradient(to right, #6366f1, #a5b4fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    {page.title}
                </h1>
                <div
                    className="prose prose-invert max-w-none"
                    style={{
                        lineHeight: "1.8",
                        fontSize: "1.1rem",
                        color: "rgba(255,255,255,0.8)"
                    }}
                    dangerouslySetInnerHTML={{ __html: page.content }}
                />
            </div>
            <Footer />
            <style jsx>{`
                .prose h1, .prose h2, .prose h3 { color: #fff; margin-top: 2em; margin-bottom: 1em; font-weight: 700; }
                .prose p { margin-bottom: 1.5em; }
                .prose ul, .prose ol { margin-bottom: 1.5em; padding-left: 1.5em; }
                .prose li { margin-bottom: 0.5em; }
                .prose a { color: #6366f1; text-decoration: underline; }
            `}</style>
        </div>
    );
}
