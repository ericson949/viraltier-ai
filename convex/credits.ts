import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { requireUser } from './lib/auth';
import { CREDIT_COSTS } from '@viraltier/types';

// ── Get credit balance for authenticated user ─────────────────────────────
export const getBalance = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const credit = await ctx.db
      .query('credits')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();

    return credit?.balance ?? 0;
  },
});

// ── Get transaction history ───────────────────────────────────────────────
export const getTransactions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    return ctx.db
      .query('creditTransactions')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .take(50);
  },
});

// ── Initialize credits on first sign-up ──────────────────────────────────
export const initCredits = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);

    const existing = await ctx.db
      .query('credits')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();

    if (existing) return existing.balance; // already initialized

    await ctx.db.insert('credits', {
      userId,
      balance: CREDIT_COSTS.SIGNUP_BONUS,
      updatedAt: Date.now(),
    });

    await ctx.db.insert('creditTransactions', {
      userId,
      amount: CREDIT_COSTS.SIGNUP_BONUS,
      reason: 'Welcome bonus',
    });

    return CREDIT_COSTS.SIGNUP_BONUS;
  },
});

// ── Debit credits (used internally by AI actions) ─────────────────────────
export const debit = mutation({
  args: {
    amount: v.number(),
    reason: v.string(),
    projectId: v.optional(v.id('projects')),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);

    const credit = await ctx.db
      .query('credits')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();

    if (!credit) throw new Error('Credit account not found');
    if (credit.balance < args.amount) {
      throw new Error(`Insufficient credits. Need ${args.amount}, have ${credit.balance}`);
    }

    const newBalance = credit.balance - args.amount;
    await ctx.db.patch(credit._id, {
      balance: newBalance,
      updatedAt: Date.now(),
    });

    await ctx.db.insert('creditTransactions', {
      userId,
      amount: -args.amount,
      reason: args.reason,
      projectId: args.projectId,
    });

    return newBalance;
  },
});

// ── Check if user has enough credits ──────────────────────────────────────
export const checkBalance = query({
  args: { required: v.number() },
  handler: async (ctx, { required }) => {
    const userId = await requireUser(ctx);
    const credit = await ctx.db
      .query('credits')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();

    const balance = credit?.balance ?? 0;
    return { balance, sufficient: balance >= required };
  },
});
