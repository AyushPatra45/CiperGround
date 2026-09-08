import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
  index,
} from 'drizzle-orm/sqlite-core';
export const users = sqliteTable('users', {
  id: text().primaryKey(),
  email: text().notNull().unique(),
  name: text().notNull().unique(),
  password: text().notNull(),
  role: text().notNull().default('player'),
  teamId: text('team_id'),
  created: integer().notNull(),
});
export const sessions = sqliteTable(
  'sessions',
  {
    id: text().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expires: integer().notNull(),
  },
  (t) => [index('session_expiry').on(t.expires)],
);
export const teams = sqliteTable('teams', {
  id: text().primaryKey(),
  name: text().notNull().unique(),
  ownerId: text('owner_id')
    .notNull()
    .references(() => users.id),
  inviteHash: text('invite_hash').notNull().unique(),
  created: integer().notNull(),
});
export const challenges = sqliteTable('challenges', {
  id: text().primaryKey(),
  title: text().notNull(),
  category: text().notNull(),
  difficulty: text().notNull(),
  points: integer().notNull(),
  summary: text().notNull(),
  description: text().notNull(),
  tags: text().notNull(),
  artifact: text().notNull().default(''),
  environment: text(),
  prerequisite: text(),
  featured: integer().notNull().default(0),
  flagHash: text('flag_hash').notNull(),
  hint: text().notNull(),
  hintCost: integer('hint_cost').notNull(),
  published: integer().notNull().default(1),
  authorId: text('author_id'),
});
export const solves = sqliteTable(
  'solves',
  {
    id: text().primaryKey(),
    principal: text().notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    challengeId: text('challenge_id')
      .notNull()
      .references(() => challenges.id),
    points: integer().notNull(),
    created: integer().notNull(),
  },
  (t) => [
    uniqueIndex('one_solve_per_principal').on(t.principal, t.challengeId),
    index('solves_challenge').on(t.challengeId),
  ],
);
export const unlocks = sqliteTable(
  'unlocks',
  {
    id: text().primaryKey(),
    principal: text().notNull(),
    challengeId: text('challenge_id')
      .notNull()
      .references(() => challenges.id),
    cost: integer().notNull(),
    created: integer().notNull(),
  },
  (t) => [
    uniqueIndex('one_unlock_per_principal').on(t.principal, t.challengeId),
  ],
);
export const submissions = sqliteTable(
  'submissions',
  {
    id: text().primaryKey(),
    principal: text().notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    challengeId: text('challenge_id')
      .notNull()
      .references(() => challenges.id),
    correct: integer().notNull(),
    created: integer().notNull(),
  },
  (t) => [index('submissions_principal_time').on(t.principal, t.created)],
);
export const limits = sqliteTable('limits', {
  key: text().primaryKey(),
  count: integer().notNull(),
  expires: integer().notNull(),
});
export const audit = sqliteTable(
  'audit',
  {
    id: text().primaryKey(),
    userId: text('user_id'),
    event: text().notNull(),
    target: text(),
    created: integer().notNull(),
  },
  (t) => [index('audit_time').on(t.created)],
);
