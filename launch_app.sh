#!/usr/bin/env bash
# LBF Solutions - Full-Stack Offline Desktop Launcher for Linux & macOS

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "==================================================================="
echo "  LBF SOLUTIONS - HEAVY MACHINING & LINE BORING PORTAL"
echo "  Offline Full-Stack Desktop Engine"
echo "==================================================================="

# Check for node
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed. Please install Node.js (v18+) from https://nodejs.org"
    exit 1
fi

# Check dependencies
if [ ! -d "node_modules/express" ]; then
    echo "Installing application dependencies..."
    npm install
fi

# Kill any existing process on port 3000
if command -v lsof &> /dev/null; then
    PID=$(lsof -ti:3000 || true)
    if [ -n "$PID" ]; then
        echo "Clearing port 3000 (PID $PID)..."
        kill -9 $PID 2>/dev/null || true
    fi
fi

echo "Starting offline engine on http://localhost:3000..."
npm run dev &
SERVER_PID=$!

sleep 3

# Open browser
if command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:3000"
elif command -v open &> /dev/null; then
    open "http://localhost:3000"
fi

echo "Application running at http://localhost:3000"
echo "Press Ctrl+C to stop."

wait $SERVER_PID
