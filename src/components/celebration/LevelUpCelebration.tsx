import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RANKS, ERA_BADGES } from '../../types';
import type { Rank } from '../../types';

const FINAL_LEVEL = RANKS[RANKS.length - 1].level;

interface LevelUpCelebrationProps {
  oldRank: Rank;
  newRank: Rank;
  onDismiss: () => void;
  variant?: 'mini' | 'full';
}

export function LevelUpCelebration({
  oldRank,
  newRank,
  onDismiss,
  variant = 'full',
}: LevelUpCelebrationProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 500);
  };

  // Dismiss on any keypress
  useEffect(() => {
    const handleKeyDown = () => {
      handleDismiss();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (variant === 'mini') {
    return (
      <MiniLevelUp
        newRank={newRank}
        isVisible={isVisible}
        onDismiss={handleDismiss}
      />
    );
  }

  return (
    <FullLevelUp
      oldRank={oldRank}
      newRank={newRank}
      isVisible={isVisible}
      onDismiss={handleDismiss}
    />
  );
}

// Mini notification for during practice
function MiniLevelUp({
  newRank,
  isVisible,
  onDismiss,
}: {
  newRank: Rank;
  isVisible: boolean;
  onDismiss: () => void;
}) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.8 }}
          onClick={onDismiss}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 cursor-pointer"
        >
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl px-6 py-4 shadow-2xl shadow-amber-500/50 border-2 border-amber-300">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5 }}
                className="text-3xl"
              >
                🎖️
              </motion.div>
              <div>
                <div className="text-amber-100 text-sm font-medium">RANK UP!</div>
                <div className="text-white font-bold text-lg">{newRank.title}</div>
              </div>
            </div>
          </div>

          {/* Mini jets */}
          <JetTrails count={3} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Full celebration for summary page
function FullLevelUp({
  oldRank,
  newRank,
  isVisible,
  onDismiss,
}: {
  oldRank: Rank;
  newRank: Rank;
  isVisible: boolean;
  onDismiss: () => void;
}) {
  // Determine unlocks based on rank change
  const unlocks = getUnlocksForRank(oldRank, newRank);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDismiss}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-pointer"
        >
          {/* Background effects */}
          <Fireworks />
          <JetTrails count={6} fullScreen />

          {/* Main content */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 15, delay: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl p-8 max-w-sm mx-4 border-2 border-amber-500/50 shadow-2xl shadow-amber-500/30"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-amber-500/20 to-transparent pointer-events-none" />

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-center mb-6"
            >
              <div className="text-amber-400 text-lg font-bold tracking-wider mb-1">
                ⭐ PROMOTION ⭐
              </div>
              <h2 className="text-3xl font-bold text-white">
                RANK UP!
              </h2>
            </motion.div>

            {/* Rank comparison */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
              className="flex items-center justify-center gap-4 mb-6"
            >
              {/* Old rank */}
              <div className="text-center opacity-60">
                <div className="text-4xl mb-2">🎖️</div>
                <div className="text-slate-400 text-sm">{oldRank.title}</div>
              </div>

              {/* Arrow */}
              <motion.div
                animate={{ x: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="text-3xl text-amber-400"
              >
                →
              </motion.div>

              {/* New rank */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{ delay: 1, type: 'spring' }}
                className="text-center"
              >
                <motion.div
                  animate={{
                    rotate: [0, -5, 5, -5, 5, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ delay: 1.3, duration: 0.5 }}
                  className="text-5xl mb-2"
                >
                  🎖️
                </motion.div>
                <div className="text-amber-400 font-bold text-lg">{newRank.title}</div>
              </motion.div>
            </motion.div>

            {/* Congratulatory message */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="text-center text-slate-300 mb-6"
            >
              {getCongratMessage(newRank)}
            </motion.p>

            {/* Unlocks */}
            {unlocks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
                className="bg-slate-700/50 rounded-xl p-4 mb-6"
              >
                <div className="text-amber-400 text-sm font-medium mb-2 text-center">
                  🔓 UNLOCKED
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {unlocks.map((unlock, i) => (
                    <motion.div
                      key={unlock}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.7 + i * 0.1 }}
                      className="bg-slate-600 rounded-lg px-3 py-1 text-white text-sm"
                    >
                      {unlock}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Press any key to continue */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.5, 1] }}
              transition={{ delay: 2, duration: 2, repeat: Infinity }}
              className="text-center text-slate-500 text-sm"
            >
              Press any key to continue
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Fireworks/particle effect
function Fireworks() {
  const particles = Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 4 + Math.random() * 8,
    delay: Math.random() * 2,
    duration: 1 + Math.random() * 2,
    color: ['#fbbf24', '#f59e0b', '#ef4444', '#3b82f6', '#10b981'][Math.floor(Math.random() * 5)],
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            opacity: 0,
            scale: 0,
            x: `${p.x}vw`,
            y: `${p.y}vh`
          }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0, 1, 1, 0],
          }}
          transition={{
            delay: p.delay,
            duration: p.duration,
            repeat: Infinity,
            repeatDelay: Math.random() * 3,
          }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
          }}
        />
      ))}
    </div>
  );
}

// Jets flying across screen
function JetTrails({ count, fullScreen = false }: { count: number; fullScreen?: boolean }) {
  const jets = Array.from({ length: count }).map((_, i) => ({
    id: i,
    y: fullScreen ? 10 + (i * 80) / count : -20 + i * 20,
    delay: i * 0.3,
    duration: 2 + Math.random(),
  }));

  return (
    <div className={`absolute ${fullScreen ? 'inset-0' : '-inset-x-20 -top-10 h-20'} pointer-events-none overflow-hidden`}>
      {jets.map((jet) => (
        <motion.div
          key={jet.id}
          initial={{ x: '-10%', y: `${jet.y}%` }}
          animate={{ x: '110%' }}
          transition={{
            delay: jet.delay,
            duration: jet.duration,
            ease: 'linear',
            repeat: Infinity,
            repeatDelay: 1,
          }}
          className="absolute text-2xl"
          style={{ top: `${jet.y}%` }}
        >
          ✈️
          {/* Contrail */}
          <motion.div
            className="absolute right-full top-1/2 -translate-y-1/2 w-20 h-1 bg-gradient-to-l from-white/50 to-transparent"
          />
        </motion.div>
      ))}
    </div>
  );
}

// Get congratulatory message based on rank - uses actual rank data
function getCongratMessage(rank: Rank): string {
  // Special messages for milestone ranks
  if (rank.level === FINAL_LEVEL) {
    return `${rank.title}! You've reached the pinnacle - the legendary ${rank.jet} is yours!`;
  }
  if (rank.craftType === 'spacecraft') {
    return `${rank.title}! The ${rank.jet} is fuelled and cleared for launch!`;
  }
  if (rank.level >= 41) {
    return `${rank.title}! The top-secret ${rank.jet} is yours to fly!`;
  }
  if (rank.level >= 31) {
    return `${rank.title}! The rare ${rank.jet} rolls into your hangar!`;
  }
  if (rank.level >= 28) {
    return `${rank.title}! You've earned the ultra-rare ${rank.jet}!`;
  }
  if (rank.level >= 22) {
    return `${rank.title}! The elite ${rank.jet} joins your hangar!`;
  }
  if (rank.level >= 16) {
    return `${rank.title}! The powerful ${rank.jet} is now yours to command!`;
  }
  if (rank.level >= 10) {
    return `${rank.title}! You've unlocked the legendary ${rank.jet}!`;
  }
  if (rank.level >= 4) {
    return `${rank.title}! The ${rank.jet} joins your fleet!`;
  }
  // Early ranks (still on T-38 Talon)
  return `Congratulations, ${rank.title}! Keep training to unlock new jets!`;
}

// Get unlocks for a rank change - only shows craft when it actually changes
function getUnlocksForRank(oldRank: Rank, newRank: Rank): string[] {
  const unlocks: string[] = [];

  // Check if craft changed
  if (newRank.jet !== oldRank.jet) {
    unlocks.push(`${newRank.jetIcon} ${newRank.jet}`);
  }

  // Crossing into a new career phase earns its badge
  if (newRank.era !== oldRank.era) {
    const badge = ERA_BADGES[newRank.era];
    if (badge) {
      unlocks.push(badge);
    }
  }

  // Top of the whole ladder
  if (newRank.level === FINAL_LEVEL) {
    unlocks.push('🏆 Cosmic Legend Badge');
    unlocks.push('👑 Complete Fleet Mastery');
  }

  return unlocks;
}
