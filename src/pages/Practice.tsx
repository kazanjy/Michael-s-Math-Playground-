import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Target, Zap, RotateCcw } from 'lucide-react';
import { NumberPad } from '../components/calculator/NumberPad';
import { QuestionCard } from '../components/question/QuestionCard';
import { Feedback } from '../components/question/Feedback';
import { LevelUpCelebration } from '../components/celebration/LevelUpCelebration';
import { useAuth } from '../contexts/AuthContext';
import { generateQuestion } from '../lib/questionGenerator';
import { calculateXP, getRankForXP, type XPResult } from '../lib/xpCalculator';
import { recordFactAttempt } from '../lib/factMastery';
import type { SessionConfig, Question, Answer, Rank } from '../types';
import { TIME_THRESHOLDS } from '../types';

type FeedbackState = {
  isCorrect: boolean;
  correctAnswer: number;
  xpResult: XPResult;
} | null;

// Review queue item - questions that need to be reviewed
interface ReviewItem {
  question: Question;
  showAfterQuestion: number; // Show this review after N questions have been answered
  resolved: boolean; // Has this been answered correctly?
}

export function PracticePage() {
  const navigate = useNavigate();
  const { currentChild, updateChildXp } = useAuth();

  // Load config from sessionStorage
  const [config] = useState<SessionConfig>(() => {
    const stored = sessionStorage.getItem('sessionConfig');
    if (stored) {
      return JSON.parse(stored);
    }
    // Default config
    return {
      operations: ['multiply'],
      primaryNumbers: [2, 3, 4, 5],
      multiplierRanges: [{ min: 1, max: 10 }],
      addend1Digits: 1,
      addend2Digits: 1,
      mode: 'questions',
      questionCount: 20,
    };
  });

  // Session state - use spaced repetition if we have a child profile
  const [currentQuestion, setCurrentQuestion] = useState<Question>(() =>
    generateQuestion(config, currentChild?.id)
  );
  const [userAnswer, setUserAnswer] = useState('');
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Review queue for facts that need reinforcement
  const [reviewQueue, setReviewQueue] = useState<ReviewItem[]>([]);
  const [isReviewQuestion, setIsReviewQuestion] = useState(false);

  // Level up tracking
  const [startingRank] = useState<Rank>(() =>
    currentChild ? getRankForXP(currentChild.totalXp) : getRankForXP(0)
  );
  const [levelUpInfo, setLevelUpInfo] = useState<{ oldRank: Rank; newRank: Rank } | null>(null);
  const lastCheckedXpRef = useRef(currentChild?.totalXp || 0);

  // Timer state
  const [elapsedTime, setElapsedTime] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const startTimeRef = useRef(Date.now());

  // Timer for timed mode
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTimeRef.current);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Count unresolved review items
  const unresolvedReviewCount = reviewQueue.filter(r => !r.resolved).length;

  // Check if session should end
  const isSessionComplete = useCallback(() => {
    // Don't end if there are unresolved review items
    if (unresolvedReviewCount > 0) return false;

    if (config.mode === 'questions') {
      return answers.length >= (config.questionCount || 20);
    } else {
      const timeLimitMs = (config.timeLimitMinutes || 5) * 60 * 1000;
      return elapsedTime >= timeLimitMs;
    }
  }, [config, answers.length, elapsedTime, unresolvedReviewCount]);

  // Check if we've reached the target question count (for display purposes)
  const hasReachedTarget = useCallback(() => {
    if (config.mode === 'questions') {
      return answers.length >= (config.questionCount || 20);
    }
    return false;
  }, [config, answers.length]);

  // End session
  useEffect(() => {
    if (isSessionComplete() && !isProcessing) {
      // Save session data
      const sessionData = {
        answers,
        totalXp,
        bestStreak,
        elapsedTime,
        config,
        startingRank,
      };
      sessionStorage.setItem('sessionResult', JSON.stringify(sessionData));

      // Update child XP
      if (currentChild && totalXp > 0) {
        updateChildXp(currentChild.id, totalXp);
      }

      navigate('/summary');
    }
  }, [isSessionComplete, isProcessing, answers, totalXp, bestStreak, elapsedTime, config, currentChild, updateChildXp, navigate, startingRank]);

  // Get next question - either from review queue or generate new
  const getNextQuestion = useCallback((): { question: Question; isReview: boolean } => {
    // Check if any review items are ready to show
    const readyReview = reviewQueue.find(
      r => !r.resolved && r.showAfterQuestion <= answers.length
    );

    if (readyReview) {
      return { question: readyReview.question, isReview: true };
    }

    // Generate a new question
    return { question: generateQuestion(config, currentChild?.id), isReview: false };
  }, [reviewQueue, answers.length, config, currentChild?.id]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isProcessing || feedback) return;

      if (e.key >= '0' && e.key <= '9') {
        setUserAnswer(prev => {
          if (prev === '0') return e.key;
          if (prev.length >= 6) return prev;
          return prev + e.key;
        });
      } else if (e.key === 'Backspace') {
        setUserAnswer(prev => prev.slice(0, -1));
      } else if (e.key === 'Enter' && userAnswer) {
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [userAnswer, isProcessing, feedback]);

  const handleSubmit = () => {
    if (!userAnswer || isProcessing) return;

    const responseTime = Date.now() - questionStartTime;
    const userAnswerNum = parseInt(userAnswer, 10);
    const isCorrect = userAnswerNum === currentQuestion.correctAnswer;

    // Record fact mastery for multiplication and division
    if (currentChild && (currentQuestion.operation === 'multiply' || currentQuestion.operation === 'divide')) {
      // For division, we track as "dividend ÷ divisor" but store relative to the underlying multiplication fact
      if (currentQuestion.operation === 'divide') {
        // Store as divisor × answer = dividend (the multiplication fact)
        recordFactAttempt(
          currentChild.id,
          'divide',
          currentQuestion.operand2, // divisor (the primary number)
          currentQuestion.correctAnswer, // the multiplier (answer)
          isCorrect,
          responseTime
        );
      } else {
        recordFactAttempt(
          currentChild.id,
          currentQuestion.operation,
          currentQuestion.operand1,
          currentQuestion.operand2,
          isCorrect,
          responseTime
        );
      }
    }

    if (isCorrect) {
      // Calculate XP
      const xpResult = calculateXP(
        currentQuestion,
        true,
        responseTime,
        currentStreak + 1
      );

      // Record answer
      const answer: Answer = {
        questionId: currentQuestion.id,
        question: currentQuestion,
        userAnswer: userAnswerNum,
        isCorrect: true,
        responseTimeMs: responseTime,
        attempts: attempts + 1,
      };
      setAnswers(prev => [...prev, answer]);

      // If this was a review question, mark it as resolved
      if (isReviewQuestion) {
        setReviewQueue(prev =>
          prev.map(r =>
            r.question.id === currentQuestion.id ? { ...r, resolved: true } : r
          )
        );
      }

      // Check if this correct answer was slow (needs review later)
      const needsReview = responseTime > TIME_THRESHOLDS.learning; // > 5 seconds
      if (needsReview && !isReviewQuestion) {
        // Add to review queue - show again after 2-3 more questions
        const showAfter = answers.length + 3;
        setReviewQueue(prev => {
          // Don't add duplicates
          if (prev.some(r => r.question.displayString === currentQuestion.displayString && !r.resolved)) {
            return prev;
          }
          return [...prev, {
            question: { ...currentQuestion, id: `review-${Date.now()}` },
            showAfterQuestion: showAfter,
            resolved: false,
          }];
        });
      }

      // Update streak
      const newStreak = currentStreak + 1;
      setCurrentStreak(newStreak);
      if (newStreak > bestStreak) {
        setBestStreak(newStreak);
      }

      // Update XP and check for level up
      const newSessionXp = totalXp + xpResult.totalXp;
      setTotalXp(newSessionXp);

      // Check for level up
      const currentTotalXp = (currentChild?.totalXp || 0) + newSessionXp;
      const oldRank = getRankForXP(lastCheckedXpRef.current + totalXp);
      const newRank = getRankForXP(currentTotalXp);

      if (newRank.level > oldRank.level) {
        setLevelUpInfo({ oldRank, newRank });
      }

      // Show feedback
      setFeedback({
        isCorrect: true,
        correctAnswer: currentQuestion.correctAnswer,
        xpResult,
      });
      setIsProcessing(true);

      // Move to next question after delay
      setTimeout(() => {
        setFeedback(null);
        setIsProcessing(false);
        const next = getNextQuestion();
        setCurrentQuestion(next.question);
        setIsReviewQuestion(next.isReview);
        setUserAnswer('');
        setAttempts(0);
        setQuestionStartTime(Date.now());
      }, 1500);
    } else {
      // Wrong answer
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setCurrentStreak(0);

      // Add to review queue if not already a review question (after first wrong attempt)
      if (!isReviewQuestion && newAttempts === 1) {
        const showAfter = answers.length + 2; // Show sooner for wrong answers
        setReviewQueue(prev => {
          // Don't add duplicates
          if (prev.some(r => r.question.displayString === currentQuestion.displayString && !r.resolved)) {
            return prev;
          }
          return [...prev, {
            question: { ...currentQuestion, id: `review-${Date.now()}` },
            showAfterQuestion: showAfter,
            resolved: false,
          }];
        });
      }

      // Show feedback briefly
      setFeedback({
        isCorrect: false,
        correctAnswer: currentQuestion.correctAnswer,
        xpResult: { baseXp: 0, speedBonus: 0, streakBonus: 0, difficultyBonus: 0, totalXp: 0 },
      });
      setIsProcessing(true);

      // Clear answer and let them try again
      setTimeout(() => {
        setFeedback(null);
        setIsProcessing(false);
        setUserAnswer('');
      }, 2000);
    }
  };

  const handleQuit = () => {
    if (answers.length > 0) {
      // Save partial session data
      const sessionData = {
        answers,
        totalXp,
        bestStreak,
        elapsedTime,
        config,
        startingRank,
      };
      sessionStorage.setItem('sessionResult', JSON.stringify(sessionData));

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
    ? Math.max(0, (config.timeLimitMinutes || 5) * 60 * 1000 - elapsedTime)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-600 via-sky-800 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="p-4 flex justify-between items-center">
        <button
          onClick={handleQuit}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        {/* Stats */}
        <div className="flex items-center gap-4">
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
                {answers.length}/{config.questionCount || 20}
              </span>
            </div>
          )}

          {/* Review indicator */}
          {unresolvedReviewCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 bg-purple-500/20 rounded-xl px-3 py-2"
            >
              <RotateCcw className="w-4 h-4 text-purple-400" />
              <span className="text-purple-400 font-bold">
                {unresolvedReviewCount}
              </span>
            </motion.div>
          )}

          {/* XP */}
          <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-amber-400">
              {totalXp}
            </span>
          </div>

          {/* Streak */}
          {currentStreak >= 3 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 bg-orange-500/20 rounded-xl px-3 py-2"
            >
              <span className="text-orange-400 font-bold">
                🔥 {currentStreak}
              </span>
            </motion.div>
          )}
        </div>
      </header>

      {/* Review mode banner */}
      {hasReachedTarget() && unresolvedReviewCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mb-2 bg-purple-500/30 rounded-xl px-4 py-2 text-center"
        >
          <span className="text-purple-200 font-medium">
            📝 Review time! {unresolvedReviewCount} question{unresolvedReviewCount > 1 ? 's' : ''} to go
          </span>
        </motion.div>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        {/* Review badge */}
        {isReviewQuestion && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-2 bg-purple-500/30 rounded-full px-4 py-1"
          >
            <span className="text-purple-200 text-sm font-medium">🔄 Review</span>
          </motion.div>
        )}

        {/* Question */}
        <div className="mb-8">
          <QuestionCard
            question={currentQuestion}
            showHint={attempts >= 3}
            attempts={attempts}
          />
        </div>

        {/* Calculator */}
        <NumberPad
          value={userAnswer}
          onChange={setUserAnswer}
          onSubmit={handleSubmit}
          disabled={isProcessing}
        />
      </main>

      {/* Feedback overlay */}
      <AnimatePresence>
        {feedback && (
          <Feedback
            isCorrect={feedback.isCorrect}
            correctAnswer={!feedback.isCorrect ? feedback.correctAnswer : undefined}
            xpResult={feedback.isCorrect ? feedback.xpResult : undefined}
            streak={currentStreak}
          />
        )}
      </AnimatePresence>

      {/* Level up celebration (mini version during practice) */}
      {levelUpInfo && (
        <LevelUpCelebration
          oldRank={levelUpInfo.oldRank}
          newRank={levelUpInfo.newRank}
          onDismiss={() => setLevelUpInfo(null)}
          variant="mini"
        />
      )}
    </div>
  );
}
