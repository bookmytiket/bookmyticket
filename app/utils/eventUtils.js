
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
    
    // Helper: explicitly check if a value is strictly zero
    const isZero = (val) => val === 0 || val === "0" || val === 0.0 || (val !== undefined && val !== null && Number(val) === 0);
    // Helper: explicitly check if a value is a truthy boolean/string flag for "Free"
    const isFreeFlag = (val) => val === true || val === "true" || val === "yes" || val === "Yes";

    // 1. Explicit top-level FREE flags take ultimate precedence
    if (isFreeFlag(event.isFree) || isFreeFlag(event.is_free)) return true;
    if (isFreeFlag(event.ticketsAreFree) || isFreeFlag(event.tickets_are_free)) return true;
    if (String(event.type || '').toLowerCase() === 'free') return true;

    // 2. CHECK NESTED PRICING STRUCTURES FIRST (V2/V3 Layouts, Categories, Blocks)
    // If ANY nested structure has a price > 0, it is NOT a free event.
    
    // 2a. Venue Seating V2 / V3 Blocks
    if (Array.isArray(event.blocks) && event.blocks.length > 0) {
        if (event.blocks.some(block => !isZero(block.price))) return false;
    }

    // 2b. Dynamic Config Seating Sections (V2 fallback)
    if (Array.isArray(event.dynamic_config?.seatingSections) && event.dynamic_config.seatingSections.length > 0) {
        if (event.dynamic_config.seatingSections.some(sec => !isZero(sec.basePrice))) return false;
    }

    // 2c. Marathon Categories
    const marathonCats = event.marathonCategories || event.dynamic_config?.marathonCategories || event.marathon_data?.categories;
    if (Array.isArray(marathonCats) && marathonCats.length > 0) {
        if (marathonCats.some(cat => !isZero(cat.price) && !isZero(cat.registration_fee))) return false;
    }

    // 2d. General Seat Categories (with nested Age Pricing)
    const cats = event.seat_categories || event.seatCategories || event.categories || event.dynamic_config?.categories;
    if (Array.isArray(cats) && cats.length > 0) {
        let hasPaidCategory = false;
        cats.forEach(cat => {
            if (isFreeFlag(cat.isFree) || isFreeFlag(cat.is_free)) return; // This one is free
            
            const ageRates = cat.agePricing || cat.ageRates || cat.age_pricing || cat.age_rates || [];
            if (Array.isArray(ageRates) && ageRates.length > 0) {
                if (ageRates.some(r => !isZero(r.price) && r.price !== null && r.price !== undefined)) {
                    hasPaidCategory = true;
                }
            } else if (!isZero(cat.price) && cat.price !== null && cat.price !== undefined) {
                hasPaidCategory = true;
            }
        });
        if (hasPaidCategory) return false;
    }

    // 2e. Top-level Age Pricing Config
    const topLevelAgeRates = event.dynamic_config?.agePricing || event.dynamic_config?.ageRates || [];
    if (Array.isArray(topLevelAgeRates) && topLevelAgeRates.length > 0) {
        if (topLevelAgeRates.some(r => !isZero(r.price) && r.price !== null && r.price !== undefined)) return false;
    }

    // 2f. Distance Pricing for Sports
    if ((event.type === "Sports" || event.category === "Sports") && event.distancePricing && typeof event.distancePricing === 'object') {
        const dp = Object.values(event.distancePricing);
        if (dp.length > 0 && dp.some(p => !isZero(p))) return false;
    }

    // 3. Fallback to top-level price checks only AFTER ensuring no nested prices exist
    if (isFreeFlag(event.dynamic_config?.basicInfo?.isFree)) return true;

    const price = event.price !== undefined ? event.price : event.price; 
    const normalPrice = event.normal_ticket_price !== undefined ? event.normal_ticket_price : event.normalTicketPrice;
    
    // If top-level prices are explicitly 0, it's free.
    // (We only reach here if there are NO nested categories with prices > 0)
    if (isZero(price)) return true;
    if (isZero(normalPrice)) return true;

    // Default to paid if we can't definitively prove it's free
    return false;
}
