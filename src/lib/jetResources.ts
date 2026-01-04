import type { JetResources, DogfightResult, SessionResourceStats } from '../types';
import { RESOURCE_CONFIG } from '../types';

// Local storage key for jet resources
const JET_RESOURCES_KEY = 'math_playground_jet_resources';

// Enemy jet types for dogfights
const ENEMY_JETS = [
  'MiG-21 Fishbed',
  'MiG-29 Fulcrum',
  'Su-27 Flanker',
  'Su-35 Super Flanker',
  'J-10 Firebird',
];

// Get jet resources for a child
export function getJetResources(childId: string): JetResources {
  const stored = localStorage.getItem(`${JET_RESOURCES_KEY}_${childId}`);
  if (stored) {
    return JSON.parse(stored);
  }
  // Default starting resources
  return {
    missiles: 2,
    bullets: 20,
    flares: 3,
    chaff: 3,
  };
}

// Save jet resources for a child
export function saveJetResources(childId: string, resources: JetResources): void {
  localStorage.setItem(`${JET_RESOURCES_KEY}_${childId}`, JSON.stringify(resources));
}

// Calculate resources earned from XP
export function calculateResourcesEarned(
  previousSessionXp: number,
  newXpEarned: number
): { missiles: number; bullets: number; flares: number; chaff: number } {
  const totalXpBefore = previousSessionXp;
  const totalXpAfter = previousSessionXp + newXpEarned;

  // Calculate how many thresholds were crossed
  const missilesBefore = Math.floor(totalXpBefore / RESOURCE_CONFIG.xpPerMissile);
  const missilesAfter = Math.floor(totalXpAfter / RESOURCE_CONFIG.xpPerMissile);

  const bulletPacksBefore = Math.floor(totalXpBefore / RESOURCE_CONFIG.xpPerBulletPack);
  const bulletPacksAfter = Math.floor(totalXpAfter / RESOURCE_CONFIG.xpPerBulletPack);

  const flaresBefore = Math.floor(totalXpBefore / RESOURCE_CONFIG.xpPerFlare);
  const flaresAfter = Math.floor(totalXpAfter / RESOURCE_CONFIG.xpPerFlare);

  const chaffBefore = Math.floor(totalXpBefore / RESOURCE_CONFIG.xpPerChaff);
  const chaffAfter = Math.floor(totalXpAfter / RESOURCE_CONFIG.xpPerChaff);

  return {
    missiles: missilesAfter - missilesBefore,
    bullets: (bulletPacksAfter - bulletPacksBefore) * RESOURCE_CONFIG.bulletsPerPack,
    flares: flaresAfter - flaresBefore,
    chaff: chaffAfter - chaffBefore,
  };
}

// Process a dogfight encounter
export function processDogfight(
  resources: JetResources
): { updatedResources: JetResources; result: DogfightResult } {
  const enemyType = ENEMY_JETS[Math.floor(Math.random() * ENEMY_JETS.length)];

  let xpLost = 0;
  let missilesUsed = 0;
  let bulletsUsed = 0;
  let flaresUsed = 0;
  let chaffUsed = 0;

  const updatedResources = { ...resources };

  // Use missiles (or lose XP)
  if (updatedResources.missiles >= RESOURCE_CONFIG.missilesPerFight) {
    missilesUsed = RESOURCE_CONFIG.missilesPerFight;
    updatedResources.missiles -= missilesUsed;
  } else {
    xpLost += RESOURCE_CONFIG.xpLossNoMissile;
  }

  // Use bullets (or lose XP)
  if (updatedResources.bullets >= RESOURCE_CONFIG.bulletsPerFight) {
    bulletsUsed = RESOURCE_CONFIG.bulletsPerFight;
    updatedResources.bullets -= bulletsUsed;
  } else {
    xpLost += RESOURCE_CONFIG.xpLossNoBullets;
  }

  // Use flares (or lose XP)
  if (updatedResources.flares >= RESOURCE_CONFIG.flaresPerFight) {
    flaresUsed = RESOURCE_CONFIG.flaresPerFight;
    updatedResources.flares -= flaresUsed;
  } else {
    xpLost += RESOURCE_CONFIG.xpLossNoFlare;
  }

  // Use chaff (or lose XP)
  if (updatedResources.chaff >= RESOURCE_CONFIG.chaffPerFight) {
    chaffUsed = RESOURCE_CONFIG.chaffPerFight;
    updatedResources.chaff -= chaffUsed;
  } else {
    xpLost += RESOURCE_CONFIG.xpLossNoChaff;
  }

  // Victory if we had all resources needed
  const victory = xpLost === 0;

  return {
    updatedResources,
    result: {
      occurred: true,
      enemyType,
      missilesUsed,
      bulletsUsed,
      flaresUsed,
      chaffUsed,
      xpLost,
      victory,
    },
  };
}

// Check if a dogfight should occur (every N correct answers)
export function shouldTriggerDogfight(correctAnswerCount: number): boolean {
  return correctAnswerCount > 0 && correctAnswerCount % RESOURCE_CONFIG.dogfightFrequency === 0;
}

// Add resources to current supply
export function addResources(
  current: JetResources,
  earned: { missiles: number; bullets: number; flares: number; chaff: number }
): JetResources {
  return {
    missiles: current.missiles + earned.missiles,
    bullets: current.bullets + earned.bullets,
    flares: current.flares + earned.flares,
    chaff: current.chaff + earned.chaff,
  };
}

// Create empty session resource stats
export function createEmptyResourceStats(): SessionResourceStats {
  return {
    missilesEarned: 0,
    bulletsEarned: 0,
    flaresEarned: 0,
    chaffEarned: 0,
    missilesUsed: 0,
    bulletsUsed: 0,
    flaresUsed: 0,
    chaffUsed: 0,
    xpLostToDogfights: 0,
    dogfightsWon: 0,
    dogfightsLost: 0,
  };
}

// Get resource icon
export function getResourceIcon(type: 'missiles' | 'bullets' | 'flares' | 'chaff'): string {
  switch (type) {
    case 'missiles': return '🚀';
    case 'bullets': return '🔫';
    case 'flares': return '🔥';
    case 'chaff': return '✨';
  }
}
