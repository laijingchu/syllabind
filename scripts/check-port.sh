#!/bin/bash
PORT=5000

# Simple port check - just verify port is available
if timeout 1 bash -c "echo > /dev/tcp/localhost/$PORT" 2>/dev/null; then
  echo "⚠️  Port $PORT is in use, attempting cleanup..."
  
  # Stage 1: Graceful shutdown (SIGTERM)
  echo "  Stage 1: Attempting graceful shutdown..."
  INITIAL_COUNT=$(ps aux | grep -E "tsx server/index.ts|node.*server/index" | grep -v grep | wc -l)
  if [ "$INITIAL_COUNT" -gt 0 ]; then
    pkill -TERM -f "tsx server/index.ts" 2>/dev/null
    pkill -TERM -f "node.*server/index" 2>/dev/null
    sleep 3
  fi

  # Stage 2: Force kill server processes (SIGKILL)
  REMAINING=$(ps aux | grep -E "tsx server/index.ts|node.*server/index" | grep -v grep | wc -l)
  if [ "$REMAINING" -gt 0 ]; then
    echo "  Stage 2: Force killing $REMAINING process(es)..."
    pkill -9 -f "tsx server/index.ts" 2>/dev/null
    pkill -9 -f "node.*server/index" 2>/dev/null
    ps aux | grep -E "tsx server/index.ts|node.*server/index" | grep -v grep | awk '{print $2}' | while read pid; do
      kill -9 "$pid" 2>/dev/null
    done
    sleep 2
  fi

  # Stage 3: Nuclear cleanup (shell wrappers, orphans)
  REMAINING=$(ps aux | grep -E "tsx server/index.ts|node.*server/index|sh -c.*tsx server" | grep -v grep | wc -l)
  if [ "$REMAINING" -gt 0 ]; then
    echo "  Stage 3: Cleaning up wrappers and orphans..."
    ps aux | grep "sh -c.*tsx server" | grep -v grep | awk '{print $2}' | while read pid; do
      kill -9 "$pid" 2>/dev/null
    done
    sleep 2
  fi
  
  # Check again
  if timeout 1 bash -c "echo > /dev/tcp/localhost/$PORT" 2>/dev/null; then
    echo "❌ Port $PORT is still in use"
    exit 1
  fi
fi

echo "✅ Port $PORT is available"
exit 0
