import { db } from "./db";
import { users, enrollments, completedSteps, weeks, steps } from "@shared/schema";
import { hashPassword } from "./auth/emailAuth";
import { eq, and, lte } from "drizzle-orm";

/**
 * Add Test Users Script
 *
 * Adds test users with enrollments at different courses and progress levels.
 * All users use password: password123
 *
 * Run with: npx tsx server/add-test-users.ts
 */

// Fixed UUIDs for consistent test users
const TEST_USER_IDS = {
  user1: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  user2: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  user3: "cccccccc-cccc-cccc-cccc-cccccccccccc",
  user4: "dddddddd-dddd-dddd-dddd-dddddddddddd",
  user5: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
  user6: "ffffffff-ffff-ffff-ffff-ffffffffffff",
  user7: "77777777-7777-7777-7777-777777777777",
  user8: "88888888-8888-8888-8888-888888888888",
  user9: "99999999-9999-9999-9999-999999999999",
  user10: "10101010-1010-1010-1010-101010101010",
} as const;

// Test users with their enrollment configurations
const testUsers = [
  {
    id: TEST_USER_IDS.user1,
    username: "testuser1",
    email: "testuser1@example.com",
    name: "Test User One",
    isCreator: false,
    bio: "Test account for development",
    // Enrolled in Design System Aware Vibe Coding - Week 2, some steps done
    enrollment: { syllabusId: 10, currentWeek: 2, completedWeeks: 1, partialSteps: 2 },
  },
  {
    id: TEST_USER_IDS.user2,
    username: "testuser2",
    email: "testuser2@example.com",
    name: "Test User Two",
    isCreator: false,
    bio: "Test account for development",
    // Enrolled in AI for Product Builders - Week 3, mostly done
    enrollment: { syllabusId: 11, currentWeek: 3, completedWeeks: 2, partialSteps: 3 },
  },
  {
    id: TEST_USER_IDS.user3,
    username: "testuser3",
    email: "testuser3@example.com",
    name: "Test User Three",
    isCreator: true,
    bio: "Test creator account",
    // Enrolled in Visual Design Fundamentals - Week 1, just started
    enrollment: { syllabusId: 13, currentWeek: 1, completedWeeks: 0, partialSteps: 1 },
  },
  {
    id: TEST_USER_IDS.user4,
    username: "testuser4",
    email: "testuser4@example.com",
    name: "Test User Four",
    isCreator: false,
    // Enrolled in Tech Entrepreneurship - Week 4, nearly complete
    enrollment: { syllabusId: 14, currentWeek: 4, completedWeeks: 3, partialSteps: 4 },
  },
  {
    id: TEST_USER_IDS.user5,
    username: "testuser5",
    email: "testuser5@example.com",
    name: "Test User Five",
    isCreator: false,
    // Enrolled in Playful Frontend - Week 2
    enrollment: { syllabusId: 15, currentWeek: 2, completedWeeks: 1, partialSteps: 2 },
  },
  {
    id: TEST_USER_IDS.user6,
    username: "testcreator",
    email: "creator@example.com",
    name: "Test Creator",
    isCreator: true,
    bio: "Another test creator account",
    // Enrolled in American Democracy - Week 3
    enrollment: { syllabusId: 12, currentWeek: 3, completedWeeks: 2, partialSteps: 3 },
  },
  {
    id: TEST_USER_IDS.user7,
    username: "demouser",
    email: "demo@example.com",
    name: "Demo User",
    isCreator: false,
    bio: "Demo account for presentations",
    // Enrolled in Education in AI Era - Week 2
    enrollment: { syllabusId: 16, currentWeek: 2, completedWeeks: 1, partialSteps: 1 },
  },
  {
    id: TEST_USER_IDS.user8,
    username: "admin",
    email: "admin@example.com",
    name: "Admin User",
    isCreator: true,
    bio: "Admin test account",
    // Enrolled in Philosophy of Education - Week 4, completed
    enrollment: { syllabusId: 17, currentWeek: 4, completedWeeks: 4, partialSteps: 0, status: 'completed' as const },
  },
  {
    id: TEST_USER_IDS.user9,
    username: "reviewer",
    email: "reviewer@example.com",
    name: "Reviewer Account",
    isCreator: false,
    // Enrolled in Design System Aware Vibe Coding - Week 3
    enrollment: { syllabusId: 10, currentWeek: 3, completedWeeks: 2, partialSteps: 4 },
  },
  {
    id: TEST_USER_IDS.user10,
    username: "tester",
    email: "tester@example.com",
    name: "QA Tester",
    isCreator: false,
    bio: "QA testing account",
    // Enrolled in AI for Product Builders - Week 1, just started
    enrollment: { syllabusId: 11, currentWeek: 1, completedWeeks: 0, partialSteps: 2 },
  },
];

async function addTestUsers() {
  console.log("👤 Adding test users with enrollments...\n");

  try {
    const password = await hashPassword("password123");
    let usersCreated = 0;
    let usersSkipped = 0;
    let enrollmentsCreated = 0;
    let stepsCompleted = 0;

    for (const userData of testUsers) {
      const { enrollment, ...user } = userData;

      // Create user
      let username = user.username;
      try {
        await db.insert(users).values({
          ...user,
          password,
          shareProfile: true,
          authProvider: 'email',
        });
        console.log(`✅ Created user: ${user.username}`);
        usersCreated++;
      } catch (error: any) {
        if (error.code === '23505') {
          console.log(`⏭️  User exists: ${user.username}`);
          usersSkipped++;
        } else {
          throw error;
        }
      }

      // Create enrollment if specified
      if (enrollment) {
        try {
          const [newEnrollment] = await db.insert(enrollments).values({
            studentId: username,
            syllabusId: enrollment.syllabusId,
            status: enrollment.status || 'in-progress',
            currentWeekIndex: enrollment.currentWeek,
            shareProfile: true,
            joinedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date in last 30 days
          }).returning();

          console.log(`   📚 Enrolled in syllabus ${enrollment.syllabusId} (week ${enrollment.currentWeek})`);
          enrollmentsCreated++;

          // Get weeks for this syllabus and mark steps as completed
          const syllabusWeeks = await db.select()
            .from(weeks)
            .where(eq(weeks.syllabusId, enrollment.syllabusId))
            .orderBy(weeks.index);

          // Complete all steps in fully completed weeks
          for (let i = 0; i < enrollment.completedWeeks && i < syllabusWeeks.length; i++) {
            const weekSteps = await db.select()
              .from(steps)
              .where(eq(steps.weekId, syllabusWeeks[i].id))
              .orderBy(steps.position);

            for (const step of weekSteps) {
              try {
                await db.insert(completedSteps).values({
                  enrollmentId: newEnrollment.id,
                  stepId: step.id,
                });
                stepsCompleted++;
              } catch (e) {
                // Step already completed, skip
              }
            }
          }

          // Complete partial steps in current week
          if (enrollment.partialSteps > 0 && enrollment.currentWeek <= syllabusWeeks.length) {
            const currentWeekData = syllabusWeeks.find(w => w.index === enrollment.currentWeek);
            if (currentWeekData) {
              const weekSteps = await db.select()
                .from(steps)
                .where(eq(steps.weekId, currentWeekData.id))
                .orderBy(steps.position);

              for (let i = 0; i < enrollment.partialSteps && i < weekSteps.length; i++) {
                try {
                  await db.insert(completedSteps).values({
                    enrollmentId: newEnrollment.id,
                    stepId: weekSteps[i].id,
                  });
                  stepsCompleted++;
                } catch (e) {
                  // Step already completed, skip
                }
              }
            }
          }
          console.log(`   ✓ Marked ${stepsCompleted} steps as completed`);
          stepsCompleted = 0; // Reset for next user display
        } catch (error: any) {
          if (error.code === '23505') {
            console.log(`   ⏭️  Already enrolled in syllabus ${enrollment.syllabusId}`);
          } else {
            console.error(`   ❌ Enrollment error:`, error.message);
          }
        }
      }
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✨ Test users setup complete!\n");
    console.log(`📊 Summary:`);
    console.log(`   Users: ${usersCreated} created, ${usersSkipped} skipped`);
    console.log(`   Enrollments: ${enrollmentsCreated} created`);
    console.log("\n🔑 All accounts use password: password123");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  } catch (error) {
    console.error("❌ Error adding test users:", error);
    throw error;
  }
}

// Run the script
addTestUsers()
  .then(() => {
    console.log("✅ Done");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Failed:", error);
    process.exit(1);
  });
