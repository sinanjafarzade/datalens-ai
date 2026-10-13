import { describe, expect, it } from "vitest";
import { dealHands, nextStarter, Round, seededRng, tile, type Seat } from "../src/engine";

const t = (s: string) => {
  const [a, b] = s.split("-").map(Number);
  return tile(a!, b!);
};
const hands = (...seats: string[][]) => seats.map((h) => h.map(t));

describe("başlama (qayda 4)", () => {
  it("ilk raundu 1-1 olan başlayır və yalnız 1-1 qoya bilər", () => {
    const { hands: h } = dealHands(seededRng(1));
    const round = Round.first(h);
    expect(h[round.turn]!.some((x) => x.a === 1 && x.b === 1)).toBe(true);
    expect(round.legalMoves(round.turn)).toEqual([{ tile: t("1-1"), end: "right" }]);
  });

  it("növbəti raundlarda başlayan istənilən daşla aça bilər", () => {
    const round = new Round(hands(["2-3", "6-6"], ["0-1"], ["0-2"], ["0-3"]), 0);
    expect(round.legalMoves(0)).toHaveLength(2);
  });
});

describe("gediş (qayda 5)", () => {
  it("yalnız 2 ucuna, düzgün istiqamətdə qoyulur", () => {
    const r = new Round(hands(["2-3", "0-0"], ["3-5", "0-6"], ["4-2", "0-1"], ["6-6", "0-2"]), 0);
    r.play(0, { tile: t("2-3"), end: "right" });
    expect(r.ends).toEqual({ left: 2, right: 3 });
    r.play(1, { tile: t("3-5"), end: "right" });
    expect(r.ends).toEqual({ left: 2, right: 5 });
    r.play(2, { tile: t("2-4"), end: "left" });
    expect(r.ends).toEqual({ left: 4, right: 5 });
    expect(r.board.map((p) => [p.left, p.right])).toEqual([[4, 2], [2, 3], [3, 5]]);
  });

  it("qeyri-qanuni gediş və növbəsiz gediş rədd edilir", () => {
    const r = new Round(hands(["2-3", "0-0"], ["3-5", "0-6"], ["4-2", "0-1"], ["6-6", "0-2"]), 0);
    expect(() => r.play(1, { tile: t("3-5"), end: "right" })).toThrow();
    r.play(0, { tile: t("2-3"), end: "right" });
    expect(() => r.play(1, { tile: t("0-6"), end: "right" })).toThrow();
  });

  it("uyğun daşı olan pas keçə bilməz, olmayan keçə bilər", () => {
    const r = new Round(hands(["2-3", "0-0"], ["3-5", "0-6"], ["4-4", "0-1"], ["2-6", "0-2"]), 0);
    r.play(0, { tile: t("2-3"), end: "right" });
    expect(() => r.pass(1)).toThrow();
    r.play(1, { tile: t("3-5"), end: "right" });
    r.pass(2);
    expect(r.turn).toBe(3);
  });
});

describe("raundun bitməsi (qayda 7)", () => {
  it("domino: qalib komanda rəqiblərin xallarını alır (7 + 11 = 18)", () => {
    const r = new Round(hands(["1-2"], ["3-4"], ["5-6", "0-0"], ["4-5", "0-2"]), 0);
    r.play(0, { tile: t("1-2"), end: "right" });
    expect(r.result).toMatchObject({ kind: "domino", winnerSeat: 0, winnerTeam: 0, points: 7 + 11 });
    expect(nextStarter(r.result!)).toBe(0);
  });

  // 0: 2-3 qoyur, 1: 3-3, 2: pas, 3: 2-2 → uclar 2 və 3, heç kim oynaya bilmir.
  const blockedHands = (seat3Extra: string) =>
    hands(["2-3", "6-6"], ["3-3", "5-5"], ["4-4", "0-0"], ["2-2", seat3Extra]);

  function playToBlock(r: Round) {
    r.play(0, { tile: t("2-3"), end: "right" });
    r.play(1, { tile: t("3-3"), end: "right" });
    r.pass(2);
    r.play(3, { tile: t("2-2"), end: "left" });
  }

  it("bağlı: az xallı komanda udur, bağlayan qoşa ilə dəyişmir", () => {
    const r = new Round(blockedHands("1-1"), 0);
    playToBlock(r);
    // Komanda 0: 6-6 + 4-4 + 0-0 = 20; komanda 1: 5-5 + 1-1 = 12
    expect(r.result).toMatchObject({ kind: "blocked", winnerTeam: 1, points: 20, teamPips: [20, 12] });
    // Sonra 3-3 və 2-2 qoşaları qoyuldu, amma bağlayan 0-dır.
    expect(nextStarter(r.result!)).toBe(0 as Seat);
  });

  it("bağlı bərabər: qalib yoxdur, hər iki komandanın xalı saxlanılır", () => {
    const r = new Round(blockedHands("4-6"), 0);
    playToBlock(r);
    expect(r.result).toMatchObject({ kind: "blocked", winnerTeam: null, points: 40, teamPips: [20, 20] });
    expect(nextStarter(r.result!)).toBe(0 as Seat);
  });
});

describe("avto-gediş (qayda 6)", () => {
  it("uyğun daş varsa təsadüfi uyğun daş qoyur", () => {
    const r = new Round(hands(["2-3", "0-0"], ["3-5", "3-6", "1-1"], ["4-4"], ["0-2"]), 0);
    r.play(0, { tile: t("2-3"), end: "right" });
    const e = r.autoAct(1, seededRng(3));
    expect(e).toMatchObject({ type: "play", seat: 1, auto: true });
    expect(r.hands[1]!.some((x) => x.a === 1 && x.b === 1)).toBe(true);
  });

  it("uyğun daş yoxdursa pas keçir", () => {
    const r = new Round(hands(["2-3", "0-0"], ["1-1", "4-4"], ["2-5"], ["0-2"]), 0);
    r.play(0, { tile: t("2-3"), end: "right" });
    expect(r.autoAct(1, seededRng(3))).toMatchObject({ type: "pass", seat: 1, auto: true });
  });
});
