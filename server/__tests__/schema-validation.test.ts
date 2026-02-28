/**
 * Schema Validation Tests
 *
 * Tests the Zod validation schemas exported from shared/schema.ts.
 * These schemas are used at API boundaries to validate incoming data.
 */
import {
  insertUserSchema,
  insertBinderSchema,
  insertEnrollmentSchema,
  insertWeekSchema,
  insertStepSchema,
  insertSubmissionSchema,
  insertCompletedStepSchema,
  insertCohortSchema,
  insertCohortMemberSchema,
  insertCategorySchema,
  insertTagSchema,
  insertBinderTagSchema,
} from '@shared/schema';

describe('Schema Validation', () => {
  describe('insertUserSchema', () => {
    it('accepts valid user data', () => {
      const result = insertUserSchema.safeParse({
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
      });
      expect(result.success).toBe(true);
    });

    it('requires username', () => {
      const result = insertUserSchema.safeParse({
        email: 'test@example.com',
      });
      expect(result.success).toBe(false);
    });

    it('accepts optional fields', () => {
      const result = insertUserSchema.safeParse({
        username: 'testuser',
        bio: 'A bio',
        isCurator: true,
        linkedin: 'linkedin',
        website: 'https://example.com',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('insertBinderSchema', () => {
    it('accepts valid binder data', () => {
      const result = insertBinderSchema.safeParse({
        title: 'Test Binder',
        description: 'A description',
        audienceLevel: 'Beginner',
        durationWeeks: 4,
      });
      expect(result.success).toBe(true);
    });

    it('requires title', () => {
      const result = insertBinderSchema.safeParse({
        description: 'A description',
        audienceLevel: 'Beginner',
        durationWeeks: 4,
      });
      expect(result.success).toBe(false);
    });

    it('requires description', () => {
      const result = insertBinderSchema.safeParse({
        title: 'Title',
        audienceLevel: 'Beginner',
        durationWeeks: 4,
      });
      expect(result.success).toBe(false);
    });

    it('requires audienceLevel', () => {
      const result = insertBinderSchema.safeParse({
        title: 'Title',
        description: 'Desc',
        durationWeeks: 4,
      });
      expect(result.success).toBe(false);
    });

    it('requires durationWeeks', () => {
      const result = insertBinderSchema.safeParse({
        title: 'Title',
        description: 'Desc',
        audienceLevel: 'Beginner',
      });
      expect(result.success).toBe(false);
    });

    it('accepts optional curatorId', () => {
      const result = insertBinderSchema.safeParse({
        title: 'Test',
        description: 'Desc',
        audienceLevel: 'Advanced',
        durationWeeks: 8,
        curatorId: 'curator123',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('insertEnrollmentSchema', () => {
    it('accepts valid enrollment data', () => {
      const result = insertEnrollmentSchema.safeParse({
        readerId: 'user123',
        binderId: 1,
        status: 'in-progress',
      });
      expect(result.success).toBe(true);
    });

    it('accepts minimal enrollment', () => {
      const result = insertEnrollmentSchema.safeParse({
        status: 'in-progress',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('insertWeekSchema', () => {
    it('accepts valid week data', () => {
      const result = insertWeekSchema.safeParse({
        binderId: 1,
        index: 1,
        title: 'Week 1',
      });
      expect(result.success).toBe(true);
    });

    it('requires binderId', () => {
      const result = insertWeekSchema.safeParse({
        index: 1,
      });
      expect(result.success).toBe(false);
    });

    it('requires index', () => {
      const result = insertWeekSchema.safeParse({
        binderId: 1,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('insertStepSchema', () => {
    it('accepts valid step data', () => {
      const result = insertStepSchema.safeParse({
        weekId: 1,
        position: 1,
        type: 'reading',
        title: 'Read Article',
      });
      expect(result.success).toBe(true);
    });

    it('requires weekId', () => {
      const result = insertStepSchema.safeParse({
        position: 1,
        type: 'reading',
        title: 'Step',
      });
      expect(result.success).toBe(false);
    });

    it('requires type', () => {
      const result = insertStepSchema.safeParse({
        weekId: 1,
        position: 1,
        title: 'Step',
      });
      expect(result.success).toBe(false);
    });

    it('requires title', () => {
      const result = insertStepSchema.safeParse({
        weekId: 1,
        position: 1,
        type: 'reading',
      });
      expect(result.success).toBe(false);
    });

    it('accepts optional fields', () => {
      const result = insertStepSchema.safeParse({
        weekId: 1,
        position: 1,
        type: 'exercise',
        title: 'Do exercise',
        url: 'https://example.com',
        note: 'A note',
        author: 'Author',
        mediaType: 'Blog/Article',
        estimatedMinutes: 30,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('insertSubmissionSchema', () => {
    it('accepts valid submission data', () => {
      const result = insertSubmissionSchema.safeParse({
        enrollmentId: 1,
        stepId: 1,
        answer: 'My answer',
        isShared: false,
      });
      expect(result.success).toBe(true);
    });

    it('requires answer', () => {
      const result = insertSubmissionSchema.safeParse({
        enrollmentId: 1,
        stepId: 1,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('insertCompletedStepSchema', () => {
    it('accepts valid completed step data', () => {
      const result = insertCompletedStepSchema.safeParse({
        enrollmentId: 1,
        stepId: 5,
      });
      expect(result.success).toBe(true);
    });

    it('requires enrollmentId', () => {
      const result = insertCompletedStepSchema.safeParse({
        stepId: 5,
      });
      expect(result.success).toBe(false);
    });

    it('requires stepId', () => {
      const result = insertCompletedStepSchema.safeParse({
        enrollmentId: 1,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('insertCohortSchema', () => {
    it('accepts valid cohort data', () => {
      const result = insertCohortSchema.safeParse({
        name: 'Cohort 1',
        binderId: 1,
      });
      expect(result.success).toBe(true);
    });

    it('requires name', () => {
      const result = insertCohortSchema.safeParse({
        binderId: 1,
      });
      expect(result.success).toBe(false);
    });

    it('requires binderId', () => {
      const result = insertCohortSchema.safeParse({
        name: 'Cohort',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('insertCohortMemberSchema', () => {
    it('accepts valid cohort member data', () => {
      const result = insertCohortMemberSchema.safeParse({
        cohortId: 1,
        readerId: 'user123',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('insertCategorySchema', () => {
    it('accepts valid category data', () => {
      const result = insertCategorySchema.safeParse({
        name: 'Technology',
        slug: 'technology',
      });
      expect(result.success).toBe(true);
    });

    it('requires name', () => {
      const result = insertCategorySchema.safeParse({
        slug: 'technology',
      });
      expect(result.success).toBe(false);
    });

    it('requires slug', () => {
      const result = insertCategorySchema.safeParse({
        name: 'Technology',
      });
      expect(result.success).toBe(false);
    });

    it('accepts optional description and displayOrder', () => {
      const result = insertCategorySchema.safeParse({
        name: 'Technology',
        slug: 'technology',
        description: 'Tech courses',
        displayOrder: 5,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('insertTagSchema', () => {
    it('accepts valid tag data', () => {
      const result = insertTagSchema.safeParse({
        name: 'javascript',
        slug: 'javascript',
      });
      expect(result.success).toBe(true);
    });

    it('requires name', () => {
      const result = insertTagSchema.safeParse({
        slug: 'javascript',
      });
      expect(result.success).toBe(false);
    });

    it('requires slug', () => {
      const result = insertTagSchema.safeParse({
        name: 'javascript',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('insertBinderTagSchema', () => {
    it('accepts valid binder tag data', () => {
      const result = insertBinderTagSchema.safeParse({
        binderId: 1,
        tagId: 2,
      });
      expect(result.success).toBe(true);
    });

    it('requires binderId', () => {
      const result = insertBinderTagSchema.safeParse({
        tagId: 2,
      });
      expect(result.success).toBe(false);
    });

    it('requires tagId', () => {
      const result = insertBinderTagSchema.safeParse({
        binderId: 1,
      });
      expect(result.success).toBe(false);
    });
  });

});
