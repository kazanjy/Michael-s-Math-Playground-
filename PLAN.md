# Michael's Math Dogfight - Implementation Plan

## Overview

A web-based math practice app with spaced repetition for an 8-year-old, featuring a jet fighter theme, XP/leveling system, and parent dashboard.

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | React + TypeScript | Component-based, great ecosystem, type safety |
| **Styling** | Tailwind CSS | Rapid prototyping, easy theming |
| **Animations** | Framer Motion | Smooth, declarative animations |
| **Sound** | Howler.js | Simple, reliable audio |
| **Backend** | Supabase | Free tier, magic link auth built-in, real-time DB |
| **Build** | Vite | Fast dev server, quick builds |

---

## Core Features

### 1. Authentication & Users

- **Magic link login** via email (Supabase Auth)
- **Multiple profiles** per device/account (for siblings)
- **Profile switching** without re-login
- **Parent vs Child** distinction (same account, different views)

### 2. Math Operations

#### Multiplication
- Primary numbers: 1-12 (multi-select)
- Multipliers: 1-5, 6-10, 11-15, 16-20 (multi-select ranges)
- Display: `7 × 8 = ?`

#### Division
- Same configuration as multiplication
- Only exact division (no remainders)
- Display: `56 ÷ 7 = ?` (user enters 8)

#### Addition
- Configurable digit ranges for both operands:
  - Single digit (1-9)
  - Double digit (10-99)
  - Triple digit (100-999)
- Display: `47 + 86 = ?`

#### Subtraction
- Same configuration as addition
- Always positive results (larger - smaller)
- Display: `133 - 47 = ?`

### 3. Session Configuration

#### Quick Start Presets
| Preset | Operations | Config |
|--------|------------|--------|
| **Easy** | Multiplication | 1-5 tables, ×1-5 |
| **Medium** | Multiplication | 1-10 tables, ×1-10 |
| **Hard** | Multiplication | 6-12 tables, ×6-12 |
| **Custom** | Any | Full configuration |

#### Session Limits
- **Question count**: 10, 20, 30, 50, custom
- **Time limit**: 2, 5, 10, 15 minutes
- Time stops immediately when limit reached

#### Operation Selection
- Toggle on/off: Multiplication, Division, Addition, Subtraction
- At least one must be selected

### 4. Spaced Repetition System

#### Fact Tracking
- Each fact tracked independently (7×8 ≠ 8×7)
- Stored per user in database

#### Response Time Thresholds
| Speed | Classification | Repetition Weight |
|-------|----------------|-------------------|
| < 2 sec | Mastered | Show rarely (weight: 0.25) |
| 2-5 sec | Learning | Show occasionally (weight: 1.0) |
| > 5 sec | Needs work | Show frequently (weight: 2.0) |

#### Wrong Answer Handling
- Same weight as slow answer (needs work)
- Immediately retry until correct
- Show "Try again!" message
- After 3 fails: show visual hint (grouped dots/objects)
- Prioritize in next session

### 5. Calculator-Style Input

```
┌─────────────────────────┐
│                     42  │  ← Answer display
├───────┬───────┬─────────┤
│   1   │   2   │    3    │
├───────┼───────┼─────────┤
│   4   │   5   │    6    │
├───────┼───────┼─────────┤
│   7   │   8   │    9    │
├───────┼───────┼─────────┤
│  DEL  │   0   │  ENTER  │
└───────┴───────┴─────────┘
```

- Large touch-friendly buttons
- Keyboard input also supported (desktop)
- Clear/backspace functionality

### 6. XP & Leveling System

#### XP Earnings
| Action | XP |
|--------|-----|
| Correct answer (base) | 10 XP |
| Speed bonus (< 2 sec) | +5 XP |
| Streak bonus (5 in a row) | +10 XP |
| Streak bonus (10 in a row) | +25 XP |
| Difficulty bonus (harder facts) | +1-5 XP |

#### Difficulty Scoring
- Multiplication: higher numbers = more XP
  - 2×3 = base XP
  - 7×8 = +3 XP
  - 12×15 = +5 XP
- Similar scaling for other operations

#### Military Ranks (Levels)
| Level | Rank | XP Required |
|-------|------|-------------|
| 1 | Cadet | 0 |
| 2 | Airman | 100 |
| 3 | Corporal | 300 |
| 4 | Sergeant | 600 |
| 5 | Lieutenant | 1,000 |
| 6 | Captain | 1,500 |
| 7 | Major | 2,200 |
| 8 | Colonel | 3,000 |
| 9 | Commander | 4,000 |
| 10 | General | 5,500 |
| 11+ | Ace Pilot ★ | 7,500+ |

#### Unlockables
- **Jets**: New jet designs at each rank
- **Themes**: Color schemes, cockpit styles
- **Titles**: Display badges
- **Avatars**: Pilot characters

### 7. Visual Hints (After 3 Wrong Attempts)

For multiplication (e.g., 7 × 8):
```
✈️ ✈️ ✈️ ✈️ ✈️ ✈️ ✈️ ✈️
✈️ ✈️ ✈️ ✈️ ✈️ ✈️ ✈️ ✈️
✈️ ✈️ ✈️ ✈️ ✈️ ✈️ ✈️ ✈️
✈️ ✈️ ✈️ ✈️ ✈️ ✈️ ✈️ ✈️
✈️ ✈️ ✈️ ✈️ ✈️ ✈️ ✈️ ✈️
✈️ ✈️ ✈️ ✈️ ✈️ ✈️ ✈️ ✈️
✈️ ✈️ ✈️ ✈️ ✈️ ✈️ ✈️ ✈️

"Count the jets! 7 rows of 8"
```

### 8. Sound Effects

| Event | Sound |
|-------|-------|
| Correct answer | Satisfying "ding" / jet whoosh |
| Wrong answer | Gentle "buzz" / engine sputter |
| Streak (5+) | Sonic boom |
| Level up | Fanfare / afterburner ignition |
| Session complete | Victory music |

### 9. Animations (Moderate Level)

- **Correct answer**: Green checkmark, subtle confetti
- **Wrong answer**: Red X, gentle shake
- **Streak**: Flying jets across screen, contrails
- **Level up**: Full-screen celebration, new jet reveal
- **Transitions**: Smooth slide/fade between screens

### 10. Session Summary

End-of-session display:
```
╔═══════════════════════════════════╗
║       MISSION COMPLETE!           ║
╠═══════════════════════════════════╣
║  Questions Answered:    25        ║
║  Correct:               22        ║
║  Accuracy:              88%       ║
║  Average Time:          3.2s      ║
║  Best Streak:           8         ║
║  ─────────────────────────────    ║
║  XP Earned:             +285      ║
║  Total XP:              1,847     ║
║  Rank:                  Captain   ║
║  Progress to Major:     ████░░ 65%║
╚═══════════════════════════════════╝
```

Additional stats:
- Fastest answer
- Most missed fact
- Improvement from last session

### 11. Parent Dashboard

#### Tab: Overview
- Current rank & total XP
- Practice streak (days)
- Total time practiced (this week/month)
- Recent session summaries

#### Tab: Problem Areas
- Facts with lowest mastery scores
- Most frequently missed
- Slowest response times
- Suggested focus areas

#### Tab: Assign Homework
- Select operations
- Set specific number ranges
- Set question count or time
- Due date (optional)
- "Complete homework before free play" toggle

#### Tab: Settings
- Manage profiles
- Adjust XP rates
- Sound on/off
- Animation preferences

### 12. Homework System

When child logs in with pending homework:
```
┌─────────────────────────────────┐
│  📋 HOMEWORK MISSION           │
│                                 │
│  Your commander has assigned:   │
│  • 7s and 8s multiplication    │
│  • 20 questions                │
│                                 │
│  Complete to unlock Free Play!  │
│                                 │
│     [ START MISSION ]          │
└─────────────────────────────────┘
```

---

## Database Schema (Supabase)

```sql
-- Users (extends Supabase auth.users)
profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT,
  is_parent BOOLEAN DEFAULT false,
  created_at TIMESTAMP
)

-- Child profiles (multiple per account)
child_profiles (
  id UUID PRIMARY KEY,
  parent_id UUID REFERENCES profiles,
  name TEXT,
  avatar TEXT,
  current_rank INTEGER DEFAULT 1,
  total_xp INTEGER DEFAULT 0,
  created_at TIMESTAMP
)

-- Fact mastery (spaced repetition data)
fact_mastery (
  id UUID PRIMARY KEY,
  child_id UUID REFERENCES child_profiles,
  operation TEXT, -- 'multiply', 'divide', 'add', 'subtract'
  operand1 INTEGER,
  operand2 INTEGER,
  mastery_score FLOAT DEFAULT 0.5, -- 0 to 1
  times_seen INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  avg_response_time FLOAT,
  last_seen TIMESTAMP,
  updated_at TIMESTAMP
)

-- Session history
sessions (
  id UUID PRIMARY KEY,
  child_id UUID REFERENCES child_profiles,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  questions_count INTEGER,
  correct_count INTEGER,
  xp_earned INTEGER,
  avg_response_time FLOAT,
  best_streak INTEGER,
  session_type TEXT, -- 'free_play', 'homework'
  config JSONB -- stores session configuration
)

-- Individual answers (for detailed analytics)
answers (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES sessions,
  operation TEXT,
  operand1 INTEGER,
  operand2 INTEGER,
  correct_answer INTEGER,
  user_answer INTEGER,
  is_correct BOOLEAN,
  response_time FLOAT,
  attempts INTEGER DEFAULT 1,
  created_at TIMESTAMP
)

-- Homework assignments
homework (
  id UUID PRIMARY KEY,
  child_id UUID REFERENCES child_profiles,
  assigned_by UUID REFERENCES profiles,
  config JSONB, -- operations, ranges, question count
  assigned_at TIMESTAMP,
  due_at TIMESTAMP,
  completed_at TIMESTAMP,
  session_id UUID REFERENCES sessions
)

-- Unlockables
unlockables (
  id UUID PRIMARY KEY,
  name TEXT,
  type TEXT, -- 'jet', 'theme', 'avatar', 'title'
  required_rank INTEGER,
  asset_url TEXT
)

-- User unlocks
user_unlocks (
  child_id UUID REFERENCES child_profiles,
  unlockable_id UUID REFERENCES unlockables,
  unlocked_at TIMESTAMP,
  PRIMARY KEY (child_id, unlockable_id)
)
```

---

## Project Structure

```
michael-math-playground/
├── public/
│   ├── sounds/
│   │   ├── correct.mp3
│   │   ├── wrong.mp3
│   │   ├── streak.mp3
│   │   └── levelup.mp3
│   └── images/
│       ├── jets/
│       └── avatars/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Modal.tsx
│   │   ├── calculator/
│   │   │   ├── Calculator.tsx
│   │   │   ├── NumberPad.tsx
│   │   │   └── Display.tsx
│   │   ├── question/
│   │   │   ├── QuestionCard.tsx
│   │   │   ├── VisualHint.tsx
│   │   │   └── Feedback.tsx
│   │   ├── session/
│   │   │   ├── SessionConfig.tsx
│   │   │   ├── SessionProgress.tsx
│   │   │   └── SessionSummary.tsx
│   │   ├── profile/
│   │   │   ├── ProfileSelector.tsx
│   │   │   ├── RankBadge.tsx
│   │   │   └── XPBar.tsx
│   │   └── parent/
│   │       ├── Dashboard.tsx
│   │       ├── ProblemAreas.tsx
│   │       ├── HomeworkAssigner.tsx
│   │       └── Settings.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useSpacedRepetition.ts
│   │   ├── useXP.ts
│   │   ├── useSound.ts
│   │   └── useTimer.ts
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── questionGenerator.ts
│   │   ├── spacedRepetition.ts
│   │   └── xpCalculator.ts
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── ProfileSelect.tsx
│   │   ├── Home.tsx
│   │   ├── Practice.tsx
│   │   ├── Summary.tsx
│   │   └── Parent.tsx
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── tsconfig.json
```

---

## Implementation Phases

### Phase 1: Foundation (MVP)
1. Project setup (Vite + React + TypeScript + Tailwind)
2. Supabase setup & authentication (magic link)
3. Basic profile system
4. Calculator input component
5. Multiplication questions (basic, no spaced repetition yet)
6. Simple correct/wrong feedback
7. Basic session flow (start → questions → summary)

### Phase 2: Core Learning
1. Spaced repetition algorithm
2. Fact mastery tracking
3. Division support
4. Wrong answer retry + visual hints
5. Session configuration (presets + custom)
6. Time-based and question-count modes

### Phase 3: Gamification
1. XP system implementation
2. Rank progression
3. Streak tracking & bonuses
4. Sound effects
5. Animations (correct/wrong/streak)
6. Level-up celebrations

### Phase 4: Extended Operations
1. Addition with configurable digit ranges
2. Subtraction with configurable digit ranges
3. Mixed operation sessions
4. Difficulty-based XP bonuses

### Phase 5: Parent Features
1. Parent dashboard (overview tab)
2. Problem areas analysis
3. Homework assignment system
4. Homework-before-play enforcement

### Phase 6: Polish & Unlockables
1. Jet fighter theme assets
2. Unlockable jets & themes
3. Avatar system
4. Session statistics enhancements
5. Responsive design refinement
6. Performance optimization

---

## Key Algorithms

### Spaced Repetition Question Selection

```typescript
function selectNextQuestion(facts: FactMastery[], config: SessionConfig): Question {
  // Weight facts by mastery (lower mastery = higher weight)
  const weightedFacts = facts
    .filter(f => matchesConfig(f, config))
    .map(f => ({
      fact: f,
      weight: calculateWeight(f)
    }));

  // Random weighted selection
  return weightedRandomSelect(weightedFacts);
}

function calculateWeight(fact: FactMastery): number {
  const baseWeight = 1 - fact.masteryScore; // 0-1, lower mastery = higher
  const recencyBonus = getRecencyBonus(fact.lastSeen); // boost if not seen recently
  const errorBonus = fact.timesCorrect / fact.timesSeen < 0.7 ? 0.5 : 0; // boost if error-prone

  return baseWeight + recencyBonus + errorBonus;
}

function updateMastery(fact: FactMastery, responseTime: number, correct: boolean): void {
  fact.timesSeen++;
  if (correct) fact.timesCorrect++;

  // Calculate performance score
  let performanceScore: number;
  if (!correct) {
    performanceScore = 0;
  } else if (responseTime < 2000) {
    performanceScore = 1; // mastered
  } else if (responseTime < 5000) {
    performanceScore = 0.6; // learning
  } else {
    performanceScore = 0.3; // needs work
  }

  // Exponential moving average
  const alpha = 0.3; // learning rate
  fact.masteryScore = alpha * performanceScore + (1 - alpha) * fact.masteryScore;
}
```

### XP Calculation

```typescript
function calculateXP(
  correct: boolean,
  responseTime: number,
  streak: number,
  difficulty: number
): number {
  if (!correct) return 0;

  let xp = 10; // base XP

  // Speed bonus
  if (responseTime < 2000) xp += 5;

  // Streak bonus
  if (streak >= 10) xp += 25;
  else if (streak >= 5) xp += 10;

  // Difficulty bonus (1-5 based on operand sizes)
  xp += difficulty;

  return xp;
}
```

---

## Assets Needed

### Sound Effects
- [ ] Correct answer (jet whoosh / ding)
- [ ] Wrong answer (engine sputter)
- [ ] Streak milestone (sonic boom)
- [ ] Level up (afterburner fanfare)
- [ ] Session complete (victory tune)
- [ ] Button click (subtle)

### Images
- [ ] Jet designs (10+ for unlockables)
- [ ] Pilot avatars (5+)
- [ ] Rank insignias
- [ ] Background patterns
- [ ] Visual hint elements (mini jets for counting)

### Animations (Framer Motion)
- [ ] Correct answer celebration
- [ ] Wrong answer shake
- [ ] Streak fire trail
- [ ] Level up explosion
- [ ] XP counter increment
- [ ] Progress bar fill

---

## Success Metrics

- **Engagement**: Sessions per week, average session duration
- **Learning**: Mastery score improvement over time
- **Retention**: Streak maintenance, return rate
- **Performance**: Average response time improvement

---

## Future Considerations (Not in Scope Now)

- PWA / offline support
- Mobile apps (React Native)
- Multiplayer races
- Classroom/teacher mode
- More operations (squares, fractions, percentages)
- Custom themes beyond jet fighters
- Leaderboards
- Social features (challenge friends)
