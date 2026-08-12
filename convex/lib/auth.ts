/**
 * Helper: get the authenticated user ID or throw.
 * Used in every query/mutation to enforce auth.
 */
import { QueryCtx, MutationCtx } from '../_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';

export async function requireUser(ctx: QueryCtx | MutationCtx): Promise<string> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error('Unauthorized: you must be logged in');
  }
  return userId;
}
