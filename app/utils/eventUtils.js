
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
    
    // 1. Check explicit "Free" flags (boolean or string "true"/"yes")
    const isFreeFlag = (val) => val === true || val === "true" || val === "yes" || val === "Yes";
    if (isFreeFlag(event.isFree) || isFreeFlag(event.is_free)) return true;
    if (isFreeFlag(event.ticketsAreFree) || isFreeFlag(event.tickets_are_free)) return true;
    
    // 2. Check various price fields (snake_case and camelCase)
    // If Number(val) is 0, it's free. We check for undefined/null explicitly too.
    const price = event.price !== undefined ? event.price : event.price; 
    const normalPrice = event.normal_ticket_price !== undefined ? event.normal_ticket_price : event.normalTicketPrice;
    
    const isZero = (val) => val === 0 || val === "0" || val === 0.0 || (val !== undefined && val !== null && Number(val) === 0);

    if (isZero(price)) return true;
    if (isZero(normalPrice)) return true;
    
    // If it's a Sports event, it might have price in distancePricing
    if (event.type === "Sports" || event.category === "Sports") {
        if (event.distancePricing && typeof event.distancePricing === 'object') {
            const dp = Object.values(event.distancePricing);
            if (dp.length > 0 && dp.every(p => isZero(p))) return true;
        }
    }

    // 3. Check categories/seatCategories if available
    const cats = event.seat_categories || event.seatCategories || event.categories || event.dynamic_config?.categories;
    if (Array.isArray(cats) && cats.length > 0) {
        // If all categories are free
        return cats.every(cat => 
            isFreeFlag(cat.isFree) || 
            isFreeFlag(cat.is_free) || 
            isZero(cat.price) ||
            cat.price === null || 
            cat.price === undefined
        );
    }

    // 4. Check dynamic_config defaults
    if (isFreeFlag(event.dynamic_config?.basicInfo?.isFree)) return true;

    // 5. Type check
    if (String(event.type || '').toLowerCase() === 'free') return true;
    
    // If we have no price info at all, we'll assume it's NOT free for now (safer for business)
    // unless it matches one of the above.
    
    return false;
}
