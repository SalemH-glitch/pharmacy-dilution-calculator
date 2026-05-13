import bcrypt from 'bcrypt';
import db, { nextId, nowIso } from '../database/db';
import { NewUser, SafeUser, User } from '../models/User';

function httpError(message: string, status: number): Error & { status: number } {
  const err = new Error(message) as Error & { status: number };
  err.status = status;
  return err;
}

const SALT_ROUNDS = 12;

export async function registerUser(data: NewUser): Promise<SafeUser> {
  const existing = db.data.users.find(
    u => u.username === data.username || u.email === data.email
  );
  if (existing) {
    throw httpError('Username or email already in use', 409);
  }

  const password_hash = await bcrypt.hash(data.password, SALT_ROUNDS);
  const id = nextId(db.data.users);
  const newUser: User = {
    id,
    username:      data.username,
    email:         data.email,
    password_hash,
    full_name:    data.full_name    ?? null,
    credentials:  data.credentials  ?? null,
    created_at:   nowIso(),
  };

  db.data.users.push(newUser);
  db.write();

  return getUserById(id);
}

export async function loginUser(username: string, password: string): Promise<SafeUser> {
  const user = db.data.users.find(u => u.username === username);
  if (!user) {
    throw httpError('Invalid username or password', 401);
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    throw httpError('Invalid username or password', 401);
  }

  return toSafeUser(user);
}

export function getUserById(id: number): SafeUser {
  const user = db.data.users.find(u => u.id === id);
  if (!user) {
    throw httpError('User not found', 404);
  }
  return toSafeUser(user);
}

function toSafeUser(user: User): SafeUser {
  return {
    id:          user.id,
    username:    user.username,
    email:       user.email,
    full_name:   user.full_name,
    credentials: user.credentials,
    created_at:  user.created_at,
  };
}
