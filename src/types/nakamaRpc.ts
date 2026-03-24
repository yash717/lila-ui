/**
 * JSON shapes returned by custom Go RPCs (parsed from client.rpc().payload).
 * Matches nebula-server/rpc/*.go response structs.
 */

export interface CreateMatchRpcPayload {
  matchId?: string;
}

export interface LeaderboardRecordRpc {
  ownerId: string;
  username: string;
  score: number;
  /** Global rank (1 = top). */
  rank: number;
}

export interface GetLeaderboardRpcPayload {
  records?: LeaderboardRecordRpc[];
  /** Authenticated user's rank/score (may match a row in `records` or be outside top 20). */
  myRank?: LeaderboardRecordRpc | null;
}

/** Mirrors match.CombatHistoryEntry JSON from the server plugin. */
export interface MatchHistoryEntryRpc {
  id: string;
  opponent: string;
  opponentId: string;
  mode: string;
  result: string;
  rpDelta: number;
  occurredAt: string;
  matchType: string;
}

export interface GetMatchHistoryRpcPayload {
  entries?: MatchHistoryEntryRpc[];
}
