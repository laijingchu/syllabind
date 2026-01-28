# Port Conflict Guide - EADDRINUSE Error

## The Problem

You see this error when starting the dev server:

```
Error: listen EADDRINUSE: address already in use 0.0.0.0:5000
```

**Cause**: Port 5000 is already in use by another process (usually a previous server instance that wasn't properly stopped).

---

## Quick Fixes

### Method 1: Use the Clean Start Script ⭐ (Recommended)

```bash
npm run dev:clean
```

This automatically kills any existing server processes and starts fresh.

---

### Method 2: Kill Server Manually

```bash
npm run kill
```

Then start the server normally:

```bash
npm run dev
```

---

### Method 3: Using the Shell Scripts

Kill the server:
```bash
./scripts/kill-server.sh
```

Restart the server:
```bash
./scripts/restart-server.sh
```

---

### Method 4: Manual Process Kill

Find and kill the process:

```bash
# Find the process
ps aux | grep "tsx server/index.ts"

# Kill it (replace <PID> with the actual process ID)
kill -9 <PID>
```

Or kill all server processes at once (most reliable):

```bash
pkill -9 -f "tsx server/index.ts"
pkill -9 -f "node.*server/index"
sleep 2
```

Legacy method (if pkill not available):
```bash
ps aux | grep -E "tsx server/index.ts|node.*server" | grep -v grep | awk '{print $2}' | xargs kill -9
```

---

## Prevention Tips

### 1. Always Use Ctrl+C to Stop the Server

When stopping the dev server, use **Ctrl+C** in the terminal where it's running. This cleanly shuts down the process.

❌ Don't: Close the terminal window without stopping the server
✅ Do: Press Ctrl+C to stop the server first

### 2. Use the Clean Start Script

If you're unsure whether the server is running, use:

```bash
npm run dev:clean
```

This ensures a clean start every time.

### 3. Check if Port is in Use

Before starting the server, check if port 5000 is free:

```bash
# On Linux/Mac
netstat -tuln | grep 5000

# Or check for server processes
ps aux | grep "tsx server"
```

---

## Troubleshooting

### Issue: `npm run kill` doesn't work

**Solution**: Try the manual kill command:

```bash
pkill -9 -f "tsx server/index.ts"
```

Or find and kill the process manually:

```bash
ps aux | grep tsx
# Note the PID (second column)
kill -9 <PID>
```

### Issue: Port still in use after killing processes

**Solution**: Wait a few seconds for the OS to release the port, then try again:

```bash
sleep 2
npm run dev
```

### Issue: Different port needed

**Solution**: Change the PORT environment variable:

```bash
PORT=3000 npm run dev
```

Or update `.env`:
```
PORT=3000
```

### Issue: Permission denied

**Solution**: You may need sudo for some commands:

```bash
sudo npm run kill
```

---

## Available NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run dev:clean` | Kill existing servers and start fresh |
| `npm run kill` | Kill all server processes |

---

## Understanding the Error

### What is EADDRINUSE?

- **EADDRINUSE** = "Error: Address Already In Use"
- Means: Another process is already listening on port 5000
- Common causes:
  - Previous server instance still running
  - Another application using port 5000
  - Server crashed but didn't release the port

### How Ports Work

1. When you start the server, it "binds" to port 5000
2. Only ONE process can bind to a port at a time
3. When the server stops, it "releases" the port
4. If the server crashes or is killed improperly, the port may stay bound for a few seconds

---

## Best Practices

### During Development

1. **Use one terminal for the server**
   - Keep it open and visible
   - Stop with Ctrl+C when needed
   - Don't close the terminal while server is running

2. **Use `npm run dev:clean` when in doubt**
   - Ensures clean start
   - No need to manually check for processes

3. **Check server status before starting**
   ```bash
   ps aux | grep tsx
   ```

### When Debugging

1. **Check server logs** if port is occupied:
   ```bash
   tail -f /tmp/server.log
   ```

2. **Test if port is responding**:
   ```bash
   curl http://localhost:5000/api/syllabi
   ```

3. **If uncertain, use clean start**:
   ```bash
   npm run dev:clean
   ```

---

## Quick Reference

### Start Server
```bash
npm run dev              # Normal start
npm run dev:clean        # Clean start (kills existing first)
```

### Stop Server
```bash
# In the terminal where server is running:
Ctrl+C

# From another terminal:
npm run kill
```

### Check Server Status
```bash
ps aux | grep tsx                    # Find server processes
netstat -tuln | grep 5000           # Check if port is in use
curl http://localhost:5000          # Test if server responds
```

### Kill Server
```bash
npm run kill                         # Using npm script
./scripts/kill-server.sh            # Using shell script
pkill -9 -f "tsx server/index.ts"   # Direct command
```

---

## When to Use Each Method

| Situation | Recommended Method |
|-----------|-------------------|
| Normal development workflow | `npm run dev` + Ctrl+C |
| Server won't start (port in use) | `npm run dev:clean` |
| Need to restart quickly | `npm run dev:clean` |
| Multiple servers might be running | `npm run kill` then `npm run dev` |
| Shell script preference | `./scripts/restart-server.sh` |
| Debugging/testing | `npm run kill` between runs |

---

## Summary

**Quick Fix**:
```bash
npm run dev:clean
```

**Manual Fix**:
```bash
npm run kill
npm run dev
```

**Prevention**:
- Always stop server with Ctrl+C
- Use `npm run dev:clean` when unsure
- Keep server terminal visible

---

## Related Files

- `scripts/kill-server.sh` - Shell script to kill server
- `scripts/restart-server.sh` - Shell script to restart server
- `package.json` - Contains the npm scripts

---

## Need More Help?

1. Check if any process is using port 5000:
   ```bash
   ps aux | grep 5000
   ```

2. Try a different port:
   ```bash
   PORT=3001 npm run dev
   ```

3. Restart your terminal/IDE

4. As a last resort, restart your computer (releases all ports)
