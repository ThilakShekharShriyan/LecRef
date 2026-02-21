import asyncio
import sys
import os

# Add backend directory to path so we can import services
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from services.extractor import generate_summary

async def test_gemini_service():
    print("🧪 Testing Gemini Service...")
    
    dummy_transcript = (
        "Hello everyone, today we are going to discuss the basics of quantum computing. "
        "Quantum computing uses quantum bits or qubits, which can exist in multiple states at once due to superposition. "
        "This allows them to solve certain problems much faster than classical computers."
    )
    
    print(f"📝 detailed transcript input ({len(dummy_transcript)} chars)...")
    
    try:
        summary = await generate_summary(dummy_transcript)
        
        if summary:
            print("✅ Summary generation successful!")
            print(f"   Summary: {summary}")
        else:
            print("⚠️ No summary returned (check API key or model quota).")
            
    except Exception as e:
        print(f"❌ Error during summary generation: {e}")

if __name__ == "__main__":
    asyncio.run(test_gemini_service())
