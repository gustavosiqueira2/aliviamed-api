import { DatabaseError } from 'pg';

export function isDatabaseError(error: unknown): error is DatabaseError {
  if (typeof error !== 'object' || error === null) return false;

  const err = error as Record<string, unknown>;

  return typeof err.code === 'string';
}
