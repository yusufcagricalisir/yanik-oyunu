
import React from 'react';
import { CardData } from '../types';

interface CardProps {
  card: CardData;
  onClick?: () => void;
  onDoubleClick?: () => void; // New prop
  selected?: boolean;
  small?: boolean;
  medium?: boolean;
  faceDown?: boolean;
  backColor?: 'BLUE' | 'RED' | 'BLACK' | 'GREEN'; 
  className?: string;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnter?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

const SuitIcon = ({ suit, className = "" }: { suit: string, className?: string }) => {
  switch (suit) {
    case 'H': return <span className={`text-red-600 ${className}`}>♥</span>;
    case 'D': return <span className={`text-red-600 ${className}`}>♦</span>;
    case 'C': return <span className={`text-slate-900 ${className}`}>♣</span>;
    case 'S': return <span className={`text-slate-900 ${className}`}>♠</span>;
    case 'Joker': return <span className={`text-purple-600 ${className}`}>★</span>;
    default: return null;
  }
};

const FaceCardArt = ({ rank, suit }: { rank: number, suit: string }) => {
    const colorClass = (suit === 'H' || suit === 'D') ? 'fill-red-600 stroke-red-800' : 'fill-slate-800 stroke-black';
    const accentClass = (suit === 'H' || suit === 'D') ? 'fill-red-200' : 'fill-slate-300';
    
    // King
    if (rank === 13) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-1 border-2 border-gray-400/30 rounded bg-yellow-50/50">
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                    {/* Crown Background */}
                    <path d="M20 80 L20 40 L35 55 L50 30 L65 55 L80 40 L80 80 Z" fill="#FBBF24" stroke="currentColor" strokeWidth="2" />
                    {/* Face Base */}
                    <rect x="35" y="55" width="30" height="35" rx="5" fill="#FFE4C4" />
                    {/* Beard */}
                    <path d="M35 80 Q50 95 65 80 L65 75 L35 75 Z" className={colorClass} />
                    {/* Eyes */}
                    <circle cx="43" cy="65" r="2" fill="black" />
                    <circle cx="57" cy="65" r="2" fill="black" />
                    {/* Nose */}
                    <path d="M50 65 L48 72 L52 72 Z" fill="#D2B48C" />
                    {/* Mustache */}
                    <path d="M42 75 Q50 72 58 75" stroke="black" strokeWidth="2" fill="none" />
                    {/* Suit Symbol on Chest */}
                    <g transform="translate(45, 82) scale(0.4)">
                         {/* Simple placeholder shape for suit, real suit is color */}
                         <circle cx="12" cy="12" r="10" className={accentClass} />
                    </g>
                </svg>
            </div>
        );
    }
    // Queen
    if (rank === 12) {
        return (
             <div className="w-full h-full flex flex-col items-center justify-center p-1 border-2 border-gray-400/30 rounded bg-yellow-50/50">
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                     {/* Hair */}
                     <path d="M30 90 Q30 40 50 30 Q70 40 70 90" fill="#DAA520" stroke="currentColor" strokeWidth="1" />
                     {/* Crown */}
                     <path d="M35 40 L35 25 L45 35 L50 20 L55 35 L65 25 L65 40 Z" fill="#FBBF24" stroke="currentColor" strokeWidth="1" />
                     {/* Face */}
                     <ellipse cx="50" cy="60" rx="14" ry="18" fill="#FFE4C4" />
                     {/* Eyes */}
                     <circle cx="45" cy="58" r="1.5" fill="black" />
                     <circle cx="55" cy="58" r="1.5" fill="black" />
                     {/* Mouth */}
                     <path d="M47 68 Q50 71 53 68" stroke="#C00" strokeWidth="1" fill="none" />
                     {/* Necklace */}
                     <path d="M40 75 Q50 85 60 75" stroke="#FBBF24" strokeWidth="2" fill="none" />
                </svg>
            </div>
        );
    }
    // Jack
    if (rank === 11) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-1 border-2 border-gray-400/30 rounded bg-yellow-50/50">
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                     {/* Hat */}
                     <path d="M30 45 L50 30 L70 45 L70 50 L30 50 Z" className={colorClass} stroke="currentColor" strokeWidth="1" />
                     <rect x="35" y="45" width="30" height="5" fill="#333" />
                     {/* Face */}
                     <rect x="38" y="50" width="24" height="30" rx="4" fill="#FFE4C4" />
                     {/* Hair */}
                     <path d="M38 50 L38 70 Q35 70 35 60 L35 50 Z" fill="#8B4513" />
                     <path d="M62 50 L62 70 Q65 70 65 60 L65 50 Z" fill="#8B4513" />
                     {/* Eyes */}
                     <circle cx="45" cy="60" r="1.5" fill="black" />
                     <circle cx="55" cy="60" r="1.5" fill="black" />
                     {/* Mouth */}
                     <rect x="47" y="70" width="6" height="1" fill="black" />
                     {/* Collar */}
                     <path d="M30 80 L50 90 L70 80 L70 95 L30 95 Z" className={accentClass} />
                </svg>
            </div>
        );
    }
    return null;
};

const Card: React.FC<CardProps> = ({ 
  card, 
  onClick,
  onDoubleClick,
  selected, 
  small, 
  medium,
  faceDown,
  backColor = 'BLUE',
  className = '',
  draggable,
  onDragStart,
  onDragEnter,
  onDragOver,
  onDrop
}) => {
  const rankDisplay = (r: number, isJoker: boolean) => {
    if (isJoker) return 'J';
    if (r === 11) return 'J';
    if (r === 12) return 'Q';
    if (r === 13) return 'K';
    if (r === 14) return 'A';
    return r;
  };

  // --- Size Classes Configuration ---
  
  // Default (Main Hand) - Now Bigger Text/Icons
  let sizeClass = 'w-20 h-28 md:w-24 md:h-36'; 
  let fontSizeClass = 'text-2xl md:text-4xl'; 
  let smallIconSize = 'text-lg md:text-xl'; 
  let centerIconSize = 'text-5xl md:text-7xl'; 

  if (small) {
    sizeClass = 'w-8 h-12';
    fontSizeClass = 'text-xs';
    smallIconSize = 'text-[8px]';
    centerIconSize = 'text-xl';
  }
  
  if (medium) {
    // Used for Melds on Table
    sizeClass = 'w-14 h-20 md:w-16 md:h-24';
    fontSizeClass = 'text-xl md:text-2xl';
    smallIconSize = 'text-sm md:text-base';
    centerIconSize = 'text-4xl md:text-5xl';
  }

  // Override size if className provides width/height
  const hasCustomSize = className.includes('w-') && className.includes('h-');
  const finalSizeClass = hasCustomSize ? '' : sizeClass;

  const baseClasses = `
    relative rounded-lg shadow-[1px_1px_3px_rgba(0,0,0,0.3)] select-none
    transition-transform duration-200
    ${className}
  `;

  if (faceDown) {
    let bgClasses = 'bg-blue-900 border-white/80';
    let gradient = 'repeating-linear-gradient(45deg, #1e3a8a 0, #1e3a8a 10px, #2345a0 10px, #2345a0 20px)';
    let accentColor = 'bg-blue-500/50';
    let borderColor = 'border-blue-400/30';

    if (backColor === 'RED') {
        bgClasses = 'bg-red-900 border-white/80';
        gradient = 'repeating-linear-gradient(45deg, #7f1d1d 0, #7f1d1d 10px, #991b1b 10px, #991b1b 20px)';
        accentColor = 'bg-red-500/50';
        borderColor = 'border-red-400/30';
    } else if (backColor === 'BLACK') {
        bgClasses = 'bg-gray-900 border-white/80';
        gradient = 'repeating-linear-gradient(45deg, #111827 0, #111827 10px, #374151 10px, #374151 20px)';
        accentColor = 'bg-gray-500/50';
        borderColor = 'border-gray-400/30';
    } else if (backColor === 'GREEN') {
        bgClasses = 'bg-emerald-900 border-white/80';
        gradient = 'repeating-linear-gradient(45deg, #064e3b 0, #064e3b 10px, #065f46 10px, #065f46 20px)';
        accentColor = 'bg-emerald-500/50';
        borderColor = 'border-emerald-400/30';
    }

    return (
      <div 
        className={`
          ${baseClasses}
          ${bgClasses} border-2
          ${finalSizeClass} 
        `}
        style={{
             backgroundImage: gradient,
        }}
        onClick={onClick}
      >
        <div className={`absolute inset-1 border ${borderColor} rounded-md`}></div>
        <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-8 h-8 rounded-full ${accentColor} blur-sm`}></div>
        </div>
      </div>
    );
  }

  const textColor = (card.suit === 'H' || card.suit === 'D') ? 'text-red-600' : (card.suit === 'Joker' ? 'text-purple-600' : 'text-slate-900');
  
  // Is it a face card? (J, Q, K)
  const isFaceCard = !card.isJoker && card.rank >= 11 && card.rank <= 13;

  return (
    <div
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`
        ${baseClasses}
        bg-gray-50 flex flex-col justify-between p-1.5 md:p-2 border border-gray-300
        ${finalSizeClass}
        ${selected ? '-translate-y-8 md:-translate-y-10 ring-4 ring-yellow-400 z-30 shadow-2xl' : 'hover:-translate-y-2 hover:shadow-lg'}
        cursor-pointer
      `}
    >
      {/* Top Left */}
      <div className="flex flex-col items-center absolute top-1 left-1 md:top-2 md:left-2 leading-none z-10">
            <span className={`font-black tracking-tighter ${textColor} ${fontSizeClass}`}>
                {rankDisplay(card.rank, card.isJoker)}
            </span>
            <span className={`${textColor} ${smallIconSize} mt-[-2px]`}>
                <SuitIcon suit={card.suit} />
            </span>
      </div>
      
      {/* Center Graphic */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4 md:p-6">
        {isFaceCard && !small ? (
            <div className="w-full h-full opacity-90">
                <FaceCardArt rank={card.rank} suit={card.suit} />
            </div>
        ) : (
            <div className={`opacity-100 ${centerIconSize}`}>
                <SuitIcon suit={card.suit} />
            </div>
        )}
      </div>

      {/* Bottom Right (Rotated) */}
      <div className="flex flex-col items-center absolute bottom-1 right-1 md:bottom-2 md:right-2 leading-none rotate-180 z-10">
            <span className={`font-black tracking-tighter ${textColor} ${fontSizeClass}`}>
                {rankDisplay(card.rank, card.isJoker)}
            </span>
            <span className={`${textColor} ${smallIconSize} mt-[-2px]`}>
                <SuitIcon suit={card.suit} />
            </span>
      </div>
    </div>
  );
};

export default Card;
