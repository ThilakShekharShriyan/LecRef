import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Convex Database Schema for lecRef
 * 
 * Real-time tables for live lecture data synchronization.
 * All tables are optional - lecRef works fine with SQLite alone.
 * Convex provides real-time sync and multi-user collaboration features.
 */

export default defineSchema({
  // Lecture transcript - real-time transcript updates
  transcript: defineTable({
    lecture_id: v.string(),
    text: v.string(),
    timestamp: v.number(),
    speaker: v.string(),
    created_at: v.number(),
  })
    .index("by_lecture", ["lecture_id"])
    .index("by_timestamp", ["lecture_id", "timestamp"]),

  // Key takeaways - important points during lecture
  takeaways: defineTable({
    lecture_id: v.string(),
    content: v.string(),
    timestamp: v.number(),
    emphasis_level: v.number(), // 0.0 - 1.0
    created_at: v.number(),
  })
    .index("by_lecture", ["lecture_id"])
    .index("by_emphasis", ["lecture_id", "emphasis_level"]),

  // Term definitions - concepts, people, events
  definitions: defineTable({
    lecture_id: v.string(),
    term: v.string(),
    definition: v.string(),
    definition_type: v.string(), // 'concept', 'person', 'event'
    timestamp: v.number(),
    created_at: v.number(),
  })
    .index("by_lecture", ["lecture_id"])
    .index("by_term", ["term"])
    .index("by_type", ["lecture_id", "definition_type"]),

  // Lecture sessions - metadata about lectures
  lectures: defineTable({
    lecture_id: v.string(),
    title: v.string(),
    topic: v.string(),
    created_at: v.number(),
    updated_at: v.number(),
    duration_seconds: v.number(),
  })
    .index("by_lecture_id", ["lecture_id"])
    .index("by_created", ["created_at"]),

  // Research queries and results
  research: defineTable({
    lecture_id: v.string(),
    query: v.string(),
    synthesis: v.string(),
    sources: v.array(v.string()),
    timestamp: v.number(),
    created_at: v.number(),
  })
    .index("by_lecture", ["lecture_id"])
    .index("by_query", ["query"]),
});
