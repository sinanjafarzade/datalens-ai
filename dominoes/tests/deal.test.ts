import { describe, expect, it } from "vitest";
import { dealHands, fullSet, needsRedeal, seededRng, tile, tileId } from "../src/engine";

const t = (s: string) => {
  const [a, b] = s.split("-").map(Number);
  return tile(a!, b!);
};
const hand = (...ids: string[]) => ids.map(t);

describe("dəst", () => {
  it("28 daş, 7 qoşa, cəmi 168 xal", () => {
    const set = fullSet();
    expect(set).toHaveLength(28);
    expect(new Set(set.map(tileId)).size).toBe(28);
    expect(set.filter((x) => x.a === x.b)).toHaveLength(7);
    expect(set.reduce((s, x) => s + x.a + x.b, 0)).toBe(168);
  });
});

describe("yenidən qarışdırma (qayda 3.1)", () => {
  it("qoşa + 4 adi beşlik → qarışdırılmır", () => {
    expect(needsRedeal(hand("5-5", "5-1", "5-2", "5-3", "5-4", "0-1", "2-3"))).toBe(false);
  });

  it("qoşasız 5 beşlik → qarışdırılır", () => {
    expect(needsRedeal(hand("5-0", "5-1", "5-2", "5-3", "5-4", "0-1", "2-3"))).toBe(true);
  });

  it("qoşa daxil 6 beşlik → qarışdırılır", () => {
    expect(needsRedeal(hand("5-5", "5-0", "5-1", "5-2", "5-3", "5-4", "0-1"))).toBe(true);
  });

  it("5 qoşa → qarışdırılır, 4 qoşa → yox", () => {
    expect(needsRedeal(hand("0-0", "1-1", "3-3", "4-4", "6-6", "0-1", "2-3"))).toBe(true);
    expect(needsRedeal(hand("0-0", "1-1", "3-3", "4-4", "0-1", "2-3", "5-6"))).toBe(false);
  });

  it("paylama: 4 × 7 daş, hamısı fərqli, heç bir əl qaydanı pozmur", () => {
    const rng = seededRng(42);
    for (let i = 0; i < 500; i++) {
      const { hands } = dealHands(rng);
      expect(hands.map((h) => h.length)).toEqual([7, 7, 7, 7]);
      expect(new Set(hands.flat().map(tileId)).size).toBe(28);
      expect(hands.some(needsRedeal)).toBe(false);
    }
  });

  it("yenidən qarışdırma tezliyi təxminən 4.8%", () => {
    const rng = seededRng(7);
    const n = 5000;
    let redealt = 0;
    for (let i = 0; i < n; i++) if (dealHands(rng).redeals > 0) redealt++;
    // Gözlənilən ehtimal p≈0.048 (hesablanmış). Hər paylama ən azı 1 dəfə qarışma ehtimalı.
    expect(redealt / n).toBeGreaterThan(0.035);
    expect(redealt / n).toBeLessThan(0.062);
  });
});
