import type { Question, SessionConfig, FactMastery, DigitCombo } from '../types';
import { parseDigitCombo } from '../types';
import { getFactsNeedingPractice } from './factMastery';

// Generate a unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Get random integer between min and max (inclusive)
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Get random element from array
function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Determine which question source to use based on config
type QuestionSource = 'speed' | 'mental';

function pickQuestionSource(config: SessionConfig): QuestionSource {
  const sources: QuestionSource[] = [];
  if (config.speedTimesTablesEnabled && config.speedOperations.length > 0) {
    sources.push('speed');
  }
  if (config.generalMentalMathEnabled && config.mentalMathOperations.length > 0) {
    sources.push('mental');
  }
  if (sources.length === 0) {
    // Fallback to speed times tables
    return 'speed';
  }
  return randomElement(sources);
}

// Weighted random selection - items with lower mastery get higher weight
function weightedRandomSelect(facts: FactMastery[]): FactMastery {
  // Weight = (1 - mastery)^2 to heavily favor low-mastery facts
  const weights = facts.map(f => Math.pow(1 - f.masteryScore, 2) + 0.1); // +0.1 ensures mastered facts still appear occasionally
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  let random = Math.random() * totalWeight;
  for (let i = 0; i < facts.length; i++) {
    random -= weights[i];
    if (random <= 0) return facts[i];
  }
  return facts[facts.length - 1];
}

// Generate a number with specified digits
function generateNumberWithDigits(digits: number): number {
  if (digits === 1) return randomInt(1, 9);
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return randomInt(min, max);
}

// Generate multiplication question with optional spaced repetition
function generateMultiplicationQuestion(config: SessionConfig, childId?: string): Question {
  let primary: number;
  let multiplier: number;

  // Use spaced repetition if childId is provided
  if (childId) {
    const facts = getFactsNeedingPractice(
      childId,
      'multiply',
      config.primaryNumbers,
      config.multiplierRanges
    );

    if (facts.length > 0) {
      const selectedFact = weightedRandomSelect(facts);
      primary = selectedFact.operand1;
      multiplier = selectedFact.operand2;
    } else {
      // Fallback to random
      primary = randomElement(config.primaryNumbers);
      const range = randomElement(config.multiplierRanges);
      multiplier = randomInt(range.min, range.max);
    }
  } else {
    // Random selection without spaced repetition
    primary = randomElement(config.primaryNumbers);
    const range = randomElement(config.multiplierRanges);
    multiplier = randomInt(range.min, range.max);
  }

  const answer = primary * multiplier;

  return {
    id: generateId(),
    operation: 'multiply',
    operand1: primary,
    operand2: multiplier,
    correctAnswer: answer,
    displayString: `${primary} × ${multiplier}`,
  };
}

// Generate division question (always exact, no remainders) with optional spaced repetition
function generateDivisionQuestion(config: SessionConfig, childId?: string): Question {
  let primary: number;
  let multiplier: number;

  // Use spaced repetition if childId is provided
  if (childId) {
    const facts = getFactsNeedingPractice(
      childId,
      'divide',
      config.primaryNumbers,
      config.multiplierRanges
    );

    if (facts.length > 0) {
      const selectedFact = weightedRandomSelect(facts);
      // For division, operand1 is the dividend (product), operand2 is the divisor
      // But we store as primary and multiplier for consistency with multiplication
      primary = selectedFact.operand1;
      multiplier = selectedFact.operand2;
    } else {
      primary = randomElement(config.primaryNumbers);
      const range = randomElement(config.multiplierRanges);
      multiplier = randomInt(range.min, range.max);
    }
  } else {
    primary = randomElement(config.primaryNumbers);
    const range = randomElement(config.multiplierRanges);
    multiplier = randomInt(range.min, range.max);
  }

  // The dividend is the product, answer is the multiplier
  const dividend = primary * multiplier;

  return {
    id: generateId(),
    operation: 'divide',
    operand1: dividend,
    operand2: primary,
    correctAnswer: multiplier,
    displayString: `${dividend} ÷ ${primary}`,
  };
}


// ============================================
// General Mental Math question generators
// ============================================

// Generate mental math multiplication question using digit combos
function generateMentalMultiplyQuestion(combos: DigitCombo[]): Question {
  const combo = randomElement(combos);
  const [d1, d2] = parseDigitCombo(combo);
  const operand1 = generateNumberWithDigits(d1);
  const operand2 = generateNumberWithDigits(d2);
  const answer = operand1 * operand2;

  return {
    id: generateId(),
    operation: 'multiply',
    operand1,
    operand2,
    correctAnswer: answer,
    displayString: `${operand1} × ${operand2}`,
  };
}

// Generate mental math division question (no remainders)
function generateMentalDivideQuestion(combos: DigitCombo[]): Question {
  const combo = randomElement(combos);
  const [d1, d2] = parseDigitCombo(combo);

  // Generate divisor and quotient first to ensure no remainder
  const divisor = generateNumberWithDigits(d1);
  const quotient = generateNumberWithDigits(d2);
  const dividend = divisor * quotient;

  return {
    id: generateId(),
    operation: 'divide',
    operand1: dividend,
    operand2: divisor,
    correctAnswer: quotient,
    displayString: `${dividend} ÷ ${divisor}`,
  };
}

// Generate mental math addition question
function generateMentalAddQuestion(combos: DigitCombo[]): Question {
  const combo = randomElement(combos);
  const [d1, d2] = parseDigitCombo(combo);
  const operand1 = generateNumberWithDigits(d1);
  const operand2 = generateNumberWithDigits(d2);
  const answer = operand1 + operand2;

  return {
    id: generateId(),
    operation: 'add',
    operand1,
    operand2,
    correctAnswer: answer,
    displayString: `${operand1} + ${operand2}`,
  };
}

// Generate mental math subtraction question (always positive)
function generateMentalSubtractQuestion(combos: DigitCombo[]): Question {
  const combo = randomElement(combos);
  const [d1, d2] = parseDigitCombo(combo);
  let operand1 = generateNumberWithDigits(d1);
  let operand2 = generateNumberWithDigits(d2);

  // Ensure operand1 >= operand2 for positive result
  if (operand2 > operand1) {
    [operand1, operand2] = [operand2, operand1];
  }

  const answer = operand1 - operand2;

  return {
    id: generateId(),
    operation: 'subtract',
    operand1,
    operand2,
    correctAnswer: answer,
    displayString: `${operand1} − ${operand2}`,
  };
}

// Generate a mental math question based on enabled operations
function generateMentalMathQuestion(config: SessionConfig): Question {
  const operation = randomElement(config.mentalMathOperations);

  switch (operation) {
    case 'multiply':
      return generateMentalMultiplyQuestion(config.multiplyDigitCombos);
    case 'divide':
      return generateMentalDivideQuestion(config.divideDigitCombos);
    case 'add':
      return generateMentalAddQuestion(config.addDigitCombos);
    case 'subtract':
      return generateMentalSubtractQuestion(config.subtractDigitCombos);
    default:
      return generateMentalMultiplyQuestion(config.multiplyDigitCombos);
  }
}

// Generate a question based on config, with optional spaced repetition for a child
export function generateQuestion(config: SessionConfig, childId?: string): Question {
  // Pick which question source to use
  const source = pickQuestionSource(config);

  if (source === 'mental') {
    return generateMentalMathQuestion(config);
  }

  // Speed Times Tables mode
  const operation = randomElement(config.speedOperations);

  switch (operation) {
    case 'multiply':
      return generateMultiplicationQuestion(config, childId);
    case 'divide':
      return generateDivisionQuestion(config, childId);
    default:
      return generateMultiplicationQuestion(config, childId);
  }
}

// Generate a batch of questions
export function generateQuestions(config: SessionConfig, count: number): Question[] {
  const questions: Question[] = [];
  const seenQuestions = new Set<string>();

  for (let i = 0; i < count; i++) {
    let attempts = 0;
    let question: Question;

    // Try to avoid duplicates
    do {
      question = generateQuestion(config);
      attempts++;
    } while (seenQuestions.has(question.displayString) && attempts < 10);

    seenQuestions.add(question.displayString);
    questions.push(question);
  }

  return questions;
}

// Calculate difficulty score for XP bonus (1-5)
export function calculateDifficulty(question: Question): number {
  const { operation, operand1, operand2 } = question;

  switch (operation) {
    case 'multiply': {
      // Higher numbers = harder
      const maxOperand = Math.max(operand1, operand2);
      if (maxOperand <= 5) return 1;
      if (maxOperand <= 10) return 2;
      if (maxOperand <= 12) return 3;
      if (maxOperand <= 15) return 4;
      return 5;
    }
    case 'divide': {
      // Larger dividends = harder
      if (operand1 <= 25) return 1;
      if (operand1 <= 50) return 2;
      if (operand1 <= 100) return 3;
      if (operand1 <= 150) return 4;
      return 5;
    }
    case 'add':
    case 'subtract': {
      // More digits = harder
      const digits = Math.max(
        String(operand1).length,
        String(operand2).length
      );
      return Math.min(digits, 5);
    }
    default:
      return 1;
  }
}
