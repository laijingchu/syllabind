# 🌱 Database Seeding Guide

## Overview

The seed script (`server/seed.ts`) populates your database with test data to get you started quickly. This is essential since all mock data has been removed from the frontend.

## Quick Start

```bash
npm run db:seed
```

## What Gets Created

### 👥 Users (6 total)

#### Creator Account
- **Username**: `janesmith`
- **Email**: `jane@example.com`
- **Password**: `password123`
- **Role**: Creator
- **Bio**: "Educator and systems thinker. Building learning paths for the curious."

#### Learner Accounts
1. **alexlearner** - Currently learning Digital Minimalism (Week 2)
2. **sarahchen** - Completed Digital Minimalism
3. **marcusj** - Just started Digital Minimalism (Week 1)
4. **emilyd** - Currently learning Systems Thinking (Week 1)
5. **davidw** - Completed Systems Thinking

All learner accounts use password: `password123`

### 📚 Syllabi (2 total)

#### 1. Digital Minimalism
- **Duration**: 4 weeks
- **Level**: Beginner
- **Creator**: janesmith
- **Status**: Published
- **Description**: "Reclaim your attention and focus in a noisy world. A 4-week structured guide to reducing digital clutter."

**Week 1: The Philosophy of Less**
- Reading: "Why We Are Distracted" (15 min)
- Exercise: "Audit Your Screen Time" (10 min)

**Week 2: Digital Declutter**
- Reading: "The 30-Day Declutter Method" (20 min)
- Exercise: "Delete 5 Apps" (5 min)

**Week 3: Reclaiming Leisure**
- Reading: "The Value of Boredom" (25 min)
- Exercise: "A Walk Without Phone" (30 min)

**Week 4: Deep Work Habits**
- Reading: "Deep Work: Rules for Focused Success" (40 min)
- Exercise: "Schedule Deep Work Blocks" (15 min)

#### 2. Systems Thinking 101
- **Duration**: 2 weeks
- **Level**: Intermediate
- **Creator**: janesmith
- **Status**: Published
- **Description**: "Learn to see the world in loops and connections. Understand feedback loops, stocks, and flows."

**Week 1: Basics of Systems**
- Reading: "Thinking in Systems: A Primer (Chapter 1)" (30 min)

**Week 2: Feedback Loops**
- (Empty for demo purposes)

### 📋 Enrollments (5 total)

| User | Syllabus | Status | Current Week | Progress |
|------|----------|--------|--------------|----------|
| alexlearner | Digital Minimalism | In Progress | Week 2 | 3 steps completed |
| sarahchen | Digital Minimalism | Completed | Week 4 | All 8 steps completed |
| marcusj | Digital Minimalism | In Progress | Week 1 | 1 step completed |
| emilyd | Systems Thinking | In Progress | Week 1 | 1 step completed |
| davidw | Systems Thinking | Completed | Week 2 | All steps completed |

## When to Run

### Initial Setup
Run the seed script after pushing your database schema:

```bash
npm run db:push
npm run db:seed
```

### Resetting Data
If you want to start fresh, drop all data and reseed:

```bash
# Drop all tables (use with caution!)
npm run db:push  # Push schema again to recreate tables
npm run db:seed  # Reseed data
```

### Development
The seed script is idempotent-safe if your database is empty, but will error if you try to create duplicate usernames. If you need to reseed:

1. Clear the database manually (or drop tables)
2. Run `npm run db:push` to recreate schema
3. Run `npm run db:seed` to populate data

## Testing Workflows

### As a Learner

1. **Login as alexlearner**
   - Email: `alex@example.com`
   - Password: `password123`
   - See: Active enrollment in Digital Minimalism, Week 2 progress

2. **Login as sarahchen**
   - Email: `sarah@example.com`
   - Password: `password123`
   - See: Completed Digital Minimalism with certificate

3. **Login as marcusj**
   - Email: `marcus@example.com`
   - Password: `password123`
   - See: Just started Digital Minimalism, Week 1

### As a Creator

1. **Login as janesmith**
   - Email: `jane@example.com`
   - Password: `password123`
   - Access creator dashboard
   - See: 2 published syllabi
   - View: Learners enrolled in each syllabus
   - Create: New syllabi and manage existing ones

### Test Creating New Content

1. Login as `janesmith`
2. Go to Creator Dashboard
3. Create a new syllabus
4. Add weeks and steps
5. Publish it
6. Switch to a learner account
7. Enroll in the new syllabus

### Test Enrollment Flow

1. Create a new learner account (register)
2. Browse catalog
3. Enroll in "Digital Minimalism"
4. Complete steps in Week 1
5. Progress to Week 2
6. Submit exercises
7. Complete entire syllabus

## Customization

To add your own test data, edit `server/seed.ts`:

### Add More Users
```typescript
const [newUser] = await db.insert(users).values({
  id: crypto.randomUUID(),
  username: "yourname",
  email: "your@example.com",
  password: await hashPassword("password123"),
  name: "Your Name",
  isCreator: false,
  shareProfile: true,
}).returning();
```

### Add More Syllabi
```typescript
const [newSyllabus] = await db.insert(syllabi).values({
  title: "Your Syllabus Title",
  description: "Description here",
  audienceLevel: "Beginner",
  durationWeeks: 3,
  status: "published",
  creatorId: creator.username,
}).returning();
```

### Add More Enrollments
```typescript
const [enrollment] = await db.insert(enrollments).values({
  studentId: learner.username,
  syllabusId: syllabus.id,
  status: "in-progress",
  currentWeekIndex: 1,
  joinedAt: new Date(),
}).returning();
```

## Troubleshooting

### "User already exists" Error
The database already has users with these usernames. Either:
- Drop and recreate the database
- Or modify the seed script to use different usernames

### "Cannot find module" Error
Make sure you've installed dependencies:
```bash
npm install
```

### Database Connection Error
Ensure your `.env` file has the correct `DATABASE_URL`:
```bash
DATABASE_URL=postgresql://user:password@host:port/database
```

### Authentication Errors After Seeding
The seed script uses bcrypt to hash passwords. If you're having login issues:
1. Check that the password is exactly `password123`
2. Verify the email matches the seeded data
3. Check server logs for authentication errors

## Data Cleanup

### Clear All Data
To remove all seeded data while keeping the schema:

```bash
# Connect to your database
psql $DATABASE_URL

# Delete all data (respects foreign keys with CASCADE)
DELETE FROM completed_steps;
DELETE FROM submissions;
DELETE FROM enrollments;
DELETE FROM steps;
DELETE FROM weeks;
DELETE FROM syllabi;
DELETE FROM users WHERE username != 'your_real_account';  # Keep your account
```

### Reset Specific Tables
```sql
-- Clear just enrollments and related data
DELETE FROM completed_steps;
DELETE FROM submissions;
DELETE FROM enrollments;

-- Clear just syllabi and related data
DELETE FROM steps;
DELETE FROM weeks;
DELETE FROM syllabi;
```

## Next Steps

After seeding:

1. ✅ Start the dev server: `npm run dev`
2. ✅ Open http://localhost:5000
3. ✅ Login with any test account
4. ✅ Explore the app with real data
5. ✅ Test enrollment flow
6. ✅ Test creator features
7. ✅ Test step completion
8. ✅ Test exercise submissions

## Production Considerations

**⚠️ NEVER run this seed script in production!**

This script is for development only. In production:
- Users register through the signup flow
- Creators create their own content
- Enrollments happen organically
- Use proper user onboarding flows

For production seeding (if needed):
- Create a separate `server/seed-production.ts`
- Use environment checks: `if (process.env.NODE_ENV === 'production') throw new Error(...)`
- Only seed essential system data, not user accounts
- Use secure, random passwords
- Log all seeding operations

## Summary

The seed script provides:
- ✅ 1 creator account (janesmith)
- ✅ 5 learner accounts (various progress states)
- ✅ 2 complete syllabi with weeks and steps
- ✅ 5 enrollments (mix of in-progress and completed)
- ✅ Realistic step completion data
- ✅ Ready-to-test authentication
- ✅ Full catalog and dashboard experience

**Default Password for All Accounts**: `password123`

Happy testing! 🚀
