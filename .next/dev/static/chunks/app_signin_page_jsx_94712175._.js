(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/app/signin/page.jsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>SignInPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$AuthContext$2e$jsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/AuthContext.jsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
;
/* ─── Left Banner Slides ─────────────────────── */ const BANNER_SLIDES = [
    {
        id: 1,
        type: "image",
        image: "https://images.unsplash.com/photo-1540039155733-d71efd44f808?q=80&w=900&fit=crop&auto=format",
        title: "Live Concerts",
        sub: "Experience music like never before"
    },
    {
        id: 2,
        type: "image",
        image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=900&fit=crop&auto=format",
        title: "Unforgettable Nights",
        sub: "Book your tickets instantly"
    },
    {
        id: 3,
        type: "promo"
    },
    {
        id: 4,
        type: "image",
        image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=900&fit=crop&auto=format",
        title: "Epic Festivals",
        sub: "Don't miss what's coming"
    }
];
const AUTO_PLAY_MS = 4000;
const FEATURES = [
    {
        num: "01",
        title: "Book Event Tickets",
        sub: "Instant confirmation"
    },
    {
        num: "02",
        title: "Easy Sign-Up",
        sub: "Super quick activation"
    },
    {
        num: "03",
        title: "Simple Registration",
        sub: "No hassle, no paperwork"
    },
    {
        num: "04",
        title: "Quick Setup",
        sub: "No setup cost, zero fee"
    }
];
/* ─── Left Panel Auto-Scrolling Banner ───────── */ function LeftBanner() {
    _s();
    const [current, setCurrent] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [fading, setFading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const timerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const total = BANNER_SLIDES.length;
    const goTo = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "LeftBanner.useCallback[goTo]": (idx)=>{
            setFading(true);
            setTimeout({
                "LeftBanner.useCallback[goTo]": ()=>{
                    setCurrent((idx + total) % total);
                    setFading(false);
                }
            }["LeftBanner.useCallback[goTo]"], 400);
        }
    }["LeftBanner.useCallback[goTo]"], [
        total
    ]);
    const next = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "LeftBanner.useCallback[next]": ()=>goTo(current + 1)
    }["LeftBanner.useCallback[next]"], [
        current,
        goTo
    ]);
    const prev = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "LeftBanner.useCallback[prev]": ()=>goTo(current - 1 + total)
    }["LeftBanner.useCallback[prev]"], [
        current,
        goTo,
        total
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "LeftBanner.useEffect": ()=>{
            timerRef.current = setInterval(next, AUTO_PLAY_MS);
            return ({
                "LeftBanner.useEffect": ()=>clearInterval(timerRef.current)
            })["LeftBanner.useEffect"];
        }
    }["LeftBanner.useEffect"], [
        next
    ]);
    const slide = BANNER_SLIDES[current];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            position: "relative",
            width: "100%",
            height: "100%",
            overflow: "hidden",
            background: "#0b0727"
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: {
                position: "absolute",
                inset: 0,
                opacity: fading ? 0 : 1,
                transition: "opacity 0.4s ease"
            },
            children: slide.type === "image" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                        src: slide.image,
                        alt: slide.title,
                        crossOrigin: "anonymous",
                        style: {
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block"
                        }
                    }, void 0, false, {
                        fileName: "[project]/app/signin/page.jsx",
                        lineNumber: 71,
                        columnNumber: 25
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            position: "absolute",
                            inset: 0,
                            background: "linear-gradient(180deg,rgba(11,7,39,0.3) 0%,rgba(11,7,39,0.72) 100%)"
                        }
                    }, void 0, false, {
                        fileName: "[project]/app/signin/page.jsx",
                        lineNumber: 73,
                        columnNumber: 25
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            position: "absolute",
                            bottom: "80px",
                            left: "36px",
                            right: "36px",
                            color: "#fff"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                style: {
                                    margin: 0,
                                    fontSize: "clamp(26px,4vw,42px)",
                                    fontWeight: 900,
                                    lineHeight: 1.1,
                                    letterSpacing: "-1px",
                                    textShadow: "0 2px 12px rgba(0,0,0,0.4)"
                                },
                                children: slide.title
                            }, void 0, false, {
                                fileName: "[project]/app/signin/page.jsx",
                                lineNumber: 75,
                                columnNumber: 29
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                style: {
                                    margin: "8px 0 0",
                                    fontSize: "15px",
                                    color: "rgba(255,255,255,0.85)",
                                    fontWeight: 500
                                },
                                children: slide.sub
                            }, void 0, false, {
                                fileName: "[project]/app/signin/page.jsx",
                                lineNumber: 76,
                                columnNumber: 29
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/signin/page.jsx",
                        lineNumber: 74,
                        columnNumber: 25
                    }, this)
                ]
            }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    width: "100%",
                    height: "100%",
                    background: "linear-gradient(160deg,#0b0727 0%,#1a0640 40%,#2d0a6b 70%,#0b0727 100%)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    padding: "0 36px",
                    position: "relative",
                    overflow: "hidden"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            position: "absolute",
                            width: "300px",
                            height: "300px",
                            borderRadius: "50%",
                            background: "radial-gradient(circle,#ff2d7840 0%,transparent 70%)",
                            top: "-60px",
                            left: "-60px",
                            pointerEvents: "none"
                        }
                    }, void 0, false, {
                        fileName: "[project]/app/signin/page.jsx",
                        lineNumber: 81,
                        columnNumber: 25
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            position: "absolute",
                            width: "350px",
                            height: "350px",
                            borderRadius: "50%",
                            background: "radial-gradient(circle,#7c3aed30 0%,transparent 70%)",
                            bottom: "-80px",
                            right: "-60px",
                            pointerEvents: "none"
                        }
                    }, void 0, false, {
                        fileName: "[project]/app/signin/page.jsx",
                        lineNumber: 82,
                        columnNumber: 25
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        style: {
                            margin: "0 0 6px",
                            fontSize: "11px",
                            fontWeight: 800,
                            letterSpacing: "3px",
                            color: "#f84464",
                            textTransform: "uppercase"
                        },
                        children: "It's time to"
                    }, void 0, false, {
                        fileName: "[project]/app/signin/page.jsx",
                        lineNumber: 83,
                        columnNumber: 25
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        style: {
                            margin: 0,
                            lineHeight: 0.9,
                            fontWeight: 900,
                            textTransform: "uppercase",
                            fontSize: "clamp(44px,7vw,68px)",
                            letterSpacing: "-2px",
                            background: "linear-gradient(90deg,#fff 50%,#f84464 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent"
                        },
                        children: [
                            "ROCK",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                fileName: "[project]/app/signin/page.jsx",
                                lineNumber: 84,
                                columnNumber: 300
                            }, this),
                            "Events"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/signin/page.jsx",
                        lineNumber: 84,
                        columnNumber: 25
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        style: {
                            margin: "8px 0 28px",
                            fontStyle: "italic",
                            fontSize: "18px",
                            fontWeight: 700,
                            color: "#e2a0ff"
                        },
                        children: "Calendar"
                    }, void 0, false, {
                        fileName: "[project]/app/signin/page.jsx",
                        lineNumber: 85,
                        columnNumber: 25
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                        style: {
                            listStyle: "none",
                            padding: 0,
                            margin: "0 0 28px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px"
                        },
                        children: FEATURES.map((f)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                style: {
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        style: {
                                            fontWeight: 900,
                                            fontSize: "11px",
                                            color: "#f84464",
                                            minWidth: "22px"
                                        },
                                        children: f.num
                                    }, void 0, false, {
                                        fileName: "[project]/app/signin/page.jsx",
                                        lineNumber: 89,
                                        columnNumber: 37
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                style: {
                                                    margin: 0,
                                                    fontWeight: 700,
                                                    fontSize: "11px",
                                                    color: "#e2d9f3",
                                                    letterSpacing: "1px",
                                                    textTransform: "uppercase",
                                                    lineHeight: 1
                                                },
                                                children: f.title
                                            }, void 0, false, {
                                                fileName: "[project]/app/signin/page.jsx",
                                                lineNumber: 91,
                                                columnNumber: 41
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                style: {
                                                    margin: 0,
                                                    fontSize: "10px",
                                                    color: "#9d8ec2"
                                                },
                                                children: f.sub
                                            }, void 0, false, {
                                                fileName: "[project]/app/signin/page.jsx",
                                                lineNumber: 92,
                                                columnNumber: 41
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/signin/page.jsx",
                                        lineNumber: 90,
                                        columnNumber: 37
                                    }, this)
                                ]
                            }, f.num, true, {
                                fileName: "[project]/app/signin/page.jsx",
                                lineNumber: 88,
                                columnNumber: 33
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/app/signin/page.jsx",
                        lineNumber: 86,
                        columnNumber: 25
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            background: "linear-gradient(90deg,#f84464,#c026d3)",
                            padding: "10px 22px",
                            borderRadius: "50px",
                            fontSize: "11px",
                            fontWeight: 800,
                            letterSpacing: "2px",
                            textTransform: "uppercase",
                            color: "#fff",
                            alignSelf: "flex-start",
                            boxShadow: "0 4px 20px rgba(248,68,100,0.4)"
                        },
                        children: "🎟 All Events Start Here"
                    }, void 0, false, {
                        fileName: "[project]/app/signin/page.jsx",
                        lineNumber: 97,
                        columnNumber: 25
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/signin/page.jsx",
                lineNumber: 80,
                columnNumber: 21
            }, this)
        }, void 0, false, {
            fileName: "[project]/app/signin/page.jsx",
            lineNumber: 68,
            columnNumber: 13
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/signin/page.jsx",
        lineNumber: 67,
        columnNumber: 9
    }, this);
}
_s(LeftBanner, "w4Ks8x1TC8ZVytxMSUEdLW6dIHM=");
_c = LeftBanner;
function SignInPage() {
    _s1();
    const { login } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$AuthContext$2e$jsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const [email, setEmail] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [password, setPassword] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [showPass, setShowPass] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [role, setRole] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("organiser");
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const handleLogin = (e)=>{
        e.preventDefault();
        setError("");
        const ok = login(email, password, role);
        if (!ok) setError("Invalid email or password. Please try again.");
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            minHeight: "100vh",
            display: "flex",
            fontFamily: "'Inter','Roboto',sans-serif"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    flex: "0 0 42%",
                    position: "relative",
                    overflow: "hidden"
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(LeftBanner, {}, void 0, false, {
                    fileName: "[project]/app/signin/page.jsx",
                    lineNumber: 131,
                    columnNumber: 17
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/signin/page.jsx",
                lineNumber: 130,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    flex: 1,
                    background: "#f8fafc",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "80px 40px 40px",
                    position: "relative"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            position: "absolute",
                            top: "20px",
                            left: "50%",
                            transform: "translateX(-50%)"
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            href: "/",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                src: "/logo.png",
                                alt: "BookMyTicket",
                                style: {
                                    height: "64px",
                                    width: "auto",
                                    display: "block"
                                }
                            }, void 0, false, {
                                fileName: "[project]/app/signin/page.jsx",
                                lineNumber: 140,
                                columnNumber: 25
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/signin/page.jsx",
                            lineNumber: 139,
                            columnNumber: 21
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/signin/page.jsx",
                        lineNumber: 138,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            width: "100%",
                            maxWidth: "420px"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                style: {
                                    fontSize: "26px",
                                    fontWeight: 800,
                                    color: "#0f172a",
                                    margin: "0 0 6px",
                                    textAlign: "center"
                                },
                                children: "Good to see you again 👋"
                            }, void 0, false, {
                                fileName: "[project]/app/signin/page.jsx",
                                lineNumber: 147,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                style: {
                                    fontSize: "14px",
                                    color: "#64748b",
                                    margin: "0 0 28px",
                                    textAlign: "center"
                                },
                                children: [
                                    "Don't have an account?",
                                    " ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        style: {
                                            color: "#f84464",
                                            fontWeight: 700,
                                            textDecoration: "none"
                                        },
                                        children: "Create one now"
                                    }, void 0, false, {
                                        fileName: "[project]/app/signin/page.jsx",
                                        lineNumber: 152,
                                        columnNumber: 25
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/signin/page.jsx",
                                lineNumber: 150,
                                columnNumber: 21
                            }, this),
                            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    background: "#fff5f5",
                                    border: "1px solid #fca5a5",
                                    color: "#b91c1c",
                                    padding: "12px 16px",
                                    borderRadius: "10px",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    marginBottom: "20px"
                                },
                                children: [
                                    "⚠️ ",
                                    error
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/signin/page.jsx",
                                lineNumber: 157,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                                onSubmit: handleLogin,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        style: {
                                            display: "block",
                                            fontSize: "14px",
                                            fontWeight: 600,
                                            color: "#374151",
                                            marginBottom: "6px"
                                        },
                                        children: "Email address"
                                    }, void 0, false, {
                                        fileName: "[project]/app/signin/page.jsx",
                                        lineNumber: 164,
                                        columnNumber: 25
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "email",
                                        required: true,
                                        placeholder: "example@example.com",
                                        value: email,
                                        onChange: (e)=>setEmail(e.target.value),
                                        style: {
                                            width: "100%",
                                            padding: "13px 16px",
                                            borderRadius: "10px",
                                            border: "1.5px solid #d1d5db",
                                            fontSize: "14px",
                                            color: "#1e293b",
                                            outline: "none",
                                            background: "#fff",
                                            boxSizing: "border-box",
                                            marginBottom: "18px",
                                            transition: "border-color .2s"
                                        },
                                        onFocus: (e)=>e.target.style.borderColor = "#f84464",
                                        onBlur: (e)=>e.target.style.borderColor = "#d1d5db"
                                    }, void 0, false, {
                                        fileName: "[project]/app/signin/page.jsx",
                                        lineNumber: 165,
                                        columnNumber: 25
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            marginBottom: "6px"
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                style: {
                                                    fontSize: "14px",
                                                    fontWeight: 600,
                                                    color: "#374151"
                                                },
                                                children: "Password"
                                            }, void 0, false, {
                                                fileName: "[project]/app/signin/page.jsx",
                                                lineNumber: 176,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                href: "#",
                                                style: {
                                                    fontSize: "13px",
                                                    color: "#64748b",
                                                    textDecoration: "underline"
                                                },
                                                children: "Forgot password?"
                                            }, void 0, false, {
                                                fileName: "[project]/app/signin/page.jsx",
                                                lineNumber: 177,
                                                columnNumber: 29
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/signin/page.jsx",
                                        lineNumber: 175,
                                        columnNumber: 25
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            position: "relative",
                                            marginBottom: "20px"
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: showPass ? "text" : "password",
                                                required: true,
                                                placeholder: "password",
                                                value: password,
                                                onChange: (e)=>setPassword(e.target.value),
                                                style: {
                                                    width: "100%",
                                                    padding: "13px 48px 13px 16px",
                                                    borderRadius: "10px",
                                                    border: "1.5px solid #d1d5db",
                                                    fontSize: "14px",
                                                    color: "#1e293b",
                                                    outline: "none",
                                                    background: "#fff",
                                                    boxSizing: "border-box",
                                                    transition: "border-color .2s"
                                                },
                                                onFocus: (e)=>e.target.style.borderColor = "#f84464",
                                                onBlur: (e)=>e.target.style.borderColor = "#d1d5db"
                                            }, void 0, false, {
                                                fileName: "[project]/app/signin/page.jsx",
                                                lineNumber: 180,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: ()=>setShowPass((p)=>!p),
                                                style: {
                                                    position: "absolute",
                                                    right: "14px",
                                                    top: "50%",
                                                    transform: "translateY(-50%)",
                                                    background: "none",
                                                    border: "none",
                                                    cursor: "pointer",
                                                    color: "#94a3b8",
                                                    padding: 0,
                                                    lineHeight: 1
                                                },
                                                children: showPass ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                    width: "18",
                                                    height: "18",
                                                    viewBox: "0 0 24 24",
                                                    fill: "none",
                                                    stroke: "currentColor",
                                                    strokeWidth: "2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                            d: "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/signin/page.jsx",
                                                            lineNumber: 191,
                                                            columnNumber: 137
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                            d: "M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/signin/page.jsx",
                                                            lineNumber: 191,
                                                            columnNumber: 229
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                                            x1: "1",
                                                            y1: "1",
                                                            x2: "23",
                                                            y2: "23"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/signin/page.jsx",
                                                            lineNumber: 191,
                                                            columnNumber: 312
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/signin/page.jsx",
                                                    lineNumber: 191,
                                                    columnNumber: 39
                                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                    width: "18",
                                                    height: "18",
                                                    viewBox: "0 0 24 24",
                                                    fill: "none",
                                                    stroke: "currentColor",
                                                    strokeWidth: "2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                            d: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/signin/page.jsx",
                                                            lineNumber: 192,
                                                            columnNumber: 137
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                            cx: "12",
                                                            cy: "12",
                                                            r: "3"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/signin/page.jsx",
                                                            lineNumber: 192,
                                                            columnNumber: 194
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/signin/page.jsx",
                                                    lineNumber: 192,
                                                    columnNumber: 39
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/app/signin/page.jsx",
                                                lineNumber: 188,
                                                columnNumber: 29
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/signin/page.jsx",
                                        lineNumber: 179,
                                        columnNumber: 25
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "submit",
                                        style: {
                                            width: "100%",
                                            padding: "14px",
                                            borderRadius: "50px",
                                            border: "none",
                                            background: "linear-gradient(90deg,#f84464,#e11d48)",
                                            color: "#fff",
                                            fontWeight: 700,
                                            fontSize: "16px",
                                            cursor: "pointer",
                                            boxShadow: "0 6px 20px rgba(248,68,100,0.35)",
                                            letterSpacing: ".3px",
                                            transition: "opacity .2s",
                                            marginBottom: "20px"
                                        },
                                        onMouseOver: (e)=>e.currentTarget.style.opacity = ".9",
                                        onMouseOut: (e)=>e.currentTarget.style.opacity = "1",
                                        children: "Log in"
                                    }, void 0, false, {
                                        fileName: "[project]/app/signin/page.jsx",
                                        lineNumber: 199,
                                        columnNumber: 25
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/signin/page.jsx",
                                lineNumber: 162,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    margin: "0 0 16px",
                                    color: "#94a3b8",
                                    fontSize: "12px"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            flex: 1,
                                            height: "1px",
                                            background: "#e2e8f0"
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/app/signin/page.jsx",
                                        lineNumber: 215,
                                        columnNumber: 25
                                    }, this),
                                    "OR",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            flex: 1,
                                            height: "1px",
                                            background: "#e2e8f0"
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/app/signin/page.jsx",
                                        lineNumber: 217,
                                        columnNumber: 25
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/signin/page.jsx",
                                lineNumber: 214,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                style: {
                                    width: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "12px",
                                    padding: "13px 16px",
                                    borderRadius: "10px",
                                    border: "1.5px solid #e2e8f0",
                                    background: "#fff",
                                    fontSize: "14px",
                                    fontWeight: 600,
                                    color: "#1e293b",
                                    cursor: "pointer",
                                    transition: "border-color .2s"
                                },
                                onMouseOver: (e)=>e.currentTarget.style.borderColor = "#94a3b8",
                                onMouseOut: (e)=>e.currentTarget.style.borderColor = "#e2e8f0",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                        src: "https://lh3.googleusercontent.com/COxitqgJr1sICpeqCu7IFH0LqJD9mi_SS9BW9Xm73Yp3eX9XvMSh5AR9Lp5rdKCAd3pXW18mI73R199Xp4G1fG3WvOT5xvBy2P5p",
                                        alt: "G",
                                        style: {
                                            width: "20px"
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/app/signin/page.jsx",
                                        lineNumber: 225,
                                        columnNumber: 25
                                    }, this),
                                    "Continue with Google"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/signin/page.jsx",
                                lineNumber: 221,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                style: {
                                    marginTop: "20px",
                                    fontSize: "11px",
                                    color: "#94a3b8",
                                    textAlign: "center",
                                    lineHeight: "1.6"
                                },
                                children: [
                                    "By continuing you agree to our",
                                    " ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        style: {
                                            color: "#475569",
                                            textDecoration: "underline"
                                        },
                                        children: "Terms"
                                    }, void 0, false, {
                                        fileName: "[project]/app/signin/page.jsx",
                                        lineNumber: 231,
                                        columnNumber: 25
                                    }, this),
                                    " &",
                                    " ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        style: {
                                            color: "#475569",
                                            textDecoration: "underline"
                                        },
                                        children: "Privacy Policy"
                                    }, void 0, false, {
                                        fileName: "[project]/app/signin/page.jsx",
                                        lineNumber: 232,
                                        columnNumber: 25
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/signin/page.jsx",
                                lineNumber: 229,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/signin/page.jsx",
                        lineNumber: 144,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/signin/page.jsx",
                lineNumber: 135,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/signin/page.jsx",
        lineNumber: 127,
        columnNumber: 9
    }, this);
}
_s1(SignInPage, "ZOpXK7zb8UBENG8Eu1mln0+mA6g=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$AuthContext$2e$jsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"]
    ];
});
_c1 = SignInPage;
var _c, _c1;
__turbopack_context__.k.register(_c, "LeftBanner");
__turbopack_context__.k.register(_c1, "SignInPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=app_signin_page_jsx_94712175._.js.map