import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Settings, LogOut, Trophy, Zap, Target, Clock, Hash } from 'lucide-react';
import { Button } from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';
import { SESSION_PRESETS } from '../types';
import type { SessionConfig, Operation } from '../types';
import { getXPProgressToNextRank } from '../lib/xpCalculator';

export function HomePage() {
  const navigate = useNavigate();
  const { currentChild, signOut } = useAuth();
  const [showConfig, setShowConfig] = useState(false);

  // Session configuration state
  const [config, setConfig] = useState<SessionConfig>({
    operations: ['multiply'],
    primaryNumbers: [2, 3, 4, 5],
    multiplierRanges: [{ min: 1, max: 10 }],
    addend1Digits: 1,
    addend2Digits: 1,
    mode: 'questions',
    questionCount: 20,
  });

  const xpProgress = currentChild
    ? getXPProgressToNextRank(currentChild.totalXp)
    : null;

  const startSession = () => {
    // Store config in sessionStorage and navigate
    sessionStorage.setItem('sessionConfig', JSON.stringify(config));
    navigate('/practice');
  };

  const applyPreset = (preset: typeof SESSION_PRESETS[0]) => {
    setConfig(c => ({ ...c, ...preset.config }));
  };

  const toggleOperation = (op: Operation) => {
    setConfig(c => {
      const ops = c.operations.includes(op)
        ? c.operations.filter(o => o !== op)
        : [...c.operations, op];
      return { ...c, operations: ops.length > 0 ? ops : c.operations };
    });
  };

  const togglePrimaryNumber = (num: number) => {
    setConfig(c => {
      const nums = c.primaryNumbers.includes(num)
        ? c.primaryNumbers.filter(n => n !== num)
        : [...c.primaryNumbers, num];
      return { ...c, primaryNumbers: nums.length > 0 ? nums : c.primaryNumbers };
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="text-3xl">✈️</div>
          <div>
            <h1 className="text-white font-bold text-xl">
              {currentChild?.name || 'Pilot'}
            </h1>
            {xpProgress && (
              <div className="text-slate-400 text-sm">
                {xpProgress.currentRank.title}
              </div>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={signOut}>
          <LogOut className="w-4 h-4 mr-2" /> Sign Out
        </Button>
      </header>

      {/* Stats Bar */}
      {currentChild && xpProgress && (
        <div className="px-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span className="text-amber-400 font-bold">
                  Level {xpProgress.currentRank.level}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-400" />
                <span className="text-blue-400 font-bold">
                  {currentChild.totalXp} XP
                </span>
              </div>
            </div>

            {/* XP Progress bar */}
            {xpProgress.nextRank && (
              <div>
                <div className="flex justify-between text-sm text-slate-400 mb-1">
                  <span>{xpProgress.currentRank.name}</span>
                  <span>{xpProgress.nextRank.name}</span>
                </div>
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${xpProgress.progress * 100}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                  />
                </div>
                <div className="text-center text-sm text-slate-400 mt-1">
                  {xpProgress.xpNeeded} XP to {xpProgress.nextRank.name}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Main content */}
      <main className="px-4 pb-8">
        {!showConfig ? (
          // Quick start view
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h2 className="text-2xl font-bold text-white text-center mb-6">
              Ready to fly?
            </h2>

            {/* Presets */}
            <div className="grid gap-3">
              {SESSION_PRESETS.map((preset, i) => (
                <motion.button
                  key={preset.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => {
                    applyPreset(preset);
                    startSession();
                  }}
                  className="w-full p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-left transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-bold text-lg">
                        {preset.name}
                      </div>
                      <div className="text-blue-200 text-sm">
                        {preset.description}
                      </div>
                    </div>
                    <Play className="w-8 h-8 text-white" />
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Custom button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              onClick={() => setShowConfig(true)}
              className="w-full p-4 rounded-2xl bg-slate-700 hover:bg-slate-600 text-left transition-colors border border-slate-600"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-bold text-lg">
                    Custom Mission
                  </div>
                  <div className="text-slate-400 text-sm">
                    Choose your own settings
                  </div>
                </div>
                <Settings className="w-8 h-8 text-slate-400" />
              </div>
            </motion.button>
          </motion.div>
        ) : (
          // Configuration view
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">
                Custom Mission
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowConfig(false)}>
                Back
              </Button>
            </div>

            {/* Operations */}
            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
              <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                <Target className="w-5 h-5" /> Operations
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {(['multiply', 'divide', 'add', 'subtract'] as Operation[]).map(op => (
                  <button
                    key={op}
                    onClick={() => toggleOperation(op)}
                    className={`p-3 rounded-xl font-medium transition-colors ${
                      config.operations.includes(op)
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {op === 'multiply' && '× Multiply'}
                    {op === 'divide' && '÷ Divide'}
                    {op === 'add' && '+ Add'}
                    {op === 'subtract' && '− Subtract'}
                  </button>
                ))}
              </div>
            </div>

            {/* Primary numbers (for multiply/divide) */}
            {(config.operations.includes('multiply') || config.operations.includes('divide')) && (
              <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
                <h3 className="text-white font-bold mb-3">Tables to Practice</h3>
                <div className="grid grid-cols-6 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                    <button
                      key={num}
                      onClick={() => togglePrimaryNumber(num)}
                      className={`p-2 rounded-lg font-bold transition-colors ${
                        config.primaryNumbers.includes(num)
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Multiplier range */}
            {(config.operations.includes('multiply') || config.operations.includes('divide')) && (
              <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
                <h3 className="text-white font-bold mb-3">Multiply By</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: '1-5', min: 1, max: 5 },
                    { label: '6-10', min: 6, max: 10 },
                    { label: '11-15', min: 11, max: 15 },
                    { label: '16-20', min: 16, max: 20 },
                  ].map(range => {
                    const isSelected = config.multiplierRanges.some(
                      r => r.min === range.min && r.max === range.max
                    );
                    return (
                      <button
                        key={range.label}
                        onClick={() => {
                          setConfig(c => {
                            const existing = c.multiplierRanges.find(
                              r => r.min === range.min && r.max === range.max
                            );
                            if (existing) {
                              const filtered = c.multiplierRanges.filter(
                                r => r.min !== range.min || r.max !== range.max
                              );
                              return {
                                ...c,
                                multiplierRanges: filtered.length > 0 ? filtered : c.multiplierRanges,
                              };
                            }
                            return {
                              ...c,
                              multiplierRanges: [...c.multiplierRanges, { min: range.min, max: range.max }],
                            };
                          });
                        }}
                        className={`p-3 rounded-xl font-medium transition-colors ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {range.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Session mode */}
            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
              <h3 className="text-white font-bold mb-3">Session Type</h3>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  onClick={() => setConfig(c => ({ ...c, mode: 'questions' }))}
                  className={`p-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                    config.mode === 'questions'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  <Hash className="w-4 h-4" /> Questions
                </button>
                <button
                  onClick={() => setConfig(c => ({ ...c, mode: 'time' }))}
                  className={`p-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                    config.mode === 'time'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  <Clock className="w-4 h-4" /> Timed
                </button>
              </div>

              {config.mode === 'questions' && (
                <div className="grid grid-cols-4 gap-2">
                  {[10, 20, 30, 50].map(count => (
                    <button
                      key={count}
                      onClick={() => setConfig(c => ({ ...c, questionCount: count }))}
                      className={`p-2 rounded-lg font-medium transition-colors ${
                        config.questionCount === count
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              )}

              {config.mode === 'time' && (
                <div>
                  <select
                    value={config.timeLimitMinutes || 5}
                    onChange={(e) => setConfig(c => ({ ...c, timeLimitMinutes: parseInt(e.target.value) }))}
                    className="w-full p-3 rounded-xl bg-slate-700 text-white font-medium border border-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {[1, 2, 3, 5, 10, 15, 20, 30].map(mins => (
                      <option key={mins} value={mins}>
                        {mins} {mins === 1 ? 'minute' : 'minutes'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Start button */}
            <Button
              size="xl"
              className="w-full"
              onClick={startSession}
            >
              <Play className="w-6 h-6 mr-2" /> Start Mission
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
