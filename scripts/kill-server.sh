#!/bin/bash
# Kill all server processes

echo "🔍 Looking for server processes..."

# Kill tsx and node server processes using pkill
pkill -9 -f "tsx server/index.ts" 2>/dev/null
pkill -9 -f "node.*server/index" 2>/dev/null

sleep 2

# Check remaining processes
REMAINING=$(ps aux | grep -E "tsx server/index.ts|node.*server/index" | grep -v grep | wc -l)

if [ "$REMAINING" -eq 0 ]; then
  echo "✅ All server processes killed"
else
  echo "⚠️  $REMAINING processes still running"
  ps aux | grep -E "tsx server/index.ts|node.*server/index" | grep -v grep
fi

# Check if port 5000 is still in use
sleep 1
if ss -tuln 2>/dev/null | grep -q ":5000 "; then
  echo "⚠️  Port 5000 still in use"
  ss -tuln | grep ":5000 "
else
  echo "✅ Port 5000 is free"
fi
