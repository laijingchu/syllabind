import { db } from "./db";
import { users, binders, weeks, steps, enrollments, completedSteps, siteSettings, categories, tags, binderTags } from "@shared/schema";
import { hashPassword } from "./auth/emailAuth";
import { eq } from "drizzle-orm";

/**
 * Database Seed Script
 *
 * Populates the database with test data including:
 * - Test users (curators and readers)
 * - Published binders with weeks and steps
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
  newfreejoe: "77777777-7777-7777-7777-777777777001",
  newpropat: "88888888-8888-8888-8888-888888888001",
} as const;

async function seed() {
  console.log("🌱 Starting database seed...\n");

  try {
    // 0. Seed default categories (idempotent)
    console.log("🏷️  Seeding categories...");
    await db.insert(categories).values([
      { name: 'Design', slug: 'design', description: 'Visual design, UX, product design, and design thinking', displayOrder: 1 },
      { name: 'Technology', slug: 'technology', description: 'Software engineering, AI, data science, and emerging tech', displayOrder: 2 },
      { name: 'Business', slug: 'business', description: 'Strategy, entrepreneurship, management, and leadership', displayOrder: 3 },
      { name: 'Science', slug: 'science', description: 'Natural sciences, research methods, and scientific thinking', displayOrder: 4 },
      { name: 'Arts & Culture', slug: 'arts-culture', description: 'Literature, history, art, music, and cultural studies', displayOrder: 5 },
      { name: 'Social Sciences', slug: 'social-sciences', description: 'Psychology, sociology, economics, and political science', displayOrder: 6 },
      { name: 'Humanities', slug: 'humanities', description: 'Philosophy, history, languages, and the study of human culture', displayOrder: 7 },
      { name: 'Personal Development', slug: 'personal-development', description: 'Productivity, communication, habits, and self-improvement', displayOrder: 8 },
      { name: 'Other', slug: 'other', description: "Topics that don't fit neatly into other categories", displayOrder: 9 },
    ]).onConflictDoNothing();
    console.log("✅ Categories seeded\n");

    // 1. Create Curator User
    console.log("📝 Creating curator user...");
    const curatorPassword = await hashPassword("password123");
    const [curator] = await db.insert(users).values({
      id: TEST_USER_IDS.janesmith,
      username: "janesmith",
      email: "jane@example.com",
      password: curatorPassword,
      name: "Jane Smith",
      isCurator: true,
      bio: "Educator and systems thinker. Building learning paths for the curious.",
      profileTitle: "Learning Designer & Systems Thinker",
      linkedin: "janesmith",
      twitter: "jane_teaches",
      schedulingUrl: "https://calendly.com/janesmith",
      shareProfile: true,
      creditBalance: 100,
      subscriptionTier: 'free',
    }).returning();
    console.log(`✅ Created curator: ${curator.username}\n`);

    // 2. Create Reader Users
    console.log("📝 Creating reader users...");

    const readerPassword = await hashPassword("password123");

    const readersData = [
      {
        id: TEST_USER_IDS.alexlearner,
        username: "alexlearner",
        email: "alex@example.com",
        password: readerPassword,
        name: "Alex Learner",
        isCurator: false,
        bio: "Lifelong learner passionate about technology and design.",
        linkedin: "alexlearner",
        twitter: "alexlearner",
        shareProfile: true,
      },
      {
        id: TEST_USER_IDS.sarahchen,
        username: "sarahchen",
        email: "sarah@example.com",
        password: readerPassword,
        name: "Sarah Chen",
        isCurator: false,
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
        password: readerPassword,
        name: "Marcus Johnson",
        isCurator: false,
        avatarUrl: "https://api.dicebear.com/7.x/notionists/svg?seed=Marcus",
        bio: "Software Engineer learning design systems",
        website: "https://marcus.dev",
        shareProfile: true,
      },
      {
        id: TEST_USER_IDS.emilyd,
        username: "emilyd",
        email: "emily@example.com",
        password: readerPassword,
        name: "Emily Davis",
        isCurator: false,
        avatarUrl: "https://api.dicebear.com/7.x/notionists/svg?seed=Emily",
        bio: "Marketing Specialist",
        threads: "emilyd_marketing",
        shareProfile: true,
      },
      {
        id: TEST_USER_IDS.davidw,
        username: "davidw",
        email: "david@example.com",
        password: readerPassword,
        name: "David Wilson",
        isCurator: false,
        avatarUrl: "https://api.dicebear.com/7.x/notionists/svg?seed=David",
        shareProfile: false,
      },
      // Brand new free user — no profile, no enrollments, no binders
      {
        id: TEST_USER_IDS.newfreejoe,
        username: "newfreejoe",
        email: "joe@example.com",
        password: readerPassword,
        isCurator: false,
        subscriptionTier: 'free',
        subscriptionStatus: 'free',
        creditBalance: 100,
      },
      // New pro user — subscription active but no enrollments or binders yet
      {
        id: TEST_USER_IDS.newpropat,
        username: "newpropat",
        email: "pat@example.com",
        password: readerPassword,
        name: "Pat Taylor",
        isCurator: false,
        subscriptionTier: 'pro_monthly',
        subscriptionStatus: 'pro',
        creditBalance: 120,
      },
    ];

    const readers = await db.insert(users).values(readersData).returning();
    readers.forEach((reader: any) => {
      console.log(`✅ Created reader: ${reader.username}`);
    });
    console.log();

    // 3. Create Binders with Weeks and Steps
    console.log("📚 Creating binders...\n");

    // Binder 1: Digital Minimalism
    console.log("Creating: Digital Minimalism");
    const [binder1] = await db.insert(binders).values({
      title: "Digital Minimalism",
      description: "Reclaim your attention and focus in a noisy world. A 4-week structured guide to reducing digital clutter.",
      audienceLevel: "Beginner",
      durationWeeks: 4,
      status: "published",
      curatorId: curator.username,
    }).returning();

    // Week 1: The Philosophy of Less
    const [week1] = await db.insert(weeks).values({
      binderId: binder1.id,
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
      binderId: binder1.id,
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
      binderId: binder1.id,
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
      binderId: binder1.id,
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

    console.log(`✅ Created binder: ${binder1.title} (4 weeks, 8 steps)\n`);

    // Binder 2: Systems Thinking 101
    console.log("Creating: Systems Thinking 101");
    const [binder2] = await db.insert(binders).values({
      title: "Systems Thinking 101",
      description: "Learn to see the world in loops and connections. Understand feedback loops, stocks, and flows.",
      audienceLevel: "Intermediate",
      durationWeeks: 2,
      status: "published",
      curatorId: curator.username,
    }).returning();

    // Week 1: Basics of Systems
    const [week5] = await db.insert(weeks).values({
      binderId: binder2.id,
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
      binderId: binder2.id,
      index: 2,
      title: "Feedback Loops",
    }).returning();

    console.log(`✅ Created binder: ${binder2.title} (2 weeks, 1 step)\n`);

    // Binder 3: Creative Writing Workshop (unlisted)
    console.log("Creating: Creative Writing Workshop (unlisted)");

    // Get the Arts & Humanities category
    const [artsCategory] = await db.select().from(categories).where(eq(categories.slug, 'arts-humanities'));
    const [personalDevCategory] = await db.select().from(categories).where(eq(categories.slug, 'personal-development'));

    const [binder3] = await db.insert(binders).values({
      title: "Creative Writing Workshop",
      description: "A hands-on workshop for aspiring writers. Learn storytelling fundamentals, develop your voice, and complete a short story.",
      audienceLevel: "Beginner",
      durationWeeks: 3,
      status: "published",
      visibility: "unlisted",
      curatorId: curator.username,
      categoryId: artsCategory?.id || null,
    }).returning();

    const [workshop_week1] = await db.insert(weeks).values({
      binderId: binder3.id,
      index: 1,
      title: "Finding Your Voice",
    }).returning();

    await db.insert(steps).values([
      {
        weekId: workshop_week1.id,
        position: 1,
        type: "reading",
        title: "On Writing Well",
        url: "https://example.com/on-writing-well",
        estimatedMinutes: 30,
      },
      {
        weekId: workshop_week1.id,
        position: 2,
        type: "exercise",
        title: "Write a 500-word memoir",
        promptText: "Write a 500-word memoir about a formative childhood experience.",
        estimatedMinutes: 45,
      },
    ]);

    console.log(`✅ Created binder: ${binder3.title} (unlisted, 1 week, 2 steps)\n`);

    // Binder 4: Pending Review binder (for testing approval workflow)
    console.log("Creating: Introduction to Philosophy (pending_review)");
    const [binder4] = await db.insert(binders).values({
      title: "Introduction to Philosophy",
      description: "Explore the big questions of life through the lens of classic and modern philosophers. From Socrates to Simone de Beauvoir.",
      audienceLevel: "Beginner",
      durationWeeks: 2,
      status: "pending_review",
      visibility: "public",
      curatorId: curator.username,
      submittedAt: new Date(),
    }).returning();

    const [phil_week1] = await db.insert(weeks).values({
      binderId: binder4.id,
      index: 1,
      title: "Ancient Philosophy",
    }).returning();

    await db.insert(steps).values([
      {
        weekId: phil_week1.id,
        position: 1,
        type: "reading",
        title: "The Apology of Socrates",
        url: "https://example.com/apology",
        estimatedMinutes: 40,
      },
    ]);
    console.log(`✅ Created binder: ${binder4.title} (pending_review, 1 week, 1 step)\n`);

    // Update existing binders with categories
    if (personalDevCategory) {
      await db.update(binders).set({ categoryId: personalDevCategory.id }).where(eq(binders.id, binder1.id));
    }

    // Add tags to binders
    console.log("🏷️  Adding tags...");
    const tagData = [
      { name: 'focus', slug: 'focus' },
      { name: 'productivity', slug: 'productivity' },
      { name: 'digital wellness', slug: 'digital-wellness' },
      { name: 'systems', slug: 'systems' },
      { name: 'mental models', slug: 'mental-models' },
      { name: 'writing', slug: 'writing' },
      { name: 'creativity', slug: 'creativity' },
    ];
    const createdTags = await db.insert(tags).values(tagData).onConflictDoNothing().returning();
    const allTags = createdTags.length > 0 ? createdTags : await db.select().from(tags);

    const getTagId = (slug: string) => allTags.find((t: any) => t.slug === slug)?.id;

    // Digital Minimalism tags
    const dmTags = ['focus', 'productivity', 'digital-wellness'].map(getTagId).filter(Boolean);
    for (const tagId of dmTags) {
      await db.insert(binderTags).values({ binderId: binder1.id, tagId: tagId! }).onConflictDoNothing();
    }

    // Systems Thinking tags
    const stTags = ['systems', 'mental-models'].map(getTagId).filter(Boolean);
    for (const tagId of stTags) {
      await db.insert(binderTags).values({ binderId: binder2.id, tagId: tagId! }).onConflictDoNothing();
    }

    // Creative Writing tags
    const cwTags = ['writing', 'creativity'].map(getTagId).filter(Boolean);
    for (const tagId of cwTags) {
      await db.insert(binderTags).values({ binderId: binder3.id, tagId: tagId! }).onConflictDoNothing();
    }
    console.log("✅ Tags added\n");

    // 4. Create Enrollments
    console.log("📋 Creating enrollments...\n");

    // Alex enrolls in Digital Minimalism (in progress, week 2)
    const [alexEnrollment] = await db.insert(enrollments).values({
      readerId: readers[0].username, // alexlearner
      binderId: binder1.id,
      status: "in-progress",
      currentWeekIndex: 2,
      shareProfile: true,
      joinedAt: new Date("2024-01-10"),
    }).returning();
    console.log(`✅ ${readers[0].username} enrolled in: ${binder1.title} (week 2)`);

    // Sarah enrolls in Digital Minimalism (completed)
    const [sarahEnrollment] = await db.insert(enrollments).values({
      readerId: readers[1].username, // sarahchen
      binderId: binder1.id,
      status: "completed",
      currentWeekIndex: 4,
      shareProfile: true,
      joinedAt: new Date("2023-10-15"),
    }).returning();
    console.log(`✅ ${readers[1].username} enrolled in: ${binder1.title} (completed)`);

    // Marcus enrolls in Digital Minimalism (in progress, week 1)
    const [marcusEnrollment] = await db.insert(enrollments).values({
      readerId: readers[2].username, // marcusj
      binderId: binder1.id,
      status: "in-progress",
      currentWeekIndex: 1,
      shareProfile: true,
      joinedAt: new Date("2024-01-15"),
    }).returning();
    console.log(`✅ ${readers[2].username} enrolled in: ${binder1.title} (week 1)`);

    // Emily enrolls in Systems Thinking (in progress)
    const [emilyEnrollment] = await db.insert(enrollments).values({
      readerId: readers[3].username, // emilyd
      binderId: binder2.id,
      status: "in-progress",
      currentWeekIndex: 1,
      shareProfile: true,
      joinedAt: new Date("2024-01-20"),
    }).returning();
    console.log(`✅ ${readers[3].username} enrolled in: ${binder2.title} (week 1)`);

    // David enrolls in Systems Thinking (completed)
    const [davidEnrollment] = await db.insert(enrollments).values({
      readerId: readers[4].username, // davidw
      binderId: binder2.id,
      status: "completed",
      currentWeekIndex: 2,
      joinedAt: new Date("2023-09-20"),
    }).returning();
    console.log(`✅ ${readers[4].username} enrolled in: ${binder2.title} (completed)\n`);

    // 5. Mark Some Steps as Completed
    console.log("✓ Marking completed steps...\n");

    // Get all steps for both binders
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
    console.log(`✅ ${readers[0].username}: 3 steps completed`);

    // Sarah completed all steps (entire binder)
    for (const step of [...allWeek1Steps, ...allWeek2Steps, ...allWeek3Steps, ...allWeek4Steps]) {
      await db.insert(completedSteps).values({
        enrollmentId: sarahEnrollment.id,
        stepId: step.id,
      });
    }
    console.log(`✅ ${readers[1].username}: 8 steps completed (all)`);

    // Marcus completed first step of week 1
    await db.insert(completedSteps).values({
      enrollmentId: marcusEnrollment.id,
      stepId: allWeek1Steps[0].id,
    });
    console.log(`✅ ${readers[2].username}: 1 step completed`);

    // Emily completed first step of Systems Thinking
    await db.insert(completedSteps).values({
      enrollmentId: emilyEnrollment.id,
      stepId: allWeek5Steps[0].id,
    });
    console.log(`✅ ${readers[3].username}: 1 step completed`);

    // David completed all steps of Systems Thinking
    for (const step of allWeek5Steps) {
      await db.insert(completedSteps).values({
        enrollmentId: davidEnrollment.id,
        stepId: step.id,
      });
    }
    console.log(`✅ ${readers[4].username}: 1 step completed (all)\n`);

    // 6. Seed site settings
    console.log("⚙️  Seeding site settings...");
    await db.insert(siteSettings).values({
      key: 'slack_community_url',
      value: 'https://join.slack.com/t/syllabind/shared_invite/example',
    }).onConflictDoNothing();
    console.log("✅ Site settings seeded\n");

    // Summary
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✨ Database seeded successfully!\n");
    console.log("📊 Summary:");
    console.log(`   • ${1 + readers.length} users created`);
    console.log(`     - 1 curator (janesmith)`);
    console.log(`     - ${readers.length} readers (incl. 1 new free, 1 new pro)`);
    console.log(`   • 3 binders created`);
    console.log(`     - Digital Minimalism (4 weeks, 8 steps, public)`);
    console.log(`     - Systems Thinking 101 (2 weeks, 1 step, public)`);
    console.log(`     - Creative Writing Workshop (1 week, 2 steps, unlisted)`);
    console.log(`   • 5 enrollments created`);
    console.log(`   • Multiple steps marked as completed\n`);
    console.log("🔑 Login credentials (all users):");
    console.log("   Password: password123\n");
    console.log("👤 Test Users (with fixed IDs for consistency across environments):");
    console.log(`   • janesmith (curator) - ID: ${TEST_USER_IDS.janesmith}`);
    console.log(`   • alexlearner (in progress on Digital Minimalism) - ID: ${TEST_USER_IDS.alexlearner}`);
    console.log(`   • sarahchen (completed Digital Minimalism) - ID: ${TEST_USER_IDS.sarahchen}`);
    console.log(`   • marcusj (just started Digital Minimalism) - ID: ${TEST_USER_IDS.marcusj}`);
    console.log(`   • emilyd (in progress on Systems Thinking) - ID: ${TEST_USER_IDS.emilyd}`);
    console.log(`   • davidw (completed Systems Thinking) - ID: ${TEST_USER_IDS.davidw}`);
    console.log(`   • newfreejoe (new free user, blank slate) - ID: ${TEST_USER_IDS.newfreejoe}`);
    console.log(`   • newpropat (new pro user, no enrollments) - ID: ${TEST_USER_IDS.newpropat}\n`);
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
