/**
 * Auth Index Coverage Tests
 *
 * Tests uncovered paths in server/auth/index.ts:
 * - isAuthenticated: success path (user found), error/catch path (db throws)
 * - authenticateWebSocket: all branches
 *
 * Uses a controllable db mock so we can make queries return specific data.
 */

// Create a controllable mock for db queries
const mockDbResult = jest.fn().mockResolvedValue([]);
const mockDbExecute = jest.fn().mockResolvedValue({ rows: [] });

function createControllableProxy() {
  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      if (prop === 'then') {
        const result = mockDbResult();
        return result.then.bind(result);
      }
      if (prop === 'execute') {
        return mockDbExecute;
      }
      return jest.fn().mockReturnValue(new Proxy({}, handler));
    },
  };
  return new Proxy({}, handler);
}

// Override the db mock for this test file
jest.mock('../db', () => ({
  db: createControllableProxy(),
  pool: { connect: jest.fn(), query: jest.fn(), end: jest.fn() },
}));

// Unmock auth so we get the real implementations
jest.unmock('../auth');
jest.unmock('../auth/index');

// Mock cookie-signature for WebSocket tests
const mockUnsign = jest.fn();
jest.mock('cookie-signature', () => ({
  unsign: mockUnsign,
}));

import { isAuthenticated, authenticateWebSocket } from '../auth';

const mockUser = {
  id: 'user-123',
  username: 'testuser',
  name: 'Test User',
  email: 'test@example.com',
  password: 'hashed-password',
  replitId: null,
  googleId: null,
  appleId: null,
  isCreator: false,
  bio: null,
  expertise: null,
  avatarUrl: null,
  linkedin: null,
  website: null,
  twitter: null,
  threads: null,
  shareProfile: false,
  authProvider: 'email',
};

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

describe('isAuthenticated middleware (coverage)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDbResult.mockResolvedValue([]);
  });

  it('calls next and sets req.user when user is found', async () => {
    mockDbResult.mockResolvedValueOnce([mockUser]);
    const { req, res, next } = createMockReqResNext('user-123');

    await isAuthenticated(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.username).toBe('testuser');
    // Password should be excluded
    expect(req.user.password).toBeUndefined();
  });

  it('returns 500 when db throws an error', async () => {
    mockDbResult.mockRejectedValueOnce(new Error('DB connection failed'));
    const { req, res, next } = createMockReqResNext('user-123');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    await isAuthenticated(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Authentication error' });
    expect(next).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe('authenticateWebSocket (coverage)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDbResult.mockResolvedValue([]);
    mockDbExecute.mockResolvedValue({ rows: [] });
    mockUnsign.mockReturnValue(false);
  });

  it('returns null when no cookie header', async () => {
    const req = { headers: {} } as any;
    const result = await authenticateWebSocket(req);
    expect(result).toBeNull();
  });

  it('returns null when no connect.sid cookie', async () => {
    const req = { headers: { cookie: 'other=value' } } as any;
    const result = await authenticateWebSocket(req);
    expect(result).toBeNull();
  });

  it('returns null when cookie does not start with s:', async () => {
    const req = { headers: { cookie: 'connect.sid=invalid-cookie' } } as any;
    const result = await authenticateWebSocket(req);
    expect(result).toBeNull();
  });

  it('returns null when cookie signature is invalid', async () => {
    mockUnsign.mockReturnValue(false);
    const req = { headers: { cookie: 'connect.sid=s%3Asession-id.bad-sig' } } as any;
    const result = await authenticateWebSocket(req);
    expect(result).toBeNull();
  });

  it('returns null when no session found in db', async () => {
    mockUnsign.mockReturnValue('valid-session-id');
    mockDbExecute.mockResolvedValueOnce({ rows: [] });
    const req = { headers: { cookie: 'connect.sid=s%3Asession-id.valid-sig' } } as any;

    const result = await authenticateWebSocket(req);
    expect(result).toBeNull();
  });

  it('returns null when session has no userId', async () => {
    mockUnsign.mockReturnValue('valid-session-id');
    mockDbExecute.mockResolvedValueOnce({ rows: [{ sess: { otherField: true } }] });
    const req = { headers: { cookie: 'connect.sid=s%3Asession-id.valid-sig' } } as any;

    const result = await authenticateWebSocket(req);
    expect(result).toBeNull();
  });

  it('returns null when session userId exists but user not found', async () => {
    mockUnsign.mockReturnValue('valid-session-id');
    mockDbExecute.mockResolvedValueOnce({ rows: [{ sess: { userId: 'user-123' } }] });
    mockDbResult.mockResolvedValueOnce([]); // user query returns empty
    const req = { headers: { cookie: 'connect.sid=s%3Asession-id.valid-sig' } } as any;

    const result = await authenticateWebSocket(req);
    expect(result).toBeNull();
  });

  it('returns user without password on success', async () => {
    mockUnsign.mockReturnValue('valid-session-id');
    mockDbExecute.mockResolvedValueOnce({ rows: [{ sess: { userId: 'user-123' } }] });
    mockDbResult.mockResolvedValueOnce([mockUser]); // user query returns user
    const req = { headers: { cookie: 'connect.sid=s%3Asession-id.valid-sig' } } as any;

    const result = await authenticateWebSocket(req);
    expect(result).not.toBeNull();
    expect(result!.username).toBe('testuser');
    expect((result as any).password).toBeUndefined();
  });

  it('handles string session data', async () => {
    mockUnsign.mockReturnValue('valid-session-id');
    mockDbExecute.mockResolvedValueOnce({
      rows: [{ sess: JSON.stringify({ userId: 'user-123' }) }],
    });
    mockDbResult.mockResolvedValueOnce([mockUser]);
    const req = { headers: { cookie: 'connect.sid=s%3Asession-id.valid-sig' } } as any;

    const result = await authenticateWebSocket(req);
    expect(result).not.toBeNull();
    expect(result!.username).toBe('testuser');
  });

  it('returns null and logs error when exception occurs', async () => {
    mockUnsign.mockReturnValue('valid-session-id');
    mockDbExecute.mockRejectedValueOnce(new Error('DB error'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const req = { headers: { cookie: 'connect.sid=s%3Asession-id.valid-sig' } } as any;

    const result = await authenticateWebSocket(req);
    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith('WebSocket auth error:', expect.any(Error));
    consoleSpy.mockRestore();
  });
});
