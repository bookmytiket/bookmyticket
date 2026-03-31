
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
