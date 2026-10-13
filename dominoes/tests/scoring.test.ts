import { describe, expect, it } from "vitest";
import { applyRoundResult, initialScore, matchWinner, type RoundResult, type ScoreState, type Team } from "../src/engine";

const win = (team: Team, points: number): RoundResult => ({
  kind: "domino",
  winnerSeat: team,
  winnerTeam: team,
  points,
  teamPips: [0, 0],
});
const tie = (each: number): RoundResult => ({
  kind: "blocked",
  blockerSeat: 0,
  winnerTeam: null,
  points: each * 2,
  teamPips: [each, each],
});
const run = (...results: RoundResult[]): ScoreState => results.reduce(applyRoundResult, initialScore());

describe("xal (qayda 8)", () => {
  it("hesab 0-dan yuxarıdırsa, kiçik xal da birbaşa yazılır", () => {
    expect(run(win(0, 20), win(0, 5)).scores).toEqual([25, 0]);
  });
});

describe("13 qaydası (qayda 8.1)", () => {
  it("11 + 6 + 7 = 24 yaddaşda qalır, 20-lik qələbə ilə hamısı yazılır (44)", () => {
    const afterSmall = run(win(0, 11), win(0, 6), win(0, 7));
    expect(afterSmall).toEqual({ scores: [0, 0], pending: [24, 0], carry: 0 });
    expect(applyRoundResult(afterSmall, win(0, 20)).scores).toEqual([44, 0]);
  });

  it("uduzanda yaddaş silinir", () => {
    expect(run(win(0, 11), win(1, 20))).toEqual({ scores: [0, 20], pending: [0, 0], carry: 0 });
  });

  it("dəqiq 13 yazılır", () => {
    expect(run(win(0, 13)).scores).toEqual([13, 0]);
    expect(run(win(0, 12)).scores).toEqual([0, 0]);
  });

  it("rəqibin kiçik qələbəsi rəqibin özünə də 13 qaydası ilə tətbiq olunur", () => {
    expect(run(win(0, 30), win(1, 5))).toEqual({ scores: [30, 0], pending: [0, 5], carry: 0 });
  });
});

describe("bağlı bərabər (qayda 7)", () => {
  it("21–21 → 42 saxlanılır, növbəti qalib 5 + 42 = 47 alır", () => {
    const afterTie = run(tie(21));
    expect(afterTie).toEqual({ scores: [0, 0], pending: [0, 0], carry: 42 });
    expect(applyRoundResult(afterTie, win(1, 5))).toEqual({ scores: [0, 47], pending: [0, 0], carry: 0 });
  });

  it("bərabərlikdə yaddaş qalır, sonra hamısı cəmlənir: 18 + 42 + 11 = 71", () => {
    const s = run(win(0, 11), tie(21));
    expect(s.pending).toEqual([11, 0]);
    expect(applyRoundResult(s, win(0, 18)).scores).toEqual([71, 0]);
  });

  it("ard-arda bərabərliklər toplanır", () => {
    expect(run(tie(10), tie(5), win(0, 3)).scores).toEqual([33, 0]);
  });
});

describe("oyunun qalibi (qayda 9)", () => {
  it("101-ə çatan udur", () => {
    expect(matchWinner(run(win(0, 100)))).toBeNull();
    expect(matchWinner(run(win(0, 100), win(0, 1)))).toBe(0);
  });
});
