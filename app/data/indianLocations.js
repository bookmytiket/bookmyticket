export const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

export const INDIAN_DISTRICTS = {
    "Tamil Nadu": [
        "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"
    ],
    "Karnataka": ["Bengaluru Urban", "Bengaluru Rural", "Mysuru", "Mangaluru", "Hubballi-Dharwad", "Belagavi", "Kalaburagi"],
    "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Palakkad", "Alappuzha"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur"],
    "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Khammam", "Karimnagar", "Ramagundam"],
    // Add more as needed
};

export const INDIAN_CITIES = {
    "Coimbatore": [
        "Coimbatore City", "Pollachi", "Mettupalayam", "Annur", "Sulur", "Valparai", "Udumalaipettai", "Karamadai", "Perianaickenpalayam", "Madukkarai", "Thondamuthur", "Kinathukadavu"
    ],
    "Chennai": ["Chennai Central", "Adyar", "Anna Nagar", "T. Nagar", "Velachery", "Tambaram", "Ambattur", "Avadi", "Porur", "Sholinganallur"],
    "Madurai": ["Madurai South", "Madurai North", "Melur", "Vadipatti", "Usilampatti", "Tirumangalam", "Peraiyur"],
    "Salem": ["Salem City", "Attur", "Edappadi", "Mettur", "Omalur", "Sankagiri", "Valapady", "Yercaud"],
    "Trichy": ["Tiruchirappalli City", "Manapparai", "Musiri", "Thuraiyur", "Lalgudi", "Srirangam"],
    "Mysuru": ["Mysuru City", "Hunsur", "Nanjangud", "Periyapatna", "Teresina"],
    "Bengaluru Urban": ["Bengaluru Central", "Indiranagar", "Koramangala", "Jayanagar", "Whitefield", "Marathahalli", "Electronics City", "HSR Layout"],
    // Default fallback if a district isn't detailed
};

export const getIndianDistricts = (stateName) => INDIAN_DISTRICTS[stateName] || [];
export const getIndianCities = (districtName) => INDIAN_CITIES[districtName] || [districtName]; // Fallback to district name as city if not listed
