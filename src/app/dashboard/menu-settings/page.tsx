'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Menu, Plus, Trash2, Save, GripVertical, ToggleLeft, ToggleRight, Eye } from 'lucide-react';

interface CustomButton {
  label: string;
  icon: string;
  route: string;
  color: string;
  enabled: boolean;
}

const ICON_OPTIONS = [
  { value: 'volunteer_activism', label: '🤲 Donasi' },
  { value: 'auto_awesome', label: '✨ Dzikir' },
  { value: 'menu_book', label: '📖 Doa' },
  { value: 'mosque', label: '🕌 Masjid' },
  { value: 'favorite', label: '❤️ Favorit' },
  { value: 'star', label: '⭐ Bintang' },
  { value: 'headphones', label: '🎧 Headphone' },
  { value: 'music_note', label: '🎵 Musik' },
  { value: 'calendar', label: '📅 Kalender' },
  { value: 'question_answer', label: '💬 Tanya Jawab' },
  { value: 'download', label: '⬇️ Download' },
  { value: 'share', label: '📤 Share' },
  { value: 'notifications', label: '🔔 Notifikasi' },
  { value: 'compass', label: '🧭 Kompas' },
  { value: 'prayer', label: '🕐 Shalat' },
  { value: 'quran', label: '📚 Quran' },
];

const ROUTE_OPTIONS = [
  { value: 'donation', label: 'Halaman Donasi' },
  { value: 'dzikir', label: 'Halaman Dzikir' },
  { value: 'doa', label: 'Halaman Doa Harian' },
  { value: 'schedule', label: 'Halaman Jadwal' },
  { value: 'chat', label: 'Halaman Live Chat' },
];

const DEFAULT_BUTTONS: CustomButton[] = [
  { label: 'Infaq', icon: 'volunteer_activism', route: 'donation', color: '#F57C00', enabled: true },
  { label: 'Dzikir', icon: 'auto_awesome', route: 'dzikir', color: '#822a6e', enabled: true },
  { label: 'Doa Harian', icon: 'menu_book', route: 'doa', color: '#2d132c', enabled: true },
];

export default function MenuSettingsPage() {
  const [buttons, setButtons] = useState<CustomButton[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadButtons();
  }, []);

  async function loadButtons() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('custom_menu_buttons')
        .limit(1)
        .single();

      if (error) {
        console.error('Load buttons error:', error.message);
        setButtons(DEFAULT_BUTTONS);
        setLoading(false);
        return;
      }

      const raw = (data as Record<string, unknown>)?.custom_menu_buttons;
      if (raw) {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        setButtons(Array.isArray(parsed) ? parsed : DEFAULT_BUTTONS);
      } else {
        setButtons(DEFAULT_BUTTONS);
      }
    } catch {
      setButtons(DEFAULT_BUTTONS);
    }
    setLoading(false);
  }

  async function saveButtons() {
    setSaving(true);
    setMessage('');
    try {
      // Get the first app_settings row ID
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

      // Save as plain JSON array (not stringified) for JSONB column compatibility
      const { error: updateError } = await supabase
        .from('app_settings')
        .update({ custom_menu_buttons: buttons })
        .eq('id', (existing as Record<string, unknown>).id as number);

      if (updateError) {
        setMessage('❌ Gagal menyimpan: ' + updateError.message);
      } else {
        setMessage('✅ Menu berhasil disimpan! Perubahan akan langsung muncul di aplikasi.');
      }
    } catch (e) {
      setMessage('❌ Gagal menyimpan: ' + String(e));
    }
    setSaving(false);
  }

  function addButton() {
    if (buttons.length >= 5) {
      setMessage('⚠️ Maksimal 5 tombol menu');
      return;
    }
    setButtons([...buttons, {
      label: 'Tombol Baru',
      icon: 'star',
      route: 'donation',
      color: '#822a6e',
      enabled: true,
    }]);
  }

  function removeButton(index: number) {
    setButtons(buttons.filter((_, i) => i !== index));
  }

  function updateButton(index: number, field: keyof CustomButton, value: string | boolean) {
    const updated = [...buttons];
    updated[index] = { ...updated[index], [field]: value };
    setButtons(updated);
  }

  function resetToDefault() {
    setButtons([...DEFAULT_BUTTONS]);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Menu className="text-primary" size={20} />
            </div>
            Kustomisasi Menu Utama
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Atur tombol-tombol yang muncul di bawah player pada halaman beranda
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={resetToDefault}
            className="px-4 py-2 text-sm text-slate-500 hover:text-primary border border-slate-200 rounded-xl hover:border-primary/30 transition-colors"
          >
            Reset Default
          </button>
          <button
            onClick={saveButtons}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Menyimpan...' : 'Simpan'}
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

      {/* Preview */}
      <div className="bg-linear-to-r from-primary/5 to-purple-50 rounded-2xl p-6 border border-primary/10">
        <div className="flex items-center gap-2 text-sm font-bold text-primary mb-4">
          <Eye size={16} />
          Preview Tampilan
        </div>
        <div className="flex gap-3 max-w-sm mx-auto">
          {buttons.filter(b => b.enabled).map((btn, i) => (
            <div
              key={i}
              className="flex-1 rounded-2xl py-4 text-center text-white text-xs font-bold shadow-lg"
              style={{ backgroundColor: btn.color }}
            >
              <div className="text-lg mb-1">
                {ICON_OPTIONS.find(o => o.value === btn.icon)?.label.split(' ')[0] || '⭐'}
              </div>
              {btn.label}
            </div>
          ))}
        </div>
      </div>

      {/* Button List */}
      <div className="space-y-4">
        {buttons.map((btn, index) => (
          <div
            key={index}
            className={`bg-white rounded-2xl border p-5 transition-all ${
              btn.enabled ? 'border-slate-100 shadow-sm' : 'border-slate-100 opacity-60'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="mt-2 text-slate-300">
                <GripVertical size={18} />
              </div>
              
              <div className="flex-1 grid grid-cols-2 gap-4">
                {/* Label */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Nama Tombol
                  </label>
                  <input
                    type="text"
                    value={btn.label}
                    onChange={(e) => updateButton(index, 'label', e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                    maxLength={20}
                  />
                </div>

                {/* Icon */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Ikon
                  </label>
                  <select
                    value={btn.icon}
                    onChange={(e) => updateButton(index, 'icon', e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary bg-white"
                  >
                    {ICON_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Route */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Tujuan / Halaman
                  </label>
                  <select
                    value={btn.route}
                    onChange={(e) => updateButton(index, 'route', e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary bg-white"
                  >
                    {ROUTE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Color */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Warna
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={btn.color}
                      onChange={(e) => updateButton(index, 'color', e.target.value)}
                      className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={btn.color}
                      onChange={(e) => updateButton(index, 'color', e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary font-mono"
                      maxLength={7}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col items-center gap-2 mt-2">
                <button
                  onClick={() => updateButton(index, 'enabled', !btn.enabled)}
                  className={`p-2 rounded-lg transition-colors ${
                    btn.enabled ? 'text-primary bg-primary/10' : 'text-slate-300 bg-slate-50'
                  }`}
                  title={btn.enabled ? 'Nonaktifkan' : 'Aktifkan'}
                >
                  {btn.enabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                </button>
                <button
                  onClick={() => removeButton(index)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Hapus"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Button */}
      <button
        onClick={addButton}
        className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 text-sm font-bold"
      >
        <Plus size={18} />
        Tambah Tombol ({buttons.length}/5)
      </button>

      {/* Help */}
      <div className="bg-slate-50 rounded-2xl p-5 text-xs text-slate-400 space-y-2">
        <p className="font-bold text-slate-500">💡 Panduan:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Maksimal <strong>5 tombol</strong> yang bisa ditambahkan</li>
          <li>Tombol yang dinonaktifkan tidak akan muncul di aplikasi</li>
          <li>Perubahan akan langsung diterapkan setelah Simpan (realtime via Supabase)</li>
          <li>Jika semua tombol dihapus, aplikasi akan menggunakan tombol default (Infaq, Dzikir, Doa)</li>
        </ul>
      </div>
    </div>
  );
}
