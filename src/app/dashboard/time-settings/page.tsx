'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, Calendar, Minus, Plus, Save, RotateCcw } from 'lucide-react';

interface PrayerOffsets {
  subuh: number;
  terbit: number;
  dzuhur: number;
  ashar: number;
  maghrib: number;
  isya: number;
}

const defaultOffsets: PrayerOffsets = {
  subuh: 0,
  terbit: 0,
  dzuhur: 0,
  ashar: 0,
  maghrib: 0,
  isya: 0,
};

const prayerLabels: { key: keyof PrayerOffsets; label: string; emoji: string }[] = [
  { key: 'subuh', label: 'Subuh', emoji: '🌅' },
  { key: 'terbit', label: 'Terbit', emoji: '☀️' },
  { key: 'dzuhur', label: 'Dzuhur', emoji: '🌤️' },
  { key: 'ashar', label: 'Ashar', emoji: '⛅' },
  { key: 'maghrib', label: 'Maghrib', emoji: '🌇' },
  { key: 'isya', label: 'Isya', emoji: '🌙' },
];

export default function TimeSettingsPage() {
  const [hijriOffset, setHijriOffset] = useState(0);
  const [offsets, setOffsets] = useState<PrayerOffsets>({ ...defaultOffsets });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [settingsId, setSettingsId] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    setLoading(true);
    const { data, error } = await supabase
      .from('app_settings')
      .select('id, hijri_offset, offset_subuh, offset_terbit, offset_dzuhur, offset_ashar, offset_maghrib, offset_isya')
      .limit(1)
      .single();

    if (!error && data) {
      const d = data as Record<string, number | string | null>;
      setSettingsId(d.id as string);
      setHijriOffset((d.hijri_offset as number) ?? 0);
      setOffsets({
        subuh: (d.offset_subuh as number) ?? 0,
        terbit: (d.offset_terbit as number) ?? 0,
        dzuhur: (d.offset_dzuhur as number) ?? 0,
        ashar: (d.offset_ashar as number) ?? 0,
        maghrib: (d.offset_maghrib as number) ?? 0,
        isya: (d.offset_isya as number) ?? 0,
      });
    }
    setLoading(false);
  }

  async function saveSettings() {
    setSaving(true);
    setMessage('');

    if (!settingsId) {
      setMessage('❌ ID pengaturan tidak ditemukan. Muat ulang halaman.');
      setSaving(false);
      return;
    }

    const { error } = await (supabase
      .from('app_settings') as any)
      .update({
        hijri_offset: hijriOffset,
        offset_subuh: offsets.subuh,
        offset_terbit: offsets.terbit,
        offset_dzuhur: offsets.dzuhur,
        offset_ashar: offsets.ashar,
        offset_maghrib: offsets.maghrib,
        offset_isya: offsets.isya,
      })
      .eq('id', settingsId);

    if (error) {
      setMessage('❌ Gagal menyimpan: ' + error.message);
    } else {
      setMessage('✅ Berhasil disimpan! Perubahan berlaku real-time di aplikasi.');
    }
    setSaving(false);
  }

  function resetDefaults() {
    setHijriOffset(0);
    setOffsets({ ...defaultOffsets });
  }

  function updateOffset(key: keyof PrayerOffsets, delta: number) {
    setOffsets((prev) => ({
      ...prev,
      [key]: Math.max(-15, Math.min(15, prev[key] + delta)),
    }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-800">
          Pengaturan Waktu
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Atur koreksi tanggal Hijriyah dan waktu shalat pada aplikasi
        </p>
      </div>

      {/* Hijri Offset */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
            <Calendar className="text-amber-600" size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-slate-700">Koreksi Tanggal Hijriyah</h2>
            <p className="text-xs text-slate-400">
              Geser ±hari untuk menyesuaikan tanggal hijriyah. Contoh: +1 = tanggal hijriyah maju 1 hari.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 justify-center py-4">
          <button
            onClick={() => setHijriOffset(v => Math.max(v - 1, -5))}
            className="w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <Minus size={20} className="text-slate-600" />
          </button>

          <div className="text-center min-w-30">
            <div className="text-4xl font-bold text-slate-800">
              {hijriOffset > 0 ? '+' : ''}{hijriOffset}
            </div>
            <div className="text-xs text-slate-400 mt-1">hari</div>
          </div>

          <button
            onClick={() => setHijriOffset(v => Math.min(v + 1, 5))}
            className="w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <Plus size={20} className="text-slate-600" />
          </button>
        </div>

        <div className="text-center text-xs text-slate-400">
          Range: -5 sampai +5 hari
        </div>
      </div>

      {/* Per-Prayer Offset */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
            <Clock className="text-primary" size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-slate-700">Koreksi Waktu Shalat</h2>
            <p className="text-xs text-slate-400">
              Atur koreksi masing-masing waktu shalat secara terpisah (±menit).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {prayerLabels.map(({ key, label, emoji }) => (
            <div
              key={key}
              className="rounded-xl border border-slate-100 p-4 flex flex-col items-center gap-2"
            >
              <div className="text-2xl">{emoji}</div>
              <div className="text-sm font-semibold text-slate-700">{label}</div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateOffset(key, -1)}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <Minus size={14} className="text-slate-600" />
                </button>

                <div className="text-center min-w-12">
                  <div className="text-xl font-bold text-slate-800">
                    {offsets[key] > 0 ? '+' : ''}{offsets[key]}
                  </div>
                </div>

                <button
                  onClick={() => updateOffset(key, 1)}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <Plus size={14} className="text-slate-600" />
                </button>
              </div>

              <div className="text-[10px] text-slate-400">menit</div>
            </div>
          ))}
        </div>

        <div className="text-center text-xs text-slate-400 mt-4">
          Range: -15 sampai +15 menit per waktu shalat
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>

        <button
          onClick={resetDefaults}
          className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-colors"
        >
          <RotateCcw size={16} />
          Reset Default
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium ${
          message.startsWith('✅')
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}
