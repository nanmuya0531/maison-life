import { useState, useEffect } from 'react';
import {
  Flame, Droplet, Moon, Dumbbell, BookOpen, Heart, Clock,
  CheckCircle2, Circle, ArrowRight, Sparkles, TrendingUp, Coffee,
} from 'lucide-react';
import { storage, todayStr } from '../store';
import { Meal, Task, Mood, Habit, Workout, SleepRecord, EnglishLesson, ScheduleBlock } from '../types';

interface DashboardProps {
  habits: Habit[];
  onToggleHabit: (habitId: string) => void;
  rewardPoints: number;
  onNavigate: (tab: string) => void;
}

const habitIcons: Record<string, React.ReactNode> = {
  BookOpen: <BookOpen size={16} />,
  Dumbbell: <Dumbbell size={16} />,
  Heart: <Heart size={16} />,
  Moon: <Moon size={16} />,
};

export default function Dashboard({ habits, onToggleHabit, rewardPoints, onNavigate }: DashboardProps) {
  const [todayMeals, setTodayMeals] = useState<Meal[]>([]);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [todayMood, setTodayMood] = useState<Mood | null>(null);
  const [todayWorkouts, setTodayWorkouts] = useState<Workout[]>([]);
  const [todaySleep, setTodaySleep] = useState<SleepRecord | null>(null);
  const [todayEnglish, setTodayEnglish] = useState<EnglishLesson[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<ScheduleBlock[]>([]);
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 6) setGreeting('夜深了，愿你有个好梦');
      else if (hour < 11) setGreeting('早安，今天也是崭新的一天');
      else if (hour < 14) setGreeting('午安，记得好好吃饭');
      else if (hour < 18) setGreeting('下午好，慢慢来，比较快');
      else if (hour < 22) setGreeting('晚上好，今天辛苦了');
      else setGreeting('该准备休息了');
    };

    updateGreeting();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);

    const today = todayStr();
    setTodayMeals(storage.getMeals().filter(m => m.date === today));
    setTodayTasks(storage.getTasks().filter(t => t.date === today));
    const moods = storage.getMoods().filter(m => m.createdAt.startsWith(today));
    setTodayMood(moods[moods.length - 1] || null);
    setTodayWorkouts(storage.getWorkouts().filter(w => w.date === today));
    const sleepRecords = storage.getSleepRecords().filter(s => s.date === today);
    setTodaySleep(sleepRecords[sleepRecords.length - 1] || null);
    setTodayEnglish(storage.getEnglishLessons().filter(e => e.date === today));
    setTodaySchedule(storage.getSchedule().filter(s => s.date === today));

    return () => clearInterval(timer);
  }, []);

  const totalCalories = todayMeals.reduce((s, m) => s + m.calories, 0);
  const totalWater = todayMeals.reduce((s, m) => s + m.water, 0);
  const completedTasks = todayTasks.filter(t => t.completed).length;
  const workoutDuration = todayWorkouts.reduce((s, w) => s + w.duration, 0);
  const englishDone = todayEnglish.filter(e => e.completed).length;

  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  const weekDayNames = ['日', '一', '二', '三', '四', '五', '六'];
  const dateStr = `${now.getMonth() + 1}月${now.getDate()}日 · 星期${weekDayNames[now.getDay()]}`;

  // 今日下一个待办
  const nextSchedule = todaySchedule
    .filter(s => !s.completed && s.time >= timeStr)
    .sort((a, b) => a.time.localeCompare(b.time))[0];

  const stats = [
    { label: '摄入', value: totalCalories, unit: '千卡', icon: <Flame size={16} />, color: '#C9A876', tab: null },
    { label: '饮水', value: totalWater, unit: 'ml', icon: <Droplet size={16} />, color: '#5A6B96', tab: null },
    { label: '运动', value: workoutDuration, unit: '分钟', icon: <Dumbbell size={16} />, color: '#8B9D83', tab: 'fitness' },
    { label: '睡眠', value: todaySleep ? todaySleep.duration.toFixed(1) : '—', unit: '小时', icon: <Moon size={16} />, color: '#6B5B95', tab: 'sleep' },
    { label: '英语', value: `${englishDone}`, unit: '课', icon: <BookOpen size={16} />, color: '#8B4555', tab: 'english' },
    { label: '任务', value: `${completedTasks}/${todayTasks.length}`, unit: '', icon: <CheckCircle2 size={16} />, color: '#4A3C32', tab: null },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting */}
      <div className="glass card p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-10" style={{ background: '#C9A876' }} />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs tracking-widest uppercase" style={{ color: '#B5A99A' }}>{dateStr}</p>
            <p className="text-xs tracking-wider" style={{ color: '#B5A99A' }}>{timeStr}</p>
          </div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold mb-2" style={{ color: '#3D3530' }}>{greeting}</h1>
          <p className="text-sm" style={{ color: '#7A6E62' }}>坚持是最优雅的力量 · 今日积分 <span className="font-serif font-bold" style={{ color: '#8B4555' }}>{rewardPoints}</span></p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {stats.map((stat, idx) => (
          <button
            key={idx}
            onClick={() => stat.tab && onNavigate(stat.tab)}
            className="glass card card-hover p-4 text-left"
          >
            <div className="flex items-center gap-1.5 mb-2">
              <span style={{ color: stat.color }}>{stat.icon}</span>
              <span className="text-[11px] tracking-wide" style={{ color: '#B5A99A' }}>{stat.label}</span>
            </div>
            <p className="font-serif text-xl font-bold" style={{ color: '#3D3530' }}>{stat.value}</p>
            <p className="text-[10px]" style={{ color: '#B5A99A' }}>{stat.unit}</p>
          </button>
        ))}
      </div>

      {/* Habits */}
      <div className="glass card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-base font-bold" style={{ color: '#3D3530' }}>今日习惯</h2>
          <span className="text-xs" style={{ color: '#B5A99A' }}>轻触打卡</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {habits.map(habit => {
            const done = habit.history.includes(todayStr());
            return (
              <button
                key={habit.id}
                onClick={() => onToggleHabit(habit.id)}
                className={`p-3 rounded-xl transition-all ${done ? 'shadow-sm' : 'hover:shadow-sm'}`}
                style={{
                  background: done ? 'linear-gradient(135deg, #8B9D83, #6B7D63)' : 'rgba(255,255,255,0.5)',
                  border: done ? 'none' : '1px solid rgba(201,168,118,0.12)',
                }}
              >
                <div className="flex flex-col items-center gap-1.5">
                  <span style={{ color: done ? '#FAF7F2' : '#7A6E62' }}>
                    {habitIcons[habit.icon] || <Circle size={16} />}
                  </span>
                  <span className="text-xs font-medium" style={{ color: done ? '#FAF7F2' : '#5A5048' }}>{habit.name}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Next Up + Quick Links */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Next Schedule */}
        <div className="glass card p-5">
          <h2 className="font-serif text-base font-bold mb-3" style={{ color: '#3D3530' }}>下一件事</h2>
          {nextSchedule ? (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #F0EAE0, #E8E2D9)' }}>
                <Clock size={20} style={{ color: '#8B4555' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium" style={{ color: '#3D3530' }}>{nextSchedule.title}</p>
                <p className="text-xs" style={{ color: '#B5A99A' }}>{nextSchedule.time} - {nextSchedule.endTime}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.5)' }}>
                <Sparkles size={20} style={{ color: '#C9A876' }} />
              </div>
              <div>
                <p className="text-sm" style={{ color: '#7A6E62' }}>今日日程已清空</p>
                <button onClick={() => onNavigate('schedule')} className="text-xs flex items-center gap-1 mt-0.5" style={{ color: '#8B4555' }}>
                  去安排明天 <ArrowRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mood Today */}
        <div className="glass card p-5">
          <h2 className="font-serif text-base font-bold mb-3" style={{ color: '#3D3530' }}>今日心境</h2>
          {todayMood ? (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #D4A5A5, #C9A876)' }}>
                <Heart size={20} style={{ color: '#FAF7F2' }} />
              </div>
              <div>
                <p className="font-medium" style={{ color: '#3D3530' }}>{todayMood.type}</p>
                <p className="text-xs" style={{ color: '#B5A99A' }}>能量 {todayMood.energy}/5</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.5)' }}>
                <Heart size={20} style={{ color: '#C9A876' }} />
              </div>
              <div>
                <p className="text-sm" style={{ color: '#7A6E62' }}>尚未记录今日心情</p>
                <button onClick={() => onNavigate('soul')} className="text-xs flex items-center gap-1 mt-0.5" style={{ color: '#8B4555' }}>
                  去记录 <ArrowRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Navigate */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { tab: 'schedule', label: '日程安排', icon: <Clock size={18} />, desc: '今日时间轴' },
          { tab: 'media', label: '自媒体中心', icon: <Sparkles size={18} />, desc: '资讯与创作' },
          { tab: 'sleep', label: '睡眠管理', icon: <Moon size={18} />, desc: '作息与奖励' },
          { tab: 'local', label: '本地信息', icon: <TrendingUp size={18} />, desc: '西安招聘房价' },
        ].map(item => (
          <button
            key={item.tab}
            onClick={() => onNavigate(item.tab)}
            className="glass card card-hover p-4 text-left"
          >
            <div className="flex items-center justify-between mb-2">
              <span style={{ color: '#8B4555' }}>{item.icon}</span>
              <ArrowRight size={14} style={{ color: '#C9A876' }} />
            </div>
            <p className="font-serif text-sm font-bold" style={{ color: '#3D3530' }}>{item.label}</p>
            <p className="text-[11px]" style={{ color: '#B5A99A' }}>{item.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
