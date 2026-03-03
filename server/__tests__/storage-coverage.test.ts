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

  // ── CRUD operations ──

  describe('updateWeek', () => {
    it('updates a week and returns the updated record', async () => {
      const updated = { id: 10, binderId: 1, index: 1, title: 'Updated', description: 'New desc' };
      mockDbResult.mockResolvedValueOnce([updated]);

      const result = await storage.updateWeek(10, { title: 'Updated', description: 'New desc' });
      expect(result).toEqual(updated);
    });
  });

  describe('deleteStep', () => {
    it('deletes a step without error', async () => {
      mockDbResult.mockResolvedValueOnce([]);
      await expect(storage.deleteStep(100)).resolves.toBeUndefined();
    });
  });

  describe('deleteWeeksByBinderId', () => {
    it('deletes weeks for a binder', async () => {
      mockDbResult.mockResolvedValueOnce([]);
      await expect(storage.deleteWeeksByBinderId(1)).resolves.toBeUndefined();
    });
  });

  describe('saveWeeksAndSteps', () => {
    it('saves weeks and steps for a binder', async () => {
      // deleteWeeksByBinderId (internal)
      mockDbResult.mockResolvedValueOnce([]);
      // insert week 1 -> returning
      mockDbResult.mockResolvedValueOnce([{ id: 10, binderId: 1, index: 1, title: 'W1', description: null }]);
      // insert step 1 in week 1 -> returning
      mockDbResult.mockResolvedValueOnce([{
        id: 100, weekId: 10, position: 1, type: 'reading',
        title: 'Step 1', url: null, note: null,
        author: null, creationDate: null, mediaType: null,
        promptText: null, estimatedMinutes: null,
      }]);
      // refreshSearchVector: getTagsByBinderId -> weeks query
      mockDbResult.mockResolvedValueOnce([]);
      // refreshSearchVector: tags query
      mockDbResult.mockResolvedValueOnce([]);
      // refreshSearchVector: execute
      mockDbResult.mockResolvedValueOnce([]);

      const result = await storage.saveWeeksAndSteps(1, [{
        index: 1,
        title: 'W1',
        steps: [{ position: 1, type: 'reading', title: 'Step 1' } as any],
      }]);

      expect(result).toHaveLength(1);
      expect(result[0].steps).toHaveLength(1);
    });
  });

  // ── Stripe/subscription operations ──

  describe('getUserByStripeCustomerId', () => {
    it('returns user when found', async () => {
      const user = { id: 'u1', username: 'testuser', stripeCustomerId: 'cus_123' };
      mockDbResult.mockResolvedValueOnce([user]);
      const result = await storage.getUserByStripeCustomerId('cus_123');
      expect(result).toEqual(user);
    });

    it('returns undefined when not found', async () => {
      mockDbResult.mockResolvedValueOnce([]);
      const result = await storage.getUserByStripeCustomerId('cus_nonexistent');
      expect(result).toBeUndefined();
    });
  });

  describe('getSubscriptionByStripeId', () => {
    it('returns subscription when found', async () => {
      const sub = { id: 1, stripeSubscriptionId: 'sub_123', status: 'active' };
      mockDbResult.mockResolvedValueOnce([sub]);
      const result = await storage.getSubscriptionByStripeId('sub_123');
      expect(result).toEqual(sub);
    });

    it('returns undefined when not found', async () => {
      mockDbResult.mockResolvedValueOnce([]);
      const result = await storage.getSubscriptionByStripeId('sub_nope');
      expect(result).toBeUndefined();
    });
  });

  describe('upsertSubscription', () => {
    it('inserts or updates subscription and returns it', async () => {
      const sub = { id: 1, stripeSubscriptionId: 'sub_123', status: 'active', userId: 'u1' };
      mockDbResult.mockResolvedValueOnce([sub]);
      const result = await storage.upsertSubscription({
        userId: 'u1',
        stripeSubscriptionId: 'sub_123',
        status: 'active',
      } as any);
      expect(result).toEqual(sub);
    });
  });

  describe('updateSubscriptionByStripeId', () => {
    it('updates and returns subscription', async () => {
      const sub = { id: 1, stripeSubscriptionId: 'sub_123', status: 'canceled' };
      mockDbResult.mockResolvedValueOnce([sub]);
      const result = await storage.updateSubscriptionByStripeId('sub_123', { status: 'canceled' } as any);
      expect(result).toEqual(sub);
    });

    it('returns undefined when not found', async () => {
      mockDbResult.mockResolvedValueOnce([]);
      const result = await storage.updateSubscriptionByStripeId('sub_nope', { status: 'canceled' } as any);
      expect(result).toBeUndefined();
    });
  });

  // ── Count operations ──

  describe('countBindersByCurator', () => {
    it('returns count when results exist', async () => {
      mockDbResult.mockResolvedValueOnce([{ count: 5 }]);
      const result = await storage.countBindersByCurator('curator1');
      expect(result).toBe(5);
    });

    it('returns 0 when no results', async () => {
      mockDbResult.mockResolvedValueOnce([{}]);
      const result = await storage.countBindersByCurator('nobody');
      expect(result).toBe(0);
    });
  });

  describe('countActiveEnrollments', () => {
    it('returns count', async () => {
      mockDbResult.mockResolvedValueOnce([{ count: 3 }]);
      const result = await storage.countActiveEnrollments('reader1');
      expect(result).toBe(3);
    });

    it('returns 0 when no results', async () => {
      mockDbResult.mockResolvedValueOnce([{}]);
      const result = await storage.countActiveEnrollments('nobody');
      expect(result).toBe(0);
    });
  });

  describe('countManualBinders', () => {
    it('returns count', async () => {
      mockDbResult.mockResolvedValueOnce([{ count: 2 }]);
      const result = await storage.countManualBinders('curator1');
      expect(result).toBe(2);
    });

    it('returns 0 when no results', async () => {
      mockDbResult.mockResolvedValueOnce([{}]);
      const result = await storage.countManualBinders('nobody');
      expect(result).toBe(0);
    });
  });

  // ── Site settings ──

  describe('getSiteSetting', () => {
    it('returns value when setting exists', async () => {
      mockDbResult.mockResolvedValueOnce([{ key: 'motd', value: 'Hello!' }]);
      const result = await storage.getSiteSetting('motd');
      expect(result).toBe('Hello!');
    });

    it('returns null when setting does not exist', async () => {
      mockDbResult.mockResolvedValueOnce([]);
      const result = await storage.getSiteSetting('missing');
      expect(result).toBeNull();
    });
  });

  describe('setSiteSetting', () => {
    it('upserts a setting', async () => {
      mockDbResult.mockResolvedValueOnce([]);
      await expect(storage.setSiteSetting('motd', 'Updated')).resolves.toBeUndefined();
    });
  });

  // ── Categories ──

  describe('listCategories', () => {
    it('returns categories ordered by displayOrder', async () => {
      const cats = [
        { id: 1, name: 'Design', slug: 'design', displayOrder: 1 },
        { id: 2, name: 'Tech', slug: 'technology', displayOrder: 2 },
      ];
      mockDbResult.mockResolvedValueOnce(cats);
      const result = await storage.listCategories();
      expect(result).toEqual(cats);
    });
  });

  describe('initializeDefaultCategories', () => {
    it('skips insertion when categories already exist', async () => {
      mockDbResult.mockResolvedValueOnce([{ id: 1 }]);
      await storage.initializeDefaultCategories();
      // Only one DB call (the check), no insert
      expect(mockDbResult).toHaveBeenCalledTimes(1);
    });

    it('inserts defaults when no categories exist', async () => {
      // Check query returns empty
      mockDbResult.mockResolvedValueOnce([]);
      // Insert query
      mockDbResult.mockResolvedValueOnce([]);

      await storage.initializeDefaultCategories();
      expect(mockDbResult).toHaveBeenCalledTimes(2);
    });
  });

  // ── Tags ──

  describe('listTags', () => {
    it('returns tags with usage count', async () => {
      const tagList = [{ id: 1, name: 'react', slug: 'react', usageCount: 5 }];
      mockDbResult.mockResolvedValueOnce(tagList);
      const result = await storage.listTags();
      expect(result).toEqual(tagList);
    });

    it('filters by query when provided', async () => {
      const tagList = [{ id: 1, name: 'react', slug: 'react', usageCount: 3 }];
      mockDbResult.mockResolvedValueOnce(tagList);
      const result = await storage.listTags('react');
      expect(result).toEqual(tagList);
    });
  });

  describe('getTagsByBinderId', () => {
    it('returns tags for a binder', async () => {
      const tagRows = [
        { tag: { id: 1, name: 'design', slug: 'design', createdAt: new Date() } },
      ];
      mockDbResult.mockResolvedValueOnce(tagRows);
      const result = await storage.getTagsByBinderId(1);
      expect(result).toEqual([tagRows[0].tag]);
    });
  });

  describe('findOrCreateTag', () => {
    it('returns existing tag when slug matches', async () => {
      const existing = { id: 1, name: 'React', slug: 'react', createdAt: new Date() };
      mockDbResult.mockResolvedValueOnce([existing]);
      const result = await storage.findOrCreateTag('React');
      expect(result).toEqual(existing);
    });

    it('creates tag when not found', async () => {
      // Search returns empty
      mockDbResult.mockResolvedValueOnce([]);
      // Insert returns new tag
      const created = { id: 2, name: 'Vue.js', slug: 'vue-js', createdAt: new Date() };
      mockDbResult.mockResolvedValueOnce([created]);

      const result = await storage.findOrCreateTag('Vue.js');
      expect(result).toEqual(created);
    });
  });

  describe('setBinderTags', () => {
    it('deletes existing and sets new tags', async () => {
      // delete existing binderTags
      mockDbResult.mockResolvedValueOnce([]);
      // findOrCreateTag('React'): search
      mockDbResult.mockResolvedValueOnce([{ id: 1, name: 'React', slug: 'react' }]);
      // insert binderTag
      mockDbResult.mockResolvedValueOnce([]);
      // refreshSearchVector: weeks query
      mockDbResult.mockResolvedValueOnce([]);
      // refreshSearchVector: getTagsByBinderId
      mockDbResult.mockResolvedValueOnce([]);
      // refreshSearchVector: execute
      mockDbResult.mockResolvedValueOnce([]);

      const result = await storage.setBinderTags(1, ['React']);
      expect(result).toHaveLength(1);
    });

    it('returns empty when no tag names given', async () => {
      // delete existing
      mockDbResult.mockResolvedValueOnce([]);

      const result = await storage.setBinderTags(1, []);
      expect(result).toEqual([]);
    });

    it('enforces max 5 tags', async () => {
      const names = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
      // delete existing
      mockDbResult.mockResolvedValueOnce([]);
      // 5 findOrCreateTag calls (each: search + insert binderTag)
      for (let i = 0; i < 5; i++) {
        mockDbResult.mockResolvedValueOnce([{ id: i + 1, name: names[i], slug: names[i] }]);
        mockDbResult.mockResolvedValueOnce([]); // insert binderTag
      }
      // refreshSearchVector: weeks, tags, execute
      mockDbResult.mockResolvedValueOnce([]);
      mockDbResult.mockResolvedValueOnce([]);
      mockDbResult.mockResolvedValueOnce([]);

      const result = await storage.setBinderTags(1, names);
      expect(result).toHaveLength(5); // trimmed to 5
    });
  });

  // ── Generation tracking ──

  describe('incrementGenerationCount', () => {
    it('increments count without error', async () => {
      mockDbResult.mockResolvedValueOnce([]);
      await expect(storage.incrementGenerationCount('curator1')).resolves.toBeUndefined();
    });
  });

  describe('getGenerationInfo', () => {
    it('returns generation info when user found', async () => {
      const now = new Date();
      mockDbResult.mockResolvedValueOnce([{ generationCount: 5, lastGeneratedAt: now }]);
      const result = await storage.getGenerationInfo('curator1');
      expect(result.generationCount).toBe(5);
      expect(result.lastGeneratedAt).toBe(now);
    });

    it('returns defaults when user not found', async () => {
      mockDbResult.mockResolvedValueOnce([]);
      const result = await storage.getGenerationInfo('nobody');
      expect(result.generationCount).toBe(0);
      expect(result.lastGeneratedAt).toBeNull();
    });
  });

  // ── Review queue ──

  describe('getBindersByStatus', () => {
    it('returns binders with curator info', async () => {
      const rows = [{
        binder: { id: 1, title: 'Binder 1', status: 'pending_review' },
        curatorName: 'Jane',
        curatorUsername: 'jane',
        curatorAvatarUrl: null,
      }];
      mockDbResult.mockResolvedValueOnce(rows);

      const result = await storage.getBindersByStatus('pending_review');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].curator).toEqual({ name: 'Jane', username: 'jane', avatarUrl: null });
    });

    it('returns binder without curator when username is null', async () => {
      const rows = [{
        binder: { id: 2, title: 'Orphaned', status: 'pending_review' },
        curatorName: null,
        curatorUsername: null,
        curatorAvatarUrl: null,
      }];
      mockDbResult.mockResolvedValueOnce(rows);

      const result = await storage.getBindersByStatus('pending_review');
      expect(result[0].curator).toBeUndefined();
    });
  });

  describe('getDemoBinders', () => {
    it('returns demo binders with content', async () => {
      // Query for demo binders
      mockDbResult.mockResolvedValueOnce([{ id: 1, title: 'Demo', isDemo: true }]);
      // getBinderWithContent for binder 1: getBinder
      mockDbResult.mockResolvedValueOnce([{ id: 1, title: 'Demo' }]);
      // getBinderWithContent: weeks
      mockDbResult.mockResolvedValueOnce([]);

      const result = await storage.getDemoBinders();
      expect(result).toHaveLength(1);
    });

    it('filters out undefined results', async () => {
      // Query for demo binders
      mockDbResult.mockResolvedValueOnce([{ id: 1, isDemo: true }, { id: 2, isDemo: true }]);
      // getBinderWithContent for binder 1: getBinder returns nothing
      mockDbResult.mockResolvedValueOnce([]);
      // getBinderWithContent for binder 2: getBinder returns binder
      mockDbResult.mockResolvedValueOnce([{ id: 2, title: 'Demo 2' }]);
      // weeks for binder 2
      mockDbResult.mockResolvedValueOnce([]);

      const result = await storage.getDemoBinders();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });
  });

  // ── Notifications ──

  describe('getCuratorUnreadNotifications', () => {
    it('returns unread notifications', async () => {
      const rows = [{ binderId: 1, title: 'Binder 1', status: 'published', reviewNote: 'Approved!' }];
      mockDbResult.mockResolvedValueOnce(rows);

      const result = await storage.getCuratorUnreadNotifications('curator1', null);
      expect(result).toEqual(rows);
    });

    it('filters by ackedAt date when provided', async () => {
      mockDbResult.mockResolvedValueOnce([]);
      const result = await storage.getCuratorUnreadNotifications('curator1', new Date());
      expect(result).toEqual([]);
    });
  });

  describe('getAdminUnreadCount', () => {
    it('returns count of pending_review binders', async () => {
      mockDbResult.mockResolvedValueOnce([{ count: 3 }]);
      const result = await storage.getAdminUnreadCount(null);
      expect(result).toBe(3);
    });

    it('filters by ackedAt date', async () => {
      mockDbResult.mockResolvedValueOnce([{ count: 1 }]);
      const result = await storage.getAdminUnreadCount(new Date());
      expect(result).toBe(1);
    });

    it('returns 0 when no results', async () => {
      mockDbResult.mockResolvedValueOnce([{}]);
      const result = await storage.getAdminUnreadCount(null);
      expect(result).toBe(0);
    });
  });

  describe('acknowledgeNotifications', () => {
    it('updates user notificationsAckedAt', async () => {
      mockDbResult.mockResolvedValueOnce([]);
      await expect(storage.acknowledgeNotifications('user-id')).resolves.toBeUndefined();
    });
  });

  // ── Credits ──

  describe('getCreditBalance', () => {
    it('returns balance when user found', async () => {
      mockDbResult.mockResolvedValueOnce([{ creditBalance: 250 }]);
      const result = await storage.getCreditBalance('user-1');
      expect(result).toBe(250);
    });

    it('returns 0 when user not found', async () => {
      mockDbResult.mockResolvedValueOnce([]);
      const result = await storage.getCreditBalance('nobody');
      expect(result).toBe(0);
    });
  });

  describe('getCreditTransactions', () => {
    it('returns transactions for user', async () => {
      const txns = [
        { id: 1, userId: 'u1', amount: -10, type: 'generation', balance: 90 },
        { id: 2, userId: 'u1', amount: 100, type: 'signup_grant', balance: 100 },
      ];
      mockDbResult.mockResolvedValueOnce(txns);
      const result = await storage.getCreditTransactions('u1');
      expect(result).toEqual(txns);
    });
  });

  describe('deductCredits', () => {
    it('returns transaction and new balance on success', async () => {
      mockDbResult.mockResolvedValueOnce({ rows: [{ id: 5, balance: 90 }] });
      const result = await storage.deductCredits('u1', 10, 'generation', 'Test deduction');
      expect(result).toEqual({ transactionId: 5, newBalance: 90 });
    });

    it('throws INSUFFICIENT_CREDITS when deduction fails', async () => {
      mockDbResult.mockResolvedValueOnce({ rows: [] });
      await expect(storage.deductCredits('u1', 1000, 'generation', 'Too much'))
        .rejects.toThrow('INSUFFICIENT_CREDITS');
    });
  });

  describe('grantCredits', () => {
    it('returns transaction and new balance on success', async () => {
      mockDbResult.mockResolvedValueOnce({ rows: [{ id: 6, balance: 200 }] });
      const result = await storage.grantCredits('u1', 100, 'signup_grant', 'Welcome!');
      expect(result).toEqual({ transactionId: 6, newBalance: 200 });
    });

    it('throws when user not found', async () => {
      mockDbResult.mockResolvedValueOnce({ rows: [] });
      await expect(storage.grantCredits('nobody', 100, 'signup_grant', 'Test'))
        .rejects.toThrow('User not found');
    });
  });

  // ── Search vector ──

  describe('refreshSearchVector', () => {
    it('builds search vector from weeks and tags', async () => {
      // weeks query
      mockDbResult.mockResolvedValueOnce([
        { title: 'Week 1', description: 'Introduction' },
        { title: 'Week 2', description: null },
      ]);
      // getTagsByBinderId -> tags inner join
      mockDbResult.mockResolvedValueOnce([
        { tag: { id: 1, name: 'design', slug: 'design' } },
      ]);
      // execute update
      mockDbResult.mockResolvedValueOnce([]);

      await expect(storage.refreshSearchVector(1)).resolves.toBeUndefined();
    });
  });
});
