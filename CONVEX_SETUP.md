# Convex Integration Setup Guide

## Overview

lecRef now supports **optional real-time database synchronization** using [Convex](https://convex.dev). This guide walks you through setting up Convex for live lecture data sync.

**Important:** Convex is completely optional. lecRef works perfectly with SQLite alone. Convex is recommended for:
- Real-time collaboration in the future
- Live transcript and takeaway updates across devices
- Scalable production deployments

## When to Use Convex vs SQLite

| Feature | SQLite | Convex |
|---------|--------|--------|
| Local Development | ✅ Works great | ✅ Works great |
| Real-time Sync | ❌ Manual refresh needed | ✅ Automatic live updates |
| Multi-device | ❌ Limited | ✅ Full sync |
| Collaboration | ❌ Not supported | ✅ Built-in |
| Offline Support | ✅ Works offline | ⚠️ Need internet |
| Cloud Backup | ❌ Manual | ✅ Automatic |
| Cost | Free | Free tier + paid | 

## Prerequisites

- Node.js 18+ (for Convex CLI)
- npm or yarn
- GitHub account (for Convex authentication)
- `npx` available in your terminal

## Step 1: Install Convex CLI

```bash
npm install -g convex
# or
yarn global add convex
```

Verify installation:
```bash
convex --version
```

## Step 2: Initialize Convex Project

From the project root `/Users/spartan/Projects/Lectio`:

```bash
npx convex dev
```

This command will:
1. Prompt you to log in with GitHub (opens browser, authorize access)
2. Create a new Convex project
3. Ask where to place functions (should be `convex/` - already created)
4. Generate `.env.local` with your `CONVEX_URL`
5. Keep running to sync changes (Ctrl+C to stop)

**Output example:**
```
✓ Github sign in complete
✓ Created new project lecref-1234
✓ Updated convex.json
✓ Added .env.local with CONVEX_URL=https://happy-otter-123.convex.cloud
```

## Step 3: Configure Backend

### Add to `.env` file:

```bash
# In backend/.env
ENABLE_CONVEX=true
```

### Optional: Set custom Convex URL (if using existing project)

```bash
# In backend/.env
CONVEX_URL=https://your-deployment-url.convex.cloud
```

The URL is automatically generated in `.env.local` during `npx convex dev`.

## Step 4: Install Python Client

The Convex Python client was already added to `requirements.txt`, but install it:

```bash
cd /Users/spartan/Projects/Lectio/backend
pip install -r requirements.txt
```

Or just the Convex package:
```bash
pip install convex
```

## Step 5: Test the Integration

### Terminal 1 - Start Convex sync:
```bash
cd /Users/spartan/Projects/Lectio
npx convex dev
# Keep this running in background
```

### Terminal 2 - Start backend:
```bash
cd /Users/spartan/Projects/Lectio/backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

You should see in logs:
```
[Convex] Service initialized with URL: https://happy-otter-123.convex.cloud
```

### Terminal 3 - Start frontend:
```bash
cd /Users/spartan/Projects/Lectio
npm run dev
```

## Step 6: Use the Feature

During a lecture session:

1. **SQLite alone:** Works as before, data saved locally
2. **With Convex enabled:** Data syncs to Convex in real-time
   - Transcript updates live
   - Takeaways appear instantly
   - Definitions sync across devices (future)

## Architecture: Dual Database

```
              Frontend (React)
                    |
          +------------------+
          |                  |
       SQLite          Convex (optional)
    (Local DB)        (Real-time Cloud)
    (Always on)       (If enabled)
```

**Data Flow:**
1. Speech recognized → STT service
2. Text stored in SQLite (always)
3. If Convex enabled → Also sync to Convex
4. Frontend receives updates from both sources

## Troubleshooting

### "CONVEX_URL not set" warning
- Make sure `npx convex dev` is running
- Check `.env.local` exists with CONVEX_URL
- Verify you copied it to `.env` or config

### Convex functions not deploying
```bash
# Ensure you're in the right directory
cd /Users/spartan/Projects/Lectio
npx convex dev
```

### Python import error for convex
```bash
pip install --upgrade convex
pip install -r backend/requirements.txt
```

### Services not syncing
1. Check `ENABLE_CONVEX=true` in `.env`
2. Verify `CONVEX_URL` is correct
3. Check backend logs for `[Convex]` prefix messages
4. Restart backend server after config changes

## File Structure

After setup, you'll have:

```
/Users/spartan/Projects/Lectio/
├── convex/
│   ├── schema.ts              # Database schema
│   ├── transcript.ts          # Transcript functions
│   ├── takeaway.ts            # Takeaway functions
│   ├── definition.ts          # Definition functions
│   └── _generated/            # Auto-generated (don't edit)
├── .env.local                 # Generated (CONVEX_URL)
├── convex.json                # Convex project config
└── backend/
    └── services/
        └── convex_service.py  # Python Convex client
```

## Feature Flags in Code

The backend automatically checks if Convex is enabled:

```python
from services.convex_service import get_convex_service

service = get_convex_service()
if service.is_enabled():
    # Use Convex
    await service.sync_transcript(data)
else:
    # Fall back to SQLite only
    pass
```

**No code changes needed!** Both databases work independently.

## Database Schema

**Convex tables** (defined in `convex/schema.ts`):
- `transcript` - Real-time lecture text
- `takeaways` - Key points with emphasis levels
- `definitions` - Term explanations (concept/person/event)
- `lectures` - Lecture metadata
- `research` - Research findings

**Indexes for performance:**
- By lecture_id (fast lecture lookups)
- By timestamp (chronological queries)
- By type (filter definitions by category)
- By term (search definitions)

## Future Enhancements

Once Convex is set up, you can add:

1. **Real-time Collaboration**
   ```typescript
   // Multiple users in same lecture, all see updates live
   export const subscribeToLecture = query({
     args: { lecture_id: v.string() },
     handler: async (ctx, args) => {
       return await ctx.db.query("transcript")...
     }
   });
   ```

2. **Presence Tracking**
   ```typescript
   // See who's actively taking notes on a term
   ```

3. **Live Reactions**
   ```typescript
   // Users vote on important definitions
   ```

4. **Automatic Sync Back to SQLite**
   ```python
   # Periodic backup of Convex → SQLite
   ```

## Cost

**Free tier includes:**
- 1M operations/month
- 100MB storage
- Perfect for development and small deployments

**Paid tiers:** Start at $20/month for higher limits

See [Convex Pricing](https://convex.dev/pricing) for details.

## Learn More

- [Convex Documentation](https://docs.convex.dev)
- [Convex Python Client](https://docs.convex.dev/client/python)
- [Building Real-time Apps](https://docs.convex.dev/realtime)
- [Convex Database Schema](https://docs.convex.dev/database/types-and-validation)

## Support

For Convex-specific issues:
1. Check the [Convex docs](https://docs.convex.dev)
2. Look for `[Convex]` prefixed logs in backend
3. Ensure `enable_convex` setting matches your intention

For lecRef-specific Convex integration:
1. Check `backend/services/convex_service.py` for implementation
2. Review the function signatures in `convex/*.ts` files
3. Ensure `.env` has correct settings
