import { supabase, isSupabaseConfigured } from './supabase';
import type { GymnasiumSessionConfig, GymnasiumAnswer } from '../types/gymnasium';

export interface SessionRecord {
  id: string;
  child_id: string;
  theme: string;
  custom_theme?: string;
  grade_level: string;
  mode: string;
  end_mode: string;
  question_count?: number;
  time_limit_minutes?: number;
  total_xp: number;
  correct_count: number;
  incorrect_count: number;
  best_streak: number;
  elapsed_time_ms: number;
  created_at: string;
}

export interface QuestionRecord {
  id: string;
  session_id: string;
  child_id: string;
  question_text: string;
  correct_answer: string;
  user_answer: string;
  is_correct: boolean;
  genre: string;
  explanation: string;
  time_spent_ms: number;
  attempts: number;
  scratchpad_url?: string;
  work_analysis?: WorkAnalysis;
  created_at: string;
}

export interface WorkAnalysis {
  whatYouDidWell: string;
  whereYouWentWrong: string;
  howToFixIt: string;
}

export interface GenreStats {
  genre: string;
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
  avgTimeMs: number;
  recentAvgTimeMs: number;
  trend: 'improving' | 'declining' | 'stable';
}

const DEMO_SESSIONS_KEY = 'math_gym_sessions';
const DEMO_QUESTIONS_KEY = 'math_gym_questions';

export async function uploadScratchpadImage(
  childId: string,
  questionId: string,
  dataUrl: string,
): Promise<string | undefined> {
  if (!isSupabaseConfigured()) {
    return dataUrl;
  }

  try {
    const base64 = dataUrl.split(',')[1];
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const path = `${childId}/${questionId}.png`;

    const { error } = await supabase.storage
      .from('scratchpads')
      .upload(path, bytes, { contentType: 'image/png', upsert: true });

    if (error) {
      console.error('Scratchpad upload error:', error);
      return undefined;
    }

    const { data } = supabase.storage.from('scratchpads').getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    console.error('Scratchpad upload failed:', err);
    return undefined;
  }
}

export async function saveSession(
  childId: string,
  config: GymnasiumSessionConfig,
  answers: GymnasiumAnswer[],
  totalXp: number,
  elapsedTimeMs: number,
  bestStreak: number,
  scratchpadImages: Map<string, string>,
  workAnalyses?: Map<string, WorkAnalysis>,
): Promise<string | null> {
  const correctCount = answers.filter(a => a.isCorrect).length;
  const incorrectCount = answers.filter(a => !a.isCorrect).length;

  if (!isSupabaseConfigured()) {
    return saveDemoSession(childId, config, answers, totalXp, elapsedTimeMs, bestStreak, correctCount, incorrectCount, scratchpadImages, workAnalyses);
  }

  try {
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        child_id: childId,
        theme: config.theme,
        custom_theme: config.customTheme,
        grade_level: config.gradeLevel,
        mode: config.mode,
        end_mode: config.endMode,
        question_count: config.questionCount,
        time_limit_minutes: config.timeLimitMinutes,
        total_xp: totalXp,
        correct_count: correctCount,
        incorrect_count: incorrectCount,
        best_streak: bestStreak,
        elapsed_time_ms: elapsedTimeMs,
      })
      .select('id')
      .single();

    if (sessionError || !session) {
      console.error('Failed to save session:', sessionError);
      return null;
    }

    const questionRows = await Promise.all(
      answers.map(async (answer) => {
        let scratchpadUrl: string | undefined;
        const imageData = scratchpadImages.get(answer.questionId);
        if (imageData) {
          scratchpadUrl = await uploadScratchpadImage(childId, answer.questionId, imageData);
        }

        return {
          session_id: session.id,
          child_id: childId,
          question_text: answer.question.questionText,
          correct_answer: answer.question.correctAnswer,
          user_answer: answer.userAnswer,
          is_correct: answer.isCorrect,
          genre: answer.question.genre,
          explanation: answer.question.explanation,
          time_spent_ms: answer.timeSpentMs,
          attempts: answer.attempts,
          scratchpad_url: scratchpadUrl,
          work_analysis: workAnalyses?.get(answer.questionId) || null,
        };
      })
    );

    if (questionRows.length > 0) {
      const { error: questionsError } = await supabase
        .from('question_history')
        .insert(questionRows);

      if (questionsError) {
        console.error('Failed to save questions:', questionsError);
      }
    }

    return session.id;
  } catch (err) {
    console.error('Save session failed:', err);
    return null;
  }
}

function saveDemoSession(
  childId: string,
  config: GymnasiumSessionConfig,
  answers: GymnasiumAnswer[],
  totalXp: number,
  elapsedTimeMs: number,
  bestStreak: number,
  correctCount: number,
  incorrectCount: number,
  scratchpadImages: Map<string, string>,
  workAnalyses?: Map<string, WorkAnalysis>,
): string | null {
  const sessionId = crypto.randomUUID();
  const now = new Date().toISOString();

  const session: SessionRecord = {
    id: sessionId,
    child_id: childId,
    theme: config.theme,
    custom_theme: config.customTheme,
    grade_level: config.gradeLevel,
    mode: config.mode,
    end_mode: config.endMode,
    question_count: config.questionCount,
    time_limit_minutes: config.timeLimitMinutes,
    total_xp: totalXp,
    correct_count: correctCount,
    incorrect_count: incorrectCount,
    best_streak: bestStreak,
    elapsed_time_ms: elapsedTimeMs,
    created_at: now,
  };

  const questions: QuestionRecord[] = answers.map(answer => ({
    id: crypto.randomUUID(),
    session_id: sessionId,
    child_id: childId,
    question_text: answer.question.questionText,
    correct_answer: answer.question.correctAnswer,
    user_answer: answer.userAnswer,
    is_correct: answer.isCorrect,
    genre: answer.question.genre,
    explanation: answer.question.explanation,
    time_spent_ms: answer.timeSpentMs,
    attempts: answer.attempts,
    scratchpad_url: scratchpadImages.get(answer.questionId),
    work_analysis: workAnalyses?.get(answer.questionId),
    created_at: now,
  }));

  try {
    const existingSessions: SessionRecord[] = JSON.parse(localStorage.getItem(DEMO_SESSIONS_KEY) || '[]');
    existingSessions.unshift(session);
    localStorage.setItem(DEMO_SESSIONS_KEY, JSON.stringify(existingSessions.slice(0, 100)));

    const existingQuestions: QuestionRecord[] = JSON.parse(localStorage.getItem(DEMO_QUESTIONS_KEY) || '[]');
    existingQuestions.unshift(...questions);
    localStorage.setItem(DEMO_QUESTIONS_KEY, JSON.stringify(existingQuestions.slice(0, 1000)));
  } catch {
    return null;
  }

  return sessionId;
}

export async function getSessions(childId: string): Promise<SessionRecord[]> {
  if (!isSupabaseConfigured()) {
    try {
      const sessions: SessionRecord[] = JSON.parse(localStorage.getItem(DEMO_SESSIONS_KEY) || '[]');
      return sessions.filter(s => s.child_id === childId);
    } catch {
      return [];
    }
  }

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('child_id', childId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Failed to load sessions:', error);
    return [];
  }
  return data || [];
}

export async function getSessionQuestions(sessionId: string): Promise<QuestionRecord[]> {
  if (!isSupabaseConfigured()) {
    try {
      const questions: QuestionRecord[] = JSON.parse(localStorage.getItem(DEMO_QUESTIONS_KEY) || '[]');
      return questions.filter(q => q.session_id === sessionId);
    } catch {
      return [];
    }
  }

  const { data, error } = await supabase
    .from('question_history')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to load questions:', error);
    return [];
  }
  return data || [];
}

export async function getGenreStats(childId: string): Promise<GenreStats[]> {
  let allQuestions: QuestionRecord[];

  if (!isSupabaseConfigured()) {
    try {
      const questions: QuestionRecord[] = JSON.parse(localStorage.getItem(DEMO_QUESTIONS_KEY) || '[]');
      allQuestions = questions.filter(q => q.child_id === childId);
    } catch {
      return [];
    }
  } else {
    const { data, error } = await supabase
      .from('question_history')
      .select('*')
      .eq('child_id', childId)
      .order('created_at', { ascending: true });

    if (error || !data) return [];
    allQuestions = data;
  }

  const byGenre = new Map<string, QuestionRecord[]>();
  for (const q of allQuestions) {
    const list = byGenre.get(q.genre) || [];
    list.push(q);
    byGenre.set(q.genre, list);
  }

  const stats: GenreStats[] = [];
  for (const [genre, questions] of byGenre) {
    const totalQuestions = questions.length;
    const correctCount = questions.filter(q => q.is_correct).length;
    const accuracy = Math.round((correctCount / totalQuestions) * 100);
    const avgTimeMs = Math.round(questions.reduce((sum, q) => sum + q.time_spent_ms, 0) / totalQuestions);

    const recent = questions.slice(-5);
    const recentAvgTimeMs = Math.round(recent.reduce((sum, q) => sum + q.time_spent_ms, 0) / recent.length);

    const recentAccuracy = recent.length > 0
      ? recent.filter(q => q.is_correct).length / recent.length
      : 0;
    const olderQuestions = questions.slice(0, -5);
    const olderAccuracy = olderQuestions.length > 0
      ? olderQuestions.filter(q => q.is_correct).length / olderQuestions.length
      : recentAccuracy;

    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (questions.length >= 5) {
      if (recentAccuracy > olderAccuracy + 0.1) trend = 'improving';
      else if (recentAccuracy < olderAccuracy - 0.1) trend = 'declining';
    }

    stats.push({ genre, totalQuestions, correctCount, accuracy, avgTimeMs, recentAvgTimeMs, trend });
  }

  stats.sort((a, b) => b.totalQuestions - a.totalQuestions);
  return stats;
}

export async function getQuestionComparison(
  childId: string,
  genre: string,
  timeSpentMs: number,
): Promise<{ avgTimeMs: number; fasterThanAvg: boolean; percentile: string } | null> {
  let genreQuestions: QuestionRecord[];

  if (!isSupabaseConfigured()) {
    try {
      const questions: QuestionRecord[] = JSON.parse(localStorage.getItem(DEMO_QUESTIONS_KEY) || '[]');
      genreQuestions = questions.filter(q => q.child_id === childId && q.genre === genre);
    } catch {
      return null;
    }
  } else {
    const { data, error } = await supabase
      .from('question_history')
      .select('time_spent_ms')
      .eq('child_id', childId)
      .eq('genre', genre);

    if (error || !data) return null;
    genreQuestions = data as QuestionRecord[];
  }

  if (genreQuestions.length < 2) return null;

  const times = genreQuestions.map(q => q.time_spent_ms);
  const avgTimeMs = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  const fasterThanAvg = timeSpentMs < avgTimeMs;
  const fasterCount = times.filter(t => timeSpentMs < t).length;
  const percentile = `${Math.round((fasterCount / times.length) * 100)}%`;

  return { avgTimeMs, fasterThanAvg, percentile };
}

export async function analyzeWork(params: {
  questionText: string;
  correctAnswer: string;
  userAnswer: string;
  genre: string;
  gradeLevel: string;
  scratchpadImage: string;
}): Promise<WorkAnalysis | null> {
  try {
    const response = await fetch('/api/analyze-work', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}
