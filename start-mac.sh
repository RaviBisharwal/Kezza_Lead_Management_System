#!/bin/bash

echo "============================================================"
echo "  Kezza Lead Management System - macOS Launcher"
echo "============================================================"
echo ""

# Get script directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Download from https://nodejs.org"
    exit 1
fi
echo "✅ Node.js found: $(node -v)"

# Kill any existing processes on ports 3000 and 4200
echo "Checking ports 3000 and 4200..."
lsof -ti :3000,4200 | xargs kill -9 2>/dev/null || true

# Start Backend
echo "Starting Backend on http://localhost:3000 ..."
(cd "$DIR/Whatsapp-Backend" && npm start) &
BACKEND_PID=$!

# Wait 2 seconds
sleep 2

# Start Frontend
echo "Starting Frontend on http://localhost:4200 ..."
(cd "$DIR/Whatsapp-Frontend" && npm start) &
FRONTEND_PID=$!

# Wait for frontend to initialize, then open browser
sleep 3
open http://localhost:4200

echo ""
echo "============================================================"
echo "  Both servers are running!"
echo "  Backend  -> http://localhost:3000 (PID $BACKEND_PID)"
echo "  Frontend -> http://localhost:4200 (PID $FRONTEND_PID)"
echo "  Press Ctrl+C to stop both."
echo "============================================================"

# Handle shutdown
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM
wait
