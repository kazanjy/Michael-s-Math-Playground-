import type { Theme, GradeLevel, GymnasiumQuestion } from '../types/gymnasium';

interface GenerateQuestionParams {
  theme: Theme;
  customTheme?: string;
  gradeLevel: GradeLevel;
  previousQuestion?: GymnasiumQuestion;
  recentQuestions?: GymnasiumQuestion[];
  isRetry?: boolean;
  retryGenre?: string;
}

interface GeneratedQuestionResponse {
  question: string;
  answer: string;
  explanation: string;
  genre: string;
}

// Generate a unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a math word problem using the OpenAI API
 */
export async function generateQuestion(params: GenerateQuestionParams): Promise<GymnasiumQuestion> {
  const { theme, customTheme, gradeLevel, previousQuestion, recentQuestions, isRetry, retryGenre } = params;

  try {
    const recentTexts = (recentQuestions || [])
      .slice(-5)
      .map(q => q.questionText);

    const response = await fetch('/api/generate-question', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        theme,
        customTheme: theme === 'custom' ? customTheme : undefined,
        gradeLevel,
        previousQuestion: previousQuestion?.questionText,
        recentQuestions: recentTexts,
        isRetry,
        retryGenre,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data: GeneratedQuestionResponse = await response.json();

    return {
      id: generateId(),
      questionText: data.question,
      correctAnswer: data.answer,
      explanation: data.explanation,
      genre: data.genre,
      theme,
      gradeLevel,
      createdAt: Date.now(),
    };
  } catch (error) {
    console.error('Error generating question:', error);
    throw error;
  }
}

/**
 * Check if an answer is correct
 * Handles various formats: whole numbers, decimals, fractions
 */
export function checkAnswer(userAnswer: string, correctAnswer: string): boolean {
  // Normalize both answers
  const normalizedUser = normalizeAnswer(userAnswer);
  const normalizedCorrect = normalizeAnswer(correctAnswer);

  // Direct string comparison first
  if (normalizedUser === normalizedCorrect) {
    return true;
  }

  // Try numeric comparison
  const userNum = parseAnswerToNumber(normalizedUser);
  const correctNum = parseAnswerToNumber(normalizedCorrect);

  if (userNum !== null && correctNum !== null) {
    // Allow small floating point differences
    return Math.abs(userNum - correctNum) < 0.0001;
  }

  return false;
}

/**
 * Normalize an answer string
 */
function normalizeAnswer(answer: string): string {
  return answer
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '') // Remove all spaces
    .replace(/^-0$/, '0') // Normalize -0 to 0
    .replace(/\.0+$/, ''); // Remove trailing .0
}

/**
 * Parse an answer to a number, handling fractions
 */
function parseAnswerToNumber(answer: string): number | null {
  // Handle fractions (e.g., "3/4")
  if (answer.includes('/')) {
    const parts = answer.split('/');
    if (parts.length === 2) {
      const numerator = parseFloat(parts[0]);
      const denominator = parseFloat(parts[1]);
      if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
        return numerator / denominator;
      }
    }
    return null;
  }

  // Handle regular numbers
  const num = parseFloat(answer);
  return isNaN(num) ? null : num;
}

/**
 * Format an answer for display
 */
export function formatAnswer(answer: string): string {
  // If it's a fraction, return as-is
  if (answer.includes('/')) {
    return answer;
  }

  // If it's a decimal, format nicely
  const num = parseFloat(answer);
  if (!isNaN(num)) {
    // If it's a whole number, don't show decimals
    if (Number.isInteger(num)) {
      return num.toString();
    }
    // Otherwise, show up to 2 decimal places
    return num.toFixed(2).replace(/\.?0+$/, '');
  }

  return answer;
}

/**
 * Generate a fallback question if API fails
 * This ensures the app still works even without the API
 */
export function generateFallbackQuestion(
  gradeLevel: GradeLevel,
  theme: Theme
): GymnasiumQuestion {
  const gradeNum = gradeLevel === 'K' ? 0 : parseInt(gradeLevel, 10);

  // Simple arithmetic based on grade
  let num1: number, num2: number, operation: string, answer: number, genre: string;

  if (gradeNum <= 2) {
    // Addition/subtraction with small numbers
    num1 = Math.floor(Math.random() * 10) + 1;
    num2 = Math.floor(Math.random() * 10) + 1;
    if (Math.random() > 0.5) {
      operation = 'plus';
      answer = num1 + num2;
      genre = 'addition';
    } else {
      // Ensure no negative result
      if (num1 < num2) [num1, num2] = [num2, num1];
      operation = 'minus';
      answer = num1 - num2;
      genre = 'subtraction';
    }
  } else if (gradeNum <= 5) {
    // Multiplication with small numbers
    num1 = Math.floor(Math.random() * 12) + 1;
    num2 = Math.floor(Math.random() * 12) + 1;
    operation = 'times';
    answer = num1 * num2;
    genre = 'multiplication';
  } else {
    // Larger multiplication or simple algebra
    num1 = Math.floor(Math.random() * 20) + 5;
    num2 = Math.floor(Math.random() * 15) + 2;
    operation = 'times';
    answer = num1 * num2;
    genre = 'multiplication';
  }

  const questionText = `What is ${num1} ${operation} ${num2}?`;
  const explanation = `${num1} ${operation === 'plus' ? '+' : operation === 'minus' ? '-' : 'x'} ${num2} = ${answer}`;

  return {
    id: generateId(),
    questionText,
    correctAnswer: answer.toString(),
    explanation,
    genre,
    theme,
    gradeLevel,
    createdAt: Date.now(),
  };
}
