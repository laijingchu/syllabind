/**
 * Data Migration Script: JSONB to Normalized Tables
 *
 * This script migrates existing syllabus data from the JSONB `content` column
 * to the new normalized `weeks` and `steps` tables.
 *
 * Run with: tsx server/migrate-jsonb-to-normalized.ts
 */

import { db } from './db';
import { syllabi, weeks, steps } from '../shared/schema';
import { eq } from 'drizzle-orm';

interface JSONBStep {
  id: string;
  type: 'reading' | 'exercise';
  title: string;
  url?: string;
  note?: string;
  author?: string;
  creationDate?: string;
  mediaType?: 'Book' | 'Youtube video' | 'Blog/Article' | 'Podcast';
  promptText?: string;
  estimatedMinutes?: number;
}

interface JSONBWeek {
  index: number;
  title?: string;
  description?: string;
  steps: JSONBStep[];
}

interface SyllabusContent {
  weeks: JSONBWeek[];
}

async function migrateData() {
  console.log('🚀 Starting JSONB to Normalized migration...\n');

  try {
    // Fetch all syllabi with JSONB content
    const allSyllabi = await db.select().from(syllabi);
    console.log(`📚 Found ${allSyllabi.length} syllabi to migrate\n`);

    let totalWeeksMigrated = 0;
    let totalStepsMigrated = 0;
    const stepIdMapping: Record<string, number> = {}; // old string ID -> new integer ID

    for (const syllabus of allSyllabi) {
      console.log(`\n📖 Migrating syllabus: "${syllabus.title}" (ID: ${syllabus.id})`);

      const content = syllabus.content as unknown as SyllabusContent;

      if (!content || !content.weeks || !Array.isArray(content.weeks)) {
        console.log(`  ⚠️  Skipping - no valid weeks data`);
        continue;
      }

      console.log(`  📅 Found ${content.weeks.length} weeks`);

      for (const weekData of content.weeks) {
        // Insert week
        const [insertedWeek] = await db.insert(weeks).values({
          syllabusId: syllabus.id,
          index: weekData.index,
          title: weekData.title || null,
          description: weekData.description || null,
        }).returning();

        totalWeeksMigrated++;
        console.log(`    ✅ Week ${weekData.index}: "${weekData.title || 'Untitled'}" (ID: ${insertedWeek.id})`);

        // Insert steps for this week
        if (!weekData.steps || !Array.isArray(weekData.steps)) {
          console.log(`      ⚠️  No steps found for week ${weekData.index}`);
          continue;
        }

        console.log(`      📝 Migrating ${weekData.steps.length} steps...`);

        for (let i = 0; i < weekData.steps.length; i++) {
          const stepData = weekData.steps[i];

          const [insertedStep] = await db.insert(steps).values({
            weekId: insertedWeek.id,
            position: i + 1,
            type: stepData.type,
            title: stepData.title,
            url: stepData.url || null,
            note: stepData.note || null,
            author: stepData.author || null,
            creationDate: stepData.creationDate || null,
            mediaType: stepData.mediaType || null,
            promptText: stepData.promptText || null,
            estimatedMinutes: stepData.estimatedMinutes || null,
          }).returning();

          // Track old string ID -> new integer ID mapping
          stepIdMapping[stepData.id] = insertedStep.id;
          totalStepsMigrated++;

          console.log(`        ✓ Step ${i + 1}: "${stepData.title}" (${stepData.type}) - Old ID: ${stepData.id} -> New ID: ${insertedStep.id}`);
        }
      }
    }

    console.log(`\n\n✨ Migration Summary:`);
    console.log(`   📚 Syllabi processed: ${allSyllabi.length}`);
    console.log(`   📅 Weeks migrated: ${totalWeeksMigrated}`);
    console.log(`   📝 Steps migrated: ${totalStepsMigrated}`);
    console.log(`\n✅ Migration completed successfully!`);

    console.log(`\n📋 Step ID Mapping (first 10):`);
    const mappingEntries = Object.entries(stepIdMapping).slice(0, 10);
    mappingEntries.forEach(([oldId, newId]) => {
      console.log(`   ${oldId} -> ${newId}`);
    });
    if (Object.keys(stepIdMapping).length > 10) {
      console.log(`   ... and ${Object.keys(stepIdMapping).length - 10} more`);
    }

    console.log(`\n⚠️  IMPORTANT: You will need to update enrollments.completedStepIds`);
    console.log(`   to use the new integer IDs instead of string IDs.`);
    console.log(`   This will be handled when updating the client code.`);

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
migrateData()
  .then(() => {
    console.log('\n👋 Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
