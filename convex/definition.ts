import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Definition functions for real-time term discovery and explanation
 */

// Add definition
export const add = mutation({
  args: {
    lecture_id: v.string(),
    term: v.string(),
    definition: v.string(),
    definition_type: v.string(), // 'concept', 'person', 'event'
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("definitions", {
      lecture_id: args.lecture_id,
      term: args.term,
      definition: args.definition,
      definition_type: args.definition_type,
      timestamp: args.timestamp,
      created_at: Date.now(),
    });
    return id;
  },
});

// Get definitions by lecture
export const getByLecture = query({
  args: {
    lecture_id: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("definitions")
      .withIndex("by_lecture", (q) => q.eq("lecture_id", args.lecture_id))
      .order("asc")
      .collect();
  },
});

// Get definitions by type
export const getByType = query({
  args: {
    lecture_id: v.string(),
    definition_type: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("definitions")
      .withIndex("by_type", (q) =>
        q.eq("lecture_id", args.lecture_id).eq("definition_type", args.definition_type)
      )
      .collect();
  },
});

// Search definitions by term
export const searchByTerm = query({
  args: {
    term: v.string(),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("definitions")
      .withIndex("by_term", (q) => q.eq("term", args.term))
      .collect();
    
    return all;
  },
});

// Get concept definitions only
export const getConceptsByLecture = query({
  args: {
    lecture_id: v.string(),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("definitions")
      .withIndex("by_lecture", (q) => q.eq("lecture_id", args.lecture_id))
      .collect();
    
    return all.filter((d) => d.definition_type === "concept");
  },
});

// Get people definitions only
export const getPeopleByLecture = query({
  args: {
    lecture_id: v.string(),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("definitions")
      .withIndex("by_lecture", (q) => q.eq("lecture_id", args.lecture_id))
      .collect();
    
    return all.filter((d) => d.definition_type === "person");
  },
});

// Get event definitions only
export const getEventsByLecture = query({
  args: {
    lecture_id: v.string(),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("definitions")
      .withIndex("by_lecture", (q) => q.eq("lecture_id", args.lecture_id))
      .collect();
    
    return all.filter((d) => d.definition_type === "event");
  },
});

// Delete a definition
export const delete_definition = mutation({
  args: {
    definition_id: v.id("definitions"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.definition_id);
    return true;
  },
});

// Update definition content
export const update = mutation({
  args: {
    definition_id: v.id("definitions"),
    definition: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.definition_id, {
      definition: args.definition,
    });
    return true;
  },
});
