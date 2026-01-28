import { db } from "./db";
import { users, syllabi, weeks, steps, enrollments, completedSteps } from "@shared/schema";
import { hashPassword } from "./auth/emailAuth";
import { eq } from "drizzle-orm";

/**
 * Database Seed Script
 *
 * Populates the database with test data including:
 * - Test users (creators and learners)
 * - Published syllabi with weeks and steps
 * - Enrollments
 * - Completed steps
 *
 * Run with: tsx server/seed.ts
 *
 * NOTE: Fixed UUIDs are used for test users to ensure consistency
 * between production and development environments.
 */

// Fixed UUIDs for test users - consistent across all environments
// Exported for use in tests
export const TEST_USER_IDS = {
  janesmith: "11111111-1111-1111-1111-111111111111",
  alexlearner: "22222222-2222-2222-2222-222222222222",
  sarahchen: "33333333-3333-3333-3333-333333333333",
  marcusj: "44444444-4444-4444-4444-444444444444",
  emilyd: "55555555-5555-5555-5555-555555555555",
  davidw: "66666666-6666-6666-6666-666666666666",
} as const;

async function seed() {
  console.log("🌱 Starting database seed...\n");

  try {
    // 1. Create Creator User
    console.log("📝 Creating creator user...");
    const creatorPassword = await hashPassword("password123");
    const [creator] = await db.insert(users).values({
      id: TEST_USER_IDS.janesmith,
      username: "janesmith",
      email: "jane@example.com",
      password: creatorPassword,
      name: "Jane Smith",
      isCreator: true,
      bio: "Educator and systems thinker. Building learning paths for the curious.",
      linkedin: "janesmith",
      twitter: "jane_teaches",
      shareProfile: true,
    }).returning();
    console.log(`✅ Created creator: ${creator.username}\n`);

    // 2. Create Learner Users
    console.log("📝 Creating learner users...");

    const learnerPassword = await hashPassword("password123");

    const learnersData = [
      {
        id: TEST_USER_IDS.alexlearner,
        username: "alexlearner",
        email: "alex@example.com",
        password: learnerPassword,
        name: "Alex Learner",
        isCreator: false,
        bio: "Lifelong learner passionate about technology and design.",
        linkedin: "alexlearner",
        twitter: "alexlearner",
        shareProfile: true,
      },
      {
        id: TEST_USER_IDS.sarahchen,
        username: "sarahchen",
        email: "sarah@example.com",
        password: learnerPassword,
        name: "Sarah Chen",
        isCreator: false,
        avatarUrl: "https://api.dicebear.com/7.x/notionists/svg?seed=Sarah",
        bio: "Product Designer at TechCo",
        linkedin: "sarahchen",
        twitter: "schen_design",
        shareProfile: true,
      },
      {
        id: TEST_USER_IDS.marcusj,
        username: "marcusj",
        email: "marcus@example.com",
        password: learnerPassword,
        name: "Marcus Johnson",
        isCreator: false,
        avatarUrl: "https://api.dicebear.com/7.x/notionists/svg?seed=Marcus",
        bio: "Software Engineer learning design systems",
        website: "https://marcus.dev",
        shareProfile: true,
      },
      {
        id: TEST_USER_IDS.emilyd,
        username: "emilyd",
        email: "emily@example.com",
        password: learnerPassword,
        name: "Emily Davis",
        isCreator: false,
        avatarUrl: "https://api.dicebear.com/7.x/notionists/svg?seed=Emily",
        bio: "Marketing Specialist",
        threads: "emilyd_marketing",
        shareProfile: true,
      },
      {
        id: TEST_USER_IDS.davidw,
        username: "davidw",
        email: "david@example.com",
        password: learnerPassword,
        name: "David Wilson",
        isCreator: false,
        avatarUrl: "https://api.dicebear.com/7.x/notionists/svg?seed=David",
        shareProfile: false,
      },
    ];

    const learners = await db.insert(users).values(learnersData).returning();
    learners.forEach(learner => {
      console.log(`✅ Created learner: ${learner.username}`);
    });
    console.log();

    // 3. Create Syllabi with Weeks and Steps
    console.log("📚 Creating syllabi...\n");

    // Syllabus 1: Digital Minimalism
    console.log("Creating: Digital Minimalism");
    const [syllabus1] = await db.insert(syllabi).values({
      title: "Digital Minimalism",
      description: "Reclaim your attention and focus in a noisy world. A 4-week structured guide to reducing digital clutter.",
      audienceLevel: "Beginner",
      durationWeeks: 4,
      status: "published",
      creatorId: creator.username,
    }).returning();

    // Week 1: The Philosophy of Less
    const [week1] = await db.insert(weeks).values({
      syllabusId: syllabus1.id,
      index: 1,
      title: "The Philosophy of Less",
    }).returning();

    await db.insert(steps).values([
      {
        weekId: week1.id,
        position: 1,
        type: "reading",
        title: "Why We Are Distracted",
        url: "https://example.com/distracted",
        note: "A foundational essay on attention economy.",
        estimatedMinutes: 15,
      },
      {
        weekId: week1.id,
        position: 2,
        type: "exercise",
        title: "Audit Your Screen Time",
        promptText: "Check your phone usage stats for the last week. Write down the top 3 apps stealing your time.",
        estimatedMinutes: 10,
      },
    ]);

    // Week 2: Digital Declutter
    const [week2] = await db.insert(weeks).values({
      syllabusId: syllabus1.id,
      index: 2,
      title: "Digital Declutter",
    }).returning();

    await db.insert(steps).values([
      {
        weekId: week2.id,
        position: 1,
        type: "reading",
        title: "The 30-Day Declutter Method",
        url: "https://example.com/declutter",
        estimatedMinutes: 20,
      },
      {
        weekId: week2.id,
        position: 2,
        type: "exercise",
        title: "Delete 5 Apps",
        promptText: "Identify 5 apps that do not bring you joy or utility and delete them right now.",
        estimatedMinutes: 5,
      },
    ]);

    // Week 3: Reclaiming Leisure
    const [week3] = await db.insert(weeks).values({
      syllabusId: syllabus1.id,
      index: 3,
      title: "Reclaiming Leisure",
    }).returning();

    await db.insert(steps).values([
      {
        weekId: week3.id,
        position: 1,
        type: "reading",
        title: "The Value of Boredom",
        url: "https://example.com/boredom",
        estimatedMinutes: 25,
      },
      {
        weekId: week3.id,
        position: 2,
        type: "exercise",
        title: "A Walk Without Phone",
        promptText: "Go for a 30-minute walk without your phone. Notice 5 things you usually miss.",
        estimatedMinutes: 30,
      },
    ]);

    // Week 4: Deep Work Habits
    const [week4] = await db.insert(weeks).values({
      syllabusId: syllabus1.id,
      index: 4,
      title: "Deep Work Habits",
    }).returning();

    const week4Steps = await db.insert(steps).values([
      {
        weekId: week4.id,
        position: 1,
        type: "reading",
        title: "Deep Work: Rules for Focused Success",
        url: "https://example.com/deepwork",
        estimatedMinutes: 40,
      },
      {
        weekId: week4.id,
        position: 2,
        type: "exercise",
        title: "Schedule Deep Work Blocks",
        promptText: "Plan your next week. Block out at least three 90-minute sessions for deep work.",
        estimatedMinutes: 15,
      },
    ]).returning();

    console.log(`✅ Created syllabus: ${syllabus1.title} (4 weeks, 8 steps)\n`);

    // Syllabus 2: Systems Thinking 101
    console.log("Creating: Systems Thinking 101");
    const [syllabus2] = await db.insert(syllabi).values({
      title: "Systems Thinking 101",
      description: "Learn to see the world in loops and connections. Understand feedback loops, stocks, and flows.",
      audienceLevel: "Intermediate",
      durationWeeks: 2,
      status: "published",
      creatorId: creator.username,
    }).returning();

    // Week 1: Basics of Systems
    const [week5] = await db.insert(weeks).values({
      syllabusId: syllabus2.id,
      index: 1,
      title: "Basics of Systems",
    }).returning();

    await db.insert(steps).values([
      {
        weekId: week5.id,
        position: 1,
        type: "reading",
        title: "Thinking in Systems: A Primer (Chapter 1)",
        url: "https://example.com/systems",
        estimatedMinutes: 30,
      },
    ]);

    // Week 2: Feedback Loops
    const [week6] = await db.insert(weeks).values({
      syllabusId: syllabus2.id,
      index: 2,
      title: "Feedback Loops",
    }).returning();

    console.log(`✅ Created syllabus: ${syllabus2.title} (2 weeks, 1 step)\n`);

    // 4. Create Enrollments
    console.log("📋 Creating enrollments...\n");

    // Alex enrolls in Digital Minimalism (in progress, week 2)
    const [alexEnrollment] = await db.insert(enrollments).values({
      studentId: learners[0].username, // alexlearner
      syllabusId: syllabus1.id,
      status: "in-progress",
      currentWeekIndex: 2,
      shareProfile: true,
      joinedAt: new Date("2024-01-10"),
    }).returning();
    console.log(`✅ ${learners[0].username} enrolled in: ${syllabus1.title} (week 2)`);

    // Sarah enrolls in Digital Minimalism (completed)
    const [sarahEnrollment] = await db.insert(enrollments).values({
      studentId: learners[1].username, // sarahchen
      syllabusId: syllabus1.id,
      status: "completed",
      currentWeekIndex: 4,
      shareProfile: true,
      joinedAt: new Date("2023-10-15"),
    }).returning();
    console.log(`✅ ${learners[1].username} enrolled in: ${syllabus1.title} (completed)`);

    // Marcus enrolls in Digital Minimalism (in progress, week 1)
    const [marcusEnrollment] = await db.insert(enrollments).values({
      studentId: learners[2].username, // marcusj
      syllabusId: syllabus1.id,
      status: "in-progress",
      currentWeekIndex: 1,
      shareProfile: true,
      joinedAt: new Date("2024-01-15"),
    }).returning();
    console.log(`✅ ${learners[2].username} enrolled in: ${syllabus1.title} (week 1)`);

    // Emily enrolls in Systems Thinking (in progress)
    const [emilyEnrollment] = await db.insert(enrollments).values({
      studentId: learners[3].username, // emilyd
      syllabusId: syllabus2.id,
      status: "in-progress",
      currentWeekIndex: 1,
      shareProfile: true,
      joinedAt: new Date("2024-01-20"),
    }).returning();
    console.log(`✅ ${learners[3].username} enrolled in: ${syllabus2.title} (week 1)`);

    // David enrolls in Systems Thinking (completed)
    const [davidEnrollment] = await db.insert(enrollments).values({
      studentId: learners[4].username, // davidw
      syllabusId: syllabus2.id,
      status: "completed",
      currentWeekIndex: 2,
      joinedAt: new Date("2023-09-20"),
    }).returning();
    console.log(`✅ ${learners[4].username} enrolled in: ${syllabus2.title} (completed)\n`);

    // 5. Mark Some Steps as Completed
    console.log("✓ Marking completed steps...\n");

    // Get all steps for both syllabi
    const allWeek1Steps = await db.select().from(steps).where(eq(steps.weekId, week1.id));
    const allWeek2Steps = await db.select().from(steps).where(eq(steps.weekId, week2.id));
    const allWeek3Steps = await db.select().from(steps).where(eq(steps.weekId, week3.id));
    const allWeek4Steps = await db.select().from(steps).where(eq(steps.weekId, week4.id));
    const allWeek5Steps = await db.select().from(steps).where(eq(steps.weekId, week5.id));

    // Alex completed all of week 1 and first step of week 2
    for (const step of allWeek1Steps) {
      await db.insert(completedSteps).values({
        enrollmentId: alexEnrollment.id,
        stepId: step.id,
      });
    }
    await db.insert(completedSteps).values({
      enrollmentId: alexEnrollment.id,
      stepId: allWeek2Steps[0].id,
    });
    console.log(`✅ ${learners[0].username}: 3 steps completed`);

    // Sarah completed all steps (entire syllabus)
    for (const step of [...allWeek1Steps, ...allWeek2Steps, ...allWeek3Steps, ...allWeek4Steps]) {
      await db.insert(completedSteps).values({
        enrollmentId: sarahEnrollment.id,
        stepId: step.id,
      });
    }
    console.log(`✅ ${learners[1].username}: 8 steps completed (all)`);

    // Marcus completed first step of week 1
    await db.insert(completedSteps).values({
      enrollmentId: marcusEnrollment.id,
      stepId: allWeek1Steps[0].id,
    });
    console.log(`✅ ${learners[2].username}: 1 step completed`);

    // Emily completed first step of Systems Thinking
    await db.insert(completedSteps).values({
      enrollmentId: emilyEnrollment.id,
      stepId: allWeek5Steps[0].id,
    });
    console.log(`✅ ${learners[3].username}: 1 step completed`);

    // David completed all steps of Systems Thinking
    for (const step of allWeek5Steps) {
      await db.insert(completedSteps).values({
        enrollmentId: davidEnrollment.id,
        stepId: step.id,
      });
    }
    console.log(`✅ ${learners[4].username}: 1 step completed (all)\n`);

    // Summary
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✨ Database seeded successfully!\n");
    console.log("📊 Summary:");
    console.log(`   • ${1 + learners.length} users created`);
    console.log(`     - 1 creator (janesmith)`);
    console.log(`     - ${learners.length} learners`);
    console.log(`   • 2 syllabi created`);
    console.log(`     - Digital Minimalism (4 weeks, 8 steps)`);
    console.log(`     - Systems Thinking 101 (2 weeks, 1 step)`);
    console.log(`   • 5 enrollments created`);
    console.log(`   • Multiple steps marked as completed\n`);
    console.log("🔑 Login credentials (all users):");
    console.log("   Password: password123\n");
    console.log("👤 Test Users (with fixed IDs for consistency across environments):");
    console.log(`   • janesmith (creator) - ID: ${TEST_USER_IDS.janesmith}`);
    console.log(`   • alexlearner (in progress on Digital Minimalism) - ID: ${TEST_USER_IDS.alexlearner}`);
    console.log(`   • sarahchen (completed Digital Minimalism) - ID: ${TEST_USER_IDS.sarahchen}`);
    console.log(`   • marcusj (just started Digital Minimalism) - ID: ${TEST_USER_IDS.marcusj}`);
    console.log(`   • emilyd (in progress on Systems Thinking) - ID: ${TEST_USER_IDS.emilyd}`);
    console.log(`   • davidw (completed Systems Thinking) - ID: ${TEST_USER_IDS.davidw}\n`);
    console.log("🚀 Ready to test! Run: npm run dev");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run the seed function
seed()
  .then(() => {
    console.log("✅ Seed completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });
