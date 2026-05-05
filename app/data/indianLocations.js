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
    if (!text) return "";
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/[^\w-]+/g, '')  // Remove all non-word chars
        .replace(/--+/g, '-');    // Replace multiple - with single -
};

/**
 * Returns a list of districts for a given state name or slug.
 */
export const getIndianDistricts = (stateNameOrSlug) => {
    if (!stateNameOrSlug) return [];
    const slug = slugify(stateNameOrSlug);
    const districts = INDIAN_DISTRICTS[slug] || [];
    // Convert slugs back to readable names for the UI
    return districts.map(d => d.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '));
};

/**
 * Returns a list of cities/areas for a given district.
 * For now, we return the same list or a sub-list if we had one.
 * Since our data is currently [State -> Cities], we'll treat districts as cities.
 */
export const getIndianCities = (districtNameOrSlug) => {
    if (!districtNameOrSlug) return [];
    // For now, if it's India, we might just return the district itself as the only city option
    // or return a few common areas if we had them.
    // To avoid "Loading..." when there's no deeper data, we return the district name itself.
    const name = districtNameOrSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    return [name];
};
