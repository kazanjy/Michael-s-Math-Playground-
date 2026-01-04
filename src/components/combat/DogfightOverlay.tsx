import { motion, AnimatePresence } from 'framer-motion';
import type { DogfightResult } from '../../types';
import { getResourceIcon } from '../../lib/jetResources';

interface DogfightOverlayProps {
  result: DogfightResult | null;
  onComplete: () => void;
}

export function DogfightOverlay({ result, onComplete }: DogfightOverlayProps) {
  if (!result || !result.occurred) return null;

  // Auto-dismiss after animation
  setTimeout(onComplete, 3000);

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
          className={`p-8 rounded-3xl text-center ${
            result.victory
              ? 'bg-gradient-to-b from-emerald-600 to-emerald-800'
              : 'bg-gradient-to-b from-orange-600 to-red-800'
          }`}
        >
          {/* Enemy jet flying across */}
          <motion.div
            initial={{ x: -200, opacity: 0 }}
            animate={{ x: 200, opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.5, times: [0, 0.2, 0.8, 1] }}
            className="text-6xl mb-4"
          >
            ✈️
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-white mb-2"
          >
            ⚔️ DOGFIGHT! ⚔️
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-lg text-white/80 mb-4"
          >
            Enemy {result.enemyType} engaged!
          </motion.p>

          {/* Resources used */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex justify-center gap-4 mb-4"
          >
            {result.missilesUsed > 0 && (
              <div className="text-white">
                {getResourceIcon('missiles')} -{result.missilesUsed}
              </div>
            )}
            {result.bulletsUsed > 0 && (
              <div className="text-white">
                {getResourceIcon('bullets')} -{result.bulletsUsed}
              </div>
            )}
            {result.flaresUsed > 0 && (
              <div className="text-white">
                {getResourceIcon('flares')} -{result.flaresUsed}
              </div>
            )}
            {result.chaffUsed > 0 && (
              <div className="text-white">
                {getResourceIcon('chaff')} -{result.chaffUsed}
              </div>
            )}
          </motion.div>

          {/* Result */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1, type: 'spring' }}
            className={`text-3xl font-bold ${
              result.victory ? 'text-amber-300' : 'text-red-300'
            }`}
          >
            {result.victory ? (
              <>🎯 VICTORY!</>
            ) : (
              <>
                💥 TOOK DAMAGE!
                <div className="text-lg mt-2">-{result.xpLost} XP</div>
              </>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
