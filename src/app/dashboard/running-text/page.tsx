'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Type, Save, ToggleLeft, ToggleRight, Eye, Link as LinkIcon, Settings2, Palette, Type as TypeIcon, Plus, Trash2 } from 'lucide-react';

interface RunningTextItem {
  id: string;
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
  openInExternalBrowser: boolean;
}

interface RunningTextConfig {
  enabled: boolean;
  displayMode: string;
  items: RunningTextItem[];
}

const DEFAULT_ITEM: RunningTextItem = {
  id: '1',
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
  openInExternalBrowser: false,
};

const DEFAULT_CONFIG: RunningTextConfig = {
  enabled: true,
  displayMode: 'marquee',
  items: [DEFAULT_ITEM],
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
  const [activeIndex, setActiveIndex] = useState(0);
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
        
        // Backward compatibility handler
        if (parsed.items && Array.isArray(parsed.items)) {
          setConfig({ 
            enabled: parsed.enabled ?? true, 
            displayMode: parsed.displayMode || 'marquee',
            items: parsed.items 
          });
        } else {
          // Convert old format to array
          setConfig({
            enabled: parsed.enabled ?? true,
            displayMode: parsed.displayMode || 'marquee',
            items: [{
              id: Date.now().toString(),
              text: parsed.text || DEFAULT_ITEM.text,
              speed: parsed.speed ?? DEFAULT_ITEM.speed,
              textColor: parsed.textColor || DEFAULT_ITEM.textColor,
              backgroundColor: parsed.backgroundColor || DEFAULT_ITEM.backgroundColor,
              borderColor: parsed.borderColor || DEFAULT_ITEM.borderColor,
              fontSize: parsed.fontSize ?? DEFAULT_ITEM.fontSize,
              fontWeight: parsed.fontWeight || DEFAULT_ITEM.fontWeight,
              fontStyle: parsed.fontStyle || DEFAULT_ITEM.fontStyle,
              fontFamily: parsed.fontFamily || DEFAULT_ITEM.fontFamily,
              route: parsed.route || '',
              openInExternalBrowser: parsed.openInExternalBrowser ?? false,
            }]
          });
        }
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

      // We save the items but also populate root properties from item[0] for older flutter apps
      const fallbackItem = config.items.length > 0 ? config.items[0] : DEFAULT_ITEM;
      const dataToSave = {
        ...fallbackItem, // root properties for old app versions
        enabled: config.enabled,
        displayMode: config.displayMode,
        items: config.items, // new property for updated app versions
      };

      const { error: updateError } = await supabase
        .from('app_settings')
        .update({ running_text_config: dataToSave })
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

  function updateActiveField(field: keyof RunningTextItem, value: string | number | boolean) {
    const newItems = [...config.items];
    newItems[activeIndex] = { ...newItems[activeIndex], [field]: value };
    setConfig({ ...config, items: newItems });
  }

  function addItem() {
    if (config.items.length >= 5) {
      setMessage('⚠️ Batas maksimal 5 teks telah tercapai.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    const newItem = { ...DEFAULT_ITEM, id: Date.now().toString(), text: 'Teks pengumuman baru...' };
    setConfig({ ...config, items: [...config.items, newItem] });
    setActiveIndex(config.items.length);
  }

  function deleteItem(index: number) {
    if (config.items.length <= 1) {
      setMessage('⚠️ Minimal harus ada 1 teks.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    const newItems = config.items.filter((_, i) => i !== index);
    setConfig({ ...config, items: newItems });
    if (activeIndex >= newItems.length) {
      setActiveIndex(newItems.length - 1);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const activeItem = config.items[activeIndex];

  return (
    <div className="space-y-8 max-w-6xl">
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
            Atur beberapa teks berjalan yang akan berganti otomatis (maks 5 teks).
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={saveConfig}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-lg shadow-primary/20"
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

      {/* Global Setting & Preview */}
      <div className="bg-slate-100 rounded-2xl p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
            <Eye size={16} />
            Preview Teks Aktif (Teks {activeIndex + 1})
          </div>
          <button
            onClick={() => setConfig({ ...config, enabled: !config.enabled })}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              config.enabled ? 'bg-primary text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200'
            }`}
          >
            {config.enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
            {config.enabled ? 'Fitur Aktif' : 'Fitur Nonaktif'}
          </button>
        </div>
        
        {/* Pengaturan Tipe Tampilan */}
        <div className="mb-6 bg-white p-4 rounded-xl border border-slate-200">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Tipe Tampilan Widget
          </label>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setConfig({ ...config, displayMode: 'marquee' })}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all border ${
                config.displayMode === 'marquee' || !config.displayMode
                  ? 'bg-primary/10 border-primary text-primary shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
              }`}
            >
              Teks Berjalan (Marquee)
            </button>
            <button
              onClick={() => setConfig({ ...config, displayMode: 'quote' })}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all border ${
                config.displayMode === 'quote'
                  ? 'bg-primary/10 border-primary text-primary shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
              }`}
            >
              Kutipan Bergilir (Quotes Carousel)
            </button>
          </div>
        </div>

        {/* Mockup Aplikasi */}
        <div className="max-w-md mx-auto bg-slate-50 border-[6px] border-slate-800 rounded-[2.5rem] p-4 shadow-xl relative overflow-hidden h-[120px]">
          {/* Status bar mockup */}
          <div className="flex justify-between items-center mb-6 px-4">
            <span className="text-[10px] font-bold text-slate-800">9:41</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 bg-slate-800 rounded-full"></div>
              <div className="w-3 h-3 bg-slate-800 rounded-full"></div>
            </div>
          </div>

          {config.enabled && activeItem && activeItem.text.trim() !== '' ? (
            <div 
              className="mx-2 py-2 px-3 rounded-full flex items-center gap-3 overflow-hidden shadow-sm transition-all duration-500"
              style={{
                backgroundColor: activeItem.backgroundColor,
                border: `1px solid ${activeItem.borderColor}40`,
              }}
            >
              <div 
                className="text-[8px] font-bold px-2 py-1 rounded-full uppercase shrink-0 transition-colors"
                style={{
                  backgroundColor: activeItem.borderColor,
                  color: '#FFF',
                }}
              >
                INFO
              </div>
              <div className="relative flex-1 overflow-hidden h-4 flex items-center">
                <div 
                  className="whitespace-nowrap animate-[marquee_10s_linear_infinite]"
                  style={{
                    color: activeItem.textColor,
                    fontSize: `${Math.min(activeItem.fontSize, 14)}px`,
                    fontWeight: activeItem.fontWeight === 'bold' ? 700 : activeItem.fontWeight === 'w500' ? 500 : 400,
                    fontStyle: activeItem.fontStyle === 'italic' ? 'italic' : 'normal',
                    fontFamily: activeItem.fontFamily,
                  }}
                >
                  {activeItem.text}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-12 border-2 border-dashed border-slate-300 rounded-xl bg-slate-100/50 mx-2 text-xs font-bold text-slate-400">
              {config.enabled ? 'Teks Kosong' : 'Running Text Dinonaktifkan'}
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

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Item List */}
        <div className="w-full lg:w-1/3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-800">Daftar Teks ({config.items.length}/5)</h2>
            <button
              onClick={addItem}
              disabled={config.items.length >= 5}
              className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50"
            >
              <Plus size={14} /> Tambah
            </button>
          </div>
          
          <div className="space-y-2">
            {config.items.map((item, index) => (
              <div 
                key={item.id}
                onClick={() => setActiveIndex(index)}
                className={`p-4 rounded-xl cursor-pointer transition-all border ${
                  activeIndex === index 
                    ? 'bg-white border-primary shadow-sm ring-1 ring-primary/20' 
                    : 'bg-white/50 border-slate-200 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${activeIndex === index ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                        Teks {index + 1}
                      </span>
                      {item.route && (
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                          <LinkIcon size={10} /> Link
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 truncate font-medium">
                      {item.text || 'Teks kosong...'}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteItem(index);
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Hapus teks"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Editor Form */}
        <div className="w-full lg:w-2/3">
          {activeItem && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-8 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <TypeIcon size={18} className="text-primary" />
                  Edit Teks {activeIndex + 1}
                </h2>
              </div>

              {/* Konten & Link */}
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Teks Pengumuman
                  </label>
                  <textarea
                    value={activeItem.text}
                    onChange={(e) => updateActiveField('text', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 min-h-[100px]"
                    placeholder="Masukkan teks pengumuman yang akan berjalan..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <LinkIcon size={14} />
                      Aksi Klik Teks (Tujuan)
                    </label>
                    <select
                      value={activeItem.route.startsWith('http') ? 'url_external' : activeItem.route}
                      onChange={(e) => {
                        if (e.target.value === 'url_external') {
                          updateActiveField('route', 'https://');
                        } else {
                          updateActiveField('route', e.target.value);
                        }
                      }}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary bg-white"
                    >
                      {ROUTE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    
                    {activeItem.route.startsWith('http') && (
                      <div className="mt-3 space-y-3">
                        <input
                          type="url"
                          value={activeItem.route}
                          onChange={(e) => updateActiveField('route', e.target.value)}
                          placeholder="https://contoh.com"
                          className="w-full px-4 py-3 border border-primary/40 rounded-xl text-sm focus:outline-none focus:border-primary bg-blue-50/50 font-mono"
                        />
                        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <button
                            onClick={() => updateActiveField('openInExternalBrowser', !activeItem.openInExternalBrowser)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                              activeItem.openInExternalBrowser ? 'bg-primary text-white' : 'bg-white text-slate-500 border border-slate-200'
                            }`}
                          >
                            {activeItem.openInExternalBrowser ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                            {activeItem.openInExternalBrowser ? 'Ya' : 'Tidak'}
                          </button>
                          <span className="text-xs font-medium text-slate-500">
                            Buka di luar aplikasi (Browser Eksternal)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Kecepatan Berjalan (Speed: {activeItem.speed})
                    </label>
                    <div className="flex gap-4 items-center h-12 bg-slate-50 px-4 rounded-xl border border-slate-100">
                      <span className="text-xs font-bold text-slate-400">Lambat</span>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        value={activeItem.speed}
                        onChange={(e) => updateActiveField('speed', parseFloat(e.target.value))}
                        className="flex-1 accent-primary"
                      />
                      <span className="text-xs font-bold text-slate-400">Cepat</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Warna & Desain */}
              <div className="pt-6 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <Palette size={16} className="text-slate-400" />
                  Warna & Desain
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Warna Teks</label>
                    <div className="flex gap-2">
                      <input type="color" value={activeItem.textColor} onChange={(e) => updateActiveField('textColor', e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200" />
                      <input type="text" value={activeItem.textColor} onChange={(e) => updateActiveField('textColor', e.target.value)} className="flex-1 px-3 border border-slate-200 rounded-lg text-sm font-mono focus:border-primary" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Warna Latar</label>
                    <div className="flex gap-2">
                      <input type="color" value={activeItem.backgroundColor} onChange={(e) => updateActiveField('backgroundColor', e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200" />
                      <input type="text" value={activeItem.backgroundColor} onChange={(e) => updateActiveField('backgroundColor', e.target.value)} className="flex-1 px-3 border border-slate-200 rounded-lg text-sm font-mono focus:border-primary" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Warna Aksen</label>
                    <div className="flex gap-2">
                      <input type="color" value={activeItem.borderColor} onChange={(e) => updateActiveField('borderColor', e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200" />
                      <input type="text" value={activeItem.borderColor} onChange={(e) => updateActiveField('borderColor', e.target.value)} className="flex-1 px-3 border border-slate-200 rounded-lg text-sm font-mono focus:border-primary" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tipografi */}
              <div className="pt-6 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <Settings2 size={16} className="text-slate-400" />
                  Tipografi
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Font</label>
                    <select value={activeItem.fontFamily} onChange={(e) => updateActiveField('fontFamily', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-primary bg-white">
                      {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ukuran</label>
                    <input type="number" min="8" max="24" value={activeItem.fontSize} onChange={(e) => updateActiveField('fontSize', parseFloat(e.target.value))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ketebalan</label>
                    <select value={activeItem.fontWeight} onChange={(e) => updateActiveField('fontWeight', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-primary bg-white">
                      {WEIGHT_OPTIONS.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Gaya</label>
                    <select value={activeItem.fontStyle} onChange={(e) => updateActiveField('fontStyle', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-primary bg-white">
                      {STYLE_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
