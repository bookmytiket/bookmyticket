import { query } from "./_generated/server";

export const checkLegacy = query({
    args: {},
    handler: async (ctx) => {
        const b = await ctx.db.query("bookings").filter(q => q.eq(q.field("isGstApplied"), true)).collect();
        const t = await ctx.db.query("turfBookings").filter(q => q.eq(q.field("isGstApplied"), true)).collect();
        const v = await ctx.db.query("vendorBookings").filter(q => q.eq(q.field("isGstApplied"), true)).collect();
        
        return {
            bookings: b.map(x => ({ id: x._id, hasInvoiceDate: !!x.invoiceDate, creation: x._creationTime })),
            turf: t.map(x => ({ id: x._id, hasInvoiceDate: !!x.invoiceDate, createdAt: x.createdAt })),
            vendor: v.map(x => ({ id: x._id, hasInvoiceDate: !!x.invoiceDate, createdAt: x.createdAt })),
        };
    }
});
