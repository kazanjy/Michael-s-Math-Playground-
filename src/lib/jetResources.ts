import type { JetResources, DogfightResult, SessionResourceStats, DogfightTrigger, Difficulty } from '../types';
import { RESOURCE_CONFIG, DOGFIGHT_XP_COST, DOGFIGHT_RESOURCE_USAGE } from '../types';

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
// Uses missile OR bullets (prefers missile), and flare OR chaff (prefers flare)
// Resource usage and XP cost scale with difficulty
export function processDogfight(
  resources: JetResources,
  trigger: DogfightTrigger,
  responseTimeMs?: number,
  difficulty: Difficulty = 'medium'
): { updatedResources: JetResources; result: DogfightResult } {
  const enemyType = ENEMY_JETS[Math.floor(Math.random() * ENEMY_JETS.length)];
  const resourceUsage = DOGFIGHT_RESOURCE_USAGE[difficulty];

  // Base XP cost for dogfight (always applied)
  let xpLost = DOGFIGHT_XP_COST[difficulty];
  let missilesUsed = 0;
  let bulletsUsed = 0;
  let flaresUsed = 0;
  let chaffUsed = 0;

  const updatedResources = { ...resources };

  // Use missile OR bullets (prefer missile)
  if (updatedResources.missiles >= resourceUsage.missiles) {
    missilesUsed = resourceUsage.missiles;
    updatedResources.missiles -= missilesUsed;
  } else if (updatedResources.bullets >= resourceUsage.bullets) {
    bulletsUsed = resourceUsage.bullets;
    updatedResources.bullets -= bulletsUsed;
  } else {
    // No offensive weapons - lose additional XP
    xpLost += RESOURCE_CONFIG.xpLossNoWeapon;
  }

  // Use flare OR chaff (prefer flare)
  if (updatedResources.flares >= resourceUsage.flares) {
    flaresUsed = resourceUsage.flares;
    updatedResources.flares -= flaresUsed;
  } else if (updatedResources.chaff >= resourceUsage.chaff) {
    chaffUsed = resourceUsage.chaff;
    updatedResources.chaff -= chaffUsed;
  } else {
    // No countermeasures - lose additional XP
    xpLost += RESOURCE_CONFIG.xpLossNoCountermeasure;
  }

  // Victory if we had all needed resources (only extra XP loss is from difficulty)
  const hasWeapon = missilesUsed > 0 || bulletsUsed > 0;
  const hasCountermeasure = flaresUsed > 0 || chaffUsed > 0;
  const victory = hasWeapon && hasCountermeasure;

  return {
    updatedResources,
    result: {
      occurred: true,
      trigger,
      enemyType,
      missilesUsed,
      bulletsUsed,
      flaresUsed,
      chaffUsed,
      xpLost,
      victory,
      responseTimeMs,
    },
  };
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
