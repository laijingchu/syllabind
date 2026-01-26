#!/bin/bash
# Cleanly restart the development server

echo "🔄 Restarting development server..."

# Kill existing processes
echo "🔍 Stopping existing server..."
pkill -9 -f "tsx server/index.ts" 2>/dev/null
pkill -9 -f "node.*server/index" 2>/dev/null
sleep 2

# Check if port is free
if ss -tuln 2>/dev/null | grep -q ":5000 "; then
  echo "❌ Port 5000 is still in use!"
  ss -tuln | grep ":5000 "
  echo "⚠️  Waiting 3 more seconds..."
  sleep 3
fi

# Final check
if ss -tuln 2>/dev/null | grep -q ":5000 "; then
  echo "❌ Port 5000 still occupied. Please check manually:"
  ss -tulnp | grep ":5000 "
  exit 1
fi

echo "✅ Port 5000 is free"
echo "🚀 Starting server..."

# Start the server
cd "$(dirname "$0")/.."
npm run dev
