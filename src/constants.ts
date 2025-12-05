

export const SUITS: ('H' | 'D' | 'C' | 'S')[] = ['H', 'D', 'C', 'S'];
export const RANKS: number[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

export const JOKER_SCORE = 25;
export const FACE_CARD_SCORE = 10;
export const ACE_SCORE = 11; // Ace is usually 11 unless special case

// Game Config
export const INITIAL_HAND_SIZE = 10;
export const TOTAL_DECKS = 2;
export const JOKERS_PER_DECK = 1; // Actually usually 2 total in 106 cards
export const TOTAL_JOKERS = 2;
export const DEFAULT_MAX_ROUNDS = 9;
export const DEFAULT_TURN_TIME = 30; // Seconds per phase (Default)

// Scoring & Betting Defaults
export const SCORE_LIMIT = 100;
export const DEFAULT_INITIAL_CHIPS = 100;
export const DEFAULT_ROUND_COST = 20;
export const DEFAULT_REENTRY_COST = 10;
export const JOKER_DISCARD_PENALTY = 20;

// Indices for players (Counter-Clockwise)
// 0: Human (Bottom)
// 1: Right Bot
// 2: Top Bot
// 3: Left Bot
// BUT wait, Counter-Clockwise flow means turn order is: 0 -> 3 -> 2 -> 1 -> 0
export const NEXT_TURN_OFFSET = 3; // +3 mod 4 is equivalent to -1 mod 4