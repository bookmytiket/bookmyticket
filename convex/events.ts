import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { api } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import { computeEndDateTime } from "./utils";

export const getActiveEvents = query({
    args: { isAdmin: v.optional(v.boolean()) },
    handler: async (ctx, args) => {
        const events = await ctx.db.query("events").collect();
        const now = Date.now();
        
        // If not admin, filter out inactive and expired events
        if (!args.isAdmin) {
            return events.filter(ev => {
                const isInactive = ev.status === "Inactive" || ev.status === "Expired";
                if (isInactive) return false;
                
                const endTs = ev.endDateTime || computeEndDateTime(ev.date, ev.time) || 0;
                if (endTs > 0 && now > endTs) return false;
                
                return true;
            });
        }
        
        return events;
    },
});

export const markExpiredEvents = internalMutation({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        const events = await ctx.db.query("events")
            .filter((q) => q.or(
                q.eq(q.field("status"), "Active"),
                q.eq(q.field("status"), undefined)
            ))
            .collect();
            
        let count = 0;
        for (const ev of events) {
            const endTs = ev.endDateTime || computeEndDateTime(ev.date, ev.time);
            if (endTs && now > endTs) {
                await ctx.db.patch(ev._id, { status: "Inactive" });
                count++;
            }
        }
        return { markedInactive: count };
    }
});

export const getOrganiserEvents = query({
    args: { organiserId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("events")
            .filter((q) => q.eq(q.field("organiserId"), args.organiserId))
            .collect();
    },
});

export const getEventsWithAnalytics = query({
    args: {},
    handler: async (ctx) => {
        const events = await ctx.db.query("events").collect();
        return Promise.all(
            events.map(async (event) => {
                const scans = await ctx.db
                    .query("pwaScans")
                    .withIndex("by_eventId", (q) => q.eq("eventId", String(event._id)))
                    .collect();
                
                const validScans = scans.filter(s => s.status === "valid");
                const lastScan = scans.length > 0 
                    ? Math.max(...scans.map(s => s.scannedAt))
                    : null;

                return {
                    ...event,
                    scannedCount: validScans.length,
                    lastScannedAt: lastScan,
                };
            })
        );
    },
});

export const createEvent = mutation({
    args: {
        organiserId: v.string(),
        title: v.string(),
        category: v.optional(v.string()),
        type: v.optional(v.string()),
        date: v.optional(v.string()),
        time: v.optional(v.string()),
        img: v.optional(v.string()),
        bannerPreview: v.optional(v.string()),
        seatingEnabled: v.optional(v.boolean()),
        totalSeats: v.optional(v.number()),
        price: v.optional(v.number()),
        location: v.optional(v.string()),
        venue: v.optional(v.string()),
        address: v.optional(v.string()),
        country: v.optional(v.string()),
        state: v.optional(v.string()),
        district: v.optional(v.string()),
        city: v.optional(v.string()),
        featured: v.optional(v.boolean()),
        trending: v.optional(v.boolean()),
        spotlight: v.optional(v.boolean()),
        exclusive: v.optional(v.boolean()),
        status: v.optional(v.string()),
        environment: v.optional(v.string()),
        description: v.optional(v.string()),
        meetingUrl: v.optional(v.string()),
        rows: v.optional(v.number()),
        cols: v.optional(v.number()),
        normalTicketCapacity: v.optional(v.number()),
        normalTicketPrice: v.optional(v.number()),
        virtual: v.optional(v.boolean()),
        meetingType: v.optional(v.string()), // 'internal' or 'external'
        externalMeetingUrl: v.optional(v.string()),
        endDateTime: v.optional(v.number()),
        seatCategories: v.optional(v.array(v.object({
            name: v.string(),
            price: v.number(),
            rows: v.number(),
            isFree: v.optional(v.boolean()),
        }))),
        dateSlots: v.optional(v.array(v.object({
            date: v.string(),
            time: v.string(),
        }))),
        layoutType: v.optional(v.string()),
        seatMapBackgroundUrl: v.optional(v.string()),
        blocks: v.optional(v.array(v.object({
            id: v.string(),
            name: v.string(),
            x: v.number(),
            y: v.number(),
            width: v.number(),
            height: v.number(),
            rows: v.number(),
            cols: v.number(),
            category: v.string(),
            color: v.optional(v.string()),
            rowNaming: v.optional(v.string()),
            startNumber: v.optional(v.number()),
            numberingDirection: v.optional(v.string()),
        }))),
    },
    handler: async (ctx, args) => {
        // Enforce Internal Meeting Portal restriction
        if (args.meetingType === "internal") {
            const rawConfig = await ctx.db
                .query("systemConfig")
                .filter((q) => q.eq(q.field("key"), "internal_meeting_portal_enabled"))
                .first();
            
            let isEnabled = true;
            if (rawConfig) {
                try {
                    isEnabled = typeof rawConfig.value === "string" ? JSON.parse(rawConfig.value) : !!rawConfig.value;
                } catch (e) {
                    isEnabled = !!rawConfig.value;
                }
            }
            if (!isEnabled) {
                throw new Error("Internal Meeting Portal is currently disabled by administrator.");
            }
        }

        const endDateTime = args.endDateTime || computeEndDateTime(args.date, args.time);
        const eventId = await ctx.db.insert("events", {
            ...args,
            endDateTime
        });
        
        // Workflow Automation: If this is an online event, create a meeting link immediately.
        const isVirtual = args.virtual || 
                         args.type?.toLowerCase() === "online" || 
                         args.location?.toLowerCase().includes("online") ||
                         args.title?.toLowerCase().includes("online meeting");
        
        if (isVirtual) {
            await ctx.scheduler.runAfter(0, api.meetings.createForEvent, {
                eventId,
                title: args.title,
                creatorId: args.organiserId,
                description: args.description || `Session for ${args.title}`
            });
        }
        
        // Trigger notifications as a background action
        const organiser = await ctx.db
            .query("organisers")
            .withIndex("by_userId", (q) => q.eq("userId", args.organiserId))
            .first();

        await ctx.scheduler.runAfter(0, api.notificationActions.sendEventCreationNotifications, {
            eventId,
            title: args.title,
            organiserName: organiser?.name || "An Organiser",
            date: args.date,
            location: args.location,
            imageUrl: args.img || args.bannerPreview,
        });

        return eventId;
    },
});

export const deleteEvent = mutation({
    args: { id: v.id("events") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

export const updateEvent = mutation({
    args: {
        id: v.id("events"),
        title: v.optional(v.string()),
        category: v.optional(v.string()),
        type: v.optional(v.string()),
        date: v.optional(v.string()),
        time: v.optional(v.string()),
        img: v.optional(v.string()),
        bannerPreview: v.optional(v.string()),
        seatingEnabled: v.optional(v.boolean()),
        totalSeats: v.optional(v.number()),
        price: v.optional(v.number()),
        location: v.optional(v.string()),
        venue: v.optional(v.string()),
        address: v.optional(v.string()),
        country: v.optional(v.string()),
        state: v.optional(v.string()),
        district: v.optional(v.string()),
        city: v.optional(v.string()),
        featured: v.optional(v.boolean()),
        trending: v.optional(v.boolean()),
        spotlight: v.optional(v.boolean()),
        exclusive: v.optional(v.boolean()),
        status: v.optional(v.string()),
        environment: v.optional(v.string()),
        description: v.optional(v.string()),
        meetingUrl: v.optional(v.string()),
        rows: v.optional(v.number()),
        cols: v.optional(v.number()),
        normalTicketCapacity: v.optional(v.number()),
        normalTicketPrice: v.optional(v.number()),
        virtual: v.optional(v.boolean()),
        meetingType: v.optional(v.string()), // 'internal' or 'external'
        externalMeetingUrl: v.optional(v.string()),
        endDateTime: v.optional(v.number()),
        seatCategories: v.optional(v.array(v.object({
            name: v.string(),
            price: v.number(),
            rows: v.number(),
            isFree: v.optional(v.boolean()),
        }))),
        dateSlots: v.optional(v.array(v.object({
            date: v.string(),
            time: v.string(),
        }))),
        layoutType: v.optional(v.string()),
        seatMapBackgroundUrl: v.optional(v.string()),
        blocks: v.optional(v.array(v.object({
            id: v.string(),
            name: v.string(),
            x: v.number(),
            y: v.number(),
            width: v.number(),
            height: v.number(),
            rows: v.number(),
            cols: v.number(),
            category: v.string(),
            color: v.optional(v.string()),
            rowNaming: v.optional(v.string()),
            startNumber: v.optional(v.number()),
            numberingDirection: v.optional(v.string()),
        }))),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;

        // Enforce Internal Meeting Portal restriction
        if (updates.meetingType === "internal") {
            const rawConfig = await ctx.db
                .query("systemConfig")
                .filter((q) => q.eq(q.field("key"), "internal_meeting_portal_enabled"))
                .first();
            
            let isEnabled = true;
            if (rawConfig) {
                try {
                    isEnabled = typeof rawConfig.value === "string" ? JSON.parse(rawConfig.value) : !!rawConfig.value;
                } catch (e) {
                    isEnabled = !!rawConfig.value;
                }
            }
            if (!isEnabled) {
                throw new Error("Internal Meeting Portal is currently disabled by administrator.");
            }
        }
        
        if (updates.date || updates.time) {
            const current = await ctx.db.get(id);
            if (current && !updates.endDateTime) {
                updates.endDateTime = computeEndDateTime(
                    updates.date || current.date, 
                    updates.time || current.time
                );
            }
        }

        await ctx.db.patch(id, updates);

        // Workflow Resiliency: If this is an online event but no meeting exists, create one.
        const event = await ctx.db.get(id);
        if (!event) return;

        const isVirtual = event.virtual || 
                         event.type?.toLowerCase() === "online" || 
                         event.location?.toLowerCase().includes("online") ||
                         event.title?.toLowerCase().includes("online meeting");
        
        if (isVirtual) {
            const existingMeeting = await ctx.db.query("meetings")
                .withIndex("by_eventId", (q) => q.eq("eventId", id))
                .first();
            
            if (!existingMeeting) {
                const organiser = await ctx.db
                    .query("organisers")
                    .withIndex("by_userId", (q) => q.eq("userId", event.organiserId))
                    .unique();

                await ctx.scheduler.runAfter(0, api.meetings.createForEvent, {
                    eventId: id,
                    title: event.title,
                    creatorId: event.organiserId,
                    description: event.description || `Session for ${event.title}`
                });
            }
        }
    },
});

export const backfillExpiration = mutation({
    args: {},
    handler: async (ctx) => {
        const events = await ctx.db.query("events").collect();
        let updatedCount = 0;
        
        for (const event of events) {
            const isVirtual = event.virtual || 
                             event.type?.toLowerCase() === "online" || 
                             event.type?.toLowerCase() === "virtual" ||
                             event.location?.toLowerCase().includes("online") ||
                             event.location?.toLowerCase().includes("virtual") ||
                             event.title?.toLowerCase().includes("online") ||
                             event.title?.toLowerCase().includes("virtual");

            if (isVirtual && event.endDateTime === undefined) {
                const endDateTime = computeEndDateTime(event.date, event.time);
                if (endDateTime) {
                    await ctx.db.patch(event._id, { endDateTime, virtual: true }); // Also set virtual: true
                    updatedCount++;
                }
            }
        }
        return { updatedCount };
    },
});

export const debugVirtualEvents = query({
    args: {},
    handler: async (ctx) => {
        const events = await ctx.db.query("events").collect();
        return events.map(e => ({
            id: e._id,
            title: e.title,
            date: e.date,
            time: e.time,
            virtual: e.virtual,
            type: e.type,
            location: e.location,
            endDateTime: e.endDateTime
        }));
    }
});

export const getMeetingAccess = query({
    args: { eventId: v.id("events"), userId: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const event = await ctx.db.get(args.eventId);
        if (!event) return { status: "not_found" };

        const isVirtual = event.virtual || 
                         event.type?.toLowerCase() === "online" || 
                         event.location?.toLowerCase().includes("online") ||
                         event.title?.toLowerCase().includes("online meeting");

        if (!isVirtual) return { status: "not_virtual" };

        const now = Date.now();
        const endTs = event.endDateTime || computeEndDateTime(event.date, event.time) || 0;
        
        // Calculate dynamic meeting status
        let meetingStatus: "upcoming" | "live" | "expired" = "live";
        if (endTs && now > endTs) {
            meetingStatus = "expired";
        } else {
            const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000;
            const startTs = endTs - DEFAULT_DURATION_MS;
            
            if (now < startTs) {
                meetingStatus = "upcoming";
            } else {
                meetingStatus = "live";
            }
        }

        const eventDetails = {
            title: event.title,
            description: event.description,
            date: event.date,
            time: event.time,
            img: event.img || event.bannerPreview
        };

        if (meetingStatus === "expired") {
            return { status: "expired", meetingStatus, eventDetails };
        }

        let isBooked = false;
        if (args.userId) {
            const uid = args.userId;
            const booking = await ctx.db.query("bookings")
                .withIndex("by_userId", (q) => q.eq("userId", uid))
                .filter((q) => q.eq(q.field("eventId"), String(args.eventId)))
                .filter((q) => 
                    q.or(
                        q.eq(q.field("status"), "Confirmed"),
                        q.eq(q.field("status"), "Paid"),
                        q.eq(q.field("status"), "Scanned")
                    )
                )
                .first();
            isBooked = !!booking;
        }

        let url = null;
        if (isBooked) {
            url = event.meetingType === "external" ? event.externalMeetingUrl : event.meetingUrl;
            
            if (event.meetingType !== "external") {
                const meeting = await ctx.db.query("meetings")
                    .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
                    .order("desc")
                    .first();
                
                if (meeting && meeting.meetingLink) {
                    url = meeting.meetingLink;
                }
            }
        }

        return { 
            status: isBooked ? "success" : "not_booked",
            meetingStatus,
            url: url || null, 
            type: event.meetingType || "internal",
            eventDetails
        };
    },
});


