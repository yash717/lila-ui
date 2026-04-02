import React from 'react';
import { motion } from 'motion/react';
import { ICONS } from '../icons';
import { cn } from '../lib/utils';
import { nakamaConfig } from '../config/nakama';
import { useGame } from '../context/GameContext';

interface SettingsScreenProps {
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const { connectionStatus, error, session, username, logout } = useGame();

  const statusClass =
    connectionStatus === 'connected' || connectionStatus === 'matchmaking' || connectionStatus === 'in_match'
      ? 'text-primary'
      : connectionStatus === 'connecting'
        ? 'text-secondary'
        : 'text-tertiary';

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 relative z-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <button
          type="button"
          onClick={onBack}
          className="text-on-surface-variant hover:text-primary font-orbitron text-xs tracking-widest mb-6 flex items-center gap-2"
        >
          <ICONS.grid className="w-4 h-4" /> BACK
        </button>
        <h1 className="font-orbitron text-4xl font-black tracking-tight text-on-surface mb-2">SETTINGS</h1>
        <p className="text-on-surface-variant text-xs font-medium tracking-widest uppercase">
          Server connection & identity
        </p>
      </motion.div>

      <div className="glass-panel rounded-2xl border border-outline-variant/10 divide-y divide-outline-variant/10">
        <div className="p-6 flex justify-between items-center gap-4">
          <div>
            <div className="font-orbitron text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">
              Connection
            </div>
            <div className={cn('font-orbitron font-bold text-sm uppercase', statusClass)}>{connectionStatus}</div>
            {error && <p className="text-tertiary text-xs mt-2 font-inter">{error}</p>}
          </div>
          <div className="text-right text-[10px] font-mono text-on-surface-variant break-all max-w-[50%]">
            {nakamaConfig.host}:{nakamaConfig.port}
            {nakamaConfig.useSSL ? ' (TLS)' : ''}
          </div>
        </div>

        <div className="p-6">
          <div className="font-orbitron text-[10px] text-on-surface-variant uppercase tracking-widest mb-2">
            User ID
          </div>
          <div className="font-mono text-xs text-on-surface break-all">{session?.user_id ?? '—'}</div>
        </div>

        <div className="p-6">
          <div className="font-orbitron text-[10px] text-on-surface-variant uppercase tracking-widest mb-2">
            Display name
          </div>
          <div className="font-orbitron text-sm text-secondary">{username || '—'}</div>
        </div>

        <div className="p-6">
          <div className="font-orbitron text-[10px] text-on-surface-variant uppercase tracking-widest mb-2">
            Session
          </div>
          <div className="font-mono text-[10px] text-on-surface-variant break-all opacity-80">
            {session?.token ? `${session.token.slice(0, 24)}…` : '—'}
          </div>
          <p className="text-on-surface-variant text-[10px] font-inter mt-3 leading-relaxed">
            Tokens are kept in <span className="text-on-surface">localStorage</span> and a non-secret cookie flag so you
            stay signed in across refreshes. Clear data here to sign out on this device.
          </p>
        </div>

        <div className="p-6">
          <button
            type="button"
            onClick={() => logout()}
            className="w-full py-4 rounded-xl border border-tertiary/40 text-tertiary font-orbitron text-xs font-bold tracking-widest uppercase hover:bg-tertiary/10 transition-colors"
          >
            Sign out &amp; clear saved session
          </button>
        </div>
      </div>
    </div>
  );
};
