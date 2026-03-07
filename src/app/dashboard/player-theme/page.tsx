'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Save, Loader2, Eye, Palette, Layout, Type, ToggleLeft } from 'lucide-react';

interface PlayerWidgetTheme {
  style: string;
  primary_color: string;
  secondary_color: string;
  show_program_name: boolean;
  show_speaker: boolean;
  show_share_button: boolean;
  show_sleep_timer: boolean;
  show_spectrum: boolean;
  card_radius: number;
  layout: string;
}

const defaultTheme: PlayerWidgetTheme = {
  style: 'default',
  primary_color: '#822a6e',
  secondary_color: '#2d132c',
  show_program_name: true,
  show_speaker: true,
  show_share_button: true,
  show_sleep_timer: true,
  show_spectrum: true,
  card_radius: 30,
  layout: 'standard',
};

const styleOptions = [
  { value: 'default', label: 'Default', desc: 'Gradient ungu klasik' },
  { value: 'dark', label: 'Dark', desc: 'Warna gelap minimalis' },
  { value: 'glass', label: 'Glass', desc: 'Efek kaca transparan' },
  { value: 'neon', label: 'Neon', desc: 'Aksen neon menyala' },
];

const layoutOptions = [
  { value: 'standard', label: 'Standard', desc: 'Judul di atas, info di bawah' },
  { value: 'compact', label: 'Compact', desc: 'Semua dalam satu baris' },
  { value: 'centered', label: 'Centered', desc: 'Semua elemen di tengah' },
];

const colorPresets = [
  { primary: '#822a6e', secondary: '#2d132c', label: 'Purple (Default)' },
  { primary: '#1B5E20', secondary: '#0D2818', label: 'Green Islamic' },
  { primary: '#0D47A1', secondary: '#0A1929', label: 'Blue Ocean' },
  { primary: '#BF360C', secondary: '#3E0E00', label: 'Warm Red' },
  { primary: '#FF6F00', secondary: '#3E1B00', label: 'Orange Sunset' },
  { primary: '#004D40', secondary: '#001A14', label: 'Teal Dark' },
];

export default function PlayerWidgetThemePage() {
  const [theme, setTheme] = useState<PlayerWidgetTheme>(defaultTheme);
  const [rowId, setRowId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchTheme();
  }, []);

  async function fetchTheme() {
    setLoading(true);
    const { data, error } = await supabase
      .from('app_settings')
      .select('id, player_widget_theme')
      .limit(1)
      .single();

    if (!error && data) {
      setRowId(data.id as string);
      if (data.player_widget_theme) {
        setTheme({ ...defaultTheme, ...(data.player_widget_theme as PlayerWidgetTheme) });
      }
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    if (!rowId) {
      setMessage({ type: 'error', text: 'ID pengaturan tidak ditemukan, coba refresh halaman.' });
      setSaving(false);
      return;
    }
    const { error } = await supabase
      .from('app_settings')
      .update({ player_widget_theme: theme })
      .eq('id', rowId);

    if (error) {
      setMessage({ type: 'error', text: 'Gagal menyimpan: ' + error.message });
    } else {
      setMessage({ type: 'success', text: 'Tema widget player berhasil disimpan!' });
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tema Widget Player</h1>
          <p className="text-slate-400 text-sm mt-1">Atur tampilan, tata letak, dan komponen widget player radio</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          Simpan
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl mb-6 text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Settings */}
        <div className="space-y-6">
          {/* Style */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100">
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Palette size={16} /> Gaya Tampilan
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {styleOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setTheme(prev => ({ ...prev, style: opt.value }))}
                  className={`p-4 rounded-xl border-2 text-left transition ${
                    theme.style === opt.value
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <p className={`text-sm font-semibold ${theme.style === opt.value ? 'text-primary' : 'text-slate-700'}`}>{opt.label}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Layout */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100">
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Layout size={16} /> Tata Letak
            </h3>
            <div className="space-y-2">
              {layoutOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setTheme(prev => ({ ...prev, layout: opt.value }))}
                  className={`w-full p-3 rounded-xl border-2 text-left flex items-center justify-between transition ${
                    theme.layout === opt.value
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div>
                    <p className={`text-sm font-semibold ${theme.layout === opt.value ? 'text-primary' : 'text-slate-700'}`}>{opt.label}</p>
                    <p className="text-[10px] text-slate-400">{opt.desc}</p>
                  </div>
                  {theme.layout === opt.value && <div className="w-2 h-2 rounded-full bg-primary" />}
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100">
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Type size={16} /> Warna
            </h3>
            <div className="space-y-3">
              {colorPresets.map(c => (
                <button
                  key={c.label}
                  onClick={() => setTheme(prev => ({ ...prev, primary_color: c.primary, secondary_color: c.secondary }))}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition ${
                    theme.primary_color === c.primary ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex gap-1">
                    <div className="w-6 h-6 rounded-full" style={{ background: c.primary }} />
                    <div className="w-6 h-6 rounded-full" style={{ background: c.secondary }} />
                  </div>
                  <span className="text-sm text-slate-600 font-medium">{c.label}</span>
                </button>
              ))}
              <div className="flex items-center gap-4 mt-3">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Primary</label>
                  <input type="color" value={theme.primary_color} onChange={e => setTheme(prev => ({ ...prev, primary_color: e.target.value }))} className="w-8 h-8 rounded cursor-pointer" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Secondary</label>
                  <input type="color" value={theme.secondary_color} onChange={e => setTheme(prev => ({ ...prev, secondary_color: e.target.value }))} className="w-8 h-8 rounded cursor-pointer" />
                </div>
              </div>
            </div>
          </div>

          {/* Visibility */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100">
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <ToggleLeft size={16} /> Komponen
            </h3>
            <div className="space-y-3">
              {[
                { key: 'show_program_name' as const, label: 'Nama Program' },
                { key: 'show_speaker' as const, label: 'Nama Pemateri' },
                { key: 'show_share_button' as const, label: 'Tombol Share' },
                { key: 'show_sleep_timer' as const, label: 'Sleep Timer' },
                { key: 'show_spectrum' as const, label: 'Animasi Spektrum' },
              ].map(item => (
                <label key={item.key} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={theme[item.key]}
                    onChange={e => setTheme(prev => ({ ...prev, [item.key]: e.target.checked }))}
                    className="w-4 h-4 rounded text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-slate-600">{item.label}</span>
                </label>
              ))}
            </div>

            <div className="mt-4">
              <label className="text-xs font-medium text-slate-500 mb-1 block">Radius Sudut Kartu</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={theme.card_radius}
                  onChange={e => setTheme(prev => ({ ...prev, card_radius: Number(e.target.value) }))}
                  className="flex-1"
                />
                <span className="text-sm text-slate-500 w-10 text-right">{theme.card_radius}px</span>
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-8 h-fit">
          <div className="bg-white rounded-2xl p-6 border border-slate-100">
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Eye size={16} /> Preview Player
            </h3>

            <div className="bg-slate-100 rounded-2xl p-4 space-y-4">
              <NowPlayingPreview theme={theme} />
              <WaitingCardPreview theme={theme} />
              <DefaultRadioPreview theme={theme} />
            </div>
            <p className="text-[10px] text-slate-400 mt-3 text-center">
              Preview ini menyerupai tampilan di aplikasi
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── SPECTRUM BARS HELPER ─── */
function SpectrumBars() {
  return (
    <div className="flex items-end gap-[3px] h-[25px]">
      {[10, 25, 15, 22, 10].map((h, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full animate-pulse"
          style={{
            height: h,
            background: 'rgba(255,255,255,0.8)',
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Gradient helper per style ─── */
function getCardGradient(theme: PlayerWidgetTheme) {
  if (theme.style === 'dark') return `linear-gradient(135deg, #1a1a2e, #0f0f23)`;
  if (theme.style === 'glass') return `linear-gradient(135deg, ${theme.primary_color}55, ${theme.secondary_color}33)`;
  if (theme.style === 'neon') return `linear-gradient(135deg, #0a0a0a, #1a0a2e)`;
  return `linear-gradient(135deg, ${theme.primary_color}, ${theme.secondary_color})`;
}

function getCardBorder(theme: PlayerWidgetTheme) {
  if (theme.style === 'glass') return '1px solid rgba(255,255,255,0.2)';
  if (theme.style === 'neon') return `1px solid ${theme.primary_color}88`;
  return 'none';
}

function getCardShadow(theme: PlayerWidgetTheme) {
  if (theme.style === 'neon') return `0 10px 30px ${theme.primary_color}40`;
  if (theme.style === 'glass') return 'none';
  return `0 10px 20px ${theme.primary_color}4D`;
}

/* ─── NowPlayingCard Preview (matches Flutter NowPlayingCard) ─── */
function NowPlayingPreview({ theme }: { theme: PlayerWidgetTheme }) {
  return (
    <div>
      <p className="text-[9px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">NowPlayingCard</p>
      <div
        className="p-5 relative overflow-hidden"
        style={{
          background: getCardGradient(theme),
          borderRadius: theme.card_radius,
          boxShadow: getCardShadow(theme),
          border: getCardBorder(theme),
          backdropFilter: theme.style === 'glass' ? 'blur(12px)' : undefined,
        }}
      >
        {/* Neon glow accent */}
        {theme.style === 'neon' && (
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${theme.primary_color}, transparent)` }} />
        )}

        {/* Row 1: LIVE badge + time + spectrum + share */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1.5 bg-red-600 px-2.5 py-1.5 rounded-full">
            <div className="w-[6px] h-[6px] rounded-full bg-white animate-pulse" />
            <span className="text-white text-[10px] font-bold tracking-[1.5px]">LIVE</span>
          </div>
          <div className="flex items-center gap-1 bg-white/[0.06] px-2 py-1 rounded-xl">
            <span className="text-white/50 text-[10px]">🕐</span>
            <span className="text-white/60 text-[10px] font-semibold">06:00 - 07:00</span>
          </div>
          <div className="flex-1" />
          {theme.show_spectrum && <SpectrumBars />}
          {theme.show_share_button && (
            <div className="w-10 h-10 rounded-2xl bg-white/[0.12] flex items-center justify-center shrink-0">
              <span className="text-white text-base">↗</span>
            </div>
          )}
        </div>

        {/* Program name (small, above title) */}
        {theme.show_program_name && (
          <p className="text-white/40 text-[10px] font-bold tracking-[1.2px] mb-1">KAJIAN PAGI</p>
        )}

        {/* Title (large, left-aligned) */}
        <p className="text-white font-bold text-[22px] leading-tight mb-0.5" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Kajian Fiqih Islam
        </p>

        {/* Speaker */}
        {theme.show_speaker && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-white/40 text-sm">👤</span>
            <p className="text-white/70 text-[13px] font-medium">Ust. Ahmad Zainuddin</p>
          </div>
        )}

        {/* Controls: Play/Pause + Volume + Record */}
        <div className="flex items-center gap-2.5 mt-5">
          <div className="w-11 h-11 rounded-full bg-white/[0.12] flex items-center justify-center shrink-0">
            <span className="text-white text-lg">⏸</span>
          </div>
          <div className="flex-1 h-[3px] rounded-full bg-white/10 relative">
            <div className="absolute left-0 top-0 h-full w-3/5 rounded-full bg-white" />
            <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white" style={{ left: '60%' }} />
          </div>
          <div className="w-9 h-9 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          </div>
        </div>

        {/* Sleep timer */}
        {theme.show_sleep_timer && (
          <div className="mt-2.5 flex items-center gap-1.5 bg-white/[0.15] rounded-full px-3 py-1.5 w-fit">
            <span className="text-orange-300 text-[11px]">🌙</span>
            <span className="text-orange-300 text-[11px] font-bold">Sleep: 28:45</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── WaitingCard Preview (matches Flutter WaitingCard) ─── */
function WaitingCardPreview({ theme }: { theme: PlayerWidgetTheme }) {
  const waitBg = theme.style === 'dark'
    ? '#0f0f23'
    : theme.style === 'glass'
    ? `${theme.primary_color}15`
    : theme.style === 'neon'
    ? '#0a0a1a'
    : '#2D3250';

  return (
    <div>
      <p className="text-[9px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">WaitingCard</p>
      <div
        className="p-6 relative overflow-hidden"
        style={{
          background: waitBg,
          borderRadius: theme.card_radius,
          boxShadow: '0 10px 20px rgba(0,0,0,0.12)',
          border: theme.style === 'neon' ? `1px solid ${theme.primary_color}44` : theme.style === 'glass' ? '1px solid rgba(255,255,255,0.15)' : 'none',
        }}
      >
        {/* Top row: badge + spectrum */}
        <div className="flex items-center mb-4">
          <div className="flex items-center gap-1.5 bg-orange-400/[0.12] border border-orange-400/25 px-2.5 py-1.5 rounded-lg">
            <span className="text-orange-400 text-sm">⏳</span>
            <span className="text-orange-400 text-[9px] font-bold tracking-[0.5px]">PROGRAM BERIKUTNYA</span>
          </div>
          <div className="flex-1" />
          {theme.show_spectrum && <SpectrumBars />}
        </div>

        {/* Center content */}
        <div className="text-center">
          {/* Program name */}
          {theme.show_program_name && (
            <p className="text-white/45 text-[12px] font-bold tracking-[1px] mb-1.5">KAJIAN MAGRIB</p>
          )}
          {/* Title (white, prominent) */}
          <p className="text-white font-bold text-[20px] leading-tight" style={{ fontFamily: 'Montserrat, sans-serif' }}>Tausiyah Maghrib</p>
          {/* Speaker */}
          {theme.show_speaker && (
            <p className="text-white/70 text-[14px] font-medium mt-1.5">Ust. Muhammad Ali</p>
          )}
          <div className="h-4" />
          <div className="flex items-center justify-center gap-2.5">
            <span className="text-white/25 text-xs">⏰</span>
            <span className="text-white/40 text-[11px]">Mulai pukul 18:00 WIB</span>
            <span className="text-white/10">•</span>
            <span className="text-orange-400 text-[11px] font-bold">2j 30m lagi</span>
          </div>
        </div>

        {/* Controls: Play/Pause + Volume + Record */}
        <div className="flex items-center gap-2.5 mt-4">
          <div className="w-11 h-11 rounded-full bg-white/[0.12] flex items-center justify-center shrink-0">
            <span className="text-white text-lg">⏸</span>
          </div>
          <div className="flex-1 h-[3px] rounded-full bg-white/10 relative">
            <div className="absolute left-0 top-0 h-full w-3/5 rounded-full bg-white" />
            <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white" style={{ left: '60%' }} />
          </div>
          <div className="w-9 h-9 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          </div>
        </div>

        {/* Sleep timer */}
        {theme.show_sleep_timer && (
          <div className="mt-2.5 flex items-center justify-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5 w-fit mx-auto">
            <span className="text-orange-300 text-[11px]">🌙</span>
            <span className="text-orange-300 text-[11px] font-bold">Sleep: 28:45</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── DefaultRadioCard Preview (matches Flutter DefaultRadioCard) ─── */
function DefaultRadioPreview({ theme }: { theme: PlayerWidgetTheme }) {
  return (
    <div>
      <p className="text-[9px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">DefaultRadioCard</p>
      <div
        className="p-6 relative overflow-hidden"
        style={{
          background: getCardGradient(theme),
          borderRadius: theme.card_radius,
          boxShadow: getCardShadow(theme),
          border: getCardBorder(theme),
        }}
      >
        {theme.style === 'neon' && (
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${theme.primary_color}, transparent)` }} />
        )}

        {/* Top row: spectrum */}
        <div className="flex items-center mb-5">
          <div className="flex-1" />
          {theme.show_spectrum && <SpectrumBars />}
        </div>

        {/* Center branding */}
        <div className="text-center">
          <div className="text-white/30 text-[50px] leading-none mb-3">📻</div>
          <p className="text-white text-xl font-bold tracking-[2px]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            RADIO MASS FM
          </p>
          <p className="text-white/60 text-xs italic mt-2">
            Saluran Islami Menggapai Ridho Ilahi
          </p>
          <p className="text-white/40 text-[10px] tracking-[1.5px] mt-1">
            88.0 MHz Sragen
          </p>
        </div>

        {/* Sleep timer */}
        {theme.show_sleep_timer && (
          <div className="mt-4 flex items-center justify-center gap-1.5 bg-white/[0.15] rounded-full px-3 py-1.5 w-fit mx-auto">
            <span className="text-orange-300 text-[11px]">🌙</span>
            <span className="text-orange-300 text-[11px] font-bold">Sleep: 28:45</span>
          </div>
        )}

        {/* Controls: Play/Pause + Volume + Record */}
        <div className="flex items-center gap-2.5 mt-5">
          <div className="w-11 h-11 rounded-full bg-white/[0.12] flex items-center justify-center shrink-0">
            <span className="text-white text-lg">⏸</span>
          </div>
          <div className="flex-1 h-[3px] rounded-full bg-white/10 relative">
            <div className="absolute left-0 top-0 h-full w-3/5 rounded-full bg-white" />
            <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white" style={{ left: '60%' }} />
          </div>
          <div className="w-9 h-9 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          </div>
        </div>
      </div>
    </div>
  );
}