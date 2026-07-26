import { useState, useEffect } from 'react';
import {
  Dumbbell,
  Plus,
  Trash2,
  Flame,
  Clock,
  Heart,
  TrendingUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  Activity,
  Bike,
  Footprints,
  Waves,
  PersonStanding,
  Zap,
  Target,
  Award,
  Timer,
  Watch,
  Sparkles,
  Wind,
  Check,
} from 'lucide-react';
import { storage, generateId, todayStr, formatDate, addRewardPoints } from '../store';
import { Workout } from '../types';

interface FitnessProps {
  onPointsEarned: () => void;
}

// 法式配色
const F = {
  cream: '#FAF7F2',
  beige: '#F0EAE0',
  roseGold: '#C9A876',
  deepBrown: '#4A3C32',
  wine: '#8B4555',
  sage: '#8B9D83',
  dustyRose: '#D4A5A5',
  ink: '#2D2A26',
  mist: '#E8E2D9',
};

const FITNESS_START_KEY = 'life_planner_fitness_start_date';

type Intensity = Workout['intensity'];

// 8种运动类型
const WORKOUT_TYPES = [
  { id: 'running', label: '跑步', icon: <Footprints size={20} />, caloriesPerMin: 10 },
  { id: 'cycling', label: '骑行', icon: <Bike size={20} />, caloriesPerMin: 8 },
  { id: 'swimming', label: '游泳', icon: <Waves size={20} />, caloriesPerMin: 11 },
  { id: 'strength', label: '力量训练', icon: <Dumbbell size={20} />, caloriesPerMin: 6 },
  { id: 'yoga', label: '瑜伽', icon: <PersonStanding size={20} />, caloriesPerMin: 4 },
  { id: 'hiit', label: 'HIIT', icon: <Zap size={20} />, caloriesPerMin: 13 },
  { id: 'walking', label: '步行', icon: <Footprints size={20} />, caloriesPerMin: 4 },
  { id: 'other', label: '其他', icon: <Activity size={20} />, caloriesPerMin: 6 },
];

const TYPE_MAP: Record<string, typeof WORKOUT_TYPES[number]> = WORKOUT_TYPES.reduce(
  (acc, t) => {
    acc[t.id] = t;
    return acc;
  },
  {} as Record<string, typeof WORKOUT_TYPES[number]>
);

const INTENSITY_LEVELS: Record<Intensity, { label: string; desc: string; color: string }> = {
  low: { label: '舒缓', desc: '轻松惬意', color: F.sage },
  medium: { label: '适中', desc: '微微出汗', color: F.roseGold },
  high: { label: '挑战', desc: '酣畅淋漓', color: F.wine },
};

// 快速预设运动
const QUICK_PRESETS = [
  { type: 'yoga', name: '晨间拉伸', duration: 15, intensity: 'low' as Intensity, icon: <Wind size={18} /> },
  { type: 'walking', name: '午后散步', duration: 20, intensity: 'low' as Intensity, icon: <Footprints size={18} /> },
  { type: 'yoga', name: '舒缓瑜伽', duration: 30, intensity: 'low' as Intensity, icon: <PersonStanding size={18} /> },
  { type: 'walking', name: '轻快步行', duration: 25, intensity: 'medium' as Intensity, icon: <Footprints size={18} /> },
  { type: 'strength', name: '简易力量', duration: 20, intensity: 'medium' as Intensity, icon: <Dumbbell size={18} /> },
  { type: 'cycling', name: '骑行时光', duration: 30, intensity: 'medium' as Intensity, icon: <Bike size={18} /> },
];

// 4周循序渐进计划（35岁女生，2年未运动）
interface DayPlan {
  name: string;
  detail: string;
}
interface WeekPlan {
  week: number;
  title: string;
  subtitle: string;
  duration: number;
  intensity: Intensity;
  color: string;
  desc: string;
  daily: DayPlan[];
}

const WEEKLY_PLAN: WeekPlan[] = [
  {
    week: 1,
    title: '唤醒身体',
    subtitle: 'Première Semaine',
    duration: 15,
    intensity: 'low',
    color: F.sage,
    desc: '从最温柔的散步与拉伸开始，让沉睡两年的身体慢慢苏醒。不必赶，不必比，只需出门走一走。',
    daily: [
      { name: '晨间散步', detail: '15分钟慢节奏散步，呼吸新鲜空气，感受双脚触地的轻盈' },
      { name: '舒缓拉伸', detail: '15分钟全身拉伸，舒展肩颈、腰背与腿后侧' },
      { name: '晨间散步', detail: '15分钟公园小径，步伐轻柔，留意周围的绿意' },
      { name: '舒缓拉伸', detail: '15分钟阴瑜伽式拉伸，停留于每个体式3-5个呼吸' },
      { name: '晨间散步', detail: '15分钟社区漫步，享受独处的清晨时光' },
      { name: '自由活动', detail: '15分钟任选散步或拉伸，给身体一周的温柔告别' },
      { name: '休息日', detail: '完全休息，可做5分钟轻柔呼吸与冥想' },
    ],
  },
  {
    week: 2,
    title: '温柔舒展',
    subtitle: 'Deuxième Semaine',
    duration: 20,
    intensity: 'low',
    color: F.roseGold,
    desc: '身体已开始苏醒，让我们加入瑜伽与快走，唤醒更深层的活力。',
    daily: [
      { name: '晨间瑜伽', detail: '20分钟哈他瑜伽，拜日式序列让身体温暖' },
      { name: '轻快步行', detail: '20分钟快步走，能说话但不能唱歌的节奏' },
      { name: '晨间瑜伽', detail: '20分钟流瑜伽，配合呼吸串联体式' },
      { name: '轻快步行', detail: '20分钟公园快走，感受心跳微微加速' },
      { name: '晨间瑜伽', detail: '20分钟阴瑜伽，深度拉伸筋膜与关节' },
      { name: '轻快步行', detail: '20分钟绿地快走，享受周末的从容' },
      { name: '休息日', detail: '15分钟冥想与呼吸练习，让身心整合' },
    ],
  },
  {
    week: 3,
    title: '力量初探',
    subtitle: 'Troisième Semaine',
    duration: 25,
    intensity: 'medium',
    color: F.dustyRose,
    desc: '身体已准备好迎接新的挑战，加入简单的自重训练，唤醒沉睡的肌肉。',
    daily: [
      { name: '快走 + 核心', detail: '15分钟快走 + 10分钟平板支撑、卷腹等核心训练' },
      { name: '瑜伽 + 上肢', detail: '15分钟瑜伽 + 10分钟跪姿俯卧撑、手臂画圈' },
      { name: '快走 + 下肢', detail: '15分钟快走 + 10分钟深蹲、弓步等下肢训练' },
      { name: '瑜伽 + 核心', detail: '15分钟瑜伽 + 10分钟船式、侧板等核心' },
      { name: '快走 + 全身', detail: '15分钟快走 + 10分钟自重全身循环' },
      { name: '恢复瑜伽', detail: '25分钟恢复瑜伽，让肌肉得到舒展' },
      { name: '休息日', detail: '15分钟散步 + 5分钟冥想' },
    ],
  },
  {
    week: 4,
    title: '综合训练',
    subtitle: 'Quatrième Semaine',
    duration: 30,
    intensity: 'medium',
    color: F.wine,
    desc: '一个月的坚持，让身体重新拥有力量。本周融合有氧与力量，享受运动的畅快。',
    daily: [
      { name: '有氧 + 力量', detail: '15分钟快走或骑行 + 15分钟上肢与核心训练' },
      { name: '瑜伽 + 下肢', detail: '15分钟流瑜伽 + 15分钟深蹲、弓步、桥式' },
      { name: 'HIIT 入门', detail: '20分钟低冲击HIIT（20秒运动/40秒休息）+ 10分钟拉伸' },
      { name: '快走 + 核心', detail: '20分钟快走 + 10分钟核心循环训练' },
      { name: '有氧 + 全身', detail: '15分钟有氧 + 15分钟自重全身训练' },
      { name: '流瑜伽', detail: '30分钟流瑜伽，呼吸与体式完美配合' },
      { name: '休息日', detail: '20分钟散步，回顾这一月的蜕变' },
    ],
  },
];

const TYPE_PALETTE = [F.sage, F.roseGold, F.wine, F.dustyRose, F.deepBrown, F.beige];

export default function Fitness({ onPointsEarned }: FitnessProps) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<'today' | 'history' | 'stats'>('today');
  const [startDate, setStartDate] = useState<string>(todayStr());

  const [newWorkout, setNewWorkout] = useState({
    type: 'walking',
    name: '',
    duration: 15,
    intensity: 'low' as Intensity,
    sets: 0,
    reps: 0,
    weight: 0,
    distance: 0,
    heartRate: 0,
    note: '',
    fromWatch: false,
  });

  useEffect(() => {
    setWorkouts(storage.getWorkouts());
    let saved = localStorage.getItem(FITNESS_START_KEY);
    if (!saved) {
      saved = todayStr();
      localStorage.setItem(FITNESS_START_KEY, saved);
    }
    setStartDate(saved);
  }, []);

  // 计算当前周数
  const currentWeek = (() => {
    const start = new Date(startDate);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const week = Math.floor(diffDays / 7) + 1;
    return Math.max(1, Math.min(4, week));
  })();

  const todayPlan = WEEKLY_PLAN[currentWeek - 1];
  const dayOfWeek = new Date().getDay(); // 0=周日
  const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 转为 0=周一
  const todayRecommendation = todayPlan.daily[dayIndex];

  const dayWorkouts = workouts.filter(w => w.date === selectedDate);

  const resetNewWorkout = () => {
    setNewWorkout({
      type: 'walking',
      name: '',
      duration: 15,
      intensity: 'low',
      sets: 0,
      reps: 0,
      weight: 0,
      distance: 0,
      heartRate: 0,
      note: '',
      fromWatch: false,
    });
  };

  const saveWorkout = () => {
    const typeInfo = TYPE_MAP[newWorkout.type] || WORKOUT_TYPES[7];
    const calories = Math.round(newWorkout.duration * typeInfo.caloriesPerMin);

    const workout: Workout = {
      id: generateId(),
      type: newWorkout.type,
      name: newWorkout.name || typeInfo.label,
      duration: newWorkout.duration,
      intensity: newWorkout.intensity,
      calories,
      sets: newWorkout.sets || undefined,
      reps: newWorkout.reps || undefined,
      weight: newWorkout.weight || undefined,
      distance: newWorkout.distance || undefined,
      heartRate: newWorkout.heartRate || undefined,
      note: newWorkout.note || undefined,
      date: selectedDate,
      createdAt: new Date().toISOString(),
      fromWatch: newWorkout.fromWatch || undefined,
    };

    const all = storage.getWorkouts();
    all.push(workout);
    storage.setWorkouts(all);
    setWorkouts([...all]);

    addRewardPoints('完成运动', 10);
    onPointsEarned();

    setShowAddModal(false);
    resetNewWorkout();
  };

  const deleteWorkout = (id: string) => {
    const all = storage.getWorkouts().filter(w => w.id !== id);
    storage.setWorkouts(all);
    setWorkouts(all);
  };

  const quickLog = (preset: typeof QUICK_PRESETS[number]) => {
    const typeInfo = TYPE_MAP[preset.type] || WORKOUT_TYPES[7];
    const calories = Math.round(preset.duration * typeInfo.caloriesPerMin);

    const workout: Workout = {
      id: generateId(),
      type: preset.type,
      name: preset.name,
      duration: preset.duration,
      intensity: preset.intensity,
      calories,
      date: selectedDate,
      createdAt: new Date().toISOString(),
    };

    const all = storage.getWorkouts();
    all.push(workout);
    storage.setWorkouts(all);
    setWorkouts([...all]);

    addRewardPoints('完成运动', 10);
    onPointsEarned();
  };

  const openManualFromWatch = () => {
    resetNewWorkout();
    setNewWorkout(prev => ({ ...prev, fromWatch: true, type: 'walking', duration: 20 }));
    setShowAddModal(true);
  };

  const changeDate = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(formatDate(d));
  };

  // 今日统计
  const todayStats = {
    duration: dayWorkouts.reduce((s, w) => s + w.duration, 0),
    calories: dayWorkouts.reduce((s, w) => s + w.calories, 0),
    count: dayWorkouts.length,
  };

  // 本周统计
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekWorkouts = workouts.filter(w => new Date(w.date) >= weekAgo);
  const weekStats = {
    duration: weekWorkouts.reduce((s, w) => s + w.duration, 0),
    calories: weekWorkouts.reduce((s, w) => s + w.calories, 0),
    count: weekWorkouts.length,
  };

  // 近7天趋势
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = formatDate(d);
    const dayWs = workouts.filter(w => w.date === dateStr);
    return {
      date: dateStr,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      calories: dayWs.reduce((s, w) => s + w.calories, 0),
      duration: dayWs.reduce((s, w) => s + w.duration, 0),
    };
  });
  const maxCalories = Math.max(...last7Days.map(d => d.calories), 100);

  // 按类型统计
  const typeStats = WORKOUT_TYPES.map((type, idx) => {
    const typeWs = weekWorkouts.filter(w => w.type === type.id);
    return {
      ...type,
      count: typeWs.length,
      duration: typeWs.reduce((s, w) => s + w.duration, 0),
      calories: typeWs.reduce((s, w) => s + w.calories, 0),
      barColor: TYPE_PALETTE[idx % TYPE_PALETTE.length],
    };
  })
    .filter(t => t.count > 0)
    .sort((a, b) => b.duration - a.duration);

  const sortedHistory = [...workouts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const tabs = [
    { id: 'today' as const, label: '今日计划', subtitle: "Aujourd'hui", icon: <Sparkles size={16} /> },
    { id: 'history' as const, label: '历史记录', subtitle: 'Historique', icon: <Calendar size={16} /> },
    { id: 'stats' as const, label: '数据统计', subtitle: 'Statistiques', icon: <TrendingUp size={16} /> },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold" style={{ color: F.deepBrown }}>
            运动健身
          </h1>
          <p className="text-xs tracking-[0.25em] uppercase mt-1" style={{ color: F.roseGold }}>
            L'Élan Vital · 重拾身体的优雅韵律
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 glass rounded-xl p-1">
            <button
              onClick={() => changeDate(-1)}
              className="p-2 rounded-lg transition hover:bg-white/60"
            >
              <ChevronLeft size={18} style={{ color: F.deepBrown }} />
            </button>
            <span
              className="px-3 py-1 font-serif text-sm min-w-[100px] text-center"
              style={{ color: F.deepBrown }}
            >
              {selectedDate === todayStr() ? '今日' : selectedDate}
            </span>
            <button
              onClick={() => changeDate(1)}
              className="p-2 rounded-lg transition hover:bg-white/60"
            >
              <ChevronRight size={18} style={{ color: F.deepBrown }} />
            </button>
          </div>

          <button
            onClick={() => {
              resetNewWorkout();
              setShowAddModal(true);
            }}
            className="btn-rose flex items-center gap-2 px-5 py-2.5 text-sm font-serif"
          >
            <Plus size={16} />
            <span>记录运动</span>
          </button>
        </div>
      </div>

      {/* 分隔线 */}
      <div className="divider-french" />

      {/* 视图切换 */}
      <div
        className="flex gap-1 p-1 rounded-xl"
        style={{
          background: 'rgba(255,255,255,0.5)',
          border: '1px solid rgba(201,168,118,0.15)',
        }}
      >
        {tabs.map(tab => {
          const isActive = viewMode === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-serif transition"
              style={
                isActive
                  ? {
                      background: 'linear-gradient(135deg, #4A3C32, #3D3530)',
                      color: F.cream,
                      boxShadow: '0 4px 14px rgba(74,60,50,0.18)',
                    }
                  : { color: F.deepBrown }
              }
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 今日计划 */}
      {viewMode === 'today' && (
        <div className="space-y-6">
          {/* 今日推荐 Hero */}
          <div className="glass card card-hover rounded-2xl p-8 relative overflow-hidden">
            <div
              className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-15"
              style={{ background: todayPlan.color, transform: 'translate(30%, -30%)' }}
            />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <span
                  className="text-xs tracking-widest uppercase px-3 py-1 rounded font-serif"
                  style={{ background: todayPlan.color, color: F.cream }}
                >
                  第 {currentWeek} 周 · {todayPlan.subtitle}
                </span>
                <span className="text-xs tracking-[0.2em] uppercase" style={{ color: F.roseGold }}>
                  Programme · 4 Semaines
                </span>
              </div>
              <h2 className="text-3xl font-serif font-bold mb-2" style={{ color: F.deepBrown }}>
                {todayPlan.title}
              </h2>
              <p className="text-sm italic max-w-2xl mb-6" style={{ color: '#7A6E62' }}>
                {todayPlan.desc}
              </p>

              <div className="divider-french mb-6" />

              {/* 今日推荐 */}
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: todayPlan.color }}
                >
                  <Sparkles size={24} style={{ color: F.cream }} />
                </div>
                <div className="flex-1">
                  <p
                    className="text-xs tracking-[0.2em] uppercase mb-2"
                    style={{ color: F.roseGold }}
                  >
                    今日推荐 · {INTENSITY_LEVELS[todayPlan.intensity].label}强度 · {todayPlan.duration}分钟
                  </p>
                  <h3 className="text-xl font-serif font-medium mb-1" style={{ color: F.deepBrown }}>
                    {todayRecommendation.name}
                  </h3>
                  <p className="text-sm" style={{ color: '#7A6E62' }}>
                    {todayRecommendation.detail}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4周计划进度 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {WEEKLY_PLAN.map(plan => {
              const isCurrent = plan.week === currentWeek;
              const isPast = plan.week < currentWeek;
              return (
                <div
                  key={plan.week}
                  className="glass card card-hover rounded-2xl p-5 relative"
                  style={
                    isCurrent
                      ? { borderColor: plan.color, boxShadow: `0 8px 28px ${plan.color}25` }
                      : {}
                  }
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs tracking-widest font-serif" style={{ color: F.roseGold }}>
                      Semaine {plan.week}
                    </span>
                    {isCurrent && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-serif"
                        style={{ background: plan.color, color: F.cream }}
                      >
                        进行中
                      </span>
                    )}
                    {isPast && (
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: F.sage }}
                      >
                        <Check size={12} style={{ color: F.cream }} />
                      </span>
                    )}
                  </div>
                  <h4 className="font-serif text-lg font-medium mb-1" style={{ color: F.deepBrown }}>
                    {plan.title}
                  </h4>
                  <p className="text-xs italic mb-3" style={{ color: F.roseGold }}>
                    {plan.subtitle}
                  </p>
                  <div className="flex items-center gap-3 text-xs" style={{ color: '#7A6E62' }}>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {plan.duration}分钟
                    </span>
                    <span className="flex items-center gap-1">
                      <Activity size={12} style={{ color: plan.color }} />
                      {INTENSITY_LEVELS[plan.intensity].label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 今日数据概览 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="glass card card-hover rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <Timer size={18} style={{ color: F.sage }} />
                <span className="text-xs tracking-widest" style={{ color: F.roseGold }}>
                  Durée
                </span>
              </div>
              <p className="text-3xl font-serif font-bold" style={{ color: F.deepBrown }}>
                {todayStats.duration}
              </p>
              <p className="text-xs mt-1" style={{ color: '#7A6E62' }}>
                今日时长（分钟）
              </p>
            </div>
            <div className="glass card card-hover rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <Flame size={18} style={{ color: F.wine }} />
                <span className="text-xs tracking-widest" style={{ color: F.roseGold }}>
                  Calories
                </span>
              </div>
              <p className="text-3xl font-serif font-bold" style={{ color: F.deepBrown }}>
                {todayStats.calories}
              </p>
              <p className="text-xs mt-1" style={{ color: '#7A6E62' }}>
                消耗（千卡）
              </p>
            </div>
            <div className="glass card card-hover rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <Award size={18} style={{ color: F.roseGold }} />
                <span className="text-xs tracking-widest" style={{ color: F.roseGold }}>
                  Séances
                </span>
              </div>
              <p className="text-3xl font-serif font-bold" style={{ color: F.deepBrown }}>
                {todayStats.count}
              </p>
              <p className="text-xs mt-1" style={{ color: '#7A6E62' }}>
                今日次数
              </p>
            </div>
          </div>

          {/* 快速记录 */}
          <div className="glass card card-hover rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-lg font-medium" style={{ color: F.deepBrown }}>
                  一键记录
                </h3>
                <p className="text-xs tracking-[0.2em] uppercase mt-1" style={{ color: F.roseGold }}>
                  Quick Logs
                </p>
              </div>
              <Zap size={20} style={{ color: F.roseGold }} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {QUICK_PRESETS.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => quickLog(preset)}
                  className="flex items-center gap-3 p-3 rounded-xl transition"
                  style={{
                    background: 'rgba(255,255,255,0.5)',
                    border: '1px solid rgba(201,168,118,0.12)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.9)';
                    e.currentTarget.style.borderColor = F.roseGold;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.5)';
                    e.currentTarget.style.borderColor = 'rgba(201,168,118,0.12)';
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: INTENSITY_LEVELS[preset.intensity].color }}
                  >
                    <span style={{ color: F.cream }}>{preset.icon}</span>
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p
                      className="text-sm font-serif font-medium truncate"
                      style={{ color: F.deepBrown }}
                    >
                      {preset.name}
                    </p>
                    <p className="text-xs" style={{ color: '#7A6E62' }}>
                      {preset.duration}分钟 · {INTENSITY_LEVELS[preset.intensity].label}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 小米手表数据同步 */}
          <div className="glass card card-hover rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #4A3C32, #3D3530)' }}
              >
                <Watch size={22} style={{ color: F.cream }} />
              </div>
              <div className="flex-1">
                <h3 className="font-serif text-lg font-medium mb-1" style={{ color: F.deepBrown }}>
                  小米手表数据
                </h3>
                <p
                  className="text-xs tracking-[0.2em] uppercase mb-2"
                  style={{ color: F.roseGold }}
                >
                  Montre Xiaomi
                </p>
                <p className="text-sm italic mb-4" style={{ color: '#7A6E62' }}>
                  需配合小米运动App导出数据。请于App内导出运动记录后，手动录入下方，系统将自动标记为「来自手表」。
                </p>
                <button
                  onClick={openManualFromWatch}
                  className="btn-french px-5 py-2.5 text-sm font-serif flex items-center gap-2"
                >
                  <Plus size={16} />
                  <span>录入手表数据</span>
                </button>
              </div>
            </div>
          </div>

          {/* 今日记录列表 */}
          <div className="glass card card-hover rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-lg font-medium" style={{ color: F.deepBrown }}>
                  {selectedDate === todayStr() ? '今日' : selectedDate}记录
                </h3>
                <p
                  className="text-xs tracking-[0.2em] uppercase mt-1"
                  style={{ color: F.roseGold }}
                >
                  Journal du Jour
                </p>
              </div>
              <Calendar size={20} style={{ color: F.roseGold }} />
            </div>

            {dayWorkouts.length === 0 ? (
              <div className="text-center py-12">
                <div
                  className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(201,168,118,0.1)' }}
                >
                  <Dumbbell size={32} style={{ color: F.roseGold }} />
                </div>
                <p className="font-serif mb-1" style={{ color: F.deepBrown }}>
                  尚未开始今日的运动
                </p>
                <p className="text-sm" style={{ color: '#7A6E62' }}>
                  优雅从一步开始，动起来吧
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {dayWorkouts.map(workout => {
                  const info = TYPE_MAP[workout.type] || WORKOUT_TYPES[7];
                  const intensityInfo = INTENSITY_LEVELS[workout.intensity];
                  return (
                    <div
                      key={workout.id}
                      className="flex items-start gap-4 p-4 rounded-xl group transition"
                      style={{ background: 'rgba(255,255,255,0.5)' }}
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: intensityInfo.color }}
                      >
                        <span style={{ color: F.cream }}>{info.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-serif font-medium" style={{ color: F.deepBrown }}>
                            {workout.name}
                          </h4>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              background: intensityInfo.color + '30',
                              color: intensityInfo.color,
                            }}
                          >
                            {intensityInfo.label}
                          </span>
                          {workout.fromWatch && (
                            <span
                              className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                              style={{ background: 'rgba(74,60,50,0.1)', color: F.deepBrown }}
                            >
                              <Watch size={10} /> 来自手表
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs" style={{ color: '#7A6E62' }}>
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> {workout.duration} 分钟
                          </span>
                          <span className="flex items-center gap-1">
                            <Flame size={12} /> {workout.calories} 千卡
                          </span>
                          {workout.sets && workout.sets > 0 && (
                            <span className="flex items-center gap-1">
                              <Dumbbell size={12} /> {workout.sets}组 × {workout.reps}
                            </span>
                          )}
                          {workout.weight && workout.weight > 0 && <span>{workout.weight} kg</span>}
                          {workout.distance && workout.distance > 0 && (
                            <span className="flex items-center gap-1">
                              <Target size={12} /> {workout.distance} km
                            </span>
                          )}
                          {workout.heartRate && workout.heartRate > 0 && (
                            <span className="flex items-center gap-1">
                              <Heart size={12} /> {workout.heartRate} bpm
                            </span>
                          )}
                        </div>
                        {workout.note && (
                          <p className="text-sm italic mt-2" style={{ color: '#7A6E62' }}>
                            {workout.note}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => deleteWorkout(workout.id)}
                        className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition"
                        style={{ color: F.wine }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 历史记录 */}
      {viewMode === 'history' && (
        <div className="glass card card-hover rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-serif text-xl font-medium" style={{ color: F.deepBrown }}>
                运动编年史
              </h3>
              <p className="text-xs tracking-[0.2em] uppercase mt-1" style={{ color: F.roseGold }}>
                Historique
              </p>
            </div>
            <Calendar size={22} style={{ color: F.roseGold }} />
          </div>

          {sortedHistory.length === 0 ? (
            <div className="text-center py-12">
              <Calendar
                size={40}
                className="mx-auto mb-4"
                style={{ color: F.roseGold, opacity: 0.4 }}
              />
              <p className="font-serif" style={{ color: F.deepBrown }}>
                尚无运动记录
              </p>
              <p className="text-sm mt-1" style={{ color: '#7A6E62' }}>
                每一次记录都是对自己的温柔承诺
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedHistory.slice(0, 50).map(workout => {
                const info = TYPE_MAP[workout.type] || WORKOUT_TYPES[7];
                const intensityInfo = INTENSITY_LEVELS[workout.intensity];
                const date = new Date(workout.date);
                const isToday = workout.date === todayStr();
                const dateLabel = isToday
                  ? '今日'
                  : `${date.getMonth() + 1}月${date.getDate()}日`;
                return (
                  <div
                    key={workout.id}
                    className="flex items-center gap-4 p-3 rounded-xl group transition"
                    style={{ background: 'rgba(255,255,255,0.5)' }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: intensityInfo.color }}
                    >
                      <span style={{ color: F.cream }}>{info.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="font-serif text-sm font-medium"
                          style={{ color: F.deepBrown }}
                        >
                          {workout.name}
                        </span>
                        <span className="text-xs" style={{ color: F.roseGold }}>
                          {dateLabel}
                        </span>
                        {workout.fromWatch && (
                          <Watch size={12} style={{ color: F.deepBrown }} />
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs mt-0.5" style={{ color: '#7A6E62' }}>
                        <span>{workout.duration}分钟</span>
                        <span>{workout.calories}千卡</span>
                        <span style={{ color: intensityInfo.color }}>{intensityInfo.label}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteWorkout(workout.id)}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition"
                      style={{ color: F.wine }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 数据统计 */}
      {viewMode === 'stats' && (
        <div className="space-y-6">
          {/* 本周概览 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="glass card card-hover rounded-2xl p-5 text-center">
              <Timer size={22} className="mx-auto mb-2" style={{ color: F.sage }} />
              <p className="text-2xl font-serif font-bold" style={{ color: F.deepBrown }}>
                {weekStats.duration}
              </p>
              <p className="text-xs tracking-widest uppercase mt-1" style={{ color: F.roseGold }}>
                本周分钟
              </p>
            </div>
            <div className="glass card card-hover rounded-2xl p-5 text-center">
              <Flame size={22} className="mx-auto mb-2" style={{ color: F.wine }} />
              <p className="text-2xl font-serif font-bold" style={{ color: F.deepBrown }}>
                {weekStats.calories}
              </p>
              <p className="text-xs tracking-widest uppercase mt-1" style={{ color: F.roseGold }}>
                本周千卡
              </p>
            </div>
            <div className="glass card card-hover rounded-2xl p-5 text-center">
              <Award size={22} className="mx-auto mb-2" style={{ color: F.roseGold }} />
              <p className="text-2xl font-serif font-bold" style={{ color: F.deepBrown }}>
                {weekStats.count}
              </p>
              <p className="text-xs tracking-widest uppercase mt-1" style={{ color: F.roseGold }}>
                本周次数
              </p>
            </div>
          </div>

          {/* 7天趋势柱状图 */}
          <div className="glass card card-hover rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-serif text-lg font-medium" style={{ color: F.deepBrown }}>
                  近7日趋势
                </h3>
                <p
                  className="text-xs tracking-[0.2em] uppercase mt-1"
                  style={{ color: F.roseGold }}
                >
                  Tendance · 7 Jours
                </p>
              </div>
              <TrendingUp size={22} style={{ color: F.roseGold }} />
            </div>
            <div className="flex items-end justify-between gap-2 h-48">
              {last7Days.map((day, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full">
                  <div className="text-xs font-serif" style={{ color: F.deepBrown }}>
                    {day.calories > 0 ? day.calories : ''}
                  </div>
                  <div
                    className="w-full rounded-t-lg overflow-hidden flex-1 flex items-end"
                    style={{ background: 'rgba(201,168,118,0.08)' }}
                  >
                    <div
                      className="w-full rounded-t-lg transition-all duration-500"
                      style={{
                        height: `${maxCalories > 0 ? (day.calories / maxCalories) * 100 : 0}%`,
                        minHeight: day.calories > 0 ? '8px' : '0',
                        background: `linear-gradient(to top, ${F.wine}, ${F.dustyRose})`,
                      }}
                    />
                  </div>
                  <div className="text-xs" style={{ color: F.roseGold }}>
                    {day.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 类型分布 */}
          <div className="glass card card-hover rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-serif text-lg font-medium" style={{ color: F.deepBrown }}>
                  本周类型分布
                </h3>
                <p className="text-xs tracking-[0.2em] uppercase mt-1" style={{ color: F.roseGold }}>
                  Répartition
                </p>
              </div>
              <Activity size={22} style={{ color: F.roseGold }} />
            </div>

            {typeStats.length === 0 ? (
              <p className="text-center py-8 font-serif" style={{ color: '#7A6E62' }}>
                本周尚无运动记录
              </p>
            ) : (
              <div className="space-y-4">
                {typeStats.map(type => (
                  <div key={type.id} className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: type.barColor }}
                    >
                      <span style={{ color: F.cream }}>{type.icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="font-serif text-sm font-medium"
                          style={{ color: F.deepBrown }}
                        >
                          {type.label}
                        </span>
                        <span className="text-xs" style={{ color: '#7A6E62' }}>
                          {type.duration}分钟 · {type.count}次
                        </span>
                      </div>
                      <div
                        className="h-2 rounded-full overflow-hidden"
                        style={{ background: 'rgba(201,168,118,0.1)' }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${
                              weekStats.duration > 0
                                ? (type.duration / weekStats.duration) * 100
                                : 0
                            }%`,
                            background: type.barColor,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 添加运动 Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          style={{ backdropFilter: 'blur(4px)' }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="rounded-3xl w-full max-w-lg p-7 animate-slide-up max-h-[90vh] overflow-y-auto"
            style={{ background: F.cream, border: '1px solid rgba(201,168,118,0.2)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-serif font-bold" style={{ color: F.deepBrown }}>
                  记录运动
                </h2>
                <p
                  className="text-xs tracking-[0.2em] uppercase mt-1"
                  style={{ color: F.roseGold }}
                >
                  Nouvelle Séance
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-lg transition hover:bg-black/5"
                style={{ color: F.deepBrown }}
              >
                <X size={20} />
              </button>
            </div>

            {/* 运动类型 */}
            <div className="mb-5">
              <label
                className="text-xs tracking-[0.2em] uppercase mb-3 block font-serif"
                style={{ color: F.roseGold }}
              >
                运动类型
              </label>
              <div className="grid grid-cols-4 gap-2">
                {WORKOUT_TYPES.map(type => {
                  const isSelected = newWorkout.type === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setNewWorkout({ ...newWorkout, type: type.id })}
                      className="p-3 rounded-xl flex flex-col items-center gap-1 transition"
                      style={
                        isSelected
                          ? {
                              background: 'linear-gradient(135deg, #4A3C32, #3D3530)',
                              color: F.cream,
                              transform: 'scale(1.05)',
                              boxShadow: '0 6px 16px rgba(74,60,50,0.2)',
                            }
                          : {
                              background: 'rgba(255,255,255,0.6)',
                              color: F.deepBrown,
                              border: '1px solid rgba(201,168,118,0.15)',
                            }
                      }
                    >
                      {type.icon}
                      <span className="text-xs font-serif">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 运动名称 */}
            <div className="mb-4">
              <label
                className="text-xs tracking-[0.2em] uppercase mb-1 block font-serif"
                style={{ color: F.roseGold }}
              >
                运动名称
              </label>
              <input
                type="text"
                value={newWorkout.name}
                onChange={e => setNewWorkout({ ...newWorkout, name: e.target.value })}
                placeholder={TYPE_MAP[newWorkout.type]?.label || '运动名称'}
                className="input-french w-full px-4 py-3"
              />
            </div>

            {/* 时长 & 强度 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label
                  className="text-xs tracking-[0.2em] uppercase mb-1 block font-serif"
                  style={{ color: F.roseGold }}
                >
                  时长（分钟）
                </label>
                <input
                  type="number"
                  value={newWorkout.duration}
                  onChange={e =>
                    setNewWorkout({ ...newWorkout, duration: parseInt(e.target.value) || 0 })
                  }
                  className="input-french w-full px-4 py-3"
                />
              </div>
              <div>
                <label
                  className="text-xs tracking-[0.2em] uppercase mb-1 block font-serif"
                  style={{ color: F.roseGold }}
                >
                  强度
                </label>
                <div className="flex gap-1">
                  {(['low', 'medium', 'high'] as const).map(level => (
                    <button
                      key={level}
                      onClick={() => setNewWorkout({ ...newWorkout, intensity: level })}
                      className="flex-1 py-3 rounded-xl text-xs font-serif transition"
                      style={
                        newWorkout.intensity === level
                          ? { background: INTENSITY_LEVELS[level].color, color: F.cream }
                          : {
                              background: 'rgba(255,255,255,0.6)',
                              color: F.deepBrown,
                            }
                      }
                    >
                      {INTENSITY_LEVELS[level].label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 预估消耗 */}
            <div
              className="mb-4 p-4 rounded-xl flex items-center justify-between"
              style={{
                background:
                  'linear-gradient(135deg, rgba(201,168,118,0.12), rgba(212,165,165,0.12))',
              }}
            >
              <span className="text-sm font-serif" style={{ color: F.deepBrown }}>
                预估消耗
              </span>
              <span className="text-lg font-serif font-bold" style={{ color: F.wine }}>
                {Math.round(
                  newWorkout.duration * (TYPE_MAP[newWorkout.type]?.caloriesPerMin || 6)
                )}{' '}
                千卡
              </span>
            </div>

            {/* 详细数据 */}
            <div className="mb-4">
              <label
                className="text-xs tracking-[0.2em] uppercase mb-2 block font-serif"
                style={{ color: F.roseGold }}
              >
                详细数据（可选）
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: '#7A6E62' }}>
                    组数
                  </label>
                  <input
                    type="number"
                    value={newWorkout.sets || ''}
                    onChange={e =>
                      setNewWorkout({ ...newWorkout, sets: parseInt(e.target.value) || 0 })
                    }
                    placeholder="0"
                    className="input-french w-full px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: '#7A6E62' }}>
                    次数
                  </label>
                  <input
                    type="number"
                    value={newWorkout.reps || ''}
                    onChange={e =>
                      setNewWorkout({ ...newWorkout, reps: parseInt(e.target.value) || 0 })
                    }
                    placeholder="0"
                    className="input-french w-full px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: '#7A6E62' }}>
                    重量(kg)
                  </label>
                  <input
                    type="number"
                    value={newWorkout.weight || ''}
                    onChange={e =>
                      setNewWorkout({ ...newWorkout, weight: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="0"
                    className="input-french w-full px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: '#7A6E62' }}>
                    距离(km)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newWorkout.distance || ''}
                    onChange={e =>
                      setNewWorkout({
                        ...newWorkout,
                        distance: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                    className="input-french w-full px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: '#7A6E62' }}>
                    心率(bpm)
                  </label>
                  <input
                    type="number"
                    value={newWorkout.heartRate || ''}
                    onChange={e =>
                      setNewWorkout({
                        ...newWorkout,
                        heartRate: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                    className="input-french w-full px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* 备注 */}
            <div className="mb-5">
              <label
                className="text-xs tracking-[0.2em] uppercase mb-1 block font-serif"
                style={{ color: F.roseGold }}
              >
                备注
              </label>
              <textarea
                value={newWorkout.note}
                onChange={e => setNewWorkout({ ...newWorkout, note: e.target.value })}
                placeholder="今日身体的感受、心情的微妙变化..."
                rows={2}
                className="input-french w-full px-4 py-3 resize-none"
              />
            </div>

            {/* 来自手表开关 */}
            <div
              className="mb-6 flex items-center gap-3 p-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.5)' }}
            >
              <Watch size={18} style={{ color: F.deepBrown }} />
              <div className="flex-1">
                <p className="text-sm font-serif" style={{ color: F.deepBrown }}>
                  来自小米手表
                </p>
                <p className="text-xs" style={{ color: '#7A6E62' }}>
                  标记此记录为手表同步数据
                </p>
              </div>
              <button
                onClick={() =>
                  setNewWorkout({ ...newWorkout, fromWatch: !newWorkout.fromWatch })
                }
                className="w-12 h-6 rounded-full transition relative"
                style={{
                  background: newWorkout.fromWatch ? F.sage : 'rgba(201,168,118,0.3)',
                }}
              >
                <div
                  className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                  style={{
                    background: F.cream,
                    left: newWorkout.fromWatch ? '26px' : '2px',
                  }}
                />
              </button>
            </div>

            <button
              onClick={saveWorkout}
              className="btn-rose w-full py-3 font-serif text-sm tracking-wider"
            >
              保存运动记录
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
