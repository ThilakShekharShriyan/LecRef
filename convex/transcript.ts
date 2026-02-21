import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Transcript functions for real-time lecture transcription sync
 */

// Add transcript entry
export const add = mutation({
  args: {
    lecture_id: v.string(),
    text: v.string(),
    timestamp: v.number(),
    speaker: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("transcript", {
      lecture_id: args.lecture_id,
      text: args.text,
      timestamp: args.timestamp,
      speaker: args.speaker || "participant",
      created_at: Date.now(),
    });
    return id;
  },
});

// Get transcript by lecture (query)
export const getByLecture = query({
  args: {
    lecture_id: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transcript")
      .withIndex("by_lecture", (q) => q.eq("lecture_id", args.lecture_id))
      .order("asc")
      .collect();
  },
});

// Subscribe to live transcript updates (real-time)
export const subscribeToLecture = query({
  args: {
    lecture_id: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transcript")
      .withIndex("by_lecture", (q) => q.eq("lecture_id", args.lecture_id))
      .order("asc")
      .collect();
  },
});

// Get latest transcript entries
export const getLatest = query({
  args: {
    lecture_id: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    return await ctx.db
      .query("transcript")
      .withIndex("by_lecture", (q) => q.eq("lecture_id", args.lecture_id))
      .order("desc")
      .take(limit)
      .reverse();
  },
});

// Clear transcript for a lecture (admin)
export const clearLecture = mutation({
  args: {
    lecture_id: v.string(),
  },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("transcript")
      .withIndex("by_lecture", (q) => q.eq("lecture_id", args.lecture_id))
      .collect();
    
    for (const entry of entries) {
      await ctx.db.delete(entry._id);
    }
    return entries.length;
  },
});
