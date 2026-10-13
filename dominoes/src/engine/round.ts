import { pickRandom, type Rng } from "./random";
import { handPips, hasNumber, isDouble, sameTile, tile, type Tile } from "./tiles";

/** Yerlər 0..3, saat əqrəbi istiqamətində. 0 və 2 — komanda 0; 1 və 3 — komanda 1. */
export type Seat = 0 | 1 | 2 | 3;
export type Team = 0 | 1;
export type End = "left" | "right";

export const SEATS: readonly Seat[] = [0, 1, 2, 3];
export const OPENING_TILE = tile(1, 1);

export function teamOf(seat: Seat): Team {
  return (seat % 2) as Team;
}

export function nextSeat(seat: Seat): Seat {
  return ((seat + 1) % 4) as Seat;
}

export interface Move {
  tile: Tile;
  end: End;
}

/** Masadakı daş, istiqamətlənmiş: `left` sol qonşuya, `right` sağ qonşuya baxan tərəfdir. */
export interface PlacedTile {
  tile: Tile;
  seat: Seat;
  left: number;
  right: number;
}

export type RoundEvent =
  | { type: "play"; seat: Seat; tile: Tile; end: End; auto: boolean }
  | { type: "pass"; seat: Seat; auto: boolean };

export type RoundResult =
  | {
      kind: "domino";
      /** Bütün daşlarını qoyan oyunçu — növbəti raundu o başlayır. */
      winnerSeat: Seat;
      winnerTeam: Team;
      /** Rəqib komandanın əlində qalan xallar. */
      points: number;
      teamPips: [number, number];
    }
  | {
      kind: "blocked";
      /** Sonuncu adi (qoşa olmayan) daşı qoyan oyunçu — növbəti raundu o başlayır. */
      blockerSeat: Seat;
      /** Bərabərlikdə null. */
      winnerTeam: Team | null;
      /** Qalibə: uduzan komandanın xalları. Bərabərlikdə: hər iki komandanın cəmi (saxlanılır). */
      points: number;
      teamPips: [number, number];
    };

export function nextStarter(result: RoundResult): Seat {
  return result.kind === "domino" ? result.winnerSeat : result.blockerSeat;
}

export class Round {
  readonly hands: Tile[][];
  readonly board: PlacedTile[] = [];
  readonly log: RoundEvent[] = [];
  turn: Seat;
  result: RoundResult | null = null;

  private readonly openingTile: Tile | null;
  private lastNonDoubleSeat: Seat | null = null;
  private lastPlaySeat: Seat | null = null;

  constructor(hands: Tile[][], starter: Seat, openingTile: Tile | null = null) {
    this.hands = hands.map((h) => [...h]);
    this.turn = starter;
    this.openingTile = openingTile;
  }

  /** İlk raund: 1-1 olan oyunçu başlayır və 1-1 ilə açır. */
  static first(hands: Tile[][]): Round {
    const starter = SEATS.find((s) => hands[s]!.some((t) => sameTile(t, OPENING_TILE)));
    if (starter === undefined) throw new Error("Heç kimdə 1-1 yoxdur");
    return new Round(hands, starter, OPENING_TILE);
  }

  get ends(): { left: number; right: number } | null {
    const first = this.board[0];
    const last = this.board[this.board.length - 1];
    return first && last ? { left: first.left, right: last.right } : null;
  }

  get isOver(): boolean {
    return this.result !== null;
  }

  legalMoves(seat: Seat): Move[] {
    const hand = this.hands[seat]!;
    const ends = this.ends;
    if (!ends) {
      const options = this.openingTile ? hand.filter((t) => sameTile(t, this.openingTile!)) : hand;
      return options.map((t) => ({ tile: t, end: "right" }));
    }
    const moves: Move[] = [];
    for (const t of hand) {
      if (hasNumber(t, ends.left)) moves.push({ tile: t, end: "left" });
      // Hər iki uc eyni rəqəmdirsə, eyni gedişi iki dəfə vermirik.
      if (hasNumber(t, ends.right) && !(ends.left === ends.right)) moves.push({ tile: t, end: "right" });
    }
    return moves;
  }

  canPlay(seat: Seat): boolean {
    return this.legalMoves(seat).length > 0;
  }

  play(seat: Seat, move: Move, auto = false): void {
    this.assertTurn(seat);
    const legal = this.legalMoves(seat).some((m) => sameTile(m.tile, move.tile) && m.end === move.end);
    if (!legal) throw new Error(`Qeyri-qanuni gediş: ${move.tile.a}-${move.tile.b} (${move.end})`);

    const hand = this.hands[seat]!;
    hand.splice(hand.findIndex((t) => sameTile(t, move.tile)), 1);
    this.place(seat, move);
    this.log.push({ type: "play", seat, tile: move.tile, end: move.end, auto });
    this.lastPlaySeat = seat;
    if (!isDouble(move.tile)) this.lastNonDoubleSeat = seat;

    if (hand.length === 0) {
      this.result = this.dominoResult(seat);
    } else if (!SEATS.some((s) => this.canPlay(s))) {
      this.result = this.blockedResult();
    } else {
      this.turn = nextSeat(seat);
    }
  }

  pass(seat: Seat, auto = false): void {
    this.assertTurn(seat);
    if (this.canPlay(seat)) throw new Error("Uyğun daşı olan oyunçu pas keçə bilməz");
    this.log.push({ type: "pass", seat, auto });
    this.turn = nextSeat(seat);
  }

  /** Vaxt bitəndə: təsadüfi uyğun daş qoyur, uyğun daş yoxdursa pas keçir. */
  autoAct(seat: Seat, rng: Rng): RoundEvent {
    const moves = this.legalMoves(seat);
    if (moves.length === 0) this.pass(seat, true);
    else this.play(seat, pickRandom(moves, rng), true);
    return this.log[this.log.length - 1]!;
  }

  teamPips(): [number, number] {
    return [0, 1].map((team) =>
      SEATS.filter((s) => teamOf(s) === team).reduce<number>((sum, s) => sum + handPips(this.hands[s]!), 0),
    ) as [number, number];
  }

  private assertTurn(seat: Seat): void {
    if (this.result) throw new Error("Raund artıq bitib");
    if (seat !== this.turn) throw new Error(`Növbə ${this.turn} nömrəli oyunçudadır`);
  }

  private place(seat: Seat, { tile: t, end }: Move): void {
    const ends = this.ends;
    if (!ends) {
      this.board.push({ tile: t, seat, left: t.a, right: t.b });
    } else if (end === "left") {
      const other = t.a === ends.left ? t.b : t.a;
      this.board.unshift({ tile: t, seat, left: other, right: ends.left });
    } else {
      const other = t.a === ends.right ? t.b : t.a;
      this.board.push({ tile: t, seat, left: ends.right, right: other });
    }
  }

  private dominoResult(seat: Seat): RoundResult {
    const teamPips = this.teamPips();
    const winnerTeam = teamOf(seat);
    return { kind: "domino", winnerSeat: seat, winnerTeam, points: teamPips[1 - winnerTeam]!, teamPips };
  }

  private blockedResult(): RoundResult {
    const teamPips = this.teamPips();
    const [a, b] = teamPips;
    // Qoşa ilə bağ yoxdur: bağlayan sonuncu adi daşı qoyandır.
    const blockerSeat = this.lastNonDoubleSeat ?? this.lastPlaySeat!;
    if (a === b) return { kind: "blocked", blockerSeat, winnerTeam: null, points: a + b, teamPips };
    const winnerTeam: Team = a < b ? 0 : 1;
    return { kind: "blocked", blockerSeat, winnerTeam, points: Math.max(a, b), teamPips };
  }
}
