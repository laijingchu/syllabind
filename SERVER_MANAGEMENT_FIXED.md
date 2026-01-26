# Server Management - Port Conflict Fixed ✅

## Problem Summary

The `npm run dev:clean` command wasn't killing all server processes properly, leading to "EADDRINUSE" errors even after running the kill command.

**Root Cause**: The original kill command using `grep` and `awk` wasn't catching all related processes, especially:
- Shell wrapper processes (`sh -c ...`)
- Parent tsx processes
- Child node processes running server/index.ts

## Solution Applied

Updated the kill mechanism to use `pkill` which is more reliable for killing process trees.

---

## ✅ What Was Fixed

### 1. Improved Kill Command in package.json

**Before:**
```bash
ps aux | grep -E 'tsx server/index.ts|node.*server/index' | grep -v grep | awk '{print $2}' | xargs kill -9
```
*Problem: Missed some processes, didn't wait for port release*

**After:**
```bash
pkill -9 -f 'tsx server/index.ts'; pkill -9 -f 'node.*server/index'; sleep 1
```
*Solution: Kills all matching processes including children, waits for port release*

### 2. Updated Shell Scripts

Both `scripts/kill-server.sh` and `scripts/restart-server.sh` now use:
- `pkill -9 -f` for process killing
- Proper wait times (2 seconds)
- Better verification of killed processes
- Uses `ss` instead of `netstat` (more modern)

### 3. Process Detection

The improved method now catches ALL these processes:
```bash
✅ sh -c NODE_ENV=development tsx server/index.ts
✅ node .../tsx server/index.ts
✅ node --require .../tsx/preflight.cjs server/index.ts (actual server)
```

---

## 🚀 How to Use (Updated Commands)

### Start Server (Recommended Method)

```bash
npm run dev:clean
```

This now properly:
1. ✅ Kills ALL server processes (including children)
2. ✅ Waits 1 second for port release
3. ✅ Starts fresh server instance

### Stop Server

```bash
npm run kill
```

Or use the shell script:
```bash
./scripts/kill-server.sh
```

### Restart Server

```bash
./scripts/restart-server.sh
```

This script now:
- Kills all processes
- Waits for port release
- Verifies port is free
- Starts server

---

## 🔍 Verify It's Working

### Check No Server Processes Running

```bash
ps aux | grep -E "tsx server/index.ts|node.*server/index" | grep -v grep
```

Should return: **nothing** (no output)

### Check Port is Free

```bash
ss -tuln | grep ":5000 "
```

Should return: **nothing** (no output)

### Start Server and Verify

```bash
npm run dev:clean
# Wait 5 seconds
curl http://localhost:5000/api/syllabi
```

Should return: **JSON array of syllabi**

---

## 📋 Current Server Status

As of now:
```
🟢 Server: Running on port 5000
🟢 Kill command: Working properly
🟢 Clean start: Working properly
🟢 API: Responding correctly
```

Test endpoint:
```bash
curl http://localhost:5000/api/syllabi
```

---

## 🛠️ Troubleshooting New Issues

### Issue: "pkill: command not found"

**Solution**: Use the fallback method in the scripts:
```bash
ps aux | grep -E "tsx server/index.ts|node.*server/index" | grep -v grep | awk '{print $2}' | xargs kill -9
```

### Issue: Still getting EADDRINUSE after kill

**Solution**: Wait longer before restarting:
```bash
npm run kill
sleep 5  # Wait 5 seconds
npm run dev
```

### Issue: Can't find the process

**Solution**: Find it manually:
```bash
# List all node processes
ps aux | grep node

# Find the one using port 5000
ss -tulnp | grep ":5000 "

# Kill by PID
kill -9 <PID>
```

### Issue: Multiple attempts needed

**Solution**: Run kill multiple times:
```bash
npm run kill
sleep 2
npm run kill  # Run again to catch stragglers
sleep 2
npm run dev
```

---

## 🎯 Best Practices Going Forward

### During Development

1. **Always use `npm run dev:clean`**
   - Ensures clean start every time
   - No need to check for existing processes

2. **Stop server properly**
   - Use **Ctrl+C** when possible
   - Or use `npm run kill` from another terminal

3. **If in doubt, kill and restart**
   ```bash
   npm run dev:clean
   ```

### When Debugging

1. **Check what's running first**
   ```bash
   ps aux | grep tsx
   ```

2. **Check what's using port 5000**
   ```bash
   ss -tuln | grep 5000
   ```

3. **Use verbose kill script**
   ```bash
   ./scripts/kill-server.sh  # Shows what it's doing
   ```

---

## 📊 Technical Details

### Why pkill is Better

**Old method (grep + awk + xargs):**
```bash
ps aux | grep "pattern" | grep -v grep | awk '{print $2}' | xargs kill -9
```
- Multiple steps, each can fail
- Doesn't catch child processes reliably
- Race conditions possible
- Misses processes with different formatting

**New method (pkill):**
```bash
pkill -9 -f "pattern"
```
- Single atomic operation
- Matches full command line (`-f` flag)
- Kills all matching processes including children
- More reliable
- Fewer race conditions

### Process Tree Example

When you run `npm run dev`, it creates:
```
shell (sh)
  └─ node (tsx)
       └─ node (actual server)
```

**Old method:** Might only kill one level
**New method:** Kills all levels that match the pattern

---

## 📝 Summary of Changes

### Files Modified

1. **`package.json`**
   - Updated `kill` script to use `pkill`
   - Added sleep for port release

2. **`scripts/kill-server.sh`**
   - Uses `pkill` instead of grep/awk
   - Better process verification
   - Uses `ss` instead of `netstat`

3. **`scripts/restart-server.sh`**
   - Uses `pkill` for killing
   - Extended wait time for port release
   - Better error checking

4. **`PORT_CONFLICT_GUIDE.md`**
   - Updated with new pkill method
   - Added fallback instructions

### New Files Created

5. **`SERVER_MANAGEMENT_FIXED.md`** (this file)
   - Complete documentation of fix
   - Usage instructions
   - Troubleshooting guide

---

## ✅ Verification Checklist

- [x] `npm run kill` properly kills all processes
- [x] `npm run dev:clean` starts server without EADDRINUSE
- [x] Server responds to API requests
- [x] Scripts work from shell
- [x] Port 5000 is released properly
- [x] No zombie processes remain

---

## 🚀 Next Steps

1. **Test the fix**:
   ```bash
   npm run dev:clean
   curl http://localhost:5000/api/syllabi
   ```

2. **Use it in your workflow**:
   - Start development: `npm run dev:clean`
   - Stop server: Ctrl+C or `npm run kill`
   - Restart if needed: `npm run dev:clean`

3. **Report any issues** if you still see EADDRINUSE errors:
   - Run: `ps aux | grep tsx`
   - Run: `ss -tuln | grep 5000`
   - Share output for further debugging

---

## 💡 Quick Reference

| Command | What It Does |
|---------|--------------|
| `npm run dev:clean` | Kill existing + start fresh (RECOMMENDED) |
| `npm run kill` | Kill all server processes |
| `npm run dev` | Start server normally |
| `./scripts/kill-server.sh` | Detailed kill with verification |
| `./scripts/restart-server.sh` | Complete restart cycle |

**Pro tip:** Just use `npm run dev:clean` for everything! It handles all the complexity for you.

---

## Status: ✅ FIXED

The port conflict issue is now resolved. The `npm run dev:clean` command will reliably kill all server processes and start a fresh instance.

**Current server:** Running on port 5000, ready to use! 🎉
