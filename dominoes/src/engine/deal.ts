import { cryptoRng, shuffle, type Rng } from "./random";
import { fullSet, hasNumber, isDouble, MAX_PIP, type Tile } from "./tiles";

export const PLAYERS = 4;
export const HAND_SIZE = 7;

/**
 * Qayda 3.1 — əl yenidən qarışdırma tələb edirmi?
 *  a) eyni rəqəmdən 6+ daş (qoşa daxil)
 *  b) eyni rəqəmdən qoşasız 5+ daş
 *  c) 5+ qoşa
 */
export function needsRedeal(hand: readonly Tile[]): boolean {
  if (hand.filter(isDouble).length >= 5) return true;
  for (let n = 0; n <= MAX_PIP; n++) {
    const withN = hand.filter((t) => hasNumber(t, n));
    if (withN.length >= 6) return true;
    if (withN.filter((t) => !isDouble(t)).length >= 5) return true;
  }
  return false;
}

export interface Deal {
  hands: Tile[][];
  /** Neçə dəfə yenidən qarışdırıldı (statistika üçün). */
  redeals: number;
}

export function dealHands(rng: Rng = cryptoRng): Deal {
  for (let redeals = 0; ; redeals++) {
    const deck = shuffle(fullSet(), rng);
    const hands = Array.from({ length: PLAYERS }, (_, i) =>
      deck.slice(i * HAND_SIZE, (i + 1) * HAND_SIZE),
    );
    if (!hands.some(needsRedeal)) return { hands, redeals };
  }
}
