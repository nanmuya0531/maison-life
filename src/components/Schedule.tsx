import { useState, useEffect } from 'react';
import {
  Compass, Plus, Trash2, Check, X, Sunrise, Sun, Sunset, Moon,
  Coffee, BookOpen, Dumbbell, Heart, Briefcase, Users, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { storage, generateId, todayStr, formatDate, addRewardPoints } from '../store';
import { ScheduleBlock } from '../types';

const CATEGORY_CONFIG = {
  morning: { label: '晨间仪式', icon: <Sunrise size={16} />, color: '#C9A876', bg: 'rgba(201,168,118,0.08)' },
  work: { label: '工作创作', icon: <Briefcase size={16} />, color: '#4A3C32', bg: 'rgba(74,60,50,0.06)' },
  study: { label: '学习成长', icon: <BookOpen size={16} />, color: '#8B4555', bg: 'rgba(139,69,85,0.06)' },
  exercise: { label: '运动健身', icon: <Dumbbell size={16} />, color: '#8B9D83', bg: 'rgba(139,157,131,0.08)' },
  rest: { label: '休息放空', icon: <Coffee size={16} />, color: '#D4A5A5', bg: 'rgba(212,165,165,0.08)' },
  social: { label: '社交生活', icon: <Users size={16} />, color: '#6B5B95', bg: 'rgba(107,91,149,0.06)' },
  sleep: { label: '睡眠', icon: <Moon size={16} />, color: '#5A6B96', bg: 'rgba(90,107,150,0.08)' },
};

// 默认日程模板（07:30起床 到 23:00睡觉）
const DEFAULT_SCHEDULE: Omit<ScheduleBlock, 'id' | 'date' | 'completed'>[] = [
  { time: '07:30', endTime: '08:00', title: '晨间唤醒', category: 'morning', description: '拉伸、喝杯温水、打开窗帘' },
  { time: '08:00', endTime: '08:30', title: '早餐时光', category: 'morning', description: '好好吃早餐，看看窗外' },
  { time: '08:30', endTime: '09:00', title: '英语晨读', category: 'study', description: '30分钟英语学习' },
  { time: '09:00', endTime: '11:30', title: '深度工作', category: 'work', description: '自媒体创作/内容输出' },
  { time: '11:30', endTime: '12:00', title: '运动时间', category: 'exercise', description: '今日运动打卡' },
  { time: '12:00', endTime: '13:00', title: '午餐与休息', category: 'rest', description: '好好吃饭，小憩片刻' },
  { time: '13:00', endTime: '14:00', title: '资讯浏览', category: 'study', description: '刷最新资讯、热点追踪' },
  { time: '14:00', endTime: '16:00', title: '创作时间', category: 'work', description: '文案撰写/拍摄/剪辑' },
  { time: '16:00', endTime: '16:30', title: '下午茶歇', category: 'rest', description: '喝杯茶，放空一下' },
  { time: '16:30', endTime: '18:00', title: '学习成长', category: 'study', description: '阅读/课程学习' },
  { time: '18:00', endTime: '19:00', title: '晚餐', category: 'rest', description: '晚餐与家庭时光' },
  { time: '19:00', endTime: '20:00', title: '散步放空', category: 'rest', description: '出门走走，呼吸新鲜空气' },
  { time: '20:00', endTime: '21:00', title: '自由时光', category: 'social', description: '看剧/社交/兴趣爱好' },
  { time: '21:00', endTime: '22:00', title: '心灵疗愈', category: 'study', description: '冥想/情绪记录/占卜' },
  { time: '22:00', endTime: '22:30', title: '明日规划', category: 'morning', description: '写下明天三件重要的事' },
  { time: '22:30', endTime: '23:00', title: '睡前仪式', category: 'sleep', description: '护肤、调暗灯光、放下手机' },
  { time: '23:00', endTime: '07:30', title: '晚安好梦', category: 'sleep', description: '好好睡觉，明天见' },
];

export default function Schedule() {
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBlock, setNewBlock] = useState({
    time: '09:00',
    endTime: '10:00',
    title: '',
    category: 'work' as ScheduleBlock['category'],
    description: '',
  });

  useEffect(() => {
    const all = storage.getSchedule();
    if (all.length === 0) {
      const today = todayStr();
      const initialized = DEFAULT_SCHEDULE.map(item => ({
        ...item,
        id: generateId(),
        date: today,
        completed: false,
      }));
      storage.setSchedule(initialized);
      setBlocks(initialized);
    } else {
      setBlocks(all.filter(b => b.date === selectedDate));
    }
  }, [selectedDate]);

  // 如果当天没有日程，从模板复制
  useEffect(() => {
    if (blocks.length === 0) {
      const all = storage.getSchedule();
      const todayBlocks = all.filter(b => b.date === selectedDate);
      if (todayBlocks.length === 0 && selectedDate === todayStr()) {
        const initialized = DEFAULT_SCHEDULE.map(item => ({
          ...item,
          id: generateId(),
          date: selectedDate,
          completed: false,
        }));
        storage.setSchedule([...all, ...initialized]);
        setBlocks(initialized);
      }
    }
  }, [blocks, selectedDate]);

  const toggleBlock = (id: string) => {
    const all = storage.getSchedule();
    const block = all.find(b => b.id === id);
    const wasCompleted = block?.completed;
    const updated = all.map(b => b.id === id ? { ...b, completed: !b.completed } : b);
    storage.setSchedule(updated);
    setBlocks(updated.filter(b => b.date === selectedDate));
    if (!wasCompleted) {
      addRewardPoints('完成日程', 3);
    }
  };

  const deleteBlock = (id: string) => {
    const all = storage.getSchedule().filter(b => b.id !== id);
    storage.setSchedule(all);
    setBlocks(blocks.filter(b => b.id !== id));
  };

  const saveBlock = () => {
    if (!newBlock.title.trim()) return;
    const block: ScheduleBlock = {
      ...newBlock,
      id: generateId(),
      date: selectedDate,
      completed: false,
    };
    const all = storage.getSchedule();
    all.push(block);
    storage.setSchedule(all);
    setBlocks([...blocks, block].sort((a, b) => a.time.localeCompare(b.time)));
    setShowAddModal(false);
    setNewBlock({ time: '09:00', endTime: '10:00', title: '', category: 'work', description: '' });
  };

  const changeDate = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(formatDate(d));
  };

  const sortedBlocks = [...blocks].sort((a, b) => a.time.localeCompare(b.time));
  const completedCount = blocks.filter(b => b.completed).length;
  const progress = blocks.length > 0 ? Math.round((completedCount / blocks.length) * 100) : 0;

  const now = new Date();
  const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const isToday = selectedDate === todayStr();

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold" style={{ color: '#3D3530' }}>日程安排</h1>
          <p className="text-xs tracking-widest uppercase mt-1" style={{ color: '#B5A99A' }}>Emploi du Temps</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 glass rounded-lg p-0.5">
            <button onClick={() => changeDate(-1)} className="p-1.5 rounded-md hover:bg-white/40">
              <ChevronLeft size={16} style={{ color: '#7A6E62' }} />
            </button>
            <span className="px-3 text-sm font-medium" style={{ color: '#3D3530' }}>
              {isToday ? '今天' : selectedDate}
            </span>
            <button onClick={() => changeDate(1)} className="p-1.5 rounded-md hover:bg-white/40">
              <ChevronRight size={16} style={{ color: '#7A6E62' }} />
            </button>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-french flex items-center gap-1.5 px-3 py-2 text-sm"
          >
            <Plus size={16} />
            <span className="hidden md:inline">添加</span>
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="glass card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium" style={{ color: '#5A5048' }}>今日完成度</span>
          <span className="font-serif text-lg font-bold" style={{ color: '#8B4555' }}>{progress}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(201,168,118,0.15)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #C9A876, #8B4555)' }}
          />
        </div>
        <p className="text-xs mt-2" style={{ color: '#B5A99A' }}>{completedCount} / {blocks.length} 已完成</p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* 时间轴竖线 */}
        <div className="absolute left-[68px] top-0 bottom-0 w-px" style={{ background: 'rgba(201,168,118,0.2)' }} />

        <div className="space-y-3">
          {sortedBlocks.length === 0 ? (
            <div className="text-center py-16">
              <Compass size={40} className="mx-auto mb-3" style={{ color: '#C9A876', opacity: 0.4 }} />
              <p className="text-sm" style={{ color: '#B5A99A' }}>这一天还没有安排</p>
            </div>
          ) : (
            sortedBlocks.map(block => {
              const config = CATEGORY_CONFIG[block.category];
              const isCurrent = isToday && block.time <= currentTimeStr && block.endTime > currentTimeStr;
              const isPast = isToday && block.endTime < currentTimeStr;

              return (
                <div key={block.id} className="flex items-start gap-4 group">
                  {/* Time */}
                  <div className="w-14 flex-shrink-0 text-right pt-2">
                    <p className="text-sm font-medium" style={{ color: isPast && !block.completed ? '#B5A99A' : '#3D3530' }}>
                      {block.time}
                    </p>
                    <p className="text-[10px]" style={{ color: '#B5A99A' }}>{block.endTime}</p>
                  </div>

                  {/* Dot */}
                  <div className="relative flex-shrink-0 pt-3">
                    <button
                      onClick={() => toggleBlock(block.id)}
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                      style={{
                        borderColor: block.completed ? config.color : 'rgba(201,168,118,0.3)',
                        background: block.completed ? config.color : '#FAF7F2',
                      }}
                    >
                      {block.completed && <Check size={11} style={{ color: '#FAF7F2' }} />}
                    </button>
                    {isCurrent && (
                      <div
                        className="absolute -inset-1 rounded-full animate-pulse"
                        style={{ border: `1px solid ${config.color}`, opacity: 0.4 }}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div
                    className="flex-1 card p-3.5 card-hover"
                    style={{
                      background: config.bg,
                      borderColor: isCurrent ? config.color : 'rgba(201,168,118,0.12)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span style={{ color: config.color }}>{config.icon}</span>
                          <p
                            className="font-medium text-sm"
                            style={{
                              color: block.completed ? '#B5A99A' : '#3D3530',
                              textDecoration: block.completed ? 'line-through' : 'none',
                            }}
                          >
                            {block.title}
                          </p>
                          {isCurrent && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded tag-french" style={{ background: config.color, color: '#FAF7F2' }}>
                              进行中
                            </span>
                          )}
                        </div>
                        {block.description && (
                          <p className="text-xs ml-6" style={{ color: '#7A6E62' }}>{block.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => deleteBlock(block.id)}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 transition"
                        style={{ color: '#B5A99A' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="rounded-2xl w-full max-w-md p-6 animate-slide-up"
            style={{ background: '#FAF7F2', border: '1px solid rgba(201,168,118,0.2)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif text-lg font-bold" style={{ color: '#3D3530' }}>添加日程</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded hover:bg-white/40">
                <X size={18} style={{ color: '#7A6E62' }} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs tracking-wide uppercase block mb-1.5" style={{ color: '#B5A99A' }}>标题</label>
                <input
                  type="text"
                  value={newBlock.title}
                  onChange={e => setNewBlock({ ...newBlock, title: e.target.value })}
                  placeholder="要做什么？"
                  className="input-french w-full px-3 py-2.5 text-sm"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs tracking-wide uppercase block mb-1.5" style={{ color: '#B5A99A' }}>开始</label>
                  <input
                    type="time"
                    value={newBlock.time}
                    onChange={e => setNewBlock({ ...newBlock, time: e.target.value })}
                    className="input-french w-full px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs tracking-wide uppercase block mb-1.5" style={{ color: '#B5A99A' }}>结束</label>
                  <input
                    type="time"
                    value={newBlock.endTime}
                    onChange={e => setNewBlock({ ...newBlock, endTime: e.target.value })}
                    className="input-french w-full px-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs tracking-wide uppercase block mb-2" style={{ color: '#B5A99A' }}>分类</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(Object.keys(CATEGORY_CONFIG) as ScheduleBlock['category'][]).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setNewBlock({ ...newBlock, category: cat })}
                      className="p-2 rounded-lg flex flex-col items-center gap-1 transition"
                      style={{
                        background: newBlock.category === cat ? CATEGORY_CONFIG[cat].bg : 'rgba(255,255,255,0.4)',
                        border: `1px solid ${newBlock.category === cat ? CATEGORY_CONFIG[cat].color : 'transparent'}`,
                      }}
                    >
                      <span style={{ color: CATEGORY_CONFIG[cat].color }}>{CATEGORY_CONFIG[cat].icon}</span>
                      <span className="text-[10px]" style={{ color: '#5A5048' }}>{CATEGORY_CONFIG[cat].label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs tracking-wide uppercase block mb-1.5" style={{ color: '#B5A99A' }}>描述</label>
                <textarea
                  value={newBlock.description}
                  onChange={e => setNewBlock({ ...newBlock, description: e.target.value })}
                  placeholder="补充说明..."
                  rows={2}
                  className="input-french w-full px-3 py-2.5 text-sm resize-none"
                />
              </div>
            </div>

            <button
              onClick={saveBlock}
              disabled={!newBlock.title.trim()}
              className="btn-rose w-full py-2.5 text-sm mt-5 disabled:opacity-40"
            >
              添加到日程
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
