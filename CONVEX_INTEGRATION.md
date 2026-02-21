# Convex Integration Guide - lecRef

## Quick Summary

lecRef now supports **optional Convex integration** for real-time database synchronization while keeping SQLite as the primary database.

**Status:** Optional feature flag (disabled by default)

### Key Points:
- ✅ **Completely Optional** - App works perfectly with just SQLite
- ✅ **Non-Destructive** - Both databases run independently
- ✅ **Gradual Migration** - Enable when ready
- ✅ **Future-Proof** - Ready for real-time collaboration

---

## Architecture: Dual Database System

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React)                  │
│              (Lecture Session UI)                    │
└────────────────┬──────────────────────────────────────┘
                 │
                 │ HTTP/WebSocket
                 │
┌────────────────▼──────────────────────────────────────┐
│             Backend (FastAPI)                        │
├───────────────────────────────────────────────────────┤
│  Speech Processing │ LLM Services │ TTS             │
└────────────────┬──────────────────┬──────────────────┘
                 │                  │
      ┌──────────▼──────────┐   ┌───▼──────────────┐
      │ SQLite (lecref.db)  │   │ Convex (Cloud)   │
      │ ─────────────────   │   │ ─────────────────│
      │ ✓ Always On        │   │ ✓ If Enabled    │
      │ ✓ Local Storage    │   │ ✓ Real-time     │
      │ ✓ Offline Support  │   │ ✓ Sync Across   │
      │ ✓ Historical Data  │   │ ✓ Collaboration │
      └────────────────────┘   └─────────────────┘
```

## What's New

### Backend Files
- ✅ `backend/services/convex_service.py` - Python Convex client wrapper
- ✅ `backend/config.py` - Updated with `enable_convex` and `convex_url` settings

### Convex Backend Functions
- ✅ `convex/schema.ts` - Database schema definition
- ✅ `convex/transcript.ts` - Transcript queries/mutations
- ✅ `convex/takeaway.ts` - Takeaway queries/mutations
- ✅ `convex/definition.ts` - Definition queries/mutations
- ✅ `convex/README.md` - Convex folder documentation

### Configuration
- ✅ `CONVEX_SETUP.md` - Complete setup guide
- ✅ Feature flag: `enable_convex` in `.env`
- ✅ Updated `requirements.txt` with convex package

---

## Getting Started

### Option A: Keep SQLite Only (Current Default)

**No setup needed!** Everything works as before.

```python
# backend/.env
ENABLE_CONVEX=false  # or just omit this line
```

### Option B: Enable Convex

Follow [CONVEX_SETUP.md](CONVEX_SETUP.md) for step-by-step instructions.

Quick version:
```bash
# Terminal 1: Setup Convex
cd /Users/spartan/Projects/Lectio
npx convex dev

# Terminal 2: Backend (with env updated)
cd backend
ENABLE_CONVEX=true python -m uvicorn main:app --reload

# Terminal 3: Frontend
npm run dev
```

---

## How Data Flows

### During a Lecture Session:

```
1. User starts lecture recording
   ↓
2. Speech audio captured → STT service
   ↓
3. Text extracted → Stored in SQLite ✓
   ↓
4. If Convex enabled → Also sync to Convex ✓
   ↓
5. LLM processes text → Definitions, takeaways
   ↓
6. Definitions stored in SQLite ✓
   ↓
7. If Convex enabled → Sync to Convex ✓
   ↓
8. Frontend displays data (from SQLite or Convex)
```

### Sync Logic:

```python
# In your service handlers
from services.convex_service import get_convex_service

service = get_convex_service()

if service.is_enabled():
    # Sync to both databases
    await db.add_transcript(text)  # SQLite
    await service.sync_transcript(data)  # Convex
else:
    # SQLite only
    await db.add_transcript(text)
```

---

## Feature Comparison

| Feature | SQLite | Convex | Both |
|---------|--------|--------|------|
| **Local storage** | ✅ Automatic | ❌ Cloud only | ✅ Yes |
| **Real-time sync** | ❌ Manual refresh | ✅ Live updates | ✅ Yes |
| **Works offline** | ✅ Full support | ❌ Needs internet | ✅ Mostly* |
| **Collaboration** | ❌ No | ✅ Built-in | ⚠️ Future |
| **Cost** | Free | Free tier | Free tier |
| **Setup difficulty** | ✅ None | ⚠️ Moderate | ⚠️ Moderate |
| **Data backup** | ❌ Manual | ✅ Automatic | ✅ Yes |

*With both: Works offline on SQLite, syncs when Convex reconnects

---

## Configuration Options

### `.env` File

```bash
# Required for SQLite (always)
DATABASE_URL=sqlite+aiosqlite:///./lecref.db

# Optional for Convex
ENABLE_CONVEX=false                    # true to enable
CONVEX_URL=https://your-url.convex.cloud  # Auto-generated
```

### Default Behavior

If you don't set `ENABLE_CONVEX`, it defaults to `false` (SQLite only).

### Check Status at Runtime

```python
from services.convex_service import get_convex_service

service = get_convex_service()
print(f"Convex enabled: {service.is_enabled()}")
# Output: Convex enabled: False
```

---

## Database Tables

### SQLite (Always Enabled)

Using async SQLAlchemy ORM in `backend/db/models/`:
- `lectures` - Session metadata
- `definitions` - Term explanations
- `deep_research` - Research findings
- `takeaways` - Key points
- `events` - Lecture events

### Convex (Optional)

TypeScript schema in `convex/schema.ts`:
- `transcript` - Real-time text
- `takeaways` - Key points
- `definitions` - Term explanations
- `lectures` - Metadata
- `research` - Research findings

**Both databases** have similar structure but serve different purposes:
- **SQLite**: Historical data, local persistence
- **Convex**: Real-time sync, collaboration

---

## Development Workflow

### Standard (SQLite Only)

```bash
# Just start normally
cd backend
python -m uvicorn main:app --reload

cd frontend (in new terminal)
npm run dev
```

### With Convex Enabled

```bash
# Terminal 1: Monitor Convex deployments
cd /Users/spartan/Projects/Lectio
npx convex dev
# Keep this running, logs errors and schema changes

# Terminal 2: Start backend
cd backend
# Make sure .env has: ENABLE_CONVEX=true
python -m uvicorn main:app --reload

# Terminal 3: Start frontend
cd frontend
npm run dev
```

---

## Testing the Integration

### Check Convex Connection

```python
# In a Python script
from services.convex_service import get_convex_service

service = get_convex_service()
print(f"Connected: {service.is_enabled()}")
```

### Verify Logs

Look for `[Convex]` prefixed messages:

```
✓ [Convex] Service initialized with URL: https://happy-otter-123.convex.cloud
✓ [Convex] Transcript synced: lecture_123
✓ [Convex] Retrieved definitions for lecture: lecture_123
```

### Monitor via Dashboard

Once Convex is set up:
1. Go to https://dashboard.convex.dev
2. Select your project
3. View real-time data and function calls

---

## Common Scenarios

### Scenario 1: New Install with SQLite Only

```python
# backend/.env
ENABLE_CONVEX=false  # or omit the setting

# Everything works as usual
# No additional setup needed
```

### Scenario 2: Enable Convex Later

```bash
# When ready:
npx convex dev
# ... setup steps ...
# Update .env: ENABLE_CONVEX=true
# Restart backend
```

### Scenario 3: Switch to Convex Exclusively

```python
# Potential future change (not needed now)
# Stop using SQLite, query Convex only
# Convex provides PostgreSQL compatibility via sync
```

---

## Troubleshooting

### Convex Functions Not Found

```bash
# Make sure convex dev is running
cd /Users/spartan/Projects/Lectio
npx convex dev

# Wait for "Functions synced" message
```

### "Google Docs export fails when Convex enabled"

**Not an issue** - Google Docs and Convex are independent.

If it happens:
1. Check `[GoogleDocs]` logs separately from `[Convex]` logs
2. Verify both `.env` settings are correct
3. Restart backend

### Data Not Syncing to Convex

```python
# Check if enabled
from services.convex_service import get_convex_service
service = get_convex_service()
if not service.is_enabled():
    # Enable it: ENABLE_CONVEX=true in .env
```

---

## Security Considerations

### Credentials Protection

- **SQLite**: Local database, no credentials needed
- **Convex**: Uses CONVEX_URL (public, can be in .env)
- **GitHub auth**: Convex uses GitHub for signup (one-time)

### What's Safe to Commit

✅ Commit:
- `convex/*.ts` files (function definitions)
- `convex/schema.ts` (database schema)
- `backend/services/convex_service.py` (code)

❌ Don't commit:
- `.env.local` (contains CONVEX_URL)
- `.env` (contains secrets)
- Google credentials JSON

Both are in `.gitignore`, so you're safe by default.

---

## Future Enhancements

### Phase 1: Real-time Sync (Current)
- ✅ Optional Convex setup
- ✅ Basic sync functions
- ⏳ Next: Frontend subscriptions

### Phase 2: Real-time Collaboration
- ⏳ Multiple users in same lecture
- ⏳ Live definition voting
- ⏳ Shared takeaways

### Phase 3: Advanced Features
- ⏳ Presence indicators (who's typing)
- ⏳ Comment threads on definitions
- ⏳ Lecture sharing and permissions

---

## Resources

- [CONVEX_SETUP.md](CONVEX_SETUP.md) - Step-by-step setup guide
- [convex/README.md](convex/README.md) - Convex functions reference
- [Convex Documentation](https://docs.convex.dev)
- [Python Client Docs](https://docs.convex.dev/client/python)

---

## Summary

✅ **What you have:**
- Optional Convex integration
- Dual-database architecture
- Simple feature flag
- Complete documentation
- Zero breaking changes

🚀 **Next steps:**
- Keep using SQLite (default)
- Or enable Convex when ready
- Or prepare for real-time features

📝 **Files to Review:**
1. [CONVEX_SETUP.md](CONVEX_SETUP.md) - For setup
2. [convex/README.md](convex/README.md) - For API reference
3. [backend/services/convex_service.py](backend/services/convex_service.py) - For implementation
4. [backend/config.py](backend/config.py) - For configuration

---

**Status:** Ready to use, optional dependency, backward compatible. ✨
