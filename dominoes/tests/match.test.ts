import { describe, expect, it } from "vitest";
import { Match, nextStarter, seededRng } from "../src/engine";

/** Bütün gedişləri avtomatik edərək tam oyunu 101-ə qədər oynayır. */
function simulate(seed: number): Match {
  const match = new Match(seededRng(seed));
  while (match.winner === null) {
    const round = match.startRound();
    while (!round.isOver) match.autoAct(round.turn);
  }
  return match;
}

describe("tam oyun simulyasiyası", () => {
  it("100 oyun 101-ə qədər problemsiz başa çatır", () => {
    for (let seed = 1; seed <= 100; seed++) {
      const m = simulate(seed);
      expect(Math.max(...m.score.scores)).toBeGreaterThanOrEqual(101);
      expect(m.score.scores[m.winner!]).toBeGreaterThanOrEqual(101);

      for (const [i, rec] of m.history.entries()) {
        // Xallar itmir: masadakı + əllərdə qalan xallar = 168 (tam dəst).
        const onBoard = rec.log.reduce((sum, e) => (e.type === "play" ? sum + e.tile.a + e.tile.b : sum), 0);
        expect(onBoard + rec.result.teamPips[0] + rec.result.teamPips[1]).toBe(168);
        // Növbəti raundu doğru oyunçu başlayır.
        const next = m.history[i + 1];
        if (next) expect(next.starter).toBe(nextStarter(rec.result));
      }
      // İlk raund 1-1 ilə açılır.
      expect(m.history[0]!.log[0]).toMatchObject({ type: "play", tile: { a: 1, b: 1 } });
    }
  });
});
