import { createDefaultSessionConfig } from '../types';
import type { SessionConfig } from '../types';

// Persistence for the mission setup screen. This lives outside the page
// components so both Home and Summary can reach it without turning either
// into a mixed component/utility module.

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
const MAX_HISTORY = 20;

// The config the mission screen opens with: whatever was played last.
export function loadCustomConfig(): SessionConfig {
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

// Call this for every route into a mission - hand-tuned or replayed from
// history - so the next round starts from what was actually just played.
export function saveCustomConfig(config: SessionConfig): void {
  localStorage.setItem(CUSTOM_CONFIG_KEY, JSON.stringify(config));
}

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

export function saveMissionToHistory(mission: Omit<MissionHistory, 'id' | 'timestamp'>): void {
  const history = loadMissionHistory();
  const newMission: MissionHistory = {
    ...mission,
    id: `mission_${Date.now()}`,
    timestamp: Date.now(),
  };
  history.unshift(newMission);
  if (history.length > MAX_HISTORY) {
    history.length = MAX_HISTORY;
  }
  localStorage.setItem(MISSION_HISTORY_KEY, JSON.stringify(history));
}
