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
  // Levels 1-3: Training Phase → T-38 Talon
  { level: 1, name: 'Cadet', title: 'Cadet', xpRequired: 0, icon: '🎖️', jet: 'T-38 Talon', jetIcon: '🛩️' },
  { level: 2, name: 'Senior Cadet', title: 'Senior Cadet', xpRequired: 50, icon: '🎖️🎖️', jet: 'T-38 Talon', jetIcon: '🛩️' },
  { level: 3, name: 'Lead Cadet', title: 'Lead Cadet', xpRequired: 120, icon: '🎖️🎖️🎖️', jet: 'T-38 Talon', jetIcon: '🛩️' },

  // Levels 4-6: Basic Enlisted → F-4 Phantom
  { level: 4, name: 'Airman', title: 'Airman', xpRequired: 200, icon: '🪖', jet: 'F-4 Phantom', jetIcon: '✈️' },
  { level: 5, name: 'Airman 1st Class', title: 'Airman 1st Class', xpRequired: 300, icon: '🪖⭐', jet: 'F-4 Phantom', jetIcon: '✈️' },
  { level: 6, name: 'Senior Airman', title: 'Senior Airman', xpRequired: 425, icon: '🪖⭐⭐', jet: 'F-4 Phantom', jetIcon: '✈️' },

  // Levels 7-9: NCO → F-5 Tiger
  { level: 7, name: 'Corporal', title: 'Corporal', xpRequired: 575, icon: '💎', jet: 'F-5 Tiger', jetIcon: '🐯' },
  { level: 8, name: 'Sergeant', title: 'Sergeant', xpRequired: 750, icon: '💎💎', jet: 'F-5 Tiger', jetIcon: '🐯' },
  { level: 9, name: 'Staff Sergeant', title: 'Staff Sergeant', xpRequired: 950, icon: '💎💎💎', jet: 'F-5 Tiger', jetIcon: '🐯' },

  // Levels 10-12: Senior NCO → F-14 Tomcat
  { level: 10, name: 'Tech Sergeant', title: 'Tech Sergeant', xpRequired: 1175, icon: '🔷', jet: 'F-14 Tomcat', jetIcon: '🐱' },
  { level: 11, name: 'Master Sergeant', title: 'Master Sergeant', xpRequired: 1425, icon: '🔷🔷', jet: 'F-14 Tomcat', jetIcon: '🐱' },
  { level: 12, name: 'Chief Master Sergeant', title: 'Chief Master Sgt', xpRequired: 1700, icon: '🔷🔷🔷', jet: 'F-14 Tomcat', jetIcon: '🐱' },

  // Levels 13-15: Junior Officer → F-15 Eagle
  { level: 13, name: '2nd Lieutenant', title: '2nd Lieutenant', xpRequired: 2000, icon: '🎗️', jet: 'F-15 Eagle', jetIcon: '🦅' },
  { level: 14, name: '1st Lieutenant', title: '1st Lieutenant', xpRequired: 2350, icon: '🎗️🎗️', jet: 'F-15 Eagle', jetIcon: '🦅' },
  { level: 15, name: 'Senior Lieutenant', title: 'Senior Lieutenant', xpRequired: 2750, icon: '🎗️🎗️🎗️', jet: 'F-15 Eagle', jetIcon: '🦅' },

  // Levels 16-18: Field Officer → F-16 Falcon
  { level: 16, name: 'Captain', title: 'Captain', xpRequired: 3200, icon: '🏅', jet: 'F-16 Falcon', jetIcon: '🦅' },
  { level: 17, name: 'Major', title: 'Major', xpRequired: 3700, icon: '🏅🏅', jet: 'F-16 Falcon', jetIcon: '🦅' },
  { level: 18, name: 'Lieutenant Colonel', title: 'Lt. Colonel', xpRequired: 4250, icon: '🏅🏅🏅', jet: 'F-16 Falcon', jetIcon: '🦅' },

  // Levels 19-21: Senior Officer → F/A-18 Hornet
  { level: 19, name: 'Colonel', title: 'Colonel', xpRequired: 4900, icon: '⭐', jet: 'F/A-18 Hornet', jetIcon: '🐝' },
  { level: 20, name: 'Senior Colonel', title: 'Senior Colonel', xpRequired: 5600, icon: '⭐⭐', jet: 'F/A-18 Hornet', jetIcon: '🐝' },
  { level: 21, name: 'Brigadier General', title: 'Brigadier General', xpRequired: 6400, icon: '⭐⭐⭐', jet: 'F/A-18 Hornet', jetIcon: '🐝' },

  // Levels 22-24: General Officer → F-22 Raptor
  { level: 22, name: 'Major General', title: 'Major General', xpRequired: 7300, icon: '🦅', jet: 'F-22 Raptor', jetIcon: '⚡' },
  { level: 23, name: 'Lieutenant General', title: 'Lt. General', xpRequired: 8300, icon: '🦅⭐', jet: 'F-22 Raptor', jetIcon: '⚡' },
  { level: 24, name: 'General', title: 'General', xpRequired: 9500, icon: '🦅⭐⭐', jet: 'F-22 Raptor', jetIcon: '⚡' },

  // Levels 25-27: Command → F-35 Lightning
  { level: 25, name: 'Air Marshal', title: 'Air Marshal', xpRequired: 10900, icon: '⚔️', jet: 'F-35 Lightning', jetIcon: '⚡' },
  { level: 26, name: 'Sky Marshal', title: 'Sky Marshal', xpRequired: 12500, icon: '⚔️⚔️', jet: 'F-35 Lightning', jetIcon: '⚡' },
  { level: 27, name: 'Supreme Commander', title: 'Supreme Commander', xpRequired: 14300, icon: '👑', jet: 'F-35 Lightning', jetIcon: '⚡' },

  // Levels 28-30: Legendary → SR-71 Blackbird & X-15
  { level: 28, name: 'Ace Pilot', title: 'Ace Pilot', xpRequired: 16500, icon: '🏆', jet: 'SR-71 Blackbird', jetIcon: '🦇' },
  { level: 29, name: 'Top Gun', title: 'Top Gun', xpRequired: 19000, icon: '🏆⭐', jet: 'SR-71 Blackbird', jetIcon: '🦇' },
  { level: 30, name: 'Living Legend', title: 'Living Legend ★', xpRequired: 22000, icon: '🏆👑', jet: 'X-15 Rocket Plane', jetIcon: '🚀' },
];

// Session configuration
export interface SessionConfig {
  // Difficulty level
  difficulty: Difficulty;

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

// Question source type
export type QuestionSource = 'speed' | 'mental';

// Question types
export interface Question {
  id: string;
  operation: Operation;
  operand1: number;
  operand2: number;
  correctAnswer: number;
  displayString: string;
  source: QuestionSource; // Where the question came from
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
    // Difficulty
    difficulty: 'medium',

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
  speedBonus: 5,       // Under mastered threshold
  streak5Bonus: 10,
  streak10Bonus: 25,
  maxDifficultyBonus: 5,
};

// Difficulty levels
export type Difficulty = 'easy' | 'medium' | 'crazy';

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  crazy: 'Crazy',
};

// Difficulty multipliers (applied to Crazy base times)
export const DIFFICULTY_MULTIPLIERS: Record<Difficulty, number> = {
  crazy: 1.0,
  medium: 1.5,
  easy: 2.0,
};

// Dogfight XP costs by difficulty
export const DOGFIGHT_XP_COST: Record<Difficulty, number> = {
  easy: 15,
  medium: 30,
  crazy: 45,
};

// Speed Times Tables base thresholds (Crazy difficulty, in ms)
const SPEED_BASE_THRESHOLDS = {
  mastered: 3000,  // Under 3 seconds = mastered (Crazy)
  slow: 5000,      // Over 5 seconds = slow (Crazy)
};

// Mental Math base thresholds by digit combo (Crazy difficulty, in ms)
const MENTAL_BASE_THRESHOLDS: Record<DigitCombo, { mastered: number; slow: number }> = {
  '1x1': { mastered: 3000, slow: 5000 },
  '1x2': { mastered: 5000, slow: 10000 },
  '1x3': { mastered: 8000, slow: 15000 },
  '2x2': { mastered: 10000, slow: 20000 },
  '2x3': { mastered: 15000, slow: 30000 },
  '3x3': { mastered: 25000, slow: 45000 },
};

// Get Speed Times Tables thresholds for a difficulty
export function getSpeedThresholds(difficulty: Difficulty): { mastered: number; slow: number } {
  const mult = DIFFICULTY_MULTIPLIERS[difficulty];
  return {
    mastered: Math.round(SPEED_BASE_THRESHOLDS.mastered * mult),
    slow: Math.round(SPEED_BASE_THRESHOLDS.slow * mult),
  };
}

// Get Mental Math thresholds for a digit combo and difficulty
export function getMentalThresholds(
  digitCombo: DigitCombo,
  difficulty: Difficulty
): { mastered: number; slow: number } {
  const base = MENTAL_BASE_THRESHOLDS[digitCombo];
  const mult = DIFFICULTY_MULTIPLIERS[difficulty];
  return {
    mastered: Math.round(base.mastered * mult),
    slow: Math.round(base.slow * mult),
  };
}

// Helper to determine digit combo from a question
export function getDigitComboFromQuestion(question: Question): DigitCombo {
  const digits1 = String(Math.abs(question.operand1)).length;
  const digits2 = String(Math.abs(question.operand2)).length;
  // Normalize to smaller x larger format
  const [smaller, larger] = [Math.min(digits1, digits2), Math.max(digits1, digits2)];
  const combo = `${smaller}x${larger}` as DigitCombo;
  // Clamp to valid combos (max 3x3)
  if (smaller > 3 || larger > 3) return '3x3';
  return combo;
}

// Get thresholds for any question based on source, difficulty, and digit combo
export function getQuestionThresholds(
  question: Question,
  difficulty: Difficulty
): { mastered: number; slow: number } {
  if (question.source === 'speed') {
    return getSpeedThresholds(difficulty);
  } else {
    const digitCombo = getDigitComboFromQuestion(question);
    return getMentalThresholds(digitCombo, difficulty);
  }
}

// Helper to get slow threshold (backwards compatible, uses default difficulty)
export function getSlowThreshold(source: QuestionSource, difficulty: Difficulty = 'medium'): number {
  if (source === 'speed') {
    return getSpeedThresholds(difficulty).slow;
  }
  // For mental, use 1x1 as default (caller should use getQuestionThresholds for accuracy)
  return getMentalThresholds('1x1', difficulty).slow;
}

// Legacy TIME_THRESHOLDS for backwards compatibility (uses Crazy thresholds)
export const TIME_THRESHOLDS = {
  speed: {
    mastered: SPEED_BASE_THRESHOLDS.mastered,
    learning: SPEED_BASE_THRESHOLDS.slow,
  },
  mental: {
    mastered: MENTAL_BASE_THRESHOLDS['1x1'].mastered,
    learning: MENTAL_BASE_THRESHOLDS['1x1'].slow,
  },
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
  responseTimeMs?: number; // For slow_answer triggers, how long it took
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
