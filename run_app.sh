#!/bin/bash

# Function to handle cleanup on exit
cleanup() {
    echo -e "\n🛑 Stopping Lectico..."
    if [ -n "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    exit 0
}

# Trap SIGINT (Ctrl+C)
trap cleanup SIGINT

echo "🚀 Starting Lectico..."

# Check for virtual environment
if [ ! -d "backend/.venv" ]; then
    echo "❌ Error: Backend virtual environment not found at backend/.venv"
    echo "Please run: cd backend && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Check for node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Start Backend
echo "📦 Starting Backend (Port 8000)..."
source backend/.venv/bin/activate
(cd backend && uvicorn main:app --reload --port 8000) &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"

# Start Frontend
echo "🎨 Starting Frontend (Port 5173)..."
npm run dev -- --port 5173 &
FRONTEND_PID=$!

echo "✨ App is running! Open http://localhost:5173"
echo "Press Ctrl+C to stop both servers."

# Wait for processes to keep script running
wait $FRONTEND_PID $BACKEND_PID
