import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, RotateCcw, Trophy, Target, Clock, Zap, TrendingUp, Plane } from 'lucide-react';
import { Button } from '../components/common/Button';
import { LevelUpCelebration } from '../components/celebration/LevelUpCelebration';
import { ResourceDisplay } from '../components/combat/ResourceDisplay';
import { useAuth } from '../contexts/AuthContext';
import { getXPProgressToNextRank, getRankForXP } from '../lib/xpCalculator';
import { getResourceIcon } from '../lib/jetResources';
import { saveMissionToHistory } from './Home';
import type { Answer, SessionConfig, Rank, SessionResourceStats, JetResources } from '../types';

interface SessionResult {
  answers: Answer[];
  totalXp: number;
  xpEarnedBeforeLosses?: number;
  xpLostToDogfights?: number;
  bestStreak: number;
  elapsedTime: number;
  config: SessionConfig;
  startingRank?: Rank;
  resourceStats?: SessionResourceStats;
  finalResources?: JetResources;
}

export function SummaryPage() {
  const navigate = useNavigate();
  const { currentChild } = useAuth();
  const [result, setResult] = useState<SessionResult | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpInfo, setLevelUpInfo] = useState<{ oldRank: Rank; newRank: Rank } | null>(null);
  const savedToHistory = useRef(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('sessionResult');
    if (stored) {
      const parsedResult = JSON.parse(stored) as SessionResult;
      setResult(parsedResult);

      // Save mission to history (only once)
      if (!savedToHistory.current && parsedResult.answers.length > 0) {
        savedToHistory.current = true;
        const correctAnswers = parsedResult.answers.filter(a => a.isCorrect).length;
        const totalTime = parsedResult.answers.reduce((sum, a) => sum + a.responseTimeMs, 0);
        saveMissionToHistory({
          config: parsedResult.config,
          totalQuestions: parsedResult.answers.length,
          correctAnswers,
          wrongAnswers: parsedResult.answers.length - correctAnswers,
          avgTimePerQuestion: parsedResult.answers.length > 0 ? totalTime / parsedResult.answers.length : 0,
          totalXp: parsedResult.totalXp,
        });
      }

      // Check for level up
      if (parsedResult.startingRank && currentChild) {
        const newRank = getRankForXP(currentChild.totalXp);
        if (newRank.level > parsedResult.startingRank.level) {
          setLevelUpInfo({
            oldRank: parsedResult.startingRank,
            newRank: newRank,
          });
          // Show celebration after a short delay
          setTimeout(() => setShowLevelUp(true), 500);
        }
      }
    }
  }, [currentChild]);

  if (!result) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const { answers, totalXp, bestStreak, elapsedTime } = result;

  // Calculate stats
  const totalQuestions = answers.length;
  const correctAnswers = answers.filter(a => a.isCorrect).length;
  const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  const avgResponseTime = totalQuestions > 0
    ? Math.round(answers.reduce((sum, a) => sum + a.responseTimeMs, 0) / totalQuestions)
    : 0;
  const fastestAnswer = totalQuestions > 0
    ? Math.min(...answers.map(a => a.responseTimeMs))
    : 0;

  // Find most missed fact
  const wrongAnswers = answers.filter(a => !a.isCorrect);
  const mostMissed = wrongAnswers.length > 0
    ? wrongAnswers[0].question.displayString
    : null;

  // XP progress
  const xpProgress = currentChild
    ? getXPProgressToNextRank(currentChild.totalXp)
    : null;

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatMs = (ms: number) => {
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="text-6xl mb-4"
          >
            {accuracy >= 90 ? '🏆' : accuracy >= 70 ? '⭐' : accuracy >= 50 ? '✈️' : '💪'}
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {accuracy >= 90 ? 'MISSION COMPLETE!' :
             accuracy >= 70 ? 'Great Flying!' :
             accuracy >= 50 ? 'Good Effort!' : 'Keep Practicing!'}
          </h1>
        </motion.div>

        {/* Action buttons - at top for easy access */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex gap-3 mb-6"
        >
          <Button
            size="lg"
            className="flex-1"
            onClick={() => {
              // Restart with same config
              navigate('/practice');
            }}
          >
            <RotateCcw className="w-5 h-5 mr-2" /> Play Again
          </Button>

          <Button
            variant="secondary"
            size="lg"
            className="flex-1"
            onClick={() => navigate('/')}
          >
            <Home className="w-5 h-5 mr-2" /> Home
          </Button>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 gap-3 mb-6"
        >
          {/* Questions */}
          <StatCard
            icon={<Target className="w-5 h-5" />}
            label="Questions"
            value={`${correctAnswers}/${totalQuestions}`}
            color="emerald"
          />

          {/* Accuracy */}
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Accuracy"
            value={`${accuracy}%`}
            color="blue"
          />

          {/* Time */}
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="Time"
            value={formatTime(elapsedTime)}
            color="purple"
          />

          {/* Avg Speed */}
          <StatCard
            icon={<Zap className="w-5 h-5" />}
            label="Avg Speed"
            value={formatMs(avgResponseTime)}
            color="amber"
          />
        </motion.div>

        {/* XP earned */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl p-6 mb-6 border border-amber-500/30"
        >
          <div className="text-center">
            <div className="text-amber-400 text-sm font-medium mb-1">XP EARNED</div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.7 }}
              className="text-5xl font-bold text-amber-400"
            >
              +{totalXp}
            </motion.div>
            {result.xpLostToDogfights && result.xpLostToDogfights > 0 && (
              <div className="mt-2 text-red-400 text-sm">
                ({result.xpEarnedBeforeLosses} earned - {result.xpLostToDogfights} lost in combat)
              </div>
            )}
          </div>

          {/* Best streak */}
          {bestStreak >= 3 && (
            <div className="mt-4 text-center">
              <span className="text-orange-400">
                🔥 Best Streak: {bestStreak} in a row!
              </span>
            </div>
          )}

          {/* Fastest answer */}
          {fastestAnswer > 0 && fastestAnswer < 2000 && (
            <div className="mt-2 text-center">
              <span className="text-blue-400">
                ⚡ Fastest: {formatMs(fastestAnswer)}
              </span>
            </div>
          )}
        </motion.div>

        {/* Combat Report */}
        {result.resourceStats && (result.resourceStats.dogfightsWon > 0 || result.resourceStats.dogfightsLost > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="bg-gradient-to-r from-slate-700/50 to-slate-800/50 rounded-2xl p-4 mb-6 border border-slate-600/50"
          >
            <div className="flex items-center gap-2 mb-3">
              <Plane className="w-5 h-5 text-sky-400" />
              <span className="text-white font-bold">Combat Report</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-emerald-500/20 rounded-lg p-3 text-center border border-emerald-500/30">
                <div className="text-2xl font-bold text-emerald-400">
                  {result.resourceStats.dogfightsWon}
                </div>
                <div className="text-xs text-emerald-300">Victories</div>
              </div>
              <div className="bg-red-500/20 rounded-lg p-3 text-center border border-red-500/30">
                <div className="text-2xl font-bold text-red-400">
                  {result.resourceStats.dogfightsLost}
                </div>
                <div className="text-xs text-red-300">Defeats</div>
              </div>
            </div>

            {/* Resources used in combat */}
            <div className="text-slate-400 text-sm mb-2">Resources Used:</div>
            <div className="flex justify-around text-sm">
              <div className="text-center">
                <span>{getResourceIcon('missiles')}</span>
                <span className="text-red-400 ml-1">-{result.resourceStats.missilesUsed}</span>
              </div>
              <div className="text-center">
                <span>{getResourceIcon('bullets')}</span>
                <span className="text-amber-400 ml-1">-{result.resourceStats.bulletsUsed}</span>
              </div>
              <div className="text-center">
                <span>{getResourceIcon('flares')}</span>
                <span className="text-orange-400 ml-1">-{result.resourceStats.flaresUsed}</span>
              </div>
              <div className="text-center">
                <span>{getResourceIcon('chaff')}</span>
                <span className="text-cyan-400 ml-1">-{result.resourceStats.chaffUsed}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Resources Earned */}
        {result.resourceStats && (
          result.resourceStats.missilesEarned > 0 ||
          result.resourceStats.bulletsEarned > 0 ||
          result.resourceStats.flaresEarned > 0 ||
          result.resourceStats.chaffEarned > 0
        ) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl p-4 mb-6 border border-emerald-500/30"
          >
            <div className="text-emerald-400 text-sm font-medium mb-3 text-center">
              SUPPLIES EARNED
            </div>
            <div className="flex justify-around">
              {result.resourceStats.missilesEarned > 0 && (
                <div className="text-center">
                  <div className="text-2xl">{getResourceIcon('missiles')}</div>
                  <div className="text-emerald-400 font-bold">+{result.resourceStats.missilesEarned}</div>
                </div>
              )}
              {result.resourceStats.bulletsEarned > 0 && (
                <div className="text-center">
                  <div className="text-2xl">{getResourceIcon('bullets')}</div>
                  <div className="text-emerald-400 font-bold">+{result.resourceStats.bulletsEarned}</div>
                </div>
              )}
              {result.resourceStats.flaresEarned > 0 && (
                <div className="text-center">
                  <div className="text-2xl">{getResourceIcon('flares')}</div>
                  <div className="text-emerald-400 font-bold">+{result.resourceStats.flaresEarned}</div>
                </div>
              )}
              {result.resourceStats.chaffEarned > 0 && (
                <div className="text-center">
                  <div className="text-2xl">{getResourceIcon('chaff')}</div>
                  <div className="text-emerald-400 font-bold">+{result.resourceStats.chaffEarned}</div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Current Resources */}
        {result.finalResources && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="bg-slate-800/50 rounded-2xl p-4 mb-6 border border-slate-700"
          >
            <div className="text-slate-400 text-sm font-medium mb-3 text-center">
              YOUR SUPPLIES
            </div>
            <ResourceDisplay resources={result.finalResources} />
          </motion.div>
        )}

        {/* Rank progress */}
        {xpProgress && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-slate-800/50 rounded-2xl p-4 mb-6 border border-slate-700"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span className="text-white font-bold">
                  {xpProgress.currentRank.title}
                </span>
              </div>
              <span className="text-slate-400 text-sm">
                {currentChild?.totalXp} XP total
              </span>
            </div>

            {xpProgress.nextRank && (
              <>
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden mb-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${xpProgress.progress * 100}%` }}
                    transition={{ duration: 1, delay: 0.8, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                  />
                </div>
                <div className="text-center text-sm text-slate-400">
                  {xpProgress.xpNeeded} XP to {xpProgress.nextRank.name}
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Problem areas */}
        {mostMissed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75 }}
            className="bg-red-500/10 rounded-2xl p-4 mb-6 border border-red-500/30"
          >
            <div className="text-red-400 text-sm font-medium mb-1">Practice More:</div>
            <div className="text-white font-bold">{mostMissed}</div>
          </motion.div>
        )}
      </div>

      {/* Level up celebration */}
      {showLevelUp && levelUpInfo && (
        <LevelUpCelebration
          oldRank={levelUpInfo.oldRank}
          newRank={levelUpInfo.newRank}
          onDismiss={() => setShowLevelUp(false)}
          variant="full"
        />
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'emerald' | 'blue' | 'purple' | 'amber';
}) {
  const colors = {
    emerald: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30 text-emerald-400',
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400',
    purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-400',
    amber: 'from-amber-500/20 to-amber-600/20 border-amber-500/30 text-amber-400',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-4 border`}>
      <div className={`flex items-center gap-2 mb-1 ${colors[color].split(' ').pop()}`}>
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}
