import { isAdminUser } from '../auth/admin';

describe('isAdminUser', () => {
  const originalEnv = process.env.ADMIN_USERNAMES;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.ADMIN_USERNAMES;
    } else {
      process.env.ADMIN_USERNAMES = originalEnv;
    }
  });

  it('returns false when ADMIN_USERNAMES is not set', () => {
    delete process.env.ADMIN_USERNAMES;
    expect(isAdminUser('anyuser')).toBe(false);
  });

  it('returns false when ADMIN_USERNAMES is empty', () => {
    process.env.ADMIN_USERNAMES = '';
    expect(isAdminUser('anyuser')).toBe(false);
  });

  it('returns true for a single admin username', () => {
    process.env.ADMIN_USERNAMES = 'admin1';
    expect(isAdminUser('admin1')).toBe(true);
    expect(isAdminUser('notadmin')).toBe(false);
  });

  it('returns true for any username in a comma-separated list', () => {
    process.env.ADMIN_USERNAMES = 'admin1,admin2,admin3';
    expect(isAdminUser('admin1')).toBe(true);
    expect(isAdminUser('admin2')).toBe(true);
    expect(isAdminUser('admin3')).toBe(true);
    expect(isAdminUser('notadmin')).toBe(false);
  });

  it('trims whitespace around usernames', () => {
    process.env.ADMIN_USERNAMES = ' admin1 , admin2 ';
    expect(isAdminUser('admin1')).toBe(true);
    expect(isAdminUser('admin2')).toBe(true);
  });

  it('ignores empty entries from extra commas', () => {
    process.env.ADMIN_USERNAMES = ',admin1,,admin2,';
    expect(isAdminUser('admin1')).toBe(true);
    expect(isAdminUser('admin2')).toBe(true);
    expect(isAdminUser('')).toBe(false);
  });

  it('is case-sensitive', () => {
    process.env.ADMIN_USERNAMES = 'Admin1';
    expect(isAdminUser('Admin1')).toBe(true);
    expect(isAdminUser('admin1')).toBe(false);
  });
});
