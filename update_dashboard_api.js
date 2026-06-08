const fs = require('fs');
let code = fs.readFileSync('app/api/organiser/dashboard/summary/route.js', 'utf8');

const analyticsLogic = `
    // Revenue Analytics
    const nowMs = evalNow.getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    let todayRevenue = 0;
    let thisWeekRevenue = 0;
    let thisMonthRevenue = 0;
    let lifetimeRevenue = 0;
    
    const eventWiseBookings = {};
    let rsvpEventsCount = 0;
    let rsvpConfirmedCount = 0;
    let rsvpCheckedInCount = 0;
    
    let marathonEventsCount = 0;
    let marathonRegistrations = 0;
    let marathonBibs = 0;
    let marathonCheckins = 0;

    eventsList.forEach(e => {
        eventWiseBookings[e.id] = { name: e.title || e.event_name || 'Unnamed Event', count: 0 };
        // Check dynamic config to classify
        if (e.event_type === 'rsvp' || e.dynamic_config?.rsvp) {
            rsvpEventsCount++;
        }
        if (e.event_type === 'marathon' || e.dynamic_config?.marathonCategories) {
            marathonEventsCount++;
        }
    });

    confirmedBookings.forEach(b => {
        const amt = Number(b.partner_total) || Number(b.base_amount) || 0;
        lifetimeRevenue += amt;
        
        const bDate = b.created_at ? new Date(b.created_at).getTime() : nowMs;
        const diffMs = nowMs - bDate;
        
        if (diffMs <= oneDayMs) todayRevenue += amt;
        if (diffMs <= 7 * oneDayMs) thisWeekRevenue += amt;
        if (diffMs <= 30 * oneDayMs) thisMonthRevenue += amt;
        
        if (eventWiseBookings[b.event_id]) {
            eventWiseBookings[b.event_id].count += (Number(b.ticket_count) || 1);
        }
        
        if (b.status === 'Confirmed' || b.status === 'CheckedIn') rsvpConfirmedCount++;
        if (b.status === 'CheckedIn') rsvpCheckedInCount++;
    });
`;

code = code.replace("    const totalTicketsSold = confirmedBookings.reduce((sum, b) =>\\n        sum + (Number(b.ticket_count) || 1), 0);", "    const totalTicketsSold = confirmedBookings.reduce((sum, b) =>\\n        sum + (Number(b.ticket_count) || 1), 0);\\n" + analyticsLogic);

code = code.replace("revenue: totalRevenue,", `revenue: totalRevenue,
        todayRevenue,
        thisWeekRevenue,
        thisMonthRevenue,
        lifetimeRevenue,
        eventWiseBookings: Object.values(eventWiseBookings).filter(e => e.count > 0),
        rsvpAnalytics: { events: rsvpEventsCount, confirmed: rsvpConfirmedCount, checkedIn: rsvpCheckedInCount },
        marathonAnalytics: { events: marathonEventsCount, registrations: marathonRegistrations, bibs: marathonBibs, checkins: marathonCheckins },`);

fs.writeFileSync('app/api/organiser/dashboard/summary/route.js', code);
