import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

export const create = mutation({
    args: {
        title: v.string(),
        creatorId: v.string(),
        description: v.optional(v.string()),
        password: v.optional(v.string()),
        settings: v.object({
            lobby: v.boolean(),
            muteOnJoin: v.boolean(),
            videoOffOnJoin: v.boolean(),
            chatEnabled: v.boolean(),
            screenShareEnabled: v.boolean(),
        }),
    },
    handler: async (ctx, args) => {
        // Generate 9-digit numeric code
        const meetingLink = Math.floor(100000000 + Math.random() * 900000000).toString();
        const meetingId = await ctx.db.insert("meetings", {
            ...args,
            status: "scheduled",
            meetingLink,
            createdAt: Date.now(),
        });
        return { meetingId, meetingLink };
    },
});

export const getByLink = query({
    args: { meetingLink: v.string() },
    handler: async (ctx, args) => {
        const meeting = await ctx.db
            .query("meetings")
            .withIndex("by_meetingLink", (q) => q.eq("meetingLink", args.meetingLink))
            .unique();
        
        if (!meeting) return null;

        if (meeting.eventId) {
            const event = await ctx.db.get(meeting.eventId);
            if (event?.endDateTime && Date.now() > event.endDateTime) {
                return { 
                    ...meeting, 
                    isExpired: true, 
                    meetingType: event.meetingType, 
                    externalMeetingUrl: event.externalMeetingUrl 
                };
            }
            return { 
                ...meeting, 
                isExpired: false, 
                meetingType: event?.meetingType || "internal", 
                externalMeetingUrl: event?.externalMeetingUrl 
            };
        }

        return { ...meeting, isExpired: false, meetingType: "internal" };
    },
});

export const join = mutation({
    args: {
        meetingId: v.id("meetings"),
        userId: v.string(),
        name: v.string(),
        role: v.string(),
    },
    handler: async (ctx, args) => {
        // ALLOW MULTIPLE DEVICES: We no longer delete existing participants with the same userId.
        // Each device join creates a unique session. 

        return await ctx.db.insert("meetingParticipants", {
            meetingId: args.meetingId,
            userId: args.userId,
            name: args.name,
            role: args.role,
            status: "joined",
            joinedAt: Date.now(),
        });
    },
});

export const leave = mutation({
    args: {
        meetingId: v.id("meetings"),
        userId: v.string(),
    },
    handler: async (ctx, args) => {
        const participant = await ctx.db
            .query("meetingParticipants")
            .withIndex("by_meetingId", (q) => q.eq("meetingId", args.meetingId))
            .filter((q) => q.eq(q.field("userId"), args.userId))
            .unique();

        if (participant) {
            await ctx.db.patch(participant._id, {
                status: "left",
                leftAt: Date.now(),
            });
        }
    },
});

export const getParticipants = query({
    args: { meetingId: v.id("meetings") },
    handler: async (ctx, args) => {
        const participants = await ctx.db
            .query("meetingParticipants")
            .withIndex("by_meetingId", (q) => q.eq("meetingId", args.meetingId))
            .filter((q) => q.eq(q.field("status"), "joined"))
            .collect();
        
        // Final guard for UI: unique by userId
        const unique = [];
        const seen = new Set();
        for (const p of participants) {
            if (!seen.has(p.userId)) {
                seen.add(p.userId);
                unique.push(p);
            }
        }
        return unique;
    },
});

export const sendSignal = mutation({
    args: {
        meetingId: v.id("meetings"),
        senderId: v.string(), // email
        receiverId: v.optional(v.string()), // email or null for broadcast
        type: v.string(),
        data: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("signals", {
            ...args,
            timestamp: Date.now(),
        });
    },
});

export const getSignals = query({
    args: { meetingId: v.id("meetings"), receiverId: v.string() },
    handler: async (ctx, args) => {
        // Collect signals intended for this receiver or broadcasted
        return await ctx.db
            .query("signals")
            .withIndex("by_meetingId", (q) => q.eq("meetingId", args.meetingId))
            .filter((q) => 
                q.or(
                    q.eq(q.field("receiverId"), args.receiverId),
                    q.eq(q.field("receiverId"), undefined)
                )
            )
            .order("desc")
            .take(20);
    },
});

export const sendMessage = mutation({
    args: {
        meetingId: v.id("meetings"),
        senderId: v.string(),
        senderName: v.string(),
        text: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("meetingMessages", {
            ...args,
            timestamp: Date.now(),
        });
    },
});

export const getMessages = query({
    args: { meetingId: v.id("meetings") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("meetingMessages")
            .withIndex("by_meetingId", (q) => q.eq("meetingId", args.meetingId))
            .order("asc")
            .collect();
    },
});

export const listByCreator = query({
    args: { creatorId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("meetings")
            .withIndex("by_creatorId", (q) => q.eq("creatorId", args.creatorId))
            .order("desc")
            .collect();
    },
});

export const listAll = query({
    handler: async (ctx) => {
        return await ctx.db.query("meetings").order("desc").collect();
    },
});

export const deleteMeeting = mutation({
    args: { meetingId: v.id("meetings") },
    handler: async (ctx, args) => {
        // Delete the meeting
        await ctx.db.delete(args.meetingId);

        // Cleanup participants
        const participants = await ctx.db
            .query("meetingParticipants")
            .withIndex("by_meetingId", (q) => q.eq("meetingId", args.meetingId))
            .collect();
        for (const p of participants) {
            await ctx.db.delete(p._id);
        }

        // Cleanup signals
        const signals = await ctx.db
            .query("signals")
            .withIndex("by_meetingId", (q) => q.eq("meetingId", args.meetingId))
            .collect();
        for (const s of signals) {
            await ctx.db.delete(s._id);
        }

        // Cleanup messages
        const messages = await ctx.db
            .query("meetingMessages")
            .withIndex("by_meetingId", (q) => q.eq("meetingId", args.meetingId))
            .collect();
        for (const m of messages) {
            await ctx.db.delete(m._id);
        }
    },
});

// ── Virtual Event Integrations ─────────────────────────────────────────────

// Auto-create a meeting for a virtual event and patch the event with the meetingUrl slug
export const createForEvent = mutation({
    args: {
        eventId: v.id("events"),
        title: v.string(),
        creatorId: v.string(),
        description: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Check if internal meeting portal is enabled
        // Check if internal meeting portal is enabled
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

        const event = await ctx.db.get(args.eventId);
        if (!event) return null;

        // 2. Local Meeting Logic (Internal or External redirector)
        const existingMeeting = await ctx.db.query("meetings")
            .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
            .first();
        
        if (existingMeeting) {
            // Ensure the event table also has this link
            const event = await ctx.db.get(args.eventId);
            if (event && event.meetingUrl !== existingMeeting.meetingLink) {
                await ctx.db.patch(args.eventId, { meetingUrl: existingMeeting.meetingLink });
            }
            return existingMeeting.meetingLink;
        }

        // Generate 9-digit numeric code
        const meetingLink = Math.floor(100000000 + Math.random() * 900000000).toString();
        await ctx.db.insert("meetings", {
            title: args.title,
            description: args.description,
            creatorId: args.creatorId,
            status: "scheduled",
            meetingLink,
            eventId: args.eventId,
            endDateTime: event.endDateTime, // Local copy for easier queries
            settings: {
                lobby: false,
                muteOnJoin: false,
                videoOffOnJoin: false,
                chatEnabled: true,
                screenShareEnabled: true,
            },
            createdAt: Date.now(),
        });
        
        // Re-use the 'event' variable defined at the top
        if (event) {
            const url = event.meetingUrl;
            // Identify if the current URL is an internal management link that should be replaced
            const isInternalLink = url?.toLowerCase().includes("organiser") || url?.toLowerCase().includes("admin") || url?.toLowerCase().includes("vendor");
            
            // Only patch if meetingUrl is missing OR it's a misconfigured internal link
            if (!url || isInternalLink) {
                await ctx.db.patch(args.eventId, { meetingUrl: meetingLink });
            }
        }
        return meetingLink;
    },
});

// Get the meeting linked to a virtual event (for booking confirmation link reveal)
export const getEventMeeting = query({
    args: { meetingUrl: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("meetings")
            .withIndex("by_meetingLink", (q) => q.eq("meetingLink", args.meetingUrl))
            .unique();
    },
});

// Resiliency Query: Find a meeting for an event if meetingUrl is missing/broken
export const getMeetingByEvent = query({
    args: { eventId: v.id("events") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("meetings")
            .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
            .order("desc") // Get the latest one
            .first();
    },
});

// Maintenance Mutation: Purge all misconfigured/internal meeting links from events table
export const cleanupInternalLinks = mutation({
    args: {},
    handler: async (ctx) => {
        const events = await ctx.db.query("events").collect();
        let count = 0;
        for (const event of events) {
            const url = event.meetingUrl;
            const isInternal = url?.toLowerCase().includes("organiser") || url?.toLowerCase().includes("admin") || url?.toLowerCase().includes("vendor");
            if (isInternal) {
                await ctx.db.patch(event._id, { meetingUrl: undefined });
                count++;
            }
        }
        return { cleaned: count };
    },
});

// Return all active virtual events for the home page "Virtual Events" section
export const getVirtualEvents = query({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        const events = await ctx.db
            .query("events")
            .filter((q) => 
                q.and(
                    q.eq(q.field("virtual"), true),
                    q.or(
                        q.eq(q.field("endDateTime"), undefined),
                        q.gte(q.field("endDateTime"), now)
                    )
                )
            )
            .collect();
        return events.filter((e) => !e.status || e.status === "Active");
    },
});

// ── Admin Settings ─────────────────────────────────────────────────────────

export const getInternalPortalStatus = query({
    args: {},
    handler: async (ctx) => {
        try {
            const rawConfig = await ctx.db
                .query("systemConfig")
                .filter((q) => q.eq(q.field("key"), "internal_meeting_portal_enabled"))
                .first();
            
            if (!rawConfig) return true;
            return typeof rawConfig.value === "string" ? JSON.parse(rawConfig.value) : !!rawConfig.value;
        } catch (e) {
            console.error("getInternalPortalStatus error:", e);
            return true;
        }
    },
});

export const toggleInternalPortal = mutation({
    args: {},
    handler: async (ctx) => {
        const existing = await ctx.db
            .query("systemConfig")
            .filter((q) => q.eq(q.field("key"), "internal_meeting_portal_enabled"))
            .first();
        
        let currentValue = true;
        if (existing) {
            try {
                currentValue = typeof existing.value === "string" ? JSON.parse(existing.value) : !!existing.value;
            } catch (e) {
                currentValue = !!existing.value;
            }
        }
        const newValue = !currentValue;

        if (existing) {
            await ctx.db.patch(existing._id, { value: JSON.stringify(newValue) });
        } else {
            await ctx.db.insert("systemConfig", { 
                key: "internal_meeting_portal_enabled", 
                value: JSON.stringify(newValue) 
            });
        }
        return newValue;
    },
});
