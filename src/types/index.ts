// User and profile types
export interface Profile {
  id: string;
  email: string;
  isParent: boolean;
  createdAt: string;
}

export interface ChildProfile {
  id: string;
  parentId: string;
  name: string;
  avatar: string;
  currentRank: number;
  totalXp: number;
  createdAt: string;
}

// Rank definitions (simplified for XP tracking)
export interface Rank {
  level: number;
  name: string;
  xpRequired: number;
}

// Simple rank progression based on XP
export const RANKS: Rank[] = [
  { level: 1, name: 'Beginner', xpRequired: 0 },
  { level: 2, name: 'Learner', xpRequired: 100 },
  { level: 3, name: 'Student', xpRequired: 250 },
  { level: 4, name: 'Practitioner', xpRequired: 500 },
  { level: 5, name: 'Skilled', xpRequired: 850 },
  { level: 6, name: 'Advanced', xpRequired: 1300 },
  { level: 7, name: 'Expert', xpRequired: 1900 },
  { level: 8, name: 'Master', xpRequired: 2700 },
  { level: 9, name: 'Grandmaster', xpRequired: 3800 },
  { level: 10, name: 'Legend', xpRequired: 5000 },
];
