import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Target, Zap, RotateCcw, Loader2 } from 'lucide-react';
import { GymnasiumNumberPad } from '../components/calculator/GymnasiumNumberPad';
import { Scratchpad } from '../components/scratchpad/Scratchpad';
import { useAuth } from '../contexts/AuthContext';
import { generateQuestion, checkAnswer, generateFallbackQuestion } from '../lib/questionService';
import {
  type GymnasiumSessionConfig,
  type GymnasiumQuestion,
  type GymnasiumAnswer,
  type RetryQueueItem,
  createDefaultGymnasiumConfig,
  getKeypadConfigForGrade,
  THEME_OPTIONS,
  GYMNASIUM_XP_CONFIG,
} from '../types/gymnasium';

interface FeedbackState {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
  xpEarned: number;
}

export function GymnasiumPracticePage() {
  const navigate = useNavigate();
  const { currentChild, updateChildXp } = useAuth();

  // Load config from sessionStorage
  const [config] = useState<GymnasiumSessionConfig>(() => {
    const defaults = createDefaultGymnasiumConfig();
    const stored = sessionStorage.getItem('gymnasiumConfig');
    if (stored) {
      try {
        return { ...defaults, ...JSON.parse(stored) };
      } catch {
        return defaults;
      }
    }
    return defaults;
  });

  // Get theme colors
  const themeOption = THEME_OPTIONS.find(t => t.value === config.theme) || THEME_OPTIONS[5];

  // Session state
  const [currentQuestion, setCurrentQuestion] = useState<GymnasiumQuestion | null>(null);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [answers, setAnswers] = useState<GymnasiumAnswer[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Spaced repetition
  const [retryQueue, setRetryQueue] = useState<RetryQueueItem[]>([]);
  const [isRetryQuestion, setIsRetryQuestion] = useState(false);
  const retryQueueRef = useRef<RetryQueueItem[]>([]);

  // Timer state
  const [elapsedTime, setElapsedTime] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const startTimeRef = useRef(Date.now());

  // Scratchpad ref for capturing images (future use for saving work)
  const _scratchpadRef = useRef<{ getImage: () => string | null }>({ getImage: () => null });
  void _scratchpadRef; // Suppress unused warning - will be used for saving scratchpad images

  // Keypad config based on grade
  const keypadConfig = getKeypadConfigForGrade(config.gradeLevel);

  // Timer for timed mode
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTimeRef.current);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Keep retry queue ref in sync
  useEffect(() => {
    retryQueueRef.current = retryQueue;
  }, [retryQueue]);

  // Load initial question
  useEffect(() => {
    loadNextQuestion();
  }, []);

  // Count unresolved retry items
  const unresolvedRetryCount = retryQueue.filter(r => !r.resolved).length;

  // Check if session should end
  const isSessionComplete = useCallback(() => {
    // Don't end if there are unresolved retry items
    if (unresolvedRetryCount > 0) return false;

    if (config.mode === 'questions') {
      return answers.length >= (config.questionCount || 10);
    } else {
      const timeLimitMs = (config.timeLimitMinutes || 10) * 60 * 1000;
      // In race mode, end immediately; in chill mode, wait for question completion
      if (config.endMode === 'race') {
        return elapsedTime >= timeLimitMs;
      } else {
        return elapsedTime >= timeLimitMs && !isLoadingQuestion;
      }
    }
  }, [config, answers.length, elapsedTime, unresolvedRetryCount, isLoadingQuestion]);

  // End session
  useEffect(() => {
    if (isSessionComplete() && !isProcessing && !isLoadingQuestion) {
      // Save session data
      const sessionData = {
        config,
        answers,
        totalXp,
        elapsedTimeMs: elapsedTime,
        correctCount: answers.filter(a => a.isCorrect).length,
        incorrectCount: answers.filter(a => !a.isCorrect).length,
        bestStreak,
      };
      sessionStorage.setItem('gymnasiumResult', JSON.stringify(sessionData));

      // Update child XP
      if (currentChild && totalXp > 0) {
        updateChildXp(currentChild.id, totalXp);
      }

      navigate('/summary');
    }
  }, [isSessionComplete, isProcessing, isLoadingQuestion, answers, totalXp, elapsedTime, config, currentChild, updateChildXp, navigate, bestStreak]);

  // Load the next question
  const loadNextQuestion = useCallback(async (previousQuestion?: GymnasiumQuestion, isRetry?: boolean, retryGenre?: string) => {
    setIsLoadingQuestion(true);
    setLoadError(null);

    try {
      const question = await generateQuestion({
        theme: config.theme,
        customTheme: config.customTheme,
        gradeLevel: config.gradeLevel,
        previousQuestion: previousQuestion,
        isRetry,
        retryGenre,
      });

      setCurrentQuestion(question);
      setQuestionStartTime(Date.now());
      setAttempts(0);
      setUserAnswer('');
      setIsRetryQuestion(!!isRetry);
    } catch (error) {
      console.error('Failed to generate question:', error);
      setLoadError('Failed to load question. Using fallback.');

      // Use fallback question
      const fallback = generateFallbackQuestion(config.gradeLevel, config.theme);
      setCurrentQuestion(fallback);
      setQuestionStartTime(Date.now());
      setAttempts(0);
      setUserAnswer('');
      setIsRetryQuestion(false);
    } finally {
      setIsLoadingQuestion(false);
    }
  }, [config]);

  // Get next question from retry queue or generate new
  const getNextQuestion = useCallback((currentAnswersLength: number) => {
    // Check if any retry items are ready
    const readyRetry = retryQueueRef.current.find(
      r => !r.resolved && r.scheduledAfterQuestion <= currentAnswersLength
    );

    if (readyRetry) {
      loadNextQuestion(currentQuestion || undefined, true, readyRetry.genre);
    } else {
      loadNextQuestion(currentQuestion || undefined, false);
    }
  }, [loadNextQuestion, currentQuestion]);

  // Calculate XP
  const calculateXp = (timeSpentMs: number, isFirstTry: boolean): number => {
    let xp = GYMNASIUM_XP_CONFIG.baseCorrect;

    // Speed bonus (under 30 seconds)
    if (timeSpentMs < 30000) {
      xp += GYMNASIUM_XP_CONFIG.speedBonus;
    }

    // Streak bonus
    if (currentStreak >= 10) {
      xp += GYMNASIUM_XP_CONFIG.streakBonus10;
    } else if (currentStreak >= 5) {
      xp += GYMNASIUM_XP_CONFIG.streakBonus5;
    }

    // First try bonus
    if (isFirstTry) {
      xp += GYMNASIUM_XP_CONFIG.firstTryBonus;
    }

    // Grade multiplier
    xp = Math.round(xp * GYMNASIUM_XP_CONFIG.gradeMultiplier[config.gradeLevel]);

    return xp;
  };

  // Handle answer submission
  const handleSubmit = () => {
    if (!userAnswer || isProcessing || !currentQuestion) return;

    const timeSpent = Date.now() - questionStartTime;
    const isCorrect = checkAnswer(userAnswer, currentQuestion.correctAnswer);
    const isFirstTry = attempts === 0;

    if (isCorrect) {
      const xpEarned = calculateXp(timeSpent, isFirstTry);

      // Record answer
      const answer: GymnasiumAnswer = {
        questionId: currentQuestion.id,
        question: currentQuestion,
        userAnswer,
        isCorrect: true,
        timeSpentMs: timeSpent,
        attempts: attempts + 1,
      };
      setAnswers(prev => [...prev, answer]);

      // Update streak
      const newStreak = currentStreak + 1;
      setCurrentStreak(newStreak);
      if (newStreak > bestStreak) {
        setBestStreak(newStreak);
      }

      // Update XP
      setTotalXp(prev => prev + xpEarned);

      // If this was a retry question, mark it as resolved
      if (isRetryQuestion) {
        setRetryQueue(prev =>
          prev.map(r =>
            r.genre === currentQuestion.genre && !r.resolved
              ? { ...r, resolved: true }
              : r
          )
        );
      }

      // Show feedback
      setFeedback({
        isCorrect: true,
        correctAnswer: currentQuestion.correctAnswer,
        explanation: currentQuestion.explanation,
        xpEarned,
      });
      setIsProcessing(true);

      // Move to next question after delay
      const newAnswersLength = answers.length + 1;
      setTimeout(() => {
        setFeedback(null);
        setIsProcessing(false);
        getNextQuestion(newAnswersLength);
      }, 2000);

    } else {
      // Wrong answer
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setCurrentStreak(0);

      // Add to retry queue if not already a retry (first wrong attempt)
      if (!isRetryQuestion && newAttempts === 1) {
        // Schedule retry at +3 questions
        setRetryQueue(prev => {
          // Don't add duplicates
          if (prev.some(r => r.genre === currentQuestion.genre && !r.resolved)) {
            return prev;
          }
          return [...prev, {
            genre: currentQuestion.genre,
            originalQuestionId: currentQuestion.id,
            scheduledAfterQuestion: answers.length + 3,
            retryAttempt: 1,
            resolved: false,
          }];
        });
      } else if (isRetryQuestion && newAttempts === 1) {
        // Failed a retry - reschedule at +3 again
        setRetryQueue(prev =>
          prev.map(r =>
            r.genre === currentQuestion.genre && !r.resolved
              ? { ...r, scheduledAfterQuestion: answers.length + 3 }
              : r
          )
        );
      }

      // Show feedback with correct answer and explanation
      setFeedback({
        isCorrect: false,
        correctAnswer: currentQuestion.correctAnswer,
        explanation: currentQuestion.explanation,
        xpEarned: 0,
      });
      setIsProcessing(true);

      // Let them try again or show correct answer
      if (newAttempts >= 2) {
        // After 2 wrong attempts, show answer and move on
        const answer: GymnasiumAnswer = {
          questionId: currentQuestion.id,
          question: currentQuestion,
          userAnswer,
          isCorrect: false,
          timeSpentMs: timeSpent,
          attempts: newAttempts,
        };
        setAnswers(prev => [...prev, answer]);

        setTimeout(() => {
          setFeedback(null);
          setIsProcessing(false);
          getNextQuestion(answers.length + 1);
        }, 4000); // Longer delay to read explanation
      } else {
        // First wrong attempt - let them try again
        setTimeout(() => {
          setFeedback(null);
          setIsProcessing(false);
          setUserAnswer('');
        }, 3000);
      }
    }
  };

  // Handle quit
  const handleQuit = () => {
    if (answers.length > 0) {
      const sessionData = {
        config,
        answers,
        totalXp,
        elapsedTimeMs: elapsedTime,
        correctCount: answers.filter(a => a.isCorrect).length,
        incorrectCount: answers.filter(a => !a.isCorrect).length,
        bestStreak,
      };
      sessionStorage.setItem('gymnasiumResult', JSON.stringify(sessionData));

      if (currentChild && totalXp > 0) {
        updateChildXp(currentChild.id, totalXp);
      }

      navigate('/summary');
    } else {
      navigate('/');
    }
  };

  // Format time display
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Calculate remaining time for timed mode
  const remainingTime = config.mode === 'time'
    ? Math.max(0, (config.timeLimitMinutes || 10) * 60 * 1000 - elapsedTime)
    : null;

  return (
    <div
      className="h-screen flex flex-col transition-colors duration-500 overflow-hidden"
      style={{
        background: `linear-gradient(to bottom, ${themeOption.colors.primary}dd, ${themeOption.colors.secondary}dd, #0f172a)`,
      }}
    >
      {/* Header */}
      <header className="p-3 flex justify-between items-center">
        <button
          onClick={handleQuit}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        {/* Stats */}
        <div className="flex items-center gap-3">
          {/* Timer or question count */}
          {config.mode === 'time' ? (
            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className={`font-mono font-bold ${remainingTime && remainingTime < 30000 ? 'text-red-400' : 'text-white'}`}>
                {formatTime(remainingTime || 0)}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
              <Target className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white">
                {answers.length}/{config.questionCount || 10}
              </span>
            </div>
          )}

          {/* Retry indicator */}
          {unresolvedRetryCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 bg-purple-500/20 rounded-xl px-3 py-2"
            >
              <RotateCcw className="w-4 h-4 text-purple-400" />
              <span className="text-purple-400 font-bold">{unresolvedRetryCount}</span>
            </motion.div>
          )}

          {/* XP */}
          <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-amber-400">{totalXp}</span>
          </div>

          {/* Streak */}
          {currentStreak >= 3 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 bg-orange-500/20 rounded-xl px-3 py-2"
            >
              <span className="text-orange-400 font-bold">
                {currentStreak}
              </span>
            </motion.div>
          )}
        </div>
      </header>

      {/* Main content - split layout */}
      <main className="flex-1 flex flex-col p-3 gap-3 overflow-hidden">
        {/* Question area */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 rounded-2xl p-4 border border-white/20"
        >
          {/* Retry badge */}
          {isRetryQuestion && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-2 inline-block bg-purple-500/30 rounded-full px-3 py-1"
            >
              <span className="text-purple-200 text-sm font-medium">Review Question</span>
            </motion.div>
          )}

          {/* Question text */}
          {isLoadingQuestion ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
              <span className="ml-3 text-white">Generating question...</span>
            </div>
          ) : currentQuestion ? (
            <p className="text-white text-xl font-medium leading-relaxed">
              {currentQuestion.questionText}
            </p>
          ) : loadError ? (
            <p className="text-red-300">{loadError}</p>
          ) : null}
        </motion.div>

        {/* Scratchpad and number pad - side by side on tablet */}
        <div className="flex-1 flex flex-col lg:flex-row gap-3 min-h-0">
          {/* Scratchpad */}
          <div className="flex-1 min-h-[200px] lg:min-h-0">
            <Scratchpad
              className="h-full"
              disabled={isProcessing}
            />
          </div>

          {/* Number pad */}
          <div className="flex items-center justify-center lg:w-auto">
            <GymnasiumNumberPad
              value={userAnswer}
              onChange={setUserAnswer}
              onSubmit={handleSubmit}
              disabled={isProcessing || isLoadingQuestion}
              keypadConfig={keypadConfig}
            />
          </div>
        </div>
      </main>

      {/* Feedback overlay */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className={`
                max-w-md w-full p-6 rounded-3xl shadow-2xl
                ${feedback.isCorrect
                  ? 'bg-gradient-to-b from-emerald-500 to-emerald-600'
                  : 'bg-gradient-to-b from-red-500 to-red-600'
                }
              `}
            >
              {/* Result icon and text */}
              <div className="text-center mb-4">
                <div className="text-6xl mb-2">
                  {feedback.isCorrect ? '🎉' : '😅'}
                </div>
                <h2 className="text-2xl font-bold text-white">
                  {feedback.isCorrect ? 'Correct!' : 'Not quite!'}
                </h2>
                {feedback.isCorrect && (
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Zap className="w-5 h-5 text-amber-300" />
                    <span className="text-amber-300 font-bold">+{feedback.xpEarned} XP</span>
                  </div>
                )}
              </div>

              {/* Show correct answer if wrong */}
              {!feedback.isCorrect && (
                <div className="bg-white/20 rounded-xl p-3 mb-3">
                  <p className="text-white/80 text-sm">The correct answer is:</p>
                  <p className="text-white text-2xl font-bold">{feedback.correctAnswer}</p>
                </div>
              )}

              {/* Explanation */}
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-white/80 text-sm mb-1">How to solve it:</p>
                <p className="text-white text-sm leading-relaxed">{feedback.explanation}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
