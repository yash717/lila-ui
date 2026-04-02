import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ICONS } from '../icons';
import { useGame } from '../context/GameContext';
import * as nakama from '../services/nakamaClient';
import { cn } from '../lib/utils';

interface LeaderboardEntry {
  ownerId: string;
  username: string;
  score: number;
  rank: number;
}

function rankMedal(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return '';
}

export const LeaderboardScreen: React.FC = () => {
  const { session } = useGame();
  const [records, setRecords] = useState<LeaderboardEntry[]>([]);
  const [myStanding, setMyStanding] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      setRecords([]);
      setMyStanding(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    nakama
      .getLeaderboard(session)
      .then(({ records: rows, myRank }) => {
        setRecords(rows);
        if (myRank && myRank.ownerId) {
          setMyStanding({
            ownerId: myRank.ownerId,
            username: myRank.username,
            score: myRank.score,
            rank: myRank.rank,
          });
        } else {
          setMyStanding(null);
        }
      })
      .catch(() => {
        setRecords([]);
        setMyStanding(null);
      })
      .finally(() => setLoading(false));
  }, [session]);

  const myUserId = session?.user_id || '';

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 relative z-10">
      <div className="mb-10 text-center md:text-left">
        <h1 className="font-orbitron text-4xl font-black tracking-tight text-on-surface mb-2">
          GLOBAL LEADERBOARD{' '}
          <span className="inline-block" aria-hidden="true">
            😎
          </span>
        </h1>
        <p className="text-on-surface-variant font-medium tracking-widest uppercase text-[10px] flex flex-wrap items-center justify-center md:justify-start gap-2">
          <ICONS.trophy className="w-4 h-4 text-primary shrink-0" />
          <span>Rank and RP from every finished match</span>
          <span className="opacity-80" aria-hidden="true">
            🤯
          </span>
        </p>
      </div>

      {myStanding && (
        <div className="mb-6 glass-panel rounded-2xl border border-primary/30 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-orbitron text-on-surface-variant uppercase tracking-widest mb-1">
              Your standing
            </div>
            <div className="font-orbitron text-lg text-on-surface">
              Rank <span className="text-primary font-black">#{myStanding.rank}</span>
              <span className="text-on-surface-variant mx-2">·</span>
              <span className="tabular-nums">{myStanding.score}</span>{' '}
              <span className="text-[10px] text-on-surface-variant">RP</span>
            </div>
            <div className="text-xs font-orbitron text-secondary mt-1">{myStanding.username}</div>
          </div>
          <div className="text-[10px] text-on-surface-variant/80 font-inter max-w-xs">
            Same data as the table — pulled for your user id from Nakama.
          </div>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mb-6"
          />
          <span className="font-orbitron text-sm text-on-surface-variant uppercase tracking-widest">Loading… 👏</span>
        </div>
      )}

      {!loading && records.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 glass-panel rounded-2xl border border-outline-variant/10">
          <span className="text-5xl mb-4" aria-hidden="true">
            🤯
          </span>
          <h3 className="font-orbitron text-lg text-on-surface-variant uppercase tracking-widest mb-2">
            No Rankings Yet
          </h3>
          <p className="text-on-surface-variant text-sm opacity-70 text-center max-w-sm">
            Play matches — wins and losses both write to this board. 😎
          </p>
        </div>
      )}

      {!loading && records.length > 0 && (
        <div className="glass-panel rounded-2xl overflow-hidden border border-outline-variant/10">
          <div className="px-6 py-4 bg-surface-container-high/50 border-b border-outline-variant/10 font-orbitron text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">
            Top commanders — rank &amp; RP <span className="text-primary">👏</span>
          </div>
          <div className="divide-y divide-outline-variant/5 max-h-[70vh] overflow-y-auto">
            {records.map((player, index) => {
              const isCurrentUser = player.ownerId === myUserId;
              const medal = rankMedal(player.rank);
              return (
                <motion.div
                  key={`${player.ownerId}-${index}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={cn(
                    'grid grid-cols-12 gap-3 px-4 sm:px-6 py-4 items-center transition-colors',
                    isCurrentUser ? 'bg-primary/10 border-l-4 border-primary' : 'hover:bg-white/5',
                    player.rank <= 3 && 'bg-surface-container-high/30',
                  )}
                >
                  <div className="col-span-2 sm:col-span-1 font-orbitron font-black text-on-surface-variant flex items-center gap-1 min-w-0">
                    <span className="text-lg shrink-0" aria-hidden="true">
                      {medal}
                    </span>
                    <span className="truncate">#{player.rank}</span>
                  </div>
                  <div className="col-span-6 sm:col-span-8 flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center border border-white/10 shrink-0">
                      <ICONS.profile className="w-6 h-6 text-on-surface-variant/40" />
                    </div>
                    <div className="min-w-0">
                      <div
                        className={cn(
                          'font-orbitron font-bold text-sm truncate',
                          isCurrentUser ? 'text-primary' : 'text-on-surface',
                        )}
                      >
                        {player.username || 'Commander'}
                        {isCurrentUser && (
                          <span className="ml-2 text-[8px] bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase shrink-0">
                            YOU
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-4 sm:col-span-3 text-right font-orbitron font-black text-on-surface tabular-nums">
                    {player.score} <span className="text-[10px] text-on-surface-variant font-bold">RP</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
