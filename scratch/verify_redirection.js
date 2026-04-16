
function getAuthorizedDestination(user, destination) {
    const isAdminPath = destination?.startsWith("/admin");
    const isBrandingPath = destination?.startsWith("/branding");
    const isOrganiserPath = destination?.startsWith("/organiser");
    const isVendorPath = destination?.startsWith("/vendor");

    const isAuthorized = 
        (!isAdminPath || user.role === "admin" || user.role === "super_admin") &&
        (!isBrandingPath || user.role === "branding_partner" || user.role === "admin" || user.role === "super_admin") &&
        (!isOrganiserPath || ["organiser", "staff", "admin", "super_admin"].includes(user.role)) &&
        (!isVendorPath || ["organiser", "admin", "super_admin"].includes(user.role));

    if (!isAuthorized) {
        if (user.role === "admin" || user.role === "super_admin") return "/admin";
        if (user.role === "staff") return "/organiser?tab=pwa_scanner";
        if (user.role === "branding_partner") return "/branding/dashboard";
        if (user.role === "organiser") return "/organiser"; // Simplified for test
        return "/profile";
    }
    return destination;
}

const testCases = [
    { user: { role: "user" }, dest: "/admin", expected: "/profile" },
    { user: { role: "user" }, dest: "/organiser", expected: "/profile" },
    { user: { role: "admin" }, dest: "/admin", expected: "/admin" },
    { user: { role: "super_admin" }, dest: "/admin", expected: "/admin" },
    { user: { role: "staff" }, dest: "/admin", expected: "/organiser?tab=pwa_scanner" },
    { user: { role: "branding_partner" }, dest: "/admin", expected: "/branding/dashboard" },
    { user: { role: "user" }, dest: "/events", expected: "/events" }, // Public path
];

testCases.forEach(tc => {
    const result = getAuthorizedDestination(tc.user, tc.dest);
    console.log(`Role: ${tc.user.role}, Target: ${tc.dest} -> Result: ${result} ${result === tc.expected ? "✅" : "❌"}`);
});
