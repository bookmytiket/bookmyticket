import { query } from "./_generated/server";

export const getDashboardStats = query({
    args: {},
    handler: async (ctx) => {
        const [events, bookings, users, organisers] = await Promise.all([
            ctx.db.query("events").collect(),
            ctx.db.query("bookings").collect(),
            ctx.db.query("users").collect(),
            ctx.db.query("organisers").collect(),
        ]);

        const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
        const totalTickets = bookings.reduce((sum, b) => sum + (b.ticketCount || 0), 0);
        const totalEvents = events.length;
        const totalUsers = users.length;
        const totalOrganisers = organisers.length;
        const totalBookings = bookings.length;

        // Monthly revenue (last 6 months)
        const now = Date.now();
        const sixMonthsAgo = now - 6 * 30 * 24 * 60 * 60 * 1000;
        const recentBookings = bookings.filter(b => b._creationTime > sixMonthsAgo);
        const monthlyRevenue: Record<string, number> = {};
        for (const b of recentBookings) {
            const d = new Date(b._creationTime);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            monthlyRevenue[key] = (monthlyRevenue[key] || 0) + (b.totalPrice || 0);
        }

        // Top events by booking count
        const eventBookingCounts: Record<string, number> = {};
        for (const b of bookings) {
            const id = String(b.eventId);
            eventBookingCounts[id] = (eventBookingCounts[id] || 0) + 1;
        }
        const topEventIds = Object.entries(eventBookingCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([id]) => id);
        const topEvents = events
            .filter(e => topEventIds.includes(String(e._id)))
            .map(e => ({ title: e.title, bookings: eventBookingCounts[String(e._id)] || 0, category: e.category || "Other" }));

        return {
            totalRevenue,
            totalTickets,
            totalEvents,
            totalUsers,
            totalOrganisers,
            totalBookings,
            monthlyRevenue,
            topEvents,
        };
    },
});
