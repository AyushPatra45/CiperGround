import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
  createHmac,
} from 'node:crypto';
export const token = () => randomBytes(32).toString('hex');
export const sha = (s: string) => createHash('sha256').update(s).digest('hex');
export function passwordHash(
  password: string,
  salt = randomBytes(16).toString('hex'),
) {
  return `scrypt$${salt}$${scryptSync(password, salt, 32, { N: 16384, r: 8, p: 5, maxmem: 33554432 }).toString('hex')}`;
}
export function passwordValid(password: string, stored: string) {
  const [, salt, hash] = stored.split('$');
  if (!salt || !hash) return false;
  return safeEqual(passwordHash(password, salt), stored);
}
export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a),
    y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export function instanceFlag(
  secret: string,
  principal: string,
  challenge: string,
) {
  return `CTF{${createHmac('sha256', secret).update(`${principal}:${challenge}`).digest('hex').slice(0, 32)}}`;
}
export function principal(user: any) {
  return user.team_id ? 'team:' + user.team_id : 'user:' + user.id;
}
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function check(ok: any, status: number, message: string): asserts ok {
  if (!ok) throw new ApiError(status, message);
}
