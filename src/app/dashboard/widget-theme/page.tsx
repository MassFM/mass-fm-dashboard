'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, Calendar, CloudSun, Moon, Save, Loader2, Eye, Palette } from 'lucide-react';

interface InfoWidgetTheme {
  style: string;
  accent_color: string;
  show_clock: boolean;
  show_date: boolean;
  show_prayer_times: boolean;
  show_weather: boolean;
  clock_format: string;
  compact_mode: boolean;
}

const defaultTheme: InfoWidgetTheme = {
  style: 'default',
  accent_color: '#822a6e',
  show_clock: true,
  show_date: true,
  show_prayer_times: true,
  show_weather: true,
  clock_format: '24h',
  compact_mode: false,
};

const styleOptions = [
  { value: 'default', label: 'Default', desc: 'Tampilan standar dengan ikon dan teks' },
  { value: 'minimal', label: 'Minimal', desc: 'Hanya teks penting, tanpa dekorasi' },
  { value: 'elegant', label: 'Elegant', desc: 'Desain mewah dengan gradient dan shadow' },
  { value: 'glass', label: 'Glass', desc: 'Efek kaca transparan modern' },
];

const colorPresets = [
  { value: '#822a6e', label: 'Purple (Default)' },
  { value: '#1B5E20', label: 'Green Islamic' },
  { value: '#0D47A1', label: 'Blue Ocean' },
  { value: '#BF360C', label: 'Warm Red' },
  { value: '#4A148C', label: 'Deep Purple' },
  { value: '#004D40', label: 'Teal Dark' },
];

export default function InfoWidgetThemePage() {
  const [theme, setTheme] = useState<InfoWidgetTheme>(defaultTheme);
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
      .select('id, info_widget_theme')
      .limit(1)
      .single();

    if (!error && data) {
      setRowId(data.id as string);
      if (data.info_widget_theme) {
        setTheme({ ...defaultTheme, ...(data.info_widget_theme as InfoWidgetTheme) });
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
      .update({ info_widget_theme: theme })
      .eq('id', rowId);

    if (error) {
      setMessage({ type: 'error', text: 'Gagal menyimpan: ' + error.message });
    } else {
      setMessage({ type: 'success', text: 'Tema widget info berhasil disimpan!' });
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
          <h1 className="text-2xl font-bold text-slate-800">Tema Widget Info</h1>
          <p className="text-slate-400 text-sm mt-1">Atur tampilan widget jam, tanggal, waktu shalat & cuaca di halaman utama</p>
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
          {/* Style Selection */}
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

          {/* Color */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100">
            <h3 className="font-semibold text-slate-700 mb-4">Warna Aksen</h3>
            <div className="flex flex-wrap gap-3">
              {colorPresets.map(c => (
                <button
                  key={c.value}
                  onClick={() => setTheme(prev => ({ ...prev, accent_color: c.value }))}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-xs font-medium transition ${
                    theme.accent_color === c.value ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full" style={{ background: c.value }} />
                  {c.label}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <label className="text-xs text-slate-400">Custom:</label>
              <input
                type="color"
                value={theme.accent_color}
                onChange={e => setTheme(prev => ({ ...prev, accent_color: e.target.value }))}
                className="w-8 h-8 rounded-lg cursor-pointer"
              />
              <span className="text-xs text-slate-500 font-mono">{theme.accent_color}</span>
            </div>
          </div>

          {/* Visibility */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100">
            <h3 className="font-semibold text-slate-700 mb-4">Komponen Ditampilkan</h3>
            <div className="space-y-3">
              {[
                { key: 'show_clock' as const, icon: Clock, label: 'Jam Digital' },
                { key: 'show_date' as const, icon: Calendar, label: 'Tanggal (Masehi & Hijriyah)' },
                { key: 'show_prayer_times' as const, icon: Moon, label: 'Waktu Shalat' },
                { key: 'show_weather' as const, icon: CloudSun, label: 'Prakiraan Cuaca' },
              ].map(item => (
                <label key={item.key} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={theme[item.key]}
                    onChange={e => setTheme(prev => ({ ...prev, [item.key]: e.target.checked }))}
                    className="w-4 h-4 rounded text-primary focus:ring-primary"
                  />
                  <item.icon size={16} className="text-slate-400" />
                  <span className="text-sm text-slate-600">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100">
            <h3 className="font-semibold text-slate-700 mb-4">Opsi Tambahan</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Format Jam</label>
                <select
                  value={theme.clock_format}
                  onChange={e => setTheme(prev => ({ ...prev, clock_format: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                >
                  <option value="24h">24 Jam (14:30)</option>
                  <option value="12h">12 Jam (2:30 PM)</option>
                </select>
              </div>
              <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={theme.compact_mode}
                  onChange={e => setTheme(prev => ({ ...prev, compact_mode: e.target.checked }))}
                  className="w-4 h-4 rounded text-primary focus:ring-primary"
                />
                <span className="text-sm text-slate-600">Mode Kompak (hemat ruang)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-8 h-fit">
          <div className="bg-white rounded-2xl p-6 border border-slate-100">
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Eye size={16} /> Preview Widget Info
            </h3>
            {/* Simulated phone frame */}
            <div className="bg-slate-100 rounded-2xl p-4">
              <InfoBarPreview theme={theme} />
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

/* ─── COMPACT INFO BAR PREVIEW (matches Flutter InfoBarWidget) ─── */
function InfoBarPreview({ theme }: { theme: InfoWidgetTheme }) {
  const isElegant = theme.style === 'elegant';
  const isGlass = theme.style === 'glass';
  const isMinimal = theme.style === 'minimal';

  // Helper: darken hex color by mixing with black
  const darkenHex = (hex: string, amount: number) => {
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    const dr = Math.round(r * (1 - amount));
    const dg = Math.round(g * (1 - amount));
    const db = Math.round(b * (1 - amount));
    return `#${dr.toString(16).padStart(2,'0')}${dg.toString(16).padStart(2,'0')}${db.toString(16).padStart(2,'0')}`;
  };
  // Helper: lighten hex color by mixing with white
  const lightenHex = (hex: string, amount: number) => {
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    const lr = Math.round(r + (255 - r) * amount);
    const lg = Math.round(g + (255 - g) * amount);
    const lb = Math.round(b + (255 - b) * amount);
    return `#${lr.toString(16).padStart(2,'0')}${lg.toString(16).padStart(2,'0')}${lb.toString(16).padStart(2,'0')}`;
  };

  // Gradient background per style
  const bgStyle: React.CSSProperties = isElegant
    ? { background: `linear-gradient(to right, ${theme.accent_color}, ${theme.accent_color}DD)` }
    : isGlass
    ? { background: `linear-gradient(to right, ${theme.accent_color}66, ${theme.accent_color}33)`, backdropFilter: 'blur(12px)' }
    : isMinimal
    ? { background: 'linear-gradient(to right, #f3f4f6, #f9fafb)' }
    : { background: `linear-gradient(135deg, ${darkenHex(theme.accent_color, 0.55)}, ${theme.accent_color})` };

  // Border radius per style
  const radius = isMinimal ? 12 : isElegant ? 20 : 16;

  // Colors
  const primaryText = isMinimal ? '#1f2937' : '#ffffff';
  const secondaryText = isMinimal ? '#6b7280' : 'rgba(255,255,255,0.5)';
  const accentText = isElegant ? '#D4A853' : isMinimal ? theme.accent_color : lightenHex(theme.accent_color, 0.65);
  const dividerColor = isMinimal
    ? `${theme.accent_color}4D`
    : `${lightenHex(theme.accent_color, 0.45)}80`;

  // Collect visible items
  const items: React.ReactNode[] = [];

  if (theme.show_clock) {
    items.push(
      <div key="clock" className="flex flex-col items-center shrink-0">
        <span className="font-extrabold text-lg leading-none tracking-wide" style={{ color: accentText }}>
          {theme.clock_format === '24h' ? '14:30' : '2:30 PM'}
        </span>
        <span className="text-[7px] font-semibold tracking-[2px] mt-0.5" style={{ color: secondaryText }}>
          WIB
        </span>
      </div>
    );
  }

  if (theme.show_date) {
    items.push(
      <div key="date" className="flex flex-col min-w-0 flex-1">
        <span className="text-[10px] font-bold leading-tight truncate" style={{ color: primaryText }}>
          7 Sya&apos;ban 1447
        </span>
        <span className="text-[9px] font-medium mt-px" style={{ color: secondaryText }}>
          6 Mar 2026
        </span>
      </div>
    );
  }

  if (theme.show_prayer_times) {
    items.push(
      <div key="prayer" className="flex flex-col items-center shrink-0">
        <div className="flex items-center gap-0.5">
          <span className="text-[9px]">🕌</span>
          <span className="text-[10px] font-bold" style={{ color: primaryText }}>Ashar</span>
        </div>
        <span className="text-xs font-extrabold mt-px" style={{ color: accentText }}>15:30</span>
      </div>
    );
  }

  if (theme.show_weather) {
    items.push(
      <div key="weather" className="flex flex-col items-center shrink-0">
        <span className="text-sm leading-none">☀️</span>
        <span className="text-[11px] font-bold mt-px" style={{ color: primaryText }}>30°</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center text-xs text-slate-400 py-6">
        Semua komponen dinonaktifkan
      </div>
    );
  }

  // Insert dividers between items
  const row: React.ReactNode[] = [];
  items.forEach((item, i) => {
    if (i > 0) {
      row.push(
        <div key={`div-${i}`} className="mx-2.5 h-[30px] w-px shrink-0" style={{
          background: `linear-gradient(to bottom, transparent, ${dividerColor}, transparent)`,
        }} />
      );
    }
    row.push(item);
  });

  return (
    <div
      className="relative overflow-hidden"
      style={{
        ...bgStyle,
        borderRadius: radius,
        boxShadow: isMinimal
          ? 'none'
          : `0 4px ${isElegant ? 16 : 12}px ${theme.accent_color}${isElegant ? '59' : '40'}`,
        border: isGlass
          ? '1px solid rgba(255,255,255,0.25)'
          : isMinimal
          ? '1px solid #e5e7eb'
          : 'none',
      }}
    >
      {/* Dot pattern overlay (skip minimal) */}
      {!isMinimal && (
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }} />
      )}
      {/* Elegant gold shimmer line */}
      {isElegant && (
        <div className="absolute top-0 left-0 right-0 h-[1.5px]" style={{
          background: 'linear-gradient(to right, transparent, rgba(212,168,83,0.6), transparent)',
        }} />
      )}
      {/* Content row */}
      <div
        className="relative flex items-center"
        style={{ padding: `${theme.compact_mode ? 8 : 12}px 14px` }}
      >
        {row}
      </div>
    </div>
  );
}
