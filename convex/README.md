# Convex Backend Functions

This directory contains the Convex backend functions (mutations and queries) for real-time synchronization of lecture data.

## Overview

**Convex** is an optional real-time database that synchronizes lecture data across devices and enables future collaboration features.

## File Structure

- `schema.ts` - Database schema definition (5 tables)
- `transcript.ts` - Queries and mutations for transcript management
- `takeaway.ts` - Queries and mutations for takeaway points
- `definition.ts` - Queries and mutations for term definitions
- `_generated/` - Auto-generated Convex runtime (don't edit)

## How It Works

1. **Backend (Python)** sends data to Convex via `backend/services/convex_service.py`
2. **Frontend (React)** can subscribe to live updates (future enhancement)
3. **Schema** defines the database structure in TypeScript
4. **Functions** (mutations/queries) provide the API

## Database Tables

### `transcript`
Real-time transcription of lecture audio.

```typescript
{
  lecture_id: string,
  text: string,
  timestamp: number,
  speaker: string,
  created_at: number
}
```

**Indexes:** `by_lecture`, `by_timestamp`

### `takeaways`
Key points and important takeaways during lecture.

```typescript
{
  lecture_id: string,
  content: string,
  timestamp: number,
  emphasis_level: number,  // 0.0 - 1.0
  created_at: number
}
```

**Indexes:** `by_lecture`, `by_emphasis`

### `definitions`
Term definitions (concepts, people, events).

```typescript
{
  lecture_id: string,
  term: string,
  definition: string,
  definition_type: string,  // 'concept' | 'person' | 'event'
  timestamp: number,
  created_at: number
}
```

**Indexes:** `by_lecture`, `by_term`, `by_type`

### `lectures`
Lecture session metadata.

```typescript
{
  lecture_id: string,
  title: string,
  topic: string,
  created_at: number,
  updated_at: number,
  duration_seconds: number
}
```

**Indexes:** `by_lecture_id`, `by_created`

### `research`
Research queries and synthesis results.

```typescript
{
  lecture_id: string,
  query: string,
  synthesis: string,
  sources: string[],
  timestamp: number,
  created_at: number
}
```

**Indexes:** `by_lecture`, `by_query`

## API Functions

### Transcript API (`transcript.ts`)

- `transcript:add` - Add a new transcript entry (mutation)
- `transcript:getByLecture` - Get all transcripts for a lecture (query)
- `transcript:subscribeToLecture` - Subscribe to live updates (query)
- `transcript:getLatest` - Get most recent entries (query)
- `transcript:clearLecture` - Delete all transcripts for a lecture (mutation)

### Takeaway API (`takeaway.ts`)

- `takeaway:add` - Add a new takeaway (mutation)
- `takeaway:getByLecture` - Get all takeaways for a lecture (query)
- `takeaway:getHighEmphasis` - Filter high-emphasis takeaways (query)
- `takeaway:getLatest` - Get most recent takeaways (query)
- `takeaway:updateEmphasis` - Update emphasis level (mutation)
- `takeaway:delete` - Delete a takeaway (mutation)

### Definition API (`definition.ts`)

- `definition:add` - Add a new definition (mutation)
- `definition:getByLecture` - Get all definitions for a lecture (query)
- `definition:getByType` - Filter by definition type (query)
- `definition:searchByTerm` - Search definition by term (query)
- `definition:getConceptsByLecture` - Get concepts only (query)
- `definition:getPeopleByLecture` - Get people only (query)
- `definition:getEventsByLecture` - Get events only (query)
- `definition:update` - Update definition content (mutation)
- `definition:delete` - Delete a definition (mutation)

## Usage from Python Backend

```python
from services.convex_service import get_convex_service, ConvexTranscriptData

service = get_convex_service()

# Check if enabled
if service.is_enabled():
    # Sync a transcript entry
    data = ConvexTranscriptData(
        lecture_id="lecture_123",
        text="The derivative is the rate of change...",
        timestamp=1234567890.5
    )
    success = await service.sync_transcript(data)
    
    # Retrieve transcripts
    transcripts = await service.get_lecture_transcript("lecture_123")
```

## Setting Up Convex

See [CONVEX_SETUP.md](../CONVEX_SETUP.md) for complete setup instructions.

Quick start:
```bash
cd /Users/spartan/Projects/Lectio
npx convex dev
```

## Testing Functions

Once Convex is running, test functions via Convex dashboard:

1. Go to your Convex deployment: https://dashboard.convex.dev
2. Click "Logs" to see function calls
3. Use "Function Tester" to call functions manually

## Future Enhancements

### Real-time Subscriptions
```typescript
// Frontend can subscribe to live changes
export const subscribeToTranscript = query({
  args: { lecture_id: v.string() },
  handler: async (ctx, args) => {
    // Returns live updates as they occur
  }
});
```

### Presence Tracking
```typescript
// See who's online and taking notes
```

### Global Full-text Search
```typescript
// Search all definitions across all lectures
```

## Important Notes

- ⚠️ **Optional:** Convex is entirely optional. App works fine with SQLite alone.
- 🔄 **Dual DB:** Both SQLite and Convex work together, not as replacements.
- 🚀 **Future-proof:** Schema designed for collaboration and real-time features.
- 📙 **Indexed Queries:** All tables are indexed for fast queries.

## Troubleshooting

### Functions not appearing
- Ensure `npx convex dev` is running
- Check that .ts files are saved
- Wait for "Functions synced" message

### Type errors in TypeScript
- Update Convex types: `npm install -D convex@latest`
- Restart convex dev: `npx convex dev`

### Connection refused
- Make sure CONVEX_URL is set correctly
- Verify you're logged in: `npx convex auth login`
- Check `.env.local` was created

## Resources

- [Convex Documentation](https://docs.convex.dev)
- [Schema Definition](https://docs.convex.dev/database/types-and-validation)
- [Queries and Mutations](https://docs.convex.dev/functions)
- [Real-time Features](https://docs.convex.dev/realtime)
