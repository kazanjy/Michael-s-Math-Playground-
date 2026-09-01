import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, LogOut, Trophy, Zap, Clock, Hash, History } from 'lucide-react';
import { Button } from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';
import { createDefaultSessionConfig, DIGIT_COMBOS, computeOperations, DIFFICULTY_LABELS } from '../types';
import type { SessionConfig, Operation, DigitCombo, Difficulty } from '../types';
import { getXPProgressToNextRank } from '../lib/xpCalculator';

// Mission history type
export interface MissionHistory {
  id: string;
  timestamp: number;
  config: SessionConfig;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  avgTimePerQuestion: number; // ms
  totalXp: number;
}

const CUSTOM_CONFIG_KEY = 'math_playground_custom_config';
const MISSION_HISTORY_KEY = 'math_playground_mission_history';

// Load last custom config from localStorage
function loadCustomConfig(): SessionConfig {
  const stored = localStorage.getItem(CUSTOM_CONFIG_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Merge with defaults to ensure all new fields exist
      return { ...createDefaultSessionConfig(), ...parsed };
    } catch {
      // Invalid JSON, return default
    }
  }
  return createDefaultSessionConfig();
}

// Save custom config to localStorage
function saveCustomConfig(config: SessionConfig): void {
  localStorage.setItem(CUSTOM_CONFIG_KEY, JSON.stringify(config));
}

// Load mission history
export function loadMissionHistory(): MissionHistory[] {
  const stored = localStorage.getItem(MISSION_HISTORY_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
}

// Save mission to history
export function saveMissionToHistory(mission: Omit<MissionHistory, 'id' | 'timestamp'>): void {
  const history = loadMissionHistory();
  const newMission: MissionHistory = {
    ...mission,
    id: `mission_${Date.now()}`,
    timestamp: Date.now(),
  };
  // Add to beginning, keep only last 20
  history.unshift(newMission);
  if (history.length > 20) {
    history.length = 20;
  }
  localStorage.setItem(MISSION_HISTORY_KEY, JSON.stringify(history));
}

// Format time ago
function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

// Check if a mission uses speed times tables
function missionUsesSpeedTables(config: SessionConfig): boolean {
  return config.speedTimesTablesEnabled ||
    (config.primaryNumbers && config.primaryNumbers.length > 0);
}

// Check if a mission uses mental math
function missionUsesMentalMath(config: SessionConfig): boolean {
  return config.generalMentalMathEnabled || false;
}

export function HomePage() {
  const navigate = useNavigate();
  const { currentChild, signOut } = useAuth();
  const [missionHistory, setMissionHistory] = useState<MissionHistory[]>([]);

  // Session configuration state - load from localStorage
  const [config, setConfig] = useState<SessionConfig>(loadCustomConfig);

  // Load mission history on mount
  useEffect(() => {
    setMissionHistory(loadMissionHistory());
  }, []);

  const xpProgress = currentChild
    ? getXPProgressToNextRank(currentChild.totalXp)
    : null;

  const startSession = () => {
    // Compute combined operations before saving
    const finalConfig = {
      ...config,
      operations: computeOperations(config),
    };
    saveCustomConfig(finalConfig);
    sessionStorage.setItem('sessionConfig', JSON.stringify(finalConfig));
    navigate('/practice');
  };

  const startFromHistory = (mission: MissionHistory) => {
    sessionStorage.setItem('sessionConfig', JSON.stringify(mission.config));
    navigate('/practice');
  };

  const toggleSpeedOperation = (op: 'multiply' | 'divide') => {
    setConfig(c => {
      const ops = c.speedOperations.includes(op)
        ? c.speedOperations.filter(o => o !== op)
        : [...c.speedOperations, op];
      return { ...c, speedOperations: ops.length > 0 ? ops : c.speedOperations };
    });
  };

  const toggleMentalMathOperation = (op: Operation) => {
    setConfig(c => {
      const ops = c.mentalMathOperations.includes(op)
        ? c.mentalMathOperations.filter(o => o !== op)
        : [...c.mentalMathOperations, op];
      return { ...c, mentalMathOperations: ops };
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

  const toggleDigitCombo = (op: Operation, combo: DigitCombo) => {
    setConfig(c => {
      const key = `${op}DigitCombos` as keyof SessionConfig;
      const current = (c[key] as DigitCombo[]) || [];
      const updated = current.includes(combo)
        ? current.filter(d => d !== combo)
        : [...current, combo];
      return { ...c, [key]: updated.length > 0 ? updated : current };
    });
  };

  // Check if ready to start
  const canStart = (config.speedTimesTablesEnabled && config.speedOperations.length > 0) ||
    (config.generalMentalMathEnabled && config.mentalMathOperations.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950">
      {/* Header - Prominent Rank Display */}
      <header className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-4">
            {/* Large Jet Icon */}
            <div className="text-5xl">
              {xpProgress?.currentRank.jetIcon || '✈️'}
            </div>
            <div>
              <h1 className="text-white font-bold text-2xl">
                {currentChild?.name || 'Pilot'}
              </h1>
              {xpProgress && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl">{xpProgress.currentRank.icon}</span>
                  <span className="text-amber-400 font-bold text-lg">
                    {xpProgress.currentRank.title}
                  </span>
                </div>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>

        {/* Jet Name Banner */}
        {xpProgress && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-xl p-3 mb-4 border border-blue-500/30"
          >
            <div className="text-center">
              <span className="text-slate-400 text-sm">
                Current {xpProgress.currentRank.craftType === 'spacecraft' ? 'Spacecraft' : 'Jet'}:{' '}
              </span>
              <span className="text-2xl mr-2">{xpProgress.currentRank.jetIcon}</span>
              <span className="text-white font-bold">{xpProgress.currentRank.jet}</span>
            </div>
          </motion.div>
        )}

        {/* Stats Bar */}
        {currentChild && xpProgress && (
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
        )}
      </header>

      {/* Main content */}
      <main className="px-4 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold text-white text-center mb-4">
            Configure Your Mission
          </h2>

          {/* Mission Difficulty Section */}
          <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
            <h3 className="text-white font-bold mb-3">Mission Difficulty</h3>
            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'medium', 'crazy'] as Difficulty[]).map(diff => (
                <button
                  key={diff}
                  onClick={() => setConfig(c => ({ ...c, difficulty: diff }))}
                  data-tip={
                    diff === 'easy'
                      ? 'Easy: More time to answer (2x). Dogfights cost 15 XP.'
                      : diff === 'medium'
                      ? 'Medium: Standard timing (1.5x). Dogfights cost 30 XP.'
                      : 'Crazy: Fastest timing. Dogfights cost 45 XP. For experts!'
                  }
                  className={`p-3 rounded-xl font-bold transition-colors ${
                    config.difficulty === diff
                      ? diff === 'easy'
                        ? 'bg-emerald-600 text-white'
                        : diff === 'medium'
                        ? 'bg-amber-600 text-white'
                        : 'bg-red-600 text-white'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {diff === 'easy' && '😊 '}
                  {diff === 'medium' && '💪 '}
                  {diff === 'crazy' && '🔥 '}
                  {DIFFICULTY_LABELS[diff]}
                </button>
              ))}
            </div>
          </div>

          {/* Speed Times Tables Section */}
          <div className={`bg-slate-800/50 rounded-2xl border overflow-hidden ${config.speedTimesTablesEnabled ? 'border-blue-500/50' : 'border-slate-700'}`}>
            <div className="p-4 flex items-center gap-3" data-tip="Memorize multiplication and division facts with spaced repetition">
              <input
                type="checkbox"
                checked={config.speedTimesTablesEnabled}
                onChange={() => setConfig(c => ({ ...c, speedTimesTablesEnabled: !c.speedTimesTablesEnabled }))}
                className="w-5 h-5 rounded accent-blue-500"
                data-tip="Enable Speed Times Tables practice"
              />
              <div>
                <h3 className="text-white font-bold text-lg">Speed Times Tables</h3>
                <p className="text-slate-400 text-sm">Practice multiplication & division facts</p>
              </div>
            </div>

            <div className={`px-4 pb-4 space-y-4 ${!config.speedTimesTablesEnabled ? 'opacity-50' : ''}`}>
              {/* Operations */}
              <div>
                <h4 className="text-slate-300 text-sm font-medium mb-2">Operations</h4>
                <div className="flex gap-2">
                  {(['multiply', 'divide'] as const).map(op => (
                    <button
                      key={op}
                      onClick={() => toggleSpeedOperation(op)}
                      disabled={!config.speedTimesTablesEnabled}
                      data-tip={op === 'multiply' ? 'Practice multiplication (e.g., 7 × 8 = ?)' : 'Practice division (e.g., 56 ÷ 7 = ?)'}
                      className={`flex-1 p-2 rounded-lg font-medium transition-colors ${
                        config.speedOperations.includes(op)
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-400'
                      } ${!config.speedTimesTablesEnabled ? 'cursor-not-allowed' : ''}`}
                    >
                      {op === 'multiply' ? '× Multiply' : '÷ Divide'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tables to practice */}
              <div>
                <h4 className="text-slate-300 text-sm font-medium mb-2">Tables</h4>
                <div className="grid grid-cols-6 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                    <button
                      key={num}
                      onClick={() => togglePrimaryNumber(num)}
                      disabled={!config.speedTimesTablesEnabled}
                      data-tip={`Practice the ${num} times table (${num}×1, ${num}×2, ...)`}
                      className={`p-2 rounded-lg font-bold transition-colors ${
                        config.primaryNumbers.includes(num)
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-700 text-slate-400'
                      } ${!config.speedTimesTablesEnabled ? 'cursor-not-allowed' : ''}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Multiplier ranges */}
              <div>
                <h4 className="text-slate-300 text-sm font-medium mb-2">Multiply By</h4>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: '1-5', min: 1, max: 5, desc: 'Easier: multiply by 1, 2, 3, 4, or 5' },
                    { label: '6-10', min: 6, max: 10, desc: 'Standard: multiply by 6, 7, 8, 9, or 10' },
                    { label: '11-15', min: 11, max: 15, desc: 'Harder: multiply by 11, 12, 13, 14, or 15' },
                    { label: '16-20', min: 16, max: 20, desc: 'Challenge: multiply by 16, 17, 18, 19, or 20' },
                  ].map(range => {
                    const isSelected = config.multiplierRanges.some(
                      r => r.min === range.min && r.max === range.max
                    );
                    return (
                      <button
                        key={range.label}
                        disabled={!config.speedTimesTablesEnabled}
                        data-tip={range.desc}
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
                        className={`p-2 rounded-lg font-medium transition-colors text-sm ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-700 text-slate-400'
                        } ${!config.speedTimesTablesEnabled ? 'cursor-not-allowed' : ''}`}
                      >
                        {range.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* General Mental Math Section */}
          <div className={`bg-slate-800/50 rounded-2xl border overflow-hidden ${config.generalMentalMathEnabled ? 'border-purple-500/50' : 'border-slate-700'}`}>
            <div className="p-4 flex items-center gap-3" data-tip="Practice mental math techniques with multi-digit numbers">
              <input
                type="checkbox"
                checked={config.generalMentalMathEnabled}
                onChange={() => setConfig(c => ({ ...c, generalMentalMathEnabled: !c.generalMentalMathEnabled }))}
                className="w-5 h-5 rounded accent-purple-500"
                data-tip="Enable General Mental Math practice"
              />
              <div>
                <h3 className="text-white font-bold text-lg">General Mental Math</h3>
                <p className="text-slate-400 text-sm">Multi-digit arithmetic practice</p>
              </div>
            </div>

            <div className={`px-4 pb-4 space-y-4 ${!config.generalMentalMathEnabled ? 'opacity-50' : ''}`}>
              {/* Operations with digit combos */}
              {(['add', 'subtract', 'multiply', 'divide'] as Operation[]).map(op => {
                const isEnabled = config.mentalMathOperations.includes(op);
                const comboKey = `${op}DigitCombos` as keyof SessionConfig;
                const combos = (config[comboKey] as DigitCombo[]) || [];
                const opDesc = {
                  add: 'Practice adding numbers mentally',
                  subtract: 'Practice subtracting numbers mentally',
                  multiply: 'Practice multiplying multi-digit numbers',
                  divide: 'Practice dividing numbers mentally',
                }[op];

                return (
                  <div key={op} className="bg-slate-700/50 rounded-xl p-3">
                    <div className="flex items-center gap-3 mb-2">
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={() => toggleMentalMathOperation(op)}
                        disabled={!config.generalMentalMathEnabled}
                        className="w-4 h-4 rounded accent-purple-500"
                        data-tip={opDesc}
                      />
                      <span
                        className={`font-medium ${isEnabled && config.generalMentalMathEnabled ? 'text-white' : 'text-slate-500'}`}
                        data-tip={opDesc}
                      >
                        {op === 'multiply' && '× Multiplication'}
                        {op === 'divide' && '÷ Division'}
                        {op === 'add' && '+ Addition'}
                        {op === 'subtract' && '− Subtraction'}
                      </span>
                    </div>

                    <div className={`flex flex-wrap gap-2 ml-7 ${!isEnabled ? 'opacity-50' : ''}`}>
                      {DIGIT_COMBOS.map(combo => {
                        const [d1, d2] = combo.split('x').map(Number);
                        const example1 = d1 === 1 ? '5' : d1 === 2 ? '42' : '358';
                        const example2 = d2 === 1 ? '7' : d2 === 2 ? '23' : '156';
                        const comboDesc = `${d1}-digit × ${d2}-digit (e.g., ${example1} ${op === 'add' ? '+' : op === 'subtract' ? '−' : op === 'multiply' ? '×' : '÷'} ${example2})`;
                        return (
                          <button
                            key={combo}
                            onClick={() => toggleDigitCombo(op, combo)}
                            disabled={!config.generalMentalMathEnabled || !isEnabled}
                            data-tip={comboDesc}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                              combos.includes(combo)
                                ? 'bg-purple-600 text-white'
                                : 'bg-slate-600 text-slate-400'
                            } ${(!config.generalMentalMathEnabled || !isEnabled) ? 'cursor-not-allowed' : ''}`}
                          >
                            {combo.replace('x', '×')}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Session Settings */}
          <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
            <h3 className="text-white font-bold mb-3">Session Settings</h3>

            {/* Mode Selection */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => setConfig(c => ({ ...c, mode: 'questions' }))}
                data-tip="Practice a fixed number of questions"
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
                data-tip="Practice for a set amount of time"
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
                    data-tip={`Complete ${count} questions in this session`}
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
              <select
                value={config.timeLimitMinutes || 5}
                onChange={(e) => setConfig(c => ({ ...c, timeLimitMinutes: parseInt(e.target.value) }))}
                data-tip="Choose how long to practice"
                className="w-full p-3 rounded-xl bg-slate-700 text-white font-medium border border-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {[1, 2, 3, 5, 10, 15, 20, 30].map(mins => (
                  <option key={mins} value={mins}>
                    {mins} {mins === 1 ? 'minute' : 'minutes'}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Start button */}
          <Button
            size="xl"
            className="w-full"
            onClick={startSession}
            disabled={!canStart}
            data-tip="Begin your math practice mission with the selected settings"
          >
            <Play className="w-6 h-6 mr-2" /> Start Mission
          </Button>

          {!canStart && (
            <p className="text-center text-red-400 text-sm">
              Enable at least one mode with operations to start
            </p>
          )}

          {/* Mission History */}
          {missionHistory.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8"
            >
              <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-slate-400" />
                <h3 className="text-lg font-bold text-white">Mission History</h3>
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {missionHistory.map((mission, i) => (
                  <motion.button
                    key={mission.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.03 }}
                    onClick={() => startFromHistory(mission)}
                    className="w-full p-4 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 text-left transition-colors border border-slate-700"
                  >
                    {/* Header row */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {/* Difficulty badge */}
                        <span className={`text-xs px-2 py-1 rounded font-medium ${
                          mission.config.difficulty === 'easy'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : mission.config.difficulty === 'crazy'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {mission.config.difficulty === 'easy' && '😊 Easy'}
                          {mission.config.difficulty === 'medium' && '💪 Medium'}
                          {mission.config.difficulty === 'crazy' && '🔥 Crazy'}
                        </span>
                        {/* Mode badges */}
                        {missionUsesSpeedTables(mission.config) && (
                          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded font-medium">
                            Speed Tables
                          </span>
                        )}
                        {missionUsesMentalMath(mission.config) && (
                          <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded font-medium">
                            Mental Math
                          </span>
                        )}
                        {/* Session type */}
                        <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">
                          {mission.config.mode === 'questions'
                            ? `${mission.config.questionCount} Questions`
                            : `${mission.config.timeLimitMinutes} min`
                          }
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">
                          {formatTimeAgo(mission.timestamp)}
                        </span>
                        <Play className="w-5 h-5 text-blue-400" />
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 mb-3 text-sm">
                      <span className="text-emerald-400 font-medium">
                        {mission.correctAnswers}/{mission.totalQuestions} correct
                      </span>
                      {mission.wrongAnswers > 0 && (
                        <span className="text-red-400">
                          {mission.wrongAnswers} wrong
                        </span>
                      )}
                      <span className="text-slate-400">
                        {(mission.avgTimePerQuestion / 1000).toFixed(1)}s avg
                      </span>
                      <span className="text-amber-400">
                        +{mission.totalXp} XP
                      </span>
                    </div>

                    {/* Details row - Speed Tables */}
                    {missionUsesSpeedTables(mission.config) && mission.config.primaryNumbers && (
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="text-xs text-slate-500">Tables:</span>
                        <div className="flex items-center gap-1 flex-wrap">
                          {mission.config.primaryNumbers.map(num => (
                            <span
                              key={num}
                              className="text-xs text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded font-medium"
                            >
                              {num}
                            </span>
                          ))}
                        </div>
                        {mission.config.multiplierRanges && mission.config.multiplierRanges.length > 0 && (
                          <>
                            <span className="text-xs text-slate-500 ml-2">×</span>
                            <span className="text-xs text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                              {mission.config.multiplierRanges[0].min}-{mission.config.multiplierRanges[mission.config.multiplierRanges.length - 1].max}
                            </span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Details row - Mental Math */}
                    {missionUsesMentalMath(mission.config) && mission.config.mentalMathOperations && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-slate-500">Mental:</span>
                        {mission.config.mentalMathOperations.map(op => {
                          const comboKey = `${op}DigitCombos` as keyof SessionConfig;
                          const combos = (mission.config[comboKey] as DigitCombo[]) || [];
                          return (
                            <span key={op} className="text-xs text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded">
                              {op === 'multiply' ? '×' : op === 'divide' ? '÷' : op === 'add' ? '+' : '−'}
                              {' '}
                              {combos.map(c => c.replace('x', '×')).join(', ')}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
