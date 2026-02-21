
import asyncio
import os
import sys
import uuid
from datetime import datetime

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import select, func
from db.database import AsyncSessionLocal
from models.lecture import Lecture, Card

async def main():
    async with AsyncSessionLocal() as db:
        print("--- Finding debug lecture ---")
        result = await db.execute(select(Lecture))
        lectures = result.scalars().all()
        if not lectures:
            print("No lectures found.")
            return
            
        lecture = lectures[0]
        print(f"Using lecture: {lecture.id}")
        
        print("--- Inserting 'Research' Badge Card ---")
        card = Card(
            id=str(uuid.uuid4()),
            lecture_id=lecture.id,
            type="deep_research", 
            term="Research Term",
            content="Research Content",
            citations=[],
            badge_type="Research", # This caused the crash before
            lecture_timestamp_seconds=20,
            created_at=datetime.utcnow()
        )
        db.add(card)
        await db.commit()
        print("Inserted Research card.")

        print("--- Reading Back Cards ---")
        c_res = await db.execute(select(Card).where(Card.lecture_id == lecture.id))
        cards = c_res.scalars().all()
        print(f"Found {len(cards)} cards for lecture {lecture.id}")
        for c in cards:
            print(f"  - {c.term} [{c.badge_type}]: {c.content}")

if __name__ == "__main__":
    asyncio.run(main())
