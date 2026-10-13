/** [0, 1) aralığında ədəd qaytaran təsadüfi generator. Testlərdə sabit (seed) generator ötürülür. */
export type Rng = () => number;

/** Kriptoqrafik təsadüfilik — Math.random-dan fərqli olaraq proqnozlaşdırıla bilmir. */
export const cryptoRng: Rng = () => {
  const buf = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buf);
  return buf[0]! / 2 ** 32;
};

/** Testlər üçün təkrarlana bilən generator (mulberry32). */
export function seededRng(seed: number): Rng {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32;
  };
}

export function randomInt(n: number, rng: Rng): number {
  return Math.floor(rng() * n);
}

export function pickRandom<T>(items: readonly T[], rng: Rng): T {
  if (items.length === 0) throw new Error("pickRandom: boş siyahı");
  return items[randomInt(items.length, rng)]!;
}

/** Fisher–Yates qarışdırma — hər düzülüş eyni ehtimallıdır. */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(i + 1, rng);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}
