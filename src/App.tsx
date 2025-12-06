
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, GamePhase, Meld, Player, CardData } from './types';
import { createDeck, dealCards, isValidMeld, getBotDiscard, calculateHandScore, sortHand, organizeRun, canProcessCard, findBestMelds, isCardPlayable, trySwapJoker, shuffle, findBestPairs, evaluateCardUtility, canPlayerOpenHand, validateScoreLimit, canProcessPair } from './utils/gameLogic';
import { INITIAL_HAND_SIZE, DEFAULT_MAX_ROUNDS, DEFAULT_TURN_TIME, DEFAULT_INITIAL_CHIPS, DEFAULT_ROUND_COST, SCORE_LIMIT, DEFAULT_REENTRY_COST, JOKER_DISCARD_PENALTY } from './constants';
import Card from './components/Card';
import { initAudio, playCardFlip, playShuffleDeal, playMeldSound, playRoundWin, playGrandWin, startAmbientMusic, stopAmbientMusic, setMasterVolume, playTickSound, playHoverSound, playClickSound } from './utils/soundManager';
import { translations, Language } from './utils/translations';

// --- Icons ---
const RestartIcon = ({ className = "w-5 h-5" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 12" /><path d="M3 3v9h9" /></svg>;
const UserIcon = ({ className = "w-4 h-4" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const UsersIcon = ({ className = "w-4 h-4" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
const RobotIcon = ({ className = "w-4 h-4" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>;
const TrashIcon = ({ className = "w-5 h-5" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const LayersIcon = ({ className = "w-5 h-5" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>;
const CheckIcon = ({ className = "w-5 h-5" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
const SortAlphaIcon = ({ className = "w-4 h-4" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/></svg>;
const SortNumIcon = ({ className = "w-4 h-4" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/></svg>;
const PlayIcon = ({ className = "w-5 h-5" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>;
const InfoIcon = ({ className = "w-5 h-5" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>;
const BackIcon = ({ className = "w-5 h-5" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>;
const HomeIcon = ({ className = "w-5 h-5" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
const SettingsIcon = ({ className = "w-5 h-5" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const MusicIcon = ({ className = "w-5 h-5" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>;
const ChipIcon = ({ className = "w-4 h-4" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" className="fill-yellow-500/20 stroke-yellow-500" /><path d="M12 8v8" className="stroke-yellow-500" /><path d="M8 12h8" className="stroke-yellow-500" /></svg>;
const PaletteIcon = ({ className = "w-5 h-5" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5"></circle><circle cx="17.5" cy="10.5" r=".5"></circle><circle cx="8.5" cy="7.5" r=".5"></circle><circle cx="6.5" cy="12.5" r=".5"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path></svg>;
const BookOpenIcon = ({ className = "w-5 h-5" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>;
const GlobeIcon = ({ className = "w-5 h-5" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>;

const TimerCircle = ({ timeLeft, maxTime }: { timeLeft: number, maxTime: number }) => {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeLeft / maxTime) * circumference;
  
  let color = "text-green-500";
  if (timeLeft <= 5) color = "text-red-500 animate-pulse";
  else if (timeLeft <= 10) color = "text-yellow-500";

  return (
    <div className="relative flex items-center justify-center">
        <svg className="transform -rotate-90 w-12 h-12">
            <circle
                className="text-gray-700"
                strokeWidth="4"
                stroke="currentColor"
                fill="transparent"
                r={radius}
                cx="24"
                cy="24"
            />
            <circle
                className={`${color} transition-all duration-1000 ease-linear`}
                strokeWidth="4"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r={radius}
                cx="24"
                cy="24"
            />
        </svg>
        <span className={`absolute text-xs font-bold ${color}`}>{timeLeft}</span>
    </div>
  );
};

const Toast = ({ message, onClose }: { message: string, onClose: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[100] animate-slide-in pointer-events-none w-full max-w-sm flex justify-center">
            <div className="bg-red-600/90 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 backdrop-blur border border-red-400">
                <InfoIcon />
                <span className="font-semibold text-sm md:text-base">{message}</span>
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-600/90 rotate-45"></div>
        </div>
    );
};


const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'MENU' | 'LOBBY' | 'GAME' | 'SETTINGS' | 'HOW_TO_PLAY'>('MENU');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [stagedMelds, setStagedMelds] = useState<Meld[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(DEFAULT_TURN_TIME);
  const [preparePairsMode, setPreparePairsMode] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDealing, setIsDealing] = useState(false);
  const [finalPotSplit, setFinalPotSplit] = useState<{name: string, amount: number}[] | null>(null);
  
  // Settings State
  const [gameSettings, setGameSettings] = useState({
      turnDuration: DEFAULT_TURN_TIME,
      maxRounds: DEFAULT_MAX_ROUNDS,
      masterVolume: 0.5,
      isMusicOn: false,
      initialChips: DEFAULT_INITIAL_CHIPS,
      roundCost: DEFAULT_ROUND_COST,
      reEntryCost: DEFAULT_REENTRY_COST,
      tableColor: 'GREEN' as 'GREEN' | 'BLUE' | 'RED' | 'GRAY',
      cardBack: 'BLUE' as 'BLUE' | 'RED' | 'BLACK' | 'GREEN',
      language: 'EN' as Language
  });

  const t = translations[gameSettings.language];
  
  const processingRef = useRef(false);

  // --- Helper: Show Toast ---
  const handleCloseToast = useCallback(() => {
      setToastMessage(null);
  }, []);

  const showToast = useCallback((msg: string) => {
      setToastMessage(msg);
  }, []);

  // --- Sound Init ---
  const handleInteraction = useCallback(() => {
      initAudio();
      if (gameSettings.isMusicOn) {
          startAmbientMusic();
      }
  }, [gameSettings.isMusicOn]);

  const updateVolume = (val: number) => {
      setGameSettings(prev => ({ ...prev, masterVolume: val }));
      setMasterVolume(val);
  };

  const toggleMusic = (isOn: boolean) => {
      playClickSound();
      setGameSettings(prev => ({ ...prev, isMusicOn: isOn }));
      if (isOn) {
          startAmbientMusic();
      } else {
          stopAmbientMusic();
      }
  };

  // --- Table Background Style ---
  const getTableBackground = () => {
      switch(gameSettings.tableColor) {
          case 'BLUE': return 'radial-gradient(circle at center, #1e3a8a 0%, #0f172a 100%)';
          case 'RED': return 'radial-gradient(circle at center, #7f1d1d 0%, #450a0a 100%)';
          case 'GRAY': return 'radial-gradient(circle at center, #374151 0%, #111827 100%)';
          case 'GREEN':
          default: return 'radial-gradient(circle at center, #1e5c35 0%, #0f2e1b 100%)';
      }
  };

  // --- Initialization ---

  const initGame = useCallback((keepScores = false) => {
    const deck = createDeck();
    
    let currentPlayers: Player[] = [];
    let currentRound = 1;
    let grandPot = 0;
    let roundStarterIndex = 0; // The player who gets the token to start
    let winner = null;
    let phase = GamePhase.DRAW;
    let message = "";
    
    const maxRounds = gameSettings.maxRounds;
    const roundCost = gameSettings.roundCost;
    const reEntryCost = gameSettings.reEntryCost;

    if (keepScores && gameState) {
        currentRound = gameState.round + 1;
        grandPot = gameState.grandPot; // Carry over accumulated penalties
        
        // Rotate the starting player counter-clockwise
        const prevStarter = gameState.roundStarterIndex ?? 0;
        roundStarterIndex = (prevStarter + 1) % 4;

        // Re-entry Logic: Check elimination
        currentPlayers = gameState.players.map(p => {
            // If already bankrupt, stay bankrupt
            if (p.isBankrupt) {
                return {
                    ...p,
                    hand: [],
                    score: 0,
                    hasOpened: false,
                    justOpened: false,
                    openingType: undefined
                };
            }

            let pScore = p.totalScore;
            let pChips = p.chips;
            let pEliminated = p.totalScore > SCORE_LIMIT;

            // Handle Re-entry for "Burned" players (Score > 100)
            if (pEliminated) {
                // Determine re-entry cost (User Setting)
                const totalCost = reEntryCost + roundCost; // Penalty + Round Ante
                
                if (pChips >= totalCost) {
                    // Re-enter!
                    // Penalty goes to Grand Pot
                    grandPot += reEntryCost;
                    pChips -= reEntryCost; // Round ante deducted later

                    // Find max score among active players (not including self)
                    const activeScores = gameState.players
                        .filter(op => op.id !== p.id && !op.isBankrupt && op.totalScore <= SCORE_LIMIT)
                        .map(op => op.totalScore);
                    
                    const maxActiveScore = activeScores.length > 0 ? Math.max(...activeScores) : 0;
                    
                    pScore = maxActiveScore; // Reset score to highest active
                    pEliminated = false;
                } else {
                    // Bankrupt - Cannot re-enter
                    p.isBankrupt = true; // Permanently out
                    pEliminated = true;
                }
            }

            return {
                ...p,
                hand: [],
                score: 0, 
                totalScore: pScore,
                chips: pChips,
                hasOpened: false,
                justOpened: false,
                openingType: undefined,
                isEliminated: pEliminated
            };
        });

    } else {
        // NEW GAME
        const basePlayers = [
            { id: 0, name: 'You', isBot: false },
            { id: 1, name: 'Can', isBot: true },
            { id: 2, name: 'Yağmur', isBot: true },
            { id: 3, name: 'Mike', isBot: true },
        ];
        
        currentPlayers = basePlayers.map(p => ({
            ...p,
            hand: [],
            score: 0,
            totalScore: 0,
            chips: gameSettings.initialChips,
            hasOpened: false,
            justOpened: false,
            openingType: undefined,
            isEliminated: false,
            isBankrupt: false
        }));
        currentRound = 1;
        grandPot = 0;
        roundStarterIndex = 0; // Human starts first game
    }

    // Process Round Betting (Ante)
    let currentRoundPot = 0;
    currentPlayers.forEach(p => {
        if (!p.isBankrupt) {
            // Only try to bet if not already bankrupt
            if (p.chips >= roundCost) {
                p.chips -= roundCost;
                currentRoundPot += roundCost;
            } else {
                // Cannot afford round ante -> Bankrupt
                p.isBankrupt = true;
                p.isEliminated = true;
            }
        }
    });

    // Check for Critical Game End (Multiple Bankruptcies)
    const bankruptCount = currentPlayers.filter(p => p.isBankrupt).length;
    const activeCount = currentPlayers.filter(p => !p.isEliminated).length;

    // Game Over Condition: 2 or more players went bankrupt
    if (bankruptCount >= 2) {
        phase = GamePhase.GAME_OVER;
        message = t.game.gameOver;
        
        // Distribute Grand Pot to survivors (split equally)
        const survivors = currentPlayers.filter(p => !p.isBankrupt);
        if (survivors.length > 0) {
            const splitAmount = Math.floor(grandPot / survivors.length);
            survivors.forEach(s => s.chips += splitAmount);
            grandPot = 0; // Empty pot
            // Simplified message for brevity in logic, UI handles localized display
        }
    } 
    else if (activeCount <= 1 && currentRound > 1) {
        // Last man standing (handled usually in endRound but good check here too)
        phase = GamePhase.GAME_OVER;
        message = t.game.gameOver;
    }

    const { hands, remainingDeck } = dealCards(deck, 4, INITIAL_HAND_SIZE);
    
    // Distribute hands only to active players
    currentPlayers.forEach((p, i) => {
        if (!p.isEliminated) {
            p.hand = hands[i];
        } else {
            p.hand = [];
        }
    });
    
    // Determine Actual Starting Player (Handling Elimination)
    // Start from the roundStarterIndex, if eliminated, move to next.
    let startIndex = roundStarterIndex;
    let attempts = 0;
    while(startIndex < 4 && currentPlayers[startIndex].isEliminated && attempts < 4) {
        startIndex = (startIndex + 1) % 4;
        attempts++;
    }
    
    // If Game Over was triggered during Ante check
    if (phase !== GamePhase.GAME_OVER) {
        message = `${t.game.round} ${currentRound}/${maxRounds}: ${currentPlayers[startIndex].name} ${t.game.turn}`;
    }

    setGameState({
        deck: remainingDeck,
        discardPile: [],
        players: currentPlayers,
        currentPlayerIndex: startIndex,
        roundStarterIndex: roundStarterIndex,
        openedMelds: [],
        phase: phase,
        round: currentRound,
        maxRounds: maxRounds,
        winner: winner,
        message: message,
        roundPot: currentRoundPot,
        grandPot: grandPot,
        scoreLimit: SCORE_LIMIT
    });

    setSelectedCards([]);
    setStagedMelds([]);
    setFinalPotSplit(null);
    setTimeLeft(gameSettings.turnDuration);
    setPreparePairsMode(false);
    setToastMessage(null);
    processingRef.current = false;
  }, [gameSettings, gameState]);

  const handleStartGame = () => {
      playClickSound();
      handleInteraction();
      setIsDealing(true);
      playShuffleDeal(); 

      // Wait for animation
      setTimeout(() => {
          setIsDealing(false);
          initGame(false);
          setCurrentView('GAME');
      }, 1500);
  };

  const handleNextRound = () => {
      playClickSound();
      setIsDealing(true);
      playShuffleDeal();
      setTimeout(() => {
        setIsDealing(false);
        initGame(true);
      }, 1500);
  };

  const handleExitToMenu = () => {
      playClickSound();
      setGameState(null);
      setCurrentView('MENU');
      processingRef.current = false;
      setIsDealing(false);
  };

  // --- Timer Logic ---
  
  // Timer countdown
  useEffect(() => {
    if (currentView !== 'GAME' || !gameState || gameState.phase === GamePhase.GAME_OVER || gameState.phase === GamePhase.ROUND_OVER || isDealing) return;

    const timer = setInterval(() => {
        setTimeLeft((prev) => {
            if (prev <= 0) return 0;
            if (prev <= 6 && prev > 1) playTickSound();
            return prev - 1;
        });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentView, gameState?.phase, gameState?.winner, isDealing]); 

  // Auto Action on TimeOut
  useEffect(() => {
      if (currentView === 'GAME' && timeLeft === 0 && gameState && !isDealing) {
          handleAutoAction();
      }
  }, [currentView, timeLeft, gameState, isDealing]);

  // Watchdog
  useEffect(() => {
      const watchdog = setInterval(() => {
          if (currentView === 'GAME' && gameState && !processingRef.current && timeLeft === 0 && !isDealing) {
               console.warn("Watchdog triggered: forcing auto action");
               handleAutoAction();
          }
      }, 5000); 
      return () => clearInterval(watchdog);
  }, [currentView, gameState, timeLeft, isDealing]);


  const recycleDeck = (gs: GameState) => {
      if (gs.deck.length === 0 && gs.discardPile.length > 0) {
          gs.deck = shuffle([...gs.discardPile]);
          gs.discardPile = [];
          playShuffleDeal();
          return true;
      }
      return false;
  };

  const handleAutoAction = () => {
      if (!gameState) return;
      if (processingRef.current) return;
      processingRef.current = true;
      
      const { currentPlayerIndex, phase } = gameState;
      const newGameState = { ...gameState };
      const player = newGameState.players[currentPlayerIndex];

      // Skip eliminated players (sanity check)
      if (player.isEliminated) {
          advanceTurn(newGameState);
          return;
      }

      console.log(`Auto action executing for ${player.name} (${phase})`);

      if (phase === GamePhase.DRAW) {
          if (newGameState.deck.length === 0) {
             const recycled = recycleDeck(newGameState);
             if (!recycled) {
                 newGameState.phase = GamePhase.ROUND_OVER;
                 newGameState.message = t.game.drawGame;
                 setGameState(newGameState);
                 processingRef.current = false;
                 return;
             }
          }
          
          if (newGameState.deck.length > 0) {
              const card = newGameState.deck.pop()!;
              player.hand.push(card);
              playCardFlip();
              newGameState.phase = GamePhase.ACTION;
              newGameState.message = `${player.name}: ${t.game.autoDrawn}.`;
              setTimeLeft(gameSettings.turnDuration);
              setGameState(newGameState);
          }
      } 
      else if (phase === GamePhase.ACTION) {
          const cardToDiscard = getBotDiscard(player.hand, newGameState.openedMelds, player);
          
          player.hand = player.hand.filter(c => c.id !== cardToDiscard.id);
          newGameState.discardPile.push(cardToDiscard);
          playCardFlip();
          
          // Check for Joker Discard Penalty (Auto-Discard)
          if (cardToDiscard.isJoker) {
              player.chips -= JOKER_DISCARD_PENALTY;
              newGameState.grandPot += JOKER_DISCARD_PENALTY;
              if (player.chips < 0) {
                  // Theoretically bankruptcy is checked at round start, but we track negative chips here.
              }
          }

          if (player.justOpened) player.justOpened = false;

          if (player.hand.length === 0) {
              endRound(newGameState, player.id, cardToDiscard);
          } else {
              advanceTurn(newGameState);
          }
      }
      
      setTimeout(() => {
          processingRef.current = false;
      }, 500);
  };


  // --- Helpers ---

  const handleSortHand = (bySuit: boolean) => {
      if (!gameState) return;
      playClickSound();
      playCardFlip();
      const newGameState = { ...gameState };
      newGameState.players[0].hand = sortHand(newGameState.players[0].hand, bySuit);
      setGameState(newGameState);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move"; 
  };

  const handleDragEnter = (e: React.DragEvent, targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex || !gameState) return;
    
    const newPlayers = [...gameState.players];
    const newHand = [...newPlayers[0].hand];
    
    const item = newHand[draggedIndex];
    newHand.splice(draggedIndex, 1);
    newHand.splice(targetIndex, 0, item);
    
    newPlayers[0].hand = newHand;
    
    setGameState({
        ...gameState,
        players: newPlayers
    });
    setDraggedIndex(targetIndex);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); 
  };

  // --- Actions ---

  const handleDraw = (fromDiscard: boolean) => {
    if (!gameState || gameState.phase !== GamePhase.DRAW) return;
    if (gameState.currentPlayerIndex !== 0) return;
    if (gameState.players[0].isEliminated) return; // Spectator safety

    const newGameState = { ...gameState };
    const player = newGameState.players[0];

    if (fromDiscard) {
      if (newGameState.discardPile.length === 0) return;
      const card = newGameState.discardPile.pop()!;
      player.hand.push(card);
    } else {
      if (newGameState.deck.length === 0) {
          const recycled = recycleDeck(newGameState);
          if (!recycled) {
            newGameState.phase = GamePhase.ROUND_OVER;
            newGameState.message = t.game.drawGame;
            setGameState(newGameState);
            return;
          }
      }
      const card = newGameState.deck.pop()!;
      player.hand.push(card);
    }

    playCardFlip();
    newGameState.phase = GamePhase.ACTION;
    newGameState.message = t.game.createMelds;
    setTimeLeft(gameSettings.turnDuration);
    setGameState(newGameState);
  };

  // Core discard logic extracted to support double click
  const handleAttemptDiscard = (cardId: string) => {
    if (!gameState || gameState.phase !== GamePhase.ACTION) return;
    if (gameState.players[0].isEliminated) return;

    // IMPORTANT: Clear selection immediately to allow quick discard of ANY card
    // regardless of what else is selected. This fixes the usability issue.
    setSelectedCards([]);

    if (stagedMelds.length > 0) {
        showToast(t.toasts.clearStaged);
        return;
    }

    const newGameState = { ...gameState };
    const player = newGameState.players[0];
    const card = player.hand.find(c => c.id === cardId);
    if (!card) return;

    const isPlayable = isCardPlayable(card, newGameState.openedMelds);
    const nonPlayableCards = player.hand.filter(c => !isCardPlayable(c, newGameState.openedMelds));
    
    if (isPlayable) {
        if (nonPlayableCards.length > 0) {
            showToast(t.toasts.cardFits);
            return;
        } else {
            // Check Score Limit exception for forced discard
            // If forced to discard playable card AND we just opened this turn, check limit
            if (player.hasOpened && player.justOpened) {
                const keptCards = player.hand.filter(c => c.id !== cardId);
                if (!validateScoreLimit(player.totalScore, keptCards)) {
                     showToast(t.toasts.openingLimit);
                     return;
                }
            }
            showToast(t.toasts.allPlayable);
        }
    } else {
        // Standard non-playable discard
        // If opened THIS TURN, we MUST validate score limit
        if (player.hasOpened && player.justOpened) {
            const keptCards = player.hand.filter(c => c.id !== cardId);
            if (!validateScoreLimit(player.totalScore, keptCards)) {
                 showToast(t.toasts.openingLimit);
                 return;
            }
        }
    }

    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    const [discardedCard] = player.hand.splice(cardIndex, 1);
    newGameState.discardPile.push(discardedCard);
    
    // Check for Joker Discard Penalty
    if (discardedCard.isJoker) {
        player.chips -= JOKER_DISCARD_PENALTY;
        newGameState.grandPot += JOKER_DISCARD_PENALTY;
        showToast(`${t.toasts.jokerPenalty}: -${JOKER_DISCARD_PENALTY} ${t.game.chips}`);
    }

    // Reset opening status after successful discard
    player.justOpened = false;

    playCardFlip();

    if (player.hand.length === 0) {
      endRound(newGameState, player.id, discardedCard);
      return;
    }

    advanceTurn(newGameState);
  };

  const discardSelected = () => {
    if (selectedCards.length !== 1) return;
    handleAttemptDiscard(selectedCards[0]);
  };

  const advanceTurn = (gs: GameState) => {
      let nextIndex = (gs.currentPlayerIndex + 1) % 4;
      
      // Skip eliminated players
      let attempts = 0;
      while (gs.players[nextIndex].isEliminated && attempts < 4) {
          nextIndex = (nextIndex + 1) % 4;
          attempts++;
      }

      gs.currentPlayerIndex = nextIndex;
      gs.phase = GamePhase.DRAW;
      gs.message = `${gs.players[nextIndex].name}${t.game.turn}`;
      setTimeLeft(gameSettings.turnDuration);
      
      setSelectedCards([]);
      setGameState(gs);
      processingRef.current = false;
  };

  const endRound = (gs: GameState, winnerId: number, lastCard?: CardData | null) => {
      gs.phase = GamePhase.ROUND_OVER;
      gs.winner = winnerId;
      
      let msg = winnerId !== null && winnerId !== -1 ? `${gs.players[winnerId].name} ${t.game.wins}` : t.game.drawGame;
      
      // Calculate Multipliers
      let multiplier = 1;
      let reason = "";

      if (winnerId !== -1 && winnerId !== null) {
          const winner = gs.players[winnerId];
          
          if (winner.openingType === 'pairs') {
              multiplier *= 2;
              reason = "PAIRS";
          }
          
          if (lastCard && lastCard.isJoker) {
              multiplier *= 2;
              reason = reason ? "PAIRS + JOKER" : "JOKER FINISH";
          }

          if (multiplier > 1) {
              msg += ` (${reason} x${multiplier})`;
          }

          // Winner takes the pot
          winner.chips += gs.roundPot;
          msg += ` (+${gs.roundPot} ${t.game.chips})`;
      }

      // Calculate Scores
      gs.players.forEach(p => {
          if (p.id !== winnerId && !p.isEliminated) {
             const handScore = calculateHandScore(p.hand);
             p.score = handScore * multiplier;
             p.totalScore += p.score;
             
             // Check elimination
             if (p.totalScore > gs.scoreLimit) {
                 p.isEliminated = true; // Will prompt re-entry or bankruptcy next round
             }
          } else {
             p.score = 0; 
          }
      });
      
      gs.message = msg;
      let potSplitInfo: {name: string, amount: number}[] = [];

      // Check Game Over Conditions (Last Man Standing, 2 Bankrupts, or Max Rounds)
      const activePlayers = gs.players.filter(p => !p.isEliminated);
      const bankruptPlayers = gs.players.filter(p => p.isBankrupt);

      if (activePlayers.length <= 1) {
          // Last man standing wins grand pot (Unless waiting for Round Limit)
          // Actually, if only 1 player remains, Game must end.
          gs.phase = GamePhase.GAME_OVER;
          
          // Distribute Grand Pot to Winner
          if (activePlayers.length === 1) {
              activePlayers[0].chips += gs.grandPot;
              potSplitInfo.push({ name: activePlayers[0].name, amount: gs.grandPot });
              gs.grandPot = 0;
          }
      } 
      else if (bankruptPlayers.length >= 2) {
          // Condition: 2 people are bankrupt -> Game Ends
          gs.phase = GamePhase.GAME_OVER;
          gs.message = t.game.gameOver;
          
           // Distribute Grand Pot to survivors
           const survivors = gs.players.filter(p => !p.isBankrupt);
           if (survivors.length > 0) {
               const split = Math.floor(gs.grandPot / survivors.length);
               survivors.forEach(s => {
                   s.chips += split;
                   potSplitInfo.push({ name: s.name, amount: split });
               });
               gs.grandPot = 0;
           }
      }
      else if (gs.round >= gs.maxRounds) {
          gs.phase = GamePhase.GAME_OVER;
          
          // Max Rounds: Distribute Grand Pot to Lowest Score
          const survivors = gs.players.filter(p => !p.isEliminated);
          if (survivors.length > 0) {
              const sorted = [...survivors].sort((a,b) => a.totalScore - b.totalScore);
              
              if (sorted.length >= 2) {
                  // 2/3 to 1st, 1/3 to 2nd
                  const firstShare = Math.floor(gs.grandPot * 0.66);
                  const secondShare = gs.grandPot - firstShare;
                  
                  const p1 = gs.players.find(p => p.id === sorted[0].id);
                  const p2 = gs.players.find(p => p.id === sorted[1].id);
                  if(p1) { p1.chips += firstShare; potSplitInfo.push({ name: p1.name, amount: firstShare }); }
                  if(p2) { p2.chips += secondShare; potSplitInfo.push({ name: p2.name, amount: secondShare }); }
              } else {
                  // Only 1 survivor
                  const p1 = gs.players.find(p => p.id === sorted[0].id);
                  if(p1) { p1.chips += gs.grandPot; potSplitInfo.push({ name: p1.name, amount: gs.grandPot }); }
              }
              gs.grandPot = 0;
          }
      }
      
      setFinalPotSplit(potSplitInfo);
      
      // Sound
      if (gs.phase === GamePhase.GAME_OVER) playGrandWin();
      else playRoundWin();

      setGameState(gs);
      processingRef.current = false;
  };

  const createMeld = () => {
    if (!gameState || gameState.phase !== GamePhase.ACTION) return;
    if (gameState.players[0].isEliminated) return;
    
    playClickSound();

    const player = gameState.players[0];
    const cardsToMeld = player.hand.filter(c => selectedCards.includes(c.id));

    const check = isValidMeld(cardsToMeld);

    if (check.valid && check.type) {
      const newGameState = { ...gameState };
      const currentPlayer = newGameState.players[0];
      
      if (preparePairsMode && check.type !== 'pair') {
          showToast(t.toasts.pairsSelectTwo);
          return;
      }
      if (!preparePairsMode && check.type === 'pair') {
          showToast(t.toasts.switchToPairs);
          return;
      }
      
      let finalCards = cardsToMeld;
      if (check.type === 'run') {
          finalCards = organizeRun(cardsToMeld);
      } else if (check.type === 'set') {
          finalCards.sort((a, b) => a.suit.localeCompare(b.suit));
      }

      const newMeld: Meld = {
        id: `meld-${Date.now()}`,
        cards: finalCards,
        type: check.type,
        playerId: 0
      };

      currentPlayer.hand = currentPlayer.hand.filter(c => !selectedCards.includes(c.id));
      playMeldSound();

      if (currentPlayer.hasOpened) {
          newGameState.openedMelds.push(newMeld);
          setGameState(newGameState);
      } else {
          setStagedMelds([...stagedMelds, newMeld]);
          setGameState(newGameState);
      }

      setSelectedCards([]);
    } else {
      showToast(t.toasts.invalidMeld);
    }
  };

  const confirmOpenHand = () => {
      if (!gameState) return;
      if (gameState.players[0].isEliminated) return;
      
      playClickSound();

      // 1. Minimum Melds Check
      if (preparePairsMode) {
          if (stagedMelds.length < 4) {
              showToast(`${t.toasts.needMorePairs} ${stagedMelds.length}.`);
              return;
          }
      } else {
          if (stagedMelds.length < 2) {
              showToast(`${t.toasts.needMoreSeries} ${stagedMelds.length}.`);
              return;
          }
      }

      // 2. Score Limit Check (100 Point Rule)
      const player = gameState.players[0];
      // Updated to pass openedMelds for accurate discard prediction (Ishlek rule)
      const check = canPlayerOpenHand(player, player.hand, gameState.openedMelds);
      
      if (!check.allowed) {
          showToast(check.reason || t.toasts.scoreLimitExceeded);
          return;
      }

      const newGameState = { ...gameState };
      newGameState.players[0].hasOpened = true;
      newGameState.players[0].justOpened = true; // Mark as just opened to restrict discard
      newGameState.players[0].openingType = preparePairsMode ? 'pairs' : 'series';
      newGameState.openedMelds.push(...stagedMelds);
      
      playMeldSound();
      setStagedMelds([]);
      setGameState(newGameState);
  };

  const cancelStagedMelds = () => {
      if (!gameState || stagedMelds.length === 0) return;
      playClickSound();

      const newGameState = { ...gameState };
      const player = newGameState.players[0];

      stagedMelds.forEach(meld => {
          player.hand.push(...meld.cards);
      });

      playCardFlip();
      setStagedMelds([]);
      setGameState(newGameState);
  };

  const toggleSelectCard = (id: string) => {
    if (gameState?.players[0].isEliminated) return;
    playCardFlip();
    if (selectedCards.includes(id)) {
      setSelectedCards(selectedCards.filter(c => c !== id));
    } else {
      setSelectedCards([...selectedCards, id]);
    }
  };

  const handleProcessMeld = (meldId: string) => {
    if (!gameState || gameState.phase !== GamePhase.ACTION) return;
    if (gameState.players[0].isEliminated) return;
    
    // NEW CHECK: Cannot process the last card. Must be discarded.
    if (gameState.players[0].hand.length <= 1) {
        showToast(t.toasts.lastCardDiscard);
        return;
    }

    if (!gameState.players[0].hasOpened) {
      showToast(t.toasts.openHandFirst);
      return;
    }

    const newGameState = { ...gameState };
    const player = newGameState.players[0];
    const handCards = player.hand.filter(c => selectedCards.includes(c.id));
    
    if (handCards.length === 0) return;

    const meldIndex = newGameState.openedMelds.findIndex(m => m.id === meldId);
    if (meldIndex === -1) return;

    const meld = newGameState.openedMelds[meldIndex];

    const swapResult = trySwapJoker(handCards, meld);
    
    if (swapResult.success && swapResult.newMeldCards && swapResult.retrievedJoker) {
        playMeldSound();
        meld.cards = swapResult.newMeldCards;
        player.hand = player.hand.filter(c => !selectedCards.includes(c.id));
        player.hand.push(swapResult.retrievedJoker);
        setSelectedCards([]);
        setGameState(newGameState);
        return;
    } 

    // NEW LOGIC: Allow processing a Pair (2 cards) into an existing Pair
    if (selectedCards.length === 2 && meld.type === 'pair') {
        const result = canProcessPair(handCards, meld);
        if (result.valid && result.newCards) {
            playMeldSound();
            meld.cards = result.newCards;
            // The meld essentially becomes a Set (4 identical cards) now, or stays as 'pair' type but with 4 cards 
            // depending on game logic interpretation. For now, validMeld handles 4 identical cards as 'set', 
            // but we can leave type as 'pair' or update it. 
            // Let's update type to 'set' to match isValidMeld logic for 4 cards.
            meld.type = 'set'; 
            
            player.hand = player.hand.filter(c => !selectedCards.includes(c.id));
            setSelectedCards([]);
            
            if (player.hand.length === 0) {
                endRound(newGameState, player.id, null);
            } else {
                setGameState(newGameState);
            }
            return;
        } else {
             showToast(result.reason || t.toasts.pairsNoMatch);
             return;
        }
    }
    
    if (selectedCards.length > 1 && meld.type === 'run') {
        showToast(swapResult.reason || t.toasts.selectOneSwap);
        return;
    }

    if (selectedCards.length === 1) {
        const card = handCards[0];
        const result = canProcessCard(card, meld);

        if (result.valid && result.newCards) {
            playMeldSound();
            meld.cards = result.newCards;
            player.hand = player.hand.filter(c => c.id !== card.id);
            setSelectedCards([]);
            
            if (player.hand.length === 0) {
                endRound(newGameState, player.id, null);
            } else {
                setGameState(newGameState);
            }
        } else {
            showToast(swapResult.reason || result.reason || t.toasts.cannotAdd);
        }
    }
  };

  // --- Bot Logic ---
  useEffect(() => {
    if (currentView !== 'GAME' || !gameState || gameState.phase === GamePhase.GAME_OVER || gameState.phase === GamePhase.ROUND_OVER || isDealing) return;
    
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer.isBot || processingRef.current) return;
    
    // Check if bot is eliminated (shouldn't happen due to advanceTurn logic, but safe guard)
    if (currentPlayer.isEliminated) {
        setGameState(prev => {
            if(!prev) return null;
            const gs = {...prev};
            advanceTurn(gs);
            return gs;
        });
        return;
    }

    processingRef.current = true;

    const timer = setTimeout(() => {
      try {
          setGameState(currentState => {
            if (!currentState) return null;
            if (currentState.currentPlayerIndex !== currentPlayer.id) return currentState;

            const newGameState = { ...currentState };
            const bot = newGameState.players[currentState.currentPlayerIndex];

            // 1. Draw Phase
            let drewCard = false;
            
            if (newGameState.discardPile.length > 0) {
                const discardTop = newGameState.discardPile[newGameState.discardPile.length - 1];
                const utility = evaluateCardUtility(discardTop, bot.hand, bot.hasOpened, newGameState.openedMelds);
                
                if (utility >= 10) {
                     bot.hand.push(newGameState.discardPile.pop()!);
                     playCardFlip();
                     drewCard = true;
                }
            }

            if (!drewCard) {
                if (newGameState.deck.length === 0) {
                     const recycled = recycleDeck(newGameState);
                     if (!recycled) {
                         endRound(newGameState, -1, null);
                         return newGameState;
                     }
                }
                if (newGameState.deck.length > 0) {
                    bot.hand.push(newGameState.deck.pop()!);
                    playCardFlip();
                } else if (!drewCard && newGameState.discardPile.length > 0) {
                     bot.hand.push(newGameState.discardPile.pop()!);
                }
            }
            
            setTimeLeft(gameSettings.turnDuration);

            // 2. Action Loop
            let madeAction = true;
            let attempts = 0;
            
            while(madeAction && attempts < 15) {
                madeAction = false;
                attempts++;
                
                // A. Try to Open Hand
                if (!bot.hasOpened) {
                   const seriesMelds = findBestMelds(bot.hand);
                   if (seriesMelds.length >= 2) {
                       const cardsToMeld = seriesMelds.flat();
                       const remainingHand = bot.hand.filter(c => !cardsToMeld.some(m => m.id === c.id));
                       const openCheck = canPlayerOpenHand(bot, remainingHand, newGameState.openedMelds);

                       if (openCheck.allowed) {
                           bot.hasOpened = true;
                           bot.justOpened = true; // Bot also respects opening turn rule
                           bot.openingType = 'series';
                           playMeldSound();
                           seriesMelds.forEach((meldCards, i) => {
                              const check = isValidMeld(meldCards);
                              const newMeld: Meld = {
                                  id: `bot-meld-${bot.id}-${Date.now()}-${i}`,
                                  cards: check.type === 'run' ? organizeRun(meldCards) : meldCards,
                                  type: check.type || 'set',
                                  playerId: bot.id
                              };
                              newGameState.openedMelds.push(newMeld);
                              meldCards.forEach(mc => {
                                  bot.hand = bot.hand.filter(h => h.id !== mc.id);
                              });
                           });
                           madeAction = true;
                       }
                   } 
                   else {
                       const pairs = findBestPairs(bot.hand);
                       if (pairs.length >= 4) {
                           const cardsToMeld = pairs.flat();
                           const remainingHand = bot.hand.filter(c => !cardsToMeld.some(m => m.id === c.id));
                           const openCheck = canPlayerOpenHand(bot, remainingHand, newGameState.openedMelds);

                           if (openCheck.allowed) {
                               bot.hasOpened = true;
                               bot.justOpened = true; // Bot also respects opening turn rule
                               bot.openingType = 'pairs';
                               playMeldSound();
                               pairs.forEach((pairCards, i) => {
                                   const newMeld: Meld = {
                                      id: `bot-pair-${bot.id}-${Date.now()}-${i}`,
                                      cards: pairCards,
                                      type: 'pair',
                                      playerId: bot.id
                                   };
                                   newGameState.openedMelds.push(newMeld);
                                   pairCards.forEach(pc => {
                                       bot.hand = bot.hand.filter(h => h.id !== pc.id);
                                   });
                               });
                               madeAction = true;
                           }
                       }
                   }
                }

                // B. If Opened: Process Cards & Swap Jokers
                if (bot.hasOpened) {
                   for (const meld of newGameState.openedMelds) {
                       const jokers = meld.cards.filter(c => c.isJoker);
                       if (jokers.length === 0) continue;
                       
                       for (let i = 0; i < bot.hand.length; i++) {
                           const card = bot.hand[i];
                           const swapRes = trySwapJoker([card], meld);
                           if (swapRes.success && swapRes.newMeldCards && swapRes.retrievedJoker) {
                               playMeldSound();
                               meld.cards = swapRes.newMeldCards;
                               bot.hand[i] = swapRes.retrievedJoker;
                               madeAction = true;
                               break;
                           }
                       }
                   }

                   for (let i = 0; i < bot.hand.length; i++) {
                       const card = bot.hand[i];
                       let played = false;
                       for (const meld of newGameState.openedMelds) {
                           const res = canProcessCard(card, meld);
                           if (res.valid && res.newCards) {
                               playMeldSound();
                               meld.cards = res.newCards;
                               bot.hand.splice(i, 1);
                               played = true;
                               madeAction = true;
                               break;
                           }
                       }
                       if (played) break;
                   }

                   if (bot.openingType === 'series') {
                       const newMelds = findBestMelds(bot.hand);
                       if (newMelds.length > 0) {
                            playMeldSound();
                            newMelds.forEach((meldCards, i) => {
                                const check = isValidMeld(meldCards);
                                const newMeld: Meld = {
                                    id: `bot-extra-${bot.id}-${Date.now()}-${i}`,
                                    cards: check.type === 'run' ? organizeRun(meldCards) : meldCards,
                                    type: check.type || 'set',
                                    playerId: bot.id
                                };
                                newGameState.openedMelds.push(newMeld);
                                meldCards.forEach(mc => {
                                    bot.hand = bot.hand.filter(h => h.id !== mc.id);
                                });
                                madeAction = true;
                            });
                       }
                   }
                }
            }

            if (bot.hand.length === 0) {
                endRound(newGameState, bot.id, null);
                return newGameState;
            }

            const discardCard = getBotDiscard(bot.hand, newGameState.openedMelds, bot);
            bot.hand = bot.hand.filter(c => c.id !== discardCard.id);
            newGameState.discardPile.push(discardCard);
            playCardFlip();
            
            // Check for Joker Penalty
            if (discardCard.isJoker) {
                 bot.chips -= JOKER_DISCARD_PENALTY;
                 newGameState.grandPot += JOKER_DISCARD_PENALTY;
            }

            // Reset opening restriction after turn
            bot.justOpened = false;

            if (bot.hand.length === 0) {
                endRound(newGameState, bot.id, discardCard);
            } else {
                advanceTurn(newGameState);
            }
            return newGameState;
          });
      } catch (err) {
          console.error("Bot Error", err);
          setGameState(prev => {
              if(!prev) return null;
              const gs = {...prev};
              advanceTurn(gs);
              return gs;
          });
      } finally {
          processingRef.current = false;
      }
    }, 800); 

    return () => clearTimeout(timer);
  }, [currentView, gameState?.currentPlayerIndex, gameState?.phase, gameState?.round, isDealing, gameSettings.turnDuration, t]); // Added t as dependency


  // --- Render Helpers ---

  const renderMeld = (meld: Meld, isStaged: boolean = false) => (
    <div key={meld.id} 
        onClick={() => { if(!isStaged) playClickSound(); !isStaged && handleProcessMeld(meld.id) }}
        className={`relative bg-black/30 p-2 rounded-xl transition-all border 
            ${isStaged ? 'border-yellow-400/50 bg-yellow-900/20 mb-2' : 'border-white/20 hover:border-yellow-400 hover:bg-black/50 cursor-pointer shadow-lg'} 
            group scale-90 md:scale-100 origin-left`}
    >
        <div className="flex -space-x-8 md:-space-x-7 pl-1 pr-1">
            {meld.cards.map((c, i) => (
                <div key={c.id} style={{zIndex: i}} className="transform group-hover:-translate-y-2 transition-transform duration-200">
                    <Card card={c} medium />
                </div>
            ))}
        </div>
        {gameState?.players[0].hasOpened && !isStaged && selectedCards.length > 0 && (
             <div className="absolute inset-0 bg-yellow-400/10 border-2 border-yellow-400 rounded-xl animate-pulse pointer-events-none"></div>
        )}
    </div>
  );

  // --- VIEWS ---

  if (isDealing) {
      return (
          <div className="w-screen h-screen flex items-center justify-center relative overflow-hidden z-[100]" style={{ background: getTableBackground() }}>
               <div className="absolute inset-0 bg-black/60 z-0"></div>
               <div className="text-white font-bold text-2xl animate-pulse absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-20 z-20">
                   {gameState ? `${t.game.round} ${gameState.phase === GamePhase.ROUND_OVER ? gameState.round + 1 : 1} - ${t.game.betting} ${gameSettings.roundCost}...` : t.game.dealing}
               </div>
               
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none z-10">
                    {[0,1,2,3].map(i => (
                        <div key={i} className="absolute inset-0 flex items-center justify-center">
                            <div className="animate-ping absolute opacity-50"><ChipIcon className="w-8 h-8 text-yellow-500" /></div>
                        </div>
                    ))}
               </div>

               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-32 rounded-lg shadow-2xl z-20">
                    {[0,1,2,3].map(i => (
                        <div key={i} className="absolute inset-0 transition-all duration-1000 ease-out"
                            style={{
                                transform: `translate(${i*2}px, ${i*2}px)`,
                                animation: `deal${i} 1s forwards`,
                                animationDelay: `${i*0.1}s`
                            }}
                        >
                            <Card card={{id: `deal-${i}`, suit: 'S', rank: 14, isJoker: false}} faceDown backColor={gameSettings.cardBack} className="w-full h-full" />
                            <style>{`
                                @keyframes deal0 { to { transform: translate(0, 40vh); opacity: 0; } }
                                @keyframes deal1 { to { transform: translate(40vw, 0); opacity: 0; } }
                                @keyframes deal2 { to { transform: translate(0, -40vh); opacity: 0; } }
                                @keyframes deal3 { to { transform: translate(-40vw, 0); opacity: 0; } }
                            `}</style>
                        </div>
                    ))}
               </div>
          </div>
      )
  }

  if (currentView === 'MENU') {
    return (
        <div className="w-screen h-screen overflow-hidden flex flex-col items-center justify-center relative" onClick={handleInteraction} style={{ background: getTableBackground() }}>
            <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
                <div className="absolute top-10 left-10 rotate-12 opacity-50"><Card card={{id:'dec1', suit:'H', rank:14, isJoker:false}} /></div>
                <div className="absolute bottom-10 right-10 -rotate-12 opacity-50"><Card card={{id:'dec2', suit:'S', rank:14, isJoker:false}} /></div>
            </div>
            
            <div className="z-10 bg-black/40 backdrop-blur-xl p-12 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center gap-6 max-w-md w-full mx-4 animate-slide-in">
                <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 to-yellow-600 mb-2 drop-shadow-sm">YANIK</h1>
                <p className="text-white/60 text-sm mb-8 tracking-widest uppercase">{t.menu.subtitle}</p>
                
                <button 
                    onClick={() => { playClickSound(); setCurrentView('LOBBY'); }} 
                    onMouseEnter={() => playHoverSound()}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-lg rounded-xl shadow-lg transform transition hover:-translate-y-1 flex items-center justify-center gap-3 group"
                >
                    <UserIcon className="w-6 h-6" />
                    <span>{t.menu.singlePlayer}</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0 duration-300">→</span>
                </button>
                
                <button disabled className="w-full py-4 bg-gray-800/50 text-white/30 font-bold text-lg rounded-xl border border-white/5 flex items-center justify-center gap-3 cursor-not-allowed grayscale">
                    <UsersIcon className="w-6 h-6" />
                    <span>{t.menu.multiplayer}</span>
                    <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded ml-auto">{t.menu.soon}</span>
                </button>

                <button 
                    onClick={() => { playClickSound(); setCurrentView('SETTINGS'); }} 
                    onMouseEnter={() => playHoverSound()}
                    className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-lg rounded-xl border border-white/10 flex items-center justify-center gap-3 transition-colors"
                >
                    <SettingsIcon className="w-5 h-5" />
                    <span>{t.menu.settings}</span>
                </button>

                <button 
                    onClick={() => { playClickSound(); setCurrentView('HOW_TO_PLAY'); }} 
                    onMouseEnter={() => playHoverSound()}
                    className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-lg rounded-xl border border-white/10 flex items-center justify-center gap-3 transition-colors"
                >
                    <BookOpenIcon className="w-5 h-5" />
                    <span>{t.menu.howToPlay}</span>
                </button>
            </div>
             <div className="absolute bottom-4 text-white/20 text-xs">v1.6.0</div>
        </div>
    )
  }

  if (currentView === 'HOW_TO_PLAY') {
      return (
        <div className="w-screen h-screen overflow-hidden flex flex-col items-center justify-center relative" style={{ background: getTableBackground() }}>
             <button 
                onClick={() => { playClickSound(); setCurrentView('MENU'); }} 
                onMouseEnter={() => playHoverSound()}
                className="absolute top-8 left-8 text-white/60 hover:text-white flex items-center gap-2 transition-colors z-20 font-bold"
             >
                <BackIcon className="w-5 h-5" /> {t.menu.back}
             </button>

             <div className="z-10 bg-black/40 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col gap-6 max-w-2xl w-full mx-4 animate-slide-in text-white h-[85vh]">
                <h2 className="text-3xl font-bold flex items-center gap-3"><BookOpenIcon /> {t.howToPlay.title}</h2>

                <div className="flex gap-2">
                    <button className="flex-1 py-2 bg-yellow-500 text-black font-bold rounded-t-lg">{t.menu.singlePlayer}</button>
                    <button className="flex-1 py-2 bg-white/10 text-white/40 font-bold rounded-t-lg cursor-not-allowed">{t.menu.multiplayer} ({t.menu.soon})</button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 text-white/90 space-y-6 text-sm md:text-base leading-relaxed">
                    <section>
                        <h3 className="text-yellow-400 font-bold text-lg mb-2">{t.howToPlay.objectiveTitle}</h3>
                        <p dangerouslySetInnerHTML={{__html: t.howToPlay.objectiveText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}}></p>
                    </section>

                    <section>
                        <h3 className="text-yellow-400 font-bold text-lg mb-2">{t.howToPlay.basicsTitle}</h3>
                        <ul className="list-disc pl-5 space-y-1 text-white/80">
                            <li>{t.howToPlay.basicsDeck}</li>
                            <li>{t.howToPlay.basicsDeal}</li>
                            <li>{t.howToPlay.basicsDirection}</li>
                            <li>{t.howToPlay.basicsTurn}</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-yellow-400 font-bold text-lg mb-2">{t.howToPlay.meldsTitle}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white/5 p-3 rounded">
                                <h4 className="font-bold text-blue-300">{t.howToPlay.seriesTitle}</h4>
                                <p className="text-xs">{t.howToPlay.seriesDesc}</p>
                                <p className="text-xs mt-1 italic">Ex: ♥5 - ♥6 - ♥7</p>
                            </div>
                            <div className="bg-white/5 p-3 rounded">
                                <h4 className="font-bold text-blue-300">{t.howToPlay.groupsTitle}</h4>
                                <p className="text-xs">{t.howToPlay.groupsDesc}</p>
                                <p className="text-xs mt-1 italic">Ex: ♥8 - ♠8 - ♦8</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-yellow-400 font-bold text-lg mb-2">{t.howToPlay.openingTitle}</h3>
                        <p className="mb-2">{t.howToPlay.openingDesc}</p>
                        <ul className="list-disc pl-5 space-y-2 text-white/80">
                            <li dangerouslySetInnerHTML={{__html: t.howToPlay.openingSeries.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}}></li>
                            <li dangerouslySetInnerHTML={{__html: t.howToPlay.openingPairs.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}}></li>
                            <li className="text-red-300 font-bold">{t.howToPlay.opening100Title}</li>
                            <p className="text-xs" dangerouslySetInnerHTML={{__html: t.howToPlay.opening100Desc.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}}></p>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-yellow-400 font-bold text-lg mb-2">{t.howToPlay.specialTitle}</h3>
                        <ul className="list-disc pl-5 space-y-2 text-white/80">
                            <li>{t.howToPlay.ruleAce}</li>
                            <li>{t.howToPlay.ruleJokers}</li>
                            <li>{t.howToPlay.ruleDiscard}</li>
                            <li>{t.howToPlay.ruleJokerPenalty.replace("chips", `${JOKER_DISCARD_PENALTY} ${t.game.chips}`)}</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-yellow-400 font-bold text-lg mb-2">{t.howToPlay.bettingTitle}</h3>
                        <ul className="list-disc pl-5 space-y-1 text-white/80">
                            <li>{t.howToPlay.bettingAnte}</li>
                            <li>{t.howToPlay.bettingPot}</li>
                            <li>{t.howToPlay.bettingGrand}</li>
                            <li dangerouslySetInnerHTML={{__html: t.howToPlay.bettingBurn.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}}></li>
                            <li>{t.howToPlay.bettingBankrupt}</li>
                        </ul>
                    </section>
                </div>
             </div>
        </div>
      );
  }

  if (currentView === 'SETTINGS') {
      return (
        <div className="w-screen h-screen overflow-hidden flex flex-col items-center justify-center relative" style={{ background: getTableBackground() }}>
             <button 
                onClick={() => { playClickSound(); setCurrentView('MENU'); }} 
                onMouseEnter={() => playHoverSound()}
                className="absolute top-8 left-8 text-white/60 hover:text-white flex items-center gap-2 transition-colors z-20 font-bold"
             >
                <BackIcon className="w-5 h-5" /> {t.menu.back}
             </button>

             <div className="z-10 bg-black/40 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col gap-6 max-w-md w-full mx-4 animate-slide-in text-white overflow-y-auto max-h-[90vh]">
                <h2 className="text-3xl font-bold flex items-center gap-3"><SettingsIcon /> {t.settings.title}</h2>
                
                {/* Language Settings */}
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
                    <h3 className="font-bold text-blue-300 flex gap-2 items-center"><GlobeIcon /> {t.settings.language}</h3>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => { playClickSound(); setGameSettings(prev => ({...prev, language: 'EN'})) }}
                            className={`flex-1 py-2 rounded border font-bold ${gameSettings.language === 'EN' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-white/5 border-white/10 text-white/50'}`}
                        >
                            English
                        </button>
                        <button 
                            onClick={() => { playClickSound(); setGameSettings(prev => ({...prev, language: 'TR'})) }}
                            className={`flex-1 py-2 rounded border font-bold ${gameSettings.language === 'TR' ? 'bg-red-600 border-red-400 text-white' : 'bg-white/5 border-white/10 text-white/50'}`}
                        >
                            Türkçe
                        </button>
                    </div>
                </div>

                {/* Visual Settings */}
                 <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
                    <h3 className="font-bold text-blue-300 flex gap-2 items-center"><PaletteIcon /> {t.settings.visuals}</h3>
                    
                    {/* Table Color */}
                    <div>
                        <div className="text-sm text-white/70 mb-2">{t.settings.tableColor}</div>
                        <div className="flex gap-2">
                             {(['GREEN', 'BLUE', 'RED', 'GRAY'] as const).map(color => (
                                 <button key={color}
                                    onClick={() => setGameSettings(prev => ({...prev, tableColor: color}))}
                                    className={`w-10 h-10 rounded-full border-2 shadow-lg transition-transform hover:scale-110 ${gameSettings.tableColor === color ? 'border-white scale-110' : 'border-transparent'}`}
                                    style={{
                                        background: color === 'GREEN' ? '#1e5c35' : 
                                                    color === 'BLUE' ? '#1e3a8a' :
                                                    color === 'RED' ? '#7f1d1d' : '#374151'
                                    }}
                                 />
                             ))}
                        </div>
                    </div>

                    {/* Card Back */}
                    <div>
                        <div className="text-sm text-white/70 mb-2">{t.settings.cardBack}</div>
                        <div className="flex gap-2">
                             {(['BLUE', 'RED', 'BLACK', 'GREEN'] as const).map(color => (
                                 <button key={color}
                                    onClick={() => setGameSettings(prev => ({...prev, cardBack: color}))}
                                    className={`w-12 h-16 rounded border-2 shadow-lg transition-transform hover:scale-110 ${gameSettings.cardBack === color ? 'border-yellow-400 scale-105' : 'border-white/20'}`}
                                 >
                                     <Card card={{id:'prev', suit:'S', rank:2, isJoker:false}} faceDown backColor={color} className="w-full h-full pointer-events-none" />
                                 </button>
                             ))}
                        </div>
                    </div>
                </div>

                {/* Timer Control */}
                <div>
                    <div className="flex justify-between mb-2">
                        <span className="font-semibold text-white/80">{t.settings.turnTimer}</span>
                        <span className="text-yellow-400 font-bold">{gameSettings.turnDuration}s</span>
                    </div>
                    <input type="range" min="15" max="60" step="5" value={gameSettings.turnDuration}
                        onChange={(e) => setGameSettings(prev => ({...prev, turnDuration: parseInt(e.target.value)}))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                    />
                </div>

                {/* Betting Settings */}
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
                    <h3 className="font-bold text-yellow-400 flex gap-2 items-center"><ChipIcon /> {t.settings.bettingRules}</h3>
                    
                    <div>
                        <div className="flex justify-between mb-1">
                            <span className="text-sm text-white/70">{t.settings.initialChips}</span>
                            <span className="font-bold">{gameSettings.initialChips}</span>
                        </div>
                        <input type="range" min="50" max="500" step="50" value={gameSettings.initialChips}
                            onChange={(e) => setGameSettings(prev => ({...prev, initialChips: parseInt(e.target.value)}))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between mb-1">
                            <span className="text-sm text-white/70">{t.settings.roundCost}</span>
                            <span className="font-bold">{gameSettings.roundCost}</span>
                        </div>
                        <input type="range" min="10" max="100" step="10" value={gameSettings.roundCost}
                            onChange={(e) => setGameSettings(prev => ({...prev, roundCost: parseInt(e.target.value)}))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                        />
                    </div>

                    {/* Re-entry Cost Selector */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <span className="text-sm text-white/70">{t.settings.reEntryCost}</span>
                            <span className="font-bold">{gameSettings.reEntryCost}</span>
                        </div>
                        <div className="flex gap-2">
                            {[5, 10, 20, 30, 40].map(val => (
                                <button
                                    key={val}
                                    onClick={() => { playClickSound(); setGameSettings(prev => ({ ...prev, reEntryCost: val })); }}
                                    onMouseEnter={() => playHoverSound()}
                                    className={`flex-1 py-1 rounded text-xs font-bold transition-all border ${
                                        gameSettings.reEntryCost === val 
                                        ? 'bg-purple-500 text-white border-purple-400' 
                                        : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                                    }`}
                                >
                                    {val}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Max Rounds Control */}
                <div>
                    <div className="flex justify-between mb-3">
                        <span className="font-semibold text-white/80">{t.settings.gameLength}</span>
                        <span className="text-yellow-400 font-bold">{gameSettings.maxRounds}</span>
                    </div>
                    <div className="flex gap-2">
                        {[5, 7, 9, 11].map(r => (
                            <button
                                key={r}
                                onClick={() => { playClickSound(); setGameSettings(prev => ({ ...prev, maxRounds: r })); }}
                                onMouseEnter={() => playHoverSound()}
                                className={`flex-1 py-2 rounded-lg font-bold transition-all border ${
                                    gameSettings.maxRounds === r 
                                    ? 'bg-yellow-500 text-black border-yellow-400' 
                                    : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                                }`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Volume Control */}
                <div>
                    <div className="flex justify-between mb-2">
                        <span className="font-semibold text-white/80">{t.settings.masterVolume}</span>
                        <span className="text-yellow-400 font-bold">{Math.round(gameSettings.masterVolume * 100)}%</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.05" value={gameSettings.masterVolume}
                        onChange={(e) => updateVolume(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                </div>

                {/* Music Toggle */}
                 <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
                        <div className="flex items-center gap-3">
                            <MusicIcon />
                            <span className="font-semibold">{t.settings.bgMusic}</span>
                        </div>
                        <button 
                            onClick={() => toggleMusic(!gameSettings.isMusicOn)}
                            onMouseEnter={() => playHoverSound()}
                            className={`w-14 h-8 rounded-full p-1 transition-colors ${gameSettings.isMusicOn ? 'bg-green-500' : 'bg-gray-600'}`}
                        >
                            <div className={`w-6 h-6 bg-white rounded-full shadow-sm transform transition-transform ${gameSettings.isMusicOn ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </button>
                    </div>

             </div>
        </div>
      );
  }

  if (currentView === 'LOBBY') {
    return (
        <div className="w-screen h-screen overflow-hidden flex flex-col items-center justify-center relative" style={{ background: getTableBackground() }}>
             <button 
                onClick={() => { playClickSound(); setCurrentView('MENU'); }} 
                onMouseEnter={() => playHoverSound()}
                className="absolute top-8 left-8 text-white/60 hover:text-white flex items-center gap-2 transition-colors z-20 font-bold"
             >
                <BackIcon className="w-5 h-5" /> {t.menu.back}
             </button>

             <div className="z-10 bg-black/40 backdrop-blur-xl p-12 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center gap-6 max-w-md w-full mx-4 animate-slide-in">
                <div className="w-24 h-24 bg-blue-600/20 rounded-full flex items-center justify-center mb-2 text-blue-400 border border-blue-400/30">
                    <UserIcon className="w-10 h-10" /> 
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">{t.menu.singlePlayer}</h2>
                <div className="text-white/60 text-center mb-8 text-sm space-y-2">
                    <p>{t.lobby.description}</p>
                    <p className="flex justify-center gap-2 items-center"><ChipIcon className="w-4 h-4" /> {t.lobby.startChips}{gameSettings.initialChips} {t.game.chips} | {t.lobby.bet}{gameSettings.roundCost}</p>
                    <p className="flex justify-center gap-2 items-center text-xs text-white/40">{t.lobby.reEntry}{gameSettings.reEntryCost}</p>
                    <p>{t.lobby.roundLimit} <span className="text-yellow-400 font-bold">{gameSettings.maxRounds}</span></p>
                </div>
                
                <button 
                    onClick={handleStartGame} 
                    onMouseEnter={() => playHoverSound()}
                    className="w-full py-5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold text-xl rounded-xl shadow-xl shadow-green-900/20 transform transition hover:scale-105 flex items-center justify-center gap-2 ring-4 ring-green-900/20"
                >
                    <PlayIcon className="w-6 h-6" />
                    {t.lobby.startGame}
                </button>
             </div>
        </div>
    )
  }

  // --- GAME VIEW ---

  if (!gameState) return <div className="text-white flex items-center justify-center h-screen">{t.menu.loading}</div>;

  const isMyTurn = gameState.currentPlayerIndex === 0;
  const iAmEliminated = gameState.players[0].isEliminated;

  // Render logic variables
  const currentPlayer = gameState.players[0];
  const handSize = currentPlayer.hand.length;
  // Rule: Cannot meld if hand size is low (Need 1 card to discard)
  // Series Mode: Min meld is 3. If hand <= 3, cannot meld (3 melded = 0 left).
  // Pairs Mode: Min meld is 2. If hand <= 2, cannot meld (2 melded = 0 left).
  const isSeriesOpen = currentPlayer.hasOpened && currentPlayer.openingType === 'series';
  const isPairsOpen = currentPlayer.hasOpened && currentPlayer.openingType === 'pairs';
  const isMeldRestrictedByHandSize = 
      (isSeriesOpen && handSize <= 3) || 
      (isPairsOpen && handSize <= 2);

  const currentHandScore = calculateHandScore(currentPlayer.hand);

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: getTableBackground() }}>
      
      {toastMessage && <Toast message={toastMessage} onClose={handleCloseToast} />}

      {/* --- Top Bar --- */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start pointer-events-none z-50">
          <div className="pointer-events-auto flex items-start gap-4">
              <div className="bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-lg text-white">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-yellow-400 font-bold text-xl tracking-wider">YANIK</span>
                </div>
                <div className="text-sm opacity-90">{gameState.message}</div>
                <div className="flex gap-2 mt-2">
                    <button 
                        onClick={() => { playClickSound(); initGame(false); }} 
                        onMouseEnter={() => playHoverSound()}
                        className="text-xs flex items-center gap-1 hover:text-yellow-300 transition-colors bg-white/10 px-2 py-1 rounded"
                    >
                        <RestartIcon className="w-3 h-3" /> {t.menu.restart}
                    </button>
                    <button 
                        onClick={() => { playClickSound(); handleExitToMenu(); }} 
                        onMouseEnter={() => playHoverSound()}
                        className="text-xs flex items-center gap-1 hover:text-red-300 transition-colors bg-white/10 px-2 py-1 rounded"
                    >
                        <HomeIcon className="w-3 h-3" /> {t.menu.exit}
                    </button>
                </div>
              </div>

              {/* Pot Info */}
              <div className="bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-lg text-white flex flex-col gap-1">
                  <div className="text-[10px] uppercase text-white/50 tracking-wider">{t.game.pots}</div>
                  <div className="flex items-center gap-2 text-yellow-400">
                      <span className="text-xs text-white/70">{t.game.round}:</span>
                      <ChipIcon className="w-4 h-4" />
                      <span className="font-bold">{gameState.roundPot}</span>
                  </div>
                  <div className="flex items-center gap-2 text-purple-400">
                      <span className="text-xs text-white/70">{t.game.grand}:</span>
                      <ChipIcon className="w-4 h-4" />
                      <span className="font-bold">{gameState.grandPot}</span>
                  </div>
              </div>

              {/* Timer Panel */}
              {gameState.phase !== GamePhase.GAME_OVER && gameState.phase !== GamePhase.ROUND_OVER && (
                 <div className="bg-black/40 backdrop-blur-md p-2 rounded-full border border-white/10 shadow-lg text-white">
                    <TimerCircle timeLeft={timeLeft} maxTime={gameSettings.turnDuration} />
                 </div>
              )}
          </div>

          {/* Scoreboard */}
          <div className="pointer-events-auto bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-lg text-white text-right">
              <div className="flex justify-between items-center mb-2 gap-4">
                 <div className="text-xs uppercase tracking-widest text-white/50">{t.game.scoreboard}</div>
                 <div className="text-[10px] bg-white/20 px-1.5 rounded text-white">R{gameState.round}/{gameState.maxRounds}</div>
              </div>
              {gameState.players.map(p => (
                 <div key={p.id} className={`flex justify-between w-48 ${gameState.currentPlayerIndex === p.id ? "text-yellow-400 font-bold" : "text-white/80"}`}>
                     <span className={`${p.isBankrupt ? 'text-gray-500 font-bold' : (p.isEliminated ? 'line-through decoration-red-500 decoration-2 text-red-300' : '')}`}>
                        {p.name} {p.isBankrupt && "(B)"}
                     </span>
                     <div className="flex gap-2 items-center">
                         {!p.isBankrupt && <span className="text-yellow-500 text-xs flex items-center gap-0.5"><ChipIcon className="w-3 h-3"/>{p.chips}</span>}
                         <span className={`font-mono w-6 text-right ${p.totalScore > gameState.scoreLimit ? 'text-red-500 font-bold' : 'text-green-400'}`}>{p.totalScore}</span>
                     </div>
                 </div>
              ))}
          </div>
      </div>

      {/* --- Opponents --- */}
      {/* Top Bot (2) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 mt-6 flex flex-col items-center z-10">
          <div className={`mb-4 px-3 py-1 rounded-full bg-black/50 text-white backdrop-blur border text-xs flex items-center gap-2 ${gameState.currentPlayerIndex === 2 ? 'border-yellow-400 text-yellow-100' : 'border-white/10'}`}>
              <RobotIcon /> {gameState.players[2].name}
          </div>
          {gameState.players[2].isBankrupt ? (
              <div className="text-gray-500 font-bold bg-black/50 px-3 py-1 rounded">{t.game.bankrupt}</div>
          ) : (
             <div className="flex -space-x-5 scale-110">
               {gameState.players[2].hand.map((c, i) => (
                   <div key={i} style={{zIndex: i}}><Card card={c} faceDown backColor={gameSettings.cardBack} className="shadow-lg border-white/20 md:w-14 md:h-20" /></div>
               ))}
             </div>
          )}
          <div className="flex flex-wrap gap-2 justify-center mt-4 scale-90 origin-top min-h-[40px]">
             {gameState.openedMelds.filter(m => m.playerId === 2).map(m => renderMeld(m))}
          </div>
      </div>

      {/* Left Bot (3) */}
      <div className="absolute left-4 top-[40%] -translate-y-1/2 flex items-center z-10">
         <div className="flex flex-col items-center mr-6">
            {gameState.players[3].isBankrupt ? (
                <div className="text-gray-500 font-bold bg-black/50 px-3 py-1 rounded mb-4">{t.game.bankrupt}</div>
            ) : (
                <div className="flex flex-col -space-y-9 scale-110 origin-left">
                    {gameState.players[3].hand.map((c, i) => (
                        <div key={i} style={{zIndex: i}}><Card card={c} faceDown backColor={gameSettings.cardBack} className="shadow-lg border-white/20 md:w-[55px] md:h-[78px]" /></div>
                    ))}
                </div>
            )}
            <div className={`mt-4 px-3 py-1 rounded-full bg-black/50 text-white backdrop-blur border text-xs flex items-center gap-2 ${gameState.currentPlayerIndex === 3 ? 'border-yellow-400 text-yellow-100' : 'border-white/10'}`}>
                <RobotIcon /> {gameState.players[3].name}
            </div>
         </div>
         <div className="flex flex-col gap-2 max-h-[60vh] flex-wrap content-start scale-90 origin-left">
             {gameState.openedMelds.filter(m => m.playerId === 3).map(m => renderMeld(m))}
         </div>
      </div>

      {/* Right Bot (1) Hand */}
      <div className="absolute right-4 top-[40%] -translate-y-1/2 z-10 flex flex-row items-center">
          {gameState.players[1].isBankrupt ? (
              <div className="text-gray-500 font-bold bg-black/50 px-3 py-1 rounded mr-4">{t.game.bankrupt}</div>
          ) : (
              <div className="flex flex-col -space-y-9 scale-110 origin-right">
                  {gameState.players[1].hand.map((c, i) => (
                      <div key={i} style={{zIndex: i}}><Card card={c} faceDown backColor={gameSettings.cardBack} className="shadow-lg border-white/20 md:w-[55px] md:h-[78px]" /></div>
                  ))}
              </div>
          )}
          <div className={`ml-4 px-3 py-1 rounded-full bg-black/50 text-white backdrop-blur border text-xs flex items-center gap-2 ${gameState.currentPlayerIndex === 1 ? 'border-yellow-400 text-yellow-100' : 'border-white/10'}`}>
              <RobotIcon /> {gameState.players[1].name}
          </div>
      </div>

      {/* Right Bot (1) Melds - Adjusted position further left to avoid overlap */}
      <div className="absolute right-36 top-[35%] -translate-y-1/2 z-10 flex flex-col gap-2 max-h-[50vh] flex-wrap content-end scale-90 origin-right">
         {gameState.openedMelds.filter(m => m.playerId === 1).map(m => renderMeld(m))}
      </div>

      {/* --- CENTER BOARD --- */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-8 pointer-events-auto items-center justify-center p-8 rounded-full bg-emerald-900/40 backdrop-blur-sm border border-emerald-400/20 shadow-2xl z-20">
            {/* Draw Pile */}
            <div className={`relative group w-24 h-36 md:w-28 md:h-40 ${iAmEliminated ? 'cursor-default grayscale' : 'cursor-pointer'}`} onClick={() => !iAmEliminated && handleDraw(false)}>
                {gameState.deck.length > 0 ? (
                    <>
                        {[1,2,3].map(i => (
                            <div key={i} className={`absolute top-0 left-0 w-full h-full bg-blue-950 rounded-lg border border-white/10`} style={{transform: `translate(${i}px, ${i}px)`}}></div>
                        ))}
                        <Card card={gameState.deck[0]} faceDown backColor={gameSettings.cardBack} className="w-full h-full shadow-2xl group-hover:-translate-y-2 transition-transform relative z-10" />
                        <div className="absolute -bottom-8 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                            {!iAmEliminated && <span className="bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">{t.game.draw}</span>}
                        </div>
                        <div className="absolute bottom-2 right-2 z-20 bg-black/70 text-white text-xs font-bold px-1.5 py-0.5 rounded border border-white/20">
                            {gameState.deck.length}
                        </div>
                    </>
                ) : (
                    <div className="w-full h-full border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center text-white/20 font-bold">{t.game.recycle}</div>
                )}
            </div>

            {/* Discard Pile */}
            <div className={`relative group w-24 h-36 md:w-28 md:h-40 ${iAmEliminated ? 'cursor-default grayscale' : 'cursor-pointer'}`} onClick={() => !iAmEliminated && handleDraw(true)}>
                {gameState.discardPile.length > 0 ? (
                    <>
                        {gameState.discardPile.length > 1 && (
                            <div className="absolute top-0 left-0 w-full h-full rotate-3 opacity-60">
                                <Card card={gameState.discardPile[gameState.discardPile.length - 2]} className="w-full h-full" />
                            </div>
                        )}
                        <Card card={gameState.discardPile[gameState.discardPile.length - 1]} className="w-full h-full shadow-2xl" />
                        
                        {isMyTurn && gameState.phase === GamePhase.DRAW && !iAmEliminated && (
                            <div className="absolute -top-3 -right-3 animate-bounce z-30">
                                <div className="bg-green-500 text-white p-1 rounded-full shadow-lg border-2 border-white"><CheckIcon /></div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="w-full h-full border-2 border-dashed border-white/30 rounded-lg flex items-center justify-center text-white/30 font-bold tracking-wide text-xs">{t.game.discard}</div>
                )}
            </div>
      </div>

      {/* --- Human Player (Bottom) --- */}
      <div className="absolute bottom-0 left-0 w-full z-40 flex items-end">
          
          {/* Main Hand Controls & Cards */}
          <div className="flex-1 flex flex-col items-center pb-2 relative bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-12">
            
            {/* Action Buttons (Hide if Eliminated) */}
            {!iAmEliminated && (
                <div className="absolute bottom-[220px] md:bottom-[250px] flex gap-2 pointer-events-auto z-50">
                    <div className="bg-black/60 backdrop-blur rounded-full p-1.5 flex mr-4 border border-white/20 shadow-xl">
                        <button onClick={() => handleSortHand(true)} className="p-2 text-white/80 hover:text-yellow-400 hover:bg-white/10 rounded-full transition-colors" title={t.game.sortSuit}>
                            <SortAlphaIcon />
                        </button>
                        <div className="w-px bg-white/10 mx-1 my-1"></div>
                        <button onClick={() => handleSortHand(false)} className="p-2 text-white/80 hover:text-yellow-400 hover:bg-white/10 rounded-full transition-colors" title={t.game.sortRank}>
                            <SortNumIcon />
                        </button>
                    </div>

                    {isMyTurn && gameState.phase === GamePhase.ACTION && (
                        <>
                            <button 
                                onClick={createMeld}
                                title={isMeldRestrictedByHandSize ? t.toasts.mustKeepDiscard : ''}
                                disabled={selectedCards.length < 2 || isMeldRestrictedByHandSize}
                                className={`
                                    h-10 px-6 rounded-full font-bold shadow-lg flex items-center gap-2 transition-all border border-white/10
                                    ${(selectedCards.length >= 2 && !isMeldRestrictedByHandSize) 
                                        ? 'bg-blue-600 text-white hover:bg-blue-500 hover:scale-105' 
                                        : 'bg-gray-800/80 text-white/30 cursor-not-allowed'}
                                `}
                            >
                                <LayersIcon />
                                <span>{gameState.players[0].hasOpened ? t.game.openMeld : t.game.prepareMeld}</span>
                            </button>
                            
                            <button 
                                onClick={discardSelected}
                                disabled={selectedCards.length !== 1}
                                className={`
                                    h-10 px-6 rounded-full font-bold shadow-lg flex items-center gap-2 transition-all border border-white/10
                                    ${selectedCards.length === 1 
                                        ? 'bg-red-600 text-white hover:bg-red-500 hover:scale-105' 
                                        : 'bg-gray-800/80 text-white/30 cursor-not-allowed'}
                                `}
                            >
                                <TrashIcon />
                                <span>{t.game.discardBtn}</span>
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Hand / Spectator Status */}
            <div className="w-full max-w-4xl mx-auto h-32 md:h-40 flex justify-center items-end perspective-container px-4">
                 {gameState.players[0].isBankrupt ? (
                     <div className="flex flex-col items-center mb-10 gap-2">
                        <div className="text-gray-500 font-bold text-4xl bg-black/80 px-8 py-4 rounded-xl border-4 border-gray-600 animate-pulse">{t.game.bankrupt}</div>
                        <div className="text-yellow-400 font-mono tracking-widest text-sm bg-black/50 px-4 py-1 rounded-full uppercase">{t.game.spectator}</div>
                     </div>
                 ) : gameState.players[0].isEliminated ? (
                     <div className="flex flex-col items-center mb-10 gap-2">
                        <div className="text-red-500 font-bold text-2xl bg-black/50 px-4 py-2 rounded-xl">{t.game.eliminated}</div>
                        <div className="text-yellow-400 font-mono tracking-widest text-sm bg-black/50 px-4 py-1 rounded-full uppercase">{t.game.spectator} - {t.game.waiting}</div>
                     </div>
                 ) : (
                     <div className="flex -space-x-8 md:-space-x-12 overflow-visible hover:-space-x-6 transition-all duration-300 pb-2">
                        {gameState.players[0].hand.map((card, index) => (
                            <div 
                                key={card.id} 
                                style={{ zIndex: index }}
                                className="transform transition-all duration-200 origin-bottom hover:z-[100] hover:scale-110 hover:-translate-y-6"
                            >
                                <Card 
                                    card={card} 
                                    selected={selectedCards.includes(card.id)}
                                    onClick={() => isMyTurn ? toggleSelectCard(card.id) : null}
                                    onDoubleClick={() => handleAttemptDiscard(card.id)}
                                    draggable={true}
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragEnter={(e) => handleDragEnter(e, index)}
                                    onDragOver={handleDragOver}
                                />
                            </div>
                        ))}
                     </div>
                 )}
            </div>
            
            <div className="mb-2 px-4 py-1 rounded-full bg-black/60 text-white backdrop-blur border flex gap-4 items-center border-yellow-400/50">
                 <div className="flex items-center gap-2 border-r border-white/20 pr-4">
                    <UserIcon />
                    <span className="font-bold text-yellow-100">{t.game.yourHand}</span>
                 </div>
                 <div className="flex items-center gap-1 text-yellow-400">
                     <ChipIcon />
                     <span className="font-mono font-bold">{gameState.players[0].chips}</span>
                 </div>
                 <div className="flex items-center gap-2 border-l border-white/20 pl-4">
                    <span className="text-xs text-white/70 uppercase font-bold tracking-wider">{t.game.handScore}</span>
                    <span className={`font-mono font-bold text-lg ${currentHandScore > 25 ? 'text-red-400' : 'text-green-400'}`}>
                        {currentHandScore}
                    </span>
                 </div>
            </div>
          </div>

          {/* Right Sidebar: Opened Melds + Preparation Area */}
          <div className="w-72 max-h-[50vh] bg-black/20 backdrop-blur-sm border-l border-white/10 p-2 overflow-y-auto hidden md:flex flex-col gap-2 z-50">
              
              {!gameState.players[0].hasOpened && !iAmEliminated && (
                  <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-xl p-3 mb-2 flex-shrink-0">
                      <div className="flex justify-between items-center mb-2">
                          <span className="text-yellow-400 text-xs uppercase font-bold tracking-wider">{t.game.preparation}</span>
                          <div className="flex gap-2">
                              <button 
                                onClick={() => {
                                    if(stagedMelds.length > 0) {
                                        showToast(t.toasts.clearStaged); 
                                        return;
                                    }
                                    setPreparePairsMode(!preparePairsMode);
                                }}
                                className={`text-[10px] px-2 py-0.5 rounded border ${preparePairsMode ? 'bg-purple-600 border-purple-400 text-white' : 'bg-gray-700 border-gray-500 text-gray-300'}`}
                              >
                                {preparePairsMode ? t.game.pairsMode : t.game.seriesMode}
                              </button>
                              
                              {stagedMelds.length > 0 && (
                                <button onClick={cancelStagedMelds} className="text-[10px] text-red-300 hover:text-red-100 bg-red-900/50 px-2 py-0.5 rounded">
                                    {t.game.cancel}
                                </button>
                              )}
                          </div>
                      </div>
                      
                      <div className="space-y-2 min-h-[60px] flex flex-col items-center justify-center">
                          {stagedMelds.length === 0 ? (
                              <span className="text-white/20 text-xs text-center px-4">
                                  {preparePairsMode ? t.toasts.pairsSelectTwo : t.toasts.invalidMeld}
                              </span>
                          ) : (
                              stagedMelds.map(m => renderMeld(m, true))
                          )}
                      </div>

                      <button 
                        onClick={confirmOpenHand}
                        disabled={preparePairsMode ? stagedMelds.length < 4 : stagedMelds.length < 2}
                        className={`w-full mt-3 py-2 rounded-lg text-xs font-bold transition-colors shadow-lg
                            ${(preparePairsMode ? stagedMelds.length >= 4 : stagedMelds.length >= 2)
                                ? 'bg-green-600 hover:bg-green-500 text-white border border-green-400 animate-pulse' 
                                : 'bg-gray-700 text-gray-500 cursor-not-allowed'}
                        `}
                      >
                         {preparePairsMode 
                            ? (stagedMelds.length >= 4 ? t.game.openPairsNow : t.game.needPairs)
                            : (stagedMelds.length >= 2 ? t.game.openSeriesNow : t.game.needSeries)
                         }
                      </button>
                  </div>
              )}

              <div className="text-white/50 text-xs uppercase font-bold tracking-wider mb-2 sticky top-0">{t.game.yourOpenedMelds}</div>
              {gameState.openedMelds.filter(m => m.playerId === 0).length === 0 ? (
                  <div className="text-white/20 text-center mt-4 text-sm italic">{t.game.noMelds}</div>
              ) : (
                  gameState.openedMelds.filter(m => m.playerId === 0).map(m => renderMeld(m))
              )}
          </div>
      </div>
      
      {/* --- Round/Game Over Overlay --- */}
      {(gameState.phase === GamePhase.ROUND_OVER || gameState.phase === GamePhase.GAME_OVER) && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="bg-gradient-to-br from-white to-gray-100 p-8 rounded-3xl shadow-2xl text-center max-w-md w-full border-4 border-yellow-400 transform scale-100 animate-slide-in">
                {gameState.phase === GamePhase.GAME_OVER ? (
                   <>
                       <div className="text-6xl mb-4">🏆</div>
                       <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 mb-2">
                           {t.game.gameOver}
                       </h2>
                       {/* Distribute Grand Pot Logic Visual */}
                       <div className="mb-4">
                           <div className="text-sm uppercase text-gray-500 font-bold mb-2">{t.game.finalPot}</div>
                           <div className="flex justify-center gap-4 text-lg font-bold text-purple-600">
                               <div className="flex items-center gap-1"><ChipIcon /> {gameState.grandPot}</div>
                           </div>
                           
                           {/* Show Pot Split if available */}
                           {finalPotSplit && finalPotSplit.length > 0 && (
                               <div className="mt-2 text-sm bg-purple-50 p-2 rounded border border-purple-200">
                                   <div className="text-xs text-purple-400 uppercase font-bold mb-1">{t.game.potShare}</div>
                                   {finalPotSplit.map((share, idx) => (
                                       <div key={idx} className="flex justify-between px-4">
                                           <span className="text-gray-600 font-semibold">{share.name}</span>
                                           <span className="text-green-600 font-bold">+{share.amount}</span>
                                       </div>
                                   ))}
                               </div>
                           )}

                           <p className="text-xs text-gray-400 mt-1">
                               {gameState.message}
                           </p>
                       </div>
                       
                       {/* Calculate Final Chip Standings including Grand Pot */}
                       {(() => {
                           const sorted = [...gameState.players].sort((a,b) => b.chips - a.chips);
                           return (
                               <div className="text-2xl font-bold text-gray-800 mb-6">
                                   {t.game.winner}: {sorted[0].name} ({sorted[0].chips} {t.game.chips})
                               </div>
                           )
                       })()}
                   </>
                ) : (
                    <>
                       <div className="text-6xl mb-4">🏁</div>
                       <h2 className="text-2xl font-bold text-gray-800 mb-2">{t.game.roundComplete} {gameState.round}</h2>
                       <div className="text-xl text-yellow-600 font-bold mb-6">{gameState.message}</div>
                    </>
                )}
                
                <div className="space-y-3 mb-8 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="flex justify-between text-xs text-gray-400 uppercase font-bold border-b pb-1">
                        <span>{t.game.player}</span>
                        <span>{t.game.totalPts}</span>
                        <span>{t.game.chips}</span>
                    </div>
                    {[...gameState.players].sort((a,b) => a.totalScore - b.totalScore).map(p => (
                        <div key={p.id} className="flex justify-between items-center py-1">
                            <span className={`font-semibold text-gray-700 ${p.isBankrupt ? 'line-through text-gray-400' : p.isEliminated ? 'line-through text-red-400' : ''}`}>
                                {p.name} {p.isBankrupt && "(B)"}
                            </span>
                            <span className="font-bold text-gray-900 bg-gray-200 px-2 py-0.5 rounded-md">{p.totalScore}</span>
                            <span className="font-bold text-yellow-600 flex items-center gap-1"><ChipIcon className="w-3 h-3"/>{p.chips}</span>
                        </div>
                    ))}
                </div>
                
                {gameState.phase !== GamePhase.GAME_OVER ? (
                    <button 
                        onClick={handleNextRound}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-lg rounded-xl shadow-lg transform transition hover:-translate-y-1 flex items-center justify-center gap-2"
                    >
                        <PlayIcon /> {t.game.startRound} {gameState.round + 1}
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button 
                            onClick={() => { playClickSound(); setGameState(null); setIsDealing(false); setCurrentView('MENU'); }}
                            className="flex-1 py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold text-lg rounded-xl shadow-lg transform transition hover:-translate-y-1"
                        >
                            {t.menu.mainMenu}
                        </button>
                        <button 
                            onClick={handleStartGame}
                            className="flex-1 py-4 bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300 text-black font-bold text-lg rounded-xl shadow-lg transform transition hover:-translate-y-1"
                        >
                            {t.menu.newGame}
                        </button>
                    </div>
                )}
            </div>
        </div>
      )}

    </div>
  );
};

export default App;
