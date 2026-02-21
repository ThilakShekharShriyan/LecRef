import asyncio
import sys
import os
import signal
import pyaudio
import logging

# Add backend directory to path so we can import services
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

# Configure logging to see service logs
logging.basicConfig(level=logging.INFO)

from services.smallest_service import get_or_create_session, close_session

# Audio configuration
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000
CHUNK = 1024

async def test_smallest_live():
    print("🧪 Testing Smallest.ai Live Transcription (Microphone)...")
    print("🎤 Speak into your microphone. Press Ctrl+C to stop.")

    loop = asyncio.get_running_loop()
    lecture_id = "test_session_live"
    
    # 1. Create the session (starts the Smallest.ai thread)
    print(f"🔌 Connecting to Smallest.ai session: {lecture_id}...")
    stt_session = get_or_create_session(lecture_id, loop)
    
    # 2. Setup PyAudio
    p = pyaudio.PyAudio()
    stream = p.open(
        format=FORMAT,
        channels=CHANNELS,
        rate=RATE,
        input=True,
        frames_per_buffer=CHUNK
    )
    
    print("✅ Listening... (Speak now!)")

    running = True

    # Handle Ctrl+C gracefully
    def signal_handler():
        nonlocal running
        print("\n🛑 Stopping...")
        running = False

    loop.add_signal_handler(signal.SIGINT, signal_handler)

    # 3. Background task to read transcripts (simulating WS handler)
    async def print_transcripts():
        while running:
            try:
                # Wait for next item in the interim queue
                item = await asyncio.wait_for(stt_session.interim_queue.get(), timeout=0.1)
                text, speaker, timestamp, is_final = item
                
                # Print formatted output
                status = "✅ [FINAL]" if is_final else "⏳ [INTERIM]"
                print(f"{status} {text}")
                
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                print(f"⚠️ Queue error: {e}")
                break

    transcript_task = asyncio.create_task(print_transcripts())

    try:
        # 4. Main loop: Read Audio -> Send to Service
        while running:
            # Read raw data from microphone (blocking read, but fast enough)
            data = stream.read(CHUNK, exception_on_overflow=False)
            
            # Send to SmallestSession
            stt_session.send_audio(data)
            
            # Yield control to allow transcript printing
            await asyncio.sleep(0)
            
    except Exception as e:
        print(f"❌ Error in audio loop: {e}")
    finally:
        # Cleanup
        print("🧹 Cleaning up...")
        running = False
        stream.stop_stream()
        stream.close()
        p.terminate()
        
        close_session(lecture_id)
        transcript_task.cancel()
        try:
            await transcript_task
        except asyncio.CancelledError:
            pass
        
        print("👋 Test finished.")

if __name__ == "__main__":
    try:
        asyncio.run(test_smallest_live())
    except KeyboardInterrupt:
        pass
