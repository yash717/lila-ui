import React from 'react';
import { cn } from '../lib/utils';
import { ICONS } from '../icons';
import { Screen } from '../types';
import { avatarUrlForSeed } from '../config/nakama';
import { useGame } from '../context/GameContext';

interface SidebarProps {
  currentScreen: Screen;
  onScreenChange: (screen: Screen) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentScreen, onScreenChange }) => {
  const { session, username, connectionStatus } = useGame();

  const navItems = [
    { id: 'splash' as const, icon: 'home', label: 'Home' },
    { id: 'lobby' as const, icon: 'gamepad', label: 'Lobby' },
    { id: 'leaderboard' as const, icon: 'leaderboard', label: 'Rankings' },
    { id: 'settings' as const, icon: 'settings', label: 'Settings' },
  ];

  const avatar = avatarUrlForSeed(session?.user_id ?? 'guest');
  const name = username || 'COMMANDER';
  const level =
    connectionStatus === 'connected' || connectionStatus === 'matchmaking' || connectionStatus === 'in_match'
      ? 'Online'
      : connectionStatus === 'connecting'
        ? 'Connecting'
        : 'Offline';

  return (
    <aside className="hidden md:flex h-screen w-64 fixed left-0 top-0 flex-col py-8 px-4 bg-surface shadow-[10px_0_30px_rgba(0,0,0,0.4)] z-50 border-r border-white/5">
      <div className="text-primary font-orbitron font-black text-xl mb-8 tracking-tighter neon-glow-primary">
        NEBULA STRIKE
      </div>

      <div className="mb-10 flex items-center space-x-4 p-3 bg-surface-container-high rounded-xl border border-white/5">
        <div className="relative">
          <img src={avatar} alt="Avatar" className="w-12 h-12 rounded-lg object-cover border-2 border-primary/30" />
          <div
            className={cn(
              'absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-surface',
              connectionStatus === 'connected' ||
              connectionStatus === 'matchmaking' ||
              connectionStatus === 'in_match'
                ? 'bg-primary animate-pulse'
                : 'bg-tertiary',
            )}
          />
        </div>
        <div>
          <div className="text-primary font-orbitron font-bold text-xs tracking-wider uppercase truncate max-w-[120px]">
            {name}
          </div>
          <div className="text-on-surface-variant text-[10px] font-medium">{level}</div>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const Icon = ICONS[item.icon as keyof typeof ICONS];
          const isActive = currentScreen === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onScreenChange(item.id)}
              className={cn(
                'w-full flex items-center space-x-3 px-4 py-3 transition-all cursor-pointer font-orbitron text-xs rounded-lg',
                isActive
                  ? 'border-r-4 border-primary bg-gradient-to-r from-primary/10 to-transparent text-primary font-bold'
                  : 'text-on-surface-variant hover:translate-x-1 hover:text-on-surface',
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto text-[10px] font-orbitron text-on-surface-variant/60 tracking-widest px-2">
        Nakama realtime
      </div>
    </aside>
  );
};

export const BottomNav: React.FC<SidebarProps> = ({ currentScreen, onScreenChange }) => {
  const navItems = [
    { id: 'splash' as const, icon: 'home', label: 'Home' },
    { id: 'lobby' as const, icon: 'gamepad', label: 'Lobby' },
    { id: 'leaderboard' as const, icon: 'leaderboard', label: 'Rankings' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-8 pt-4 bg-surface-container-low/95 backdrop-blur-xl z-50 rounded-t-3xl shadow-[0_-8px_32px_rgba(0,0,0,0.6)] border-t border-white/5">
      {navItems.map((item) => {
        const Icon = ICONS[item.icon as keyof typeof ICONS];
        const isActive = currentScreen === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onScreenChange(item.id)}
            className={cn(
              'flex flex-col items-center justify-center transition-all',
              isActive
                ? 'text-primary bg-primary/10 rounded-xl px-5 py-2 drop-shadow-[0_0_10px_rgba(164,255,185,0.3)]'
                : 'text-on-surface-variant opacity-70',
            )}
          >
            <Icon className="w-6 h-6" />
            <span className="font-inter font-bold text-[8px] uppercase tracking-widest mt-1">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export const TopBar: React.FC = () => {
  return (
    <header className="bg-surface/80 backdrop-blur-xl border-b border-primary/10 sticky top-0 z-40 flex justify-between items-center w-full px-6 py-4 max-w-none shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      <div className="text-primary font-orbitron font-black text-xl tracking-tighter neon-glow-primary">NEBULA STRIKE</div>
      <div className="flex items-center gap-4">
        <button type="button" className="text-primary hover:bg-primary/5 p-2 rounded-full transition-all">
          <ICONS.notifications className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
};
