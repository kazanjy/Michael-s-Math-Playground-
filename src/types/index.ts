// Operation types
export type Operation = 'multiply' | 'divide' | 'add' | 'subtract';

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

// Rank definitions
export interface Rank {
  level: number;
  name: string;
  title: string;
  xpRequired: number;
}

export const RANKS: Rank[] = [
  { level: 1, name: 'Cadet', title: 'Cadet', xpRequired: 0 },
  { level: 2, name: 'Airman', title: 'Airman', xpRequired: 100 },
  { level: 3, name: 'Corporal', title: 'Corporal', xpRequired: 300 },
  { level: 4, name: 'Sergeant', title: 'Sergeant', xpRequired: 600 },
  { level: 5, name: 'Lieutenant', title: 'Lieutenant', xpRequired: 1000 },
  { level: 6, name: 'Captain', title: 'Captain', xpRequired: 1500 },
  { level: 7, name: 'Major', title: 'Major', xpRequired: 2200 },
  { level: 8, name: 'Colonel', title: 'Colonel', xpRequired: 3000 },
  { level: 9, name: 'Commander', title: 'Commander', xpRequired: 4000 },
  { level: 10, name: 'General', title: 'General', xpRequired: 5500 },
  { level: 11, name: 'Ace Pilot', title: 'Ace Pilot ★', xpRequired: 7500 },
];

// Session configuration
export interface SessionConfig {
  operations: Operation[];

  // Multiplication/Division config
  primaryNumbers: number[];
  multiplierRanges: { min: number; max: number }[];

  // Addition/Subtraction config
  addend1Digits: number; // 1, 2, or 3 digits
  addend2Digits: number;

  // Session limits
  mode: 'questions' | 'time';
  questionCount?: number;
  timeLimitMinutes?: number;
}

// Question types
export interface Question {
  id: string;
  operation: Operation;
  operand1: number;
  operand2: number;
  correctAnswer: number;
  displayString: string;
}

// Answer tracking
export interface Answer {
  questionId: string;
  question: Question;
  userAnswer: number | null;
  isCorrect: boolean;
  responseTimeMs: number;
  attempts: number;
}

// Fact mastery (spaced repetition)
export interface FactMastery {
  id: string;
  childId: string;
  operation: Operation;
  operand1: number;
  operand2: number;
  masteryScore: number; // 0 to 1
  timesSeen: number;
  timesCorrect: number;
  avgResponseTime: number;
  lastSeen: string;
}

// Session data
export interface Session {
  id: string;
  childId: string;
  startedAt: string;
  endedAt?: string;
  questionsCount: number;
  correctCount: number;
  xpEarned: number;
  avgResponseTime: number;
  bestStreak: number;
  sessionType: 'free_play' | 'homework';
  config: SessionConfig;
}

// Session state (in-progress session)
export interface SessionState {
  config: SessionConfig;
  questions: Question[];
  answers: Answer[];
  currentQuestionIndex: number;
  currentStreak: number;
  bestStreak: number;
  startTime: number;
  xpEarned: number;
  isComplete: boolean;
}

// Homework assignment
export interface Homework {
  id: string;
  childId: string;
  assignedBy: string;
  config: SessionConfig;
  assignedAt: string;
  dueAt?: string;
  completedAt?: string;
}

// Session presets
export interface SessionPreset {
  name: string;
  description: string;
  config: Partial<SessionConfig>;
}

export const SESSION_PRESETS: SessionPreset[] = [
  {
    name: 'Easy',
    description: '1-5 tables, ×1-5',
    config: {
      operations: ['multiply'],
      primaryNumbers: [1, 2, 3, 4, 5],
      multiplierRanges: [{ min: 1, max: 5 }],
      mode: 'questions',
      questionCount: 20,
    },
  },
  {
    name: 'Medium',
    description: '1-10 tables, ×1-10',
    config: {
      operations: ['multiply'],
      primaryNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      multiplierRanges: [{ min: 1, max: 10 }],
      mode: 'questions',
      questionCount: 20,
    },
  },
  {
    name: 'Hard',
    description: '6-12 tables, ×6-12',
    config: {
      operations: ['multiply'],
      primaryNumbers: [6, 7, 8, 9, 10, 11, 12],
      multiplierRanges: [{ min: 6, max: 12 }],
      mode: 'questions',
      questionCount: 20,
    },
  },
];

// XP calculation constants
export const XP_CONFIG = {
  baseCorrect: 10,
  speedBonus: 5,       // Under 2 seconds
  streak5Bonus: 10,
  streak10Bonus: 25,
  maxDifficultyBonus: 5,
};

// Response time thresholds (ms)
export const TIME_THRESHOLDS = {
  mastered: 2000,      // Under 2 seconds = mastered
  learning: 5000,      // 2-5 seconds = learning
  // Over 5 seconds = needs work
};

// Jet resources (ammunition and countermeasures)
export interface JetResources {
  missiles: number;
  bullets: number;
  flares: number;
  chaff: number;
}

// Resource earning thresholds (XP needed to earn each resource)
export const RESOURCE_CONFIG = {
  // XP thresholds to earn resources
  xpPerMissile: 50,      // Every 50 XP earns a missile
  xpPerBulletPack: 25,   // Every 25 XP earns 10 bullets
  xpPerFlare: 30,        // Every 30 XP earns a flare
  xpPerChaff: 30,        // Every 30 XP earns a chaff
  bulletsPerPack: 10,
  // XP loss when no resources during dogfight
  xpLossNoMissile: 15,
  xpLossNoBullets: 10,
  xpLossNoFlare: 8,
  xpLossNoChaff: 8,
  // Resource usage per dogfight
  missilesPerFight: 1,
  bulletsPerFight: 5,
  flaresPerFight: 1,
  chaffPerFight: 1,
  // Dogfight frequency (every N correct answers)
  dogfightFrequency: 5,
};

// Dogfight result
export interface DogfightResult {
  occurred: boolean;
  enemyType: string;
  missilesUsed: number;
  bulletsUsed: number;
  flaresUsed: number;
  chaffUsed: number;
  xpLost: number;
  victory: boolean;
}

// Session resource tracking
export interface SessionResourceStats {
  missilesEarned: number;
  bulletsEarned: number;
  flaresEarned: number;
  chaffEarned: number;
  missilesUsed: number;
  bulletsUsed: number;
  flaresUsed: number;
  chaffUsed: number;
  xpLostToDogfights: number;
  dogfightsWon: number;
  dogfightsLost: number;
}
