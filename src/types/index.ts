// Operation types
export type Operation = 'multiply' | 'divide' | 'add' | 'subtract';

// Digit combination for General Mental Math (e.g., "1x2" means 1-digit × 2-digit)
export type DigitCombo = '1x1' | '1x2' | '1x3' | '2x2' | '2x3' | '3x3';

// Parse digit combo into [digits1, digits2]
export function parseDigitCombo(combo: DigitCombo): [number, number] {
  const parts = combo.split('x').map(Number) as [number, number];
  return parts;
}

// All available digit combos
export const DIGIT_COMBOS: DigitCombo[] = ['1x1', '1x2', '1x3', '2x2', '2x3', '3x3'];

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
  icon: string;      // Emoji icon for rank
  jet: string;       // Jet name
  jetIcon: string;   // Jet emoji
}

export const RANKS: Rank[] = [
  { level: 1, name: 'Cadet', title: 'Cadet', xpRequired: 0, icon: '🎖️', jet: 'Training Prop', jetIcon: '🛩️' },
  { level: 2, name: 'Airman', title: 'Airman', xpRequired: 100, icon: '🪖', jet: 'Light Fighter', jetIcon: '✈️' },
  { level: 3, name: 'Corporal', title: 'Corporal', xpRequired: 300, icon: '⭐', jet: 'Scout Jet', jetIcon: '🛫' },
  { level: 4, name: 'Sergeant', title: 'Sergeant', xpRequired: 600, icon: '⭐⭐', jet: 'Strike Fighter', jetIcon: '🔥' },
  { level: 5, name: 'Lieutenant', title: 'Lieutenant', xpRequired: 1000, icon: '🎗️', jet: 'Interceptor', jetIcon: '⚡' },
  { level: 6, name: 'Captain', title: 'Captain', xpRequired: 1500, icon: '🏅', jet: 'Heavy Fighter', jetIcon: '💨' },
  { level: 7, name: 'Major', title: 'Major', xpRequired: 2200, icon: '🎖️⭐', jet: 'Stealth Jet', jetIcon: '👻' },
  { level: 8, name: 'Colonel', title: 'Colonel', xpRequired: 3000, icon: '🦅', jet: 'Super Hornet', jetIcon: '🐝' },
  { level: 9, name: 'Commander', title: 'Commander', xpRequired: 4000, icon: '⚔️', jet: 'Raptor', jetIcon: '🦅' },
  { level: 10, name: 'General', title: 'General', xpRequired: 5500, icon: '👑', jet: 'Black Hawk', jetIcon: '🦇' },
  { level: 11, name: 'Ace Pilot', title: 'Ace Pilot ★', xpRequired: 7500, icon: '🏆', jet: 'Legendary Phoenix', jetIcon: '🔱' },
];

// Session configuration
export interface SessionConfig {
  // Question source modes (can enable one or both)
  speedTimesTablesEnabled: boolean;
  generalMentalMathEnabled: boolean;

  // Speed Times Tables config (operations: multiply, divide)
  speedOperations: ('multiply' | 'divide')[];
  primaryNumbers: number[];           // Tables to practice (1-12)
  multiplierRanges: { min: number; max: number }[];

  // General Mental Math config (per-operation digit combos)
  mentalMathOperations: Operation[];  // Which operations are enabled
  multiplyDigitCombos: DigitCombo[];  // e.g., ['1x1', '1x2', '2x2']
  divideDigitCombos: DigitCombo[];
  addDigitCombos: DigitCombo[];
  subtractDigitCombos: DigitCombo[];

  // Legacy fields for backwards compatibility
  operations: Operation[];            // Combined operations (computed)
  addend1Digits: number;
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

// Default session config
export function createDefaultSessionConfig(): SessionConfig {
  return {
    // Modes
    speedTimesTablesEnabled: true,
    generalMentalMathEnabled: false,

    // Speed Times Tables
    speedOperations: ['multiply'],
    primaryNumbers: [2, 3, 4, 5],
    multiplierRanges: [{ min: 1, max: 10 }],

    // General Mental Math
    mentalMathOperations: [],
    multiplyDigitCombos: ['1x1'],
    divideDigitCombos: ['1x1'],
    addDigitCombos: ['1x1'],
    subtractDigitCombos: ['1x1'],

    // Legacy
    operations: ['multiply'],
    addend1Digits: 1,
    addend2Digits: 1,

    // Session limits
    mode: 'questions',
    questionCount: 20,
  };
}

// Compute combined operations from config
export function computeOperations(config: SessionConfig): Operation[] {
  const ops = new Set<Operation>();

  if (config.speedTimesTablesEnabled) {
    config.speedOperations.forEach(op => ops.add(op));
  }

  if (config.generalMentalMathEnabled) {
    config.mentalMathOperations.forEach(op => ops.add(op));
  }

  return Array.from(ops);
}

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
  // XP loss when no resources during dogfight (uses missile OR bullets, flare OR chaff)
  xpLossNoWeapon: 15,        // No missile or bullets available
  xpLossNoCountermeasure: 10, // No flare or chaff available
  // Resource usage per dogfight
  missilesPerFight: 1,
  bulletsPerFight: 5,
  flaresPerFight: 1,
  chaffPerFight: 1,
};

// Dogfight trigger reasons
export type DogfightTrigger = 'wrong_answer' | 'slow_answer';

// Dogfight result
export interface DogfightResult {
  occurred: boolean;
  trigger: DogfightTrigger;
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
