/**
 * Auth Middleware Tests
 *
 * Tests the real isAuthenticated middleware from server/auth/index.ts.
 * The db mock is already set up in jest.setup.js so we can test
 * the middleware in isolation.
 */

// Unmock auth so we get the real isAuthenticated
jest.unmock('../auth');
jest.unmock('../auth/index');

import { isAuthenticated } from '../auth';

// Helper to create mock req/res/next
function createMockReqResNext(sessionUserId?: string) {
  const req: any = {
    session: sessionUserId ? { userId: sessionUserId } : {},
  };
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
}

describe('isAuthenticated middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when no session userId', async () => {
    const { req, res, next } = createMockReqResNext();
    await isAuthenticated(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when userId present but user not found in db', async () => {
    // db mock returns [] by default, so [user] = [] → user is undefined
    const { req, res, next } = createMockReqResNext('nonexistent-id');
    await isAuthenticated(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when session is undefined', async () => {
    const req: any = {};
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    await isAuthenticated(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
