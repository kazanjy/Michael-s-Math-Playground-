import { motion, AnimatePresence } from 'framer-motion';
import type { DogfightResult } from '../../types';
import { getResourceIcon } from '../../lib/jetResources';

interface DogfightOverlayProps {
  result: DogfightResult | null;
  onComplete: () => void;
}

export function DogfightOverlay({ result, onComplete }: DogfightOverlayProps) {
  if (!result || !result.occurred) return null;

  // Check if any resources were used
  const hasWeapon = result.missilesUsed > 0 || result.bulletsUsed > 0;
  const hasCountermeasure = result.flaresUsed > 0 || result.chaffUsed > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 12 }}
          className={`relative w-[400px] h-[400px] rounded-3xl overflow-hidden ${
            result.victory
              ? 'bg-gradient-to-b from-sky-700 via-sky-800 to-slate-900'
              : 'bg-gradient-to-b from-orange-700 via-red-800 to-slate-900'
          }`}
        >
          {/* Sky background with clouds */}
          <div className="absolute inset-0">
            <motion.div
              animate={{ x: [-50, 50] }}
              transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
              className="absolute top-8 left-4 text-4xl opacity-30"
            >
              ☁️
            </motion.div>
            <motion.div
              animate={{ x: [30, -30] }}
              transition={{ duration: 2.5, repeat: Infinity, repeatType: 'reverse' }}
              className="absolute top-16 right-8 text-3xl opacity-20"
            >
              ☁️
            </motion.div>
            <motion.div
              animate={{ x: [-20, 40] }}
              transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
              className="absolute bottom-24 left-12 text-2xl opacity-25"
            >
              ☁️
            </motion.div>
          </div>

          {/* Combat arena - planes chasing each other in a circle */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Player's jet (chasing) */}
            <motion.div
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="absolute"
              style={{ width: 200, height: 200 }}
            >
              <motion.div
                className="absolute text-5xl"
                style={{
                  left: '50%',
                  top: 0,
                  transform: 'translateX(-50%) rotate(90deg)',
                }}
              >
                🛩️
              </motion.div>
            </motion.div>

            {/* Enemy jet (being chased) */}
            <motion.div
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="absolute"
              style={{ width: 200, height: 200 }}
            >
              <motion.div
                className="absolute text-5xl"
                style={{
                  left: '50%',
                  bottom: 0,
                  transform: 'translateX(-50%) rotate(-90deg) scaleX(-1)',
                }}
              >
                ✈️
              </motion.div>
            </motion.div>

            {/* Missile/bullet trail effect */}
            {hasWeapon && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 0.5 }}
                className="absolute text-2xl"
                style={{ top: '30%', left: '55%' }}
              >
                💥
              </motion.div>
            )}

            {/* Flare/chaff effect */}
            {hasCountermeasure && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.4, repeat: Infinity, repeatDelay: 0.3 }}
                className="absolute text-xl"
                style={{ bottom: '35%', right: '30%' }}
              >
                ✨
              </motion.div>
            )}
          </div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="absolute top-4 left-0 right-0 text-center"
          >
            <h2 className="text-2xl font-bold text-white drop-shadow-lg">
              {result.trigger === 'slow_answer'
                ? '🐢 Slow Answer Dogfight! 🐢'
                : '❌ Wrong Answer Dogfight! ❌'}
            </h2>
            <p className="text-sm text-white/80 mt-1">
              vs {result.enemyType}
            </p>
          </motion.div>

          {/* Resources used panel */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 rounded-xl p-3 backdrop-blur-sm"
          >
            <div className="text-xs text-white/70 mb-2 font-medium">RESOURCES USED</div>
            <div className="space-y-2">
              {result.missilesUsed > 0 && (
                <div className="flex items-center gap-2 text-red-400">
                  <span className="text-xl">{getResourceIcon('missiles')}</span>
                  <span className="font-bold">-{result.missilesUsed}</span>
                </div>
              )}
              {result.bulletsUsed > 0 && (
                <div className="flex items-center gap-2 text-amber-400">
                  <span className="text-xl">{getResourceIcon('bullets')}</span>
                  <span className="font-bold">-{result.bulletsUsed}</span>
                </div>
              )}
              {result.flaresUsed > 0 && (
                <div className="flex items-center gap-2 text-orange-400">
                  <span className="text-xl">{getResourceIcon('flares')}</span>
                  <span className="font-bold">-{result.flaresUsed}</span>
                </div>
              )}
              {result.chaffUsed > 0 && (
                <div className="flex items-center gap-2 text-cyan-400">
                  <span className="text-xl">{getResourceIcon('chaff')}</span>
                  <span className="font-bold">-{result.chaffUsed}</span>
                </div>
              )}
              {!hasWeapon && (
                <div className="text-red-400 text-xs">No weapons!</div>
              )}
              {!hasCountermeasure && (
                <div className="text-red-400 text-xs">No countermeasures!</div>
              )}
            </div>
          </motion.div>

          {/* Result banner at bottom */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, type: 'spring' }}
            className="absolute bottom-4 left-4 right-4"
          >
            <div
              className={`py-3 rounded-xl text-center mb-2 ${
                result.victory
                  ? 'bg-emerald-500/80'
                  : 'bg-red-500/80'
              }`}
            >
              {result.victory ? (
                <div className="text-2xl font-bold text-white drop-shadow">
                  🎯 VICTORY! 🎯
                </div>
              ) : (
                <div>
                  <div className="text-2xl font-bold text-white drop-shadow">
                    💥 TOOK DAMAGE!
                  </div>
                  <div className="text-lg text-white/90 font-bold mt-1">
                    -{result.xpLost} XP
                  </div>
                </div>
              )}
            </div>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              onClick={onComplete}
              className="w-full py-3 bg-white/20 hover:bg-white/30 active:bg-white/40 rounded-xl text-white font-bold text-lg transition-colors"
            >
              Continue
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
