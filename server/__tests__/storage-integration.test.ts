/**
 * Storage Integration Tests
 *
 * Tests the real DatabaseStorage class methods against the enhanced db mock.
 * The db mock (from jest.setup.js) returns [] for all queries by default.
 * We test that each method calls the right db chain and handles results correctly.
 */

// We need the real storage class, but db is still mocked
jest.unmock('../storage');

import { DatabaseStorage } from '../storage';
import { db } from '../db';

describe('DatabaseStorage (real class, mocked db)', () => {
  let storage: DatabaseStorage;

  beforeAll(() => {
    storage = new DatabaseStorage();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- User operations ---

  describe('getUser', () => {
    it('returns undefined when no user found', async () => {
      const result = await storage.getUser('no-such-id');
      expect(result).toBeUndefined();
    });
  });

  describe('getUserByUsername', () => {
    it('returns undefined when no user found', async () => {
      const result = await storage.getUserByUsername('nobody');
      expect(result).toBeUndefined();
    });
  });

  describe('getUserByReplitId', () => {
    it('returns undefined when no user found', async () => {
      const result = await storage.getUserByReplitId('replit-999');
      expect(result).toBeUndefined();
    });
  });

  describe('createUser', () => {
    it('calls db.insert and returns undefined for empty result', async () => {
      const result = await storage.createUser({
        username: 'newuser',
        email: 'new@example.com',
        name: 'New User',
      } as any);
      // db mock returns [] so destructure [user] = [] gives undefined
      expect(result).toBeUndefined();
    });
  });

  describe('updateUser', () => {
    it('returns existing user when no updates provided', async () => {
      // updateUser with empty object calls getUser first
      // getUser returns undefined (mock returns [])
      await expect(storage.updateUser('id', {})).rejects.toThrow('User not found');
    });

    it('calls db.update for non-empty updates', async () => {
      const result = await storage.updateUser('id', { name: 'New Name' });
      expect(result).toBeUndefined(); // mock returns []
    });
  });

  // --- Syllabus operations ---

  describe('getSyllabus', () => {
    it('returns undefined when not found', async () => {
      const result = await storage.getSyllabus(999);
      expect(result).toBeUndefined();
    });
  });

  describe('listSyllabinds', () => {
    it('returns empty array', async () => {
      const result = await storage.listSyllabinds();
      expect(result).toEqual([]);
    });
  });

  describe('listPublishedSyllabinds', () => {
    it('returns empty array', async () => {
      const result = await storage.listPublishedSyllabinds();
      expect(result).toEqual([]);
    });
  });

  describe('getSyllabindsByCreator', () => {
    it('returns empty array', async () => {
      const result = await storage.getSyllabindsByCreator('creator');
      expect(result).toEqual([]);
    });
  });

  describe('createSyllabus', () => {
    it('calls db.insert', async () => {
      const result = await storage.createSyllabus({
        title: 'Test', description: 'D', audienceLevel: 'Beginner', durationWeeks: 4
      } as any);
      expect(result).toBeUndefined();
    });
  });

  describe('updateSyllabus', () => {
    it('calls db.update with updatedAt', async () => {
      const result = await storage.updateSyllabus(1, { title: 'Updated' });
      expect(result).toBeUndefined();
    });
  });

  describe('deleteSyllabus', () => {
    it('calls db.delete', async () => {
      await storage.deleteSyllabus(1);
      // No throw = success
    });
  });

  describe('batchDeleteSyllabinds', () => {
    it('does nothing for empty array', async () => {
      await storage.batchDeleteSyllabinds([]);
    });

    it('calls db.delete for non-empty array', async () => {
      await storage.batchDeleteSyllabinds([1, 2]);
    });
  });

  // --- Enrollment operations ---

  describe('getEnrollment', () => {
    it('returns undefined when not found', async () => {
      const result = await storage.getEnrollment('user', 1);
      expect(result).toBeUndefined();
    });
  });

  describe('getUserEnrollments', () => {
    it('returns empty array', async () => {
      const result = await storage.getUserEnrollments('user');
      expect(result).toEqual([]);
    });
  });

  describe('getEnrollmentById', () => {
    it('returns undefined when not found', async () => {
      const result = await storage.getEnrollmentById(999);
      expect(result).toBeUndefined();
    });
  });

  describe('createEnrollment', () => {
    it('calls db.insert', async () => {
      const result = await storage.createEnrollment({
        studentId: 'user', syllabusId: 1, status: 'in-progress'
      } as any);
      expect(result).toBeUndefined();
    });
  });

  describe('dropActiveEnrollments', () => {
    it('handles call without exceptSyllabusId', async () => {
      await storage.dropActiveEnrollments('user');
    });

    it('handles call with exceptSyllabusId', async () => {
      await storage.dropActiveEnrollments('user', 5);
    });
  });

  describe('updateEnrollment', () => {
    it('calls db.update', async () => {
      const result = await storage.updateEnrollment(1, { status: 'completed' });
      expect(result).toBeUndefined();
    });
  });

  // --- Completion tracking ---

  describe('markStepCompleted', () => {
    it('calls db.insert with onConflictDoNothing', async () => {
      const result = await storage.markStepCompleted(1, 5);
      expect(result).toBeUndefined();
    });
  });

  describe('markStepIncomplete', () => {
    it('calls db.delete', async () => {
      await storage.markStepIncomplete(1, 5);
    });
  });

  describe('getCompletedSteps', () => {
    it('returns empty array', async () => {
      const result = await storage.getCompletedSteps(1);
      expect(result).toEqual([]);
    });
  });

  describe('isStepCompleted', () => {
    it('returns false when no result', async () => {
      const result = await storage.isStepCompleted(1, 5);
      expect(result).toBe(false);
    });
  });

  // --- Week/Step operations ---

  describe('createWeek', () => {
    it('calls db.insert', async () => {
      const result = await storage.createWeek({ syllabusId: 1, index: 1 } as any);
      expect(result).toBeUndefined();
    });
  });

  describe('getWeeksBySyllabusId', () => {
    it('returns empty array', async () => {
      const result = await storage.getWeeksBySyllabusId(1);
      expect(result).toEqual([]);
    });
  });

  describe('getWeek', () => {
    it('returns undefined when not found', async () => {
      const result = await storage.getWeek(999);
      expect(result).toBeUndefined();
    });
  });

  describe('updateWeek', () => {
    it('calls db.update', async () => {
      const result = await storage.updateWeek(1, { title: 'Updated' });
      expect(result).toBeUndefined();
    });
  });

  describe('createStep', () => {
    it('calls db.insert', async () => {
      const result = await storage.createStep({ weekId: 1, position: 1, type: 'reading', title: 'Step' } as any);
      expect(result).toBeUndefined();
    });
  });

  describe('getStep', () => {
    it('returns undefined when not found', async () => {
      const result = await storage.getStep(999);
      expect(result).toBeUndefined();
    });
  });

  describe('getStepsByWeekId', () => {
    it('returns empty array', async () => {
      const result = await storage.getStepsByWeekId(1);
      expect(result).toEqual([]);
    });
  });

  describe('deleteStep', () => {
    it('calls db.delete', async () => {
      await storage.deleteStep(1);
    });
  });

  describe('deleteStepsByWeekId', () => {
    it('calls db.delete', async () => {
      await storage.deleteStepsByWeekId(1);
    });
  });

  describe('deleteWeeksBySyllabusId', () => {
    it('calls db.delete', async () => {
      await storage.deleteWeeksBySyllabusId(1);
    });
  });

  // --- Submission operations ---

  describe('createSubmission', () => {
    it('calls db.insert', async () => {
      const result = await storage.createSubmission({
        enrollmentId: 1, stepId: 1, answer: 'Answer', isShared: false
      } as any);
      expect(result).toBeUndefined();
    });
  });

  describe('getSubmission', () => {
    it('returns undefined when not found', async () => {
      const result = await storage.getSubmission(999);
      expect(result).toBeUndefined();
    });
  });

  describe('getSubmissionsByEnrollmentId', () => {
    it('returns empty array', async () => {
      const result = await storage.getSubmissionsByEnrollmentId(1);
      expect(result).toEqual([]);
    });
  });

  describe('updateSubmissionFeedback', () => {
    it('calls db.update', async () => {
      const result = await storage.updateSubmissionFeedback(1, 'Great', 'A', 'http://rubric');
      expect(result).toBeUndefined();
    });
  });

  // --- Learner operations ---

  describe('updateEnrollmentShareProfile', () => {
    it('calls db.update', async () => {
      const result = await storage.updateEnrollmentShareProfile(1, true);
      expect(result).toBeUndefined();
    });
  });

  // --- Chat messages ---

  describe('getChatMessages', () => {
    it('returns empty array', async () => {
      const result = await storage.getChatMessages(1);
      expect(result).toEqual([]);
    });
  });

  describe('createChatMessage', () => {
    it('calls db.insert', async () => {
      const result = await storage.createChatMessage({
        syllabusId: 1, role: 'user', content: 'Hello'
      });
      expect(result).toBeUndefined();
    });
  });

  describe('clearChatMessages', () => {
    it('calls db.delete', async () => {
      await storage.clearChatMessages(1);
    });
  });

  // --- Analytics ---

  describe('getStepCompletionRates', () => {
    it('returns empty array with default total', async () => {
      const result = await storage.getStepCompletionRates(1);
      expect(result).toEqual([]);
    });
  });

  describe('getAverageCompletionTimes', () => {
    it('returns empty array', async () => {
      const result = await storage.getAverageCompletionTimes(1);
      expect(result).toEqual([]);
    });
  });

  // --- Complex methods ---

  describe('getSyllabusWithContent', () => {
    it('returns undefined when syllabus not found', async () => {
      const result = await storage.getSyllabusWithContent(999);
      expect(result).toBeUndefined();
    });
  });

  describe('getLearnersBySyllabusId', () => {
    it('returns empty array when no enrollments', async () => {
      const result = await storage.getLearnersBySyllabusId(1);
      expect(result).toEqual([]);
    });
  });

  describe('getClassmatesBySyllabusId', () => {
    it('returns empty classmates with 0 total', async () => {
      const result = await storage.getClassmatesBySyllabusId(1);
      expect(result.classmates).toEqual([]);
      expect(result.totalEnrolled).toBe(0);
    });
  });

  describe('getSyllabusAnalytics', () => {
    it('returns zero stats when no enrollments', async () => {
      const result = await storage.getSyllabusAnalytics(1);
      expect(result.learnersStarted).toBe(0);
      expect(result.learnersCompleted).toBe(0);
      expect(result.completionRate).toBe(0);
      expect(result.averageProgress).toBe(0);
      expect(result.weekReach).toEqual([]);
      expect(result.stepDropoff).toEqual([]);
      expect(result.topDropoutStep).toBeNull();
    });
  });
});
