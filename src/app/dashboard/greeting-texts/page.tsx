'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { MessageCircleHeart, Plus, Edit2, Trash2, Search, ToggleLeft, ToggleRight, X, Eye, Sparkles, Sun, Moon, Sunrise, Sunset, Clock, Settings, Timer, Check, ArrowUp, Type, ZoomIn, ArrowRight, Droplets, RotateCcw, ArrowDownUp } from 'lucide-react';

interface GreetingText {
  id?: number;
  text: string;
  translation: string;
  language: string;
  time_category: string;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

const TIME_CATEGORIES = ['pagi', 'siang', 'sore', 'malam', 'umum'];
const LANGUAGES = ['arab', 'jawa', 'umum'];

const TIME_LABELS: Record<string, string> = {
  pagi: '🌅 Pagi (04:00-10:59)',
  siang: '☀️ Siang (11:00-14:59)',
  sore: '🌇 Sore (15:00-17:59)',
  malam: '🌙 Malam (18:00-03:59)',
  umum: '🔄 Umum (Kapan saja)',
};

const LANG_LABELS: Record<string, string> = {
  arab: '🕌 Arab',
  jawa: '🏛️ Jawa',
  umum: '📝 Umum',
};

const TIME_COLORS: Record<string, string> = {
  pagi: 'bg-amber-50 text-amber-700 border-amber-200',
  siang: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  sore: 'bg-orange-50 text-orange-700 border-orange-200',
  malam: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  umum: 'bg-purple-50 text-purple-700 border-purple-200',
};

const TIME_ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  pagi: Sunrise,
  siang: Sun,
  sore: Sunset,
  malam: Moon,
  umum: Clock,
};

/* ─────────── Animated Counter ─────────── */
function AnimatedCounter({ target, duration = 800 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    if (target === prevTarget.current) return;
    const start = prevTarget.current;
    prevTarget.current = target;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setCount(Math.round(start + (target - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);

  return <>{count}</>;
}

/* ─────────── Live Preview Banner ─────────── */
function LivePreviewBanner({ greetings, intervalMs, animationType }: { greetings: GreetingText[]; intervalMs: number; animationType: string }) {
  const active = greetings.filter(g => g.is_active);
  const [index, setIndex] = useState(0);
  const [animState, setAnimState] = useState<'in' | 'out'>('in');

  useEffect(() => {
    if (active.length <= 1) return;
    const interval = setInterval(() => {
      setAnimState('out');
      setTimeout(() => {
        setIndex(i => (i + 1) % active.length);
        setAnimState('in');
      }, 400);
    }, intervalMs);
    return () => clearInterval(interval);
  }, [active.length, intervalMs]);

  // CSS animation styles based on animation type
  const getAnimStyle = (state: 'in' | 'out'): React.CSSProperties => {
    const isIn = state === 'in';
    switch (animationType) {
      case 'slide_up':
        return { opacity: isIn ? 1 : 0, transform: isIn ? 'translateY(0)' : 'translateY(-12px)', transition: 'all 0.4s ease' };
      case 'fade':
        return { opacity: isIn ? 1 : 0, transition: 'opacity 0.5s ease' };
      case 'typewriter':
        return { opacity: isIn ? 1 : 0, clipPath: isIn ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)', transition: 'all 0.6s ease' };
      case 'scale':
        return { opacity: isIn ? 1 : 0, transform: isIn ? 'scale(1)' : 'scale(0.7)', transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' };
      case 'slide_right':
        return { opacity: isIn ? 1 : 0, transform: isIn ? 'translateX(0)' : 'translateX(-20px)', transition: 'all 0.4s ease' };
      case 'blur':
        return { opacity: isIn ? 1 : 0, filter: isIn ? 'blur(0px)' : 'blur(8px)', transition: 'all 0.5s ease' };
      case 'flip':
        return { opacity: isIn ? 1 : 0, transform: isIn ? 'perspective(600px) rotateX(0)' : 'perspective(600px) rotateX(90deg)', transition: 'all 0.5s ease' };
      case 'bounce':
        return { opacity: isIn ? 1 : 0, transform: isIn ? 'translateY(0)' : 'translateY(16px)', transition: isIn ? 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'all 0.3s ease' };
      default:
        return { opacity: isIn ? 1 : 0, transform: isIn ? 'translateY(0)' : 'translateY(-12px)', transition: 'all 0.4s ease' };
    }
  };

  if (active.length === 0) return null;
  const current = active[index % active.length];
  if (!current) return null;

  const langDotColor = current.language === 'arab' ? 'bg-amber-400' : current.language === 'jawa' ? 'bg-emerald-400' : 'bg-purple-400';
  const TimeIcon = TIME_ICON_MAP[current.time_category] || Clock;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-amber-500 p-[1px]">
      <div className="relative rounded-2xl bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 px-6 py-5 overflow-hidden">
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-32 h-32 bg-purple-500/10 rounded-full -top-8 -right-8 animate-pulse" />
          <div className="absolute w-24 h-24 bg-pink-500/10 rounded-full bottom-0 left-12 animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute w-16 h-16 bg-amber-500/10 rounded-full top-2 left-1/3 animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative z-10 flex items-center gap-4">
          {/* Live indicator */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1">
              <Eye size={12} className="text-green-400" />
              <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Live Preview</span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <TimeIcon size={12} className="text-white/40" />
              <span className="text-[10px] text-white/40 capitalize">{current.time_category}</span>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-12 bg-white/10" />

          {/* Greeting text with animation */}
          <div className="flex-1 min-w-0">
            <div
              style={getAnimStyle(animState)}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${langDotColor} animate-pulse`} />
                <p className="text-lg font-bold text-white truncate" style={{ fontFamily: 'var(--font-display, Montserrat, sans-serif)' }}>
                  {current.text}
                </p>
              </div>
              {current.translation && (
                <p className="text-xs text-white/50 italic truncate pl-4">
                  {current.translation}
                </p>
              )}
            </div>
          </div>

          {/* Counter */}
          <div className="text-right shrink-0">
            <p className="text-3xl font-black text-white/20 font-mono">
              {(index % active.length) + 1}/{active.length}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        {active.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
            <div
              className="h-full bg-gradient-to-r from-purple-400 to-pink-400"
              style={{ animation: `progress ${intervalMs / 1000}s linear infinite` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function GreetingTextsPage() {
  const [greetings, setGreetings] = useState<GreetingText[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTime, setFilterTime] = useState('Semua');
  const [filterLang, setFilterLang] = useState('Semua');
  const [showModal, setShowModal] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [intervalSeconds, setIntervalSeconds] = useState(8);
  const [intervalSaved, setIntervalSaved] = useState(false);
  const [animationType, setAnimationType] = useState('slide_up');
  const [animSaved, setAnimSaved] = useState(false);
  const [form, setForm] = useState<GreetingText>({
    text: '',
    translation: '',
    language: 'arab',
    time_category: 'umum',
    is_active: true,
    sort_order: 0,
  });

  useEffect(() => { setMounted(true); }, []);

  const fetchGreetings = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('greeting_texts')
      .select('*')
      .order('time_category')
      .order('sort_order');
    setGreetings(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchGreetings(); }, [fetchGreetings]);

  // Fetch interval & animation type from app_settings
  useEffect(() => {
    (async () => {
      // Fetch interval
      const { data: d1 } = await supabase.from('app_settings').select('greeting_interval_seconds').limit(1).single();
      if (d1?.greeting_interval_seconds) setIntervalSeconds(d1.greeting_interval_seconds);

      // Fetch animation type (column may not exist yet)
      const { data: d2, error: e2 } = await supabase.from('app_settings').select('greeting_animation_type').limit(1).single();
      if (!e2 && d2?.greeting_animation_type) setAnimationType(d2.greeting_animation_type);
    })();
  }, []);

  const saveInterval = async (value: number) => {
    setIntervalSeconds(value);
    const { error } = await supabase.from('app_settings').update({ greeting_interval_seconds: value }).not('id', 'is', null);
    if (error) {
      alert(`Gagal menyimpan interval: ${error.message}`);
      return;
    }
    setIntervalSaved(true);
    setTimeout(() => setIntervalSaved(false), 2000);
  };

  const saveAnimationType = async (value: string) => {
    setAnimationType(value);
    const { error } = await supabase.from('app_settings').update({ greeting_animation_type: value }).not('id', 'is', null);
    if (error) {
      alert(`Gagal menyimpan animasi: ${error.message}\n\nPastikan kolom greeting_animation_type sudah ada.\nJalankan SQL:\nALTER TABLE app_settings ADD COLUMN IF NOT EXISTS greeting_animation_type text NOT NULL DEFAULT 'slide_up';`);
      return;
    }
    setAnimSaved(true);
    setTimeout(() => setAnimSaved(false), 2000);
  };

  const filtered = greetings.filter(g => {
    const matchSearch = !search || g.text.toLowerCase().includes(search.toLowerCase()) || (g.translation || '').toLowerCase().includes(search.toLowerCase());
    const matchTime = filterTime === 'Semua' || g.time_category === filterTime;
    const matchLang = filterLang === 'Semua' || g.language === filterLang;
    return matchSearch && matchTime && matchLang;
  });

  const handleSave = async () => {
    const payload = {
      text: form.text,
      translation: form.translation || null,
      language: form.language,
      time_category: form.time_category,
      is_active: form.is_active,
      sort_order: form.sort_order,
    };

    if (editId) {
      await supabase.from('greeting_texts').update(payload).eq('id', editId);
    } else {
      await supabase.from('greeting_texts').insert(payload);
    }
    closeModal();
    fetchGreetings();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus sapaan ini?')) return;
    await supabase.from('greeting_texts').delete().eq('id', id);
    fetchGreetings();
  };

  const handleToggle = async (g: GreetingText) => {
    await supabase.from('greeting_texts').update({ is_active: !g.is_active }).eq('id', g.id);
    fetchGreetings();
  };

  const openEdit = (g: GreetingText) => {
    setEditId(g.id!);
    setForm({ ...g });
    openModal();
  };

  const openModal = () => {
    setShowModal(true);
    requestAnimationFrame(() => setModalVisible(true));
  };

  const closeModal = () => {
    setModalVisible(false);
    setTimeout(() => {
      setShowModal(false);
      resetForm();
    }, 300);
  };

  const resetForm = () => {
    setEditId(null);
    setForm({
      text: '',
      translation: '',
      language: 'arab',
      time_category: 'umum',
      is_active: true,
      sort_order: 0,
    });
  };

  // Stats
  const stats = {
    total: greetings.length,
    active: greetings.filter(g => g.is_active).length,
    pagi: greetings.filter(g => g.time_category === 'pagi').length,
    siang: greetings.filter(g => g.time_category === 'siang').length,
    sore: greetings.filter(g => g.time_category === 'sore').length,
    malam: greetings.filter(g => g.time_category === 'malam').length,
    umum: greetings.filter(g => g.time_category === 'umum').length,
  };

  const statsConfig = [
    { key: 'total', label: 'Total', value: stats.total, bg: 'bg-white', border: 'border-slate-100', text: 'text-slate-800', sub: 'text-slate-400', icon: '📊' },
    { key: 'active', label: 'Aktif', value: stats.active, bg: 'bg-white', border: 'border-green-100', text: 'text-green-600', sub: 'text-green-400', icon: '✅' },
    { key: 'pagi', label: 'Pagi', value: stats.pagi, bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700', sub: 'text-amber-500', icon: '🌅' },
    { key: 'siang', label: 'Siang', value: stats.siang, bg: 'bg-yellow-50', border: 'border-yellow-100', text: 'text-yellow-700', sub: 'text-yellow-500', icon: '☀️' },
    { key: 'sore', label: 'Sore', value: stats.sore, bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-700', sub: 'text-orange-500', icon: '🌇' },
    { key: 'malam', label: 'Malam', value: stats.malam, bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-700', sub: 'text-indigo-500', icon: '🌙' },
    { key: 'umum', label: 'Umum', value: stats.umum, bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-700', sub: 'text-purple-500', icon: '🔄' },
  ];

  return (
    <div className="space-y-6">
      {/* ───── Header with entrance animation ───── */}
      <div
        className="flex items-center justify-between transition-all duration-700"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(-16px)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white group">
            <MessageCircleHeart size={22} className="transition-transform group-hover:scale-110" />
            <Sparkles size={10} className="absolute -top-1 -right-1 text-amber-400 animate-bounce" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Teks Sapaan</h1>
            <p className="text-xs text-slate-400">Kelola teks sapaan pengguna aplikasi</p>
          </div>
        </div>
        <button
          onClick={() => { resetForm(); openModal(); }}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 hover:shadow-lg hover:shadow-purple-200 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 text-sm font-medium"
        >
          <Plus size={16} /> Tambah Sapaan
        </button>
      </div>

      {/* ───── Live Preview Banner ───── */}
      <div
        className="transition-all duration-700"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(16px)',
          transitionDelay: '100ms',
        }}
      >
        <LivePreviewBanner greetings={greetings} intervalMs={intervalSeconds * 1000} animationType={animationType} />
      </div>

      {/* ───── Interval Settings ───── */}
      <div
        className="transition-all duration-700"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(16px)',
          transitionDelay: '150ms',
        }}
      >
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white">
                <Timer size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Interval Animasi</p>
                <p className="text-[11px] text-slate-400">Jeda waktu perpindahan antar teks sapaan di aplikasi</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Preset buttons */}
              <div className="flex items-center gap-1">
                {[3, 5, 8, 10, 15, 20].map(sec => (
                  <button
                    key={sec}
                    onClick={() => saveInterval(sec)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                      intervalSeconds === sec
                        ? 'bg-purple-600 text-white shadow-sm shadow-purple-200 scale-105'
                        : 'bg-slate-50 text-slate-500 hover:bg-purple-50 hover:text-purple-600'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>

              {/* Custom input */}
              <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-2 py-1">
                <Settings size={12} className="text-slate-400" />
                <input
                  type="number"
                  min={2}
                  max={60}
                  value={intervalSeconds}
                  onChange={e => {
                    const v = parseInt(e.target.value) || 8;
                    setIntervalSeconds(Math.max(2, Math.min(60, v)));
                  }}
                  onBlur={() => saveInterval(intervalSeconds)}
                  onKeyDown={e => { if (e.key === 'Enter') saveInterval(intervalSeconds); }}
                  className="w-12 bg-transparent text-center text-sm font-mono font-bold text-slate-700 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400">detik</span>
              </div>

              {/* Save indicator */}
              <div className={`flex items-center gap-1 transition-all duration-300 ${intervalSaved ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}`}>
                <Check size={14} className="text-green-500" />
                <span className="text-xs text-green-500 font-medium">Tersimpan</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ───── Animation Type Picker ───── */}
      <div
        className="transition-all duration-700"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(16px)',
          transitionDelay: '175ms',
        }}
      >
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center text-white">
                <Sparkles size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Jenis Animasi</p>
                <p className="text-[11px] text-slate-400">Pilih efek animasi saat teks sapaan berganti di aplikasi</p>
              </div>
            </div>
            <div className={`flex items-center gap-1 transition-all duration-300 ${animSaved ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}`}>
              <Check size={14} className="text-green-500" />
              <span className="text-xs text-green-500 font-medium">Tersimpan</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {([
              { key: 'slide_up', label: 'Slide Up', desc: 'Geser dari bawah ke atas', icon: ArrowUp, activeBg: 'bg-purple-50', activeBorder: 'border-purple-400', activeShadow: 'shadow-purple-100', iconBg: 'bg-purple-500', checkBg: 'bg-purple-500' },
              { key: 'fade', label: 'Fade', desc: 'Muncul perlahan', icon: Eye, activeBg: 'bg-blue-50', activeBorder: 'border-blue-400', activeShadow: 'shadow-blue-100', iconBg: 'bg-blue-500', checkBg: 'bg-blue-500' },
              { key: 'typewriter', label: 'Typewriter', desc: 'Ketik huruf per huruf', icon: Type, activeBg: 'bg-emerald-50', activeBorder: 'border-emerald-400', activeShadow: 'shadow-emerald-100', iconBg: 'bg-emerald-500', checkBg: 'bg-emerald-500' },
              { key: 'scale', label: 'Scale', desc: 'Membesar dari kecil', icon: ZoomIn, activeBg: 'bg-amber-50', activeBorder: 'border-amber-400', activeShadow: 'shadow-amber-100', iconBg: 'bg-amber-500', checkBg: 'bg-amber-500' },
              { key: 'slide_right', label: 'Slide Right', desc: 'Geser dari kiri ke kanan', icon: ArrowRight, activeBg: 'bg-cyan-50', activeBorder: 'border-cyan-400', activeShadow: 'shadow-cyan-100', iconBg: 'bg-cyan-500', checkBg: 'bg-cyan-500' },
              { key: 'blur', label: 'Blur', desc: 'Buram menjadi jelas', icon: Droplets, activeBg: 'bg-pink-50', activeBorder: 'border-pink-400', activeShadow: 'shadow-pink-100', iconBg: 'bg-pink-500', checkBg: 'bg-pink-500' },
              { key: 'flip', label: 'Flip', desc: 'Efek balik 3D', icon: RotateCcw, activeBg: 'bg-indigo-50', activeBorder: 'border-indigo-400', activeShadow: 'shadow-indigo-100', iconBg: 'bg-indigo-500', checkBg: 'bg-indigo-500' },
              { key: 'bounce', label: 'Bounce', desc: 'Memantul dari bawah', icon: ArrowDownUp, activeBg: 'bg-orange-50', activeBorder: 'border-orange-400', activeShadow: 'shadow-orange-100', iconBg: 'bg-orange-500', checkBg: 'bg-orange-500' },
            ] as const).map(anim => {
              const isActive = animationType === anim.key;
              const IconComp = anim.icon;
              return (
                <button
                  key={anim.key}
                  onClick={() => saveAnimationType(anim.key)}
                  className={`relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 text-left ${
                    isActive
                      ? `${anim.activeBorder} ${anim.activeBg} shadow-sm ${anim.activeShadow}`
                      : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? `${anim.iconBg} text-white`
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    <IconComp size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold ${isActive ? 'text-slate-800' : 'text-slate-600'}`}>
                      {anim.label}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{anim.desc}</p>
                  </div>
                  {isActive && (
                    <div className="absolute top-1.5 right-1.5">
                      <div className={`w-4 h-4 rounded-full ${anim.checkBg} flex items-center justify-center`}>
                        <Check size={10} className="text-white" />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ───── Stats Grid with staggered entrance ───── */}
      <div className="grid grid-cols-7 gap-3">
        {statsConfig.map((s, i) => (
          <div
            key={s.key}
            className={`${s.bg} rounded-xl p-4 border ${s.border} transition-all duration-500 hover:shadow-md hover:-translate-y-1 cursor-default`}
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(24px)',
              transitionDelay: `${200 + i * 80}ms`,
            }}
          >
            <div className="flex items-center justify-between">
              <p className={`text-2xl font-bold ${s.text}`}>
                <AnimatedCounter target={s.value} />
              </p>
              <span className="text-lg">{s.icon}</span>
            </div>
            <p className={`text-xs ${s.sub} mt-1`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ───── Filters ───── */}
      <div
        className="flex flex-wrap gap-3 items-center transition-all duration-700"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(16px)',
          transitionDelay: '500ms',
        }}
      >
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-2.5 text-slate-300" size={16} />
          <input
            type="text"
            placeholder="Cari sapaan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 transition-shadow"
          />
        </div>
        <select
          value={filterTime}
          onChange={e => setFilterTime(e.target.value)}
          className="px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm transition-shadow focus:ring-2 focus:ring-purple-200"
        >
          <option value="Semua">Semua Waktu</option>
          {TIME_CATEGORIES.map(t => (
            <option key={t} value={t}>{TIME_LABELS[t]}</option>
          ))}
        </select>
        <select
          value={filterLang}
          onChange={e => setFilterLang(e.target.value)}
          className="px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm transition-shadow focus:ring-2 focus:ring-purple-200"
        >
          <option value="Semua">Semua Bahasa</option>
          {LANGUAGES.map(l => (
            <option key={l} value={l}>{LANG_LABELS[l]}</option>
          ))}
        </select>
      </div>

      {/* ───── List with staggered card animations ───── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="relative">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-200 border-t-purple-500" />
            <MessageCircleHeart size={16} className="absolute inset-0 m-auto text-purple-400 animate-pulse" />
          </div>
          <p className="text-xs text-slate-400 animate-pulse">Memuat sapaan...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4">
            <MessageCircleHeart size={28} className="text-slate-300 animate-pulse" />
          </div>
          <p className="font-medium">Belum ada teks sapaan</p>
          <p className="text-xs mt-1">Klik tombol &quot;Tambah Sapaan&quot; untuk memulai</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((g, i) => {
            const TimeIcon = TIME_ICON_MAP[g.time_category] || Clock;
            return (
              <div
                key={g.id}
                className={`group bg-white rounded-xl border p-4 flex items-center gap-4 
                  transition-all duration-300 
                  hover:shadow-md hover:shadow-purple-100/50 hover:-translate-y-[2px] hover:border-purple-200
                  ${!g.is_active ? 'opacity-40 hover:opacity-60' : ''}`}
                style={{
                  animation: `slideUp 0.4s ease-out ${i * 60}ms both`,
                }}
              >
                {/* Time category badge with icon */}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition-transform group-hover:scale-105 ${TIME_COLORS[g.time_category] || TIME_COLORS.umum}`}>
                  <TimeIcon size={12} />
                  {g.time_category}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-800 truncate group-hover:text-purple-700 transition-colors">
                      {g.text}
                    </p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full transition-transform group-hover:scale-110 ${
                      g.language === 'arab' ? 'bg-amber-100 text-amber-700' :
                      g.language === 'jawa' ? 'bg-green-100 text-green-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {g.language}
                    </span>
                  </div>
                  {g.translation && (
                    <p className="text-xs text-slate-400 truncate mt-0.5">{g.translation}</p>
                  )}
                </div>

                {/* Sort order — appears on hover */}
                <span className="text-xs text-slate-300 font-mono opacity-0 group-hover:opacity-100 transition-opacity">#{g.sort_order}</span>

                {/* Actions — slide in on hover */}
                <div className="flex items-center gap-1 transition-all duration-200 translate-x-2 opacity-60 group-hover:translate-x-0 group-hover:opacity-100">
                  <button
                    onClick={() => handleToggle(g)}
                    className="p-2 rounded-lg hover:bg-slate-50 transition-all hover:scale-110"
                    title={g.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  >
                    {g.is_active ? (
                      <ToggleRight size={18} className="text-green-500" />
                    ) : (
                      <ToggleLeft size={18} className="text-slate-300" />
                    )}
                  </button>
                  <button
                    onClick={() => openEdit(g)}
                    className="p-2 rounded-lg hover:bg-purple-50 transition-all hover:scale-110"
                  >
                    <Edit2 size={14} className="text-slate-400 group-hover:text-purple-500 transition-colors" />
                  </button>
                  <button
                    onClick={() => handleDelete(g.id!)}
                    className="p-2 rounded-lg hover:bg-red-50 transition-all hover:scale-110"
                  >
                    <Trash2 size={14} className="text-slate-300 hover:text-red-500 transition-colors" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ───── Modal with animated backdrop + scale ───── */}
      {showModal && (
        <div
          className={`fixed inset-0 flex items-center justify-center z-50 p-4 transition-all duration-300 ${
            modalVisible ? 'bg-black/40 backdrop-blur-sm' : 'bg-black/0'
          }`}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 transition-all duration-300"
            style={{
              opacity: modalVisible ? 1 : 0,
              transform: modalVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(16px)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white">
                  {editId ? <Edit2 size={14} /> : <Plus size={14} />}
                </div>
                <h2 className="text-lg font-bold text-slate-800">
                  {editId ? 'Edit Sapaan' : 'Tambah Sapaan'}
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-all hover:rotate-90 duration-300"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-3">
              <div style={{ animation: 'fadeIn 0.3s ease-out 0.1s both' }}>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Teks Sapaan *</label>
                <input
                  type="text"
                  value={form.text}
                  onChange={e => setForm({ ...form, text: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 transition-shadow"
                  placeholder="Contoh: Shobahul Khoir"
                  autoFocus
                />
              </div>

              <div style={{ animation: 'fadeIn 0.3s ease-out 0.15s both' }}>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Terjemahan / Keterangan</label>
                <input
                  type="text"
                  value={form.translation}
                  onChange={e => setForm({ ...form, translation: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 transition-shadow"
                  placeholder="Selamat pagi yang penuh kebaikan"
                />
              </div>

              <div className="grid grid-cols-2 gap-3" style={{ animation: 'fadeIn 0.3s ease-out 0.2s both' }}>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Bahasa</label>
                  <select
                    value={form.language}
                    onChange={e => setForm({ ...form, language: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  >
                    {LANGUAGES.map(l => (
                      <option key={l} value={l}>{LANG_LABELS[l]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Kategori Waktu</label>
                  <select
                    value={form.time_category}
                    onChange={e => setForm({ ...form, time_category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  >
                    {TIME_CATEGORIES.map(t => (
                      <option key={t} value={t}>{TIME_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3" style={{ animation: 'fadeIn 0.3s ease-out 0.25s both' }}>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Urutan</label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={e => setForm({ ...form, is_active: e.target.checked })}
                      className="w-4 h-4 rounded accent-purple-600"
                    />
                    <span className="text-sm text-slate-600">Aktif</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Animated Preview */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-purple-50 rounded-xl p-5 text-center" style={{ animation: 'fadeIn 0.3s ease-out 0.3s both' }}>
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute w-20 h-20 bg-purple-200/20 rounded-full -top-5 -right-5 animate-pulse" />
                <div className="absolute w-14 h-14 bg-pink-200/20 rounded-full bottom-0 left-4 animate-pulse" style={{ animationDelay: '1s' }} />
              </div>
              <p className="text-[10px] text-slate-400 mb-2 uppercase tracking-wider font-medium">Preview di Aplikasi</p>
              <div className="relative">
                {form.text ? (
                  <>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full animate-pulse ${
                        form.language === 'arab' ? 'bg-amber-400' :
                        form.language === 'jawa' ? 'bg-emerald-400' :
                        'bg-purple-400'
                      }`} />
                      <p className="text-lg font-bold text-purple-700" style={{ fontFamily: 'var(--font-display, Montserrat, sans-serif)' }}>{form.text}</p>
                    </div>
                    {form.translation && (
                      <p className="text-xs text-slate-400 italic">{form.translation}</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-slate-300 italic">Ketik sapaan di atas...</p>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 justify-end" style={{ animation: 'fadeIn 0.3s ease-out 0.35s both' }}>
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={!form.text.trim()}
                className="px-6 py-2 text-sm bg-purple-600 text-white rounded-xl hover:bg-purple-700 hover:shadow-lg hover:shadow-purple-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none font-medium transition-all duration-200"
              >
                {editId ? 'Simpan' : 'Tambah'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───── Global keyframe animations ───── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}} />
    </div>
  );
}
