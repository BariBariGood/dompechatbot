#!/bin/bash

# Make script executable
chmod +x start.sh

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for necessary commands
if ! command_exists node; then
    echo "Error: Node.js is not installed. Please install Node.js 16.x or higher."
    exit 1
fi

if ! command_exists npm; then
    echo "Error: npm is not installed. Please install npm."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Warning: .env file not found. Creating one..."
    echo "Created .env file with API key."
fi

# Install dependencies if needed
echo "Checking backend dependencies..."
if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend && npm install && cd ..
else
    echo "Backend dependencies already installed."
fi

echo "Checking frontend dependencies..."
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
else
    echo "Frontend dependencies already installed."
fi

# Trap to ensure we kill all processes when script exits
trap 'kill $(jobs -p) 2>/dev/null' EXIT

# Start backend server
echo "Starting backend server on port 5001..."
cd backend && npm run dev &
BACKEND_PID=$!
echo "Backend server started with PID: $BACKEND_PID"

# Wait for backend to start
sleep 3

# Start frontend server
echo "Starting frontend server on port 3000..."
cd frontend && npm start &
FRONTEND_PID=$!
echo "Frontend server started with PID: $FRONTEND_PID"

echo "Both servers are running. Access the application at http://localhost:3000"
echo "Press Ctrl+C to stop."

# Wait for all background processes
wait 