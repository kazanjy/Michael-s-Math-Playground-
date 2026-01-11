// Michael's Math Gymnasium Types

// Available themes for word problems
export type Theme =
  | 'football'
  | 'baseball'
  | 'princesses'
  | 'pokemon'
  | 'minecraft'
  | 'standard'
  | 'custom';

export const THEME_OPTIONS: { value: Theme; label: string; emoji: string; colors: ThemeColors }[] = [
  { value: 'football', label: 'Football', emoji: '🏈', colors: { primary: '#166534', secondary: '#854d0e', accent: '#f59e0b' } },
  { value: 'baseball', label: 'Baseball', emoji: '⚾', colors: { primary: '#dc2626', secondary: '#1e40af', accent: '#ffffff' } },
  { value: 'princesses', label: 'Princesses', emoji: '👸', colors: { primary: '#db2777', secondary: '#a855f7', accent: '#fbbf24' } },
  { value: 'pokemon', label: 'Pokemon', emoji: '⚡', colors: { primary: '#dc2626', secondary: '#fbbf24', accent: '#3b82f6' } },
  { value: 'minecraft', label: 'Minecraft', emoji: '⛏️', colors: { primary: '#65a30d', secondary: '#78350f', accent: '#6b7280' } },
  { value: 'standard', label: 'Standard', emoji: '📚', colors: { primary: '#3b82f6', secondary: '#6366f1', accent: '#10b981' } },
  { value: 'custom', label: 'Custom', emoji: '✨', colors: { primary: '#8b5cf6', secondary: '#ec4899', accent: '#14b8a6' } },
];

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
}

// Grade levels K-12
export type GradeLevel = 'K' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12';

export const GRADE_OPTIONS: { value: GradeLevel; label: string }[] = [
  { value: 'K', label: 'Kindergarten' },
  { value: '1', label: '1st Grade' },
  { value: '2', label: '2nd Grade' },
  { value: '3', label: '3rd Grade' },
  { value: '4', label: '4th Grade' },
  { value: '5', label: '5th Grade' },
  { value: '6', label: '6th Grade' },
  { value: '7', label: '7th Grade' },
  { value: '8', label: '8th Grade' },
  { value: '9', label: '9th Grade' },
  { value: '10', label: '10th Grade' },
  { value: '11', label: '11th Grade' },
  { value: '12', label: '12th Grade' },
];

// Session end mode
export type SessionEndMode = 'chill' | 'race';

// Gymnasium session configuration
export interface GymnasiumSessionConfig {
  // Theme settings
  theme: Theme;
  customTheme?: string; // Only used when theme is 'custom'

  // Grade level
  gradeLevel: GradeLevel;

  // Session limits
  mode: 'questions' | 'time';
  questionCount?: number;
  timeLimitMinutes?: number;

  // End mode
  endMode: SessionEndMode; // 'chill' = finish current question, 'race' = hard stop
}

// LLM-generated question
export interface GymnasiumQuestion {
  id: string;
  questionText: string;
  correctAnswer: string; // Can be number, fraction (e.g., "3/4"), or decimal
  explanation: string;
  genre: string; // Math concept being tested (e.g., "multiplication", "fractions", "percentages")
  theme: Theme;
  gradeLevel: GradeLevel;
  createdAt: number;
}

// Answer with additional gymnasium fields
export interface GymnasiumAnswer {
  questionId: string;
  question: GymnasiumQuestion;
  userAnswer: string;
  isCorrect: boolean;
  timeSpentMs: number;
  scratchpadImageUrl?: string; // URL to saved scratchpad image
  attempts: number;
}

// Retry queue item for spaced repetition
export interface RetryQueueItem {
  genre: string; // The concept to retry
  originalQuestionId: string;
  scheduledAfterQuestion: number; // Show after N questions
  retryAttempt: number; // 1 = first retry (at +3), 2 = second retry (at +9)
  resolved: boolean;
}

// Gymnasium session state
export interface GymnasiumSessionState {
  config: GymnasiumSessionConfig;
  questions: GymnasiumQuestion[];
  answers: GymnasiumAnswer[];
  currentQuestionIndex: number;
  startTime: number;
  xpEarned: number;
  isComplete: boolean;
  retryQueue: RetryQueueItem[];
}

// Session result for summary
export interface GymnasiumSessionResult {
  config: GymnasiumSessionConfig;
  answers: GymnasiumAnswer[];
  totalXp: number;
  elapsedTimeMs: number;
  correctCount: number;
  incorrectCount: number;
}

// Default gymnasium session config
export function createDefaultGymnasiumConfig(): GymnasiumSessionConfig {
  return {
    theme: 'standard',
    gradeLevel: '3',
    mode: 'questions',
    questionCount: 10,
    endMode: 'chill',
  };
}

// Keypad configuration based on grade level
export interface KeypadConfig {
  hasDecimal: boolean;
  hasNegative: boolean;
  hasFraction: boolean;
}

export function getKeypadConfigForGrade(grade: GradeLevel): KeypadConfig {
  const gradeNum = grade === 'K' ? 0 : parseInt(grade, 10);

  return {
    // Decimals from 4th grade
    hasDecimal: gradeNum >= 4,
    // Negatives from 6th grade
    hasNegative: gradeNum >= 6,
    // Fractions from 3rd grade
    hasFraction: gradeNum >= 3,
  };
}

// Theme-based level names (for gamification - Phase 4)
export const THEME_LEVELS: Record<Theme, { name: string; levels: string[] }> = {
  football: {
    name: 'Football',
    levels: ['Rookie', 'Starter', 'Pro Bowler', 'All-Star', 'MVP', 'Hall of Famer'],
  },
  baseball: {
    name: 'Baseball',
    levels: ['Little Leaguer', 'Minor Leaguer', 'Rookie', 'All-Star', 'MVP', 'Hall of Famer'],
  },
  princesses: {
    name: 'Princesses',
    levels: ['Lady-in-Waiting', 'Duchess', 'Princess', 'Crown Princess', 'Queen', 'Empress'],
  },
  pokemon: {
    name: 'Pokemon',
    levels: ['Starter Trainer', 'Gym Challenger', 'Badge Collector', 'Elite Four', 'Champion', 'Pokemon Master'],
  },
  minecraft: {
    name: 'Minecraft',
    levels: ['Wood Tier', 'Stone Tier', 'Iron Tier', 'Gold Tier', 'Diamond Tier', 'Netherite Master'],
  },
  standard: {
    name: 'Standard',
    levels: ['Beginner', 'Learner', 'Practitioner', 'Expert', 'Master', 'Grandmaster'],
  },
  custom: {
    name: 'Custom',
    levels: ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5', 'Level 6'],
  },
};

// XP configuration for gymnasium
export const GYMNASIUM_XP_CONFIG = {
  baseCorrect: 15,           // Base XP for correct answer
  speedBonus: 10,            // Bonus for fast answers
  streakBonus5: 15,          // Bonus at 5 streak
  streakBonus10: 30,         // Bonus at 10 streak
  firstTryBonus: 5,          // Extra XP if correct on first try
  gradeMultiplier: {         // Higher grades = more XP
    'K': 1.0,
    '1': 1.0,
    '2': 1.1,
    '3': 1.2,
    '4': 1.3,
    '5': 1.4,
    '6': 1.5,
    '7': 1.6,
    '8': 1.7,
    '9': 1.8,
    '10': 1.9,
    '11': 2.0,
    '12': 2.1,
  } as Record<GradeLevel, number>,
};
