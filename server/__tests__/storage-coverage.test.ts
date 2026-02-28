/**
 * Storage Coverage Tests
 *
 * Tests uncovered branches/methods in server/storage.ts:
 * - getBinderWithContent: when binder exists (with weeks and steps)
 * - getReadersByBinderId: when enrollments exist
 * - getClassmatesByBinderId: when classmates exist with user data and null users
 * - getBinderAnalytics: full analytics with enrollment data, progress, dropoff
 *
 * Uses a controllable db mock so sequential db calls return different data.
 */

// Controllable mock: sequential calls return different values via mockResolvedValueOnce
const mockDbResult = jest.fn().mockResolvedValue([]);

function createControllableProxy() {
  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      if (prop === 'then') {
        const result = mockDbResult();
        return result.then.bind(result);
      }
      return jest.fn().mockReturnValue(new Proxy({}, handler));
    },
  };
  return new Proxy({}, handler);
}

jest.mock('../db', () => ({
  db: createControllableProxy(),
  pool: { connect: jest.fn(), query: jest.fn(), end: jest.fn() },
}));

jest.unmock('../storage');

import { DatabaseStorage } from '../storage';

describe('DatabaseStorage coverage tests', () => {
  let storage: DatabaseStorage;

  beforeAll(() => {
    storage = new DatabaseStorage();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockDbResult.mockResolvedValue([]);
  });

  describe('getBinderWithContent', () => {
    it('returns binder with empty weeks when binder found but no weeks', async () => {
      const mockBinder = {
        id: 1, title: 'Test', description: 'Desc',
        audienceLevel: 'Beginner', durationWeeks: 4,
        status: 'published', curatorId: 'curator',
        createdAt: new Date(), updatedAt: new Date(),
        readerActive: 0, readersCompleted: 0,
      };

      // First call: getBinder select -> returns binder
      mockDbResult.mockResolvedValueOnce([mockBinder]);
      // Second call: weeks query -> returns empty
      mockDbResult.mockResolvedValueOnce([]);

      const result = await storage.getBinderWithContent(1);
      expect(result).toBeDefined();
      expect(result!.title).toBe('Test');
      expect(result!.weeks).toEqual([]);
    });

    it('returns binder with weeks and steps', async () => {
      const mockBinder = {
        id: 1, title: 'Test', description: 'Desc',
        audienceLevel: 'Beginner', durationWeeks: 4,
        status: 'published', curatorId: 'curator',
        createdAt: new Date(), updatedAt: new Date(),
        readerActive: 0, readersCompleted: 0,
      };
      const mockWeek = { id: 10, binderId: 1, index: 1, title: 'Week 1', description: null };
      const mockStep = {
        id: 100, weekId: 10, position: 1, type: 'reading',
        title: 'Read Article', url: null, note: null,
        author: null, creationDate: null, mediaType: null,
        promptText: null, estimatedMinutes: null,
      };

      // getBinder -> binder found
      mockDbResult.mockResolvedValueOnce([mockBinder]);
      // weeks query -> returns week
      mockDbResult.mockResolvedValueOnce([mockWeek]);
      // steps query for week -> returns step
      mockDbResult.mockResolvedValueOnce([mockStep]);

      const result = await storage.getBinderWithContent(1);
      expect(result).toBeDefined();
      expect(result!.weeks).toHaveLength(1);
      expect(result!.weeks[0].title).toBe('Week 1');
      expect(result!.weeks[0].steps).toHaveLength(1);
      expect(result!.weeks[0].steps[0].title).toBe('Read Article');
    });

    it('deduplicates weeks with same index, keeping highest ID', async () => {
      const mockBinder = {
        id: 1, title: 'Test', description: 'Desc',
        audienceLevel: 'Beginner', durationWeeks: 2,
        status: 'published', curatorId: 'curator',
        createdAt: new Date(), updatedAt: new Date(),
        readerActive: 0, readersCompleted: 0,
      };
      // Two weeks with the same index (race condition duplicate)
      const oldWeek = { id: 10, binderId: 1, index: 1, title: 'Old Week 1', description: null };
      const newWeek = { id: 20, binderId: 1, index: 1, title: 'New Week 1', description: null };
      const week2 = { id: 30, binderId: 1, index: 2, title: 'Week 2', description: null };

      // getBinder -> binder found
      mockDbResult.mockResolvedValueOnce([mockBinder]);
      // weeks query -> returns duplicates
      mockDbResult.mockResolvedValueOnce([oldWeek, newWeek, week2]);
      // steps for newWeek (id=20, kept) -> 1 step
      mockDbResult.mockResolvedValueOnce([{
        id: 100, weekId: 20, position: 1, type: 'reading',
        title: 'New Step', url: null, note: null,
        author: null, creationDate: null, mediaType: null,
        promptText: null, estimatedMinutes: null,
      }]);
      // steps for week2 (id=30)
      mockDbResult.mockResolvedValueOnce([]);

      const result = await storage.getBinderWithContent(1);
      expect(result).toBeDefined();
      expect(result!.weeks).toHaveLength(2);
      expect(result!.weeks[0].id).toBe(20); // Higher ID kept
      expect(result!.weeks[0].title).toBe('New Week 1');
      expect(result!.weeks[1].id).toBe(30);
    });
  });

  describe('getReadersByBinderId', () => {
    it('returns reader data when enrollments exist', async () => {
      const mockEnrollment = {
        id: 1, readerId: 'testuser', binderId: 1,
        status: 'in-progress', currentWeekIndex: 1,
        shareProfile: false, joinedAt: new Date(),
      };
      const mockUser = {
        id: 'user-1', username: 'testuser', name: 'Test User',
        email: 'test@example.com', password: null, replitId: null,
        googleId: null, appleId: null, isCurator: false,
        bio: null, expertise: null, avatarUrl: null,
        linkedin: null, website: null, twitter: null, threads: null,
        shareProfile: false, authProvider: 'email',
      };

      // enrollments query
      mockDbResult.mockResolvedValueOnce([mockEnrollment]);
      // getUserByUsername for the enrollment
      mockDbResult.mockResolvedValueOnce([mockUser]);

      const result = await storage.getReadersByBinderId(1);
      expect(result).toHaveLength(1);
      expect(result[0].user).toBeDefined();
      expect(result[0].user.username).toBe('testuser');
      expect(result[0].status).toBe('in-progress');
      expect(result[0].enrollmentId).toBe(1);
    });
  });

  describe('getClassmatesByBinderId', () => {
    it('returns classmates when sharing enrollments exist', async () => {
      const mockEnrollment = {
        id: 1, readerId: 'testuser', binderId: 1,
        status: 'in-progress', currentWeekIndex: 1,
        shareProfile: true, joinedAt: new Date(),
      };
      const mockUser = {
        id: 'user-1', username: 'testuser', name: 'Test User',
        email: 'test@example.com', password: null, replitId: null,
        googleId: null, appleId: null, isCurator: false,
        bio: 'A bio', expertise: null, avatarUrl: null,
        linkedin: 'testuser', website: null, twitter: 'testuser', threads: null,
        shareProfile: true, authProvider: 'email',
      };

      // count query
      mockDbResult.mockResolvedValueOnce([{ count: 3 }]);
      // sharing enrollments query
      mockDbResult.mockResolvedValueOnce([mockEnrollment]);
      // getUserByUsername
      mockDbResult.mockResolvedValueOnce([mockUser]);

      const result = await storage.getClassmatesByBinderId(1);
      expect(result.totalEnrolled).toBe(3);
      expect(result.classmates).toHaveLength(1);
      expect(result.classmates[0].user.username).toBe('testuser');
      expect(result.classmates[0].user.bio).toBe('A bio');
    });

    it('filters out null users from classmates', async () => {
      const mockEnrollment = {
        id: 1, readerId: 'deleteduser', binderId: 1,
        status: 'in-progress', currentWeekIndex: 1,
        shareProfile: true, joinedAt: new Date(),
      };

      // count query
      mockDbResult.mockResolvedValueOnce([{ count: 1 }]);
      // sharing enrollments query
      mockDbResult.mockResolvedValueOnce([mockEnrollment]);
      // getUserByUsername returns nothing (user deleted)
      mockDbResult.mockResolvedValueOnce([]);

      const result = await storage.getClassmatesByBinderId(1);
      expect(result.totalEnrolled).toBe(1);
      expect(result.classmates).toHaveLength(0);
    });
  });

  describe('getBinderAnalytics', () => {
    const mockWeek1 = { id: 10, binderId: 1, index: 1, title: 'Week 1', description: null };
    const mockWeek2 = { id: 20, binderId: 1, index: 2, title: 'Week 2', description: null };
    const mockStep1 = {
      id: 100, weekId: 10, position: 1, type: 'reading',
      title: 'Step 1', url: null, note: null, author: null,
      creationDate: null, mediaType: null, promptText: null, estimatedMinutes: null,
    };
    const mockStep2 = {
      id: 101, weekId: 10, position: 2, type: 'exercise',
      title: 'Step 2', url: null, note: null, author: null,
      creationDate: null, mediaType: null, promptText: null, estimatedMinutes: null,
    };
    const mockStep3 = {
      id: 200, weekId: 20, position: 1, type: 'reading',
      title: 'Step 3', url: null, note: null, author: null,
      creationDate: null, mediaType: null, promptText: null, estimatedMinutes: null,
    };

    it('calculates analytics with enrolled readers and progress', async () => {
      const enrollment1 = {
        id: 1, readerId: 'reader1', binderId: 1,
        status: 'in-progress', currentWeekIndex: 1,
        shareProfile: false, joinedAt: new Date(),
      };
      const enrollment2 = {
        id: 2, readerId: 'reader2', binderId: 1,
        status: 'completed', currentWeekIndex: 2,
        shareProfile: false, joinedAt: new Date(),
      };

      // 1. enrollments query
      mockDbResult.mockResolvedValueOnce([enrollment1, enrollment2]);
      // 2. weeks query
      mockDbResult.mockResolvedValueOnce([mockWeek1, mockWeek2]);
      // 3. steps for week 1
      mockDbResult.mockResolvedValueOnce([mockStep1, mockStep2]);
      // 4. steps for week 2
      mockDbResult.mockResolvedValueOnce([mockStep3]);
      // 5. getCompletedSteps for enrollment 1 -> completed step 100
      mockDbResult.mockResolvedValueOnce([{ stepId: 100 }]);
      // 6. getUserByUsername for reader1
      mockDbResult.mockResolvedValueOnce([{ id: 'u1', username: 'reader1', name: 'Reader One' }]);
      // 7. getCompletedSteps for enrollment 2 -> completed all steps
      mockDbResult.mockResolvedValueOnce([{ stepId: 100 }, { stepId: 101 }, { stepId: 200 }]);
      // 8. getUserByUsername for reader2
      mockDbResult.mockResolvedValueOnce([{ id: 'u2', username: 'reader2', name: 'Reader Two' }]);

      const result = await storage.getBinderAnalytics(1);

      expect(result.readersStarted).toBe(2);
      expect(result.readersCompleted).toBe(1);
      expect(result.completionRate).toBe(50);
      expect(result.averageProgress).toBeGreaterThan(0);
      expect(result.weekReach).toHaveLength(2);
      expect(result.stepDropoff).toHaveLength(3);
    });

    it('returns zero stats when no enrollments', async () => {
      // enrollments query -> empty
      mockDbResult.mockResolvedValueOnce([]);
      // weeks query -> some weeks
      mockDbResult.mockResolvedValueOnce([mockWeek1]);
      // steps for week 1
      mockDbResult.mockResolvedValueOnce([mockStep1]);

      const result = await storage.getBinderAnalytics(1);
      expect(result.readersStarted).toBe(0);
      expect(result.readersCompleted).toBe(0);
      expect(result.completionRate).toBe(0);
      expect(result.averageProgress).toBe(0);
      expect(result.topDropoutStep).toBeNull();
    });

    it('identifies top dropout step', async () => {
      const enrollment1 = {
        id: 1, readerId: 'reader1', binderId: 1,
        status: 'in-progress', currentWeekIndex: 1,
        shareProfile: false, joinedAt: new Date(),
      };
      const enrollment2 = {
        id: 2, readerId: 'reader2', binderId: 1,
        status: 'in-progress', currentWeekIndex: 1,
        shareProfile: false, joinedAt: new Date(),
      };

      // 1. enrollments query
      mockDbResult.mockResolvedValueOnce([enrollment1, enrollment2]);
      // 2. weeks query
      mockDbResult.mockResolvedValueOnce([mockWeek1]);
      // 3. steps for week 1
      mockDbResult.mockResolvedValueOnce([mockStep1, mockStep2]);
      // 4. getCompletedSteps for enrollment 1 -> completed step 100 only
      mockDbResult.mockResolvedValueOnce([{ stepId: 100 }]);
      // 5. getUserByUsername for reader1
      mockDbResult.mockResolvedValueOnce([{ id: 'u1', username: 'reader1', name: 'Reader One' }]);
      // 6. getCompletedSteps for enrollment 2 -> completed step 100 only
      mockDbResult.mockResolvedValueOnce([{ stepId: 100 }]);
      // 7. getUserByUsername for reader2
      mockDbResult.mockResolvedValueOnce([{ id: 'u2', username: 'reader2', name: 'Reader Two' }]);

      const result = await storage.getBinderAnalytics(1);

      // Both readers completed step 100 but not step 101
      expect(result.topDropoutStep).not.toBeNull();
      expect(result.topDropoutStep!.stepTitle).toBe('Step 2');
      expect(result.topDropoutStep!.dropoffRate).toBe(100);
    });

    it('handles reader with no username match', async () => {
      const enrollment = {
        id: 1, readerId: 'ghost', binderId: 1,
        status: 'in-progress', currentWeekIndex: 1,
        shareProfile: false, joinedAt: new Date(),
      };

      // enrollments
      mockDbResult.mockResolvedValueOnce([enrollment]);
      // weeks
      mockDbResult.mockResolvedValueOnce([mockWeek1]);
      // steps for week 1
      mockDbResult.mockResolvedValueOnce([mockStep1]);
      // getCompletedSteps -> empty
      mockDbResult.mockResolvedValueOnce([]);
      // getUserByUsername -> not found
      mockDbResult.mockResolvedValueOnce([]);

      const result = await storage.getBinderAnalytics(1);
      expect(result.readersStarted).toBe(1);
      // Reader name falls back to readerId
      expect(result.weekReach[0].readerNames).toContain('ghost');
    });

    it('handles null currentWeekIndex with default to 1', async () => {
      const enrollment = {
        id: 1, readerId: 'reader1', binderId: 1,
        status: 'in-progress', currentWeekIndex: null,
        shareProfile: false, joinedAt: new Date(),
      };

      // enrollments
      mockDbResult.mockResolvedValueOnce([enrollment]);
      // weeks
      mockDbResult.mockResolvedValueOnce([mockWeek1]);
      // steps
      mockDbResult.mockResolvedValueOnce([mockStep1]);
      // completed steps
      mockDbResult.mockResolvedValueOnce([]);
      // getUserByUsername
      mockDbResult.mockResolvedValueOnce([{ id: 'u1', username: 'reader1', name: 'R1' }]);

      const result = await storage.getBinderAnalytics(1);
      // With null currentWeekIndex, default is 1, so reader should be at week 1
      expect(result.weekReach[0].readerNames).toContain('R1');
    });
  });
});
