import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Takeaway functions for real-time key point detection
 */

// Add takeaway
export const add = mutation({
  args: {
    lecture_id: v.string(),
    content: v.string(),
    timestamp: v.number(),
    emphasis_level: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("takeaways", {
      lecture_id: args.lecture_id,
      content: args.content,
      timestamp: args.timestamp,
      emphasis_level: args.emphasis_level || 0.5,
      created_at: Date.now(),
    });
    return id;
  },
});

// Get takeaways by lecture
export const getByLecture = query({
  args: {
    lecture_id: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("takeaways")
      .withIndex("by_lecture", (q) => q.eq("lecture_id", args.lecture_id))
      .order("asc")
      .collect();
  },
});

// Get high-emphasis takeaways (emphasis_level > 0.7)
export const getHighEmphasis = query({
  args: {
    lecture_id: v.string(),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("takeaways")
      .withIndex("by_lecture", (q) => q.eq("lecture_id", args.lecture_id))
      .collect();
    
    return all.filter((t) => t.emphasis_level > 0.7);
  },
});

// Get most recent takeaways
export const getLatest = query({
  args: {
    lecture_id: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    return await ctx.db
      .query("takeaways")
      .withIndex("by_lecture", (q) => q.eq("lecture_id", args.lecture_id))
      .order("desc")
      .take(limit)
      .reverse();
  },
});

// Delete a takeaway
export const delete_takeaway = mutation({
  args: {
    takeaway_id: v.id("takeaways"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.takeaway_id);
    return true;
  },
});

// Update takeaway emphasis level
export const updateEmphasis = mutation({
  args: {
    takeaway_id: v.id("takeaways"),
    emphasis_level: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.takeaway_id, {
      emphasis_level: args.emphasis_level,
    });
    return true;
  },
});
