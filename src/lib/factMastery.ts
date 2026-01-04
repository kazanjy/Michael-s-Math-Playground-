import type { FactMastery, Operation } from '../types';
import { TIME_THRESHOLDS } from '../types';

// Local storage key for fact mastery data
const FACT_MASTERY_KEY = 'math_playground_fact_mastery';

// Generate a unique key for a fact (e.g., "multiply_7_8")
export function getFactKey(operation: Operation, operand1: number, operand2: number): string {
  // For commutative operations, normalize the order
  if (operation === 'multiply' || operation === 'add') {
    const [a, b] = operand1 <= operand2 ? [operand1, operand2] : [operand2, operand1];
    return `${operation}_${a}_${b}`;
  }
  return `${operation}_${operand1}_${operand2}`;
}

// Get all fact mastery data for a child
export function getFactMasteryData(childId: string): Map<string, FactMastery> {
  const stored = localStorage.getItem(`${FACT_MASTERY_KEY}_${childId}`);
  if (!stored) return new Map();

  const data = JSON.parse(stored) as Record<string, FactMastery>;
  return new Map(Object.entries(data));
}

// Save fact mastery data for a child
function saveFactMasteryData(childId: string, data: Map<string, FactMastery>): void {
  const obj = Object.fromEntries(data);
  localStorage.setItem(`${FACT_MASTERY_KEY}_${childId}`, JSON.stringify(obj));
}

// Calculate mastery score based on response time and correctness
// Returns a value from 0 to 1
function calculateMasteryScore(
  avgResponseTime: number,
  timesCorrect: number,
  timesSeen: number
): number {
  if (timesSeen === 0) return 0;

  // Accuracy component (0 to 0.5)
  const accuracy = timesCorrect / timesSeen;
  const accuracyScore = accuracy * 0.5;

  // Speed component (0 to 0.5)
  // Under 2s = full speed score, 2-5s = partial, over 5s = 0
  let speedScore = 0;
  if (avgResponseTime <= TIME_THRESHOLDS.mastered) {
    speedScore = 0.5;
  } else if (avgResponseTime <= TIME_THRESHOLDS.learning) {
    // Linear interpolation between mastered and learning thresholds
    const range = TIME_THRESHOLDS.learning - TIME_THRESHOLDS.mastered;
    const position = avgResponseTime - TIME_THRESHOLDS.mastered;
    speedScore = 0.5 * (1 - position / range);
  }

  return accuracyScore + speedScore;
}

// Record a fact attempt and update mastery
export function recordFactAttempt(
  childId: string,
  operation: Operation,
  operand1: number,
  operand2: number,
  isCorrect: boolean,
  responseTimeMs: number
): FactMastery {
  const data = getFactMasteryData(childId);
  const key = getFactKey(operation, operand1, operand2);

  const existing = data.get(key);

  const newTimesSeen = (existing?.timesSeen || 0) + 1;
  const newTimesCorrect = (existing?.timesCorrect || 0) + (isCorrect ? 1 : 0);

  // Calculate new average response time (only for correct answers)
  let newAvgResponseTime = existing?.avgResponseTime || responseTimeMs;
  if (isCorrect) {
    if (existing && existing.timesCorrect > 0) {
      // Weighted average giving more weight to recent performance
      newAvgResponseTime = existing.avgResponseTime * 0.7 + responseTimeMs * 0.3;
    } else {
      newAvgResponseTime = responseTimeMs;
    }
  }

  const masteryScore = calculateMasteryScore(newAvgResponseTime, newTimesCorrect, newTimesSeen);

  const updated: FactMastery = {
    id: key,
    childId,
    operation,
    operand1,
    operand2,
    masteryScore,
    timesSeen: newTimesSeen,
    timesCorrect: newTimesCorrect,
    avgResponseTime: newAvgResponseTime,
    lastSeen: new Date().toISOString(),
  };

  data.set(key, updated);
  saveFactMasteryData(childId, data);

  return updated;
}

// Get facts that need practice (sorted by mastery score, lowest first)
export function getFactsNeedingPractice(
  childId: string,
  operation: Operation,
  primaryNumbers: number[],
  multiplierRanges: { min: number; max: number }[]
): FactMastery[] {
  const data = getFactMasteryData(childId);
  const facts: FactMastery[] = [];

  // Generate all possible facts for the given configuration
  for (const primary of primaryNumbers) {
    for (const range of multiplierRanges) {
      for (let multiplier = range.min; multiplier <= range.max; multiplier++) {
        const key = getFactKey(operation, primary, multiplier);
        const existing = data.get(key);

        if (existing) {
          facts.push(existing);
        } else {
          // Create a placeholder for unseen facts (mastery 0)
          facts.push({
            id: key,
            childId,
            operation,
            operand1: primary,
            operand2: multiplier,
            masteryScore: 0,
            timesSeen: 0,
            timesCorrect: 0,
            avgResponseTime: 0,
            lastSeen: '',
          });
        }
      }
    }
  }

  // Sort by mastery score (lowest first = needs most practice)
  return facts.sort((a, b) => a.masteryScore - b.masteryScore);
}

// Get mastery level description
export function getMasteryLevel(score: number): 'needs_work' | 'learning' | 'mastered' {
  if (score >= 0.8) return 'mastered';
  if (score >= 0.4) return 'learning';
  return 'needs_work';
}

// Get statistics for a child's fact mastery
export function getFactMasteryStats(childId: string): {
  totalFacts: number;
  mastered: number;
  learning: number;
  needsWork: number;
  averageMastery: number;
} {
  const data = getFactMasteryData(childId);
  const facts = Array.from(data.values());

  if (facts.length === 0) {
    return {
      totalFacts: 0,
      mastered: 0,
      learning: 0,
      needsWork: 0,
      averageMastery: 0,
    };
  }

  let mastered = 0;
  let learning = 0;
  let needsWork = 0;
  let totalMastery = 0;

  for (const fact of facts) {
    const level = getMasteryLevel(fact.masteryScore);
    if (level === 'mastered') mastered++;
    else if (level === 'learning') learning++;
    else needsWork++;
    totalMastery += fact.masteryScore;
  }

  return {
    totalFacts: facts.length,
    mastered,
    learning,
    needsWork,
    averageMastery: totalMastery / facts.length,
  };
}
