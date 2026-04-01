import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getRooms = query({
    args: { userId: v.string() }, // Can be vendor or user email
    handler: async (ctx, args) => {
        const rooms = await ctx.db
            .query("chatRooms")
            .withIndex("by_lastMessageAt", (q) => q.gt("lastMessageAt", 0))
            .order("desc")
            .collect();
        return rooms.filter(r => r.participants.includes(args.userId));
    },
});

export const getMessages = query({
    args: { roomId: v.id("chatRooms") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("chatMessages")
            .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
            .collect();
    },
});

export const sendMessage = mutation({
    args: {
        roomId: v.id("chatRooms"),
        senderId: v.string(),
        text: v.string(),
    },
    handler: async (ctx, args) => {
        const timestamp = Date.now();
        await ctx.db.insert("chatMessages", {
            roomId: args.roomId,
            senderId: args.senderId,
            text: args.text,
            timestamp,
        });

        await ctx.db.patch(args.roomId, {
            lastMessage: args.text,
            lastMessageAt: timestamp,
        });
    },
});

export const getOrCreateRoom = mutation({
    args: { participants: v.array(v.string()) },
    handler: async (ctx, args) => {
        const rooms = await ctx.db
            .query("chatRooms")
            .collect();
        
        const existing = rooms.find(r => 
            r.participants.includes(args.participants[0]) && 
            r.participants.includes(args.participants[1])
        );
        
        if (existing) return existing._id;

        return await ctx.db.insert("chatRooms", {
            participants: args.participants,
            lastMessage: "",
            lastMessageAt: Date.now(),
        });
    },
});
