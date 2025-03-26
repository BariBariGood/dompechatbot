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
echo "Checking dependencies..."
npm install

# Trap to ensure we kill all processes when script exits
trap 'kill $(jobs -p) 2>/dev/null' EXIT

# Start development servers
echo "Starting development servers..."
npm run start:dev

echo "Both servers are running. Access the application at http://localhost:3000"
echo "Press Ctrl+C to stop."

# Wait for all background processes
wait 