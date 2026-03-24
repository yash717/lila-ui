/**
 * Nakama authoritative match IDs look like: <uuid>.nebula_strike
 * Users may paste extra whitespace or the code embedded in a sentence.
 */
const ROOM_CODE_RE =
  /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.nebula_strike)/i;

export function normalizeRoomCode(raw: string): string {
  const t = raw.trim();
  const m = t.match(ROOM_CODE_RE);
  if (m) return m[1];
  return t.replace(/\s+/g, "");
}
