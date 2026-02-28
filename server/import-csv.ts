/**
 * CSV Import Script
 * Imports binder data from CSV files into the database.
 *
 * Usage:
 *   Development: tsx server/import-csv.ts
 *   Production:  DATABASE_URL="<prod-url>" tsx server/import-csv.ts
 */

import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';
import { db } from './db';
import { users, binders, weeks, steps } from '../shared/schema';
import { eq } from 'drizzle-orm';

const CREATOR_EMAIL = 'laijing.chu@gmail.com';
const CSV_DIR = './data/01-28';

interface CsvBinder {
  id: string;
  title: string;
  description: string;
  level: string;
  status: string;
}

interface CsvWeek {
  id: string;
  binderId: string;
  index: string;
  title: string;
  description: string;
}

interface CsvStep {
  id: string;
  weekId: string;
  position: string;
  type: string;
  title: string;
  url: string;
  note: string;
  author: string;
  creationDate: string;
  mediaType: string;
  promptText: string;
  estimatedMinutes: string;
}

async function importData() {
  console.log('🌱 Starting CSV import...\n');

  // 1. Find curator by email
  console.log(`Looking up curator: ${CREATOR_EMAIL}`);
  const [curator] = await db.select().from(users).where(eq(users.email, CREATOR_EMAIL));

  if (!curator) {
    console.error(`❌ Curator not found with email: ${CREATOR_EMAIL}`);
    console.error('Please ensure this user exists in the database before running the import.');
    process.exit(1);
  }
  console.log(`✓ Found curator: ${curator.username} (${curator.name || 'no name'})\n`);

  // 2. Parse CSV files
  console.log('Parsing CSV files...');

  const bindersCsv = parse(
    fs.readFileSync(path.join(CSV_DIR, 'binders.csv'), 'utf-8'),
    { columns: true, skip_empty_lines: true }
  ) as CsvBinder[];

  const weeksCsv = parse(
    fs.readFileSync(path.join(CSV_DIR, 'weeks.csv'), 'utf-8'),
    { columns: true, skip_empty_lines: true }
  ) as CsvWeek[];

  const stepsCsv = parse(
    fs.readFileSync(path.join(CSV_DIR, 'steps.csv'), 'utf-8'),
    { columns: true, skip_empty_lines: true }
  ) as CsvStep[];

  console.log(`✓ Parsed ${bindersCsv.length} binders`);
  console.log(`✓ Parsed ${weeksCsv.length} weeks`);
  console.log(`✓ Parsed ${stepsCsv.length} steps\n`);

  // 3. Calculate durationWeeks for each binder
  const weekCountByBinder = new Map<string, number>();
  for (const week of weeksCsv) {
    const current = weekCountByBinder.get(week.binderId) || 0;
    weekCountByBinder.set(week.binderId, current + 1);
  }

  // 4. Insert binders and track ID mapping
  console.log('Inserting binders...');
  const binderIdMap = new Map<string, number>(); // CSV ID -> DB ID

  for (const csvBinder of bindersCsv) {
    const durationWeeks = weekCountByBinder.get(csvBinder.id) || 0;

    const [inserted] = await db.insert(binders).values({
      title: csvBinder.title,
      description: csvBinder.description,
      audienceLevel: csvBinder.level || 'Beginner',
      durationWeeks,
      status: csvBinder.status || 'draft',
      curatorId: curator.username,
    }).returning();

    binderIdMap.set(csvBinder.id, inserted.id);
    console.log(`  ✓ ${inserted.id}: ${csvBinder.title} (${durationWeeks} weeks)`);
  }
  console.log();

  // 5. Insert weeks and track ID mapping
  console.log('Inserting weeks...');
  const weekIdMap = new Map<string, number>(); // CSV ID -> DB ID

  for (const csvWeek of weeksCsv) {
    const dbBinderId = binderIdMap.get(csvWeek.binderId);
    if (!dbBinderId) {
      console.warn(`  ⚠ Skipping week ${csvWeek.id}: binder ${csvWeek.binderId} not found`);
      continue;
    }

    const [inserted] = await db.insert(weeks).values({
      binderId: dbBinderId,
      index: parseInt(csvWeek.index, 10),
      title: csvWeek.title || null,
      description: csvWeek.description || null,
    }).returning();

    weekIdMap.set(csvWeek.id, inserted.id);
  }
  console.log(`✓ Inserted ${weekIdMap.size} weeks\n`);

  // 6. Insert steps
  console.log('Inserting steps...');
  let stepCount = 0;

  for (const csvStep of stepsCsv) {
    const dbWeekId = weekIdMap.get(csvStep.weekId);
    if (!dbWeekId) {
      console.warn(`  ⚠ Skipping step ${csvStep.id}: week ${csvStep.weekId} not found`);
      continue;
    }

    await db.insert(steps).values({
      weekId: dbWeekId,
      position: parseInt(csvStep.position, 10),
      type: csvStep.type,
      title: csvStep.title,
      url: csvStep.url || null,
      note: csvStep.note || null,
      author: csvStep.author || null,
      creationDate: csvStep.creationDate || null,
      mediaType: csvStep.mediaType || null,
      promptText: csvStep.promptText || null,
      estimatedMinutes: csvStep.estimatedMinutes ? parseInt(csvStep.estimatedMinutes, 10) : null,
    });
    stepCount++;
  }
  console.log(`✓ Inserted ${stepCount} steps\n`);

  // Summary
  console.log('═══════════════════════════════════');
  console.log('Import Complete!');
  console.log('═══════════════════════════════════');
  console.log(`Curator: ${curator.username} (${CREATOR_EMAIL})`);
  console.log(`Binders: ${binderIdMap.size}`);
  console.log(`Weeks:   ${weekIdMap.size}`);
  console.log(`Steps:   ${stepCount}`);
  console.log('═══════════════════════════════════');
}

importData()
  .then(() => {
    console.log('\n✅ Import finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  });
