import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ChevronDown, ChevronUp, Check, X, Clock,
  Target, Zap, TrendingUp, TrendingDown, Minus, Image,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';
import {
  getSessions, getSessionQuestions, getGenreStats,
  type SessionRecord, type QuestionRecord, type GenreStats,
} from '../lib/historyService';
import { THEME_OPTIONS } from '../types/gymnasium';

type Tab = 'sessions' | 'analytics';

export function HistoryPage() {
  const navigate = useNavigate();
  const { currentChild } = useAuth();
  const [tab, setTab] = useState<Tab>('sessions');
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [genreStats, setGenreStats] = useState<GenreStats[]>([]);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [sessionQuestions, setSessionQuestions] = useState<QuestionRecord[]>([]);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scratchpadPreview, setScratchpadPreview] = useState<string | null>(null);

  const childId = currentChild?.id || 'demo-child-1';

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      getSessions(childId),
      getGenreStats(childId),
    ]).then(([s, g]) => {
      setSessions(s);
      setGenreStats(g);
      setIsLoading(false);
    });
  }, [childId]);

  const loadSessionQuestions = async (sessionId: string) => {
    if (expandedSession === sessionId) {
      setExpandedSession(null);
      return;
    }
    setExpandedSession(sessionId);
    const questions = await getSessionQuestions(sessionId);
    setSessionQuestions(questions);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;
    return `${minutes}:${remaining.toString().padStart(2, '0')}`;
  };

  const getThemeEmoji = (theme: string) => {
    return THEME_OPTIONS.find(t => t.value === theme)?.emoji || '📚';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    if (trend === 'declining') return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-white/40" />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-600 via-purple-700 to-slate-900 flex items-center justify-center">
        <p className="text-white text-lg">Loading history...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-600 via-purple-700 to-slate-900">
      {/* Header */}
      <header className="p-4 flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-2xl font-bold text-white">History & Analytics</h1>
      </header>

      {/* Tabs */}
      <div className="px-4 mb-4">
        <div className="flex bg-white/10 rounded-xl p-1">
          <button
            onClick={() => setTab('sessions')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              tab === 'sessions' ? 'bg-white text-slate-900' : 'text-white'
            }`}
          >
            Sessions
          </button>
          <button
            onClick={() => setTab('analytics')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              tab === 'analytics' ? 'bg-white text-slate-900' : 'text-white'
            }`}
          >
            Analytics
          </button>
        </div>
      </div>

      <main className="px-4 pb-8">
        {tab === 'sessions' && (
          <div className="space-y-3">
            {sessions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white/60 text-lg">No sessions yet.</p>
                <p className="text-white/40 mt-2">Complete a workout to see your history here!</p>
                <Button className="mt-4" onClick={() => navigate('/')}>
                  Start a Workout
                </Button>
              </div>
            ) : (
              sessions.map(session => {
                const accuracy = session.correct_count + session.incorrect_count > 0
                  ? Math.round((session.correct_count / (session.correct_count + session.incorrect_count)) * 100)
                  : 0;
                const isExpanded = expandedSession === session.id;

                return (
                  <div key={session.id} className="bg-white/10 rounded-2xl border border-white/20 overflow-hidden">
                    {/* Session header */}
                    <button
                      onClick={() => loadSessionQuestions(session.id)}
                      className="w-full p-4 flex items-center gap-3 text-left"
                    >
                      <span className="text-2xl">{getThemeEmoji(session.theme)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">
                            Grade {session.grade_level}
                          </span>
                          <span className="text-white/40 text-sm">
                            {formatDate(session.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm">
                          <span className="text-emerald-400">
                            {accuracy}% accuracy
                          </span>
                          <span className="text-white/60">
                            {session.correct_count}/{session.correct_count + session.incorrect_count} correct
                          </span>
                          <span className="text-amber-400">+{session.total_xp} XP</span>
                          <span className="text-white/40">{formatTime(session.elapsed_time_ms)}</span>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-white/40 shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-white/40 shrink-0" />
                      )}
                    </button>

                    {/* Expanded session questions */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-white/10"
                        >
                          <div className="p-3 space-y-2">
                            {sessionQuestions.map((q, idx) => {
                              const isQExpanded = expandedQuestion === q.id;

                              return (
                                <div
                                  key={q.id}
                                  className={`rounded-xl border overflow-hidden ${
                                    q.is_correct ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'
                                  }`}
                                >
                                  <button
                                    onClick={() => setExpandedQuestion(isQExpanded ? null : q.id)}
                                    className="w-full p-3 flex items-start gap-2 text-left"
                                  >
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                                      q.is_correct ? 'bg-emerald-500' : 'bg-red-500'
                                    }`}>
                                      {q.is_correct ? (
                                        <Check className="w-3.5 h-3.5 text-white" />
                                      ) : (
                                        <X className="w-3.5 h-3.5 text-white" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-white text-sm line-clamp-2">{q.question_text}</p>
                                      <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
                                        <span>#{idx + 1}</span>
                                        <span>{Math.round(q.time_spent_ms / 1000)}s</span>
                                        <span className="capitalize">{q.genre}</span>
                                        {q.scratchpad_url && (
                                          <span className="flex items-center gap-0.5 text-blue-400">
                                            <Image className="w-3 h-3" /> Work
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    {isQExpanded ? (
                                      <ChevronUp className="w-4 h-4 text-white/30 shrink-0" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4 text-white/30 shrink-0" />
                                    )}
                                  </button>

                                  {isQExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      className="border-t border-white/10 p-3 space-y-3"
                                    >
                                      {/* Answers */}
                                      <div className="flex gap-4">
                                        <div>
                                          <p className="text-xs text-white/50">Your Answer</p>
                                          <p className={`text-lg font-bold ${q.is_correct ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {q.user_answer}
                                          </p>
                                        </div>
                                        {!q.is_correct && (
                                          <div>
                                            <p className="text-xs text-white/50">Correct Answer</p>
                                            <p className="text-lg font-bold text-emerald-400">
                                              {q.correct_answer}
                                            </p>
                                          </div>
                                        )}
                                      </div>

                                      {/* Explanation */}
                                      <div className="bg-white/5 rounded-lg p-3">
                                        <p className="text-xs text-white/50 mb-1">
                                          {q.is_correct ? 'How you solved it:' : 'How to solve it:'}
                                        </p>
                                        <p className="text-white text-sm leading-relaxed">{q.explanation}</p>
                                      </div>

                                      {/* AI Work Analysis (wrong answers only) */}
                                      {!q.is_correct && q.work_analysis && (
                                        <div className="bg-amber-500/10 rounded-lg p-3 border border-amber-500/20 space-y-2">
                                          <p className="text-xs text-amber-400 font-medium">Scratchpad Analysis</p>
                                          <div>
                                            <p className="text-xs text-emerald-400">What you did well:</p>
                                            <p className="text-white text-sm">{q.work_analysis.whatYouDidWell}</p>
                                          </div>
                                          <div>
                                            <p className="text-xs text-red-400">Where it went wrong:</p>
                                            <p className="text-white text-sm">{q.work_analysis.whereYouWentWrong}</p>
                                          </div>
                                          <div>
                                            <p className="text-xs text-blue-400">How to fix it:</p>
                                            <p className="text-white text-sm">{q.work_analysis.howToFixIt}</p>
                                          </div>
                                        </div>
                                      )}

                                      {/* Time comparison */}
                                      <div className="flex items-center gap-2 text-sm">
                                        <Clock className="w-4 h-4 text-white/40" />
                                        <span className="text-white/60">
                                          {Math.round(q.time_spent_ms / 1000)}s
                                        </span>
                                        {genreStats.length > 0 && (() => {
                                          const stat = genreStats.find(g => g.genre === q.genre);
                                          if (!stat || stat.totalQuestions < 2) return null;
                                          const diff = q.time_spent_ms - stat.avgTimeMs;
                                          const absDiff = Math.abs(Math.round(diff / 1000));
                                          if (absDiff < 1) return (
                                            <span className="text-white/40">
                                              (right at your avg of {Math.round(stat.avgTimeMs / 1000)}s for {q.genre})
                                            </span>
                                          );
                                          return (
                                            <span className={diff < 0 ? 'text-emerald-400' : 'text-amber-400'}>
                                              ({absDiff}s {diff < 0 ? 'faster' : 'slower'} than your avg of {Math.round(stat.avgTimeMs / 1000)}s for {q.genre})
                                            </span>
                                          );
                                        })()}
                                      </div>

                                      {/* Metadata */}
                                      <div className="flex gap-4 text-xs text-white/30">
                                        <span>Attempts: {q.attempts}</span>
                                      </div>

                                      {/* Scratchpad work */}
                                      {q.scratchpad_url && (
                                        <div>
                                          <button
                                            onClick={() => setScratchpadPreview(q.scratchpad_url!)}
                                            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                          >
                                            <Image className="w-4 h-4" />
                                            View scratchpad work
                                          </button>
                                        </div>
                                      )}
                                    </motion.div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === 'analytics' && (
          <div className="space-y-4">
            {genreStats.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white/60 text-lg">No data yet.</p>
                <p className="text-white/40 mt-2">Complete a few workouts to see your analytics!</p>
              </div>
            ) : (
              <>
                {/* Summary stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/10 rounded-2xl p-4 border border-white/20 text-center">
                    <Target className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-white">
                      {Math.round(genreStats.reduce((sum, g) => sum + g.accuracy * g.totalQuestions, 0) / genreStats.reduce((sum, g) => sum + g.totalQuestions, 0))}%
                    </p>
                    <p className="text-xs text-white/50">Overall Accuracy</p>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-4 border border-white/20 text-center">
                    <Zap className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-white">
                      {genreStats.reduce((sum, g) => sum + g.totalQuestions, 0)}
                    </p>
                    <p className="text-xs text-white/50">Questions Answered</p>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-4 border border-white/20 text-center">
                    <Clock className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-white">
                      {Math.round(genreStats.reduce((sum, g) => sum + g.avgTimeMs * g.totalQuestions, 0) / genreStats.reduce((sum, g) => sum + g.totalQuestions, 0) / 1000)}s
                    </p>
                    <p className="text-xs text-white/50">Avg Time</p>
                  </div>
                </div>

                {/* Per-genre breakdown */}
                <h2 className="text-lg font-bold text-white mt-2">By Concept</h2>
                <div className="space-y-3">
                  {genreStats.map(stat => (
                    <div
                      key={stat.genre}
                      className="bg-white/10 rounded-2xl p-4 border border-white/20"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-white font-medium capitalize">{stat.genre}</h3>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(stat.trend)}
                          <span className="text-xs text-white/40 capitalize">{stat.trend}</span>
                        </div>
                      </div>

                      {/* Accuracy bar */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              stat.accuracy >= 80 ? 'bg-emerald-500' :
                              stat.accuracy >= 50 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${stat.accuracy}%` }}
                          />
                        </div>
                        <span className="text-white font-bold text-sm w-12 text-right">
                          {stat.accuracy}%
                        </span>
                      </div>

                      <div className="flex gap-4 text-xs text-white/50">
                        <span>{stat.correctCount}/{stat.totalQuestions} correct</span>
                        <span>Avg: {Math.round(stat.avgTimeMs / 1000)}s</span>
                        <span>Recent avg: {Math.round(stat.recentAvgTimeMs / 1000)}s</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* Scratchpad preview modal */}
      <AnimatePresence>
        {scratchpadPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setScratchpadPreview(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl p-2 max-w-lg w-full max-h-[80vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-2 mb-1">
                <h3 className="font-medium text-slate-800">Scratchpad Work</h3>
                <button
                  onClick={() => setScratchpadPreview(null)}
                  className="p-1 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <img
                src={scratchpadPreview}
                alt="Scratchpad work"
                className="w-full rounded-xl border border-slate-200"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
