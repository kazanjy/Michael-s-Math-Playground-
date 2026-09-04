import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, RotateCcw, Trophy, Zap, Target, Clock, Check, X, ChevronDown, ChevronUp, History } from 'lucide-react';
import { Button } from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';
import { saveSession, type WorkAnalysis } from '../lib/historyService';
import {
  type GymnasiumSessionConfig,
  type GymnasiumAnswer,
  THEME_OPTIONS,
  GRADE_OPTIONS,
} from '../types/gymnasium';

interface SessionResult {
  config: GymnasiumSessionConfig;
  answers: GymnasiumAnswer[];
  totalXp: number;
  elapsedTimeMs: number;
  correctCount: number;
  incorrectCount: number;
  bestStreak: number;
  scratchpadImages?: Record<string, string>;
  workAnalyses?: Record<string, WorkAnalysis>;
}

export function GymnasiumSummaryPage() {
  const navigate = useNavigate();
  const { currentChild } = useAuth();
  const [result, setResult] = useState<SessionResult | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const savedRef = useRef(false);

  // Load result from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem('gymnasiumResult');
    if (stored) {
      try {
        setResult(JSON.parse(stored));
      } catch {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  }, [navigate]);

  // Save session to history (once)
  useEffect(() => {
    if (!result || savedRef.current) return;
    savedRef.current = true;

    const childId = currentChild?.id || 'demo-child-1';
    const imageMap = new Map<string, string>(
      Object.entries(result.scratchpadImages || {})
    );
    const analysisMap = new Map<string, WorkAnalysis>(
      Object.entries(result.workAnalyses || {}) as [string, WorkAnalysis][]
    );

    saveSession(
      childId,
      result.config,
      result.answers,
      result.totalXp,
      result.elapsedTimeMs,
      result.bestStreak,
      imageMap,
      analysisMap,
    ).catch(err => console.error('Failed to save session history:', err));
  }, [result, currentChild]);

  if (!result) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  const themeOption = THEME_OPTIONS.find(t => t.value === result.config.theme) || THEME_OPTIONS[5];
  const gradeLabel = GRADE_OPTIONS.find(g => g.value === result.config.gradeLevel)?.label || result.config.gradeLevel;
  const accuracy = result.answers.length > 0
    ? Math.round((result.correctCount / result.answers.length) * 100)
    : 0;

  const toggleQuestion = (id: string) => {
    setExpandedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="min-h-screen transition-colors duration-500"
      style={{
        background: `linear-gradient(to bottom, ${themeOption.colors.primary}dd, ${themeOption.colors.secondary}dd, #0f172a)`,
      }}
    >
      {/* Header */}
      <header className="p-4 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
          className="text-6xl mb-4"
        >
          {accuracy >= 80 ? '🏆' : accuracy >= 50 ? '⭐' : '💪'}
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-white mb-2"
        >
          Workout Complete!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-white/80"
        >
          {themeOption.emoji} {themeOption.label} | {gradeLabel}
        </motion.p>
      </header>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="px-4 mb-6"
      >
        <div className="grid grid-cols-2 gap-3">
          {/* XP Card */}
          <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-2 text-amber-400 mb-1">
              <Zap className="w-5 h-5" />
              <span className="font-medium">XP Earned</span>
            </div>
            <p className="text-3xl font-bold text-white">+{result.totalXp}</p>
          </div>

          {/* Accuracy Card */}
          <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-2 text-emerald-400 mb-1">
              <Target className="w-5 h-5" />
              <span className="font-medium">Accuracy</span>
            </div>
            <p className="text-3xl font-bold text-white">{accuracy}%</p>
          </div>

          {/* Questions Card */}
          <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-2 text-blue-400 mb-1">
              <Check className="w-5 h-5" />
              <span className="font-medium">Correct</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {result.correctCount}/{result.answers.length}
            </p>
          </div>

          {/* Time Card */}
          <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-2 text-purple-400 mb-1">
              <Clock className="w-5 h-5" />
              <span className="font-medium">Time</span>
            </div>
            <p className="text-3xl font-bold text-white">{formatTime(result.elapsedTimeMs)}</p>
          </div>
        </div>

        {/* Streak */}
        {result.bestStreak >= 3 && (
          <div className="mt-3 bg-orange-500/20 rounded-2xl p-4 border border-orange-500/30 text-center">
            <div className="flex items-center justify-center gap-2 text-orange-400">
              <Trophy className="w-5 h-5" />
              <span className="font-medium">Best Streak: {result.bestStreak}</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Question Review */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="px-4 pb-4"
      >
        <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
          <span>Question Review</span>
          <span className="text-sm font-normal text-white/60">
            (tap to expand)
          </span>
        </h2>

        <div className="space-y-3 max-h-[50vh] overflow-y-auto pb-24">
          {result.answers.map((answer, index) => {
            const isExpanded = expandedQuestions.has(answer.questionId);

            return (
              <motion.div
                key={answer.questionId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                className={`
                  bg-white/10 rounded-2xl border overflow-hidden
                  ${answer.isCorrect ? 'border-emerald-500/30' : 'border-red-500/30'}
                `}
              >
                {/* Header - always visible */}
                <button
                  onClick={() => toggleQuestion(answer.questionId)}
                  className="w-full p-4 flex items-start gap-3 text-left"
                >
                  {/* Status icon */}
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                    ${answer.isCorrect ? 'bg-emerald-500' : 'bg-red-500'}
                  `}>
                    {answer.isCorrect ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <X className="w-5 h-5 text-white" />
                    )}
                  </div>

                  {/* Question preview */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/60 mb-1">Question {index + 1}</p>
                    <p className="text-white font-medium line-clamp-2">
                      {answer.question.questionText}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-sm">
                      <span className="text-white/60">
                        Your answer: <span className={answer.isCorrect ? 'text-emerald-400' : 'text-red-400'}>{answer.userAnswer}</span>
                      </span>
                      {!answer.isCorrect && (
                        <span className="text-white/60">
                          Correct: <span className="text-emerald-400">{answer.question.correctAnswer}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expand icon */}
                  <div className="flex-shrink-0 text-white/40">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/10"
                  >
                    <div className="p-4 space-y-3">
                      {/* Full question */}
                      <div>
                        <p className="text-sm text-white/60 mb-1">Question</p>
                        <p className="text-white">{answer.question.questionText}</p>
                      </div>

                      {/* Answers */}
                      <div className="flex gap-4">
                        <div>
                          <p className="text-sm text-white/60 mb-1">Your Answer</p>
                          <p className={`text-lg font-bold ${answer.isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                            {answer.userAnswer}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-white/60 mb-1">Correct Answer</p>
                          <p className="text-lg font-bold text-emerald-400">
                            {answer.question.correctAnswer}
                          </p>
                        </div>
                      </div>

                      {/* Explanation */}
                      <div className="bg-white/5 rounded-xl p-3">
                        <p className="text-sm text-white/60 mb-1">Explanation</p>
                        <p className="text-white text-sm leading-relaxed">
                          {answer.question.explanation}
                        </p>
                      </div>

                      {/* Metadata */}
                      <div className="flex gap-4 text-sm text-white/40">
                        <span>Time: {Math.round(answer.timeSpentMs / 1000)}s</span>
                        <span>Attempts: {answer.attempts}</span>
                        <span>Concept: {answer.question.genre}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Action buttons - fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900 to-transparent">
        <div className="flex gap-3 max-w-md mx-auto">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate('/')}
          >
            <Home className="w-5 h-5" />
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate('/history')}
          >
            <History className="w-5 h-5" />
          </Button>
          <Button
            size="lg"
            className="flex-1"
            onClick={() => {
              navigate('/practice');
            }}
            style={{
              background: `linear-gradient(to right, ${themeOption.colors.primary}, ${themeOption.colors.secondary})`,
            }}
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Again
          </Button>
        </div>
      </div>
    </div>
  );
}
