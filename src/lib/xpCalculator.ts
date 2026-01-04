import { XP_CONFIG, TIME_THRESHOLDS, RANKS } from '../types';
import type { Question, Rank, QuestionSource, Difficulty } from '../types';
import { calculateDifficulty as calculateQuestionDifficulty } from './questionGenerator';

export interface XPResult {
  baseXp: number;
  speedBonus: number;
  streakBonus: number;
  difficultyBonus: number;
  totalXp: number;
}

// Get mastered threshold based on question source (legacy, uses Crazy thresholds)
function getMasteredThreshold(source: QuestionSource): number {
  return TIME_THRESHOLDS[source].mastered;
}

export function calculateXP(
  question: Question,
  correct: boolean,
  responseTimeMs: number,
  currentStreak: number,
  _difficulty?: Difficulty,
  masteredThresholdOverride?: number
): XPResult {
  if (!correct) {
    return {
      baseXp: 0,
      speedBonus: 0,
      streakBonus: 0,
      difficultyBonus: 0,
      totalXp: 0,
    };
  }

  const baseXp = XP_CONFIG.baseCorrect;

  // Speed bonus: under mastered threshold
  // Use provided threshold if available, otherwise fall back to legacy calculation
  const masteredThreshold = masteredThresholdOverride ?? getMasteredThreshold(question.source);
  const speedBonus = responseTimeMs < masteredThreshold
    ? XP_CONFIG.speedBonus
    : 0;

  // Streak bonus
  let streakBonus = 0;
  if (currentStreak >= 10) {
    streakBonus = XP_CONFIG.streak10Bonus;
  } else if (currentStreak >= 5) {
    streakBonus = XP_CONFIG.streak5Bonus;
  }

  // Difficulty bonus (based on question complexity, not game difficulty setting)
  const questionDifficulty = calculateQuestionDifficulty(question);
  const difficultyBonus = Math.min(questionDifficulty, XP_CONFIG.maxDifficultyBonus);

  const totalXp = baseXp + speedBonus + streakBonus + difficultyBonus;

  return {
    baseXp,
    speedBonus,
    streakBonus,
    difficultyBonus,
    totalXp,
  };
}

export function getRankForXP(totalXp: number): Rank {
  return RANKS.reduce((rank, r) =>
    totalXp >= r.xpRequired ? r : rank, RANKS[0]);
}

export function getXPProgressToNextRank(totalXp: number): {
  currentRank: Rank;
  nextRank: Rank | null;
  progress: number; // 0 to 1
  xpNeeded: number;
} {
  const currentRank = getRankForXP(totalXp);
  const currentIndex = RANKS.findIndex(r => r.level === currentRank.level);
  const nextRank = currentIndex < RANKS.length - 1 ? RANKS[currentIndex + 1] : null;

  if (!nextRank) {
    return {
      currentRank,
      nextRank: null,
      progress: 1,
      xpNeeded: 0,
    };
  }

  const xpIntoCurrentRank = totalXp - currentRank.xpRequired;
  const xpForNextRank = nextRank.xpRequired - currentRank.xpRequired;
  const progress = xpIntoCurrentRank / xpForNextRank;
  const xpNeeded = nextRank.xpRequired - totalXp;

  return {
    currentRank,
    nextRank,
    progress: Math.min(progress, 1),
    xpNeeded,
  };
}
