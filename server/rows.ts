import type { users, teams, challenges } from '../db/schema';
export type UserRow = Omit<typeof users.$inferSelect, 'teamId'> & {
  team_id: string | null;
};
export type TeamRow = Omit<
  typeof teams.$inferSelect,
  'ownerId' | 'inviteHash'
> & { owner_id: string; invite_hash: string };
export type ChallengeRow = Omit<
  typeof challenges.$inferSelect,
  'flagHash' | 'hintCost' | 'authorId'
> & {
  flag_hash: string;
  hint_cost: number;
  author_id: string | null;
  solves?: number;
};
