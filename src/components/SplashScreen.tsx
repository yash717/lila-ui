import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { ICONS } from '../icons';
import { useGame } from '../context/GameContext';
import { cn } from '../lib/utils';

interface SplashScreenProps {
  onStart: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onStart }) => {
  const { authenticate, error, clearError } = useGame();
  const [usernameInput, setUsernameInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const callsignRef = useRef<HTMLInputElement>(null);

  const focusCallsign = (msg: string) => {
    setHint(msg);
    callsignRef.current?.focus();
  };

  const handleStart = async () => {
    const name = usernameInput.trim() || `Commander_${Math.floor(Math.random() * 9999)}`;
    setIsLoading(true);
    clearError();
    try {
      await authenticate(name);
      onStart();
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-between px-6 py-12 md:py-20 overflow-hidden bg-surface">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: '110vh', rotate: 0, opacity: 0.2 }}
            animate={{ y: '-10vh', rotate: 360, opacity: [0.2, 0.5, 0.2] }}
            transition={{
              duration: 15 + Math.random() * 10,
              repeat: Infinity,
              ease: 'linear',
              delay: Math.random() * 20,
            }}
            className="absolute"
            style={{ left: `${Math.random() * 100}%` }}
          >
            {i % 2 === 0 ? (
              <ICONS.replay className={cn('w-12 h-12', i % 3 === 0 ? 'text-primary' : 'text-secondary')} />
            ) : (
              <div
                className={cn('w-10 h-10 rounded-full border-4', i % 3 === 0 ? 'border-tertiary' : 'border-primary')}
              />
            )}
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg text-center mt-12 md:mt-0 relative z-10"
      >
        <div className="flex flex-wrap justify-center gap-3 mb-4">
          <div className="inline-block px-4 py-1 rounded-full bg-primary/10 border border-primary/20">
            <span className="text-primary font-orbitron text-[10px] tracking-[0.2em] uppercase font-bold">
              Nakama · Device login
            </span>
          </div>
          <div className="inline-block px-4 py-1 rounded-full bg-secondary/10 border border-secondary/20">
            <span className="text-secondary font-orbitron text-[10px] tracking-[0.2em] uppercase font-bold">
              CI/CD Implemented ✅
            </span>
          </div>
        </div>

        <h1 className="font-orbitron text-5xl md:text-7xl lg:text-8xl font-black leading-tight flex flex-wrap justify-center gap-x-4">
          <span className="flex">
            <span className="text-primary neon-glow-primary">T</span>
            <span className="text-secondary neon-glow-secondary">I</span>
            <span className="text-tertiary neon-glow-tertiary">C</span>
          </span>
          <span className="flex">
            <span className="text-secondary-dim neon-glow-secondary">T</span>
            <span className="text-primary-container neon-glow-primary">A</span>
            <span className="text-tertiary-dim neon-glow-tertiary">C</span>
          </span>
          <span className="flex">
            <span className="text-primary neon-glow-primary">T</span>
            <span className="text-secondary neon-glow-secondary">O</span>
            <span className="text-tertiary neon-glow-tertiary">E</span>
          </span>
        </h1>

        <p className="mt-8 text-on-surface-variant font-inter text-sm md:text-base max-w-xs mx-auto tracking-wide leading-relaxed">
          Dominate the cosmic grid — strategy, neon, and pure vibes. 😎 Session stays on this device after refresh. 👏
        </p>
      </motion.div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="relative w-full max-w-xs aspect-square mt-8 md:mt-0 flex items-center justify-center z-10"
      >
        <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full"></div>
        <div className="glass-panel w-full h-full rounded-3xl border border-white/10 p-6 grid grid-cols-3 grid-rows-3 gap-3">
          <div className="bg-surface-container-highest/40 rounded-xl flex items-center justify-center">
            <ICONS.replay className="w-8 h-8 text-primary neon-glow-primary" />
          </div>
          <div className="bg-surface-container-highest/40 rounded-xl"></div>
          <div className="bg-surface-container-highest/40 rounded-xl flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-4 border-secondary neon-glow-secondary" />
          </div>
          <div className="bg-surface-container-highest/40 rounded-xl"></div>
          <div className="bg-primary/20 border border-primary/40 rounded-xl flex items-center justify-center">
            <ICONS.replay className="w-8 h-8 text-primary neon-glow-primary" />
          </div>
          <div className="bg-surface-container-highest/40 rounded-xl"></div>
          <div className="bg-surface-container-highest/40 rounded-xl flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-4 border-secondary neon-glow-secondary" />
          </div>
          <div className="bg-surface-container-highest/40 rounded-xl"></div>
          <div className="bg-surface-container-highest/40 rounded-xl"></div>
        </div>

        <div className="absolute -top-4 -right-4 glass-panel px-4 py-2 rounded-xl border border-secondary/30 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
          <span className="text-[10px] font-orbitron font-bold text-secondary tracking-tighter">MULTIPLAYER ON</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full max-w-sm space-y-4 mb-8 md:mb-0 z-10"
      >
        {/* Username input */}
        <div className="glass-panel rounded-2xl px-6 py-4 border border-white/5">
          <label className="block font-orbitron text-[10px] font-bold tracking-[0.3em] text-on-surface-variant mb-3 uppercase">
            Commander Name
          </label>
          <input
            ref={callsignRef}
            type="text"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
            placeholder="ENTER YOUR CALLSIGN..."
            maxLength={20}
            className="w-full bg-surface-container-low border-b-2 border-outline-variant focus:border-primary transition-all py-3 px-4 font-orbitron tracking-widest text-primary focus:outline-none placeholder:text-outline-variant/50 uppercase rounded-lg text-sm"
          />
          <p className="text-[10px] text-on-surface-variant/85 font-inter mt-3 leading-relaxed">
            Stored as your <span className="text-on-surface font-medium">display name</span> on the Nakama server
            (Postgres) after login — we sync it back so it matches everywhere. 👏
          </p>
        </div>

        {hint && <p className="text-secondary text-[10px] font-orbitron text-center tracking-wide px-2">{hint}</p>}

        {error && (
          <div className="text-tertiary text-xs font-orbitron text-center px-4 py-2 bg-tertiary/10 rounded-xl border border-tertiary/20">
            {error}
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={isLoading}
          className="group relative w-full overflow-hidden rounded-2xl bg-primary py-5 px-8 transition-all active:scale-95 shadow-[0_0_20px_rgba(164,255,185,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary-container to-primary transition-transform duration-500 group-hover:translate-x-full"></div>
          <span className="relative flex items-center justify-center gap-3 text-on-primary font-orbitron font-black text-xl tracking-widest">
            {isLoading ? 'CONNECTING...' : 'START MISSION'}
            <ICONS.rocket className="w-6 h-6" />
          </span>
        </button>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => focusCallsign('Sign in with START MISSION first — then use Training from the lobby.')}
            className="flex-1 glass-panel border border-white/5 py-4 rounded-2xl text-on-surface font-orbitron text-xs font-bold tracking-widest hover:bg-white/10 transition-colors uppercase"
          >
            Training
          </button>
          <button
            type="button"
            onClick={() => focusCallsign('Sign in with START MISSION first — Rankings opens from the nav after login.')}
            className="flex-1 glass-panel border border-white/5 py-4 rounded-2xl text-on-surface font-orbitron text-xs font-bold tracking-widest hover:bg-white/10 transition-colors uppercase"
          >
            Rankings
          </button>
        </div>

        <div className="pt-6 flex justify-center items-center gap-6 opacity-60">
          <div className="flex flex-col items-center gap-1">
            <ICONS.search className="w-5 h-5" />
            <span className="text-[8px] font-orbitron">GLOBAL</span>
          </div>
          <div className="w-px h-8 bg-white/10"></div>
          <div className="flex flex-col items-center gap-1">
            <ICONS.settings className="w-5 h-5" />
            <span className="text-[8px] font-orbitron">SECURE</span>
          </div>
          <div className="w-px h-8 bg-white/10"></div>
          <div className="flex flex-col items-center gap-1">
            <ICONS.gamepad className="w-5 h-5" />
            <span className="text-[8px] font-orbitron">ARENA</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
