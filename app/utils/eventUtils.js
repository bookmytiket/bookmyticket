
export function isVirtualEvent(event) {
    if (!event) return false;
    
    // Explicit flag
    if (event.virtual === true || event.virtual === "true") return true;
    
    // Type check
    const type = String(event.type || event.eventType || '').toLowerCase();
    if (type === 'online' || type === 'virtual') return true;
    
    // Location/Title check
    const loc = String(event.location || event.venue || '').toLowerCase();
    const title = String(event.title || '').toLowerCase();
    
    if (loc.includes('online') || loc.includes('virtual')) return true;
    if (title.includes('online meeting') || title.includes('virtual event')) return true;
    
    return false;
}

export function isFreeEvent(event) {
    if (!event) return false;
    
    // Check if price is explicitly 0
    if (event.price === 0 || event.price === "0") return true;
    
    // Check normalTicketPrice
    if (event.normalTicketPrice === 0 || event.normalTicketPrice === "0") return true;

    // Check type explicitly
    if (String(event.type || '').toLowerCase() === 'free') return true;

    // Check seat categories if available
    if (Array.isArray(event.seatCategories) && event.seatCategories.length > 0) {
        // If all categories are marked isFree or have 0 price
        return event.seatCategories.every(cat => cat.isFree || cat.price === 0);
    }
    
    return false;
}
