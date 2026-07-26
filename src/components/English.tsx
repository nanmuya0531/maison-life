import { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Coffee,
  Heart,
  Star,
  Award,
  Plus,
  X,
  Clock,
  Volume2,
  Check,
  CheckCircle2,
  Calendar,
  Flame,
  Sparkles,
  RotateCw,
  Sun,
  Flower2,
  Moon,
  Repeat,
  Brain,
  Languages,
  Lightbulb,
  Users,
  GraduationCap,
} from 'lucide-react';
import { storage, addRewardPoints, generateId, todayStr, formatDate } from '../store';
import { EnglishLesson } from '../types';

// 法式配色
const C = {
  cream: '#FAF7F2',
  beige: '#F0EAE0',
  roseGold: '#C9A876',
  deepBrown: '#4A3C32',
  wine: '#8B4555',
  sage: '#8B9D83',
  mist: '#E8E2D9',
  ink: '#3D3530',
  muted: '#7A6E62',
  soft: '#B5A99A',
};

// 今日 30 分钟学习计划
const DAILY_PLAN = [
  {
    minutes: 10,
    title: '单词记忆',
    subtitle: 'Vocabulary',
    desc: '每日 5 个生活词汇，慢慢品味',
    type: 'vocab' as const,
    Icon: Brain,
    color: C.roseGold,
    bg: 'rgba(201,168,118,0.10)',
  },
  {
    minutes: 10,
    title: '简单阅读',
    subtitle: 'Reading',
    desc: '一段短文，中英对照着读',
    type: 'reading' as const,
    Icon: BookOpen,
    color: C.sage,
    bg: 'rgba(139,157,131,0.10)',
  },
  {
    minutes: 10,
    title: '跟读练习',
    subtitle: 'Repeat',
    desc: '跟着句子轻声重复',
    type: 'repeat' as const,
    Icon: Repeat,
    color: C.wine,
    bg: 'rgba(139,69,85,0.10)',
  },
];

// 单词池 —— 温暖、贴近生活
const VOCAB_POOL = [
  { word: 'family', phonetic: '/ˈfæməli/', meaning: '家庭；家人', example: 'I love my family.', exampleCn: '我爱我的家人。' },
  { word: 'morning', phonetic: '/ˈmɔːrnɪŋ/', meaning: '早晨；清晨', example: 'Good morning, sunshine.', exampleCn: '早安，阳光。' },
  { word: 'beautiful', phonetic: '/ˈbjuːtɪfl/', meaning: '美丽的；美好的', example: 'It is a beautiful day.', exampleCn: '今天真是美好的一天。' },
  { word: 'happy', phonetic: '/ˈhæpi/', meaning: '快乐的；幸福的', example: 'I feel happy today.', exampleCn: '我今天感到很快乐。' },
  { word: 'coffee', phonetic: '/ˈkɒfi/', meaning: '咖啡', example: 'A cup of coffee wakes me up.', exampleCn: '一杯咖啡让我清醒。' },
  { word: 'love', phonetic: '/lʌv/', meaning: '爱；喜爱', example: 'I love this quiet morning.', exampleCn: '我爱这宁静的清晨。' },
  { word: 'garden', phonetic: '/ˈɡɑːrdn/', meaning: '花园', example: 'She walks in the garden.', exampleCn: '她在花园里散步。' },
  { word: 'friend', phonetic: '/frend/', meaning: '朋友', example: 'You are my dear friend.', exampleCn: '你是我亲爱的朋友。' },
  { word: 'book', phonetic: '/bʊk/', meaning: '书；书本', example: 'I read a book at night.', exampleCn: '我在夜晚读一本书。' },
  { word: 'sunshine', phonetic: '/ˈsʌnʃaɪn/', meaning: '阳光', example: 'Sunshine warms my face.', exampleCn: '阳光温暖了我的脸。' },
  { word: 'smile', phonetic: '/smaɪl/', meaning: '微笑', example: 'Your smile is so kind.', exampleCn: '你的笑容真温柔。' },
  { word: 'peace', phonetic: '/piːs/', meaning: '宁静；和平', example: 'I find peace here.', exampleCn: '我在这里找到宁静。' },
  { word: 'flower', phonetic: '/ˈflaʊər/', meaning: '花；花朵', example: 'The flower is blooming.', exampleCn: '花儿正在盛开。' },
  { word: 'dream', phonetic: '/driːm/', meaning: '梦；梦想', example: 'I have a sweet dream.', exampleCn: '我做了一个甜美的梦。' },
  { word: 'weekend', phonetic: '/ˈwiːkend/', meaning: '周末', example: 'The weekend is here.', exampleCn: '周末到了。' },
  { word: 'home', phonetic: '/hoʊm/', meaning: '家', example: 'Home is where the heart is.', exampleCn: '心安之处即是家。' },
  { word: 'water', phonetic: '/ˈwɔːtər/', meaning: '水', example: 'I drink warm water.', exampleCn: '我喝温水。' },
  { word: 'bread', phonetic: '/bred/', meaning: '面包', example: 'Fresh bread smells good.', exampleCn: '新鲜面包闻起来真香。' },
  { word: 'music', phonetic: '/ˈmjuːzɪk/', meaning: '音乐', example: 'Soft music fills the room.', exampleCn: '轻柔的音乐充满房间。' },
  { word: 'window', phonetic: '/ˈwɪndoʊ/', meaning: '窗户', example: 'I open the window.', exampleCn: '我打开窗户。' },
];

// 简单阅读 —— 超短文，3-5 句，中英对照
const READINGS = [
  {
    title: 'My Morning',
    titleCn: '我的早晨',
    Icon: Sun,
    lines: [
      { en: 'I wake up at seven.', cn: '我七点醒来。' },
      { en: 'The sun is warm on my face.', cn: '阳光暖暖地洒在脸上。' },
      { en: 'I make a cup of coffee.', cn: '我泡了一杯咖啡。' },
      { en: 'Today is a good day.', cn: '今天会是美好的一天。' },
    ],
  },
  {
    title: 'A Cup of Coffee',
    titleCn: '一杯咖啡',
    Icon: Coffee,
    lines: [
      { en: 'I love a cup of coffee in the morning.', cn: '我喜欢早晨的一杯咖啡。' },
      { en: 'It is warm and gentle.', cn: '它温暖而温柔。' },
      { en: 'The smell is sweet.', cn: '气味香甜。' },
      { en: 'It makes me smile.', cn: '它让我微笑。' },
    ],
  },
  {
    title: 'My Family',
    titleCn: '我的家人',
    Icon: Users,
    lines: [
      { en: 'I have a small family.', cn: '我有一个小小的家。' },
      { en: 'We eat dinner together.', cn: '我们一起吃晚餐。' },
      { en: 'We talk and we laugh.', cn: '我们聊天，我们欢笑。' },
      { en: 'I love them very much.', cn: '我非常爱他们。' },
    ],
  },
  {
    title: 'Weekend',
    titleCn: '周末',
    Icon: Flower2,
    lines: [
      { en: 'Today is the weekend.', cn: '今天是周末。' },
      { en: 'I do not work today.', cn: '我今天不工作。' },
      { en: 'I read a book slowly.', cn: '我慢慢地读一本书。' },
      { en: 'I feel free and calm.', cn: '我感到自由而平静。' },
    ],
  },
  {
    title: 'The Garden',
    titleCn: '花园',
    Icon: Flower2,
    lines: [
      { en: 'There is a small garden.', cn: '那里有一座小花园。' },
      { en: 'Many flowers are blooming.', cn: '许多花儿正在盛开。' },
      { en: 'A butterfly flies by.', cn: '一只蝴蝶飞过。' },
      { en: 'I sit and I rest.', cn: '我坐下，歇一歇。' },
    ],
  },
  {
    title: 'A Beautiful Day',
    titleCn: '美好的一天',
    Icon: Heart,
    lines: [
      { en: 'The sky is blue today.', cn: '今天天空蔚蓝。' },
      { en: 'The wind is soft.', cn: '风很轻柔。' },
      { en: 'I walk slowly outside.', cn: '我在外面慢慢地走。' },
      { en: 'Life is beautiful.', cn: '生活真美好。' },
    ],
  },
];

// 跟读练习 —— 简单温暖的句子
const REPEAT_SENTENCES = [
  { en: 'Good morning, how are you?', cn: '早安，你好吗？' },
  { en: 'I love this beautiful day.', cn: '我爱这美好的一天。' },
  { en: "Let's have a cup of coffee.", cn: '我们喝杯咖啡吧。' },
  { en: 'Today is a good day to learn.', cn: '今天是学习的好日子。' },
  { en: 'Thank you for everything.', cn: '感谢一切。' },
];

// 学习方法 —— 适合零基础的中年女性
const METHODS = [
  { title: '从阅读开始', desc: '先读简单的短文，让眼睛和心慢慢熟悉英语的样子，语感会自己生长。', Icon: BookOpen },
  { title: '跟着视频学', desc: '选一位温柔的老师，看她的嘴型，听她的节奏，像跟着朋友说话。', Icon: GraduationCap },
  { title: '重复她的话', desc: '她说一句，你跟着说一句，不要怕慢，重复是记忆最温柔的方式。', Icon: Repeat },
  { title: '每天三十分钟', desc: '不必贪多，三十分钟刚刚好，让英语成为日常的一杯茶。', Icon: Clock },
  { title: '不要怕犯错', desc: '错了就重来，没有人会笑你，每个错误都是进步的小小台阶。', Icon: Heart },
  { title: '融入生活场景', desc: '在厨房说 coffee，在窗前说 sunshine，让英语住进你的日常。', Icon: Sparkles },
];

interface EnglishProps {
  onPointsEarned: () => void;
}

export default function English({ onPointsEarned }: EnglishProps) {
  const [lessons, setLessons] = useState<EnglishLesson[]>([]);
  const [toast, setToast] = useState<{ msg: string; points: number } | null>(null);
  const [flippedSet, setFlippedSet] = useState<Set<number>>(new Set());
  const [expandedReading, setExpandedReading] = useState<number>(0);
  const [repeatDone, setRepeatDone] = useState<Set<number>>(new Set());

  useEffect(() => {
    const all = storage.getEnglishLessons();
    setLessons(all);
    // 恢复今日跟读进度
    const t = todayStr();
    const todayRepeat = all.filter(
      l => l.date === t && l.type === 'repeat' && l.completed && l.notes
    );
    setRepeatDone(new Set(todayRepeat.map(l => Number(l.notes))));
  }, []);

  const today = todayStr();

  // 今日词汇 —— 按日期轮转，一天 5 个
  const todayWords = useMemo(() => {
    const dayIndex = Math.floor(Date.now() / 86400000);
    const start = (dayIndex * 5) % VOCAB_POOL.length;
    return Array.from({ length: 5 }, (_, i) => VOCAB_POOL[(start + i) % VOCAB_POOL.length]);
  }, []);

  // 今日完成情况
  const todayLessons = useMemo(
    () => lessons.filter(l => l.date === today),
    [lessons, today]
  );

  const vocabDone = todayLessons.some(l => l.type === 'vocab' && l.completed);
  const readingDone = todayLessons.some(l => l.type === 'reading' && l.completed);
  const repeatDoneToday = todayLessons.filter(l => l.type === 'repeat' && l.completed);
  const allRepeatDone = repeatDoneToday.length >= REPEAT_SENTENCES.length;
  const allComplete = vocabDone && readingDone && allRepeatDone;

  const progressPct = [vocabDone, readingDone, allRepeatDone].filter(Boolean).length / 3;

  // 学习日历 —— 已完成学习（任意一项）的日期集合
  const studyDates = useMemo(() => {
    const dates = new Set<string>();
    lessons.forEach(l => {
      if (l.completed) dates.add(l.date);
    });
    return dates;
  }, [lessons]);

  // 连续学习天数
  const streak = useMemo(() => {
    let count = 0;
    const d = new Date();
    while (studyDates.has(formatDate(d))) {
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  }, [studyDates]);

  // 近 14 天日历
  const calendarDays = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      const ds = formatDate(d);
      return {
        date: ds,
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        weekday: '日一二三四五六'[d.getDay()],
        isToday: ds === today,
        studied: studyDates.has(ds),
      };
    });
  }, [studyDates, today]);

  // 近期记录
  const recentRecords = useMemo(() => {
    return [...lessons]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 8);
  }, [lessons]);

  // —— 奖励辅助 ——
  const makeAction = (label: string) => `${label}（${today}）`;
  const already = (label: string) =>
    storage.getRewardPoints().history.some(h => h.action === makeAction(label));

  // 完成某一项后检查奖励
  const checkRewards = (updated: EnglishLesson[]) => {
    const done = updated.filter(l => l.date === today && l.completed);
    const hasVocab = done.some(l => l.type === 'vocab');
    const hasReading = done.some(l => l.type === 'reading');
    const repDone = done.filter(l => l.type === 'repeat');
    const allRep = repDone.length >= REPEAT_SENTENCES.length;

    const earned: string[] = [];
    let total = 0;

    // 完成跟读 +5
    if (allRep && !already('英语跟读完成')) {
      addRewardPoints(makeAction('英语跟读完成'), 5);
      earned.push('跟读完成 +5');
      total += 5;
    }

    // 完成今日学习 +15
    if (hasVocab && hasReading && allRep && !already('英语今日学习完成')) {
      addRewardPoints(makeAction('英语今日学习完成'), 15);
      earned.push('今日学习 +15');
      total += 15;

      // 连续 7 天 +50 bonus
      const dateSet = new Set(updated.filter(l => l.completed).map(l => l.date));
      let s = 0;
      const d = new Date();
      while (dateSet.has(formatDate(d))) {
        s++;
        d.setDate(d.getDate() - 1);
      }
      if (s > 0 && s % 7 === 0 && !already(`英语连续${s}天 bonus`)) {
        addRewardPoints(makeAction(`英语连续${s}天 bonus`), 50);
        earned.push(`连续${s}天 +50`);
        total += 50;
      }
    }

    if (total > 0) {
      onPointsEarned();
      setToast({ msg: earned.join(' · '), points: total });
      setTimeout(() => setToast(null), 4500);
    }
  };

  // —— 完成单词学习 ——
  const completeVocab = () => {
    if (vocabDone) return;
    const lesson: EnglishLesson = {
      id: generateId(),
      date: today,
      type: 'vocab',
      title: '今日单词记忆',
      content: todayWords.map(w => w.word).join(', '),
      duration: 10,
      completed: true,
      createdAt: new Date().toISOString(),
    };
    const all = storage.getEnglishLessons();
    all.push(lesson);
    storage.setEnglishLessons(all);
    setLessons(all);
    checkRewards(all);
  };

  // —— 完成阅读学习 ——
  const completeReading = () => {
    if (readingDone) return;
    const idx = expandedReading;
    const r = READINGS[idx];
    const lesson: EnglishLesson = {
      id: generateId(),
      date: today,
      type: 'reading',
      title: r.title,
      content: r.lines.map(l => l.en).join(' '),
      duration: 10,
      completed: true,
      createdAt: new Date().toISOString(),
    };
    const all = storage.getEnglishLessons();
    all.push(lesson);
    storage.setEnglishLessons(all);
    setLessons(all);
    checkRewards(all);
  };

  // —— 切换跟读句子状态 ——
  const toggleRepeat = (index: number) => {
    const all = storage.getEnglishLessons();
    const existing = all.find(
      l => l.date === today && l.type === 'repeat' && l.notes === String(index)
    );
    if (existing) {
      // 取消标记
      const filtered = all.filter(l => l.id !== existing.id);
      storage.setEnglishLessons(filtered);
      setLessons(filtered);
      const next = new Set(repeatDone);
      next.delete(index);
      setRepeatDone(next);
    } else {
      const sentence = REPEAT_SENTENCES[index];
      const lesson: EnglishLesson = {
        id: generateId(),
        date: today,
        type: 'repeat',
        title: '跟读练习',
        content: sentence.en,
        duration: 2,
        completed: true,
        notes: String(index),
        createdAt: new Date().toISOString(),
      };
      all.push(lesson);
      storage.setEnglishLessons(all);
      setLessons(all);
      const next = new Set(repeatDone);
      next.add(index);
      setRepeatDone(next);
      checkRewards(all);
    }
  };

  // —— 翻转单词卡 ——
  const toggleFlip = (index: number) => {
    const next = new Set(flippedSet);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setFlippedSet(next);
  };

  // 进度环 SVG 参数
  const RADIUS = 56;
  const STROKE = 8;
  const CIRCUM = 2 * Math.PI * RADIUS;
  const ringOffset = CIRCUM * (1 - progressPct);

  // 类型标签文案
  const typeLabel = (t: EnglishLesson['type']) => {
    switch (t) {
      case 'vocab': return '单词';
      case 'reading': return '阅读';
      case 'repeat': return '跟读';
      case 'video': return '视频';
      case 'listening': return '听力';
      default: return t;
    }
  };
  const typeColor = (t: EnglishLesson['type']) => {
    switch (t) {
      case 'vocab': return C.roseGold;
      case 'reading': return C.sage;
      case 'repeat': return C.wine;
      default: return C.soft;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: C.soft }}>
            L'Anglais
          </p>
          <h1
            className="text-3xl font-serif font-bold flex items-center gap-3"
            style={{ color: C.deepBrown }}
          >
            <Languages size={26} style={{ color: C.wine }} />
            英语学习
          </h1>
          <p className="text-sm mt-2" style={{ color: C.muted }}>
            从一句 Good morning 开始 · 每天 30 分钟，温柔地与英语相遇
          </p>
        </div>
        <div
          className="px-5 py-3 rounded-2xl flex items-center gap-3 self-start md:self-auto"
          style={{ background: 'rgba(139,69,85,0.08)' }}
        >
          <Flame size={20} style={{ color: C.wine }} />
          <div>
            <p className="text-[10px] tracking-widest uppercase" style={{ color: C.soft }}>
              Streak
            </p>
            <p className="text-lg font-serif font-bold" style={{ color: C.deepBrown }}>
              连续 {streak} 天
            </p>
          </div>
        </div>
      </div>

      <div className="divider-french" />

      {/* 今日 30 分钟学习计划 + 进度环 */}
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
                  stroke="url(#englishGrad)"
                  strokeWidth={STROKE}
                  strokeDasharray={CIRCUM}
                  strokeDashoffset={ringOffset}
                  strokeLinecap="round"
                  transform="rotate(-90 80 80)"
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                />
                <defs>
                  <linearGradient id="englishGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#C9A876" />
                    <stop offset="100%" stopColor="#8B4555" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className="text-3xl font-serif font-bold"
                  style={{ color: C.deepBrown }}
                >
                  {Math.round(progressPct * 100)}%
                </span>
                <span className="text-[10px] tracking-widest" style={{ color: C.soft }}>
                  今日进度
                </span>
              </div>
            </div>
            <p className="text-xs mt-3 text-center" style={{ color: C.muted }}>
              {allComplete ? '今日学习已圆满 · Bravo' : '继续，你正温柔地前行'}
            </p>
          </div>

          {/* 三段式计划 */}
          <div>
            <h2 className="font-serif text-xl mb-1" style={{ color: C.deepBrown }}>
              今日三十分钟
            </h2>
            <p className="text-sm mb-5" style={{ color: C.muted }}>
              不疾不徐，分三段慢品 · 每一段都是给自己的礼物
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {DAILY_PLAN.map(p => {
                const done =
                  p.type === 'vocab' ? vocabDone :
                  p.type === 'reading' ? readingDone :
                  allRepeatDone;
                return (
                  <div
                    key={p.type}
                    className="rounded-xl p-4 transition relative overflow-hidden"
                    style={{ background: p.bg }}
                  >
                    {done && (
                      <span
                        className="absolute top-2 right-2 tag-french flex items-center gap-0.5"
                        style={{ background: 'rgba(139,157,131,0.18)', color: C.sage }}
                      >
                        <Check size={11} /> 已完成
                      </span>
                    )}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                      style={{ background: 'rgba(255,255,255,0.6)', color: p.color }}
                    >
                      <p.Icon size={18} />
                    </div>
                    <p className="text-[10px] tracking-widest uppercase" style={{ color: C.soft }}>
                      {p.subtitle} · {p.minutes} min
                    </p>
                    <p className="font-serif text-base mt-0.5" style={{ color: C.deepBrown }}>
                      {p.title}
                    </p>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: C.muted }}>
                      {p.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 单词卡片 —— 翻转效果 */}
      <div>
        <div className="flex items-baseline justify-between mb-4">
          <h2
            className="font-serif text-lg flex items-center gap-2"
            style={{ color: C.deepBrown }}
          >
            <Brain size={18} style={{ color: C.roseGold }} />
            今日词汇 · Today's Words
          </h2>
          <button
            onClick={completeVocab}
            disabled={vocabDone}
            className={vocabDone ? 'btn-french px-4 py-2 text-xs opacity-60 cursor-not-allowed' : 'btn-french px-4 py-2 text-xs flex items-center gap-1.5'}
          >
            {vocabDone ? (
              <><CheckCircle2 size={14} /> 已记完</>
            ) : (
              <><Check size={14} /> 标记完成 +5 分</>
            )}
          </button>
        </div>
        <p className="text-xs mb-4" style={{ color: C.soft }}>
          轻触卡片，翻见释义 · 点击右上小喇叭，听见它的声音
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {todayWords.map((w, i) => {
            const flipped = flippedSet.has(i);
            return (
              <div
                key={i}
                style={{ perspective: '1200px' }}
                className="h-52 cursor-pointer"
                onClick={() => toggleFlip(i)}
              >
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    transition: 'transform 0.7s cubic-bezier(0.4,0,0.2,1)',
                    transformStyle: 'preserve-3d',
                    transform: flipped ? 'rotateY(180deg)' : 'none',
                  }}
                >
                  {/* 正面 */}
                  <div
                    className="rounded-2xl p-5 flex flex-col items-center justify-center text-center"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      background: 'linear-gradient(135deg, #FFFFFF 0%, #FAF7F2 100%)',
                      border: '1px solid rgba(201,168,118,0.2)',
                      boxShadow: '0 4px 16px rgba(74,60,50,0.06)',
                    }}
                  >
                    <span
                      className="absolute top-3 left-3 text-[10px] tracking-widest"
                      style={{ color: C.soft }}
                    >
                      No. {String(i + 1).padStart(2, '0')}
                    </span>
                    <RotateCw
                      size={12}
                      style={{ color: C.soft }}
                      className="absolute top-3 right-3"
                    />
                    <p
                      className="text-2xl font-serif font-bold"
                      style={{ color: C.deepBrown }}
                    >
                      {w.word}
                    </p>
                    <p className="text-xs mt-2" style={{ color: C.roseGold }}>
                      {w.phonetic}
                    </p>
                    <p className="text-[10px] mt-3 tracking-widest uppercase" style={{ color: C.soft }}>
                      Tap to flip
                    </p>
                  </div>
                  {/* 背面 */}
                  <div
                    className="rounded-2xl p-5 flex flex-col items-center justify-center text-center"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                      background: 'linear-gradient(135deg, #4A3C32 0%, #8B4555 100%)',
                      color: C.cream,
                      border: '1px solid rgba(201,168,118,0.3)',
                      boxShadow: '0 4px 16px rgba(74,60,50,0.12)',
                    }}
                  >
                    <p className="text-lg font-serif font-bold">{w.meaning}</p>
                    <div
                      className="mt-3 pt-3 w-full"
                      style={{ borderTop: '1px solid rgba(250,247,242,0.2)' }}
                    >
                      <p className="text-xs italic">"{w.example}"</p>
                      <p className="text-[11px] mt-1 opacity-70">{w.exampleCn}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 简单阅读 —— 中英对照 */}
      <div>
        <div className="flex items-baseline justify-between mb-4">
          <h2
            className="font-serif text-lg flex items-center gap-2"
            style={{ color: C.deepBrown }}
          >
            <BookOpen size={18} style={{ color: C.sage }} />
            简单阅读 · Reading
          </h2>
          <button
            onClick={completeReading}
            disabled={readingDone}
            className={readingDone ? 'btn-rose px-4 py-2 text-xs opacity-60 cursor-not-allowed' : 'btn-rose px-4 py-2 text-xs flex items-center gap-1.5'}
          >
            {readingDone ? (
              <><CheckCircle2 size={14} /> 已读完</>
            ) : (
              <><Check size={14} /> 标记读完当前</>
            )}
          </button>
        </div>
        <p className="text-xs mb-4" style={{ color: C.soft }}>
          一篇三五句的小短文，中英相对 · 慢慢读，不必赶
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {READINGS.map((r, idx) => {
            const expanded = expandedReading === idx;
            return (
              <div key={r.title} className="glass card card-hover rounded-2xl overflow-hidden">
                <button
                  onClick={() => setExpandedReading(idx)}
                  className="w-full text-left p-5 flex items-center gap-3"
                  style={expanded ? { background: 'rgba(139,157,131,0.06)' } : {}}
                >
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: expanded
                        ? 'linear-gradient(135deg, #8B9D83, #6B7D63)'
                        : 'linear-gradient(135deg, #F0EAE0, #E8E2D9)',
                      color: expanded ? C.cream : C.wine,
                    }}
                  >
                    <r.Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] tracking-widest uppercase" style={{ color: C.soft }}>
                      Passage {String(idx + 1).padStart(2, '0')}
                    </p>
                    <h3 className="font-serif text-base" style={{ color: C.deepBrown }}>
                      {r.title}
                    </h3>
                    <p className="text-xs" style={{ color: C.muted }}>{r.titleCn}</p>
                  </div>
                  {expanded && (
                    <span
                      className="tag-french"
                      style={{ background: 'rgba(139,157,131,0.15)', color: C.sage }}
                    >
                      阅读
                    </span>
                  )}
                </button>
                {expanded && (
                  <div className="px-5 pb-5 space-y-3 animate-fade-in">
                    <div className="divider-french" />
                    {r.lines.map((line, li) => (
                      <div key={li} className="leading-relaxed">
                        <p className="text-sm font-serif" style={{ color: C.deepBrown }}>
                          {line.en}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: C.muted }}>
                          {line.cn}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 跟读练习 */}
      <div>
        <div className="flex items-baseline justify-between mb-4">
          <h2
            className="font-serif text-lg flex items-center gap-2"
            style={{ color: C.deepBrown }}
          >
            <Repeat size={18} style={{ color: C.wine }} />
            跟读练习 · Repeat After Me
          </h2>
          <span
            className="tag-french"
            style={{
              background: allRepeatDone ? 'rgba(139,157,131,0.15)' : 'rgba(201,168,118,0.15)',
              color: allRepeatDone ? C.sage : C.roseGold,
            }}
          >
            {repeatDone.size} / {REPEAT_SENTENCES.length}
          </span>
        </div>
        <p className="text-xs mb-4" style={{ color: C.soft }}>
          轻声跟着说，不必害羞 · 完成全部 +5 分
        </p>
        <div className="glass card card-hover rounded-2xl p-6">
          <div className="space-y-3">
            {REPEAT_SENTENCES.map((s, i) => {
              const done = repeatDone.has(i);
              return (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 rounded-xl transition"
                  style={{
                    background: done ? 'rgba(139,157,131,0.08)' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  <button
                    onClick={() => toggleRepeat(i)}
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition"
                    style={{
                      background: done
                        ? 'linear-gradient(135deg, #8B9D83, #6B7D63)'
                        : 'rgba(201,168,118,0.12)',
                      color: done ? C.cream : C.roseGold,
                    }}
                  >
                    {done ? <Check size={16} /> : <Volume2 size={15} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-serif" style={{ color: C.deepBrown }}>
                      {s.en}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: C.muted }}>{s.cn}</p>
                  </div>
                  {done && (
                    <span
                      className="tag-french"
                      style={{ background: 'rgba(139,157,131,0.18)', color: C.sage }}
                    >
                      已跟读
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 学习方法 */}
      <div>
        <h2
          className="font-serif text-lg mb-4 flex items-center gap-2"
          style={{ color: C.deepBrown }}
        >
          <Lightbulb size={18} style={{ color: C.roseGold }} />
          温柔的学习之道
        </h2>
        <p className="text-xs mb-4" style={{ color: C.soft }}>
          写给刚起步的你 · 慢慢来，比较快
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {METHODS.map((m, idx) => (
            <div key={m.title} className="glass card card-hover rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #F0EAE0, #E8E2D9)',
                    color: C.wine,
                  }}
                >
                  <m.Icon size={18} />
                </div>
                <p className="text-[10px] tracking-widest uppercase" style={{ color: C.soft }}>
                  No. {String(idx + 1).padStart(2, '0')}
                </p>
              </div>
              <h3 className="font-serif text-base mb-1.5" style={{ color: C.deepBrown }}>
                {m.title}
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: C.muted }}>
                {m.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 学习日历 + 历史记录 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 学习日历 */}
        <div>
          <h2
            className="font-serif text-lg mb-4 flex items-center gap-2"
            style={{ color: C.deepBrown }}
          >
            <Calendar size={18} style={{ color: C.roseGold }} />
            学习日历
          </h2>
          <div className="glass card card-hover rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #8B4555, #6B3440)',
                  color: C.cream,
                }}
              >
                <Flame size={16} />
                <span className="text-[10px] mt-0.5">{streak}d</span>
              </div>
              <div>
                <p className="font-serif text-base" style={{ color: C.deepBrown }}>
                  已连续学习 {streak} 天
                </p>
                <p className="text-xs" style={{ color: C.muted }}>
                  {streak >= 7
                    ? '七日有成 · 继续保持这份温柔'
                    : streak > 0
                      ? `再坚持 ${7 - (streak % 7)} 天，开启下一份奖励`
                      : '今天，从一句 Good morning 开始吧'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map(d => (
                <div
                  key={d.date}
                  className="aspect-square rounded-lg flex flex-col items-center justify-center transition"
                  style={{
                    background: d.studied
                      ? 'linear-gradient(135deg, #8B9D83, #6B7D63)'
                      : 'rgba(201,168,118,0.08)',
                    color: d.studied ? C.cream : C.soft,
                    boxShadow: d.isToday ? `0 0 0 2px ${C.wine}66` : 'none',
                  }}
                  title={d.date}
                >
                  <span className="text-[10px] opacity-80">{d.weekday}</span>
                  <span className="text-[11px] font-medium mt-0.5">{d.label}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4 text-[10px]" style={{ color: C.soft }}>
              <span className="flex items-center gap-1">
                <span
                  className="w-2.5 h-2.5 rounded"
                  style={{ background: 'linear-gradient(135deg, #8B9D83, #6B7D63)' }}
                />
                已学习
              </span>
              <span className="flex items-center gap-1">
                <span
                  className="w-2.5 h-2.5 rounded"
                  style={{ background: 'rgba(201,168,118,0.18)' }}
                />
                待开始
              </span>
              <span className="flex items-center gap-1 ml-auto">
                <span
                  className="w-2.5 h-2.5 rounded"
                  style={{ boxShadow: `0 0 0 2px ${C.wine}66` }}
                />
                今日
              </span>
            </div>
          </div>
        </div>

        {/* 历史记录 */}
        <div>
          <h2
            className="font-serif text-lg mb-4 flex items-center gap-2"
            style={{ color: C.deepBrown }}
          >
            <Clock size={18} style={{ color: C.sage }} />
            学习手账
          </h2>
          <div className="glass card card-hover rounded-2xl p-6">
            {recentRecords.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen size={36} className="mx-auto mb-3" style={{ color: C.soft }} />
                <p className="text-sm" style={{ color: C.muted }}>
                  还没有学习记录
                </p>
                <p className="text-xs mt-1" style={{ color: C.soft }}>
                  从今天的第一句英语开始
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[360px] overflow-y-auto">
                {recentRecords.map(rec => (
                  <div
                    key={rec.id}
                    className="flex items-start gap-3 p-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.5)' }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `${typeColor(rec.type)}22`,
                        color: typeColor(rec.type),
                      }}
                    >
                      {rec.type === 'vocab' ? <Brain size={16} /> :
                        rec.type === 'reading' ? <BookOpen size={16} /> :
                        rec.type === 'repeat' ? <Repeat size={16} /> :
                        <Star size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-sm font-serif font-bold"
                          style={{ color: C.deepBrown }}
                        >
                          {rec.title}
                        </span>
                        <span
                          className="tag-french"
                          style={{ background: `${typeColor(rec.type)}22`, color: typeColor(rec.type) }}
                        >
                          {typeLabel(rec.type)}
                        </span>
                        {rec.date === today && (
                          <span
                            className="tag-french"
                            style={{ background: 'rgba(139,69,85,0.12)', color: C.wine }}
                          >
                            今日
                          </span>
                        )}
                      </div>
                      {rec.content && (
                        <p className="text-xs mt-1 truncate" style={{ color: C.muted }}>
                          {rec.content}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-[11px]" style={{ color: C.soft }}>
                        <span className="flex items-center gap-1">
                          <Calendar size={10} /> {rec.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={10} /> {rec.duration} min
                        </span>
                      </div>
                    </div>
                    {rec.completed && (
                      <CheckCircle2 size={16} style={{ color: C.sage }} className="flex-shrink-0 mt-1" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 奖励说明 */}
      <div className="glass card card-hover rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Award size={18} style={{ color: C.wine }} />
          <h2 className="font-serif text-lg" style={{ color: C.deepBrown }}>
            积分奖励
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            className="rounded-xl p-4 flex items-center gap-3"
            style={{ background: 'rgba(201,168,118,0.08)' }}
          >
            <Star size={20} style={{ color: C.roseGold }} className="flex-shrink-0" />
            <div>
              <p className="font-serif font-bold" style={{ color: C.deepBrown }}>+15 分</p>
              <p className="text-xs" style={{ color: C.muted }}>完成今日全部学习</p>
            </div>
          </div>
          <div
            className="rounded-xl p-4 flex items-center gap-3"
            style={{ background: 'rgba(139,157,131,0.08)' }}
          >
            <Flame size={20} style={{ color: C.sage }} className="flex-shrink-0" />
            <div>
              <p className="font-serif font-bold" style={{ color: C.deepBrown }}>+50 分</p>
              <p className="text-xs" style={{ color: C.muted }}>连续学习 7 天 bonus</p>
            </div>
          </div>
          <div
            className="rounded-xl p-4 flex items-center gap-3"
            style={{ background: 'rgba(139,69,85,0.08)' }}
          >
            <Repeat size={20} style={{ color: C.wine }} className="flex-shrink-0" />
            <div>
              <p className="font-serif font-bold" style={{ color: C.deepBrown }}>+5 分</p>
              <p className="text-xs" style={{ color: C.muted }}>完成今日跟读练习</p>
            </div>
          </div>
        </div>
      </div>

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
