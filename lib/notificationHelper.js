/**
 * Comm Trigger Helper for Frontend
 */
export async function triggerNotification({ phoneNumber, type, data }) {
    if (!phoneNumber) return { success: false, error: "No phone number provided" };
    
    try {
        const response = await fetch('/api/comm/trigger', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber, type, data })
        });
        return await response.json();
    } catch (err) {
        console.error("Notification trigger failed:", err);
        return { success: false, error: err.message };
    }
}
