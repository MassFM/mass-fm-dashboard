'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Type, Save, ToggleLeft, ToggleRight, Eye, Link as LinkIcon, Settings2, Palette, Type as TypeIcon } from 'lucide-react';

interface RunningTextConfig {
  text: string;
  speed: number;
  textColor: string;
  backgroundColor: string;
  borderColor: string;
  fontSize: number;
  fontWeight: string;
  fontStyle: string;
  fontFamily: string;
  route: string;
  enabled: boolean;
}

const DEFAULT_CONFIG: RunningTextConfig = {
  text: 'Selamat datang di Radio Mass FM. Simak selalu kajian penuh hikmah...',
  speed: 35.0,
  textColor: '#822a6e',
  backgroundColor: '#FFFFFF',
  borderColor: '#822a6e',
  fontSize: 12.0,
  fontWeight: 'bold',
  fontStyle: 'normal',
  fontFamily: 'Inter',
  route: '',
  enabled: true,
};

const FONT_OPTIONS = [
  'Inter', 'Roboto', 'Poppins', 'Montserrat', 'Lato', 'Open Sans', 'Oswald', 'Playfair Display'
];

const WEIGHT_OPTIONS = [
  { value: 'w400', label: 'Normal (400)' },
  { value: 'w500', label: 'Medium (500)' },
  { value: 'w600', label: 'Semi Bold (600)' },
  { value: 'bold', label: 'Bold (700)' },
  { value: 'w800', label: 'Extra Bold (800)' },
];

const STYLE_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'italic', label: 'Miring (Italic)' },
];

const ROUTE_OPTIONS = [
  { value: '', label: 'Tidak Ada Tindakan (Hanya Teks)' },
  { value: 'donation', label: 'Halaman Donasi' },
  { value: 'dzikir', label: 'Halaman Dzikir' },
  { value: 'doa', label: 'Halaman Doa Harian' },
  { value: 'schedule', label: 'Halaman Jadwal' },
  { value: 'chat', label: 'Halaman Live Chat' },
  { value: 'school_info', label: 'Halaman Info Sekolah' },
  { value: 'ebook', label: 'Halaman Ebook' },
  { value: 'mimbar', label: 'Halaman Mimbar Dakwah' },
  { value: 'kajian_offline', label: 'Halaman Kajian Rutin' },
  { value: 'events', label: 'Halaman Kegiatan Islami' },
  { value: 'prayer_times', label: 'Halaman Waktu Shalat' },
  { value: 'qiblat', label: 'Halaman Arah Kiblat' },
  { value: 'greeting_card', label: 'Halaman Kartu Ucapan' },
  { value: 'developer_support', label: '🙌 Dukung Aplikasi' },
  { value: 'url_external', label: '🔗 URL Eksternal (Website)' },
];

export default function RunningTextPage() {
  const [config, setConfig] = useState<RunningTextConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function loadConfig() {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('running_text_config')
        .limit(1)
        .single();

      if (error) {
        console.error('Load running_text error:', error.message);
        setConfig(DEFAULT_CONFIG);
        setLoading(false);
        return;
      }

      const raw = (data as Record<string, unknown>)?.running_text_config;
      if (raw) {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        setConfig({ ...DEFAULT_CONFIG, ...parsed });
      } else {
        setConfig(DEFAULT_CONFIG);
      }
    } catch {
      setConfig(DEFAULT_CONFIG);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadConfig();
  }, []);

  async function saveConfig() {
    setSaving(true);
    setMessage('');
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('app_settings')
        .select('id')
        .limit(1)
        .single();

      if (fetchError || !existing) {
        setMessage('❌ Gagal mengambil data: ' + (fetchError?.message || 'Data tidak ditemukan'));
        setSaving(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('app_settings')
        .update({ running_text_config: config })
        .eq('id', (existing as Record<string, unknown>).id as number);

      if (updateError) {
        setMessage('❌ Gagal menyimpan: ' + updateError.message);
      } else {
        setMessage('✅ Konfigurasi Running Text berhasil disimpan! Perubahan akan langsung muncul di aplikasi.');
      }
    } catch (e) {
      setMessage('❌ Gagal menyimpan: ' + String(e));
    }
    setSaving(false);
  }

  function updateField(field: keyof RunningTextConfig, value: string | number | boolean) {
    setConfig({ ...config, [field]: value });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Type className="text-primary" size={20} />
            </div>
            Pengaturan Running Text
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Atur teks berjalan di halaman utama aplikasi, lengkap dengan kecepatan dan warnanya.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={saveConfig}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium ${
          message.startsWith('✅') ? 'bg-green-50 text-green-700' :
          message.startsWith('❌') ? 'bg-red-50 text-red-700' :
          'bg-yellow-50 text-yellow-700'
        }`}>
          {message}
        </div>
      )}

      {/* Preview Section */}
      <div className="bg-slate-100 rounded-2xl p-8 border border-slate-200">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-500 mb-6">
          <Eye size={16} />
          Preview Tampilan Aplikasi
        </div>
        
        {/* Mockup Aplikasi */}
        <div className="max-w-md mx-auto bg-slate-50 border-[6px] border-slate-800 rounded-[2.5rem] p-4 shadow-2xl relative overflow-hidden h-[120px]">
          {/* Status bar mockup */}
          <div className="flex justify-between items-center mb-6 px-4">
            <span className="text-[10px] font-bold text-slate-800">9:41</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 bg-slate-800 rounded-full"></div>
              <div className="w-3 h-3 bg-slate-800 rounded-full"></div>
            </div>
          </div>

          {config.enabled && config.text.trim() !== '' ? (
            <div 
              className="mx-2 py-2 px-3 rounded-full flex items-center gap-3 overflow-hidden shadow-sm"
              style={{
                backgroundColor: config.backgroundColor,
                border: `1px solid ${config.borderColor}40`, // 40 is ~25% opacity in hex
              }}
            >
              <div 
                className="text-[8px] font-bold px-2 py-1 rounded-full uppercase shrink-0"
                style={{
                  backgroundColor: config.borderColor,
                  color: '#FFF',
                }}
              >
                UPDATE
              </div>
              <div className="relative flex-1 overflow-hidden h-4 flex items-center">
                <div 
                  className="whitespace-nowrap animate-[marquee_10s_linear_infinite]"
                  style={{
                    color: config.textColor,
                    fontSize: `${Math.min(config.fontSize, 14)}px`,
                    fontWeight: config.fontWeight === 'bold' ? 700 : config.fontWeight === 'w500' ? 500 : 400,
                    fontStyle: config.fontStyle === 'italic' ? 'italic' : 'normal',
                    fontFamily: config.fontFamily,
                  }}
                >
                  {config.text}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-12 border-2 border-dashed border-slate-300 rounded-xl bg-slate-100/50 mx-2 text-xs font-bold text-slate-400">
              Running Text Dinonaktifkan
            </div>
          )}
        </div>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes marquee {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
        `}} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Konten Utama */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <TypeIcon size={18} className="text-primary" />
              Konten Teks
            </h2>
            <button
              onClick={() => updateField('enabled', !config.enabled)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                config.enabled ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'
              }`}
            >
              {config.enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              {config.enabled ? 'Aktif' : 'Nonaktif'}
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Teks Pengumuman
            </label>
            <textarea
              value={config.text}
              onChange={(e) => updateField('text', e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 min-h-[120px]"
              placeholder="Masukkan teks pengumuman yang akan berjalan..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Kecepatan Berjalan (Speed: {config.speed})
            </label>
            <div className="flex gap-4 items-center">
              <span className="text-xs font-bold text-slate-400">Lambat</span>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={config.speed}
                onChange={(e) => updateField('speed', parseFloat(e.target.value))}
                className="flex-1 accent-primary"
              />
              <span className="text-xs font-bold text-slate-400">Cepat</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <LinkIcon size={14} />
              Aksi Klik Teks (Tujuan)
            </label>
            <select
              value={config.route.startsWith('http') ? 'url_external' : config.route}
              onChange={(e) => {
                if (e.target.value === 'url_external') {
                  updateField('route', 'https://');
                } else {
                  updateField('route', e.target.value);
                }
              }}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary bg-white"
            >
              {ROUTE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            
            {config.route.startsWith('http') && (
              <div className="mt-3">
                <input
                  type="url"
                  value={config.route}
                  onChange={(e) => updateField('route', e.target.value)}
                  placeholder="https://contoh.com"
                  className="w-full px-4 py-3 border border-primary/40 rounded-xl text-sm focus:outline-none focus:border-primary bg-blue-50/50 font-mono"
                />
              </div>
            )}
          </div>
        </div>

        {/* Desain & Tipografi */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-4">
              <Palette size={18} className="text-primary" />
              Skema Warna
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Warna Teks
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={config.textColor}
                    onChange={(e) => updateField('textColor', e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
                  />
                  <input
                    type="text"
                    value={config.textColor}
                    onChange={(e) => updateField('textColor', e.target.value)}
                    className="flex-1 px-3 border border-slate-200 rounded-lg text-sm font-mono focus:border-primary"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Warna Latar
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={config.backgroundColor}
                    onChange={(e) => updateField('backgroundColor', e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
                  />
                  <input
                    type="text"
                    value={config.backgroundColor}
                    onChange={(e) => updateField('backgroundColor', e.target.value)}
                    className="flex-1 px-3 border border-slate-200 rounded-lg text-sm font-mono focus:border-primary"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Warna Aksen (Border & Badge)
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={config.borderColor}
                  onChange={(e) => updateField('borderColor', e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
                />
                <input
                  type="text"
                  value={config.borderColor}
                  onChange={(e) => updateField('borderColor', e.target.value)}
                  className="flex-1 px-3 border border-slate-200 rounded-lg text-sm font-mono focus:border-primary"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-4">
              <Settings2 size={18} className="text-primary" />
              Tipografi Font
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Jenis Font
                </label>
                <select
                  value={config.fontFamily}
                  onChange={(e) => updateField('fontFamily', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-primary bg-white"
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Ukuran Teks: {config.fontSize}px
                </label>
                <input
                  type="number"
                  min="8"
                  max="24"
                  value={config.fontSize}
                  onChange={(e) => updateField('fontSize', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Ketebalan Teks
                </label>
                <select
                  value={config.fontWeight}
                  onChange={(e) => updateField('fontWeight', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-primary bg-white"
                >
                  {WEIGHT_OPTIONS.map((w) => (
                    <option key={w.value} value={w.value}>{w.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Gaya Teks
                </label>
                <select
                  value={config.fontStyle}
                  onChange={(e) => updateField('fontStyle', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-primary bg-white"
                >
                  {STYLE_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
