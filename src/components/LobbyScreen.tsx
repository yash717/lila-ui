import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import { ICONS } from '../icons';
import { useGame } from '../context/GameContext';
import { cn } from '../lib/utils';
import * as nakama from '../services/nakamaClient';
import type { MatchHistoryEntryRpc } from '../types/nakamaRpc';
import type { OpenMatchRow } from '../services/nakamaClient';

interface LobbyScreenProps {
  onEnterGame: () => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ onEnterGame }) => {
  const {
    session,
    connectionStatus,
    selectedMode,
    setSelectedMode,
    findMatch,
    cancelMatchmaking,
    createRoom,
    joinRoom,
    roomCode,
    error,
    clearError,
  } = useGame();

  const [roomBusy, setRoomBusy] = useState<'idle' | 'creating' | 'joining'>('idle');
  const [copied, setCopied] = useState(false);
  const [matchHistory, setMatchHistory] = useState<MatchHistoryEntryRpc[]>([]);
  const [openRooms, setOpenRooms] = useState<OpenMatchRow[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsUpdatedAt, setRoomsUpdatedAt] = useState<Date | null>(null);
  const isSearching = connectionStatus === 'matchmaking';

  const combatRows = useMemo(() => {
    const uid = session?.user_id;
    return matchHistory.filter(
      (e) => Boolean(e.opponentId?.trim()) && e.opponentId !== uid && Boolean(String(e.opponent ?? '').trim()),
    );
  }, [matchHistory, session?.user_id]);

  // Navigate to game when matched
  useEffect(() => {
    if (connectionStatus === 'in_match') {
      onEnterGame();
    }
  }, [connectionStatus, onEnterGame]);

  // Combat history RPC — refresh whenever we're back in lobby (connected), including after a match ends
  useEffect(() => {
    if (!session || connectionStatus !== 'connected') return;
    let cancelled = false;
    nakama
      .getMatchHistory(session)
      .then((rows) => {
        if (!cancelled) setMatchHistory(rows);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [session, connectionStatus]);

  const loadOpenRooms = useCallback(async () => {
    if (!session || connectionStatus !== 'connected') return;
    setRoomsLoading(true);
    try {
      const rows = await nakama.listOpenMatches(session);
      setOpenRooms(rows);
      setRoomsUpdatedAt(new Date());
    } catch {
      setOpenRooms([]);
    } finally {
      setRoomsLoading(false);
    }
  }, [session, connectionStatus]);

  useEffect(() => {
    if (!session || connectionStatus !== 'connected') return;
    void loadOpenRooms();
    const t = window.setInterval(() => void loadOpenRooms(), 5000);
    return () => window.clearInterval(t);
  }, [session, connectionStatus, loadOpenRooms]);

  const handleFindMatch = async () => {
    clearError();
    if (isSearching) {
      await cancelMatchmaking();
    } else {
      await findMatch();
    }
  };

  const handleCreateRoom = async () => {
    clearError();
    setRoomBusy('creating');
    try {
      await createRoom();
    } finally {
      setRoomBusy('idle');
    }
  };

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

  const handleJoinOpenRoom = async (matchId: string) => {
    clearError();
    setRoomBusy('joining');
    try {
      await joinRoom(matchId);
    } finally {
      setRoomBusy('idle');
    }
  };

  const getResultColor = (result: string) => {
    if (result === 'victory') return 'border-primary/60';
    if (result === 'defeat') return 'border-tertiary/60';
    return 'border-secondary/60';
  };

  const getResultTextColor = (result: string) => {
    if (result === 'victory') return 'text-primary';
    if (result === 'defeat') return 'text-tertiary';
    return 'text-secondary';
  };

  const roomActionBusy = roomBusy !== 'idle';

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 relative z-10">
      <div className="md:hidden mb-8">
        <h1 className="font-orbitron text-3xl font-black tracking-tight text-on-surface mb-1">
          BATTLE LOBBY <span aria-hidden="true">😎</span>
        </h1>
        <p className="text-on-surface-variant text-[10px] font-orbitron uppercase tracking-widest flex flex-wrap gap-x-2 gap-y-1">
          <span className="text-secondary">{connectionStatus}</span>
          <span>·</span>
          <span>
            {openRooms.length} open room{openRooms.length === 1 ? '' : 's'}
          </span>
        </p>
      </div>

      {/* Desktop Header Info */}
      <div className="hidden md:flex justify-between items-end mb-12">
        <div>
          <h1 className="font-orbitron text-4xl font-black tracking-tight text-on-surface mb-2">
            BATTLE LOBBY <span aria-hidden="true">😎</span>
          </h1>
          <p className="text-on-surface-variant font-medium tracking-widest uppercase text-xs flex items-center flex-wrap gap-2">
            <span
              className={cn(
                'w-2 h-2 rounded-full shrink-0',
                connectionStatus === 'connected' ? 'bg-primary animate-pulse' : 'bg-tertiary',
              )}
            />
            <span>Connection: {connectionStatus}</span>
            <span aria-hidden="true">👏</span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 text-right">
          <div className="glass-panel px-4 py-2 rounded-xl border border-outline-variant/20 min-w-[10rem]">
            <div className="text-[9px] font-orbitron text-on-surface-variant uppercase tracking-widest">
              Open rooms (live)
            </div>
            <div className="font-orbitron font-black text-xl text-primary">{openRooms.length}</div>
            {roomsUpdatedAt && (
              <div className="text-[9px] font-inter text-on-surface-variant/70 mt-1">
                Updated {roomsUpdatedAt.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-6 text-tertiary text-xs font-orbitron text-center px-4 py-3 bg-tertiary/10 rounded-xl border border-tertiary/20">
          {error}
        </div>
      )}

      {/* Room code display */}
      {roomCode && (
        <div className="mb-6 glass-panel px-6 py-4 rounded-2xl border border-primary/30 text-center space-y-3">
          <span className="text-[10px] font-orbitron text-on-surface-variant uppercase tracking-widest block">
            Your room is listed under <span className="text-secondary">Open rooms</span> for other players — or copy the
            id to share. <span aria-hidden="true">🤯</span>
          </span>
          <span className="font-orbitron text-primary text-sm font-bold tracking-[0.12em] break-all select-all block">
            {roomCode}
          </span>
          <button
            type="button"
            onClick={() => void copyRoomCode()}
            className="text-[10px] font-orbitron font-bold tracking-widest uppercase px-4 py-2 rounded-xl border border-primary/40 text-primary hover:bg-primary/10 transition-colors"
          >
            {copied ? 'Copied! 👏' : 'Copy code'}
          </button>
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Matchmaking Controls */}
        <div className="lg:col-span-7 space-y-6">
          <section className="glass-panel p-6 rounded-2xl border border-outline-variant/10">
            <h3 className="font-orbitron text-sm font-bold tracking-widest text-on-surface-variant mb-6 uppercase">
              Select Protocol
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div
                onClick={() => setSelectedMode('classic')}
                className={cn(
                  'relative p-4 rounded-xl cursor-pointer group transition-all',
                  selectedMode === 'classic'
                    ? 'border-2 border-primary bg-primary/5'
                    : 'border border-outline-variant/30 hover:border-primary/50 bg-surface-container-high',
                )}
              >
                <div className="flex justify-between items-start mb-4">
                  <ICONS.swords
                    className={cn(
                      'w-8 h-8',
                      selectedMode === 'classic'
                        ? 'text-primary'
                        : 'text-on-surface-variant group-hover:text-primary transition-colors',
                    )}
                  />
                  <div
                    className={cn(
                      'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                      selectedMode === 'classic'
                        ? 'border-primary'
                        : 'border-outline-variant group-hover:border-primary transition-colors',
                    )}
                  >
                    {selectedMode === 'classic' && <div className="w-2 h-2 bg-primary rounded-full" />}
                  </div>
                </div>
                <div className="font-orbitron font-bold text-on-surface">Classic</div>
                <div className="text-[10px] text-on-surface-variant uppercase tracking-wider mt-1">
                  Standard Ruleset
                </div>
              </div>
              <div
                onClick={() => setSelectedMode('timed')}
                className={cn(
                  'relative p-4 rounded-xl cursor-pointer group transition-all',
                  selectedMode === 'timed'
                    ? 'border-2 border-secondary bg-secondary/5'
                    : 'border border-outline-variant/30 hover:border-secondary/50 bg-surface-container-high',
                )}
              >
                <div className="flex justify-between items-start mb-4">
                  <ICONS.timer
                    className={cn(
                      'w-8 h-8',
                      selectedMode === 'timed'
                        ? 'text-secondary'
                        : 'text-on-surface-variant group-hover:text-secondary transition-colors',
                    )}
                  />
                  <div
                    className={cn(
                      'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                      selectedMode === 'timed'
                        ? 'border-secondary'
                        : 'border-outline-variant group-hover:border-secondary transition-colors',
                    )}
                  >
                    {selectedMode === 'timed' && <div className="w-2 h-2 bg-secondary rounded-full" />}
                  </div>
                </div>
                <div className="font-orbitron font-bold text-on-surface">Timed</div>
                <div className="text-[10px] text-on-surface-variant uppercase tracking-wider mt-1">30s Blitz Phase</div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              type="button"
              onClick={handleFindMatch}
              disabled={roomActionBusy}
              className={cn(
                'relative group overflow-hidden font-orbitron font-black py-8 rounded-2xl transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
                isSearching
                  ? 'bg-tertiary text-on-tertiary shadow-[0_0_30px_rgba(255,108,144,0.3)]'
                  : 'bg-secondary text-on-secondary shadow-[0_0_30px_rgba(0,210,253,0.2)]',
              )}
            >
              <div className="relative z-10 flex flex-col items-center">
                <ICONS.search className={cn('w-10 h-10 mb-2', isSearching && 'animate-spin')} />
                <span className="tracking-[0.2em]">{isSearching ? 'CANCEL SEARCH' : 'FIND MATCH'}</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-white/30 overflow-hidden">
                <motion.div
                  animate={{ x: ['-100%', '300%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="h-full bg-white w-1/3"
                />
              </div>
            </button>
            <button
              type="button"
              onClick={() => void handleCreateRoom()}
              disabled={roomActionBusy}
              className="relative group overflow-hidden bg-surface-container-highest border border-outline-variant/30 text-primary font-orbitron font-black py-8 rounded-2xl transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              <div className="relative z-10 flex flex-col items-center">
                <ICONS.add className="w-10 h-10 mb-2" />
                <span className="tracking-[0.2em]">{roomBusy === 'creating' ? 'CREATING… 🤯' : 'CREATE ROOM'}</span>
              </div>
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          </div>

          {/* Public room browser — Nakama listMatches (open label, 1 player) */}
          <div className="glass-panel p-6 rounded-2xl border border-outline-variant/10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h3 className="font-orbitron text-[10px] font-bold tracking-[0.3em] text-on-surface-variant uppercase">
                  Open rooms <span aria-hidden="true">👏</span>
                </h3>
                <p className="text-[10px] text-on-surface-variant/80 font-inter mt-1 max-w-xl leading-relaxed">
                  Rooms waiting for a second player appear here automatically. Join one, or create your own — friends
                  can find you here too. 😎
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadOpenRooms()}
                disabled={roomsLoading || roomActionBusy}
                className="shrink-0 text-[10px] font-orbitron font-bold tracking-widest uppercase px-4 py-2 rounded-lg border border-secondary/40 text-secondary hover:bg-secondary/10 transition-colors disabled:opacity-40"
              >
                {roomsLoading ? 'Scanning…' : 'Refresh'}
              </button>
            </div>
            {roomsLoading && openRooms.length === 0 && (
              <p className="text-[10px] font-orbitron text-on-surface-variant uppercase tracking-widest py-4 text-center">
                Loading open rooms…
              </p>
            )}
            {!roomsLoading && openRooms.length === 0 && (
              <p className="text-[10px] font-inter text-on-surface-variant/70 py-3 px-2 rounded-lg bg-surface-container-low/50 border border-outline-variant/10">
                No open rooms right now. Use <span className="text-secondary font-orbitron">CREATE ROOM</span> — it
                appears here for everyone in the lobby. 🤯
              </p>
            )}
            {openRooms.length > 0 && (
              <ul className="space-y-2 max-h-56 overflow-y-auto">
                {openRooms.map((r) => (
                  <li
                    key={r.matchId}
                    className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-surface-container-high/80 border border-outline-variant/10"
                  >
                    <div className="min-w-0">
                      <div className="font-orbitron text-sm text-on-surface truncate">
                        Host: <span className="text-primary">{r.host}</span>
                      </div>
                      <div className="text-[10px] font-mono text-on-surface-variant/80 truncate mt-0.5">
                        {r.matchId}
                      </div>
                      <div className="text-[10px] text-secondary uppercase tracking-wider mt-1">{r.mode} mode</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleJoinOpenRoom(r.matchId)}
                      disabled={roomActionBusy}
                      className="shrink-0 font-orbitron text-[10px] font-bold tracking-widest uppercase px-4 py-2 rounded-lg bg-secondary text-on-secondary hover:opacity-90 transition-opacity disabled:opacity-40"
                    >
                      Join
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Searching overlay */}
          {isSearching && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-6 rounded-2xl border border-secondary/30 text-center"
            >
              <div className="flex items-center justify-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full"
                />
                <span className="font-orbitron text-secondary text-sm tracking-widest uppercase">
                  Searching for opponent...
                </span>
              </div>
              <p className="mt-3 text-on-surface-variant text-[10px] font-orbitron uppercase tracking-widest">
                Mode: {selectedMode} • Estimated wait: 10s
              </p>
            </motion.div>
          )}
        </div>

        {/* Right Column: Combat History */}
        <div className="lg:col-span-5 space-y-6">
          <section className="glass-panel h-full rounded-2xl border border-outline-variant/10 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-high/50">
              <div>
                <h3 className="font-orbitron text-sm font-bold tracking-widest text-on-surface uppercase">
                  Combat History <span aria-hidden="true">👏</span>
                </h3>
                <p className="text-[9px] text-on-surface-variant/70 font-inter mt-1">Per match: your opponent only</p>
              </div>
              <ICONS.history className="w-5 h-5 text-on-surface-variant cursor-pointer hover:text-primary transition-colors" />
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[500px]">
              {combatRows.length === 0 && (
                <div className="text-center py-12 text-on-surface-variant">
                  <ICONS.swords className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="font-orbitron text-xs uppercase tracking-widest opacity-50">No battles yet</p>
                  <p className="text-[10px] mt-2 opacity-30">Find a match to begin your campaign</p>
                </div>
              )}
              {combatRows.map((entry) => (
                <div
                  key={entry.id}
                  className={cn(
                    'p-4 rounded-xl bg-surface-container-high border-l-4 transition-colors group',
                    getResultColor(entry.result),
                  )}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded bg-secondary/20 flex items-center justify-center">
                        <ICONS.profile className="w-6 h-6 text-secondary/60" />
                      </div>
                      <div>
                        <div className="font-orbitron font-bold text-sm">{entry.opponent}</div>
                        <div className="text-[10px] text-on-surface-variant uppercase">
                          {entry.matchType} • {entry.mode}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn('font-orbitron font-black text-lg', getResultTextColor(entry.result))}>
                        {entry.result.toUpperCase()}
                      </div>
                      <div className={cn('text-[10px] font-bold', getResultTextColor(entry.result) + '/60')}>
                        {entry.rpDelta > 0 ? `+${entry.rpDelta}` : entry.rpDelta} RP
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-surface-container-low/50">
              <button className="w-full py-3 font-orbitron text-[10px] tracking-[0.2em] text-on-surface-variant hover:text-primary transition-colors uppercase font-bold">
                VIEW FULL ARCHIVE
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
