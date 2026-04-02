import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { Session, type Socket, type MatchData, type MatchmakerMatched } from '@heroiclabs/nakama-js';
import * as nakama from '../services/nakamaClient';
import { saveSessionPersisted, loadSessionPersisted, clearSessionPersisted } from '../auth/sessionStorage';
import { normalizeRoomCode } from '../lib/roomCode';

// --- Types matching server opcodes ---
export interface ServerGameState {
  board: string[];
  currentTurn: string;
  players: Record<string, { userId: string; username: string; mark: string }>;
  marks: Record<string, string>;
  score: Record<string, number>;
  gameOver: boolean;
  winner: string;
  mode: string;
  turnDeadline: number;
  moveCount: number;
  round: number;
  playerCount: number;
}

export interface GameOverResult {
  winner: string;
  winnerMark: string;
  winnerName: string;
  loserName: string;
  reason: string;
  board: string[];
  moveCount: number;
  duration: number;
}

export interface MatchHistoryEntry {
  id: string;
  opponent: string;
  opponentId: string;
  mode: string;
  result: 'victory' | 'defeat' | 'draw';
  rpDelta: number;
  occurredAt: string;
  matchType: string;
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'matchmaking' | 'in_match';

interface GameContextValue {
  // State
  session: Session | null;
  /** True after initial load / restore attempt (show app, not bootstrap loader). */
  authReady: boolean;
  connectionStatus: ConnectionStatus;
  gameState: ServerGameState | null;
  gameOverResult: GameOverResult | null;
  matchId: string | null;
  playerMark: string;
  username: string;
  selectedMode: string;
  roomCode: string;
  error: string | null;

  // Actions
  authenticate: (username: string) => Promise<void>;
  logout: () => void;
  setSelectedMode: (mode: string) => void;
  findMatch: () => Promise<void>;
  cancelMatchmaking: () => Promise<void>;
  createRoom: () => Promise<void>;
  joinRoom: (code: string) => Promise<void>;
  makeMove: (position: number) => Promise<void>;
  leaveMatch: () => Promise<void>;
  resetGame: () => void;
  clearError: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within <GameProvider>');
  return ctx;
}

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [gameState, setGameState] = useState<ServerGameState | null>(null);
  const [gameOverResult, setGameOverResult] = useState<GameOverResult | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [playerMark, setPlayerMark] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<string>('classic');
  const [roomCode, setRoomCode] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [matchmakerTicket, setMatchmakerTicket] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);

  // Cleanup socket on unmount
  useEffect(() => {
    return () => {
      socketRef.current?.disconnect(false);
    };
  }, []);

  // Set up socket event listeners
  const setupSocketListeners = useCallback((socket: Socket, currentSession: Session) => {
    socket.onmatchdata = (matchData: MatchData) => {
      const decoder = new TextDecoder();
      const jsonStr = decoder.decode(matchData.data as Uint8Array);
      const data = JSON.parse(jsonStr);

      if (matchData.op_code === 2) {
        // STATE_UPDATE
        setGameState(data);
        // Determine our mark
        if (currentSession.user_id && data.marks?.[currentSession.user_id]) {
          setPlayerMark(data.marks[currentSession.user_id]);
        }
      } else if (matchData.op_code === 3) {
        // GAME_OVER
        setGameOverResult(data);
      }
    };

    socket.onmatchmakermatched = async (matched: MatchmakerMatched) => {
      // Matchmaker found a partner — join the match
      try {
        if (!matched.match_id) return;
        const match = await nakama.joinMatch(socket, matched.match_id, matched.token);
        setMatchId(match.match_id);
        setConnectionStatus('in_match');
        setMatchmakerTicket(null);
      } catch (err: any) {
        setError('Failed to join matched game: ' + err.message);
        setConnectionStatus('connected');
      }
    };

    socket.ondisconnect = () => {
      setConnectionStatus('disconnected');
    };
  }, []);

  // Restore session from localStorage (JWT + refresh), refresh if access token expired
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const stored = loadSessionPersisted();
        if (!stored) return;

        let sess = Session.restore(stored.token, stored.refreshToken);
        const now = Math.floor(Date.now() / 1000);
        if (sess.isrefreshexpired(now)) {
          clearSessionPersisted();
          return;
        }
        if (sess.isexpired(now)) {
          sess = await nakama.refreshSessionToken(sess);
          saveSessionPersisted({
            token: sess.token,
            refreshToken: sess.refresh_token,
            username: stored.username,
          });
        }
        if (cancelled) return;

        const socket = nakama.createSocket();
        await nakama.connectSocket(socket, sess);
        if (cancelled) {
          socket.disconnect(false);
          return;
        }

        socketRef.current = socket;
        setupSocketListeners(socket, sess);
        setSession(sess);
        const fromAccount = await nakama.fetchDisplayName(sess);
        const displayName = (fromAccount || stored.username || sess.username || '').trim();
        setUsername(displayName);
        saveSessionPersisted({
          token: sess.token,
          refreshToken: sess.refresh_token,
          username: displayName || stored.username,
        });
        setConnectionStatus('connected');
      } catch {
        clearSessionPersisted();
        socketRef.current?.disconnect(false);
        socketRef.current = null;
      } finally {
        if (!cancelled) {
          setAuthReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
      socketRef.current?.disconnect(false);
      socketRef.current = null;
    };
  }, [setupSocketListeners]);

  // --- Actions ---

  const logout = useCallback(() => {
    socketRef.current?.disconnect(false);
    socketRef.current = null;
    clearSessionPersisted();
    setSession(null);
    setUsername('');
    setConnectionStatus('disconnected');
    setMatchId(null);
    setGameState(null);
    setGameOverResult(null);
    setPlayerMark('');
    setRoomCode('');
    setMatchmakerTicket(null);
    setError(null);
  }, []);

  const authenticate = useCallback(
    async (name: string) => {
      try {
        setConnectionStatus('connecting');
        setError(null);

        socketRef.current?.disconnect(false);
        socketRef.current = null;

        const sess = await nakama.authenticate(name);
        const fromAccount = await nakama.fetchDisplayName(sess);
        const displayName = (fromAccount || name.trim()).trim();
        saveSessionPersisted({
          token: sess.token,
          refreshToken: sess.refresh_token,
          username: displayName,
        });
        setSession(sess);
        setUsername(displayName);

        const socket = nakama.createSocket();
        await nakama.connectSocket(socket, sess);
        socketRef.current = socket;

        setupSocketListeners(socket, sess);
        setConnectionStatus('connected');
      } catch (err: any) {
        setError('Authentication failed: ' + err.message);
        setConnectionStatus('disconnected');
        throw err;
      }
    },
    [setupSocketListeners],
  );

  const findMatch = useCallback(async () => {
    if (!socketRef.current) throw new Error('Not connected');
    try {
      setError(null);
      setConnectionStatus('matchmaking');
      const result = await nakama.addMatchmaker(socketRef.current, selectedMode);
      setMatchmakerTicket(result.ticket);
    } catch (err: any) {
      setError('Matchmaking failed: ' + err.message);
      setConnectionStatus('connected');
    }
  }, [selectedMode]);

  const cancelMatchmaking = useCallback(async () => {
    if (!socketRef.current || !matchmakerTicket) return;
    try {
      await nakama.removeMatchmaker(socketRef.current, matchmakerTicket);
      setMatchmakerTicket(null);
      setConnectionStatus('connected');
    } catch (err: any) {
      setError('Failed to cancel matchmaking: ' + err.message);
    }
  }, [matchmakerTicket]);

  const createRoom = useCallback(async () => {
    if (!session || !socketRef.current) {
      setError('Not connected — wait for connection or refresh.');
      return;
    }
    try {
      setError(null);
      const newMatchId = await nakama.createMatch(session, selectedMode);
      const match = await nakama.joinMatch(socketRef.current, newMatchId);
      const mid = match?.match_id ?? newMatchId;
      setMatchId(mid);
      setRoomCode(mid);
      setConnectionStatus('in_match');
    } catch (err: any) {
      setError('Failed to create room: ' + (err?.message ?? String(err)));
    }
  }, [session, selectedMode]);

  const joinRoom = useCallback(async (code: string) => {
    if (!socketRef.current) {
      setError('Not connected — wait for connection or refresh.');
      return;
    }
    const normalized = normalizeRoomCode(code);
    if (!normalized) {
      setError('Enter a room code (format: …uuid….nebula_strike).');
      return;
    }
    try {
      setError(null);
      const match = await nakama.joinMatch(socketRef.current, normalized);
      const mid = match?.match_id ?? normalized;
      setMatchId(mid);
      setRoomCode(mid);
      setConnectionStatus('in_match');
    } catch (err: any) {
      setError('Failed to join room: ' + (err?.message ?? String(err)));
    }
  }, []);

  const makeMove = useCallback(
    async (position: number) => {
      if (!socketRef.current || !matchId) return;
      try {
        await nakama.sendMove(socketRef.current, matchId, position);
      } catch (err: any) {
        setError('Failed to send move: ' + err.message);
      }
    },
    [matchId],
  );

  const leaveMatchAction = useCallback(async () => {
    if (!socketRef.current || !matchId) return;
    try {
      await nakama.leaveMatch(socketRef.current, matchId);
      setMatchId(null);
      setGameState(null);
      setGameOverResult(null);
      setPlayerMark('');
      setRoomCode('');
      setConnectionStatus('connected');
    } catch (err: any) {
      setError('Failed to leave match: ' + err.message);
    }
  }, [matchId]);

  const resetGame = useCallback(() => {
    setGameState(null);
    setGameOverResult(null);
    setMatchId(null);
    setPlayerMark('');
    setRoomCode('');
    if (connectionStatus === 'in_match') {
      setConnectionStatus('connected');
    }
  }, [connectionStatus]);

  const clearError = useCallback(() => setError(null), []);

  const value: GameContextValue = {
    session,
    authReady,
    connectionStatus,
    gameState,
    gameOverResult,
    matchId,
    playerMark,
    username,
    selectedMode,
    roomCode,
    error,
    authenticate,
    logout,
    setSelectedMode,
    findMatch,
    cancelMatchmaking,
    createRoom,
    joinRoom,
    makeMove,
    leaveMatch: leaveMatchAction,
    resetGame,
    clearError,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
