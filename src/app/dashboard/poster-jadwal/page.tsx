'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Save, Loader2, Eye, Palette, Type, Image as ImageIcon,
  LayoutTemplate, Clock, User, Book, Radio, Sliders,
  ChevronDown, ChevronUp, RotateCcw,
} from 'lucide-react';

// ─── CONFIG INTERFACE ────────────────────────────────────────

interface SchedulePosterConfig {
  // Background
  bg_gradient_start: string;
  bg_gradient_middle: string;
  bg_gradient_end: string;
  bg_gradient_stops: number[];
  primary_color: string;
  accent_color: string;
  text_color: string;

  // Header
  header_title: string;
  header_subtitle: string;
  show_logo: boolean;
  logo_size: number;
  header_title_size: number;
  header_subtitle_size: number;

  // Date
  show_masehi: boolean;
  show_hijri: boolean;

  // Schedule items
  show_program: boolean;
  show_pemateri: boolean;
  show_kitab: boolean;
  show_relay_badge: boolean;
  time_font_size: number;
  title_font_size: number;
  program_font_size: number;
  pemateri_font_size: number;

  // Footer
  footer_slogan: string;
  footer_streaming: string;
  footer_frequency: string;
  show_footer_slogan: boolean;
  show_footer_streaming: boolean;
  show_footer_frequency: boolean;
  footer_slogan_icon: string;
  footer_streaming_icon: string;
  footer_frequency_icon: string;
}

const defaultConfig: SchedulePosterConfig = {
  bg_gradient_start: '#1A0E1A',
  bg_gradient_middle: '#2d132c',
  bg_gradient_end: '#1A0E1A',
  bg_gradient_stops: [0.0, 0.4, 1.0],
  primary_color: '#822a6e',
  accent_color: '#D4A853',
  text_color: '#FFFFFF',

  header_title: 'JADWAL SIAR',
  header_subtitle: 'RADIO MASS FM',
  show_logo: true,
  logo_size: 140,
  header_title_size: 42,
  header_subtitle_size: 28,

  show_masehi: true,
  show_hijri: true,

  show_program: true,
  show_pemateri: true,
  show_kitab: true,
  show_relay_badge: true,
  time_font_size: 21,
  title_font_size: 22,
  program_font_size: 17,
  pemateri_font_size: 18,

  footer_slogan: 'Saluran Islami Menggapai Ridho Ilahi',
  footer_streaming: 'Streaming: s5.xajist.com:8522/stream',
  footer_frequency: '88.0 MHz Sragen',
  show_footer_slogan: true,
  show_footer_streaming: true,
  show_footer_frequency: true,
  footer_slogan_icon: '🤲',
  footer_streaming_icon: '▶️',
  footer_frequency_icon: '📻',
};

const accentPresets = [
  { value: '#D4A853', label: 'Gold (Default)' },
  { value: '#FFD700', label: 'Bright Gold' },
  { value: '#4CAF50', label: 'Green Islamic' },
  { value: '#2196F3', label: 'Blue Sky' },
  { value: '#FF9800', label: 'Orange Warm' },
  { value: '#E0E0E0', label: 'Silver' },
];

const bgPresets = [
  { start: '#1A0E1A', middle: '#2d132c', end: '#1A0E1A', label: 'Purple Dark (Default)' },
  { start: '#0A1628', middle: '#1A2D4A', end: '#0A1628', label: 'Navy Blue' },
  { start: '#0D1B0E', middle: '#1B3A1D', end: '#0D1B0E', label: 'Forest Green' },
  { start: '#1A1A1A', middle: '#2D2D2D', end: '#1A1A1A', label: 'Charcoal' },
  { start: '#1A0A00', middle: '#3D1F00', end: '#1A0A00', label: 'Brown Warm' },
  { start: '#0A0A1A', middle: '#1A1A3D', end: '#0A0A1A', label: 'Deep Indigo' },
];

// ─── SAMPLE DATA FOR PREVIEW ────────────────────────────────

const sampleSchedules = [
  { jam: '05.00 - 06.00', program: 'Kajian Subuh', judul: 'Riyadhus Shalihin', pemateri: 'Ust. Ahmad', kitab: 'Riyadhus Shalihin', isRelay: false },
  { jam: '06.00 - 07.00', program: 'Murottal', judul: 'Murottal Al-Quran', pemateri: '', kitab: '', isRelay: true },
  { jam: '07.00 - 08.00', program: 'Kajian Pagi', judul: 'Tafsir Ibnu Katsir', pemateri: 'Ust. Muhammad', kitab: 'Ibnu Katsir', isRelay: false },
  { jam: '08.00 - 09.00', program: 'Tausiyah', judul: 'Fiqih Shalat', pemateri: 'Ust. Abdullah', kitab: '', isRelay: false },
  { jam: '09.00 - 10.00', program: 'Ceramah', judul: 'Adab Bermuamalah', pemateri: 'Ust. Ibrahim', kitab: 'Bulughul Maram', isRelay: false },
  { jam: '10.00 - 11.30', program: 'Kajian Siang', judul: 'Aqidah Ahlus Sunnah', pemateri: 'Ust. Sulaiman', kitab: '', isRelay: false },
];

// ─── MAIN PAGE COMPONENT ────────────────────────────────────

export default function PosterJadwalPage() {
  const [config, setConfig] = useState<SchedulePosterConfig>(defaultConfig);
  const [rowId, setRowId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Collapsible sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    background: true,
    header: true,
    date: false,
    schedule: false,
    footer: false,
  });

  const toggleSection = (key: string) =>
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    setLoading(true);
    const { data, error } = await supabase
      .from('app_settings')
      .select('id, schedule_poster_config')
      .limit(1)
      .single();

    if (!error && data) {
      setRowId(data.id as string);
      if (data.schedule_poster_config) {
        setConfig({ ...defaultConfig, ...(data.schedule_poster_config as SchedulePosterConfig) });
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
      .update({ schedule_poster_config: config })
      .eq('id', rowId);

    if (error) {
      setMessage({ type: 'error', text: 'Gagal menyimpan: ' + error.message });
    } else {
      setMessage({ type: 'success', text: 'Desain poster jadwal berhasil disimpan!' });
    }
    setSaving(false);
  }

  function handleReset() {
    if (confirm('Reset semua pengaturan ke default?')) {
      setConfig(defaultConfig);
    }
  }

  const updateConfig = useCallback((updates: Partial<SchedulePosterConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Desain Poster Jadwal</h1>
          <p className="text-slate-400 text-sm mt-1">Kustomisasi tampilan poster jadwal siar yang di-share dari aplikasi</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition text-sm"
          >
            <RotateCcw size={14} />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            Simpan
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl mb-6 text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8">
        {/* ─── FORM LEFT SIDE ─── */}
        <div className="space-y-4">

          {/* Background & Colors */}
          <CollapsibleSection
            title="Background & Warna"
            icon={<Palette size={16} />}
            isOpen={openSections.background}
            onToggle={() => toggleSection('background')}
          >
            <div className="space-y-5">
              {/* BG Presets */}
              <div>
                <label className="text-xs font-medium text-slate-500 mb-2 block">Preset Background</label>
                <div className="grid grid-cols-3 gap-2">
                  {bgPresets.map((preset) => {
                    const isActive = config.bg_gradient_start === preset.start && config.bg_gradient_middle === preset.middle;
                    return (
                      <button
                        key={preset.label}
                        onClick={() => updateConfig({
                          bg_gradient_start: preset.start,
                          bg_gradient_middle: preset.middle,
                          bg_gradient_end: preset.end,
                        })}
                        className={`p-3 rounded-xl border-2 transition text-left ${isActive ? 'border-primary shadow-md' : 'border-slate-100 hover:border-slate-200'}`}
                      >
                        <div
                          className="w-full h-8 rounded-lg mb-2"
                          style={{ background: `linear-gradient(to bottom, ${preset.start}, ${preset.middle}, ${preset.end})` }}
                        />
                        <span className="text-[11px] font-medium text-slate-600">{preset.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom BG Colors */}
              <div className="grid grid-cols-3 gap-3">
                <ColorInput label="BG Atas" value={config.bg_gradient_start} onChange={(v) => updateConfig({ bg_gradient_start: v })} />
                <ColorInput label="BG Tengah" value={config.bg_gradient_middle} onChange={(v) => updateConfig({ bg_gradient_middle: v })} />
                <ColorInput label="BG Bawah" value={config.bg_gradient_end} onChange={(v) => updateConfig({ bg_gradient_end: v })} />
              </div>

              {/* Accent Color */}
              <div>
                <label className="text-xs font-medium text-slate-500 mb-2 block">Warna Aksen</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {accentPresets.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => updateConfig({ accent_color: preset.value })}
                      className={`w-8 h-8 rounded-full border-2 transition ${config.accent_color === preset.value ? 'border-primary scale-110 shadow-md' : 'border-slate-200 hover:scale-105'}`}
                      style={{ backgroundColor: preset.value }}
                      title={preset.label}
                    />
                  ))}
                  <div className="relative w-8 h-8">
                    <input
                      type="color"
                      value={config.accent_color}
                      onChange={(e) => updateConfig({ accent_color: e.target.value })}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center">
                      <Palette size={12} className="text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Primary Color */}
              <ColorInput label="Warna Primer (Badge, Border)" value={config.primary_color} onChange={(v) => updateConfig({ primary_color: v })} />
            </div>
          </CollapsibleSection>

          {/* Header */}
          <CollapsibleSection
            title="Header"
            icon={<LayoutTemplate size={16} />}
            isOpen={openSections.header}
            onToggle={() => toggleSection('header')}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <TextInput label="Judul Utama" value={config.header_title} onChange={(v) => updateConfig({ header_title: v })} placeholder="JADWAL SIAR" />
                <TextInput label="Sub Judul" value={config.header_subtitle} onChange={(v) => updateConfig({ header_subtitle: v })} placeholder="RADIO MASS FM" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <NumberInput label="Ukuran Judul" value={config.header_title_size} onChange={(v) => updateConfig({ header_title_size: v })} min={20} max={60} />
                <NumberInput label="Ukuran Sub Judul" value={config.header_subtitle_size} onChange={(v) => updateConfig({ header_subtitle_size: v })} min={14} max={48} />
                <NumberInput label="Ukuran Logo" value={config.logo_size} onChange={(v) => updateConfig({ logo_size: v })} min={60} max={200} />
              </div>
              <ToggleInput label="Tampilkan Logo" checked={config.show_logo} onChange={(v) => updateConfig({ show_logo: v })} />
            </div>
          </CollapsibleSection>

          {/* Date */}
          <CollapsibleSection
            title="Tanggal"
            icon={<Clock size={16} />}
            isOpen={openSections.date}
            onToggle={() => toggleSection('date')}
          >
            <div className="space-y-3">
              <ToggleInput label="Tampilkan tanggal Masehi" checked={config.show_masehi} onChange={(v) => updateConfig({ show_masehi: v })} />
              <ToggleInput label="Tampilkan tanggal Hijriyah" checked={config.show_hijri} onChange={(v) => updateConfig({ show_hijri: v })} />
            </div>
          </CollapsibleSection>

          {/* Schedule Items */}
          <CollapsibleSection
            title="Item Jadwal"
            icon={<Sliders size={16} />}
            isOpen={openSections.schedule}
            onToggle={() => toggleSection('schedule')}
          >
            <div className="space-y-4">
              <div className="space-y-3">
                <ToggleInput label="Tampilkan nama program" checked={config.show_program} onChange={(v) => updateConfig({ show_program: v })} />
                <ToggleInput label="Tampilkan pemateri" checked={config.show_pemateri} onChange={(v) => updateConfig({ show_pemateri: v })} />
                <ToggleInput label="Tampilkan kitab" checked={config.show_kitab} onChange={(v) => updateConfig({ show_kitab: v })} />
                <ToggleInput label="Tampilkan badge relay" checked={config.show_relay_badge} onChange={(v) => updateConfig({ show_relay_badge: v })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumberInput label="Font Waktu" value={config.time_font_size} onChange={(v) => updateConfig({ time_font_size: v })} min={14} max={30} />
                <NumberInput label="Font Judul" value={config.title_font_size} onChange={(v) => updateConfig({ title_font_size: v })} min={14} max={30} />
                <NumberInput label="Font Program" value={config.program_font_size} onChange={(v) => updateConfig({ program_font_size: v })} min={12} max={24} />
                <NumberInput label="Font Pemateri" value={config.pemateri_font_size} onChange={(v) => updateConfig({ pemateri_font_size: v })} min={12} max={24} />
              </div>
            </div>
          </CollapsibleSection>

          {/* Footer */}
          <CollapsibleSection
            title="Footer"
            icon={<Type size={16} />}
            isOpen={openSections.footer}
            onToggle={() => toggleSection('footer')}
          >
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <ToggleInput label="Slogan" checked={config.show_footer_slogan} onChange={(v) => updateConfig({ show_footer_slogan: v })} />
                </div>
                {config.show_footer_slogan && (
                  <div className="grid grid-cols-[60px_1fr] gap-2">
                    <TextInput label="Ikon" value={config.footer_slogan_icon} onChange={(v) => updateConfig({ footer_slogan_icon: v })} placeholder="🤲" />
                    <TextInput label="Teks Slogan" value={config.footer_slogan} onChange={(v) => updateConfig({ footer_slogan: v })} placeholder="Saluran Islami..." />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <ToggleInput label="Streaming URL" checked={config.show_footer_streaming} onChange={(v) => updateConfig({ show_footer_streaming: v })} />
                {config.show_footer_streaming && (
                  <div className="grid grid-cols-[60px_1fr] gap-2">
                    <TextInput label="Ikon" value={config.footer_streaming_icon} onChange={(v) => updateConfig({ footer_streaming_icon: v })} placeholder="▶️" />
                    <TextInput label="URL Streaming" value={config.footer_streaming} onChange={(v) => updateConfig({ footer_streaming: v })} placeholder="Streaming: ..." />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <ToggleInput label="Frekuensi" checked={config.show_footer_frequency} onChange={(v) => updateConfig({ show_footer_frequency: v })} />
                {config.show_footer_frequency && (
                  <div className="grid grid-cols-[60px_1fr] gap-2">
                    <TextInput label="Ikon" value={config.footer_frequency_icon} onChange={(v) => updateConfig({ footer_frequency_icon: v })} placeholder="📻" />
                    <TextInput label="Teks Frekuensi" value={config.footer_frequency} onChange={(v) => updateConfig({ footer_frequency: v })} placeholder="88.0 MHz Sragen" />
                  </div>
                )}
              </div>
            </div>
          </CollapsibleSection>
        </div>

        {/* ─── LIVE PREVIEW RIGHT SIDE ─── */}
        <div className="xl:sticky xl:top-8 h-fit">
          <div className="bg-white rounded-2xl p-6 border border-slate-100">
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Eye size={16} /> Preview Poster (9:16)
            </h3>
            <PosterPreview config={config} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── POSTER PREVIEW ─────────────────────────────────────────

function PosterPreview({ config }: { config: SchedulePosterConfig }) {
  const scale = 0.177; // 1080 * 0.177 ≈ 191px width to fit sidebar
  const today = new Date();
  const dateStr = today.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="flex justify-center">
      <div
        className="origin-top-left overflow-hidden rounded-lg shadow-lg"
        style={{ width: 1080 * scale, height: 1920 * scale }}
      >
        <div
          style={{
            width: 1080,
            height: 1920,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            background: `linear-gradient(to bottom, ${config.bg_gradient_start} 0%, ${config.bg_gradient_middle} 40%, ${config.bg_gradient_end} 100%)`,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {/* Header */}
          <div style={{ padding: '80px 48px 32px 48px', textAlign: 'center' }}>
            {config.show_logo && (
              <div style={{
                width: config.logo_size,
                height: config.logo_size,
                borderRadius: '50%',
                border: `3px solid ${config.accent_color}40`,
                margin: '0 auto 28px auto',
                background: `${config.primary_color}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: config.logo_size * 0.4,
              }}>
                📻
              </div>
            )}
            <div style={{
              color: config.text_color,
              fontSize: config.header_title_size,
              fontWeight: 900,
              letterSpacing: 6,
              lineHeight: 1.2,
            }}>
              {config.header_title}
            </div>
            <div style={{
              color: config.accent_color,
              fontSize: config.header_subtitle_size,
              fontWeight: 700,
              letterSpacing: 4,
              marginTop: 4,
            }}>
              {config.header_subtitle}
            </div>

            {/* Date badge */}
            {(config.show_masehi || config.show_hijri) && (
              <div style={{
                display: 'inline-block',
                padding: '10px 28px',
                borderRadius: 30,
                backgroundColor: `${config.primary_color}50`,
                border: `1px solid ${config.accent_color}40`,
                marginTop: 20,
              }}>
                {config.show_masehi && (
                  <div style={{ color: config.text_color, fontSize: 22, fontWeight: 600 }}>
                    {dateStr}
                  </div>
                )}
                {config.show_hijri && (
                  <div style={{ color: `${config.accent_color}DD`, fontSize: 18, fontWeight: 500, marginTop: 2 }}>
                    15 Sya&apos;ban 1447 H
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{
            margin: '0 60px',
            height: 2,
            background: `linear-gradient(to right, transparent, ${config.accent_color}60, transparent)`,
          }} />

          {/* Schedule */}
          <div style={{ padding: '24px 48px' }}>
            {sampleSchedules.map((item, i) => (
              <div key={i}>
                <div style={{
                  display: 'flex',
                  padding: '14px 20px',
                  borderRadius: 14,
                  backgroundColor: i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                  gap: 16,
                }}>
                  {/* Time */}
                  <div style={{ width: 220, flexShrink: 0 }}>
                    <div style={{
                      color: config.accent_color,
                      fontSize: config.time_font_size,
                      fontWeight: 700,
                      lineHeight: 1.3,
                    }}>
                      {item.jam}
                    </div>
                    {config.show_relay_badge && item.isRelay && (
                      <div style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: 8,
                        backgroundColor: 'rgba(255,165,0,0.15)',
                        color: '#FFA500',
                        fontSize: 14,
                        fontWeight: 600,
                        marginTop: 4,
                      }}>
                        📡 Relay
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    {config.show_program && item.program && (
                      <div style={{ color: `${config.text_color}90`, fontSize: config.program_font_size, fontWeight: 500 }}>
                        {item.program}
                      </div>
                    )}
                    <div style={{ color: config.text_color, fontSize: config.title_font_size, fontWeight: 700, lineHeight: 1.3 }}>
                      {item.judul}
                    </div>
                    {config.show_pemateri && item.pemateri && (
                      <div style={{ color: `${config.text_color}B0`, fontSize: config.pemateri_font_size, fontWeight: 500, marginTop: 2 }}>
                        👤 {item.pemateri}
                      </div>
                    )}
                    {config.show_kitab && item.kitab && (
                      <div style={{ color: `${config.text_color}90`, fontSize: 16, marginTop: 2 }}>
                        📚 {item.kitab}
                      </div>
                    )}
                  </div>
                </div>
                {i < sampleSchedules.length - 1 && (
                  <div style={{ margin: '6px 20px', height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ padding: '20px 48px 60px 48px', textAlign: 'center', marginTop: 'auto' }}>
            <div style={{
              height: 1.5,
              background: `linear-gradient(to right, transparent, ${config.accent_color}40, transparent)`,
              marginBottom: 16,
            }} />
            {config.show_footer_slogan && (
              <div style={{ color: `${config.text_color}CC`, fontSize: 20, fontWeight: 600 }}>
                {config.footer_slogan_icon} {config.footer_slogan}
              </div>
            )}
            {config.show_footer_streaming && (
              <div style={{ color: `${config.text_color}80`, fontSize: 16, marginTop: 6 }}>
                {config.footer_streaming_icon} {config.footer_streaming}
              </div>
            )}
            {config.show_footer_frequency && (
              <div style={{ color: `${config.accent_color}B0`, fontSize: 18, fontWeight: 600, marginTop: 4 }}>
                {config.footer_frequency_icon} {config.footer_frequency}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── REUSABLE FORM COMPONENTS ───────────────────────────────

function CollapsibleSection({ title, icon, isOpen, onToggle, children }: {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-50/50 transition"
      >
        <span className="font-semibold text-slate-700 flex items-center gap-2">
          {icon} {title}
        </span>
        {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>
      {isOpen && <div className="px-5 pb-5 pt-0">{children}</div>}
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-500 mb-1 block">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
        placeholder={placeholder}
      />
    </div>
  );
}

function NumberInput({ label, value, onChange, min, max }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-500 mb-1 block">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
      />
    </div>
  );
}

function ColorInput({ label, value, onChange }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-500 mb-1 block">{label}</label>
      <div className="flex items-center gap-2">
        <div className="relative w-8 h-8 shrink-0">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="w-8 h-8 rounded-lg border border-slate-200" style={{ backgroundColor: value }} />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-mono"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

function ToggleInput({ label, checked, onChange }: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded text-primary focus:ring-primary"
      />
      <span className="text-sm text-slate-600">{label}</span>
    </label>
  );
}
