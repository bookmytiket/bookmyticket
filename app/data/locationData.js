export const COUNTRIES = [
    { flag: "🇮🇳", label: "India", code: "IN" },
    { flag: "🇦🇪", label: "UAE", code: "AE" },
    { flag: "🇸🇬", label: "Singapore", code: "SG" },
    { flag: "🇲🇾", label: "Malaysia", code: "MY" },
    { flag: "🇹🇭", label: "Thailand", code: "TH" },
    { flag: "🇩🇪", label: "Germany", code: "DE" },
    { flag: "🇺🇸", label: "United States", code: "US" },
];

export const POPULAR_CITIES = {
    "India": [
        { name: "Bengaluru", icon: "Bengaluru", img: "/locations/Bengaluru.jpg" }, 
        { name: "Chennai", icon: "Chennai", img: "/locations/Chennai.png" }, 
        { name: "Coimbatore", icon: "Coimbatore", img: "/locations/Coimbatore.jpg" }, 
        { name: "Hyderabad", icon: "Hyderabad", img: "/locations/Hyderabad.png" },
        { name: "Kochi", icon: "Kochi", img: "/locations/Kochi.png" }, 
        { name: "Kolkata", icon: "Kolkata", img: "/locations/Kolkata.jpeg" }, 
        { name: "New Delhi", icon: "Delhi", img: "/locations/New Delhi.png" }, 
        { name: "Mumbai", icon: "Mumbai", img: "/locations/Mumbai.png" },
        { name: "Madurai", icon: "Generic" },
        { name: "Salem", icon: "Generic" },
    ],
    "UAE": [
        { name: "Dubai", icon: "Generic" }, 
        { name: "Abu Dhabi", icon: "Generic" },
    ],
    "Singapore": [
        { name: "Singapore", icon: "Generic" }
    ],
};

// Architecture Landmark Icons (SVG Paths)
export const LANDMARK_ICONS = {
    "Bengaluru": (stroke = "#94a3b8") => (
        <svg viewBox="0 0 64 64" fill="none" stroke={stroke} strokeWidth="1.2">
            <path d="M10 54h44M14 54V24l8-4v34M22 54V10l10-4 10 4v44M42 54V30l8-4v28" />
        </svg>
    ),
    "Mumbai": (stroke = "#94a3b8") => (
        <svg viewBox="0 0 64 64" fill="none" stroke={stroke} strokeWidth="1.2">
            <path d="M8 56h48M12 56V28l12-10 12 10v28M36 56V32l8-6 8 6v26" />
            <circle cx="24" cy="24" r="3" />
        </svg>
    ),
    "Delhi": (stroke = "#94a3b8") => (
        <svg viewBox="0 0 64 64" fill="none" stroke={stroke} strokeWidth="1.2">
            <path d="M12 56h40M16 56V20l16-8 16 8v36" />
            <path d="M24 56V40h16v16" />
        </svg>
    ),
    "Chennai": (stroke = "#94a3b8") => (
        <svg viewBox="0 0 64 64" fill="none" stroke={stroke} strokeWidth="1.2">
            <path d="M12 56h40M20 56V24l12-12 12 12v32M28 56V40h8v16" />
            <path d="M20 32h24M24 44h16" />
        </svg>
    ),
    "Coimbatore": (stroke = "#94a3b8") => (
        <svg viewBox="0 0 64 64" fill="none" stroke={stroke} strokeWidth="1.2">
            <rect x="24" y="20" width="16" height="36" />
            <circle cx="32" cy="30" r="4" />
            <path d="M24 20l8-8 8 8" />
        </svg>
    ),
    "Hyderabad": (stroke = "#94a3b8") => (
        <svg viewBox="0 0 64 64" fill="none" stroke={stroke} strokeWidth="1.2">
            <path d="M12 56h40M16 56V30l8-8 8 8v26M32 56V30l8-8 8 8v26" />
        </svg>
    ),
    "Kochi": (stroke = "#94a3b8") => (
        <svg viewBox="0 0 64 64" fill="none" stroke={stroke} strokeWidth="1.2">
            <path d="M12 48h40M22 48s0-24 10-24 10 24 10 24M32 24V12l-8 4" />
            <path d="M16 48c0 4 8 8 16 8s16-4 16-8" />
        </svg>
    ),
    "Kolkata": (stroke = "#94a3b8") => (
        <svg viewBox="0 0 64 64" fill="none" stroke={stroke} strokeWidth="1.2">
            <path d="M8 52h48M12 52V30l8-6 8 6v22M36 52V30l8-6 8 6v22M20 36h24" />
            <circle cx="32" cy="20" r="4" />
        </svg>
    ),
    "Generic": (stroke = "#94a3b8") => (
        <svg viewBox="0 0 64 64" fill="none" stroke={stroke} strokeWidth="1.2">
            <path d="M12 56h40M16 56V24l16-10 16 10v32" />
        </svg>
    )
};
