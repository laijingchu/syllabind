# 🔐 Login Troubleshooting Guide

## Verified Test Credentials

The following credentials have been verified to work:

**Creator Account:**
- Email: `jane@example.com`
- Password: `password123`

**Learner Accounts:**
- Email: `alex@example.com` - Password: `password123`
- Email: `sarah@example.com` - Password: `password123`
- Email: `marcus@example.com` - Password: `password123`
- Email: `emily@example.com` - Password: `password123`
- Email: `david@example.com` - Password: `password123`

---

## Common Issues & Solutions

### 1. Server Not Running

**Symptom:** Login form shows "Login failed" immediately

**Solution:**
```bash
# Make sure the server is running
npm run dev
```

The server must be running on port 5000. Look for:
```
> NODE_ENV=development tsx server/index.ts
Server listening on port 5000
```

### 2. Database Not Seeded

**Symptom:** Login works but shows empty catalog/dashboard

**Solution:**
```bash
# Seed the database
npm run db:seed
```

You should see:
```
✅ Created creator: janesmith
✅ Created learner: alexlearner
...
✨ Database seeded successfully!
```

### 3. Browser Cache Issues

**Symptom:** Form submits but nothing happens, or old error persists

**Solutions:**
- Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Clear browser cache for localhost
- Try incognito/private browsing window
- Clear all cookies for localhost:5000

### 4. Session/Cookie Issues

**Symptom:** Login seems successful but immediately logged out

**Solutions:**

Check browser console (F12) for errors like:
- "Failed to set cookie"
- "Cross-origin cookie blocked"

**Fix:**
```bash
# Make sure you're accessing via http://localhost:5000
# NOT 127.0.0.1 or any other address
```

If using a different domain/port, update session settings in `server/auth/index.ts`.

### 5. Database Connection Issues

**Symptom:** Server starts but login fails with "Login failed"

**Check:**
```bash
# Verify DATABASE_URL is set
echo $DATABASE_URL

# Test database connection
psql "$DATABASE_URL" -c "SELECT count(*) FROM users;"
```

**Expected output:**
```
 count
-------
     6
(1 row)
```

### 6. Password Case Sensitivity

**Important:** The password is lowercase: `password123`

NOT:
- ❌ `Password123`
- ❌ `PASSWORD123`
- ❌ `PassWord123`

**Correct:**
- ✅ `password123`

### 7. Email Typos

Double-check the email is exactly:
- `jane@example.com` (lowercase, no extra spaces)

Common mistakes:
- ❌ `Jane@example.com` (capital J)
- ❌ `jane@Example.com` (capital E)
- ❌ `jane @example.com` (space before @)

---

## Manual Testing

### Test 1: Verify User Exists

```bash
psql "$DATABASE_URL" -c "SELECT username, email, name, is_creator FROM users WHERE email = 'jane@example.com';"
```

**Expected output:**
```
 username  |      email       |    name    | is_creator
-----------+------------------+------------+------------
 janesmith | jane@example.com | Jane Smith | t
```

### Test 2: Test Login Endpoint Directly

```bash
# Start the server first (in another terminal)
npm run dev

# Then test the login endpoint
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"password123"}' \
  -c /tmp/cookies.txt \
  -i
```

**Expected response:**
```
HTTP/1.1 200 OK
Set-Cookie: connect.sid=...

{"id":"...","username":"janesmith","email":"jane@example.com",...}
```

### Test 3: Verify Password Hash

```bash
tsx test-login.ts
```

**Expected output:**
```
✅ User found: janesmith jane@example.com
Password hash: $2b$10$...
Password valid: ✅ YES
```

---

## Step-by-Step Login Process

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Open browser:**
   - Navigate to: `http://localhost:5000`
   - NOT: `http://127.0.0.1:5000` or any other URL

3. **Click "Login" button in header**
   - Or go directly to: `http://localhost:5000/login`

4. **Enter credentials:**
   - Email: `jane@example.com`
   - Password: `password123`
   - Click "Log In with Email"

5. **Expected result:**
   - Toast notification: "Welcome back!"
   - Redirect to dashboard
   - See creator options in header

---

## Still Not Working?

### Check Server Logs

Look at the terminal where `npm run dev` is running. Check for errors like:

**Authentication errors:**
```
Login error: Error: Invalid email or password
```

**Database errors:**
```
Login error: Error: Connection refused
```

**Session errors:**
```
Warning: connect.sid cookie not set
```

### Check Browser Console

Open Developer Tools (F12) → Console tab. Look for:

**Network errors:**
```
POST http://localhost:5000/api/auth/login 401 (Unauthorized)
```

**Cookie errors:**
```
Cookie "connect.sid" has been rejected because it is in a cross-site context
```

### Reseed Database

If all else fails, drop and reseed:

```bash
# WARNING: This deletes all data
psql "$DATABASE_URL" << 'EOF'
DROP TABLE IF EXISTS completed_steps CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS steps CASCADE;
DROP TABLE IF EXISTS weeks CASCADE;
DROP TABLE IF EXISTS syllabi CASCADE;
DROP TABLE IF EXISTS cohort_members CASCADE;
DROP TABLE IF EXISTS cohorts CASCADE;
DROP TABLE IF EXISTS users CASCADE;
-- Keep sessions table for auth
EOF

# Recreate schema
npm run db:push

# Reseed data
npm run db:seed
```

---

## Alternative: Create a New Account

If you still can't login with jane@example.com, create a new account:

1. Go to http://localhost:5000/login
2. Click "Sign Up" tab
3. Fill out the form:
   - Name: Your Name
   - Email: your@email.com
   - Password: yourpassword
   - Select "Thought Leader / Creator"
4. Click "Create Account"

Then you can login with your new credentials and toggle to creator mode from settings.

---

## Contact Support

If none of these solutions work, please provide:

1. Server terminal output (from `npm run dev`)
2. Browser console errors (F12 → Console)
3. Network tab showing the login request (F12 → Network)
4. Output of: `psql "$DATABASE_URL" -c "SELECT email FROM users;"`

This will help diagnose the specific issue.
