import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, LogOut, Trophy, Zap, Clock, Hash, Dumbbell, Pencil } from 'lucide-react';
import { Button } from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';
import {
  type GymnasiumSessionConfig,
  THEME_OPTIONS,
  GRADE_OPTIONS,
  createDefaultGymnasiumConfig,
} from '../types/gymnasium';

const GYMNASIUM_CONFIG_KEY = 'gymnasium_custom_config';

// Load last custom config from localStorage
function loadCustomConfig(): GymnasiumSessionConfig {
  const stored = localStorage.getItem(GYMNASIUM_CONFIG_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return { ...createDefaultGymnasiumConfig(), ...parsed };
    } catch {
      // Invalid JSON, return default
    }
  }
  return createDefaultGymnasiumConfig();
}

// Save custom config to localStorage
function saveCustomConfig(config: GymnasiumSessionConfig): void {
  localStorage.setItem(GYMNASIUM_CONFIG_KEY, JSON.stringify(config));
}

export function GymnasiumHomePage() {
  const navigate = useNavigate();
  const { currentChild, signOut } = useAuth();
  const [config, setConfig] = useState<GymnasiumSessionConfig>(loadCustomConfig);
  const [customThemeInput, setCustomThemeInput] = useState(config.customTheme || '');

  const startSession = () => {
    const finalConfig = {
      ...config,
      customTheme: config.theme === 'custom' ? customThemeInput : undefined,
    };
    saveCustomConfig(finalConfig);
    sessionStorage.setItem('gymnasiumConfig', JSON.stringify(finalConfig));
    navigate('/practice');
  };

  const selectedTheme = THEME_OPTIONS.find(t => t.value === config.theme);
  const themeColors = selectedTheme?.colors || THEME_OPTIONS[5].colors; // Default to standard

  return (
    <div
      className="min-h-screen transition-colors duration-500"
      style={{
        background: `linear-gradient(to bottom, ${themeColors.primary}dd, ${themeColors.secondary}dd, #0f172a)`,
      }}
    >
      {/* Header */}
      <header className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-4">
            <div className="text-5xl">
              <Dumbbell className="w-12 h-12 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-2xl">
                Michael's Math Gymnasium
              </h1>
              {currentChild && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-white/80">
                    Welcome, {currentChild.name}!
                  </span>
                </div>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>

        {/* Stats Bar */}
        {currentChild && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/20 rounded-2xl p-4 border border-white/10"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span className="text-amber-400 font-bold">
                  Math Champion
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-400" />
                <span className="text-blue-400 font-bold">
                  {currentChild.totalXp} XP
                </span>
              </div>
            </div>
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
            Configure Your Workout
          </h2>

          {/* Theme Selection */}
          <div className="bg-black/20 rounded-2xl p-4 border border-white/10">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
              <span className="text-2xl">{selectedTheme?.emoji}</span>
              Choose Your Theme
            </h3>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {THEME_OPTIONS.filter(t => t.value !== 'custom').map(theme => (
                <button
                  key={theme.value}
                  onClick={() => setConfig(c => ({ ...c, theme: theme.value }))}
                  className={`p-3 rounded-xl font-medium transition-all flex flex-col items-center gap-1 ${
                    config.theme === theme.value
                      ? 'bg-white text-slate-900 scale-105 shadow-lg'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <span className="text-2xl">{theme.emoji}</span>
                  <span className="text-xs">{theme.label}</span>
                </button>
              ))}
            </div>

            {/* Custom theme option */}
            <div className="mt-3">
              <button
                onClick={() => setConfig(c => ({ ...c, theme: 'custom' }))}
                className={`w-full p-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                  config.theme === 'custom'
                    ? 'bg-white text-slate-900'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <span className="text-xl">✨</span>
                {customThemeInput && config.theme !== 'custom' ? (
                  <span className="flex items-center gap-2">
                    Custom: {customThemeInput}
                    <Pencil className="w-3.5 h-3.5 opacity-60" />
                  </span>
                ) : (
                  <span>Custom Theme</span>
                )}
              </button>

              {config.theme === 'custom' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customThemeInput}
                      onChange={(e) => setCustomThemeInput(e.target.value)}
                      placeholder="Enter your theme (e.g., 'Space adventures', 'Dinosaurs')"
                      className="flex-1 p-3 rounded-xl bg-white/10 text-white placeholder:text-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                    <Pencil className="w-5 h-5 text-white/50 shrink-0" />
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Grade Level Selection */}
          <div className="bg-black/20 rounded-2xl p-4 border border-white/10">
            <h3 className="text-white font-bold mb-3">Grade Level</h3>
            <div className="grid grid-cols-7 gap-2">
              {GRADE_OPTIONS.slice(0, 7).map(grade => (
                <button
                  key={grade.value}
                  onClick={() => setConfig(c => ({ ...c, gradeLevel: grade.value }))}
                  className={`p-3 rounded-xl font-bold transition-all ${
                    config.gradeLevel === grade.value
                      ? 'bg-white text-slate-900 scale-105 shadow-lg'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {grade.value}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-6 gap-2 mt-2">
              {GRADE_OPTIONS.slice(7).map(grade => (
                <button
                  key={grade.value}
                  onClick={() => setConfig(c => ({ ...c, gradeLevel: grade.value }))}
                  className={`p-3 rounded-xl font-bold transition-all ${
                    config.gradeLevel === grade.value
                      ? 'bg-white text-slate-900 scale-105 shadow-lg'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {grade.value}
                </button>
              ))}
            </div>
          </div>

          {/* Session Settings */}
          <div className="bg-black/20 rounded-2xl p-4 border border-white/10">
            <h3 className="text-white font-bold mb-3">Session Length</h3>

            {/* Mode Selection */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => setConfig(c => ({ ...c, mode: 'questions' }))}
                className={`p-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                  config.mode === 'questions'
                    ? 'bg-white text-slate-900'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Hash className="w-4 h-4" /> Questions
              </button>
              <button
                onClick={() => setConfig(c => ({ ...c, mode: 'time' }))}
                className={`p-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                  config.mode === 'time'
                    ? 'bg-white text-slate-900'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Clock className="w-4 h-4" /> Timed
              </button>
            </div>

            {config.mode === 'questions' && (
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map(count => (
                  <button
                    key={count}
                    onClick={() => setConfig(c => ({ ...c, questionCount: count }))}
                    className={`p-2 rounded-lg font-medium transition-all ${
                      config.questionCount === count
                        ? 'bg-white text-slate-900'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            )}

            {config.mode === 'time' && (
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map(mins => (
                  <button
                    key={mins}
                    onClick={() => setConfig(c => ({ ...c, timeLimitMinutes: mins }))}
                    className={`p-2 rounded-lg font-medium transition-all ${
                      config.timeLimitMinutes === mins
                        ? 'bg-white text-slate-900'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {mins} min
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* End Mode (Chill vs Race) */}
          <div className="bg-black/20 rounded-2xl p-4 border border-white/10">
            <h3 className="text-white font-bold mb-3">Session Mode</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setConfig(c => ({ ...c, endMode: 'chill' }))}
                className={`p-4 rounded-xl font-medium transition-all flex flex-col items-center gap-2 ${
                  config.endMode === 'chill'
                    ? 'bg-white text-slate-900'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <span className="text-2xl">😌</span>
                <span className="font-bold">Chill Mode</span>
                <span className="text-xs opacity-70">Finish your current question when time's up</span>
              </button>
              <button
                onClick={() => setConfig(c => ({ ...c, endMode: 'race' }))}
                className={`p-4 rounded-xl font-medium transition-all flex flex-col items-center gap-2 ${
                  config.endMode === 'race'
                    ? 'bg-white text-slate-900'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <span className="text-2xl">🏃</span>
                <span className="font-bold">Race Mode</span>
                <span className="text-xs opacity-70">Session ends immediately when time's up</span>
              </button>
            </div>
          </div>

          {/* Start button */}
          <Button
            size="xl"
            className="w-full"
            onClick={startSession}
            style={{
              background: `linear-gradient(to right, ${themeColors.primary}, ${themeColors.secondary})`,
            }}
          >
            <Play className="w-6 h-6 mr-2" /> Start Workout
          </Button>
        </motion.div>
      </main>
    </div>
  );
}
