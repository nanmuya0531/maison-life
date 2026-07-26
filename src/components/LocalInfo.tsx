import { useState, useEffect } from 'react';
import {
  Briefcase, Home, MapPin, TrendingUp, TrendingDown, Minus,
  Plus, Bookmark, Calendar, X, Building2, Tag, Filter, Info,
  Sparkles, RefreshCw,
} from 'lucide-react';
import { storage, generateId, todayStr } from '../store';
import { JobInfo, HousingInfo } from '../types';

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
};

// 西安主要区域
const XI_AN_AREAS = [
  '高新区', '雁塔区', '未央区', '碑林区', '莲湖区',
  '新城区', '长安区', '灞桥区', '曲江新区', '经开区',
];

// 计算相对今日的偏移日期 (YYYY-MM-DD)
const dayOffset = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
};

// 预设招聘信息（适合35岁女性，自媒体/新媒体方向）
const DEFAULT_JOBS: Omit<JobInfo, 'id' | 'saved'>[] = [
  {
    title: '小红书运营专员',
    company: '锦绣文化传媒',
    salary: '6-9k',
    location: '高新区',
    tags: ['双休', '五险一金', '下午茶'],
    source: '示例数据',
    date: dayOffset(0),
  },
  {
    title: '新媒体文案策划',
    company: '墨韵科技',
    salary: '5-8k',
    location: '雁塔区',
    tags: ['弹性工作', '带薪年假'],
    source: '示例数据',
    date: dayOffset(0),
  },
  {
    title: '短视频编导',
    company: '长安视觉传媒',
    salary: '7-12k',
    location: '未央区',
    tags: ['项目奖金', '五险一金', '团队旅行'],
    source: '示例数据',
    date: dayOffset(1),
  },
  {
    title: '自媒体主播',
    company: '星河直播',
    salary: '8-15k',
    location: '碑林区',
    tags: ['五险一金', '免费培训', '提供设备'],
    source: '示例数据',
    date: dayOffset(1),
  },
  {
    title: '内容运营',
    company: '麦穗互联网',
    salary: '6-10k',
    location: '高新区',
    tags: ['双休', '弹性工作', '餐补'],
    source: '示例数据',
    date: dayOffset(2),
  },
  {
    title: '公众号编辑',
    company: '文心传媒',
    salary: '5-7k',
    location: '莲湖区',
    tags: ['弹性工作', '节日福利'],
    source: '示例数据',
    date: dayOffset(2),
  },
  {
    title: '直播运营',
    company: '月光传媒',
    salary: '7-11k',
    location: '新城区',
    tags: ['五险一金', '双休'],
    source: '示例数据',
    date: dayOffset(3),
  },
  {
    title: '抖音脚本策划',
    company: '拾光影像',
    salary: '6-9k',
    location: '雁塔区',
    tags: ['双休', '下午茶', '交通补贴'],
    source: '示例数据',
    date: dayOffset(3),
  },
  {
    title: '美妆博主孵化',
    company: '雅绘文化',
    salary: '8-13k',
    location: '高新区',
    tags: ['项目奖金', '五险一金', '产品福利'],
    source: '示例数据',
    date: dayOffset(4),
  },
  {
    title: '社群运营专员',
    company: '知遇科技',
    salary: '5-8k',
    location: '碑林区',
    tags: ['弹性工作', '带薪年假'],
    source: '示例数据',
    date: dayOffset(5),
  },
];

// 预设房价数据（西安各区域二手房均价）
const DEFAULT_HOUSING: Omit<HousingInfo, 'id'>[] = [
  { area: '高新区', price: 18500, trend: 'up', change: 1.2, date: dayOffset(0), source: '示例数据' },
  { area: '雁塔区', price: 15200, trend: 'down', change: -0.5, date: dayOffset(0), source: '示例数据' },
  { area: '未央区', price: 12800, trend: 'up', change: 0.3, date: dayOffset(1), source: '示例数据' },
  { area: '碑林区', price: 13800, trend: 'stable', change: 0, date: dayOffset(1), source: '示例数据' },
  { area: '莲湖区', price: 12500, trend: 'down', change: -0.4, date: dayOffset(2), source: '示例数据' },
  { area: '新城区', price: 11800, trend: 'stable', change: 0, date: dayOffset(2), source: '示例数据' },
  { area: '长安区', price: 10800, trend: 'up', change: 0.8, date: dayOffset(3), source: '示例数据' },
  { area: '灞桥区', price: 11200, trend: 'down', change: -0.2, date: dayOffset(3), source: '示例数据' },
  { area: '曲江新区', price: 19800, trend: 'up', change: 1.5, date: dayOffset(4), source: '示例数据' },
  { area: '经开区', price: 14200, trend: 'stable', change: 0.1, date: dayOffset(4), source: '示例数据' },
];

const TREND_OPTIONS = [
  { id: 'up' as const, label: '涨', icon: TrendingUp },
  { id: 'down' as const, label: '跌', icon: TrendingDown },
  { id: 'stable' as const, label: '稳', icon: Minus },
];

type TabType = 'jobs' | 'housing';

export default function LocalInfo() {
  const [activeTab, setActiveTab] = useState<TabType>('jobs');
  const [jobs, setJobs] = useState<JobInfo[]>([]);
  const [housing, setHousing] = useState<HousingInfo[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [showAddJob, setShowAddJob] = useState(false);
  const [showHousingForm, setShowHousingForm] = useState(false);
  const [editingHousingId, setEditingHousingId] = useState<string | null>(null);

  // 新增招聘表单
  const [newJob, setNewJob] = useState({
    title: '',
    company: '',
    salary: '',
    location: '高新区',
    tags: '',
    source: '手动添加',
    url: '',
  });

  // 房价表单
  const [housingForm, setHousingForm] = useState({
    area: '高新区',
    price: '',
    trend: 'stable' as HousingInfo['trend'],
    change: '',
    source: '手动更新',
  });

  useEffect(() => {
    const storedJobs = storage.getJobs();
    if (storedJobs.length === 0) {
      const initialized: JobInfo[] = DEFAULT_JOBS.map(j => ({
        ...j,
        id: generateId(),
        saved: false,
      }));
      storage.setJobs(initialized);
      setJobs(initialized);
    } else {
      setJobs(storedJobs);
    }

    const storedHousing = storage.getHousing();
    if (storedHousing.length === 0) {
      const initialized: HousingInfo[] = DEFAULT_HOUSING.map(h => ({
        ...h,
        id: generateId(),
      }));
      storage.setHousing(initialized);
      setHousing(initialized);
    } else {
      setHousing(storedHousing);
    }
  }, []);

  // ============ 招聘处理 ============
  const toggleSaveJob = (id: string) => {
    const updated = jobs.map(j => (j.id === id ? { ...j, saved: !j.saved } : j));
    setJobs(updated);
    storage.setJobs(updated);
  };

  const deleteJob = (id: string) => {
    const updated = jobs.filter(j => j.id !== id);
    setJobs(updated);
    storage.setJobs(updated);
  };

  const saveJob = () => {
    if (!newJob.title || !newJob.company) return;
    const job: JobInfo = {
      id: generateId(),
      title: newJob.title,
      company: newJob.company,
      salary: newJob.salary || '面议',
      location: newJob.location,
      tags: newJob.tags.split(',').map(t => t.trim()).filter(Boolean),
      source: newJob.source || '手动添加',
      url: newJob.url || undefined,
      date: todayStr(),
      saved: false,
    };
    const updated = [job, ...jobs];
    setJobs(updated);
    storage.setJobs(updated);
    setShowAddJob(false);
    setNewJob({ title: '', company: '', salary: '', location: '高新区', tags: '', source: '手动添加', url: '' });
  };

  // ============ 房价处理 ============
  const saveHousing = () => {
    const price = parseFloat(housingForm.price);
    if (isNaN(price) || price <= 0) return;
    const change = parseFloat(housingForm.change) || 0;
    const trend = housingForm.trend;

    if (editingHousingId) {
      const updated = housing.map(h =>
        h.id === editingHousingId
          ? { ...h, price, trend, change, date: todayStr(), source: housingForm.source || '手动更新' }
          : h
      );
      setHousing(updated);
      storage.setHousing(updated);
    } else {
      const existingIdx = housing.findIndex(h => h.area === housingForm.area);
      if (existingIdx >= 0) {
        const updated = [...housing];
        updated[existingIdx] = {
          ...updated[existingIdx],
          price,
          trend,
          change,
          date: todayStr(),
          source: housingForm.source || '手动更新',
        };
        setHousing(updated);
        storage.setHousing(updated);
      } else {
        const newItem: HousingInfo = {
          id: generateId(),
          area: housingForm.area,
          price,
          trend,
          change,
          date: todayStr(),
          source: housingForm.source || '手动更新',
        };
        const updated = [newItem, ...housing];
        setHousing(updated);
        storage.setHousing(updated);
      }
    }
    closeHousingForm();
  };

  const startEditHousing = (h: HousingInfo) => {
    setEditingHousingId(h.id);
    setHousingForm({
      area: h.area,
      price: String(h.price),
      trend: h.trend,
      change: String(h.change),
      source: h.source,
    });
    setShowHousingForm(true);
  };

  const deleteHousing = (id: string) => {
    const updated = housing.filter(h => h.id !== id);
    setHousing(updated);
    storage.setHousing(updated);
  };

  const closeHousingForm = () => {
    setShowHousingForm(false);
    setEditingHousingId(null);
    setHousingForm({ area: '高新区', price: '', trend: 'stable', change: '', source: '手动更新' });
  };

  // ============ 派生数据 ============
  const filteredJobs = selectedArea === 'all' ? jobs : jobs.filter(j => j.location === selectedArea);
  const savedJobsCount = jobs.filter(j => j.saved).length;

  const chartData = [...housing].sort((a, b) => b.price - a.price);
  const maxPrice = Math.max(...housing.map(h => h.price), 1);

  const trendColor = (trend: HousingInfo['trend']): string => {
    if (trend === 'up') return C.wine;
    if (trend === 'down') return C.sage;
    return C.roseGold;
  };

  const trendLabel = (trend: HousingInfo['trend']): string => {
    if (trend === 'up') return '上涨';
    if (trend === 'down') return '下跌';
    return '稳定';
  };

  const changeText = (change: number): string => {
    if (change > 0) return `+${change}%`;
    if (change < 0) return `${change}%`;
    return '持平';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: C.soft }}>
            Local Information · 长安
          </p>
          <h1
            className="text-3xl font-serif font-bold flex items-center gap-3"
            style={{ color: C.deepBrown }}
          >
            <MapPin size={28} style={{ color: C.wine }} />
            长安本地信息
          </h1>
          <p className="text-sm mt-2" style={{ color: C.muted }}>
            为你而立之年的归处，记录这座古城的机遇与温度
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass rounded-xl px-4 py-2 text-center">
            <p className="text-[10px] tracking-widest uppercase" style={{ color: C.soft }}>已收藏</p>
            <p className="text-xl font-serif font-bold" style={{ color: C.wine }}>{savedJobsCount}</p>
          </div>
        </div>
      </div>

      <div className="divider-french" />

      {/* Tabs */}
      <div className="flex gap-1 glass rounded-xl p-1.5 w-full md:inline-flex md:w-auto">
        {([
          { id: 'jobs', label: '长安招聘', icon: <Briefcase size={16} /> },
          { id: 'housing', label: '长安房价', icon: <Home size={16} /> },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === tab.id ? 'btn-french' : 'hover:bg-white/40'
            }`}
            style={activeTab === tab.id ? {} : { color: C.muted }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ====================== Tab 1: 招聘 ====================== */}
      {activeTab === 'jobs' && (
        <div className="space-y-5 animate-fade-in">
          {/* 说明 */}
          <div
            className="glass rounded-xl px-4 py-3 flex items-start gap-3"
            style={{ borderLeft: `3px solid ${C.roseGold}` }}
          >
            <Info size={16} className="mt-0.5 flex-shrink-0" style={{ color: C.roseGold }} />
            <p className="text-xs leading-relaxed" style={{ color: C.muted }}>
              实时招聘信息需接入招聘API，当前为示例数据。愿你在这座古城，遇见一份既能安身又可入心的工作。
            </p>
          </div>

          {/* 区域筛选 */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Filter size={14} className="flex-shrink-0" style={{ color: C.soft }} />
            <button
              onClick={() => setSelectedArea('all')}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition ${
                selectedArea === 'all' ? 'btn-rose' : 'glass'
              }`}
              style={selectedArea === 'all' ? {} : { color: C.muted }}
            >
              全部区域
            </button>
            {XI_AN_AREAS.map(area => (
              <button
                key={area}
                onClick={() => setSelectedArea(area)}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition ${
                  selectedArea === area ? 'btn-rose' : 'glass'
                }`}
                style={selectedArea === area ? {} : { color: C.muted }}
              >
                {area}
              </button>
            ))}
          </div>

          {/* 添加按钮 */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddJob(true)}
              className="btn-french px-5 py-2.5 text-sm font-medium flex items-center gap-2"
            >
              <Plus size={16} />
              添加招聘
            </button>
          </div>

          {/* 招聘列表 */}
          {filteredJobs.length === 0 ? (
            <div className="glass card rounded-2xl p-12 text-center">
              <Briefcase size={40} className="mx-auto mb-3" style={{ color: C.soft }} />
              <p style={{ color: C.muted }}>此区域暂无招聘信息</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filteredJobs.map(job => (
                <div key={job.id} className="glass card card-hover rounded-2xl p-5 group">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif text-lg font-semibold mb-1" style={{ color: C.deepBrown }}>
                        {job.title}
                      </h3>
                      <p className="text-sm flex items-center gap-1.5" style={{ color: C.muted }}>
                        <Building2 size={13} />
                        {job.company}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleSaveJob(job.id)}
                      className="p-2 rounded-lg transition flex-shrink-0"
                      style={{
                        background: job.saved ? 'rgba(139, 69, 85, 0.1)' : 'transparent',
                        color: job.saved ? C.wine : C.soft,
                      }}
                      aria-label={job.saved ? '取消收藏' : '收藏'}
                    >
                      <Bookmark size={18} fill={job.saved ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <span className="font-serif font-bold text-base" style={{ color: C.wine }}>
                      {job.salary}
                    </span>
                    <span className="flex items-center gap-1 text-xs" style={{ color: C.muted }}>
                      <MapPin size={12} />
                      {job.location}
                    </span>
                  </div>

                  {job.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {job.tags.map(tag => (
                        <span
                          key={tag}
                          className="tag-french"
                          style={{
                            background: 'rgba(201, 168, 118, 0.14)',
                            color: C.deepBrown,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div
                    className="flex items-center justify-between pt-3"
                    style={{ borderTop: `1px solid ${C.mist}` }}
                  >
                    <div className="flex items-center gap-3 text-xs" style={{ color: C.soft }}>
                      <span className="flex items-center gap-1">
                        <Tag size={11} />
                        {job.source}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {job.date}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteJob(job.id)}
                      className="opacity-0 group-hover:opacity-100 transition text-xs hover:underline"
                      style={{ color: C.soft }}
                    >
                      移除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ====================== Tab 2: 房价 ====================== */}
      {activeTab === 'housing' && (
        <div className="space-y-5 animate-fade-in">
          {/* 说明 */}
          <div
            className="glass rounded-xl px-4 py-3 flex items-start gap-3"
            style={{ borderLeft: `3px solid ${C.roseGold}` }}
          >
            <Info size={16} className="mt-0.5 flex-shrink-0" style={{ color: C.roseGold }} />
            <p className="text-xs leading-relaxed" style={{ color: C.muted }}>
              实时房价数据需接入房产API，当前为示例数据。愿你在长安，觅得一隅安顿身心的居所。
            </p>
          </div>

          {/* 柱状图 */}
          <div className="glass card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2
                className="font-serif text-lg font-semibold flex items-center gap-2"
                style={{ color: C.deepBrown }}
              >
                <Sparkles size={16} style={{ color: C.roseGold }} />
                各区域均价对比
              </h2>
              <p className="text-xs" style={{ color: C.soft }}>单位：元/㎡</p>
            </div>
            {chartData.length === 0 ? (
              <p className="text-center py-8 text-sm" style={{ color: C.muted }}>
                暂无数据
              </p>
            ) : (
              <div
                className="flex items-end justify-between gap-2 md:gap-3 overflow-x-auto pb-2"
                style={{ minHeight: '220px' }}
              >
                {chartData.map(h => {
                  const heightPct = (h.price / maxPrice) * 100;
                  const color = trendColor(h.trend);
                  return (
                    <div
                      key={h.id}
                      className="flex flex-col items-center gap-2 flex-1 min-w-[42px]"
                      style={{ height: '220px' }}
                    >
                      <span className="text-[10px] font-serif font-semibold" style={{ color: C.deepBrown }}>
                        {(h.price / 1000).toFixed(1)}k
                      </span>
                      <div className="flex-1 w-full flex items-end">
                        <div
                          className="w-full rounded-t-md transition-all duration-500"
                          style={{
                            height: `${Math.max(heightPct, 4)}%`,
                            minHeight: '10px',
                            background: `linear-gradient(180deg, ${color} 0%, ${color}aa 100%)`,
                          }}
                          title={`${h.area}：${h.price.toLocaleString()}元/㎡`}
                        />
                      </div>
                      <span className="text-[10px] text-center whitespace-nowrap" style={{ color: C.muted }}>
                        {h.area}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            {/* 图例 */}
            <div className="flex items-center justify-center gap-5 mt-5 pt-4" style={{ borderTop: `1px solid ${C.mist}` }}>
              {TREND_OPTIONS.map(t => (
                <div key={t.id} className="flex items-center gap-1.5">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-sm"
                    style={{ background: trendColor(t.id) }}
                  />
                  <span className="text-[11px]" style={{ color: C.muted }}>{trendLabel(t.id)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 更新按钮 */}
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingHousingId(null);
                setHousingForm({ area: '高新区', price: '', trend: 'stable', change: '', source: '手动更新' });
                setShowHousingForm(true);
              }}
              className="btn-french px-5 py-2.5 text-sm font-medium flex items-center gap-2"
            >
              <RefreshCw size={16} />
              更新价格
            </button>
          </div>

          {/* 房价列表 */}
          {housing.length === 0 ? (
            <div className="glass card rounded-2xl p-12 text-center">
              <Home size={40} className="mx-auto mb-3" style={{ color: C.soft }} />
              <p style={{ color: C.muted }}>暂无房价数据</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {housing.map(h => (
                <div key={h.id} className="glass card card-hover rounded-2xl p-5 group">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-serif text-lg font-semibold mb-1" style={{ color: C.deepBrown }}>
                        {h.area}
                      </h3>
                      <p className="text-xs flex items-center gap-1" style={{ color: C.soft }}>
                        <MapPin size={11} />
                        西安
                      </p>
                    </div>
                    <div
                      className="px-2.5 py-1 rounded-full text-xs flex items-center gap-1"
                      style={{
                        background: `${trendColor(h.trend)}1f`,
                        color: trendColor(h.trend),
                      }}
                    >
                      {h.trend === 'up' && <TrendingUp size={13} />}
                      {h.trend === 'down' && <TrendingDown size={13} />}
                      {h.trend === 'stable' && <Minus size={13} />}
                      {trendLabel(h.trend)}
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="font-serif text-2xl font-bold" style={{ color: C.deepBrown }}>
                      {h.price.toLocaleString()}
                    </span>
                    <span className="text-xs" style={{ color: C.muted }}>元/㎡</span>
                    <span className="ml-auto text-sm font-medium" style={{ color: trendColor(h.trend) }}>
                      {changeText(h.change)}
                    </span>
                  </div>

                  <div
                    className="flex items-center justify-between pt-3"
                    style={{ borderTop: `1px solid ${C.mist}` }}
                  >
                    <div className="flex items-center gap-3 text-xs" style={{ color: C.soft }}>
                      <span className="flex items-center gap-1">
                        <Tag size={11} />
                        {h.source}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {h.date}
                      </span>
                    </div>
                    <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => startEditHousing(h)}
                        className="text-xs hover:underline"
                        style={{ color: C.roseGold }}
                      >
                        更新
                      </button>
                      <button
                        onClick={() => deleteHousing(h.id)}
                        className="text-xs hover:underline"
                        style={{ color: C.soft }}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============ 添加招聘 Modal ============ */}
      {showAddJob && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          style={{ backdropFilter: 'blur(4px)' }}
          onClick={() => setShowAddJob(false)}
        >
          <div
            className="glass rounded-3xl w-full max-w-lg p-6 animate-slide-up max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] tracking-widest uppercase mb-1" style={{ color: C.soft }}>
                  New Opportunity
                </p>
                <h2 className="text-xl font-serif font-bold" style={{ color: C.deepBrown }}>
                  添加招聘信息
                </h2>
              </div>
              <button
                onClick={() => setShowAddJob(false)}
                className="p-1.5 rounded-lg hover:bg-white/40"
                style={{ color: C.muted }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs tracking-wide mb-1.5 block" style={{ color: C.muted }}>
                  职位名称
                </label>
                <input
                  type="text"
                  value={newJob.title}
                  onChange={e => setNewJob({ ...newJob, title: e.target.value })}
                  placeholder="如：新媒体文案策划"
                  className="input-french w-full px-4 py-3"
                />
              </div>

              <div>
                <label className="text-xs tracking-wide mb-1.5 block" style={{ color: C.muted }}>
                  公司名称
                </label>
                <input
                  type="text"
                  value={newJob.company}
                  onChange={e => setNewJob({ ...newJob, company: e.target.value })}
                  placeholder="如：某某文化传媒"
                  className="input-french w-full px-4 py-3"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs tracking-wide mb-1.5 block" style={{ color: C.muted }}>
                    薪资范围
                  </label>
                  <input
                    type="text"
                    value={newJob.salary}
                    onChange={e => setNewJob({ ...newJob, salary: e.target.value })}
                    placeholder="如：6-9k"
                    className="input-french w-full px-4 py-3"
                  />
                </div>
                <div>
                  <label className="text-xs tracking-wide mb-1.5 block" style={{ color: C.muted }}>
                    所在区域
                  </label>
                  <select
                    value={newJob.location}
                    onChange={e => setNewJob({ ...newJob, location: e.target.value })}
                    className="input-french w-full px-4 py-3"
                  >
                    {XI_AN_AREAS.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs tracking-wide mb-1.5 block" style={{ color: C.muted }}>
                  标签（用逗号分隔）
                </label>
                <input
                  type="text"
                  value={newJob.tags}
                  onChange={e => setNewJob({ ...newJob, tags: e.target.value })}
                  placeholder="如：双休, 五险一金, 弹性"
                  className="input-french w-full px-4 py-3"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs tracking-wide mb-1.5 block" style={{ color: C.muted }}>
                    来源
                  </label>
                  <input
                    type="text"
                    value={newJob.source}
                    onChange={e => setNewJob({ ...newJob, source: e.target.value })}
                    placeholder="如：手动添加"
                    className="input-french w-full px-4 py-3"
                  />
                </div>
                <div>
                  <label className="text-xs tracking-wide mb-1.5 block" style={{ color: C.muted }}>
                    链接（可选）
                  </label>
                  <input
                    type="url"
                    value={newJob.url}
                    onChange={e => setNewJob({ ...newJob, url: e.target.value })}
                    placeholder="https://..."
                    className="input-french w-full px-4 py-3"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddJob(false)}
                className="flex-1 py-3 rounded-xl text-sm font-medium transition glass"
                style={{ color: C.muted }}
              >
                取消
              </button>
              <button
                onClick={saveJob}
                disabled={!newJob.title || !newJob.company}
                className="btn-rose flex-1 py-3 text-sm font-medium disabled:opacity-50"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ 房价表单 Modal ============ */}
      {showHousingForm && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          style={{ backdropFilter: 'blur(4px)' }}
          onClick={closeHousingForm}
        >
          <div
            className="glass rounded-3xl w-full max-w-lg p-6 animate-slide-up max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] tracking-widest uppercase mb-1" style={{ color: C.soft }}>
                  Price Update
                </p>
                <h2 className="text-xl font-serif font-bold" style={{ color: C.deepBrown }}>
                  {editingHousingId ? '更新房价记录' : '添加房价记录'}
                </h2>
              </div>
              <button
                onClick={closeHousingForm}
                className="p-1.5 rounded-lg hover:bg-white/40"
                style={{ color: C.muted }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs tracking-wide mb-1.5 block" style={{ color: C.muted }}>
                  区域
                </label>
                <select
                  value={housingForm.area}
                  onChange={e => setHousingForm({ ...housingForm, area: e.target.value })}
                  className="input-french w-full px-4 py-3"
                  disabled={!!editingHousingId}
                >
                  {XI_AN_AREAS.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
                {editingHousingId && (
                  <p className="text-[11px] mt-1" style={{ color: C.soft }}>
                    编辑模式下区域不可更改
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs tracking-wide mb-1.5 block" style={{ color: C.muted }}>
                  均价（元/㎡）
                </label>
                <input
                  type="number"
                  value={housingForm.price}
                  onChange={e => setHousingForm({ ...housingForm, price: e.target.value })}
                  placeholder="如：18500"
                  className="input-french w-full px-4 py-3"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs tracking-wide mb-1.5 block" style={{ color: C.muted }}>
                    趋势
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {TREND_OPTIONS.map(t => {
                      const Icon = t.icon;
                      const selected = housingForm.trend === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setHousingForm({ ...housingForm, trend: t.id })}
                          className="py-2.5 rounded-lg text-sm flex items-center justify-center gap-1 transition"
                          style={{
                            background: selected ? trendColor(t.id) : 'rgba(255,255,255,0.6)',
                            color: selected ? '#FAF7F2' : C.muted,
                            border: `1px solid ${selected ? trendColor(t.id) : 'rgba(201,168,118,0.2)'}`,
                          }}
                        >
                          <Icon size={14} />
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-xs tracking-wide mb-1.5 block" style={{ color: C.muted }}>
                    变化幅度（%）
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={housingForm.change}
                    onChange={e => setHousingForm({ ...housingForm, change: e.target.value })}
                    placeholder="如：1.2"
                    className="input-french w-full px-4 py-3"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs tracking-wide mb-1.5 block" style={{ color: C.muted }}>
                  来源
                </label>
                <input
                  type="text"
                  value={housingForm.source}
                  onChange={e => setHousingForm({ ...housingForm, source: e.target.value })}
                  placeholder="如：手动更新"
                  className="input-french w-full px-4 py-3"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeHousingForm}
                className="flex-1 py-3 rounded-xl text-sm font-medium transition glass"
                style={{ color: C.muted }}
              >
                取消
              </button>
              <button
                onClick={saveHousing}
                disabled={!housingForm.price}
                className="btn-rose flex-1 py-3 text-sm font-medium disabled:opacity-50"
              >
                {editingHousingId ? '更新' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
