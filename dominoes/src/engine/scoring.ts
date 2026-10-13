import type { RoundResult, Team } from "./round";

export const TARGET_SCORE = 101;
export const PENDING_THRESHOLD = 13;

export interface ScoreState {
  /** Hesaba yazılmış xallar. */
  scores: [number, number];
  /** "13 qaydası" — hesab 0 olanda 13-dən az qələbələr burada toplanır. */
  pending: [number, number];
  /** Bağlı bərabər bitəndə saxlanılan xallar — növbəti raundun qalibinə gedir. */
  carry: number;
}

export function initialScore(): ScoreState {
  return { scores: [0, 0], pending: [0, 0], carry: 0 };
}

/** Raundun nəticəsini hesaba tətbiq edir (qayda 7–8). Yeni vəziyyət qaytarır. */
export function applyRoundResult(prev: ScoreState, result: RoundResult): ScoreState {
  const next: ScoreState = {
    scores: [...prev.scores],
    pending: [...prev.pending],
    carry: prev.carry,
  };

  const winner = result.winnerTeam;
  if (winner === null) {
    // Bağlı bərabər: heç kimə yazılmır, yaddaş qalır.
    next.carry += result.points;
    return next;
  }

  const loser = (1 - winner) as Team;
  const gain = result.points + next.carry;
  next.carry = 0;
  next.pending[loser] = 0;

  if (next.scores[winner] === 0 && gain < PENDING_THRESHOLD) {
    next.pending[winner] += gain;
  } else {
    next.scores[winner] += gain + next.pending[winner];
    next.pending[winner] = 0;
  }
  return next;
}

export function matchWinner(state: ScoreState): Team | null {
  if (state.scores[0] >= TARGET_SCORE) return 0;
  if (state.scores[1] >= TARGET_SCORE) return 1;
  return null;
}
