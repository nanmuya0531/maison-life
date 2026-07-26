import {
  Meal, Task, Mood, HotTopic, ContentIdea, Habit, Workout,
  SleepRecord, EnglishLesson, DivinationRecord, RewardPoints,
  JobInfo, HousingInfo, ScheduleBlock
} from '../types';

const STORAGE_KEYS = {
  MEALS: 'life_planner_meals',
  TASKS: 'life_planner_tasks',
  MOODS: 'life_planner_moods',
  HOT_TOPICS: 'life_planner_hot_topics',
  CONTENT_IDEAS: 'life_planner_content_ideas',
  HABITS: 'life_planner_habits',
  WORKOUTS: 'life_planner_workouts',
  SLEEP: 'life_planner_sleep',
  ENGLISH: 'life_planner_english',
  DIVINATION: 'life_planner_divination',
  REWARDS: 'life_planner_rewards',
  JOBS: 'life_planner_jobs',
  HOUSING: 'life_planner_housing',
  SCHEDULE: 'life_planner_schedule',
} as const;

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save:', e);
  }
}

export const storage = {
  getMeals: (): Meal[] => loadFromStorage(STORAGE_KEYS.MEALS, []),
  setMeals: (meals: Meal[]) => saveToStorage(STORAGE_KEYS.MEALS, meals),

  getTasks: (): Task[] => loadFromStorage(STORAGE_KEYS.TASKS, []),
  setTasks: (tasks: Task[]) => saveToStorage(STORAGE_KEYS.TASKS, tasks),

  getMoods: (): Mood[] => loadFromStorage(STORAGE_KEYS.MOODS, []),
  setMoods: (moods: Mood[]) => saveToStorage(STORAGE_KEYS.MOODS, moods),

  getHotTopics: (): HotTopic[] => loadFromStorage(STORAGE_KEYS.HOT_TOPICS, []),
  setHotTopics: (topics: HotTopic[]) => saveToStorage(STORAGE_KEYS.HOT_TOPICS, topics),

  getContentIdeas: (): ContentIdea[] => loadFromStorage(STORAGE_KEYS.CONTENT_IDEAS, []),
  setContentIdeas: (ideas: ContentIdea[]) => saveToStorage(STORAGE_KEYS.CONTENT_IDEAS, ideas),

  getHabits: (): Habit[] => loadFromStorage(STORAGE_KEYS.HABITS, []),
  setHabits: (habits: Habit[]) => saveToStorage(STORAGE_KEYS.HABITS, habits),

  getWorkouts: (): Workout[] => loadFromStorage(STORAGE_KEYS.WORKOUTS, []),
  setWorkouts: (workouts: Workout[]) => saveToStorage(STORAGE_KEYS.WORKOUTS, workouts),

  getSleepRecords: (): SleepRecord[] => loadFromStorage(STORAGE_KEYS.SLEEP, []),
  setSleepRecords: (records: SleepRecord[]) => saveToStorage(STORAGE_KEYS.SLEEP, records),

  getEnglishLessons: (): EnglishLesson[] => loadFromStorage(STORAGE_KEYS.ENGLISH, []),
  setEnglishLessons: (lessons: EnglishLesson[]) => saveToStorage(STORAGE_KEYS.ENGLISH, lessons),

  getDivinations: (): DivinationRecord[] => loadFromStorage(STORAGE_KEYS.DIVINATION, []),
  setDivinations: (records: DivinationRecord[]) => saveToStorage(STORAGE_KEYS.DIVINATION, records),

  getRewardPoints: (): RewardPoints => loadFromStorage(STORAGE_KEYS.REWARDS, { total: 0, history: [] }),
  setRewardPoints: (points: RewardPoints) => saveToStorage(STORAGE_KEYS.REWARDS, points),

  getJobs: (): JobInfo[] => loadFromStorage(STORAGE_KEYS.JOBS, []),
  setJobs: (jobs: JobInfo[]) => saveToStorage(STORAGE_KEYS.JOBS, jobs),

  getHousing: (): HousingInfo[] => loadFromStorage(STORAGE_KEYS.HOUSING, []),
  setHousing: (housing: HousingInfo[]) => saveToStorage(STORAGE_KEYS.HOUSING, housing),

  getSchedule: (): ScheduleBlock[] => loadFromStorage(STORAGE_KEYS.SCHEDULE, []),
  setSchedule: (blocks: ScheduleBlock[]) => saveToStorage(STORAGE_KEYS.SCHEDULE, blocks),
};

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// 奖励积分系统
export function addRewardPoints(action: string, points: number): void {
  const current = storage.getRewardPoints();
  current.total += points;
  current.history.unshift({
    id: generateId(),
    date: new Date().toISOString(),
    action,
    points,
  });
  storage.setRewardPoints(current);
}
