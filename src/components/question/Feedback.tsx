import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import type { XPResult } from '../../lib/xpCalculator';

interface FeedbackProps {
  isCorrect: boolean | null;
  correctAnswer?: number;
  xpResult?: XPResult;
  streak?: number;
  responseTimeMs?: number;
  onContinue?: () => void;
}

export function Feedback({
  isCorrect,
  correctAnswer,
  xpResult,
  streak = 0,
  responseTimeMs,
  onContinue,
}: FeedbackProps) {
  if (isCorrect === null) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
      >
        {isCorrect ? (
          <CorrectFeedback xpResult={xpResult} streak={streak} responseTimeMs={responseTimeMs} onContinue={onContinue} />
        ) : (
          <WrongFeedback correctAnswer={correctAnswer} />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function CorrectFeedback({
  xpResult,
  streak,
  responseTimeMs,
  onContinue,
}: {
  xpResult?: XPResult;
  streak: number;
  responseTimeMs?: number;
  onContinue?: () => void;
}) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', damping: 15 }}
      className="pointer-events-auto"
    >
      <div className="bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-3xl p-8 shadow-2xl shadow-emerald-500/50 text-center">
        <motion.div
          initial={{ rotate: -180, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: 'spring', delay: 0.1 }}
        >
          <Check className="w-20 h-20 text-white mx-auto mb-4" strokeWidth={3} />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-white mb-2"
        >
          {getCorrectMessage(streak)}
        </motion.h2>

        {/* Response time display */}
        {responseTimeMs !== undefined && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="text-lg text-emerald-200 mb-3"
          >
            ⏱️ {(responseTimeMs / 1000).toFixed(1)}s
          </motion.div>
        )}

        {xpResult && xpResult.totalXp > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-1"
          >
            <div className="text-2xl font-bold text-amber-300">
              +{xpResult.totalXp} XP
            </div>
            <div className="text-sm text-emerald-200 space-x-2">
              {xpResult.speedBonus > 0 && (
                <span>⚡ Speed +{xpResult.speedBonus}</span>
              )}
              {xpResult.streakBonus > 0 && (
                <span>🔥 Streak +{xpResult.streakBonus}</span>
              )}
              {xpResult.difficultyBonus > 0 && (
                <span>💪 Difficulty +{xpResult.difficultyBonus}</span>
              )}
            </div>
          </motion.div>
        )}

        {streak >= 5 && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: 'spring' }}
            className="mt-4 text-xl text-amber-300 font-bold"
          >
            🔥 {streak} in a row!
          </motion.div>
        )}

        {onContinue && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={onContinue}
            className="mt-6 px-8 py-3 bg-white/20 hover:bg-white/30 rounded-xl text-white font-bold transition-colors"
          >
            Continue
          </motion.button>
        )}
      </div>

      {/* Confetti effect */}
      <ConfettiEffect />
    </motion.div>
  );
}

function WrongFeedback({ correctAnswer }: { correctAnswer?: number }) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', damping: 15 }}
      className="pointer-events-auto"
    >
      <motion.div
        animate={{ x: [-10, 10, -10, 10, 0] }}
        transition={{ duration: 0.4 }}
        className="bg-gradient-to-b from-red-500 to-red-600 rounded-3xl p-8 shadow-2xl shadow-red-500/50 text-center"
      >
        <motion.div
          initial={{ rotate: 180, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: 'spring', delay: 0.1 }}
        >
          <X className="w-20 h-20 text-white mx-auto mb-4" strokeWidth={3} />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-white mb-2"
        >
          Try Again!
        </motion.h2>

        {correctAnswer !== undefined && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-red-200 text-lg"
          >
            The answer was {correctAnswer}
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
}

function ConfettiEffect() {
  const confetti = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    x: Math.random() * 200 - 100,
    y: Math.random() * -200 - 50,
    rotation: Math.random() * 360,
    scale: 0.5 + Math.random() * 0.5,
    emoji: ['✈️', '⭐', '🔥', '💫', '✨'][Math.floor(Math.random() * 5)],
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {confetti.map(particle => (
        <motion.div
          key={particle.id}
          initial={{
            opacity: 1,
            x: 0,
            y: 0,
            rotate: 0,
            scale: particle.scale,
          }}
          animate={{
            opacity: 0,
            x: particle.x,
            y: particle.y,
            rotate: particle.rotation,
          }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="absolute top-1/2 left-1/2 text-2xl"
        >
          {particle.emoji}
        </motion.div>
      ))}
    </div>
  );
}

function getCorrectMessage(streak: number): string {
  if (streak >= 10) return 'UNSTOPPABLE!';
  if (streak >= 7) return 'ON FIRE!';
  if (streak >= 5) return 'AMAZING!';
  if (streak >= 3) return 'GREAT!';
  return 'Correct!';
}
