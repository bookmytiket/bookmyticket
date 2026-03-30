import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
        return await ctx.db
            .query("meetings")
            .withIndex("by_meetingLink", (q) => q.eq("meetingLink", args.meetingLink))
            .unique();
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
        const existing = await ctx.db
            .query("meetingParticipants")
            .withIndex("by_meetingId", (q) => q.eq("meetingId", args.meetingId))
            .filter((q) => q.eq(q.field("userId"), args.userId))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, {
                status: "joined",
                joinedAt: Date.now(),
            });
            return existing._id;
        }

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
        return await ctx.db
            .query("meetingParticipants")
            .withIndex("by_meetingId", (q) => q.eq("meetingId", args.meetingId))
            .filter((q) => q.eq(q.field("status"), "joined"))
            .collect();
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
        // Generate 9-digit numeric code
        const meetingLink = Math.floor(100000000 + Math.random() * 900000000).toString();
        await ctx.db.insert("meetings", {
            title: args.title,
            description: args.description,
            creatorId: args.creatorId,
            status: "scheduled",
            meetingLink,
            settings: {
                lobby: false,
                muteOnJoin: false,
                videoOffOnJoin: false,
                chatEnabled: true,
                screenShareEnabled: true,
            },
            createdAt: Date.now(),
        });
        await ctx.db.patch(args.eventId, { meetingUrl: meetingLink });
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

// Return all active virtual events for the home page "Virtual Events" section
export const getVirtualEvents = query({
    args: {},
    handler: async (ctx) => {
        const events = await ctx.db
            .query("events")
            .filter((q) => q.eq(q.field("virtual"), true))
            .collect();
        return events.filter((e) => !e.status || e.status === "Active");
    },
});
