import { motion } from 'framer-motion';
import { useMemo } from 'react';

// Individual dogfight - two jets chasing each other in a circular pattern
function Dogfight({
  x,
  y,
  size,
  duration,
  delay,
}: {
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {/* Player jet (chasing) */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration,
          repeat: Infinity,
          ease: 'linear',
          delay,
        }}
        style={{ width: size, height: size }}
        className="absolute"
      >
        <div
          className="absolute text-2xl"
          style={{
            left: '50%',
            top: 0,
            transform: 'translateX(-50%) rotate(90deg)',
          }}
        >
          🛩️
        </div>
      </motion.div>

      {/* Enemy jet (being chased) */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration,
          repeat: Infinity,
          ease: 'linear',
          delay,
        }}
        style={{ width: size, height: size }}
        className="absolute"
      >
        <div
          className="absolute text-2xl"
          style={{
            left: '50%',
            bottom: 0,
            transform: 'translateX(-50%) rotate(-90deg) scaleX(-1)',
          }}
        >
          ✈️
        </div>
      </motion.div>

      {/* Missile being fired */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{
          opacity: [0, 1, 1, 0],
          scale: [0.5, 1, 1, 0.5],
          rotate: 360,
        }}
        transition={{
          duration: duration * 0.8,
          repeat: Infinity,
          delay: delay + 0.5,
        }}
        style={{ width: size * 0.6, height: size * 0.6 }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 text-lg">
          🚀
        </div>
      </motion.div>

      {/* Explosion effect */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{
          opacity: [0, 0, 1, 0],
          scale: [0, 0, 1.5, 2],
        }}
        transition={{
          duration: duration,
          repeat: Infinity,
          delay: delay + duration * 0.4,
        }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl"
      >
        💥
      </motion.div>
    </div>
  );
}

// Jet flying across the screen
function FlyingJet({
  emoji,
  startY,
  duration,
  delay,
  direction,
}: {
  emoji: string;
  startY: number;
  duration: number;
  delay: number;
  direction: 'left' | 'right';
}) {
  return (
    <motion.div
      initial={{
        x: direction === 'right' ? '-10vw' : '110vw',
        y: `${startY}vh`,
      }}
      animate={{
        x: direction === 'right' ? '110vw' : '-10vw',
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'linear',
        delay,
        repeatDelay: 2,
      }}
      className="absolute text-3xl"
      style={{
        transform: direction === 'left' ? 'scaleX(-1)' : undefined,
      }}
    >
      {emoji}
      {/* Contrail */}
      <div
        className="absolute top-1/2 -translate-y-1/2 w-16 h-0.5 bg-gradient-to-l from-white/40 to-transparent"
        style={{
          right: direction === 'right' ? '100%' : undefined,
          left: direction === 'left' ? '100%' : undefined,
          transform: direction === 'left' ? 'scaleX(-1)' : undefined,
        }}
      />
    </motion.div>
  );
}

// Flare burst effect
function FlareBurst({ x, y, delay }: { x: number; y: number; delay: number }) {
  const flares = useMemo(
    () =>
      Array.from({ length: 6 }).map((_, i) => ({
        angle: (i * 60) + Math.random() * 30,
        distance: 30 + Math.random() * 20,
      })),
    []
  );

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={{
        duration: 2,
        repeat: Infinity,
        delay,
        repeatDelay: 5,
      }}
    >
      {flares.map((flare, i) => (
        <motion.div
          key={i}
          initial={{ x: 0, y: 0, opacity: 1 }}
          animate={{
            x: Math.cos((flare.angle * Math.PI) / 180) * flare.distance,
            y: Math.sin((flare.angle * Math.PI) / 180) * flare.distance,
            opacity: 0,
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: delay + i * 0.1,
            repeatDelay: 5,
          }}
          className="absolute text-xl"
        >
          🔥
        </motion.div>
      ))}
    </motion.div>
  );
}

// Chaff cloud
function ChaffCloud({ x, y, delay }: { x: number; y: number; delay: number }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{
        opacity: [0, 0.8, 0.8, 0],
        scale: [0.5, 1.5, 2, 2.5],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        delay,
        repeatDelay: 7,
      }}
    >
      <div className="relative">
        <span className="text-2xl">✨</span>
        <span className="absolute -top-2 -left-2 text-xl">✨</span>
        <span className="absolute -top-1 left-4 text-lg">✨</span>
        <span className="absolute top-3 left-1 text-xl">✨</span>
      </div>
    </motion.div>
  );
}

// Drifting cloud
function Cloud({
  startX,
  y,
  size,
  duration,
  delay,
}: {
  startX: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ x: `${startX}vw`, y: `${y}vh` }}
      animate={{ x: `${startX + 30}vw` }}
      transition={{
        duration,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut',
        delay,
      }}
      className="absolute opacity-30"
      style={{ fontSize: size }}
    >
      ☁️
    </motion.div>
  );
}

// Missile chase sequence
function MissileChase({
  startY,
  delay,
}: {
  startY: number;
  delay: number;
}) {
  return (
    <>
      {/* Fleeing jet */}
      <motion.div
        initial={{ x: '-5vw', y: `${startY}vh` }}
        animate={{ x: '110vw' }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'linear',
          delay,
          repeatDelay: 10,
        }}
        className="absolute text-3xl"
      >
        ✈️
        {/* Deploying flares */}
        <motion.div
          animate={{ opacity: [1, 0], y: [0, 20], x: [-10, -30] }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatDelay: 0.3,
          }}
          className="absolute -left-4 top-0 text-lg"
        >
          🔥
        </motion.div>
      </motion.div>

      {/* Chasing missile */}
      <motion.div
        initial={{ x: '-15vw', y: `${startY}vh` }}
        animate={{ x: '105vw' }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: 'linear',
          delay: delay + 0.5,
          repeatDelay: 10.5,
        }}
        className="absolute text-2xl"
      >
        🚀
        {/* Smoke trail */}
        <motion.div
          className="absolute right-full top-1/2 -translate-y-1/2 flex gap-1"
        >
          <span className="text-xs opacity-60">💨</span>
          <span className="text-xs opacity-40">💨</span>
          <span className="text-xs opacity-20">💨</span>
        </motion.div>
      </motion.div>
    </>
  );
}

// Formation flight
function Formation({ y, delay }: { y: number; delay: number }) {
  return (
    <motion.div
      initial={{ x: '110vw', y: `${y}vh` }}
      animate={{ x: '-20vw' }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: 'linear',
        delay,
        repeatDelay: 15,
      }}
      className="absolute flex items-center"
      style={{ transform: 'scaleX(-1)' }}
    >
      {/* Lead jet */}
      <span className="text-3xl">🛩️</span>
      {/* Wingmen */}
      <span className="text-2xl -ml-2 -mt-8">🛩️</span>
      <span className="text-2xl -ml-6 mt-8">🛩️</span>
      <span className="text-xl -ml-4 -mt-14">🛩️</span>
      <span className="text-xl -ml-8 mt-14">🛩️</span>
    </motion.div>
  );
}

export function DogfightBackground() {
  // Generate random dogfights
  const dogfights = useMemo(
    () => [
      { x: 15, y: 20, size: 80, duration: 2, delay: 0 },
      { x: 75, y: 60, size: 100, duration: 2.5, delay: 1 },
      { x: 50, y: 35, size: 90, duration: 1.8, delay: 0.5 },
      { x: 25, y: 70, size: 70, duration: 2.2, delay: 1.5 },
      { x: 85, y: 25, size: 85, duration: 2.3, delay: 0.8 },
    ],
    []
  );

  const flyingJets = useMemo(
    () => [
      { emoji: '🛩️', startY: 15, duration: 12, delay: 0, direction: 'right' as const },
      { emoji: '✈️', startY: 45, duration: 10, delay: 3, direction: 'left' as const },
      { emoji: '🛩️', startY: 75, duration: 14, delay: 6, direction: 'right' as const },
      { emoji: '✈️', startY: 30, duration: 11, delay: 8, direction: 'left' as const },
      { emoji: '🛩️', startY: 85, duration: 9, delay: 2, direction: 'right' as const },
    ],
    []
  );

  const flareBursts = useMemo(
    () => [
      { x: 30, y: 40, delay: 2 },
      { x: 70, y: 20, delay: 5 },
      { x: 45, y: 75, delay: 8 },
      { x: 80, y: 50, delay: 11 },
    ],
    []
  );

  const chaffClouds = useMemo(
    () => [
      { x: 20, y: 55, delay: 3 },
      { x: 60, y: 30, delay: 7 },
      { x: 40, y: 80, delay: 10 },
    ],
    []
  );

  const clouds = useMemo(
    () => [
      { startX: 5, y: 10, size: 48, duration: 20, delay: 0 },
      { startX: 30, y: 50, size: 36, duration: 25, delay: 5 },
      { startX: 60, y: 25, size: 42, duration: 22, delay: 3 },
      { startX: 15, y: 70, size: 40, duration: 18, delay: 8 },
      { startX: 75, y: 85, size: 32, duration: 24, delay: 2 },
    ],
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Clouds (back layer) */}
      {clouds.map((cloud, i) => (
        <Cloud key={`cloud-${i}`} {...cloud} />
      ))}

      {/* Circular dogfights */}
      {dogfights.map((fight, i) => (
        <Dogfight key={`dogfight-${i}`} {...fight} />
      ))}

      {/* Flying jets */}
      {flyingJets.map((jet, i) => (
        <FlyingJet key={`jet-${i}`} {...jet} />
      ))}

      {/* Flare bursts */}
      {flareBursts.map((flare, i) => (
        <FlareBurst key={`flare-${i}`} {...flare} />
      ))}

      {/* Chaff clouds */}
      {chaffClouds.map((chaff, i) => (
        <ChaffCloud key={`chaff-${i}`} {...chaff} />
      ))}

      {/* Missile chases */}
      <MissileChase startY={55} delay={4} />
      <MissileChase startY={20} delay={12} />

      {/* Formation flight */}
      <Formation y={65} delay={5} />
    </div>
  );
}
