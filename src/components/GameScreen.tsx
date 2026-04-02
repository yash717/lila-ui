import React, { useEffect, useCallback, useState } from 'react';
import { motion } from 'motion/react';
import { ICONS } from '../icons';
import { useGame } from '../context/GameContext';
import { cn } from '../lib/utils';

interface GameScreenProps {
  onGameEnd: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({ onGameEnd }) => {
  const { gameState, gameOverResult, playerMark, username, makeMove, session, roomCode } = useGame();
  const [copied, setCopied] = useState(false);

  // Navigate to victory screen when game is over
  useEffect(() => {
    if (gameOverResult) {
      const timeout = setTimeout(onGameEnd, 1200);
      return () => clearTimeout(timeout);
    }
  }, [gameOverResult, onGameEnd]);

  const handleClick = useCallback(
    (i: number) => {
      if (!gameState || gameState.gameOver) return;
      // Only allow move if it's our turn
      if (gameState.currentTurn !== playerMark) return;
      // Only allow if cell is empty
      if (gameState.board[i] !== '') return;
      makeMove(i);
    },
    [gameState, playerMark, makeMove],
  );

  const copyRoomCode = useCallback(async () => {
    if (!roomCode) return;
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [roomCode]);

  // Waiting for opponent
  if (!gameState || gameState.playerCount < 2) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 flex flex-col items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-secondary border-t-transparent rounded-full mb-8"
        />
        <h2 className="font-orbitron text-2xl font-black text-secondary uppercase tracking-widest mb-4 text-center">
          Waiting for Opponent <span aria-hidden="true">👏</span>
        </h2>
        <p className="text-on-surface-variant text-sm font-orbitron uppercase tracking-wider text-center max-w-md mb-6">
          Your mark is set when they join. They should open <span className="text-secondary">Open rooms</span> in the
          lobby and tap <span className="text-secondary">Join</span> on your listing — or you can copy the room id for
          them. 😎
        </p>
        {roomCode ? (
          <div className="w-full max-w-lg glass-panel p-6 rounded-2xl border border-primary/25 text-center space-y-3">
            <span className="text-[10px] font-orbitron text-on-surface-variant uppercase tracking-widest block">
              Room id (same as in Open rooms)
            </span>
            <p className="font-mono text-xs sm:text-sm text-primary break-all select-all">{roomCode}</p>
            <button
              type="button"
              onClick={() => void copyRoomCode()}
              className="text-[10px] font-orbitron font-bold tracking-widest uppercase px-4 py-2 rounded-xl border border-primary/40 text-primary hover:bg-primary/10 transition-colors"
            >
              {copied ? 'Copied! 🤯' : 'Copy room code'}
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  // Determine player data from server state
  const myUserId = session?.user_id || '';
  const myPlayer = gameState.players[myUserId];
  const opponentPlayer = Object.values(gameState.players).find((p) => p.userId !== myUserId);
  const isMyTurn = gameState.currentTurn === playerMark;

  // Timer calculation for timed mode
  const timeLeft =
    gameState.mode === 'timed' && gameState.turnDeadline > 0
      ? Math.max(0, Math.ceil((gameState.turnDeadline - Date.now()) / 1000))
      : 30;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 flex flex-col items-center">
      {/* Player Header Scoreboard */}
      <section className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12 w-full relative">
        <div
          className={cn(
            'flex items-center gap-6 w-full md:w-auto p-6 glass-panel rounded-2xl border-l-4',
            isMyTurn ? 'border-primary shadow-[0_0_20px_rgba(164,255,185,0.15)]' : 'border-secondary',
          )}
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-xl border-2 border-secondary/50 bg-surface-container-highest flex items-center justify-center">
              <span className="font-orbitron text-3xl font-black text-secondary">{playerMark}</span>
            </div>
            <div className="absolute -top-2 -right-2 bg-secondary text-on-secondary text-[10px] font-orbitron font-bold px-2 py-0.5 rounded-full">
              P1
            </div>
          </div>
          <div>
            <h3 className="font-orbitron text-lg font-bold text-secondary uppercase tracking-wider">
              {myPlayer?.username || username}
            </h3>
            <p className="text-on-surface-variant text-xs uppercase font-medium">
              Mark: {playerMark} {isMyTurn && '• YOUR TURN'}
            </p>
          </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 hidden md:flex flex-col items-center">
          <div className="font-orbitron text-on-surface-variant text-xl font-black italic opacity-20">VS</div>
          <div className="mt-2 bg-surface-container-highest px-4 py-1 rounded-full border border-outline-variant/20">
            <span className="text-[10px] font-orbitron text-primary tracking-[0.2em] font-bold uppercase">
              {gameState.mode === 'timed' ? 'TIMED MODE' : 'CLASSIC MODE'}
            </span>
          </div>
        </div>

        <div
          className={cn(
            'flex flex-row-reverse items-center gap-6 w-full md:w-auto p-6 glass-panel rounded-2xl border-r-4',
            !isMyTurn ? 'border-tertiary shadow-[0_0_20px_rgba(255,108,144,0.15)]' : 'border-tertiary',
          )}
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-xl border-2 border-tertiary/50 bg-surface-container-highest flex items-center justify-center">
              <span className="font-orbitron text-3xl font-black text-tertiary">{playerMark === 'X' ? 'O' : 'X'}</span>
            </div>
            <div className="absolute -top-2 -left-2 bg-tertiary text-on-tertiary text-[10px] font-orbitron font-bold px-2 py-0.5 rounded-full">
              P2
            </div>
          </div>
          <div className="text-right">
            <h3 className="font-orbitron text-lg font-bold text-tertiary uppercase tracking-wider">
              {opponentPlayer?.username || 'OPPONENT'}
            </h3>
            <p className="text-on-surface-variant text-xs uppercase font-medium">
              Mark: {playerMark === 'X' ? 'O' : 'X'} {!isMyTurn && '• THEIR TURN'}
            </p>
          </div>
        </div>
      </section>

      {/* Main Gameplay Area */}
      <section className="flex flex-col items-center w-full max-w-md">
        {/* Timer bar */}
        {gameState.mode === 'timed' && (
          <div className="w-full mb-8">
            <div className="flex justify-between items-end mb-2">
              <span className="font-orbitron text-[10px] text-primary tracking-widest flex items-center gap-2 uppercase">
                <ICONS.timer className="w-4 h-4" /> TIMED MODE
              </span>
              <span
                className={cn(
                  'font-orbitron text-sm font-bold',
                  timeLeft <= 5 ? 'text-tertiary animate-pulse' : 'text-on-surface',
                )}
              >
                0:{timeLeft.toString().padStart(2, '0')}
              </span>
            </div>
            <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden border border-outline-variant/10">
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: `${(timeLeft / 30) * 100}%` }}
                className={cn(
                  'h-full shadow-[0_0_15px_rgba(164,255,185,0.4)]',
                  timeLeft <= 5
                    ? 'bg-gradient-to-r from-tertiary to-tertiary-dim'
                    : 'bg-gradient-to-r from-secondary to-primary',
                )}
              />
            </div>
          </div>
        )}

        {/* Game Board */}
        <div className="relative p-3 rounded-3xl bg-surface-container-low shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-outline-variant/5 w-full aspect-square">
          <div className="grid grid-cols-3 gap-3 h-full">
            {gameState.board.map((cell: string, i: number) => {
              const canClick = isMyTurn && cell === '' && !gameState.gameOver;
              return (
                <button
                  key={i}
                  onClick={() => handleClick(i)}
                  disabled={!canClick}
                  className={cn(
                    'flex items-center justify-center bg-surface-container-highest rounded-2xl transition-all group relative overflow-hidden',
                    canClick
                      ? 'hover:bg-primary/5 cursor-pointer hover:shadow-[0_0_20px_rgba(164,255,185,0.1)]'
                      : 'cursor-default',
                  )}
                >
                  {cell === 'X' && (
                    <motion.span
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="font-orbitron text-6xl font-black text-secondary neon-text-secondary select-none"
                    >
                      X
                    </motion.span>
                  )}
                  {cell === 'O' && (
                    <motion.span
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="font-orbitron text-6xl font-black text-tertiary neon-text-tertiary select-none"
                    >
                      O
                    </motion.span>
                  )}
                  {cell === '' && canClick && (
                    <div className="w-4 h-4 rounded-full border-2 border-outline-variant/20 group-hover:border-primary/40 transition-all" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Turn indicator */}
        <div className="mt-12 flex flex-col items-center">
          <div
            className={cn(
              'flex items-center gap-4 px-8 py-3 rounded-2xl border shadow-[0_0_20px_rgba(164,255,185,0.1)]',
              isMyTurn
                ? 'bg-surface-container-highest border-primary/20'
                : 'bg-surface-container-high border-outline-variant/20',
            )}
          >
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center',
                isMyTurn ? 'bg-primary/20' : 'bg-tertiary/20',
              )}
            >
              <span className={cn('font-orbitron font-black text-xl', isMyTurn ? 'text-primary' : 'text-tertiary')}>
                {gameState.currentTurn}
              </span>
            </div>
            <span
              className={cn(
                'font-orbitron text-xl font-bold tracking-widest uppercase',
                isMyTurn ? 'text-primary' : 'text-tertiary',
              )}
            >
              {isMyTurn ? 'YOUR TURN' : "OPPONENT'S TURN"}
            </span>
          </div>
          <p className="mt-3 text-on-surface-variant text-[10px] font-orbitron uppercase tracking-widest">
            {isMyTurn ? 'Make your move, Commander' : 'Awaiting enemy transmission…'}
          </p>
        </div>

        {/* Emoji reactions */}
        <div className="mt-8 flex gap-3">
          {['🔥', '👏', '😎', '🤯'].map((emoji, i) => (
            <button
              key={i}
              className="w-12 h-12 glass-panel rounded-full flex items-center justify-center text-xl hover:scale-110 active:scale-95 transition-transform hover:bg-primary/10"
            >
              {emoji}
            </button>
          ))}
          <button className="w-12 h-12 glass-panel rounded-full flex items-center justify-center text-slate-400 hover:text-primary transition-colors hover:bg-primary/10">
            <ICONS.notifications className="w-5 h-5" />
          </button>
        </div>
      </section>
    </div>
  );
};
