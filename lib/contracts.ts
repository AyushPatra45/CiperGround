import type { Challenge } from './catalog';
export type Player = { id: string; name: string; email: string; role: string };
export type TeamRecord = { id: string; name: string; owner_id: string };
export type Solve = { challenge_id: string; points: number; created: number };
export type HintUnlock = { challenge_id: string; cost: number };
export type ArenaState = {
  user: Player | null;
  team: TeamRecord | null;
  challenges: Challenge[];
  solved: Solve[];
  hints: HintUnlock[];
  points: number;
  runnerAvailable: boolean;
};
export type LeaderboardRow = {
  principal: string;
  name: string;
  type: string;
  solves: number;
  points: number;
  last_solve: number;
};
export type SubmissionRow = {
  id: string;
  correct: number;
  created: number;
  title: string;
  category: string;
  name: string;
};
export type TeamData = {
  team: TeamRecord | null;
  members: Pick<Player, 'id' | 'name' | 'role'>[];
};
export type AuditData = {
  rows: {
    event: string;
    target: string | null;
    created: number;
    name: string | null;
  }[];
  metrics: Record<string, number>;
};
export type FlagResult = {
  correct: boolean;
  alreadySolved: boolean;
  message: string;
};
export type InstanceResult = { url: string; expires: number };
export type HintResult = { hint: string; cost: number };
export type ArenaProps = {
  state: ArenaState;
  refresh: () => Promise<void>;
  signIn: () => void;
};
