/**
 * Data Migration Script: JSONB to Normalized Tables
 *
 * This script migrates existing binder data from the JSONB `content` column
 * to the new normalized `weeks` and `steps` tables.
 *
 * Run with: tsx server/migrate-jsonb-to-normalized.ts
 */

import { db } from './db';
import { binders, weeks, steps } from '../shared/schema';
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

interface BinderContent {
  weeks: JSONBWeek[];
}

async function migrateData() {
  console.log('🚀 Starting JSONB to Normalized migration...\n');

  try {
    // Fetch all binders with JSONB content
    const allBinders = await db.select().from(binders);
    console.log(`📚 Found ${allBinders.length} binders to migrate\n`);

    let totalWeeksMigrated = 0;
    let totalStepsMigrated = 0;
    const stepIdMapping: Record<string, number> = {}; // old string ID -> new integer ID

    for (const binder of allBinders) {
      console.log(`\n📖 Migrating binder: "${binder.title}" (ID: ${binder.id})`);

      // NOTE: This migration script has already been run. The 'content' field was removed from the schema.
      // This script is kept for reference only and should not be run again.
      const content = (binder as any).content as unknown as BinderContent;

      if (!content || !content.weeks || !Array.isArray(content.weeks)) {
        console.log(`  ⚠️  Skipping - no valid weeks data`);
        continue;
      }

      console.log(`  📅 Found ${content.weeks.length} weeks`);

      for (const weekData of content.weeks) {
        // Insert week
        const [insertedWeek] = await db.insert(weeks).values({
          binderId: binder.id,
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
    console.log(`   📚 Binders processed: ${allBinders.length}`);
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
