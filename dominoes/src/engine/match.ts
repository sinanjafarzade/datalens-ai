import { dealHands } from "./deal";
import { cryptoRng, type Rng } from "./random";
import { nextStarter, Round, type Move, type RoundEvent, type RoundResult, type Seat, type Team } from "./round";
import { applyRoundResult, initialScore, matchWinner, type ScoreState } from "./scoring";

/** Hər raundun qeydi — sonradan statistika üçün. */
export interface RoundRecord {
  number: number;
  starter: Seat;
  redeals: number;
  result: RoundResult;
  scoreAfter: ScoreState;
  log: RoundEvent[];
}

/** 101-ə qədər oyun: raundları ardıcıl idarə edir. */
export class Match {
  score: ScoreState = initialScore();
  round: Round | null = null;
  winner: Team | null = null;
  readonly history: RoundRecord[] = [];

  private roundStarter: Seat | null = null;
  private roundRedeals = 0;

  constructor(private readonly rng: Rng = cryptoRng) {}

  startRound(): Round {
    if (this.winner !== null) throw new Error("Oyun artıq bitib");
    if (this.round && !this.round.isOver) throw new Error("Raund hələ davam edir");

    const { hands, redeals } = dealHands(this.rng);
    const last = this.history[this.history.length - 1];
    this.round = last ? new Round(hands, nextStarter(last.result)) : Round.first(hands);
    this.roundStarter = this.round.turn;
    this.roundRedeals = redeals;
    return this.round;
  }

  play(seat: Seat, move: Move): void {
    this.activeRound().play(seat, move);
    this.afterAction();
  }

  pass(seat: Seat): void {
    this.activeRound().pass(seat);
    this.afterAction();
  }

  autoAct(seat: Seat): RoundEvent {
    const event = this.activeRound().autoAct(seat, this.rng);
    this.afterAction();
    return event;
  }

  private activeRound(): Round {
    if (!this.round || this.round.isOver) throw new Error("Aktiv raund yoxdur");
    return this.round;
  }

  private afterAction(): void {
    const round = this.round!;
    if (!round.result) return;
    this.score = applyRoundResult(this.score, round.result);
    this.history.push({
      number: this.history.length + 1,
      starter: this.roundStarter!,
      redeals: this.roundRedeals,
      result: round.result,
      scoreAfter: this.score,
      log: round.log,
    });
    this.winner = matchWinner(this.score);
  }
}
