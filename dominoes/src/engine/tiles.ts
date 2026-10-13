/** Domino daşı. Həmişə a <= b. */
export interface Tile {
  readonly a: number;
  readonly b: number;
}

export const MAX_PIP = 6;

export function tile(a: number, b: number): Tile {
  return a <= b ? { a, b } : { a: b, b: a };
}

/** "3-5" formatında açar — daşları müqayisə etmək və serializasiya üçün. */
export function tileId(t: Tile): string {
  return `${t.a}-${t.b}`;
}

export function sameTile(x: Tile, y: Tile): boolean {
  return x.a === y.a && x.b === y.b;
}

export function isDouble(t: Tile): boolean {
  return t.a === t.b;
}

export function pips(t: Tile): number {
  return t.a + t.b;
}

export function handPips(hand: readonly Tile[]): number {
  return hand.reduce((sum, t) => sum + pips(t), 0);
}

export function hasNumber(t: Tile, n: number): boolean {
  return t.a === n || t.b === n;
}

/** 28 daşlıq tam dəst (0-0 … 6-6). */
export function fullSet(): Tile[] {
  const set: Tile[] = [];
  for (let a = 0; a <= MAX_PIP; a++) {
    for (let b = a; b <= MAX_PIP; b++) set.push({ a, b });
  }
  return set;
}
