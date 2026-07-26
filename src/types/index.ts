export interface Meal {
  id: string;
  name: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  water: number;
  date: string;
  note?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category: 'work' | 'life' | 'study' | 'health';
  dueDate?: string;
  timeBlock?: string;
  date: string;
}

export interface Mood {
  id: string;
  type: string;
  intensity: number;
  energy: number;
  sleepHours: number;
  journal: string;
  gratitude: string;
  createdAt: string;
}

export interface HotTopic {
  id: string;
  title: string;
  category: string;
  heat: number;
  source: string;
  url?: string;
  notes?: string;
  addedAt: string;
}

export interface ContentIdea {
  id: string;
  title: string;
  description: string;
  platform: 'xiaohongshu' | 'douyin' | 'weibo';
  account?: 'beauty' | 'ins';
  tags: string[];
  hook: string;
  body?: string;
  scheduledDate?: string;
  status: 'draft' | 'scheduled' | 'published';
  createdAt: string;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  targetPerWeek: number;
  history: string[];
}

export interface Workout {
  id: string;
  type: string;
  name: string;
  duration: number;
  intensity: 'low' | 'medium' | 'high';
  calories: number;
  sets?: number;
  reps?: number;
  weight?: number;
  distance?: number;
  heartRate?: number;
  note?: string;
  date: string;
  createdAt: string;
  fromWatch?: boolean;
}

// 睡眠记录
export interface SleepRecord {
  id: string;
  date: string;
  bedtime: string;
  wakeTime: string;
  duration: number;
  quality: number;
  note?: string;
  createdAt: string;
}

// 英语学习记录
export interface EnglishLesson {
  id: string;
  date: string;
  type: 'reading' | 'video' | 'repeat' | 'vocab' | 'listening';
  title: string;
  content: string;
  duration: number;
  completed: boolean;
  notes?: string;
  createdAt: string;
}

// 玄学占卜记录
export interface DivinationRecord {
  id: string;
  type: 'meihua' | 'liuyao' | 'test';
  question: string;
  result: string;
  interpretation: string;
  date: string;
  createdAt: string;
}

// 奖励积分
export interface RewardPoints {
  total: number;
  history: { id: string; date: string; action: string; points: number; }[];
}

// 招聘信息
export interface JobInfo {
  id: string;
  title: string;
  company: string;
  salary: string;
  location: string;
  tags: string[];
  source: string;
  url?: string;
  date: string;
  saved: boolean;
}

// 房价信息
export interface HousingInfo {
  id: string;
  area: string;
  price: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  date: string;
  source: string;
}

// 日程时间块
export interface ScheduleBlock {
  id: string;
  time: string;
  endTime: string;
  title: string;
  category: 'morning' | 'work' | 'study' | 'exercise' | 'rest' | 'social' | 'sleep';
  description?: string;
  completed: boolean;
  date: string;
}
