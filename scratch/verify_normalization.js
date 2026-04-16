
function normalizeRole(role) {
    return role.toLowerCase().replace(/\s+/g, '_');
}

const testCases = [
    { input: "Super Admin", expected: "super_admin" },
    { input: "admin", expected: "admin" },
    { input: "Staff Member", expected: "staff_member" },
    { input: "Organiser", expected: "organiser" }
];

testCases.forEach(tc => {
    const result = normalizeRole(tc.input);
    console.log(`Input: "${tc.input}" -> Result: "${result}" ${result === tc.expected ? "✅" : "❌"}`);
});
