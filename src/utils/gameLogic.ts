
import { CardData, Meld, Player, Suit, Rank } from '../types';
import { SUITS, RANKS, TOTAL_JOKERS, JOKER_SCORE, FACE_CARD_SCORE, ACE_SCORE, SCORE_LIMIT } from '../constants';

// --- Deck Management ---

export const createDeck = (): CardData[] => {
  let deck: CardData[] = [];
  let idCounter = 0;

  // 2 Full Decks
  for (let d = 0; d < 2; d++) {
    SUITS.forEach(suit => {
      RANKS.forEach(rank => {
        deck.push({
          id: `card-d${d}-${suit}-${rank}-${idCounter++}`, // Unique ID allowing duplicate ranks/suits
          suit: suit as Suit,
          rank: rank as Rank,
          isJoker: false
        });
      });
    });
  }

  // 2 Jokers
  for (let j = 0; j < TOTAL_JOKERS; j++) {
    deck.push({
      id: `joker-${j}-${idCounter++}`,
      suit: 'Joker',
      rank: 0,
      isJoker: true
    });
  }

  return shuffle(deck);
};

export const shuffle = (array: CardData[]): CardData[] => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

export const dealCards = (deck: CardData[], numPlayers: number, handSize: number): { hands: CardData[][], remainingDeck: CardData[] } => {
  const hands: CardData[][] = Array.from({ length: numPlayers }, () => []);
  const currentDeck = [...deck];

  for (let i = 0; i < handSize; i++) {
    for (let p = 0; p < numPlayers; p++) {
      if (currentDeck.length > 0) {
        hands[p].push(currentDeck.pop()!);
      }
    }
  }
  return { hands, remainingDeck: currentDeck };
};

// --- Scoring ---

export const getCardScore = (card: CardData): number => {
  if (card.isJoker) return JOKER_SCORE;
  if (card.rank === 14) return ACE_SCORE; // Ace
  if (card.rank >= 10 && card.rank <= 13) return FACE_CARD_SCORE; // K, Q, J, 10
  return card.rank;
};

export const calculateHandScore = (hand: CardData[]): number => {
  return hand.reduce((acc, card) => acc + getCardScore(card), 0);
};

// Helper: Validate if a specific hand configuration satisfies the Score Limit (100)
// considering the special Ace exception.
export const validateScoreLimit = (currentTotalScore: number, remainingHand: CardData[]): boolean => {
    let penalty = 0;
    
    // Ace Exception: If Score is 99 and the ONLY card left is an Ace, it counts as 1.
    if (currentTotalScore === 99 && remainingHand.length === 1 && remainingHand[0].rank === 14) {
        penalty = 1;
    } else {
        penalty = calculateHandScore(remainingHand);
    }

    return (currentTotalScore + penalty) <= SCORE_LIMIT;
};

// Check if player can open based on Score Limit rule
export const canPlayerOpenHand = (
    player: Player, 
    remainingHandAfterMeld: CardData[], 
    openedMelds: Meld[]
): { allowed: boolean, reason?: string } => {
    
    // If the player has 0 or 1 card left after melding, they are effectively finishing.
    if (remainingHandAfterMeld.length <= 1) {
        return { allowed: true };
    }

    // We must simulate the DISCARD phase.
    // The player MUST discard 1 card.
    // However, they CANNOT discard a card that is "Playable" (Ishlek) unless ALL cards are playable.
    
    // 1. Identify valid discard candidates
    const playableCards = remainingHandAfterMeld.filter(c => isCardPlayable(c, openedMelds));
    let validDiscards = remainingHandAfterMeld.filter(c => !playableCards.includes(c));

    // Force Discard Rule: If all cards are playable, then ANY card is a valid discard.
    if (validDiscards.length === 0) {
        validDiscards = remainingHandAfterMeld;
    }

    // 2. Check if ANY valid discard results in a safe score
    let canSatisfyLimit = false;

    for (const discardCandidate of validDiscards) {
        const keptCards = remainingHandAfterMeld.filter(c => c.id !== discardCandidate.id);
        
        if (validateScoreLimit(player.totalScore, keptCards)) {
            canSatisfyLimit = true;
            break; 
        }
    }

    if (!canSatisfyLimit) {
        return { 
            allowed: false, 
            reason: `Cannot open: No valid discard leaves you ≤ ${SCORE_LIMIT} pts.` 
        };
    }

    return { allowed: true };
};

// --- Helper: Sort Hand ---
export const sortHand = (hand: CardData[], bySuit: boolean): CardData[] => {
    return [...hand].sort((a, b) => {
        if (a.isJoker && !b.isJoker) return 1;
        if (!a.isJoker && b.isJoker) return -1;
        if (a.isJoker && b.isJoker) return 0;

        if (bySuit) {
            if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
            return a.rank - b.rank;
        } else {
            if (a.rank !== b.rank) return a.rank - b.rank;
            return a.suit.localeCompare(b.suit);
        }
    });
};

// --- Organize Run Helper ---
export const organizeRun = (cards: CardData[]): CardData[] => {
  const jokers = cards.filter(c => c.isJoker);
  const regular = cards.filter(c => !c.isJoker).sort((a, b) => a.rank - b.rank);
  
  if (regular.length === 0) return jokers; 

  const result: CardData[] = [];
  
  for (let i = 0; i < regular.length - 1; i++) {
    result.push(regular[i]);
    const currentRank = regular[i].rank;
    const nextRank = regular[i+1].rank;
    const gap = nextRank - currentRank - 1;
    
    // Fill gap with jokers
    if (gap > 0) {
        for (let k = 0; k < gap; k++) {
            if (jokers.length > 0) result.push(jokers.pop()!);
        }
    }
  }
  // Push last regular
  result.push(regular[regular.length - 1]);

  // Use remaining jokers to extend END first, then START
  let lastRank = regular[regular.length - 1].rank;
  while (jokers.length > 0 && lastRank < 14) {
      result.push(jokers.pop()!);
      lastRank++;
  }
  
  let firstRank = regular[0].rank;
  while (jokers.length > 0 && firstRank > 2) {
      result.unshift(jokers.pop()!);
      firstRank--;
  }

  // Any leftover jokers? Append
  while(jokers.length > 0) {
      result.push(jokers.pop()!);
  }
  
  return result;
};


// --- Validation Logic ---

const sortForRun = (cards: CardData[]) => {
  return [...cards].sort((a, b) => {
    if (a.isJoker) return 1;
    if (b.isJoker) return -1;
    return a.rank - b.rank;
  });
};

export const isValidPair = (cards: CardData[]): boolean => {
    if (cards.length !== 2) return false;
    
    const c1 = cards[0];
    const c2 = cards[1];
    
    // Two jokers are a pair
    if (c1.isJoker && c2.isJoker) return true;
    
    // One joker matches anything
    if (c1.isJoker || c2.isJoker) return true;
    
    // Exact match: Same Rank AND Same Suit
    return c1.rank === c2.rank && c1.suit === c2.suit;
};

export const isValidMeld = (cards: CardData[]): { valid: boolean, type?: 'run' | 'set' | 'pair' } => {
  // Check Pair
  if (cards.length === 2) {
      return { valid: isValidPair(cards), type: 'pair' };
  }

  if (cards.length < 3) return { valid: false };

  const jokers = cards.filter(c => c.isJoker);
  const nonJokers = cards.filter(c => !c.isJoker);

  if (nonJokers.length === 0) return { valid: true, type: 'set' }; // All jokers can be a set

  // Check for Group (Set) - Distinct Suits OR Identical Cards (Merged Pairs)
  const firstRank = nonJokers[0].rank;
  const isRankMatch = nonJokers.every(c => c.rank === firstRank);
  
  if (isRankMatch) {
    if (cards.length > 4) return { valid: false }; 
    
    // Sub-Type A: Distinct Suits (Standard Set)
    const suits = new Set(nonJokers.map(c => c.suit));
    if (suits.size === nonJokers.length) {
         return { valid: true, type: 'set' }; 
    }

    // Sub-Type B: Merged Pairs (Identical Cards)
    // E.g. H7, H7, H7
    const firstSuit = nonJokers[0].suit;
    const isSuitMatch = nonJokers.every(c => c.suit === firstSuit);
    if (isSuitMatch) {
        // Valid only if we are treating this as "Processing onto a pair"
        // But fundamentally it's a valid grouping in the game engine context
        return { valid: true, type: 'set' }; // We call it a set for processing purposes
    }

    return { valid: false };
  }

  // Check for Run (Sequence)
  const firstSuit = nonJokers[0].suit;
  const sameSuit = nonJokers.every(c => c.suit === firstSuit);
  
  if (!sameSuit) return { valid: false };

  // Sort by rank to check gaps
  const sorted = sortForRun(nonJokers);
  
  // Check for Duplicates in Run (e.g. 5, 5, 6) - Invalid
  for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].rank === sorted[i+1].rank) return { valid: false };
  }
  
  let neededJokers = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    const gap = next.rank - current.rank - 1;
    neededJokers += gap;
  }
  
  if (neededJokers <= jokers.length) return { valid: true, type: 'run' };
  return { valid: false };
};

// --- Intelligent Helper: Check if card fits a meld ---
export const canProcessCard = (card: CardData, meld: Meld): { valid: boolean, newCards?: CardData[], reason?: string } => {
    
    // Pair Processing
    if (meld.type === 'pair') {
        const nonJokers = meld.cards.filter(c => !c.isJoker);
        if (nonJokers.length > 0) {
            const identity = nonJokers[0];
            // If card matches exactly (Suit + Rank)
            if (card.rank === identity.rank && card.suit === identity.suit) {
                 // Check if it becomes valid Set (Merged Pair)
                 const newCards = [...meld.cards, card];
                 // If total is <= 4, allow
                 if (newCards.length <= 4) {
                     return { valid: true, newCards: newCards }; 
                 }
            }
        }
        return { valid: false, reason: "Cannot add to Pair unless creating identical set" };
    }

    // Check Set Limit
    if (meld.type === 'set') {
        // Critical Fix: Only enforce Set limit if it actually LOOKS like a Set (same ranks).
        // If it was mislabeled as 'set' but is actually a run (different ranks), skip this check.
        const nonJokers = meld.cards.filter(c => !c.isJoker);
        const isRankConsistent = nonJokers.every(c => c.rank === nonJokers[0].rank);
        
        if (isRankConsistent) {
             if (meld.cards.length >= 4) return { valid: false, reason: "Set is full (Max 4)" };
             
             // Standard Set logic (different suits)
             const isStandardSet = nonJokers.length > 0 && 
                                   new Set(nonJokers.map(x => x.suit)).size === nonJokers.length;

             if (isStandardSet) {
                 if (meld.cards.some(c => c.suit === card.suit && !c.isJoker)) return { valid: false, reason: "Suit already in set" };
             }
        }
    }

    // Logic change: Just try to add it and see if isValidMeld accepts it.
    // This allows mislabeled Sets to be processed as Runs if they are valid Runs.
    const testCards = [...meld.cards, card];
    
    // Basic pre-check for Runs to avoid sorting overhead
    // Only apply if we are treating it as a Run or if the type is potentially wrong
    if (meld.type === 'run' || meld.type === 'set') { // Removed restrictive checks to rely on isValidMeld
        // let valid flow through
    }

    const check = isValidMeld(testCards);
    
    if (check.valid) {
         if (check.type === 'run') {
            return { valid: true, newCards: organizeRun(testCards) };
         } else {
            return { valid: true, newCards: testCards };
         }
    }
    
    return { valid: false, reason: "Doesn't fit pattern" };
};

// --- NEW Helper: Check if a Pair (2 cards) can be added to a Meld (Pair) ---
export const canProcessPair = (handPair: CardData[], meld: Meld): { valid: boolean, newCards?: CardData[], reason?: string } => {
    if (handPair.length !== 2) return { valid: false, reason: "Must select 2 cards" };
    
    if (meld.type !== 'pair') return { valid: false, reason: "Can only merge pairs into other pairs" };
    
    if (meld.cards.length + handPair.length > 4) return { valid: false, reason: "Max 4 cards allowed (Double Pair)" };

    // Combine
    const testCards = [...meld.cards, ...handPair];
    
    const check = isValidMeld(testCards);
    if (check.valid && check.type === 'set') {
        return { valid: true, newCards: testCards };
    }

    return { valid: false, reason: "Pairs do not match" };
};


export const isCardPlayable = (card: CardData, allOpenedMelds: Meld[]): boolean => {
    return allOpenedMelds.some(meld => {
        // 1. Can we swap a Joker? (Prioritize this check for Pairs)
        const canSwap = trySwapJoker([card], meld);
        if (canSwap.success) return true;

        // 2. Can we just add it?
        const canAdd = canProcessCard(card, meld);
        if (canAdd.valid) return true;

        return false;
    });
};

// --- Joker Retrieval Logic ---

const getJokerContext = (run: CardData[], jokerIndex: number): { rank: number, suit: Suit } | null => {
    const prevCard = run[jokerIndex - 1];
    const nextCard = run[jokerIndex + 1];

    if (prevCard && !prevCard.isJoker) {
        return { rank: prevCard.rank + 1, suit: prevCard.suit };
    }
    if (nextCard && !nextCard.isJoker) {
        return { rank: nextCard.rank - 1, suit: nextCard.suit };
    }
    
    const firstNonJokerIndex = run.findIndex(c => !c.isJoker);
    if (firstNonJokerIndex === -1) return null; 
    
    const anchor = run[firstNonJokerIndex];
    const diff = firstNonJokerIndex - jokerIndex;
    return { rank: anchor.rank - diff, suit: anchor.suit };
};

export const trySwapJoker = (
    handCards: CardData[], 
    meld: Meld
): { success: boolean, newMeldCards?: CardData[], retrievedJoker?: CardData, reason?: string } => {
    
    const jokersInMeld = meld.cards.filter(c => c.isJoker);
    if (jokersInMeld.length === 0) return { success: false, reason: "No Joker in meld" };
    
    // --- PAIR LOGIC ---
    if (meld.type === 'pair') {
        if (handCards.length !== 1) return { success: false, reason: "Select 1 card to swap." };
        const swapCard = handCards[0];
        const regular = meld.cards.filter(c => !c.isJoker);
        
        // Case: [Real, Joker] -> User has Real -> Swap -> [Real, Real] + Joker
        if (regular.length === 1 && jokersInMeld.length === 1) {
            const identity = regular[0];
            if (swapCard.suit === identity.suit && swapCard.rank === identity.rank) {
                return {
                    success: true,
                    newMeldCards: [identity, swapCard],
                    retrievedJoker: jokersInMeld[0]
                };
            }
            return { success: false, reason: "Card must match the pair exactly." };
        }
        // Case: [Joker, Joker] - Any card can swap?
        return { success: false, reason: "Cannot swap in this pair config." };
    }

    // --- RUN LOGIC ---
    if (meld.type === 'run') {
        if (handCards.length !== 1) return { success: false, reason: "Select exactly 1 card to swap in a run." };
        const swapCard = handCards[0];

        for (let i = 0; i < meld.cards.length; i++) {
            if (meld.cards[i].isJoker) {
                const identity = getJokerContext(meld.cards, i);
                
                if (identity && identity.rank === swapCard.rank && identity.suit === swapCard.suit) {
                    const newCards = [...meld.cards];
                    newCards[i] = swapCard; 
                    return { 
                        success: true, 
                        newMeldCards: newCards,
                        retrievedJoker: meld.cards[i]
                    };
                }
            }
        }
        return { success: false, reason: "Card does not match Joker's position." };
    } 
    
    // --- SET LOGIC ---
    else if (meld.type === 'set') {
        const nonJokers = meld.cards.filter(c => !c.isJoker);
        if (nonJokers.length === 0) return { success: false }; 
        
        const setRank = nonJokers[0].rank;
        
        if (handCards.some(c => c.rank !== setRank)) return { success: false, reason: "Cards must match set rank." };
        
        const existingSuits = new Set(nonJokers.map(c => c.suit));

        // Check for duplicates (cannot swap/add if suit already exists as a REAL card)
        if (handCards.some(c => existingSuits.has(c.suit))) {
             return { success: false, reason: "Suit already in set." };
        }
        
        // Ensure we have enough jokers to perform the swap (1 card -> 1 joker)
        if (jokersInMeld.length < handCards.length) {
             return { success: false, reason: "Not enough Jokers to swap." };
        }

        // SPECIAL RULE: To retrieve a Joker from a Set, the resulting Set must contain 4 Real Cards.
        // You cannot replace a Joker in a 3-card set to just leave 3 real cards.
        const totalRealCardsAfterAction = nonJokers.length + handCards.length;
        if (totalRealCardsAfterAction < 4) {
             return { success: false, reason: "Must complete the set (4 real cards) to retrieve Joker." };
        }
        
        // Perform Swap: Replace N jokers with N cards.
        const newRealCards = [...nonJokers, ...handCards];
        // Keep remaining jokers
        const keptJokers = jokersInMeld.slice(handCards.length);
        // The retrieved joker is the first one found
        const retrievedJoker = jokersInMeld[0]; 
        
        const newMeldCards = [...newRealCards, ...keptJokers];
        
        return {
             success: true,
             newMeldCards: newMeldCards,
             retrievedJoker: retrievedJoker
        };
    }

    return { success: false };
};


// --- Bot Logic ---

// Find Pairs
export const findBestPairs = (hand: CardData[]): CardData[][] => {
    const pairs: CardData[][] = [];
    let remaining = [...hand];
    const nonJokers = remaining.filter(c => !c.isJoker);

    // Group by exact ID (Suit + Rank)
    const cardMap = new Map<string, CardData[]>();
    nonJokers.forEach(c => {
        const key = `${c.suit}-${c.rank}`;
        if (!cardMap.has(key)) cardMap.set(key, []);
        cardMap.get(key)!.push(c);
    });

    for (const group of cardMap.values()) {
        if (group.length >= 2) {
            pairs.push([group[0], group[1]]);
            remaining = remaining.filter(r => r.id !== group[0].id && r.id !== group[1].id);
        }
    }

    return pairs;
};

// --- Advanced Meld Solver for Bots ---

const extractSets = (cards: CardData[], jokerPool: CardData[]): { melds: CardData[][], unused: CardData[], usedJokers: CardData[] } => {
    const melds: CardData[][] = [];
    let remaining = [...cards];
    let jokers = [...jokerPool];

    const rankMap = new Map<number, CardData[]>();
    remaining.forEach(c => {
        if (!rankMap.has(c.rank)) rankMap.set(c.rank, []);
        rankMap.get(c.rank)!.push(c);
    });

    for (const [_, group] of rankMap.entries()) {
        const uniqueSuitCards = new Map<Suit, CardData>();
        group.forEach(c => {
            if (!uniqueSuitCards.has(c.suit)) uniqueSuitCards.set(c.suit, c);
        });
        const validCards = Array.from(uniqueSuitCards.values());

        if (validCards.length >= 3) {
            melds.push(validCards);
            validCards.forEach(c => remaining = remaining.filter(r => r.id !== c.id));
        } else if (validCards.length === 2 && jokers.length > 0) {
            const j = jokers.pop()!;
            melds.push([...validCards, j]);
            validCards.forEach(c => remaining = remaining.filter(r => r.id !== c.id));
        }
    }
    
    return { melds, unused: remaining, usedJokers: jokerPool.filter(j => !jokers.includes(j)) };
};

const extractRuns = (cards: CardData[], jokerPool: CardData[]): { melds: CardData[][], unused: CardData[], usedJokers: CardData[] } => {
    const melds: CardData[][] = [];
    let remaining = [...cards];
    let jokers = [...jokerPool];

    const suits: Suit[] = ['H', 'D', 'C', 'S'];
    
    suits.forEach(suit => {
        const suitCards = remaining.filter(c => c.suit === suit).sort((a,b) => a.rank - b.rank);
        if (suitCards.length === 0) return;

        let currentRun: CardData[] = [suitCards[0]];
        
        for (let i = 1; i < suitCards.length; i++) {
            const prev = currentRun[currentRun.length - 1];
            const curr = suitCards[i];
            
            if (curr.rank === prev.rank + 1) {
                currentRun.push(curr);
            } else {
                if (curr.rank === prev.rank + 2 && jokers.length > 0) {
                     const j = jokers.pop()!;
                     currentRun.push(j);
                     currentRun.push(curr);
                } else {
                    if (currentRun.length >= 3) {
                        melds.push(currentRun);
                        currentRun.forEach(c => remaining = remaining.filter(r => r.id !== c.id));
                    } else if (currentRun.length === 2 && jokers.length > 0) {
                        const j = jokers.pop()!;
                        currentRun.push(j);
                        melds.push(currentRun);
                        currentRun.forEach(c => remaining = remaining.filter(r => r.id !== c.id));
                    }
                    currentRun = [curr];
                }
            }
        }
        
        if (currentRun.length >= 3) {
            melds.push(currentRun);
            currentRun.forEach(c => remaining = remaining.filter(r => r.id !== c.id));
        } else if (currentRun.length === 2 && jokers.length > 0) {
            const j = jokers.pop()!;
            currentRun.push(j);
            melds.push(currentRun);
            currentRun.forEach(c => remaining = remaining.filter(r => r.id !== c.id));
        }
    });

    return { melds, unused: remaining, usedJokers: jokerPool.filter(j => !jokers.includes(j)) };
};

const solveHand = (hand: CardData[], strategy: 'sets' | 'runs'): CardData[][] => {
    const jokers = hand.filter(c => c.isJoker);
    const regular = hand.filter(c => !c.isJoker);
    
    let resultMelds: CardData[][] = [];
    let currentRegular = [...regular];
    let currentJokers = [...jokers];

    if (strategy === 'sets') {
        const setRes = extractSets(currentRegular, currentJokers);
        resultMelds.push(...setRes.melds);
        const remainingJokers = currentJokers.filter(j => !setRes.usedJokers.includes(j));
        const runRes = extractRuns(setRes.unused, remainingJokers);
        resultMelds.push(...runRes.melds);
    } else {
        const runRes = extractRuns(currentRegular, currentJokers);
        resultMelds.push(...runRes.melds);
        const remainingJokers = currentJokers.filter(j => !runRes.usedJokers.includes(j));
        const setRes = extractSets(runRes.unused, remainingJokers);
        resultMelds.push(...setRes.melds);
    }
    
    return resultMelds;
};

export const findBestMelds = (hand: CardData[]): CardData[][] => {
  const resA = solveHand(hand, 'sets');
  const resB = solveHand(hand, 'runs');

  if (resA.length > resB.length) return resA;
  if (resB.length > resA.length) return resB;
  
  const countA = resA.reduce((sum, m) => sum + m.length, 0);
  const countB = resB.reduce((sum, m) => sum + m.length, 0);
  
  return countA >= countB ? resA : resB;
};

// --- Bot Utility Logic ---
export const evaluateCardUtility = (card: CardData, hand: CardData[], hasOpened: boolean, openedMelds: Meld[]): number => {
    // 1. If we have opened, does it fit on the table (including Joker Swap)?
    if (hasOpened) {
        if (isCardPlayable(card, openedMelds)) return 100; // High value
    }

    // 2. Does it help create a NEW meld?
    const currentMelds = findBestMelds(hand);
    const futureHand = [...hand, card];
    const futureMelds = findBestMelds(futureHand);

    const currentCount = currentMelds.reduce((acc, m) => acc + m.length, 0);
    const futureCount = futureMelds.reduce((acc, m) => acc + m.length, 0);

    if (futureCount > currentCount) return 80;

    // 3. Does it pair up (for pair strategy)?
    const pairs = findBestPairs(futureHand);
    const oldPairs = findBestPairs(hand);
    if (pairs.length > oldPairs.length) return 30;

    return 0;
};

export const getBotDiscard = (hand: CardData[], openedMelds: Meld[], player?: Player): CardData => {
  const playableCards = hand.filter(c => isCardPlayable(c, openedMelds));
  let candidates = hand;

  // Rule: Cannot discard playable cards unless ONLY playable cards remain
  if (playableCards.length < hand.length) {
      candidates = hand.filter(c => !playableCards.includes(c));
  }

  // Opening Turn Rule: If bot just opened, it MUST discard a card that leaves (score + hand) <= 100
  if (player && player.justOpened) {
      const validCandidates = candidates.filter(c => {
          const remainingHand = hand.filter(h => h.id !== c.id);
          return validateScoreLimit(player.totalScore, remainingHand);
      });
      if (validCandidates.length > 0) {
          candidates = validCandidates;
      }
  }

  const safeUnplayables = candidates.filter(c => !c.isJoker);

  if (safeUnplayables.length > 0) {
      return safeUnplayables.sort((a, b) => getCardScore(b) - getCardScore(a))[0];
  }
  
  if (candidates.length > 0) {
      return candidates[0];
  }

  // Fallback (e.g. only playables or jokers left)
  const safePlayables = playableCards.filter(c => !c.isJoker);
  if (safePlayables.length > 0) {
       return safePlayables.sort((a, b) => getCardScore(b) - getCardScore(a))[0];
  }

  return hand[0]; 
};
