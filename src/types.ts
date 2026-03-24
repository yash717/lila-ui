export type Screen = 'splash' | 'lobby' | 'game' | 'victory' | 'leaderboard' | 'settings';

export interface Player {
  id: string;
  name: string;
  rank: string;
  level: string;
  avatar: string;
  points: number;
  winRate: string;
  streak: number;
  wins: number;
  losses: number;
}

export interface MatchHistory {
  id: string;
  opponent: string;
  opponentAvatar: string;
  type: string;
  time: string;
  result: 'victory' | 'defeat' | 'draw';
  rpChange: number;
}
