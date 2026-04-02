import { Session, Socket } from '@heroiclabs/nakama-js';
import { createNakamaClient, getOrCreateDeviceId, nakamaConfig } from '../config/nakama';
import type {
  CreateMatchRpcPayload,
  GetLeaderboardRpcPayload,
  GetMatchHistoryRpcPayload,
  LeaderboardRecordRpc,
  MatchHistoryEntryRpc,
} from '../types/nakamaRpc';

const client = createNakamaClient();

// --- Authentication ---
export async function authenticate(username: string): Promise<Session> {
  const deviceId = getOrCreateDeviceId();
  const session = await client.authenticateDevice(deviceId, true, username);
  await client.updateAccount(session, { display_name: username.trim() });
  return session;
}

/** Display name stored on the user account in Nakama (Postgres `users` / account API). */
export async function fetchDisplayName(session: Session): Promise<string> {
  const account = await client.getAccount(session);
  const u = account?.user;
  const display = u?.display_name?.trim();
  if (display) return display;
  const un = u?.username?.trim();
  if (un) return un;
  return '';
}

export interface OpenMatchRow {
  matchId: string;
  mode: string;
  /** Commander display name from match label (host). */
  host: string;
  size: number;
}

/** Authoritative matches waiting for a second player (label.open + size 1). */
export async function listOpenMatches(session: Session): Promise<OpenMatchRow[]> {
  let resp = await client.listMatches(session, 40, true, undefined, 1, 1, '');
  if ((resp.matches ?? []).length === 0) {
    resp = await client.listMatches(session, 40, true, undefined, undefined, undefined, '');
  }
  const matches = resp.matches ?? [];
  const rows: OpenMatchRow[] = [];
  for (const m of matches) {
    const id = m.match_id?.trim() ?? '';
    if (!id.endsWith('.nebula_strike')) continue;
    let host = '';
    let mode = 'classic';
    let open = false;
    try {
      const label = m.label ? (JSON.parse(m.label) as Record<string, unknown>) : {};
      host = typeof label.host === 'string' ? label.host : '';
      mode = typeof label.mode === 'string' ? label.mode : 'classic';
      open = label.open === true;
    } catch {
      continue;
    }
    if (!open) continue;
    const size = m.size ?? 0;
    if (size < 1 || size >= 2) continue;
    rows.push({
      matchId: id,
      mode,
      host: host || 'Commander',
      size,
    });
  }
  return rows;
}

/** Refresh access token; returns updated session (caller should persist). */
export async function refreshSessionToken(session: Session): Promise<Session> {
  return client.sessionRefresh(session);
}

// --- Socket ---
export function createSocket(): Socket {
  return client.createSocket(nakamaConfig.useSSL, false);
}

export async function connectSocket(socket: Socket, session: Session): Promise<void> {
  await socket.connect(session, true);
}

// --- Matchmaking ---
export async function addMatchmaker(
  socket: Socket,
  mode: string,
  minCount = 2,
  maxCount = 2,
): Promise<{ ticket: string }> {
  const ticket = await socket.addMatchmaker(
    `+properties.mode:${mode}`, // query: must match on mode
    minCount,
    maxCount,
    { mode }, // string properties
    {}, // numeric properties
  );
  return { ticket: ticket.ticket };
}

export async function removeMatchmaker(socket: Socket, ticket: string): Promise<void> {
  await socket.removeMatchmaker(ticket);
}

// --- Match operations ---
export async function createMatch(session: Session, mode: string): Promise<string> {
  const resp = await client.rpc(session, 'create_match', { mode });
  const data = resp.payload as CreateMatchRpcPayload | undefined;
  const id = data?.matchId?.trim() ?? '';
  if (!id) {
    throw new Error('create_match RPC returned no matchId');
  }
  return id;
}

export async function joinMatch(socket: Socket, matchId: string, token?: string): Promise<any> {
  return await socket.joinMatch(matchId, token);
}

export async function sendMove(socket: Socket, matchId: string, position: number): Promise<void> {
  const data = JSON.stringify({ position });
  await socket.sendMatchState(matchId, 1, data); // OpCode 1 = MOVE
}

export async function leaveMatch(socket: Socket, matchId: string): Promise<void> {
  await socket.leaveMatch(matchId);
}

// --- Leaderboard (DB-backed via Nakama leaderboard table) ---
export async function getLeaderboard(session: Session): Promise<{
  records: LeaderboardRecordRpc[];
  myRank: LeaderboardRecordRpc | null;
}> {
  const resp = await client.rpc(session, 'get_leaderboard', {});
  const data = resp.payload as GetLeaderboardRpcPayload | undefined;
  return {
    records: data?.records ?? [],
    myRank: data?.myRank ?? null,
  };
}

// --- Match History (user storage collection nebula_strike / combat_history) ---
export async function getMatchHistory(session: Session): Promise<MatchHistoryEntryRpc[]> {
  const resp = await client.rpc(session, 'get_match_history', {});
  const data = resp.payload as GetMatchHistoryRpcPayload | undefined;
  return data?.entries ?? [];
}

// --- Account ---
export async function getAccount(session: Session) {
  return await client.getAccount(session);
}

export { client };
