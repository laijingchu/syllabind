/**
 * Admin access via ADMIN_USERNAMES environment variable.
 * No database changes required — admin status is determined at runtime.
 */
export function isAdminUser(username: string): boolean {
  const raw = process.env.ADMIN_USERNAMES;
  if (!raw) return false;
  const adminSet = new Set(raw.split(',').map(u => u.trim()).filter(Boolean));
  return adminSet.has(username);
}
