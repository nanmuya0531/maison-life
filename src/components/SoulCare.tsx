import { useState, useEffect } from 'react';
import {
  Heart, Smile, Meh, Frown, Zap, Moon, Coffee, CloudLightning, Flame,
  Sparkles, Plus, Trash2, X, BookOpen, Calendar, Feather, Star, RefreshCw,
  Compass, Quote, Lightbulb, ChevronRight, Flower2, Sparkle, Hexagon, Send,
} from 'lucide-react';
import { storage, addRewardPoints, generateId, todayStr } from '../store';
import { Mood, DivinationRecord } from '../types';

// ============ 法式配色 ============
const C = {
  cream: '#FAF7F2',
  beige: '#F0EAE0',
  roseGold: '#C9A876',
  deepBrown: '#4A3C32',
  wine: '#8B4555',
  sage: '#8B9D83',
  dustyRose: '#D4A5A5',
  ink: '#2D2A26',
  mist: '#E8E2D9',
  muted: '#7A6E62',
  soft: '#B5A99A',
  indigo: '#7B8FA1',
};

interface SoulCareProps {
  onPointsEarned: () => void;
}

type TabType = 'mood' | 'divination' | 'archive';
type DivSubTab = 'meihua' | 'liuyao' | 'test';

// ============ 情绪类型 ============
const MOOD_TYPES = [
  { id: 'happy', label: '开心', icon: Smile, color: C.roseGold },
  { id: 'calm', label: '平静', icon: Moon, color: C.sage },
  { id: 'excited', label: '兴奋', icon: Zap, color: C.wine },
  { id: 'tired', label: '疲惫', icon: Coffee, color: C.soft },
  { id: 'anxious', label: '焦虑', icon: CloudLightning, color: C.dustyRose },
  { id: 'sad', label: '低落', icon: Frown, color: C.indigo },
  { id: 'angry', label: '愤怒', icon: Flame, color: C.wine },
  { id: 'neutral', label: '中性', icon: Meh, color: C.muted },
];

// 法式风格写作提示
const JOURNAL_PROMPTS = [
  '今天，哪一缕阳光照进了你的心里？',
  '此刻，你想对自己温柔地说些什么？',
  '今天有没有一件小事，让你会心一笑？',
  '若把今天比作一首乐曲，它会是什么节奏？',
  '今天你的身体在悄悄告诉你什么？',
  '此刻最让你感到安稳的是什么？',
  '若今天有一个画面值得收藏，那会是什么？',
  '你今天为自己做了哪一件温柔的事？',
  '今天与昨日相比，你心里多了什么？',
  '若此刻有一阵风拂过心头，它带走了什么？',
];

// 法式温暖鼓励语
const FRENCH_ENCOURAGEMENTS = [
  '你今天已经很努力了，这本身就值得被看见。',
  '愿你像普罗旺斯的薰衣草，在风雨中依然从容绽放。',
  '今日的疲惫，是明日温柔生长的养分。',
  '你不必时时刻刻都闪耀，安静地存在也很美。',
  '允许自己慢下来，是最高级的自爱。',
  '你正用自己的节奏，走出一条独一无二的路。',
  '今天的你，已比昨天的你多懂得了一点温柔。',
  '愿你与自己和解，像塞纳河接纳两岸的灯火。',
  '每一次记录心情，都是给自己一个温柔的拥抱。',
  '你的敏感不是负担，而是感受世界的天赋。',
  '哪怕只是安静地呼吸，也是对生命的礼赞。',
  '愿你被这个世界温柔以待，如你温柔地对待自己。',
];

// ============ 八卦 ============
const BAGUA = [
  { id: 1, name: '乾', symbol: '☰', element: '天', trait: '刚健' },
  { id: 2, name: '兑', symbol: '☱', element: '泽', trait: '喜悦' },
  { id: 3, name: '离', symbol: '☲', element: '火', trait: '光明' },
  { id: 4, name: '震', symbol: '☳', element: '雷', trait: '震动' },
  { id: 5, name: '巽', symbol: '☴', element: '风', trait: '柔顺' },
  { id: 6, name: '坎', symbol: '☵', element: '水', trait: '沉静' },
  { id: 7, name: '艮', symbol: '☶', element: '山', trait: '安止' },
  { id: 8, name: '坤', symbol: '☷', element: '地', trait: '包容' },
];

// 三爻自下而上: 1=阳, 0=阴
const BAGUA_LINES: Record<number, number[]> = {
  1: [1, 1, 1], 2: [1, 1, 0], 3: [1, 0, 1], 4: [1, 0, 0],
  5: [0, 1, 1], 6: [0, 1, 0], 7: [0, 0, 1], 8: [0, 0, 0],
};

function findBaguaIdx(lines: number[]): number {
  const key = lines.join('');
  for (const k of Object.keys(BAGUA_LINES)) {
    if (BAGUA_LINES[Number(k)].join('') === key) return Number(k);
  }
  return 8;
}

// 64卦全名 [上卦][下卦]
const HEX_NAMES: Record<number, Record<number, string>> = {
  1: { 1: '乾为天', 2: '天泽履', 3: '天火同人', 4: '天雷无妄', 5: '天风姤', 6: '天水讼', 7: '天山遁', 8: '天地否' },
  2: { 1: '泽天夬', 2: '兑为泽', 3: '泽火革', 4: '泽雷随', 5: '泽风大过', 6: '泽水困', 7: '泽山咸', 8: '泽地萃' },
  3: { 1: '火天大有', 2: '火泽睽', 3: '离为火', 4: '火雷噬嗑', 5: '火风鼎', 6: '火水未济', 7: '火山旅', 8: '火地晋' },
  4: { 1: '雷天大壮', 2: '雷泽归妹', 3: '雷火丰', 4: '震为雷', 5: '雷风恒', 6: '雷水解', 7: '雷山小过', 8: '雷地豫' },
  5: { 1: '风天小畜', 2: '风泽中孚', 3: '风火家人', 4: '风雷益', 5: '巽为风', 6: '风水涣', 7: '风山渐', 8: '风地观' },
  6: { 1: '水天需', 2: '水泽节', 3: '水火既济', 4: '水雷屯', 5: '水风井', 6: '坎为水', 7: '水山蹇', 8: '水地比' },
  7: { 1: '山天大畜', 2: '山泽损', 3: '山火贲', 4: '山雷颐', 5: '山风蛊', 6: '山水蒙', 7: '艮为山', 8: '山地剥' },
  8: { 1: '地天泰', 2: '地泽临', 3: '地火明夷', 4: '地雷复', 5: '地风升', 6: '地水师', 7: '地山谦', 8: '坤为地' },
};

// 卦象简称
const HEX_SIMPLE: Record<number, Record<number, string>> = {
  1: { 1: '乾', 2: '履', 3: '同人', 4: '无妄', 5: '姤', 6: '讼', 7: '遁', 8: '否' },
  2: { 1: '夬', 2: '兑', 3: '革', 4: '随', 5: '大过', 6: '困', 7: '咸', 8: '萃' },
  3: { 1: '大有', 2: '睽', 3: '离', 4: '噬嗑', 5: '鼎', 6: '未济', 7: '旅', 8: '晋' },
  4: { 1: '大壮', 2: '归妹', 3: '丰', 4: '震', 5: '恒', 6: '解', 7: '小过', 8: '豫' },
  5: { 1: '小畜', 2: '中孚', 3: '家人', 4: '益', 5: '巽', 6: '涣', 7: '渐', 8: '观' },
  6: { 1: '需', 2: '节', 3: '既济', 4: '屯', 5: '井', 6: '坎', 7: '蹇', 8: '比' },
  7: { 1: '大畜', 2: '损', 3: '贲', 4: '颐', 5: '蛊', 6: '蒙', 7: '艮', 8: '剥' },
  8: { 1: '泰', 2: '临', 3: '明夷', 4: '复', 5: '升', 6: '师', 7: '谦', 8: '坤' },
};

// 64卦温柔解读
const HEX_INTERPRETATIONS: Record<string, { meaning: string; advice: string }> = {
  '乾': { meaning: '刚健进取，自强不息', advice: '此刻正是蓄力之时，你的坚持终将被时光温柔以待。' },
  '坤': { meaning: '厚德载物，柔顺包容', advice: '允许自己柔软，大地般的包容会为你带来意想不到的馈赠。' },
  '屯': { meaning: '萌芽初动，需耐心', advice: '万事开头难，你正在破土，请给自己多一些温柔的时间。' },
  '蒙': { meaning: '蒙昧待启，求教有方', advice: '不必假装全知，带着好奇去探索，答案会在路上与你相遇。' },
  '需': { meaning: '等待时机，从容不迫', advice: '慢下来不是停滞，而是为更美的绽放积蓄力量。' },
  '讼': { meaning: '言辞之争，宜退守', advice: '放下胜负心，内心的安宁比一时的对错更珍贵。' },
  '师': { meaning: '聚众成势，秩序而行', advice: '你不必独自承担，寻求同盟会让路途更从容。' },
  '比': { meaning: '亲近和睦，相互扶持', advice: '身边有人愿与你并肩，这份温暖值得你好好珍惜。' },
  '小畜': { meaning: '小有积蓄，温润前行', advice: '一点一滴的积累正在发生，不必急躁，细水长流。' },
  '履': { meaning: '谨慎而行，礼节为上', advice: '走得稳比走得快更重要，你的分寸感会护你周全。' },
  '泰': { meaning: '通泰和顺，万事亨通', advice: '此刻气脉畅通，愿你享受这份顺遂，心安即是归处。' },
  '否': { meaning: '暂时闭塞，静守待变', advice: '困顿只是阶段，闭上眼静一静，春风终会再次拂来。' },
  '同人': { meaning: '同心同行，志同道合', advice: '真诚会为你引来同频的灵魂，不必勉强迎合。' },
  '大有': { meaning: '大有所成，光华内敛', advice: '你正拥有丰盛，记得分享，让光芒更加温润。' },
  '谦': { meaning: '谦逊有礼，君子之风', advice: '你的温柔不喧哗，却最有力量，保持这份从容。' },
  '豫': { meaning: '安乐和悦，未雨绸缪', advice: '享受当下的欢愉，也为自己留一份温柔的余地。' },
  '随': { meaning: '随顺时势，灵活变通', advice: '不必硬抗潮流，顺应中藏着智慧，水流自有方向。' },
  '蛊': { meaning: '整治积弊，革新启新', advice: '是时候清理内心的积尘了，整理过后会迎来清明。' },
  '临': { meaning: '临近而成，温和督促', advice: '你正稳步靠近所愿，保持这份温柔的坚持。' },
  '观': { meaning: '静观其变，体悟真意', advice: '退一步看全局，答案会在凝视中渐渐清晰。' },
  '噬嗑': { meaning: '咬合疏通，决断而行', advice: '心中有结需化解，温柔的剖白胜过沉默的负担。' },
  '贲': { meaning: '文饰华美，内涵为本', advice: '外在的精致是内心的映照，愿你由内而外地舒展。' },
  '剥': { meaning: '剥落陈旧，守正待复', advice: '一些东西正在褪去，那是为新生腾出位置。' },
  '复': { meaning: '一阳来复，希望萌生', advice: '转机已至，那一线微光会慢慢照亮整片心田。' },
  '无妄': { meaning: '真诚无妄，顺其自然', advice: '不必强求，带着真心前行，自有好运相随。' },
  '大畜': { meaning: '大有积蓄，德厚流光', advice: '你的内在储备正变得丰厚，未来可期。' },
  '颐': { meaning: '颐养身心，自爱为本', advice: '好好吃饭，好好休息，这是对自己最深的善意。' },
  '大过': { meaning: '过重之担，量力而行', advice: '你承担得有些多了，允许自己卸下一些也无妨。' },
  '坎': { meaning: '重险相叠，守正待时', advice: '处境有些沉郁，但你的内心比想象中更坚韧。' },
  '离': { meaning: '光明附着，温暖绽放', advice: '你正散发着柔和的光，照亮自己的同时也温暖他人。' },
  '咸': { meaning: '感应相通，以情动人', advice: '心与心的连接正在发生，真诚是最美的语言。' },
  '恒': { meaning: '持之以恒，守常不变', advice: '你正走在长长的路上，稳定的节奏会带你抵达。' },
  '遁': { meaning: '适时退避，蓄势再起', advice: '退一步不是放弃，是为了更好地呵护自己。' },
  '大壮': { meaning: '阳气正盛，强健有力', advice: '此刻你充满力量，记得用温柔的方式使用它。' },
  '晋': { meaning: '晋升向上，光明前程', advice: '你正缓缓上升，如朝阳初升，前路明朗。' },
  '明夷': { meaning: '光芒内敛，韬光养晦', advice: '暂时收起锋芒，在暗处静静修复，光明会归来。' },
  '家人': { meaning: '内外和睦，温润如家', advice: '身边的人是你最温柔的依靠，珍惜这份归属。' },
  '睽': { meaning: '异中有同，求同存异', advice: '差异不必消解，在多元里也能找到共鸣。' },
  '蹇': { meaning: '前路艰难，借助外力', advice: '不必独自硬撑，向值得信任的人伸出手。' },
  '解': { meaning: '困境舒解，豁然开朗', advice: '心结正在松开，深吸一口气，轻盈将至。' },
  '损': { meaning: '损上益下，取舍有度', advice: '放下一些执念，轻装前行会更自在。' },
  '益': { meaning: '有所增益，正向成长', advice: '你正获得滋养，无论是情感还是智慧，都蓬勃生长。' },
  '夬': { meaning: '果断决断，扫除障碍', advice: '是时候做个决定了，温柔而坚定地为自己选一次。' },
  '姤': { meaning: '不期而遇，缘来珍惜', advice: '一些美好正悄然靠近，保持开放的心迎接它。' },
  '萃': { meaning: '聚合有方，珍惜相聚', advice: '你被温暖环绕，记得用心感受这份相伴。' },
  '升': { meaning: '稳步上升，柔顺而进', advice: '你正在悄悄生长，无需张扬，自有清风自来。' },
  '困': { meaning: '困顿守持，静待转机', advice: '此刻有些压抑，但请相信，困局正是蜕变的开始。' },
  '井': { meaning: '润泽无穷，源头活水', advice: '你的内在有一口清泉，安静下来便能汲取甘甜。' },
  '革': { meaning: '鼎革革新，去除旧貌', advice: '改变正在发生，勇敢地告别旧的自己。' },
  '鼎': { meaning: '鼎新成器，安身立命', advice: '你正在重塑自己，新的模样会更加沉稳而美好。' },
  '震': { meaning: '雷声震动，警醒前行', advice: '一些震荡带来清醒，愿你从中获得新的方向。' },
  '艮': { meaning: '安止不动，静默守心', advice: '此刻适合停下，在静默中与自己好好相处。' },
  '渐': { meaning: '循序渐进，稳步前行', advice: '慢慢来比较快，每一步都算数。' },
  '归妹': { meaning: '情之所归，顺其自然', advice: '感情的事不必勉强，顺其自然便有归处。' },
  '丰': { meaning: '丰盛圆满，珍惜当下', advice: '你正处在丰盈的时刻，请细细品味这份美好。' },
  '旅': { meaning: '旅途漂泊，谦和自处', advice: '你正在探索中，每一段经历都是回家的路。' },
  '巽': { meaning: '柔顺渗透，和风细雨', advice: '温柔的方式往往最有效，如春风化雨般前行。' },
  '兑': { meaning: '喜悦相随，真诚相待', advice: '让喜悦自然流露，你的笑容是最美的礼物。' },
  '涣': { meaning: '涣散消融，化解郁结', advice: '心中的郁结正在消散，如冰雪遇见暖阳。' },
  '节': { meaning: '节制有度，自律自珍', advice: '给自己温柔的边界，不是束缚，而是呵护。' },
  '中孚': { meaning: '诚信相感，心心相印', advice: '真心会被感知，你的诚意自有回响。' },
  '小过': { meaning: '小有过越，谨小慎微', advice: '不必追求完美，小小的偏差也是成长的一部分。' },
  '既济': { meaning: '功成事毕，守成不易', advice: '一个阶段已圆满，记得好好犒赏自己。' },
  '未济': { meaning: '未竟之业，希望在前', advice: '故事还在继续，最美的篇章或许即将开始。' },
};

// ============ 梅花易数 ============
interface MeihuaResult {
  upperIdx: number;
  lowerIdx: number;
  mutualUpperIdx: number;
  mutualLowerIdx: number;
  changedUpperIdx: number;
  changedLowerIdx: number;
  movingLine: number;
  lines: number[];
  changedLines: number[];
}

function genMeihua(): MeihuaResult {
  const upperIdx = Math.floor(Math.random() * 8) + 1;
  const lowerIdx = Math.floor(Math.random() * 8) + 1;
  const lines = [...BAGUA_LINES[lowerIdx], ...BAGUA_LINES[upperIdx]]; // 自下而上 6 爻

  // 动爻 (1-6)
  const hour = new Date().getHours();
  const hourIdx = Math.floor(hour / 2) + 1; // 1-12 时辰
  const movingLine = ((upperIdx + lowerIdx + hourIdx) % 6) + 1;

  // 互卦: 2,3,4 爻为下卦; 3,4,5 爻为上卦
  const mutualLower = [lines[1], lines[2], lines[3]];
  const mutualUpper = [lines[2], lines[3], lines[4]];

  // 变卦
  const changedLines = [...lines];
  changedLines[movingLine - 1] = changedLines[movingLine - 1] === 1 ? 0 : 1;

  return {
    upperIdx, lowerIdx,
    mutualUpperIdx: findBaguaIdx(mutualUpper),
    mutualLowerIdx: findBaguaIdx(mutualLower),
    changedUpperIdx: findBaguaIdx(changedLines.slice(3, 6)),
    changedLowerIdx: findBaguaIdx(changedLines.slice(0, 3)),
    movingLine, lines, changedLines,
  };
}

function interpretMeihua(r: MeihuaResult, question: string): string {
  const ben = HEX_SIMPLE[r.upperIdx][r.lowerIdx];
  const hu = HEX_SIMPLE[r.mutualUpperIdx][r.mutualLowerIdx];
  const bian = HEX_SIMPLE[r.changedUpperIdx][r.changedLowerIdx];
  const benInfo = HEX_INTERPRETATIONS[ben] || { meaning: '万象流转', advice: '愿你温柔以待。' };
  const bianInfo = HEX_INTERPRETATIONS[bian] || { meaning: '流转新生', advice: '变化中自有美意。' };

  return `关于「${question || '你心中所问'}」，卦象呈现「${ben}」——${benInfo.meaning}。\n\n本卦如同一面镜子，映照你当下的心境：${benInfo.advice}\n\n互卦「${hu}」暗藏事物内部的脉络，提示此事的内核在于你与自己内心的对话，无需向外索求太多。\n\n第 ${r.movingLine} 爻发动，化为变卦「${bian}」。${bianInfo.advice}\n\n愿你相信：无论卦象如何流转，温柔与勇气始终在你心间。`;
}

// ============ 六爻 ============
interface YaoLine {
  yang: boolean;
  moving: boolean;
}

function genLiuyao(): YaoLine[] {
  // 自下而上 6 爻
  return Array.from({ length: 6 }, () => {
    const yang = Math.random() < 0.5;
    const moving = Math.random() < 0.25;
    return { yang, moving };
  });
}

function interpretLiuyao(lines: YaoLine[], question: string): string {
  const yangCount = lines.filter(l => l.yang).length;
  const movingCount = lines.filter(l => l.moving).length;

  let base: string;
  if (yangCount >= 4) {
    base = '卦象阳气充沛，显示你内心正蓄积着向上的力量，光明的契机已悄然临近。';
  } else if (yangCount <= 2) {
    base = '卦象阴气较盛，温柔地提示你：此刻更需要休养生息，给自己一片安静的留白。';
  } else {
    base = '卦象阴阳调和，你正处在一种微妙的平衡之中，无需急着打破这份从容。';
  }

  let dyn: string;
  if (movingCount === 0) {
    dyn = '六爻安静，当下宜静守安住，细细品味此刻的心境。';
  } else if (movingCount <= 2) {
    dyn = `有 ${movingCount} 爻发动，意味着变化正在悄然发生，请保持开放而柔软的心。`;
  } else {
    dyn = `多爻齐动，变化将至，愿你从容迎接每一份转折，皆是成长的礼物。`;
  }

  return `关于「${question || '你心中所问'}」，${base}${dyn}\n\n你心中其实早已有了答案，只需安静下来，温柔地倾听自己。`;
}

// ============ 心理测试 ============
interface PsyQuestion {
  q: string;
  options: { text: string; r: string }[];
}
interface PsyTest {
  id: string;
  title: string;
  desc: string;
  icon: typeof Sparkles;
  questions: PsyQuestion[];
  results: Record<string, { title: string; desc: string }>;
}

const PSY_TESTS: PsyTest[] = [
  {
    id: 'energy',
    title: '你当下的能量状态',
    desc: '感受此刻身心的脉搏',
    icon: Zap,
    questions: [
      { q: '此刻你的身体感觉是？', options: [
        { text: '沉重疲惫', r: 'A' },
        { text: '略有些紧绷', r: 'B' },
        { text: '还算平稳', r: 'C' },
        { text: '轻盈舒展', r: 'D' },
      ]},
      { q: '面对今天的待办事项，你的心情是？', options: [
        { text: '想要逃避', r: 'A' },
        { text: '有点压力', r: 'B' },
        { text: '能够应付', r: 'C' },
        { text: '充满期待', r: 'D' },
      ]},
      { q: '最近一次发自内心的笑是？', options: [
        { text: '已经记不清了', r: 'A' },
        { text: '几天之前', r: 'B' },
        { text: '就在今天', r: 'C' },
        { text: '就在刚才', r: 'D' },
      ]},
      { q: '你对自己当下的感受是？', options: [
        { text: '陌生而疏离', r: 'A' },
        { text: '有点迷茫', r: 'B' },
        { text: '还算清楚', r: 'C' },
        { text: '温柔相知', r: 'D' },
      ]},
    ],
    results: {
      A: { title: '能量低谷期', desc: '允许自己歇一歇，疲惫不是软弱，是身体在温柔地提醒你。一杯热茶、一段轻音乐，都是对自己的善待。' },
      B: { title: '缓慢恢复中', desc: '像春日枝头的芽，不必着急，慢慢来。每一寸生长都算数，你正在路上。' },
      C: { title: '平稳舒展期', desc: '保持这份从容的节奏，继续温柔地对待自己。你与自己相处的方式，很美。' },
      D: { title: '柔光绽放期', desc: '此刻的你如清晨的阳光，温暖自己，也照亮他人。愿这份柔和的光，长长久久。' },
    },
  },
  {
    id: 'need',
    title: '你内心最需要什么',
    desc: '倾听心底细小的声音',
    icon: Heart,
    questions: [
      { q: '最近最让你感到空虚的是？', options: [
        { text: '没有人真正理解我', r: 'A' },
        { text: '看不到未来的方向', r: 'B' },
        { text: '没有成就感', r: 'C' },
        { text: '没有安静的时刻', r: 'D' },
      ]},
      { q: '若有一个下午的自由，你会？', options: [
        { text: '找信任的人倾诉', r: 'A' },
        { text: '独自规划未来', r: 'B' },
        { text: '做点手工或创作', r: 'C' },
        { text: '什么都不做', r: 'D' },
      ]},
      { q: '你最害怕失去的是？', options: [
        { text: '亲密的关系', r: 'A' },
        { text: '心中的希望', r: 'B' },
        { text: '自我价值感', r: 'C' },
        { text: '独处的空间', r: 'D' },
      ]},
      { q: '一句最想听到的话是？', options: [
        { text: '我懂你', r: 'A' },
        { text: '一切都会好的', r: 'B' },
        { text: '你做得很棒', r: 'C' },
        { text: '慢慢来，没关系', r: 'D' },
      ]},
    ],
    results: {
      A: { title: '倾听与连接', desc: '你渴望被真正看见。找一个值得信任的人，让心慢慢打开；也记得，你同样可以成为自己最温柔的理解者。' },
      B: { title: '方向与希望', desc: '你需要一个温柔的愿景，不必宏大，只要让心有所归。先从一件小事开始，让光一点点照进来。' },
      C: { title: '肯定与价值', desc: '你需要被认可，但更重要的是先认可自己每一份努力。今天的你，已经比昨天更勇敢了一些。' },
      D: { title: '安静与空间', desc: '你需要属于自己的角落，允许自己什么都不做也很好。留白本身就是最深的爱。' },
    },
  },
  {
    id: 'heal',
    title: '你的情绪疗愈方式',
    desc: '寻找属于你的那味解药',
    icon: Flower2,
    questions: [
      { q: '心情低落时，你更想？', options: [
        { text: '出门散步亲近自然', r: 'A' },
        { text: '写日记或读书', r: 'B' },
        { text: '找朋友聊一聊', r: 'C' },
        { text: '听音乐发呆', r: 'D' },
      ]},
      { q: '哪种场景让你感到安宁？', options: [
        { text: '森林湖畔', r: 'A' },
        { text: '咖啡馆角落', r: 'B' },
        { text: '温暖的家', r: 'C' },
        { text: '空旷的海边', r: 'D' },
      ]},
      { q: '你觉得最治愈的颜色是？', options: [
        { text: '鼠尾草绿', r: 'A' },
        { text: '玫瑰金', r: 'B' },
        { text: '酒红色', r: 'C' },
        { text: '海雾蓝', r: 'D' },
      ]},
      { q: '一句话最抚慰你的是？', options: [
        { text: '慢慢来', r: 'A' },
        { text: '你值得', r: 'B' },
        { text: '我在这里', r: 'C' },
        { text: '放空吧', r: 'D' },
      ]},
    ],
    results: {
      A: { title: '自然疗愈型', desc: '多走近草木山水，大地会接住你的疲惫。一阵风、一片叶子，都是世界给你的温柔情书。' },
      B: { title: '文字疗愈型', desc: '写下来就是一种释放，文字是你最温柔的容器。你的笔尖，藏着重获轻盈的力量。' },
      C: { title: '关系疗愈型', desc: '真诚的连接是你的解药，别独自承担太多。一个拥抱、一句问候，都足以让心回暖。' },
      D: { title: '留白疗愈型', desc: '允许自己无所事事，留白本身就是修复。在静默里，你会重新听见自己的呼吸。' },
    },
  },
  {
    id: 'self',
    title: '你与自己的关系',
    desc: '一场温柔的内在对话',
    icon: Sparkle,
    questions: [
      { q: '当你犯错时，你通常？', options: [
        { text: '反复责备自己', r: 'A' },
        { text: '有点懊恼但能过去', r: 'B' },
        { text: '理性分析原因', r: 'C' },
        { text: '温柔地原谅自己', r: 'D' },
      ]},
      { q: '独处时你的感受是？', options: [
        { text: '容易陷入低落', r: 'A' },
        { text: '有时享受有时孤独', r: 'B' },
        { text: '平静而充实', r: 'C' },
        { text: '深深感到自在', r: 'D' },
      ]},
      { q: '你如何看待自己的缺点？', options: [
        { text: '难以接受', r: 'A' },
        { text: '想要掩饰', r: 'B' },
        { text: '可以面对', r: 'C' },
        { text: '温柔接纳', r: 'D' },
      ]},
      { q: '你最想对自己说？', options: [
        { text: '对不起，我太严苛了', r: 'A' },
        { text: '我会慢慢变好', r: 'B' },
        { text: '我看见你的努力', r: 'C' },
        { text: '我爱你，连同缺陷', r: 'D' },
      ]},
    ],
    results: {
      A: { title: '需要更多温柔', desc: '你对自己有些严苛了。请像对待最好的朋友那样对待自己，允许不完美，才是真正的勇敢。' },
      B: { title: '正在学习和解', desc: '你正走在与自己和解的路上，这份觉察本身就值得被肯定。慢慢来，每一步都算数。' },
      C: { title: '关系渐趋从容', desc: '你已学会用平和的眼光看待自己，保持这份清明，也记得给自己多一些柔软。' },
      D: { title: '深深爱着自己', desc: '你与自己相处的方式如一首温柔的诗。愿这份自爱，成为你面对世界的底气。' },
    },
  },
];

function computeTestResult(test: PsyTest, answers: string[]): { key: string; title: string; desc: string } {
  const tally: Record<string, number> = {};
  answers.forEach((a, i) => {
    if (a) tally[a] = (tally[a] || 0) + 1;
  });
  let best = 'A';
  let max = -1;
  // 按题目顺序优先级，避免平票
  const order = ['A', 'B', 'C', 'D'];
  for (const k of order) {
    if ((tally[k] || 0) > max) {
      max = tally[k] || 0;
      best = k;
    }
  }
  const r = test.results[best] || test.results['A'];
  return { key: best, title: r.title, desc: r.desc };
}

// ============ 卦象爻线渲染 ============
function HexagramLines({ lines, movingLine }: { lines: number[]; movingLine?: number }) {
  // lines 自下而上 6 爻，视觉上自上而下渲染
  return (
    <div className="flex flex-col items-center gap-2 py-2">
      {[5, 4, 3, 2, 1, 0].map(i => {
        const isYang = lines[i] === 1;
        const isMoving = movingLine === i + 1;
        return (
          <div key={i} className="flex items-center gap-2">
            <div className="flex justify-center" style={{ width: 84 }}>
              {isYang ? (
                <div className="h-2 rounded-sm" style={{ width: 76, background: C.deepBrown }} />
              ) : (
                <div className="flex gap-2">
                  <div className="h-2 w-8 rounded-sm" style={{ background: C.deepBrown }} />
                  <div className="h-2 w-8 rounded-sm" style={{ background: C.deepBrown }} />
                </div>
              )}
            </div>
            <span className="text-xs w-3" style={{ color: C.wine }}>
              {isMoving ? '●' : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// 六爻爻线渲染
function LiuyaoLines({ lines }: { lines: YaoLine[] }) {
  return (
    <div className="flex flex-col items-center gap-2 py-2">
      {[5, 4, 3, 2, 1, 0].map(i => {
        const l = lines[i];
        return (
          <div key={i} className="flex items-center gap-2">
            <div className="flex justify-center" style={{ width: 84 }}>
              {l.yang ? (
                <div className="h-2 rounded-sm" style={{ width: 76, background: C.deepBrown }} />
              ) : (
                <div className="flex gap-2">
                  <div className="h-2 w-8 rounded-sm" style={{ background: C.deepBrown }} />
                  <div className="h-2 w-8 rounded-sm" style={{ background: C.deepBrown }} />
                </div>
              )}
            </div>
            <span className="text-xs w-3" style={{ color: C.wine }}>
              {l.moving ? '●' : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function baguaLabel(idx: number): string {
  const b = BAGUA.find(x => x.id === idx);
  return b ? `${b.name}·${b.element}` : '—';
}

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 1) return '今天';
  if (diff < 2) return '昨天';
  if (diff < 7) return `${Math.floor(diff)}天前`;
  return date.toLocaleDateString('zh-CN');
}

// 本周情绪统计
function computeMoodStats(moods: Mood[]): {
  count: number;
  dominantMoodLabel: string;
  avgEnergy: string;
  avgSleep: string;
} {
  const last7 = moods.filter(m => {
    const d = new Date(m.createdAt);
    return (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24) <= 7;
  });
  const counts: Record<string, number> = {};
  let totalEnergy = 0;
  let totalSleep = 0;
  last7.forEach(m => {
    counts[m.type] = (counts[m.type] || 0) + 1;
    totalEnergy += m.energy;
    totalSleep += m.sleepHours;
  });
  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  const dominantLabel = dominant
    ? MOOD_TYPES.find(m => m.id === dominant[0])?.label || '—'
    : '—';
  return {
    count: last7.length,
    dominantMoodLabel: dominantLabel,
    avgEnergy: last7.length ? (totalEnergy / last7.length).toFixed(1) : '—',
    avgSleep: last7.length ? (totalSleep / last7.length).toFixed(1) : '—',
  };
}

// 统计卡片
function StatCard({
  icon: Icon, label, value, sub, color,
}: {
  icon: typeof Heart;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="glass card card-hover p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} style={{ color }} />
        <span className="text-xs tracking-wide" style={{ color: C.muted }}>{label}</span>
      </div>
      <p className="text-2xl font-serif font-bold" style={{ color: C.deepBrown }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: C.soft }}>{sub}</p>
    </div>
  );
}

// ============ 主组件 ============
export default function SoulCare({ onPointsEarned }: SoulCareProps) {
  const [tab, setTab] = useState<TabType>('mood');
  const [moods, setMoods] = useState<Mood[]>([]);
  const [divinations, setDivinations] = useState<DivinationRecord[]>([]);
  const [toast, setToast] = useState<{ msg: string; points: number } | null>(null);

  useEffect(() => {
    setMoods(storage.getMoods());
    setDivinations(storage.getDivinations());
  }, []);

  const showToast = (msg: string, points: number) => {
    setToast({ msg, points });
    setTimeout(() => setToast(null), 4200);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold flex items-center gap-2" style={{ color: C.deepBrown }}>
          <Heart size={22} style={{ color: C.wine }} />
          心灵疗愈
        </h1>
        <p className="text-sm mt-1" style={{ color: C.muted }}>
          Soin de l'Âme · 愿你与自己温柔相待
        </p>
        <div className="divider-french mt-3" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'mood' as TabType, label: '情绪记录', sub: 'Mood', icon: Feather },
          { id: 'divination' as TabType, label: '玄学占卜', sub: 'Divination', icon: Sparkles },
          { id: 'archive' as TabType, label: '心灵档案', sub: 'Archive', icon: BookOpen },
        ].map(t => {
          const active = tab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-300 ${active ? 'btn-french' : 'glass'}`}
              style={active ? {} : { color: C.muted }}
            >
              <Icon size={16} />
              <span className="text-sm font-medium tracking-wide">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {tab === 'mood' && (
        <MoodSection
          moods={moods}
          setMoods={setMoods}
          onSaved={() => {
            addRewardPoints('情绪记录', 5);
            onPointsEarned();
            const e = FRENCH_ENCOURAGEMENTS[Math.floor(Math.random() * FRENCH_ENCOURAGEMENTS.length)];
            showToast(e, 5);
          }}
        />
      )}

      {tab === 'divination' && (
        <DivinationSection
          onDivined={(question, result, interpretation, type) => {
            const rec: DivinationRecord = {
              id: generateId(),
              type,
              question,
              result,
              interpretation,
              date: todayStr(),
              createdAt: new Date().toISOString(),
            };
            const all = storage.getDivinations();
            all.unshift(rec);
            storage.setDivinations(all);
            setDivinations(all);
            addRewardPoints('占卜解惑', 8);
            onPointsEarned();
            showToast('卦象已起，愿你从中听见心底的回响。', 8);
          }}
        />
      )}

      {tab === 'archive' && (
        <ArchiveSection
          moods={moods}
          divinations={divinations}
          onDeleteMood={(id) => {
            const all = storage.getMoods().filter(m => m.id !== id);
            storage.setMoods(all);
            setMoods(all);
          }}
          onDeleteDivination={(id) => {
            const all = storage.getDivinations().filter(d => d.id !== id);
            storage.setDivinations(all);
            setDivinations(all);
          }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 max-w-sm animate-slide-up glass card p-4"
          style={{ borderRadius: 14 }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #D4A5A5, #C9A876)' }}
            >
              <Sparkles size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-serif leading-relaxed" style={{ color: C.deepBrown }}>
                {toast.msg}
              </p>
              <p className="text-xs mt-1" style={{ color: C.wine }}>
                +{toast.points} 勋章积分
              </p>
            </div>
            <button onClick={() => setToast(null)} className="p-1 rounded hover:bg-white/40">
              <X size={14} style={{ color: C.soft }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ 情绪记录 Section ============
function MoodSection({
  moods, setMoods, onSaved,
}: {
  moods: Mood[];
  setMoods: (m: Mood[]) => void;
  onSaved: () => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [selectedMood, setSelectedMood] = useState('calm');
  const [intensity, setIntensity] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [sleepHours, setSleepHours] = useState(7);
  const [journal, setJournal] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [currentPrompt, setCurrentPrompt] = useState(JOURNAL_PROMPTS[0]);

  const pickPrompt = () => {
    let next = currentPrompt;
    while (next === currentPrompt) {
      next = JOURNAL_PROMPTS[Math.floor(Math.random() * JOURNAL_PROMPTS.length)];
    }
    setCurrentPrompt(next);
  };

  const saveMood = () => {
    const mood: Mood = {
      id: generateId(),
      type: selectedMood,
      intensity,
      energy,
      sleepHours,
      journal: journal.trim(),
      gratitude: gratitude.trim(),
      createdAt: new Date().toISOString(),
    };
    const all = storage.getMoods();
    all.push(mood);
    storage.setMoods(all);
    setMoods([...all]);
    setShowModal(false);
    setJournal('');
    setGratitude('');
    setIntensity(3);
    setEnergy(3);
    setSleepHours(7);
    onSaved();
  };

  // 本周统计
  const stats = computeMoodStats(moods);
  const moodInfo = (type: string) => MOOD_TYPES.find(m => m.id === type);
  const sortedMoods = [...moods].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Calendar} label="本周记录" value={stats.count ? String(stats.count) : '—'} sub="次心情记录" color={C.sage} />
        <StatCard icon={Sparkles} label="主导情绪" value={stats.dominantMoodLabel || '—'} sub="本周最常出现" color={C.roseGold} />
        <StatCard icon={Zap} label="平均能量" value={stats.avgEnergy} sub="/ 5 级" color={C.wine} />
        <StatCard icon={Moon} label="平均睡眠" value={stats.avgSleep} sub="小时 / 天" color={C.indigo} />
      </div>

      {/* Add button */}
      <div className="flex justify-end">
        <button onClick={() => setShowModal(true)} className="btn-rose px-5 py-2.5 flex items-center gap-2 text-sm">
          <Plus size={16} />
          记录今日心情
        </button>
      </div>

      {/* Timeline */}
      <div className="glass card card-hover p-6">
        <h2 className="font-serif text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: C.deepBrown }}>
          <BookOpen size={18} style={{ color: C.wine }} />
          心情时间线
        </h2>
        <div className="divider-french mb-5" />

        {sortedMoods.length === 0 ? (
          <div className="text-center py-12" style={{ color: C.soft }}>
            <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: C.mist }}>
              <Heart size={32} style={{ color: C.dustyRose }} />
            </div>
            <p className="text-base font-serif mb-1" style={{ color: C.muted }}>尚未写下任何心情</p>
            <p className="text-sm">从一次温柔的记录开始吧</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedMoods.map(mood => {
              const info = moodInfo(mood.type);
              const Icon = info?.icon || Meh;
              return (
                <div
                  key={mood.id}
                  className="rounded-xl p-4 group relative transition card-hover"
                  style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(201,168,118,0.12)' }}
                >
                  <button
                    onClick={() => {
                      const all = storage.getMoods().filter(m => m.id !== mood.id);
                      storage.setMoods(all);
                      setMoods(all);
                    }}
                    className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition"
                    style={{ color: C.soft }}
                  >
                    <Trash2 size={13} />
                  </button>
                  <div className="flex items-start gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${info?.color || C.soft}, ${C.dustyRose})` }}
                    >
                      <Icon size={20} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-serif font-medium" style={{ color: C.deepBrown }}>{info?.label || '心情'}</span>
                        <span className="text-xs" style={{ color: C.soft }}>强度 {mood.intensity}/5</span>
                        <span className="text-xs" style={{ color: C.soft }}>· 能量 {mood.energy}/5</span>
                        <span className="text-xs" style={{ color: C.soft }}>· 睡眠 {mood.sleepHours}h</span>
                        <span className="text-xs ml-auto" style={{ color: C.soft }}>{getDateLabel(mood.createdAt)}</span>
                      </div>
                      {mood.journal && (
                        <p className="text-sm mt-2 whitespace-pre-wrap font-serif leading-relaxed" style={{ color: C.ink }}>
                          {mood.journal}
                        </p>
                      )}
                      {mood.gratitude && (
                        <p className="text-sm mt-2 italic" style={{ color: C.wine }}>
                          <Heart size={12} className="inline mr-1" />
                          {mood.gratitude}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Mood Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="rounded-3xl w-full max-w-lg p-6 animate-slide-up max-h-[90vh] overflow-y-auto"
            style={{ background: C.cream, border: '1px solid rgba(201,168,118,0.2)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-serif font-bold" style={{ color: C.deepBrown }}>记录今日心情</h2>
                <p className="text-xs mt-0.5" style={{ color: C.soft }}>Journal de l'Âme</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-white/50">
                <X size={18} style={{ color: C.muted }} />
              </button>
            </div>

            {/* Mood selection */}
            <div className="mb-5">
              <label className="text-sm font-serif mb-3 block" style={{ color: C.deepBrown }}>此刻你的心情是？</label>
              <div className="grid grid-cols-4 gap-2">
                {MOOD_TYPES.map(m => {
                  const MIcon = m.icon;
                  const active = selectedMood === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMood(m.id)}
                      className="p-3 rounded-xl flex flex-col items-center gap-1.5 transition-all"
                      style={active
                        ? { background: `linear-gradient(135deg, ${m.color}, ${C.dustyRose})`, color: '#fff', boxShadow: '0 4px 12px rgba(139,69,85,0.2)' }
                        : { background: 'rgba(255,255,255,0.5)', color: C.muted, border: '1px solid rgba(201,168,118,0.12)' }
                      }
                    >
                      <MIcon size={22} />
                      <span className="text-xs">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Intensity */}
            <div className="mb-5">
              <label className="text-sm font-serif mb-2 block" style={{ color: C.deepBrown }}>
                情绪强度 · {intensity}/5
              </label>
              <input
                type="range" min={1} max={5} value={intensity}
                onChange={e => setIntensity(parseInt(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ background: C.mist, accentColor: C.wine }}
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: C.soft }}>
                <span>微弱</span><span>适中</span><span>强烈</span>
              </div>
            </div>

            {/* Energy */}
            <div className="mb-5">
              <label className="text-sm font-serif mb-2 block" style={{ color: C.deepBrown }}>
                能量等级 · {energy}/5
              </label>
              <input
                type="range" min={1} max={5} value={energy}
                onChange={e => setEnergy(parseInt(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ background: C.mist, accentColor: C.sage }}
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: C.soft }}>
                <span>疲惫</span><span>平稳</span><span>充沛</span>
              </div>
            </div>

            {/* Sleep */}
            <div className="mb-5">
              <label className="text-sm font-serif mb-2 block" style={{ color: C.deepBrown }}>
                昨晚睡眠 · {sleepHours} 小时
              </label>
              <input
                type="range" min={0} max={12} step={0.5} value={sleepHours}
                onChange={e => setSleepHours(parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ background: C.mist, accentColor: C.indigo }}
              />
            </div>

            {/* Journal */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-serif" style={{ color: C.deepBrown }}>今日感悟</label>
                <button
                  onClick={pickPrompt}
                  className="text-xs flex items-center gap-1 transition"
                  style={{ color: C.wine }}
                >
                  <RefreshCw size={11} />
                  换个提示
                </button>
              </div>
              <p className="text-xs italic mb-2 font-serif" style={{ color: C.dustyRose }}>
                <Quote size={11} className="inline mr-1" />
                {currentPrompt}
              </p>
              <textarea
                value={journal}
                onChange={e => setJournal(e.target.value)}
                placeholder="写下此刻心中的低语…"
                rows={3}
                className="w-full px-4 py-3 rounded-xl outline-none transition resize-none font-serif text-sm input-french"
              />
            </div>

            {/* Gratitude */}
            <div className="mb-6">
              <label className="text-sm font-serif mb-2 block" style={{ color: C.deepBrown }}>感恩清单</label>
              <textarea
                value={gratitude}
                onChange={e => setGratitude(e.target.value)}
                placeholder="今天让你心生感激的人或事…"
                rows={2}
                className="w-full px-4 py-3 rounded-xl outline-none transition resize-none font-serif text-sm input-french"
              />
            </div>

            <button
              onClick={saveMood}
              className="w-full py-3 btn-rose text-sm font-serif tracking-wide flex items-center justify-center gap-2"
            >
              <Feather size={15} />
              收藏此刻的心情
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ 玄学占卜 Section ============
function DivinationSection({
  onDivined,
}: {
  onDivined: (question: string, result: string, interpretation: string, type: 'meihua' | 'liuyao' | 'test') => void;
}) {
  const [subTab, setSubTab] = useState<DivSubTab>('meihua');

  return (
    <div className="space-y-6">
      {/* Sub tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'meihua' as DivSubTab, label: '梅花易数', icon: Compass },
          { id: 'liuyao' as DivSubTab, label: '六爻占卜', icon: Hexagon },
          { id: 'test' as DivSubTab, label: '心灵测试', icon: Lightbulb },
        ].map(t => {
          const active = subTab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-all ${active ? 'btn-french' : 'glass'}`}
              style={active ? {} : { color: C.muted }}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {subTab === 'meihua' && <MeihuaTab onDivined={onDivined} />}
      {subTab === 'liuyao' && <LiuyaoTab onDivined={onDivined} />}
      {subTab === 'test' && <PsyTestTab onDivined={onDivined} />}
    </div>
  );
}

// ---- 梅花易数 ----
function MeihuaTab({
  onDivined,
}: {
  onDivined: (q: string, r: string, i: string, t: 'meihua') => void;
}) {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<MeihuaResult | null>(null);
  const [interpretation, setInterpretation] = useState('');

  const divine = () => {
    const r = genMeihua();
    const interp = interpretMeihua(r, question.trim());
    setResult(r);
    setInterpretation(interp);
    const benName = HEX_NAMES[r.upperIdx][r.lowerIdx];
    const huName = HEX_NAMES[r.mutualUpperIdx][r.mutualLowerIdx];
    const bianName = HEX_NAMES[r.changedUpperIdx][r.changedLowerIdx];
    const resultStr = `本卦:${benName}(上${baguaLabel(r.upperIdx)} 下${baguaLabel(r.lowerIdx)}) 第${r.movingLine}爻动 互卦:${huName} 变卦:${bianName}`;
    onDivined(question.trim() || '心有所问', resultStr, interp, 'meihua');
  };

  return (
    <div className="glass card card-hover p-6">
      <h2 className="font-serif text-lg font-semibold flex items-center gap-2" style={{ color: C.deepBrown }}>
        <Compass size={18} style={{ color: C.wine }} />
        梅花易数
      </h2>
      <p className="text-xs mt-1 mb-4" style={{ color: C.soft }}>以数起卦，观象知心 · Yi Jing Oracle</p>
      <div className="divider-french mb-5" />

      <div className="space-y-3">
        <label className="text-sm font-serif" style={{ color: C.deepBrown }}>心中所问</label>
        <input
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="将一个温柔的问题，悄悄放在心里…"
          className="w-full px-4 py-3 rounded-xl outline-none font-serif text-sm input-french"
          onKeyDown={e => { if (e.key === 'Enter') divine(); }}
        />
        <button
          onClick={divine}
          className="btn-french px-5 py-2.5 flex items-center gap-2 text-sm font-serif"
        >
          <Sparkles size={15} />
          起 卦
        </button>
      </div>

      {result && (
        <div className="mt-6 animate-slide-up">
          <div className="divider-french mb-5" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 本卦 */}
            <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(212,165,165,0.12)', border: '1px solid rgba(201,168,118,0.2)' }}>
              <p className="text-xs tracking-widest mb-1" style={{ color: C.wine }}>本 卦</p>
              <p className="font-serif text-base font-bold mb-1" style={{ color: C.deepBrown }}>
                {HEX_NAMES[result.upperIdx][result.lowerIdx]}
              </p>
              <p className="text-xs mb-2" style={{ color: C.muted }}>
                上{baguaLabel(result.upperIdx)} · 下{baguaLabel(result.lowerIdx)}
              </p>
              <HexagramLines lines={result.lines} movingLine={result.movingLine} />
            </div>
            {/* 互卦 */}
            <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(139,157,131,0.1)', border: '1px solid rgba(201,168,118,0.2)' }}>
              <p className="text-xs tracking-widest mb-1" style={{ color: C.sage }}>互 卦</p>
              <p className="font-serif text-base font-bold mb-1" style={{ color: C.deepBrown }}>
                {HEX_NAMES[result.mutualUpperIdx][result.mutualLowerIdx]}
              </p>
              <p className="text-xs mb-2" style={{ color: C.muted }}>
                上{baguaLabel(result.mutualUpperIdx)} · 下{baguaLabel(result.mutualLowerIdx)}
              </p>
              <HexagramLines lines={[...BAGUA_LINES[result.mutualLowerIdx], ...BAGUA_LINES[result.mutualUpperIdx]]} />
            </div>
            {/* 变卦 */}
            <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(201,168,118,0.1)', border: '1px solid rgba(201,168,118,0.2)' }}>
              <p className="text-xs tracking-widest mb-1" style={{ color: C.roseGold }}>变 卦</p>
              <p className="font-serif text-base font-bold mb-1" style={{ color: C.deepBrown }}>
                {HEX_NAMES[result.changedUpperIdx][result.changedLowerIdx]}
              </p>
              <p className="text-xs mb-2" style={{ color: C.muted }}>
                第 {result.movingLine} 爻动
              </p>
              <HexagramLines lines={result.changedLines} />
            </div>
          </div>

          <div className="mt-5 rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(201,168,118,0.15)' }}>
            <p className="text-xs tracking-widest mb-2 flex items-center gap-1" style={{ color: C.wine }}>
              <Quote size={12} /> 卦 象 低 语
            </p>
            <p className="text-sm font-serif leading-loose whitespace-pre-wrap" style={{ color: C.ink }}>
              {interpretation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- 六爻占卜 ----
function LiuyaoTab({
  onDivined,
}: {
  onDivined: (q: string, r: string, i: string, t: 'liuyao') => void;
}) {
  const [question, setQuestion] = useState('');
  const [lines, setLines] = useState<YaoLine[] | null>(null);
  const [interpretation, setInterpretation] = useState('');

  const divine = () => {
    const l = genLiuyao();
    const interp = interpretLiuyao(l, question.trim());
    setLines(l);
    setInterpretation(interp);
    const moving = l.map((y, i) => y.moving ? `${i + 1}爻动` : null).filter(Boolean).join('、') || '六爻安静';
    const resultStr = `六爻:${l.map(y => y.yang ? '阳' : '阴').join('')} ${moving}`;
    onDivined(question.trim() || '心有所问', resultStr, interp, 'liuyao');
  };

  return (
    <div className="glass card card-hover p-6">
      <h2 className="font-serif text-lg font-semibold flex items-center gap-2" style={{ color: C.deepBrown }}>
        <Hexagon size={18} style={{ color: C.wine }} />
        六爻占卜
      </h2>
      <p className="text-xs mt-1 mb-4" style={{ color: C.soft }}>六爻成卦，静观其变 · Six Lines Oracle</p>
      <div className="divider-french mb-5" />

      <div className="space-y-3">
        <label className="text-sm font-serif" style={{ color: C.deepBrown }}>心中所问</label>
        <input
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="将一个温柔的问题，悄悄放在心里…"
          className="w-full px-4 py-3 rounded-xl outline-none font-serif text-sm input-french"
          onKeyDown={e => { if (e.key === 'Enter') divine(); }}
        />
        <button
          onClick={divine}
          className="btn-french px-5 py-2.5 flex items-center gap-2 text-sm font-serif"
        >
          <Sparkles size={15} />
          起 卦
        </button>
      </div>

      {lines && (
        <div className="mt-6 animate-slide-up">
          <div className="divider-french mb-5" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="rounded-xl p-5 text-center" style={{ background: 'rgba(212,165,165,0.12)', border: '1px solid rgba(201,168,118,0.2)' }}>
              <p className="text-xs tracking-widest mb-2" style={{ color: C.wine }}>六 爻 卦 象</p>
              <LiuyaoLines lines={lines} />
              <p className="text-xs mt-2" style={{ color: C.muted }}>
                ● 标记为动爻
              </p>
            </div>
            <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(201,168,118,0.15)' }}>
              <p className="text-xs tracking-widest mb-2 flex items-center gap-1" style={{ color: C.wine }}>
                <Quote size={12} /> 爻 辞 低 语
              </p>
              <p className="text-sm font-serif leading-loose whitespace-pre-wrap" style={{ color: C.ink }}>
                {interpretation}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- 心灵测试 ----
function PsyTestTab({
  onDivined,
}: {
  onDivined: (q: string, r: string, i: string, t: 'test') => void;
}) {
  const [selected, setSelected] = useState<PsyTest | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);

  const startTest = (t: PsyTest) => {
    setSelected(t);
    setAnswers(new Array(t.questions.length).fill(''));
    setShowResult(false);
  };

  const allAnswered = selected && answers.every(a => a !== '');

  const finishTest = () => {
    if (!selected || !allAnswered) return;
    setShowResult(true);
    const r = computeTestResult(selected, answers);
    onDivined(
      selected.title,
      `测试:${selected.title} 结果:${r.title}`,
      `${r.title} —— ${r.desc}`,
      'test'
    );
  };

  // 测试选择列表
  if (!selected) {
    return (
      <div className="glass card card-hover p-6">
        <h2 className="font-serif text-lg font-semibold flex items-center gap-2" style={{ color: C.deepBrown }}>
          <Lightbulb size={18} style={{ color: C.wine }} />
          心灵测试
        </h2>
        <p className="text-xs mt-1 mb-4" style={{ color: C.soft }}>四场温柔的内在对话 · Inner Dialogue</p>
        <div className="divider-french mb-5" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PSY_TESTS.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => startTest(t)}
                className="text-left rounded-xl p-5 transition-all card-hover"
                style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(201,168,118,0.15)' }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #D4A5A5, #C9A876)' }}
                  >
                    <Icon size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="font-serif font-semibold" style={{ color: C.deepBrown }}>{t.title}</p>
                    <p className="text-xs" style={{ color: C.soft }}>{t.questions.length} 个问题 · 约 1 分钟</p>
                  </div>
                  <ChevronRight size={16} className="ml-auto" style={{ color: C.soft }} />
                </div>
                <p className="text-sm font-serif italic" style={{ color: C.muted }}>{t.desc}</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 测试结果
  if (showResult) {
    const r = computeTestResult(selected, answers);
    const Icon = selected.icon;
    return (
      <div className="glass card card-hover p-6 animate-slide-up">
        <div className="flex items-center gap-2 mb-1">
          <Icon size={18} style={{ color: C.wine }} />
          <h2 className="font-serif text-lg font-semibold" style={{ color: C.deepBrown }}>{selected.title}</h2>
        </div>
        <p className="text-xs mb-4" style={{ color: C.soft }}>结果已悄悄浮现</p>
        <div className="divider-french mb-5" />

        <div className="rounded-xl p-6 text-center" style={{ background: 'linear-gradient(135deg, rgba(212,165,165,0.15), rgba(201,168,118,0.1))', border: '1px solid rgba(201,168,118,0.2)' }}>
          <div
            className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3"
            style={{ background: 'linear-gradient(135deg, #D4A5A5, #C9A876)' }}
          >
            <Star size={22} className="text-white" />
          </div>
          <p className="text-xs tracking-widest mb-1" style={{ color: C.wine }}>你 的 类 型</p>
          <p className="font-serif text-xl font-bold mb-3" style={{ color: C.deepBrown }}>{r.title}</p>
          <p className="text-sm font-serif leading-loose max-w-md mx-auto" style={{ color: C.ink }}>
            {r.desc}
          </p>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={() => startTest(selected)}
            className="flex-1 py-2.5 rounded-xl text-sm font-serif glass"
            style={{ color: C.muted }}
          >
            <RefreshCw size={14} className="inline mr-1" />
            再测一次
          </button>
          <button
            onClick={() => { setSelected(null); setAnswers([]); setShowResult(false); }}
            className="flex-1 py-2.5 rounded-xl text-sm font-serif btn-french"
          >
            返回列表
          </button>
        </div>
      </div>
    );
  }

  // 答题中
  const answeredCount = answers.filter(a => a).length;
  return (
    <div className="glass card card-hover p-6">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Lightbulb size={18} style={{ color: C.wine }} />
          <h2 className="font-serif text-lg font-semibold" style={{ color: C.deepBrown }}>{selected.title}</h2>
        </div>
        <button
          onClick={() => { setSelected(null); setAnswers([]); }}
          className="text-xs flex items-center gap-1"
          style={{ color: C.soft }}
        >
          <X size={12} /> 退出
        </button>
      </div>
      <p className="text-xs mb-4" style={{ color: C.soft }}>
        已回答 {answeredCount} / {selected.questions.length}
      </p>
      <div className="divider-french mb-5" />

      <div className="space-y-6">
        {selected.questions.map((q, qi) => (
          <div key={qi}>
            <p className="text-sm font-serif mb-3" style={{ color: C.deepBrown }}>
              <span style={{ color: C.wine }}>{qi + 1}.</span> {q.q}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {q.options.map((opt, oi) => {
                const active = answers[qi] === opt.r + String(oi);
                return (
                  <button
                    key={oi}
                    onClick={() => {
                      const next = [...answers];
                      next[qi] = opt.r + String(oi);
                      setAnswers(next);
                    }}
                    className="text-left px-4 py-2.5 rounded-lg text-sm font-serif transition-all"
                    style={active
                      ? { background: 'linear-gradient(135deg, #8B4555, #6B3440)', color: '#FAF7F2', border: '1px solid rgba(139,69,85,0.3)' }
                      : { background: 'rgba(255,255,255,0.5)', color: C.ink, border: '1px solid rgba(201,168,118,0.15)' }
                    }
                  >
                    {opt.text}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={finishTest}
        disabled={!allAnswered}
        className="w-full mt-6 py-3 btn-rose text-sm font-serif tracking-wide flex items-center justify-center gap-2"
        style={allAnswered ? {} : { opacity: 0.4, cursor: 'not-allowed' }}
      >
        <Send size={15} />
        查看结果
      </button>
    </div>
  );
}

// ============ 心灵档案 Section ============
const DIV_TYPE_INFO: Record<string, { label: string; icon: typeof Compass; color: string }> = {
  meihua: { label: '梅花易数', icon: Compass, color: C.wine },
  liuyao: { label: '六爻占卜', icon: Hexagon, color: C.sage },
  test: { label: '心灵测试', icon: Lightbulb, color: C.roseGold },
};

function ArchiveSection({
  moods, divinations, onDeleteMood, onDeleteDivination,
}: {
  moods: Mood[];
  divinations: DivinationRecord[];
  onDeleteMood: (id: string) => void;
  onDeleteDivination: (id: string) => void;
}) {
  const [filter, setFilter] = useState<'divination' | 'mood'>('divination');

  const sortedDiv = [...divinations].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const sortedMoods = [...moods].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex gap-2">
        {[
          { id: 'divination' as const, label: '占卜记录', icon: Sparkles, count: sortedDiv.length },
          { id: 'mood' as const, label: '心情记录', icon: Feather, count: sortedMoods.length },
        ].map(f => {
          const active = filter === f.id;
          const Icon = f.icon;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-all ${active ? 'btn-french' : 'glass'}`}
              style={active ? {} : { color: C.muted }}
            >
              <Icon size={14} />
              {f.label}
              <span className="text-xs opacity-70">({f.count})</span>
            </button>
          );
        })}
      </div>

      {filter === 'divination' ? (
        <div className="glass card card-hover p-6">
          <h2 className="font-serif text-lg font-semibold flex items-center gap-2 mb-1" style={{ color: C.deepBrown }}>
            <Sparkles size={18} style={{ color: C.wine }} />
            占卜档案
          </h2>
          <p className="text-xs mb-4" style={{ color: C.soft }}>每一卦，都是与自己的一次低语</p>
          <div className="divider-french mb-5" />

          {sortedDiv.length === 0 ? (
            <div className="text-center py-12" style={{ color: C.soft }}>
              <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: C.mist }}>
                <Compass size={30} style={{ color: C.dustyRose }} />
              </div>
              <p className="text-base font-serif mb-1" style={{ color: C.muted }}>尚无占卜记录</p>
              <p className="text-sm">去「玄学占卜」起一卦，听听内心的回响</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedDiv.map(d => {
                const info = DIV_TYPE_INFO[d.type] || DIV_TYPE_INFO.meihua;
                const Icon = info.icon;
                return (
                  <div
                    key={d.id}
                    className="rounded-xl p-4 group relative card-hover"
                    style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(201,168,118,0.12)' }}
                  >
                    <button
                      onClick={() => onDeleteDivination(d.id)}
                      className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition"
                      style={{ color: C.soft }}
                    >
                      <Trash2 size={13} />
                    </button>
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${info.color}, ${C.dustyRose})` }}
                      >
                        <Icon size={16} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="tag-french px-2 py-0.5 rounded" style={{ background: 'rgba(201,168,118,0.15)', color: info.color }}>
                            {info.label}
                          </span>
                          <span className="text-xs" style={{ color: C.soft }}>{getDateLabel(d.createdAt)}</span>
                        </div>
                        <p className="text-sm font-serif font-medium mb-1" style={{ color: C.deepBrown }}>
                          {d.question}
                        </p>
                        <p className="text-xs mb-2" style={{ color: C.muted }}>{d.result}</p>
                        <p className="text-sm font-serif leading-relaxed whitespace-pre-wrap" style={{ color: C.ink }}>
                          {d.interpretation}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="glass card card-hover p-6">
          <h2 className="font-serif text-lg font-semibold flex items-center gap-2 mb-1" style={{ color: C.deepBrown }}>
            <Feather size={18} style={{ color: C.wine }} />
            心情档案
          </h2>
          <p className="text-xs mb-4" style={{ color: C.soft }}>每一笔心情，都是时光的注脚</p>
          <div className="divider-french mb-5" />

          {sortedMoods.length === 0 ? (
            <div className="text-center py-12" style={{ color: C.soft }}>
              <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: C.mist }}>
                <Heart size={30} style={{ color: C.dustyRose }} />
              </div>
              <p className="text-base font-serif mb-1" style={{ color: C.muted }}>尚无心情记录</p>
              <p className="text-sm">去「情绪记录」写下第一笔心情</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedMoods.map(mood => {
                const info = MOOD_TYPES.find(m => m.id === mood.type);
                const Icon = info?.icon || Meh;
                return (
                  <div
                    key={mood.id}
                    className="rounded-xl p-4 group relative card-hover"
                    style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(201,168,118,0.12)' }}
                  >
                    <button
                      onClick={() => onDeleteMood(mood.id)}
                      className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition"
                      style={{ color: C.soft }}
                    >
                      <Trash2 size={13} />
                    </button>
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${info?.color || C.soft}, ${C.dustyRose})` }}
                      >
                        <Icon size={16} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-serif font-medium" style={{ color: C.deepBrown }}>{info?.label || '心情'}</span>
                          <span className="text-xs" style={{ color: C.soft }}>强度 {mood.intensity}/5 · 能量 {mood.energy}/5</span>
                          <span className="text-xs ml-auto" style={{ color: C.soft }}>{getDateLabel(mood.createdAt)}</span>
                        </div>
                        {mood.journal && (
                          <p className="text-sm mt-2 font-serif leading-relaxed" style={{ color: C.ink }}>{mood.journal}</p>
                        )}
                        {mood.gratitude && (
                          <p className="text-sm mt-1 italic" style={{ color: C.wine }}>
                            <Heart size={11} className="inline mr-1" />
                            {mood.gratitude}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}