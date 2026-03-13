'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Save, Loader2, Palette, CheckCircle2 } from 'lucide-react';

interface ScheduleScreenTheme {
  style: string;
}

const defaultTheme: ScheduleScreenTheme = {
  style: 'clean',
};

const styleOptions = [
  {
    value: 'clean',
    label: 'Clean & Modern',
    desc: 'Latar terang, card putih dengan shadow halus',
    preview: {
      bg: 'bg-gradient-to-b from-[#FCF8FB] to-[#F5F2F5]',
      card: 'bg-white border-[#E8E0E6]',
      appbar: 'bg-white text-[#2d132c]',
      accent: 'text-[#822a6e]',
    },
  },
  {
    value: 'colorful',
    label: 'Colorful & Vibrant',
    desc: 'Gradient hangat, AppBar ungu, aksen warna cerah',
    preview: {
      bg: 'bg-gradient-to-b from-[#FFF8F5] to-[#F5F0FF]',
      card: 'bg-white border-[#EDE5EB]',
      appbar: 'bg-[#822a6e] text-white',
      accent: 'text-[#822a6e]',
    },
  },
  {
    value: 'glass',
    label: 'Glassmorphism Light',
    desc: 'Efek blur lavender, card transparan, modern',
    preview: {
      bg: 'bg-gradient-to-b from-[#F5EEF4] to-[#EDE7F0]',
      card: 'bg-white/80 border-white/60',
      appbar: 'bg-[#F5EEF4]/90 text-[#2d132c]',
      accent: 'text-[#822a6e]',
    },
  },
  {
    value: 'dark',
    label: 'Dark Mode',
    desc: 'Tema gelap yang elegan, efek glassmorphism',
    preview: {
      bg: 'bg-gradient-to-b from-[#3a1539] to-[#1a0a1a]',
      card: 'bg-white/10 border-white/10',
      appbar: 'bg-[#3a1539] text-white',
      accent: 'text-white',
    },
  },
];

export default function ScheduleThemePage() {
  const [theme, setTheme] = useState<ScheduleScreenTheme>(defaultTheme);
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
      .select('id, schedule_screen_theme')
      .limit(1)
      .single();

    if (!error && data) {
      setRowId(data.id as string);
      if (data.schedule_screen_theme) {
        setTheme({ ...defaultTheme, ...(data.schedule_screen_theme as ScheduleScreenTheme) });
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
      .update({ schedule_screen_theme: theme })
      .eq('id', rowId);

    if (error) {
      setMessage({ type: 'error', text: 'Gagal menyimpan: ' + error.message });
    } else {
      setMessage({ type: 'success', text: 'Tema jadwal siar berhasil disimpan! Aplikasi akan otomatis memperbarui.' });
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
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tema Halaman Jadwal Siar</h1>
          <p className="text-slate-400 text-sm mt-1">
            Pilih gaya tampilan halaman jadwal siar & kalender di aplikasi
          </p>
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
        <div
          className={`p-4 rounded-xl mb-6 text-sm font-medium ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Style Selection */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100">
        <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Palette size={16} /> Gaya Tampilan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {styleOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTheme({ style: opt.value })}
              className={`relative rounded-2xl border-2 text-left transition overflow-hidden ${
                theme.style === opt.value
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-slate-100 hover:border-slate-200'
              }`}
            >
              {/* Preview */}
              <div className={`h-36 ${opt.preview.bg} p-4 flex flex-col gap-2`}>
                {/* Mini AppBar */}
                <div
                  className={`rounded-lg px-3 py-1.5 text-[10px] font-bold ${opt.preview.appbar} w-fit`}
                >
                  Jadwal Siar
                </div>
                {/* Mini Cards */}
                <div className="flex-1 flex flex-col gap-1.5">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`rounded-lg border px-3 py-1.5 flex items-center gap-2 ${opt.preview.card}`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          opt.value === 'dark' ? 'bg-[#822a6e]' : 'bg-[#822a6e]/40'
                        }`}
                      />
                      <div className="flex-1">
                        <div
                          className={`h-1.5 rounded-full ${
                            opt.value === 'dark' ? 'bg-white/30' : 'bg-slate-300/60'
                          } w-3/4`}
                        />
                      </div>
                      <div
                        className={`text-[7px] font-bold ${
                          opt.value === 'dark' ? 'text-[#D4A853]' : 'text-[#D4A853]'
                        }`}
                      >
                        {`0${i + 5}:00`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Label */}
              <div className="p-4">
                <div className="flex items-center gap-2">
                  <p
                    className={`text-sm font-semibold ${
                      theme.style === opt.value ? 'text-primary' : 'text-slate-700'
                    }`}
                  >
                    {opt.label}
                  </p>
                  {theme.style === opt.value && (
                    <CheckCircle2 size={16} className="text-primary" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-xl text-sm text-blue-700">
        <p className="font-medium">ℹ️ Informasi</p>
        <p className="mt-1 text-blue-600 text-xs">
          Perubahan tema akan langsung diterapkan di aplikasi melalui streaming real-time Supabase.
          Halaman Jadwal Siar dan Kalender Jadwal akan mengikuti tema yang dipilih.
        </p>
      </div>
    </div>
  );
}
