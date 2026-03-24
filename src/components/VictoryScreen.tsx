import React from 'react';
import { motion } from 'motion/react';
import { ICONS } from '../icons';
import { useGame } from '../context/GameContext';
import { Screen } from '../types';
import { cn } from '../lib/utils';

interface VictoryScreenProps {
  onAction: (screen: Screen) => void;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({ onAction }) => {
  const { gameOverResult, gameState, session, leaveMatch, resetGame } = useGame();

  const myUserId = session?.user_id || '';
  const isWinner = gameOverResult?.winner === myUserId;
  const isDraw = gameOverResult?.winner === 'draw' || gameOverResult?.reason === 'draw';

  const resultTitle = isDraw ? 'DRAW' : isWinner ? 'VICTORY' : 'DEFEAT';
  const resultSubtext = isDraw
    ? 'Neither commander has claimed the sector'
    : isWinner
      ? 'Commander, the sector is secured'
      : 'The enemy has claimed this sector';

  const resultColor = isDraw ? 'text-secondary' : isWinner ? 'text-primary' : 'text-tertiary';
  const glowClass = isDraw ? '' : isWinner ? 'glow-text-primary' : '';

  // Efficiency rating based on move count
  const rating = (gameOverResult?.moveCount || 0) <= 5 ? 'A+' : (gameOverResult?.moveCount || 0) <= 7 ? 'A' : 'B';
  const ratingText = rating === 'A+' ? 'Excellent' : rating === 'A' ? 'Good' : 'Standard';

  // XP calculation
  const xpGained = isDraw ? 5 : isWinner ? 150 : 25;

  const handlePlayAgain = async () => {
    await leaveMatch();
    resetGame();
    // Go directly back to lobby for a new match
    onAction('lobby');
  };

  const handleBackToLobby = async () => {
    await leaveMatch();
    resetGame();
    onAction('lobby');
  };

  // Build final board for display
  const finalBoard = gameOverResult?.board || gameState?.board || Array(9).fill('');

  return (
    <div className="relative flex flex-col items-center justify-center pt-12 pb-24 px-6 min-h-[calc(100vh-80px)] overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={cn(
          "absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[120px]",
          isDraw ? "bg-secondary/10" : isWinner ? "bg-primary/10" : "bg-tertiary/10"
        )}></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center mb-12"
      >
        <div className={cn(
          "inline-block px-4 py-1 rounded-full border bg-opacity-5 text-[10px] font-orbitron tracking-[0.3em] mb-4 uppercase",
          isDraw ? "border-secondary/30 bg-secondary/5 text-secondary"
            : isWinner ? "border-primary/30 bg-primary/5 text-primary"
              : "border-tertiary/30 bg-tertiary/5 text-tertiary"
        )}>
          Match Terminated • {gameOverResult?.reason === 'timeout' ? 'Timeout' : gameOverResult?.reason === 'opponent_disconnected' ? 'Forfeit' : gameOverResult?.reason || 'Finished'}
        </div>
        <h1 className={cn("font-orbitron text-7xl md:text-9xl font-black tracking-tighter italic scale-110", resultColor, glowClass)}>
          {resultTitle}{' '}
          <span className="not-italic" aria-hidden="true">
            {isDraw ? '😎' : isWinner ? '👏' : '🤯'}
          </span>
        </h1>
        <p className="font-space-grotesk text-on-surface-variant mt-4 text-lg tracking-widest uppercase">{resultSubtext}</p>
      </motion.div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 w-full max-w-5xl">
        {/* Final board */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="md:col-span-7 glass-card rounded-2xl p-8 border border-outline-variant/15 flex flex-col items-center justify-center gap-8 shadow-2xl bg-surface-container-high/40"
        >
          <h3 className="font-orbitron text-xs text-on-surface-variant self-start uppercase tracking-widest">Final Tactical Map</h3>
          <div className="grid grid-cols-3 gap-3 w-64 h-64">
            {finalBoard.map((cell: string, i: number) => (
              <div key={i} className="bg-surface-container-highest rounded-xl flex items-center justify-center border border-outline-variant/10">
                {cell === 'X' && <span className="font-orbitron text-3xl font-black text-secondary">X</span>}
                {cell === 'O' && <span className="font-orbitron text-3xl font-black text-tertiary">O</span>}
              </div>
            ))}
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <div className={cn("w-3 h-3 rounded-full", isWinner || isDraw ? "bg-primary animate-pulse" : "bg-primary/50")}></div>
              <span className="text-[10px] font-orbitron text-primary uppercase">
                {gameOverResult?.winnerName || 'Player'} {isWinner ? '(You - Win)' : isDraw ? '(You - Draw)' : '(You)'}
              </span>
            </div>
            <div className="w-8 h-[1px] bg-outline-variant/30"></div>
            <div className="flex items-center gap-2">
              <div className={cn("w-3 h-3 rounded-full", !isWinner && !isDraw ? "bg-tertiary animate-pulse" : "bg-secondary/50")}></div>
              <span className="text-[10px] font-orbitron text-secondary opacity-70 uppercase">
                {isWinner ? gameOverResult?.loserName : gameOverResult?.winnerName || 'Opponent'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Stats sidebar */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="md:col-span-5 flex flex-col gap-6"
        >
          <div className="glass-card rounded-2xl p-6 border border-outline-variant/15 flex flex-col gap-6 flex-grow bg-surface-container-high/40">
            <div className="flex justify-between items-center border-b border-outline-variant/10 pb-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-orbitron text-on-surface-variant uppercase">Efficiency Rating</span>
                <span className="text-2xl font-orbitron text-secondary uppercase">{rating} {ratingText}</span>
              </div>
              <ICONS.insights className="w-8 h-8 text-secondary" />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-on-surface-variant">Moves Made</span>
                <span className="text-lg font-orbitron text-on-surface">{String(gameOverResult?.moveCount || 0).padStart(2, '0')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-on-surface-variant">Time Taken</span>
                <span className="text-lg font-orbitron text-on-surface">{gameOverResult?.duration || 0}s</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-outline-variant/10">
                <span className={cn("text-sm font-bold", resultColor)}>XP Gained</span>
                <div className="flex items-center gap-2">
                  <ICONS.trendingUp className={cn("w-4 h-4", resultColor)} />
                  <span className={cn("text-xl font-orbitron", resultColor)}>+{xpGained}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-high rounded-2xl p-6 border border-primary/10 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <ICONS.militaryTech className="w-24 h-24" />
            </div>
            <div className="relative z-10">
              <div className="flex justify-between mb-2">
                <span className="text-[10px] font-orbitron text-primary uppercase">Tier Progress</span>
                <span className="text-[10px] font-orbitron text-on-surface-variant">+{xpGained} RP</span>
              </div>
              <div className="h-2 w-full bg-surface-container-lowest rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-primary-container w-[82%] shadow-[0_0_10px_rgba(164,255,185,0.5)]"></div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="relative z-10 mt-12 flex flex-wrap justify-center gap-4 w-full max-w-5xl"
      >
        <button 
          onClick={handlePlayAgain}
          className="bg-primary hover:bg-primary/80 text-on-primary font-orbitron font-bold py-4 px-10 rounded-xl transition-all active:scale-95 shadow-[0_0_30px_rgba(164,255,185,0.3)] flex items-center gap-3 group"
        >
          <ICONS.replay className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
          PLAY AGAIN
        </button>
        <button 
          onClick={handleBackToLobby}
          className="glass-panel hover:bg-surface-container-high text-on-surface font-orbitron font-bold py-4 px-10 rounded-xl border border-outline-variant/30 transition-all active:scale-95 flex items-center gap-3"
        >
          <ICONS.grid className="w-5 h-5" />
          BACK TO LOBBY
        </button>
        <button className="glass-panel hover:bg-surface-container-high text-on-surface font-orbitron font-bold py-4 px-10 rounded-xl border border-outline-variant/30 transition-all active:scale-95 flex items-center gap-3">
          <ICONS.share className="w-5 h-5" />
          SHARE RESULT
        </button>
      </motion.div>
    </div>
  );
};
