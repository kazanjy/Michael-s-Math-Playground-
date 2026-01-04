import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Target, Zap, RotateCcw } from 'lucide-react';
import { NumberPad } from '../components/calculator/NumberPad';
import { QuestionCard } from '../components/question/QuestionCard';
import { Feedback } from '../components/question/Feedback';
import { LevelUpCelebration } from '../components/celebration/LevelUpCelebration';
import { DogfightOverlay } from '../components/combat/DogfightOverlay';
import { ResourceDisplay } from '../components/combat/ResourceDisplay';
import { useAuth } from '../contexts/AuthContext';
import { generateQuestion } from '../lib/questionGenerator';
import { calculateXP, getRankForXP, type XPResult } from '../lib/xpCalculator';
import { recordFactAttempt } from '../lib/factMastery';
import {
  getJetResources,
  saveJetResources,
  calculateResourcesEarned,
  processDogfight,
  addResources,
  createEmptyResourceStats,
} from '../lib/jetResources';
import type { SessionConfig, Question, Answer, Rank, JetResources, DogfightResult, SessionResourceStats } from '../types';
import { getSlowThreshold, createDefaultSessionConfig } from '../types';

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

  // Load config from sessionStorage, merging with defaults for backwards compatibility
  const [config] = useState<SessionConfig>(() => {
    const defaults = createDefaultSessionConfig();
    const stored = sessionStorage.getItem('sessionConfig');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return { ...defaults, ...parsed };
      } catch {
        return defaults;
      }
    }
    return defaults;
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
  // Ref to always have the latest review queue (avoids stale closure in setTimeout)
  const reviewQueueRef = useRef<ReviewItem[]>([]);

  // Level up tracking
  const [startingRank] = useState<Rank>(() =>
    currentChild ? getRankForXP(currentChild.totalXp) : getRankForXP(0)
  );
  const [levelUpInfo, setLevelUpInfo] = useState<{ oldRank: Rank; newRank: Rank } | null>(null);
  const lastCheckedXpRef = useRef(currentChild?.totalXp || 0);

  // Jet resources and combat
  const [jetResources, setJetResources] = useState<JetResources>(() =>
    currentChild ? getJetResources(currentChild.id) : { missiles: 2, bullets: 20, flares: 3, chaff: 3 }
  );
  const [dogfightResult, setDogfightResult] = useState<DogfightResult | null>(null);
  const [resourceStats, setResourceStats] = useState<SessionResourceStats>(createEmptyResourceStats);
  const sessionXpAccumulator = useRef(0); // Track XP for resource earning
  const dogfightCompleteAction = useRef<(() => void) | null>(null); // Action to run when user dismisses dogfight

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

  // Keep ref in sync with state
  useEffect(() => {
    reviewQueueRef.current = reviewQueue;
  }, [reviewQueue]);

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
      // Save jet resources
      if (currentChild) {
        saveJetResources(currentChild.id, jetResources);
      }

      // Calculate final XP (subtract dogfight losses)
      const finalXp = Math.max(0, totalXp - resourceStats.xpLostToDogfights);

      // Save session data
      const sessionData = {
        answers,
        totalXp: finalXp,
        xpEarnedBeforeLosses: totalXp,
        xpLostToDogfights: resourceStats.xpLostToDogfights,
        bestStreak,
        elapsedTime,
        config,
        startingRank,
        resourceStats,
        finalResources: jetResources,
      };
      sessionStorage.setItem('sessionResult', JSON.stringify(sessionData));

      // Update child XP (with dogfight losses subtracted)
      if (currentChild && finalXp > 0) {
        updateChildXp(currentChild.id, finalXp);
      }

      navigate('/summary');
    }
  }, [isSessionComplete, isProcessing, answers, totalXp, bestStreak, elapsedTime, config, currentChild, updateChildXp, navigate, startingRank, jetResources, resourceStats]);

  // Get next question - either from review queue or generate new
  // Uses ref to get latest review queue (avoids stale closure in setTimeout)
  const getNextQuestion = useCallback((currentAnswersLength: number): { question: Question; isReview: boolean } => {
    // Check if any review items are ready to show (use ref for latest state)
    const readyReview = reviewQueueRef.current.find(
      r => !r.resolved && r.showAfterQuestion <= currentAnswersLength
    );

    if (readyReview) {
      return { question: readyReview.question, isReview: true };
    }

    // Generate a new question
    return { question: generateQuestion(config, currentChild?.id), isReview: false };
  }, [config, currentChild?.id]);

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
      // Only add if: slow, not already a review, AND no wrong attempts (wrong attempts already added it)
      const slowThreshold = getSlowThreshold(currentQuestion.source);
      const needsReview = responseTime > slowThreshold; // > 5s for speed, > 10s for mental
      if (needsReview && !isReviewQuestion && attempts === 0) {
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

      // Earn resources based on XP
      const previousAccumulatedXp = sessionXpAccumulator.current;
      sessionXpAccumulator.current += xpResult.totalXp;
      const resourcesEarned = calculateResourcesEarned(previousAccumulatedXp, xpResult.totalXp);

      if (resourcesEarned.missiles > 0 || resourcesEarned.bullets > 0 ||
          resourcesEarned.flares > 0 || resourcesEarned.chaff > 0) {
        setJetResources(prev => addResources(prev, resourcesEarned));
        setResourceStats(prev => ({
          ...prev,
          missilesEarned: prev.missilesEarned + resourcesEarned.missiles,
          bulletsEarned: prev.bulletsEarned + resourcesEarned.bullets,
          flaresEarned: prev.flaresEarned + resourcesEarned.flares,
          chaffEarned: prev.chaffEarned + resourcesEarned.chaff,
        }));
      }

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
      // Calculate new answers length now (before setTimeout) to avoid stale closure
      const newAnswersLength = answers.length + 1;

      // Trigger dogfight if answer was slow (> threshold based on question type)
      const wasSlowAnswer = responseTime > slowThreshold;
      if (wasSlowAnswer) {
        // Store the action to run when user dismisses dogfight
        dogfightCompleteAction.current = () => {
          setIsProcessing(false);
          const next = getNextQuestion(newAnswersLength);
          setCurrentQuestion(next.question);
          setIsReviewQuestion(next.isReview);
          setUserAnswer('');
          setAttempts(0);
          setQuestionStartTime(Date.now());
        };

        // Delay feedback dismissal to show dogfight
        setTimeout(() => {
          setFeedback(null);
          // Trigger dogfight for slow answer (pass responseTime for display)
          setJetResources(currentResources => {
            const { updatedResources, result } = processDogfight(currentResources, 'slow_answer', responseTime);
            setDogfightResult(result);

            // Update resource stats
            setResourceStats(prev => ({
              ...prev,
              missilesUsed: prev.missilesUsed + result.missilesUsed,
              bulletsUsed: prev.bulletsUsed + result.bulletsUsed,
              flaresUsed: prev.flaresUsed + result.flaresUsed,
              chaffUsed: prev.chaffUsed + result.chaffUsed,
              xpLostToDogfights: prev.xpLostToDogfights + result.xpLost,
              dogfightsWon: prev.dogfightsWon + (result.victory ? 1 : 0),
              dogfightsLost: prev.dogfightsLost + (result.victory ? 0 : 1),
            }));

            return updatedResources;
          });
        }, 1500);
      } else {
        // Normal flow without dogfight (fast answer)
        setTimeout(() => {
          setFeedback(null);
          setIsProcessing(false);
          const next = getNextQuestion(newAnswersLength);
          setCurrentQuestion(next.question);
          setIsReviewQuestion(next.isReview);
          setUserAnswer('');
          setAttempts(0);
          setQuestionStartTime(Date.now());
        }, 1500);
      }
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

      // Trigger dogfight on first wrong attempt
      if (newAttempts === 1) {
        // Store the action to run when user dismisses dogfight
        dogfightCompleteAction.current = () => {
          setIsProcessing(false);
          setUserAnswer('');
        };

        // Show feedback, then dogfight
        setTimeout(() => {
          setFeedback(null);
          // Trigger dogfight for wrong answer
          setJetResources(currentResources => {
            const { updatedResources, result } = processDogfight(currentResources, 'wrong_answer');
            setDogfightResult(result);

            // Update resource stats
            setResourceStats(prev => ({
              ...prev,
              missilesUsed: prev.missilesUsed + result.missilesUsed,
              bulletsUsed: prev.bulletsUsed + result.bulletsUsed,
              flaresUsed: prev.flaresUsed + result.flaresUsed,
              chaffUsed: prev.chaffUsed + result.chaffUsed,
              xpLostToDogfights: prev.xpLostToDogfights + result.xpLost,
              dogfightsWon: prev.dogfightsWon + (result.victory ? 1 : 0),
              dogfightsLost: prev.dogfightsLost + (result.victory ? 0 : 1),
            }));

            return updatedResources;
          });
        }, 2000);
      } else {
        // Subsequent wrong attempts - just clear and let them try again
        setTimeout(() => {
          setFeedback(null);
          setIsProcessing(false);
          setUserAnswer('');
        }, 2000);
      }
    }
  };

  const handleQuit = () => {
    if (answers.length > 0) {
      // Save jet resources
      if (currentChild) {
        saveJetResources(currentChild.id, jetResources);
      }

      // Calculate final XP (subtract dogfight losses)
      const finalXp = Math.max(0, totalXp - resourceStats.xpLostToDogfights);

      // Save partial session data
      const sessionData = {
        answers,
        totalXp: finalXp,
        xpEarnedBeforeLosses: totalXp,
        xpLostToDogfights: resourceStats.xpLostToDogfights,
        bestStreak,
        elapsedTime,
        config,
        startingRank,
        resourceStats,
        finalResources: jetResources,
      };
      sessionStorage.setItem('sessionResult', JSON.stringify(sessionData));

      if (currentChild && finalXp > 0) {
        updateChildXp(currentChild.id, finalXp);
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

          {/* Jet Resources */}
          <ResourceDisplay resources={jetResources} compact />

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

      {/* Dogfight overlay */}
      <AnimatePresence>
        {dogfightResult && (
          <DogfightOverlay
            result={dogfightResult}
            onComplete={() => {
              setDogfightResult(null);
              // Execute the stored action (move to next question or retry)
              if (dogfightCompleteAction.current) {
                dogfightCompleteAction.current();
                dogfightCompleteAction.current = null;
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
