export const INDIAN_STATES = [
    { name: "Andhra Pradesh", slug: "andhra-pradesh" },
    { name: "Arunachal Pradesh", slug: "arunachal-pradesh" },
    { name: "Assam", slug: "assam" },
    { name: "Bihar", slug: "bihar" },
    { name: "Chhattisgarh", slug: "chhattisgarh" },
    { name: "Goa", slug: "goa" },
    { name: "Gujarat", slug: "gujarat" },
    { name: "Haryana", slug: "haryana" },
    { name: "Himachal Pradesh", slug: "himachal-pradesh" },
    { name: "Jharkhand", slug: "jharkhand" },
    { name: "Karnataka", slug: "karnataka" },
    { name: "Kerala", slug: "kerala" },
    { name: "Madhya Pradesh", slug: "madhya-pradesh" },
    { name: "Maharashtra", slug: "maharashtra" },
    { name: "Manipur", slug: "manipur" },
    { name: "Meghalaya", slug: "meghalaya" },
    { name: "Mizoram", slug: "mizoram" },
    { name: "Nagaland", slug: "nagaland" },
    { name: "Odisha", slug: "odisha" },
    { name: "Punjab", slug: "punjab" },
    { name: "Rajasthan", slug: "rajasthan" },
    { name: "Sikkim", slug: "sikkim" },
    { name: "Tamil Nadu", slug: "tamil-nadu" },
    { name: "Telangana", slug: "telangana" },
    { name: "Tripura", slug: "tripura" },
    { name: "Uttar Pradesh", slug: "uttar-pradesh" },
    { name: "Uttarakhand", slug: "uttarakhand" },
    { name: "West Bengal", slug: "west-bengal" },
    { name: "Delhi", slug: "delhi" },
    { name: "Puducherry", slug: "puducherry" }
];

export const INDIAN_DISTRICTS = {
    "tamil-nadu": [
        "chennai", "coimbatore", "madurai", "salem", "trichy", "tiruppur", "erode", "vellore", "thoothukudi", "tirunelveli"
    ],
    "karnataka": [
        "bangalore", "mysore", "hubli", "mangalore", "belgaum", "gulbarga", "davanagere", "bellary"
    ],
    "kerala": [
        "kochi", "trivandrum", "kozhikode", "thrissur", "kollam", "palakkad", "alappuzha", "kannur"
    ],
    "maharashtra": [
        "mumbai", "pune", "nagpur", "thane", "nashik", "aurangabad", "solapur", "amravati"
    ],
    "gujarat": [
        "ahmedabad", "surat", "vadodara", "rajkot", "bhavnagar", "jamnagar", "junagadh", "gandhinagar"
    ],
    "telangana": [
        "hyderabad", "warangal", "nizamabad", "karimnagar", "khammam", "ramagundam", "mahbubnagar"
    ],
    "andhra-pradesh": [
        "visakhapatnam", "vijayawada", "guntur", "nellore", "kurnool", "kakinada", "tirupati"
    ],
    "west-bengal": [
        "kolkata", "howrah", "durgapur", "asansol", "siliguri", "kharagpur", "bardhaman"
    ],
    "delhi": [
        "new-delhi", "north-delhi", "south-delhi", "west-delhi", "east-delhi"
    ]
};

export const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/[^\w-]+/g, '')  // Remove all non-word chars
        .replace(/--+/g, '-');    // Replace multiple - with single -
};

/**
 * Returns a list of districts for a given state slug.
 */
export const getIndianDistricts = (stateSlug) => {
    return INDIAN_DISTRICTS[stateSlug] || [];
};

/**
 * Legacy helper for city selection (aliases to districts).
 */
export const getIndianCities = (stateSlug) => {
    return getIndianDistricts(stateSlug);
};
