import { useState, useEffect, useMemo } from 'react';
import {
  Moon,
  Sun,
  Star,
  Plus,
  X,
  Clock,
  Sparkles,
  BedDouble,
  Bath,
  BookOpen,
  Coffee,
  Flower2,
  TrendingUp,
  Award,
  Heart,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { storage, addRewardPoints, generateId, todayStr, formatDate } from '../store';
import { SleepRecord } from '../types';

// 理想作息
const TARGET_BEDTIME = '23:00';
const TARGET_WAKE = '07:30';
const IDEAL_SLEEP_HOURS = 8.5;

// 法式配色
const C = {
  cream: '#FAF7F2',
  beige: '#F0EAE0',
  roseGold: '#C9A876',
  deepBrown: '#4A3C32',
  wine: '#8B4555',
  sage: '#8B9D83',
  indigo: '#5A6B96',
  mist: '#E8E2D9',
  ink: '#3D3530',
  muted: '#7A6E62',
  soft: '#B5A99A',
};

// 睡眠提醒
const REMINDERS = [
  {
    time: '22:00',
    title: '该准备入睡了',
    desc: '结束一日的事务，让心绪慢慢沉静',
    Icon: Moon,
  },
  {
    time: '22:30',
    title: '放下手机，调暗灯光',
    desc: '一盏暖灯，一段轻柔的乐，向屏幕告别',
    Icon: Sparkles,
  },
  {
    time: '23:00',
    title: '晚安，好梦',
    desc: '闭上眼，让夜色温柔地将你拥抱',
    Icon: BedDouble,
  },
  {
    time: '07:30',
    title: '早安，新的一天',
    desc: '阳光已至，伸个懒腰，迎接清晨',
    Icon: Sun,
  },
];

// 法式助眠小贴士
const SLEEP_TIPS = [
  {
    title: '薰衣草精油',
    desc: '枕畔滴一两滴薰衣草精油，让普罗旺斯的气息伴你入眠',
    Icon: Flower2,
  },
  {
    title: '温水沐浴',
    desc: '睡前一小时泡个温水澡，让身体在余温中缓缓入梦',
    Icon: Bath,
  },
  {
    title: '阅读纸质书',
    desc: '一本诗集或散文，远离屏幕的微光，与文字共度良宵',
    Icon: BookOpen,
  },
  {
    title: '一杯洋甘菊茶',
    desc: '温热的茶汤抚慰心神，那是南法午后般的宁静',
    Icon: Coffee,
  },
];

const QUALITY_LABELS = ['', '辗转难眠', '时睡时醒', '尚可', '安稳舒展', '一夜好梦'];

interface SleepProps {
  onPointsEarned: () => void;
}

// 时间工具
function parseTime(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function calcDuration(bedtime: string, wakeTime: string): number {
  const bed = parseTime(bedtime);
  const wake = parseTime(wakeTime);
  let diff = wake - bed;
  if (diff <= 0) diff += 24 * 60;
  return diff / 60;
}

function formatDuration(hours: number): string {
  if (hours <= 0) return '0小时';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}小时`;
  return `${h}小时${m}分`;
}

function minutesOfDay(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

function isMetTarget(rec: SleepRecord): boolean {
  return (
    parseTime(rec.bedtime) <= parseTime(TARGET_BEDTIME) &&
    parseTime(rec.wakeTime) <= parseTime(TARGET_WAKE)
  );
}

export default function Sleep({ onPointsEarned }: SleepProps) {
  const [records, setRecords] = useState<SleepRecord[]>([]);
  const [now, setNow] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState<{ msg: string; points: number } | null>(null);
  const [form, setForm] = useState({
    date: todayStr(),
    bedtime: '23:00',
    wakeTime: '07:30',
    quality: 4,
    note: '',
  });

  useEffect(() => {
    setRecords(storage.getSleepRecords());
    const timer = setInterval(() => setNow(new Date()), 30 * 1000);
    return () => clearInterval(timer);
  }, []);

  const today = todayStr();

  // 今日 & 昨晚记录
  const todayRecord = useMemo(
    () => records.find(r => r.date === today),
    [records, today]
  );

  const lastNightRecord = useMemo(() => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return records.find(r => r.date === formatDate(y));
  }, [records]);

  // 进度环所参考的记录：优先今日，其次昨晚
  const ringRecord = todayRecord || lastNightRecord;
  const ringPct = ringRecord
    ? Math.min(ringRecord.duration / IDEAL_SLEEP_HOURS, 1)
    : 0;

  // 今日距离目标的差距文案
  const gapInfo = useMemo(() => {
    if (todayRecord) {
      const diff = todayRecord.duration - IDEAL_SLEEP_HOURS;
      if (diff >= 0) {
        return { text: `今日已超目标 ${diff.toFixed(1)} 小时，优雅至极`, tone: 'good' };
      }
      return { text: `距目标还差 ${(-diff).toFixed(1)} 小时，再接再厉`, tone: 'warn' };
    }
    const nowMin = minutesOfDay(now);
    const bedMin = parseTime(TARGET_BEDTIME);
    const wakeMin = parseTime(TARGET_WAKE);
    // 睡眠时段（23:00 之后到 07:30 之前）
    if (nowMin >= bedMin || nowMin < wakeMin) {
      return { text: '夜深了，愿你正在好梦之中', tone: 'sleep' };
    }
    let mins = bedMin - nowMin;
    if (mins <= 60) {
      return { text: `距离入睡还有 ${mins} 分钟，开始准备吧`, tone: 'soon' };
    }
    return { text: `距离入睡还有 ${formatDuration(mins / 60)}`, tone: 'idle' };
  }, [todayRecord, now]);

  // 近7天数据
  const last7Days = useMemo(() => {
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = formatDate(d);
      const rec = records.find(r => r.date === dateStr);
      return {
        date: dateStr,
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        weekday: weekdays[d.getDay()],
        isToday: dateStr === today,
        duration: rec?.duration ?? 0,
        record: rec,
      };
    });
  }, [records, today]);

  const maxHours = Math.max(IDEAL_SLEEP_HOURS + 1, ...last7Days.map(d => d.duration), 1);

  // 周统计
  const weekStats = useMemo(() => {
    const valid = last7Days.filter(d => d.duration > 0);
    const avg =
      valid.length > 0
        ? valid.reduce((s, d) => s + d.duration, 0) / valid.length
        : 0;
    const metCount = valid.filter(d => d.duration >= IDEAL_SLEEP_HOURS).length;
    return { avg, metCount, total: valid.length };
  }, [last7Days]);

  // 提醒状态
  const nowMin = minutesOfDay(now);
  const getReminderStatus = (time: string): 'arrived' | 'pending' =>
    nowMin >= parseTime(time) ? 'arrived' : 'pending';

  // 保存记录 + 奖励逻辑
  const saveRecord = () => {
    const duration = calcDuration(form.bedtime, form.wakeTime);
    const record: SleepRecord = {
      id: generateId(),
      date: form.date,
      bedtime: form.bedtime,
      wakeTime: form.wakeTime,
      duration,
      quality: form.quality,
      note: form.note.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    const all = storage.getSleepRecords();
    const filtered = all.filter(r => r.date !== form.date);
    filtered.push(record);
    storage.setSleepRecords(filtered);
    setRecords(filtered);

    // —— 奖励计算（以 sleep date 嵌入 action 字符串，避免同日重复发放）——
    const makeAction = (label: string) => `${label}（${form.date}）`;
    const history = storage.getRewardPoints().history;
    const already = (label: string) =>
      history.some(h => h.action === makeAction(label));

    const earned: string[] = [];
    let total = 0;

    // 23点前入睡 +20
    if (
      parseTime(form.bedtime) <= parseTime(TARGET_BEDTIME) &&
      !already('早睡达标')
    ) {
      addRewardPoints(makeAction('早睡达标：23点前入睡'), 20);
      earned.push('早睡 +20');
      total += 20;
    }
    // 7:30前起床 +20
    if (
      parseTime(form.wakeTime) <= parseTime(TARGET_WAKE) &&
      !already('早起达标')
    ) {
      addRewardPoints(makeAction('早起达标：7:30前起床'), 20);
      earned.push('早起 +20');
      total += 20;
    }
    // 睡眠质量4星以上 +10
    if (form.quality >= 4 && !already('优质睡眠')) {
      addRewardPoints(makeAction('优质睡眠：4星以上'), 10);
      earned.push('优质 +10');
      total += 10;
    }
    // 连续3天达标 +50 bonus（含今日向前回溯3天）
    const base = new Date(form.date);
    const d2 = new Date(base);
    d2.setDate(d2.getDate() - 1);
    const d3 = new Date(base);
    d3.setDate(d3.getDate() - 2);
    const dateStrs = [form.date, formatDate(d2), formatDate(d3)];
    const allMet = dateStrs.every(d => {
      const rec = filtered.find(r => r.date === d);
      return rec ? isMetTarget(rec) : false;
    });
    if (allMet && !already('连续3天达标')) {
      addRewardPoints(makeAction('连续3天达标 bonus'), 50);
      earned.push('连续3天 +50');
      total += 50;
    }

    if (total > 0) {
      onPointsEarned();
      setToast({ msg: earned.join(' · '), points: total });
      setTimeout(() => setToast(null), 4500);
    }

    setShowAddModal(false);
    setForm({
      date: todayStr(),
      bedtime: '23:00',
      wakeTime: '07:30',
      quality: 4,
      note: '',
    });
  };

  const deleteRecord = (id: string) => {
    const all = storage.getSleepRecords().filter(r => r.id !== id);
    storage.setSleepRecords(all);
    setRecords(all);
  };

  const openModal = () => {
    setForm({
      date: todayStr(),
      bedtime: '23:00',
      wakeTime: '07:30',
      quality: 4,
      note: '',
    });
    setShowAddModal(true);
  };

  const previewDuration = useMemo(
    () => calcDuration(form.bedtime, form.wakeTime),
    [form.bedtime, form.wakeTime]
  );

  const sortedRecent = useMemo(
    () =>
      [...records].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7),
    [records]
  );

  // 进度环 SVG 参数
  const RADIUS = 56;
  const STROKE = 8;
  const CIRCUM = 2 * Math.PI * RADIUS;
  const ringOffset = CIRCUM * (1 - ringPct);

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: C.soft }}>
            Le Sommeil
          </p>
          <h1
            className="text-3xl font-serif font-bold flex items-center gap-3"
            style={{ color: C.deepBrown }}
          >
            <Moon size={26} style={{ color: C.indigo }} />
            睡眠管理
          </h1>
          <p className="text-sm mt-2" style={{ color: C.muted }}>
            温柔入眠，优雅醒来 · 一夜好梦，是给明天最好的礼物
          </p>
        </div>
        <button
          onClick={openModal}
          className="btn-rose px-5 py-2.5 text-sm font-medium flex items-center gap-2 self-start md:self-auto"
        >
          <Plus size={16} />
          记录睡眠
        </button>
      </div>

      <div className="divider-french" />

      {/* 目标作息 + 进度环 */}
      <div className="glass card card-hover rounded-2xl p-8">
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 items-center">
          {/* 进度环 */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <svg width="160" height="160" viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r={RADIUS}
                  fill="none"
                  stroke="rgba(201,168,118,0.15)"
                  strokeWidth={STROKE}
                />
                <circle
                  cx="80"
                  cy="80"
                  r={RADIUS}
                  fill="none"
                  stroke="url(#sleepGrad)"
                  strokeWidth={STROKE}
                  strokeDasharray={CIRCUM}
                  strokeDashoffset={ringOffset}
                  strokeLinecap="round"
                  transform="rotate(-90 80 80)"
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                />
                <defs>
                  <linearGradient id="sleepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#5A6B96" />
                    <stop offset="100%" stopColor="#8B9D83" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {ringRecord ? (
                  <>
                    <span
                      className="text-3xl font-serif font-bold"
                      style={{ color: C.deepBrown }}
                    >
                      {ringRecord.duration.toFixed(1)}
                    </span>
                    <span className="text-[10px] tracking-widest" style={{ color: C.soft }}>
                      小时 · HOURS
                    </span>
                  </>
                ) : (
                  <>
                    <Moon size={28} style={{ color: C.soft }} />
                    <span className="text-xs mt-2" style={{ color: C.soft }}>
                      尚未记录
                    </span>
                  </>
                )}
              </div>
            </div>
            <p className="text-xs mt-3 text-center" style={{ color: C.muted }}>
              {ringRecord
                ? `目标 ${IDEAL_SLEEP_HOURS}h · 完成 ${Math.round(ringPct * 100)}%`
                : '期待你的第一次记录'}
            </p>
          </div>

          {/* 目标信息 */}
          <div>
            <h2 className="font-serif text-xl mb-1" style={{ color: C.deepBrown }}>
              今日理想作息
            </h2>
            <p className="text-sm mb-5" style={{ color: C.muted }}>
              夜阑人静，晨光微熹 · 让节律成为身体的诗意
            </p>

            <div className="grid grid-cols-3 gap-4 mb-5">
              <div
                className="text-center p-4 rounded-xl"
                style={{ background: 'rgba(90,107,150,0.08)' }}
              >
                <Moon size={20} className="mx-auto mb-2" style={{ color: C.indigo }} />
                <p className="text-[10px] tracking-widest uppercase" style={{ color: C.soft }}>
                  Bedtime
                </p>
                <p
                  className="text-lg font-serif font-bold mt-1"
                  style={{ color: C.deepBrown }}
                >
                  {TARGET_BEDTIME}
                </p>
                <p className="text-xs" style={{ color: C.muted }}>
                  入睡
                </p>
              </div>
              <div
                className="text-center p-4 rounded-xl"
                style={{ background: 'rgba(139,157,131,0.08)' }}
              >
                <Sun size={20} className="mx-auto mb-2" style={{ color: C.sage }} />
                <p className="text-[10px] tracking-widest uppercase" style={{ color: C.soft }}>
                  Wake Up
                </p>
                <p
                  className="text-lg font-serif font-bold mt-1"
                  style={{ color: C.deepBrown }}
                >
                  {TARGET_WAKE}
                </p>
                <p className="text-xs" style={{ color: C.muted }}>
                  起床
                </p>
              </div>
              <div
                className="text-center p-4 rounded-xl"
                style={{ background: 'rgba(201,168,118,0.08)' }}
              >
                <Clock size={20} className="mx-auto mb-2" style={{ color: C.roseGold }} />
                <p className="text-[10px] tracking-widest uppercase" style={{ color: C.soft }}>
                  Ideal
                </p>
                <p
                  className="text-lg font-serif font-bold mt-1"
                  style={{ color: C.deepBrown }}
                >
                  {IDEAL_SLEEP_HOURS}h
                </p>
                <p className="text-xs" style={{ color: C.muted }}>
                  理想睡眠
                </p>
              </div>
            </div>

            <div
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{ background: 'rgba(250,247,242,0.7)' }}
            >
              <Sparkles size={18} style={{ color: C.wine }} />
              <span className="text-sm" style={{ color: C.ink }}>
                {gapInfo.text}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 睡眠提醒时间轴 */}
      <div>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-serif text-lg" style={{ color: C.deepBrown }}>
            温柔提醒
          </h2>
          <p className="text-xs" style={{ color: C.soft }}>
            当前时刻 · {String(now.getHours()).padStart(2, '0')}:
            {String(now.getMinutes()).padStart(2, '0')}
          </p>
        </div>
        <div className="glass card card-hover rounded-2xl p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {REMINDERS.map((r, idx) => {
              const isArrived = getReminderStatus(r.time) === 'arrived';
              return (
                <div key={r.time} className="relative">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: isArrived
                          ? 'linear-gradient(135deg,#5A6B96,#8B9D83)'
                          : 'rgba(201,168,118,0.12)',
                        color: isArrived ? C.cream : C.soft,
                      }}
                    >
                      <r.Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-sm font-serif font-bold"
                          style={{ color: C.deepBrown }}
                        >
                          {r.time}
                        </span>
                        {isArrived ? (
                          <span
                            className="tag-french"
                            style={{ background: 'rgba(139,157,131,0.15)', color: C.sage }}
                          >
                            <CheckCircle2 size={11} className="inline mr-0.5" />
                            已到
                          </span>
                        ) : (
                          <span
                            className="tag-french"
                            style={{ background: 'rgba(201,168,118,0.15)', color: C.roseGold }}
                          >
                            待提醒
                          </span>
                        )}
                      </div>
                      <p className="text-sm mt-1" style={{ color: C.ink }}>
                        {r.title}
                      </p>
                      <p className="text-xs mt-1 leading-relaxed" style={{ color: C.muted }}>
                        {r.desc}
                      </p>
                    </div>
                  </div>
                  {idx < REMINDERS.length - 1 && (
                    <div
                      className="hidden lg:block absolute top-5 -right-2.5 w-5 h-px"
                      style={{ background: 'rgba(201,168,118,0.3)' }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 7天睡眠趋势 */}
      <div>
        <div className="flex items-baseline justify-between mb-4">
          <h2
            className="font-serif text-lg flex items-center gap-2"
            style={{ color: C.deepBrown }}
          >
            <TrendingUp size={18} style={{ color: C.sage }} />
            近七日睡眠轨迹
          </h2>
          <div className="flex items-center gap-4 text-xs" style={{ color: C.muted }}>
            <span>
              平均{' '}
              <span className="font-serif font-bold" style={{ color: C.deepBrown }}>
                {weekStats.avg.toFixed(1)}h
              </span>
            </span>
            <span>
              达标{' '}
              <span className="font-serif font-bold" style={{ color: C.sage }}>
                {weekStats.metCount}
              </span>
              /{weekStats.total || 7}
            </span>
          </div>
        </div>
        <div className="glass card card-hover rounded-2xl p-6">
          <div className="relative" style={{ height: '200px' }}>
            {/* 目标线 */}
            <div
              className="absolute left-0 right-0 z-10 pointer-events-none"
              style={{ bottom: `${(IDEAL_SLEEP_HOURS / maxHours) * 100}%` }}
            >
              <div className="border-t border-dashed" style={{ borderColor: C.wine }} />
              <span
                className="absolute -top-2.5 right-0 text-[10px] px-2 py-0.5 rounded"
                style={{ background: C.cream, color: C.wine }}
              >
                目标 {IDEAL_SLEEP_HOURS}h
              </span>
            </div>
            {/* 柱状图 */}
            <div className="absolute inset-0 flex items-end gap-3">
              {last7Days.map(day => {
                const isMet = day.duration >= IDEAL_SLEEP_HOURS;
                const heightPct = maxHours > 0 ? (day.duration / maxHours) * 100 : 0;
                return (
                  <div
                    key={day.date}
                    className="flex-1 h-full flex flex-col items-center justify-end"
                  >
                    <div
                      className="text-[10px] mb-1 font-medium"
                      style={{
                        color:
                          day.duration > 0
                            ? isMet
                              ? C.sage
                              : C.wine
                            : C.soft,
                      }}
                    >
                      {day.duration > 0 ? `${day.duration.toFixed(1)}h` : '—'}
                    </div>
                    <div
                      className="w-full rounded-t-md transition-all duration-500"
                      style={{
                        height: `${heightPct}%`,
                        background:
                          day.duration <= 0
                            ? 'rgba(201,168,118,0.1)'
                            : isMet
                              ? 'linear-gradient(to top, #8B9D83, #A8B893)'
                              : 'linear-gradient(to top, #C9A876, #D4A5A5)',
                        minHeight: day.duration > 0 ? '6px' : '2px',
                        boxShadow: day.isToday ? `0 0 0 2px ${C.wine}33` : 'none',
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex gap-3 mt-3">
            {last7Days.map(day => (
              <div key={day.date} className="flex-1 text-center">
                <div
                  className="text-xs font-medium"
                  style={{ color: day.isToday ? C.wine : C.ink }}
                >
                  {day.label}
                </div>
                <div className="text-[10px]" style={{ color: C.soft }}>
                  周{day.weekday}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 助眠建议 */}
      <div>
        <h2
          className="font-serif text-lg mb-4 flex items-center gap-2"
          style={{ color: C.deepBrown }}
        >
          <Heart size={18} style={{ color: C.wine }} />
          法式助眠小贴士
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SLEEP_TIPS.map((tip, idx) => (
            <div key={tip.title} className="glass card card-hover rounded-2xl p-5">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center mb-3"
                style={{
                  background: 'linear-gradient(135deg, #F0EAE0, #E8E2D9)',
                  color: C.wine,
                }}
              >
                <tip.Icon size={20} />
              </div>
              <p
                className="text-[10px] tracking-widest uppercase mb-1"
                style={{ color: C.soft }}
              >
                No. {String(idx + 1).padStart(2, '0')}
              </p>
              <h3 className="font-serif text-base mb-2" style={{ color: C.deepBrown }}>
                {tip.title}
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: C.muted }}>
                {tip.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 近期睡眠记录 */}
      <div>
        <h2
          className="font-serif text-lg mb-4 flex items-center gap-2"
          style={{ color: C.deepBrown }}
        >
          <Calendar size={18} style={{ color: C.roseGold }} />
          睡眠手账
        </h2>
        <div className="glass card card-hover rounded-2xl p-6">
          {sortedRecent.length === 0 ? (
            <div className="text-center py-12">
              <Moon size={36} className="mx-auto mb-3" style={{ color: C.soft }} />
              <p className="text-sm" style={{ color: C.muted }}>
                还没有睡眠记录
              </p>
              <p className="text-xs mt-1" style={{ color: C.soft }}>
                从今晚开始，写下你的第一夜
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedRecent.map(rec => {
                const isMet = isMetTarget(rec);
                return (
                  <div
                    key={rec.id}
                    className="group flex items-start gap-4 p-4 rounded-xl transition"
                    style={{ background: 'rgba(255,255,255,0.5)' }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                      style={{
                        background: isMet
                          ? 'linear-gradient(135deg,#8B9D83,#6B7D63)'
                          : 'linear-gradient(135deg,#C9A876,#8B4555)',
                        color: C.cream,
                      }}
                    >
                      <Moon size={14} />
                      <span className="text-[10px] mt-0.5">{rec.duration.toFixed(1)}h</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-sm font-serif font-bold"
                          style={{ color: C.deepBrown }}
                        >
                          {rec.date}
                        </span>
                        {rec.date === today && (
                          <span
                            className="tag-french"
                            style={{ background: 'rgba(139,69,85,0.12)', color: C.wine }}
                          >
                            今日
                          </span>
                        )}
                        {isMet && (
                          <span
                            className="tag-french"
                            style={{ background: 'rgba(139,157,131,0.15)', color: C.sage }}
                          >
                            <Award size={11} className="inline mr-0.5" />
                            达标
                          </span>
                        )}
                      </div>
                      <div
                        className="flex items-center gap-3 mt-1 text-xs"
                        style={{ color: C.muted }}
                      >
                        <span className="flex items-center gap-1">
                          <Moon size={11} /> {rec.bedtime}
                        </span>
                        <span>→</span>
                        <span className="flex items-center gap-1">
                          <Sun size={11} /> {rec.wakeTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} /> {formatDuration(rec.duration)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            fill={i < rec.quality ? C.roseGold : 'none'}
                            style={{ color: i < rec.quality ? C.roseGold : C.mist }}
                          />
                        ))}
                        <span className="text-xs ml-1" style={{ color: C.soft }}>
                          {QUALITY_LABELS[rec.quality]}
                        </span>
                      </div>
                      {rec.note && (
                        <p className="text-xs mt-2 italic" style={{ color: C.muted }}>
                          “{rec.note}”
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteRecord(rec.id)}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition"
                      style={{ color: C.soft }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 添加睡眠记录 Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="rounded-3xl w-full max-w-md p-7 animate-slide-up max-h-[90vh] overflow-y-auto"
            style={{ background: C.cream, border: '1px solid rgba(201,168,118,0.2)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] tracking-[0.3em] uppercase" style={{ color: C.soft }}>
                  Bonsoir
                </p>
                <h2
                  className="text-xl font-serif font-bold mt-1"
                  style={{ color: C.deepBrown }}
                >
                  记录今夜的梦
                </h2>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg"
                style={{ color: C.muted }}
              >
                <X size={20} />
              </button>
            </div>

            {/* 日期 */}
            <div className="mb-4">
              <label
                className="text-xs tracking-widest uppercase block mb-2"
                style={{ color: C.soft }}
              >
                日期
              </label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                className="input-french w-full px-4 py-2.5 text-sm"
              />
            </div>

            {/* 入睡 & 起床 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label
                  className="text-xs tracking-widest uppercase block mb-2"
                  style={{ color: C.soft }}
                >
                  <Moon size={11} className="inline mr-1" />
                  入睡时间
                </label>
                <input
                  type="time"
                  value={form.bedtime}
                  onChange={e => setForm({ ...form, bedtime: e.target.value })}
                  className="input-french w-full px-4 py-2.5 text-sm"
                />
              </div>
              <div>
                <label
                  className="text-xs tracking-widest uppercase block mb-2"
                  style={{ color: C.soft }}
                >
                  <Sun size={11} className="inline mr-1" />
                  起床时间
                </label>
                <input
                  type="time"
                  value={form.wakeTime}
                  onChange={e => setForm({ ...form, wakeTime: e.target.value })}
                  className="input-french w-full px-4 py-2.5 text-sm"
                />
              </div>
            </div>

            {/* 自动计算时长 */}
            <div
              className="mb-4 p-3 rounded-xl flex items-center justify-between"
              style={{ background: 'rgba(90,107,150,0.08)' }}
            >
              <span className="text-xs tracking-widest uppercase" style={{ color: C.soft }}>
                睡眠时长
              </span>
              <span className="font-serif font-bold" style={{ color: C.indigo }}>
                {formatDuration(previewDuration)}
                <span className="text-xs ml-2 font-normal" style={{ color: C.muted }}>
                  {previewDuration >= IDEAL_SLEEP_HOURS
                    ? '已达成目标 ✓'
                    : `差 ${(IDEAL_SLEEP_HOURS - previewDuration).toFixed(1)}h`}
                </span>
              </span>
            </div>

            {/* 睡眠质量 */}
            <div className="mb-4">
              <label
                className="text-xs tracking-widest uppercase block mb-2"
                style={{ color: C.soft }}
              >
                睡眠质量
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {Array.from({ length: 5 }).map((_, i) => {
                  const n = i + 1;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setForm({ ...form, quality: n })}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        size={26}
                        fill={n <= form.quality ? C.roseGold : 'none'}
                        style={{ color: n <= form.quality ? C.roseGold : C.mist }}
                      />
                    </button>
                  );
                })}
                <span className="text-sm ml-2" style={{ color: C.muted }}>
                  {QUALITY_LABELS[form.quality]}
                </span>
              </div>
            </div>

            {/* 备注 */}
            <div className="mb-5">
              <label
                className="text-xs tracking-widest uppercase block mb-2"
                style={{ color: C.soft }}
              >
                夜之絮语
              </label>
              <textarea
                value={form.note}
                onChange={e => setForm({ ...form, note: e.target.value })}
                placeholder="今夜的梦，今夜的心情..."
                rows={3}
                className="input-french w-full px-4 py-2.5 text-sm resize-none"
              />
            </div>

            {/* 奖励预览 */}
            <div
              className="mb-5 p-3 rounded-xl text-xs"
              style={{ background: 'rgba(139,69,85,0.06)' }}
            >
              <p className="flex items-center gap-1.5 mb-1.5" style={{ color: C.wine }}>
                <Award size={13} /> 可获积分
              </p>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {parseTime(form.bedtime) <= parseTime(TARGET_BEDTIME) && (
                  <span style={{ color: C.sage }}>· 早睡 +20</span>
                )}
                {parseTime(form.wakeTime) <= parseTime(TARGET_WAKE) && (
                  <span style={{ color: C.sage }}>· 早起 +20</span>
                )}
                {form.quality >= 4 && <span style={{ color: C.sage }}>· 优质 +10</span>}
                {parseTime(form.bedtime) > parseTime(TARGET_BEDTIME) &&
                  parseTime(form.wakeTime) > parseTime(TARGET_WAKE) &&
                  form.quality < 4 && (
                    <span style={{ color: C.soft }}>· 暂无达标项，继续努力</span>
                  )}
              </div>
            </div>

            <button
              onClick={saveRecord}
              className="btn-french w-full py-3 text-sm font-medium"
            >
              保存今夜
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 px-5 py-4 rounded-2xl shadow-lg animate-slide-up flex items-center gap-3"
          style={{ background: 'linear-gradient(135deg, #4A3C32, #8B4555)', color: C.cream }}
        >
          <Award size={22} />
          <div>
            <p className="font-serif font-bold">恭喜获得 {toast.points} 分</p>
            <p className="text-xs opacity-80 mt-0.5">{toast.msg}</p>
          </div>
        </div>
      )}
    </div>
  );
}
