import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getSettings = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("gstSettings").first();
    },
});

export const updateSettings = mutation({
    args: {
        businessName: v.string(),
        businessAddress: v.string(),
        gstin: v.string(),
        taxConfig: v.object({
            cgst: v.number(),
            sgst: v.number(),
            igst: v.number(),
        }),
        categoryRates: v.optional(v.object({
            events: v.object({ cgst: v.number(), sgst: v.number(), igst: v.number(), enabled: v.boolean() }),
            turf: v.object({ cgst: v.number(), sgst: v.number(), igst: v.number(), enabled: v.boolean() }),
            services: v.object({ cgst: v.number(), sgst: v.number(), igst: v.number(), enabled: v.boolean() }),
        })),
        invoicePrefix: v.string(),
        isEnabled: v.boolean(),
        pricingType: v.string(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db.query("gstSettings").first();
        if (existing) {
            await ctx.db.patch(existing._id, { ...args, updatedAt: Date.now() });
        } else {
            await ctx.db.insert("gstSettings", { ...args, updatedAt: Date.now() });
        }
    },
});

export const getGstReport = query({
    args: {
        startDate: v.number(),
        endDate: v.number(),
    },
    handler: async (ctx, args) => {
        // Query all records for the tables. 
        // Note: For very large datasets, we would use indexes on isGstApplied + date.
        // For now, we fetch and filter to ensure backward compatibility.
        const [bookings, turfBookings, vendorBookings] = await Promise.all([
            ctx.db.query("bookings").collect(),
            ctx.db.query("turfBookings").collect(),
            ctx.db.query("vendorBookings").collect(),
        ]);

        const allBookings = [
            ...bookings.map(b => ({ 
                ...b, 
                type: "Event", 
                normalizedDate: b.invoiceDate || b._creationTime, 
                normalizedAmount: b.totalPrice, 
                normalizedStatus: b.status 
            })),
            ...turfBookings.map(b => ({ 
                ...b, 
                type: "Turf", 
                normalizedDate: b.invoiceDate || b.createdAt, 
                normalizedAmount: b.totalAmount, 
                normalizedStatus: b.bookingStatus 
            })),
            ...vendorBookings.map(b => ({ 
                ...b, 
                type: "Service", 
                normalizedDate: b.invoiceDate || b.createdAt, 
                normalizedAmount: b.totalAmount, 
                normalizedStatus: b.status 
            }))
        ];

        return allBookings
            .filter(b => 
                b.isGstApplied && 
                b.normalizedDate >= args.startDate && 
                b.normalizedDate <= args.endDate
            )
            .sort((a, b) => b.normalizedDate - a.normalizedDate)
            .map(b => ({
                id: b._id,
                type: b.type,
                date: b.normalizedDate,
                invoiceNumber: b.invoiceNumber,
                taxableAmount: b.taxableAmount,
                gstAmount: b.gstAmount,
                gstBreakdown: b.gstBreakdown,
                totalAmount: b.normalizedAmount,
                status: b.normalizedStatus
            }));
    },
});

// Helper for calculating GST
export const calculateGst = (amount: number, config: { cgst: number, sgst: number, igst: number }, pricingType: string) => {
    const totalGstPercent = config.cgst + config.sgst + config.igst;
    
    let taxableAmount = 0;
    let gstAmount = 0;

    if (pricingType === "inclusive") {
        // Amount = Taxable + (Taxable * Percent / 100)
        // Amount = Taxable * (1 + Percent / 100)
        // Taxable = Amount / (1 + Percent / 100)
        taxableAmount = amount / (1 + totalGstPercent / 100);
        gstAmount = amount - taxableAmount;
    } else {
        taxableAmount = amount;
        gstAmount = amount * (totalGstPercent / 100);
    }

    const breakdown = {
        cgst: taxableAmount * (config.cgst / 100),
        sgst: taxableAmount * (config.sgst / 100),
        igst: taxableAmount * (config.igst / 100),
    };

    return {
        taxableAmount: Math.round(taxableAmount * 100) / 100,
        gstAmount: Math.round(gstAmount * 100) / 100,
        gstBreakdown: {
            cgst: Math.round(breakdown.cgst * 100) / 100,
            sgst: Math.round(breakdown.sgst * 100) / 100,
            igst: Math.round(breakdown.igst * 100) / 100,
        }
    };
};

export const generateInvoiceNumber = mutation({
    args: { prefix: v.string() },
    handler: async (ctx, args) => {
        // Simple sequential or timestamp based invoice number
        // For production, a more robust sequence table is recommended
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
        return `${args.prefix}${timestamp}${random}`;
    }
});

export const migrateLegacyInvoiceDates = mutation({
    args: {},
    handler: async (ctx) => {
        const bookings = await ctx.db.query("bookings").filter(q => q.and(q.eq(q.field("isGstApplied"), true), q.eq(q.field("invoiceDate"), undefined))).collect();
        const turf = await ctx.db.query("turfBookings").filter(q => q.and(q.eq(q.field("isGstApplied"), true), q.eq(q.field("invoiceDate"), undefined))).collect();
        const vendor = await ctx.db.query("vendorBookings").filter(q => q.and(q.eq(q.field("isGstApplied"), true), q.eq(q.field("invoiceDate"), undefined))).collect();

        let count = 0;
        for (const b of bookings) {
            await ctx.db.patch(b._id, { invoiceDate: b._creationTime });
            count++;
        }
        for (const t of turf) {
            await ctx.db.patch(t._id, { invoiceDate: t.createdAt });
            count++;
        }
        for (const v of vendor) {
            await ctx.db.patch(v._id, { invoiceDate: v.createdAt });
            count++;
        }
        return { migrated: count };
    }
});
