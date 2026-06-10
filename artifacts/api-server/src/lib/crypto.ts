import bcrypt from "bcrypt";

/**
 * Hashes a plaintext password using bcrypt with 10 salt rounds.
 */
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

/**
 * Verifies a plaintext password against a stored bcrypt hash.
 */
export function verifyPassword(password: string, stored: string): boolean {
  try {
    return bcrypt.compareSync(password, stored);
  } catch (err) {
    return false;
  }
}
