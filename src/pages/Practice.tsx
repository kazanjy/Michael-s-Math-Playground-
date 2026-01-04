import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Target, Zap } from 'lucide-react';
import { NumberPad } from '../components/calculator/NumberPad';
import { QuestionCard } from '../components/question/QuestionCard';
import { Feedback } from '../components/question/Feedback';
import { LevelUpCelebration } from '../components/celebration/LevelUpCelebration';
import { useAuth } from '../contexts/AuthContext';
import { generateQuestion } from '../lib/questionGenerator';
import { calculateXP, getRankForXP, type XPResult } from '../lib/xpCalculator';
import type { SessionConfig, Question, Answer, Rank } from '../types';

type FeedbackState = {
  isCorrect: boolean;
  correctAnswer: number;
  xpResult: XPResult;
} | null;

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

  // Session state
  const [currentQuestion, setCurrentQuestion] = useState<Question>(() => generateQuestion(config));
  const [userAnswer, setUserAnswer] = useState('');
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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

  // Check if session should end
  const isSessionComplete = useCallback(() => {
    if (config.mode === 'questions') {
      return answers.length >= (config.questionCount || 20);
    } else {
      const timeLimitMs = (config.timeLimitMinutes || 5) * 60 * 1000;
      return elapsedTime >= timeLimitMs;
    }
  }, [config, answers.length, elapsedTime]);

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
  }, [isSessionComplete, isProcessing, answers, totalXp, bestStreak, elapsedTime, config, currentChild, updateChildXp, navigate]);

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
        setCurrentQuestion(generateQuestion(config));
        setUserAnswer('');
        setAttempts(0);
        setQuestionStartTime(Date.now());
      }, 1500);
    } else {
      // Wrong answer
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setCurrentStreak(0);

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

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
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
