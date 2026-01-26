#!/bin/bash
# Nuclear option - kill ALL server-related processes

echo "🔪 Force killing all server processes..."

# Method 1: pkill
pkill -9 -f "tsx server/index.ts" 2>/dev/null
pkill -9 -f "node.*server/index" 2>/dev/null

# Method 2: Find by pattern and kill each PID
ps aux | grep -E "tsx server/index.ts|node.*server/index" | grep -v grep | awk '{print $2}' | while read pid; do
  echo "  Killing PID $pid"
  kill -9 "$pid" 2>/dev/null
done

# Method 3: Kill shell wrappers
ps aux | grep "sh -c.*tsx server" | grep -v grep | awk '{print $2}' | while read pid; do
  echo "  Killing shell wrapper PID $pid"
  kill -9 "$pid" 2>/dev/null
done

sleep 2

# Verify
REMAINING=$(ps aux | grep -E "tsx server/index.ts|node.*server/index" | grep -v grep | wc -l)

if [ "$REMAINING" -eq 0 ]; then
  echo "✅ All server processes killed successfully"
  exit 0
else
  echo "⚠️  Warning: $REMAINING processes still running:"
  ps aux | grep -E "tsx server/index.ts|node.*server/index" | grep -v grep
  exit 1
fi
