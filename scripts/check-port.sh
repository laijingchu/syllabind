#!/bin/bash
PORT=5000

# Simple port check - just verify port is available
if timeout 1 bash -c "echo > /dev/tcp/localhost/$PORT" 2>/dev/null; then
  echo "⚠️  Port $PORT is in use, attempting cleanup..."
  
  # Try to find and kill processes using port 5000
  PIDS=$(lsof -ti:$PORT 2>/dev/null)
  if [ -n "$PIDS" ]; then
    echo "Killing processes: $PIDS"
    echo "$PIDS" | xargs kill -9 2>/dev/null
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
