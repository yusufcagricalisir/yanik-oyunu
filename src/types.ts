

export type Suit = 'H' | 'D' | 'C' | 'S' | 'Joker';
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 0; // 11=J, 12=Q, 13=K, 14=A, 0=Joker

export interface CardData {
  id: string;
  suit: Suit;
  rank: Rank;
  isJoker: boolean;
}

export interface Meld {
  id: string;
  cards: CardData[];
  type: 'run' | 'set' | 'pair';
  playerId: number;
}

export interface Player {
  id: number;
  name: string;
  hand: CardData[];
  score: number; // Current round score (penalty)
  totalScore: number; // Accumulated score across rounds
  chips: number; // Current money/chips
  isBot: boolean;
  hasOpened: boolean;
  justOpened?: boolean; // True only during the turn the player opens (to enforce discard limit)
  openingType?: 'series' | 'pairs'; // Track if player opened with Series or Pairs
  isEliminated: boolean; // "Yandı" status (Score > 100)
  isBankrupt: boolean; // "Battı" status (Chips < 0, permanent elimination)
}

export enum GamePhase {
  DRAW = 'DRAW',
  ACTION = 'ACTION', // Melding or discarding
  DISCARD = 'DISCARD',
  GAME_OVER = 'GAME_OVER',
  ROUND_OVER = 'ROUND_OVER'
}

export interface GameState {
  deck: CardData[];
  discardPile: CardData[];
  players: Player[];
  currentPlayerIndex: number; // 0 is Human
  openedMelds: Meld[];
  phase: GamePhase;
  round: number;
  maxRounds: number; // Configurable max rounds
  winner: number | null;
  message: string;
  
  // Betting State
  roundPot: number; // Collected bets for the current round (goes to round winner)
  grandPot: number; // Accumulated penalties (goes to game winner)
  scoreLimit: number; // Usually 100
  roundStarterIndex: number; // Index of the player who starts the round (rotates each round)
}