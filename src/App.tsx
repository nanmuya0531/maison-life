import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Utensils, Dumbbell, Moon, Heart,
  Sparkles, BookOpen, Compass, MapPin, Menu, X, Gem,
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import Schedule from './components/Schedule';
import Fitness from './components/Fitness';
import Sleep from './components/Sleep';
import SoulCare from './components/SoulCare';
import English from './components/English';
import MediaStudio from './components/MediaStudio';
import LocalInfo from './components/LocalInfo';
import { storage, addRewardPoints } from './store';
import { Habit } from './types';

type TabType = 'dashboard' | 'schedule' | 'fitness' | 'sleep' | 'soul' | 'english' | 'media' | 'local';

const navItems: { id: TabType; icon: React.ReactNode; label: string; subtitle: string }[] = [
  { id: 'dashboard', icon: <LayoutDashboard size={18} />, label: '今日概览', subtitle: 'Overview' },
  { id: 'schedule', icon: <Compass size={18} />, label: '日程安排', subtitle: 'Schedule' },
  { id: 'fitness', icon: <Dumbbell size={18} />, label: '运动健身', subtitle: 'Fitness' },
  { id: 'sleep', icon: <Moon size={18} />, label: '睡眠管理', subtitle: 'Sleep' },
  { id: 'soul', icon: <Heart size={18} />, label: '心灵疗愈', subtitle: 'Soul Care' },
  { id: 'english', icon: <BookOpen size={18} />, label: '英语学习', subtitle: 'English' },
  { id: 'media', icon: <Sparkles size={18} />, label: '自媒体中心', subtitle: 'Media' },
  { id: 'local', icon: <MapPin size={18} />, label: '本地信息', subtitle: 'Local' },
];

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [rewardPoints, setRewardPoints] = useState(0);

  useEffect(() => {
    const loaded = storage.getHabits();
    if (loaded.length === 0) {
      const defaultHabits: Habit[] = [
        { id: '1', name: '阅读', icon: 'BookOpen', color: 'bg-amber-700', targetPerWeek: 7, history: [] },
        { id: '2', name: '运动', icon: 'Dumbbell', color: 'bg-sage', targetPerWeek: 5, history: [] },
        { id: '3', name: '冥想', icon: 'Heart', color: 'bg-rose-400', targetPerWeek: 7, history: [] },
        { id: '4', name: '英语', icon: 'BookOpen', color: 'bg-wine', targetPerWeek: 7, history: [] },
        { id: '5', name: '早睡', icon: 'Moon', color: 'bg-indigo-400', targetPerWeek: 7, history: [] },
      ];
      setHabits(defaultHabits);
      storage.setHabits(defaultHabits);
    } else {
      setHabits(loaded);
    }
    setRewardPoints(storage.getRewardPoints().total);
  }, []);

  const toggleHabit = (habitId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const updated = habits.map(h => {
      if (h.id === habitId) {
        const hasToday = h.history.includes(today);
        if (!hasToday) {
          addRewardPoints(`习惯打卡: ${h.name}`, 5);
          setRewardPoints(storage.getRewardPoints().total);
        }
        return {
          ...h,
          history: hasToday ? h.history.filter(d => d !== today) : [...h.history, today],
        };
      }
      return h;
    });
    setHabits(updated);
    storage.setHabits(updated);
  };

  const refreshPoints = () => setRewardPoints(storage.getRewardPoints().total);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard habits={habits} onToggleHabit={toggleHabit} rewardPoints={rewardPoints} onNavigate={(tab) => setActiveTab(tab as TabType)} />;
      case 'schedule':
        return <Schedule />;
      case 'fitness':
        return <Fitness onPointsEarned={refreshPoints} />;
      case 'sleep':
        return <Sleep onPointsEarned={refreshPoints} />;
      case 'soul':
        return <SoulCare onPointsEarned={refreshPoints} />;
      case 'english':
        return <English onPointsEarned={refreshPoints} />;
      case 'media':
        return <MediaStudio />;
      case 'local':
        return <LocalInfo />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen" style={{ background: '#FAF7F2' }}>
      {/* Sidebar */}
      <aside
        className={`fixed lg:relative top-0 left-0 h-full z-50 transition-all duration-300 ${
          sidebarOpen ? 'w-60 translate-x-0' : 'w-60 -translate-x-full lg:translate-x-0 lg:w-20'
        }`}
        style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(20px)', borderRight: '1px solid rgba(201,168,118,0.15)' }}
      >
        <div className="p-5 flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between mb-10">
            <div className={`flex items-center gap-3 ${sidebarOpen ? '' : 'lg:hidden'}`}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4A3C32, #8B4555)' }}>
                <Gem size={18} className="text-cream" style={{ color: '#FAF7F2' }} />
              </div>
              <div>
                <h1 className="font-serif text-base font-bold" style={{ color: '#3D3530' }}>Maison</h1>
                <p className="text-[10px] tracking-widest uppercase" style={{ color: '#B5A99A' }}>生活美学</p>
              </div>
            </div>
            <button
              className="lg:hidden p-1.5 rounded-lg hover:bg-white/40"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  activeTab === item.id
                    ? 'bg-white shadow-sm'
                    : 'hover:bg-white/40'
                } ${sidebarOpen ? '' : 'lg:justify-center'}`}
                style={activeTab === item.id ? { border: '1px solid rgba(201,168,118,0.2)' } : {}}
              >
                <span style={{ color: activeTab === item.id ? '#8B4555' : '#7A6E62' }}>
                  {item.icon}
                </span>
                <span className={`text-sm transition-opacity ${sidebarOpen ? 'opacity-100' : 'lg:opacity-0 lg:hidden'}`}>
                  <span className="block font-medium" style={{ color: activeTab === item.id ? '#3D3530' : '#5A5048' }}>
                    {item.label}
                  </span>
                  <span className="block text-[10px] tracking-wide" style={{ color: '#B5A99A' }}>
                    {item.subtitle}
                  </span>
                </span>
              </button>
            ))}
          </nav>

          {/* Reward Points */}
          <div className={`mt-4 p-4 rounded-lg ${sidebarOpen ? '' : 'lg:hidden'}`} style={{ background: 'linear-gradient(135deg, #F0EAE0, #E8E2D9)' }}>
            <p className="text-[10px] tracking-widest uppercase mb-1" style={{ color: '#B5A99A' }}>勋章积分</p>
            <p className="text-2xl font-serif font-bold" style={{ color: '#8B4555' }}>{rewardPoints}</p>
            <p className="text-[10px]" style={{ color: '#B5A99A' }}>坚持是最优雅的力量</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 min-w-0">
        <div className="max-w-5xl mx-auto">
          <button
            className="lg:hidden mb-4 p-2 rounded-lg glass"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={18} />
          </button>
          {renderContent()}
        </div>
      </main>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/10 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
