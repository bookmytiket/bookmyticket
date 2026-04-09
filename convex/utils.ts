export const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

export function computeEndDateTime(dateStr?: string, timeStr?: string) {
    if (!dateStr || !timeStr) return undefined;
    try {
        const [year, month, day] = dateStr.split("-").map(Number);
        let tStr = timeStr.trim().toUpperCase();
        let [time, modifier] = tStr.split(" ");
        if (!modifier && (tStr.includes("AM") || tStr.includes("PM"))) {
            // Case where time is "10:00AM" (no space)
            const match = tStr.match(/^(\d{1,2}:\d{2})\s*(AM|PM)$/);
            if (match) {
                time = match[1];
                modifier = match[2];
            }
        }
        
        let [hours, minutes] = time.split(":").map(Number);
        if (modifier === "PM" && hours < 12) hours += 12;
        if (modifier === "AM" && hours === 12) hours = 0;
        
        const date = new Date(year, month - 1, day, hours, minutes);
        return date.getTime() + DEFAULT_DURATION_MS;
    } catch (e) {
        return undefined;
    }
}
