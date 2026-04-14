const REQUEST_TYPE = {
    PROFESSIONAL_SERVICE: "professional_service",
    EVENT_ORGANISER: "event_organiser",
};

function isServiceProvider(category) {
    if (!category) return false;
    const c = category.trim().toLowerCase();
    console.log("Testing:", c);
    return (
        c.includes("mehandi") ||
        c.includes("mehendi") ||
        c.includes("photograph") ||
        c.includes("makeup") ||
        c.includes("artist") ||
        c.includes("turf") ||
        c.includes("personal service")
    );
}

function normalizeType(row) {
    if (isServiceProvider(row.category)) return REQUEST_TYPE.PROFESSIONAL_SERVICE;
    if (row.type === REQUEST_TYPE.PROFESSIONAL_SERVICE) return REQUEST_TYPE.PROFESSIONAL_SERVICE;
    return REQUEST_TYPE.EVENT_ORGANISER;
}

const testRow = { type: "event_organiser", category: "Mehendi Artist" };
console.log("Result:", normalizeType(testRow));
