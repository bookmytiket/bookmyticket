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
        "ariyalur", "chengalpattu", "chennai", "coimbatore", "cuddalore", "dharmapuri", "dindigul", "erode", "kallakurichi", "kancheepuram", "kanyakumari", "karur", "krishnagiri", "madurai", "mayiladuthurai", "nagapattinam", "namakkal", "nilgiris", "perambalur", "pudukkottai", "ramanathapuram", "ranipet", "salem", "sivaganga", "tenkasi", "thanjavur", "theni", "thoothukudi", "tiruchirappalli", "tirunelveli", "tirupathur", "tiruppur", "tiruvallur", "tiruvannamalai", "tiruvarur", "vellore", "viluppuram", "virudhunagar"
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

export const INDIAN_CITIES = {
    "coimbatore": ["Coimbatore", "Pollachi", "Mettupalayam", "Sulur", "Annur", "Karamadai", "Madukkarai", "Thudiyalur", "Kuniyamuthur", "Saravanampatti", "Vadavalli", "Kaniyur", "Udumalaipettai", "Valparai"],
    "chennai": ["Chennai", "Ambattur", "Adyar", "Guindy", "T Nagar", "Velachery", "Annanagar", "Porur", "Tambaram", "Pallavaram"],
    "madurai": ["Madurai", "Melur", "Thirumangalam", "Usilampatti", "Vadipatti", "Alanganallur"],
    "trichy": ["Trichy", "Srirangam", "Thiruverumbur", "Manapparai", "Lalgudi", "Musiri"],
    "bangalore": ["Bangalore", "Electronic City", "Whitefield", "Koramangala", "Indiranagar", "Jayanagar", "HSR Layout", "Hebbal", "Yelahanka"],
    "kochi": ["Kochi", "Ernakulam", "Aluva", "Kalamassery", "Thrippunithura", "Kakkanad", "Angamaly"],
    "hyderabad": ["Hyderabad", "Secunderabad", "Gachibowli", "Hitech City", "Madhapur", "Jubilee Hills", "Banjara Hills", "Kukatpally"]
};

/**
 * Returns a list of cities/areas for a given district.
 */
export const getIndianCities = (districtNameOrSlug) => {
    if (!districtNameOrSlug) return [];
    const slug = slugify(districtNameOrSlug);
    
    // Check if we have specific cities for this district
    if (INDIAN_CITIES[slug]) {
        return INDIAN_CITIES[slug];
    }

    // Fallback to the district name itself if no sub-cities defined
    const name = districtNameOrSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    return [name];
};
