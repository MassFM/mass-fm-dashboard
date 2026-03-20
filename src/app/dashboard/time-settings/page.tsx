'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, Calendar, Minus, Plus, Save, RotateCcw, Bell, BellOff } from 'lucide-react';

interface PrayerOffsets {
  subuh: number;
  terbit: number;
  dzuhur: number;
  ashar: number;
  maghrib: number;
  isya: number;
}

interface PrayerNotifConfig {
  enabled: boolean;
  minutes_before: number;
  prayers: string[];
  audio: PrayerAdzanAudioConfig;
}

interface PrayerAdzanAudioConfig {
  enabled: boolean;
  mode: 'default' | 'single_url' | 'per_prayer';
  global_url: string;
  subuh_url: string;
  per_prayer_urls: Record<string, string>;
  fallback_to_system_sound: boolean;
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

const defaultNotifConfig: PrayerNotifConfig = {
  enabled: false,
  minutes_before: 10,
  prayers: ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'],
  audio: {
    enabled: false,
    mode: 'default',
    global_url: '',
    subuh_url: '',
    per_prayer_urls: {
      subuh: '',
      dzuhur: '',
      ashar: '',
      maghrib: '',
      isya: '',
    },
    fallback_to_system_sound: true,
  },
};

const allPrayers = [
  { key: 'subuh', label: 'Subuh', emoji: '🌙' },
  { key: 'dzuhur', label: 'Dzuhur', emoji: '☀️' },
  { key: 'ashar', label: 'Ashar', emoji: '🌤️' },
  { key: 'maghrib', label: 'Maghrib', emoji: '🌇' },
  { key: 'isya', label: 'Isya', emoji: '🌃' },
];

export default function TimeSettingsPage() {
  const [hijriOffset, setHijriOffset] = useState(0);
  const [offsets, setOffsets] = useState<PrayerOffsets>({ ...defaultOffsets });
  const [notifConfig, setNotifConfig] = useState<PrayerNotifConfig>({ ...defaultNotifConfig });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [settingsId, setSettingsId] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('app_settings')
      .select('id, hijri_offset, offset_subuh, offset_terbit, offset_dzuhur, offset_ashar, offset_maghrib, offset_isya, prayer_notif_config')
      .limit(1)
      .single();

    if (!error && data) {
      const d = data as Record<string, unknown>;
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
      if (d.prayer_notif_config) {
        const nc = (typeof d.prayer_notif_config === 'string'
          ? JSON.parse(d.prayer_notif_config)
          : d.prayer_notif_config) as Record<string, unknown> & {
            audio?: {
              enabled?: boolean;
              mode?: string;
              global_url?: string;
              subuh_url?: string;
              per_prayer_urls?: Record<string, string>;
              fallback_to_system_sound?: boolean;
            };
            prayers?: string[];
            enabled?: boolean;
            minutes_before?: number;
          };
        setNotifConfig({
          enabled: nc.enabled ?? false,
          minutes_before: nc.minutes_before ?? 10,
          prayers: nc.prayers ?? ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'],
          audio: {
            enabled: nc.audio?.enabled ?? false,
            mode: nc.audio?.mode === 'single_url' || nc.audio?.mode === 'per_prayer'
              ? nc.audio.mode
              : 'default',
            global_url: nc.audio?.global_url ?? '',
            subuh_url: nc.audio?.subuh_url ?? '',
            per_prayer_urls: {
              subuh: nc.audio?.per_prayer_urls?.subuh ?? '',
              dzuhur: nc.audio?.per_prayer_urls?.dzuhur ?? '',
              ashar: nc.audio?.per_prayer_urls?.ashar ?? '',
              maghrib: nc.audio?.per_prayer_urls?.maghrib ?? '',
              isya: nc.audio?.per_prayer_urls?.isya ?? '',
            },
            fallback_to_system_sound: nc.audio?.fallback_to_system_sound ?? true,
          },
        });
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchSettings();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchSettings]);

  async function saveSettings() {
    setSaving(true);
    setMessage('');

    if (!settingsId) {
      setMessage('❌ ID pengaturan tidak ditemukan. Muat ulang halaman.');
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from('app_settings')
      .update({
        hijri_offset: hijriOffset,
        offset_subuh: offsets.subuh,
        offset_terbit: offsets.terbit,
        offset_dzuhur: offsets.dzuhur,
        offset_ashar: offsets.ashar,
        offset_maghrib: offsets.maghrib,
        offset_isya: offsets.isya,
        prayer_notif_config: notifConfig,
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

      {/* Prayer Notification Config */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${notifConfig.enabled ? 'bg-green-50' : 'bg-slate-50'}`}>
              {notifConfig.enabled
                ? <Bell className="text-green-600" size={20} />
                : <BellOff className="text-slate-400" size={20} />
              }
            </div>
            <div>
              <h2 className="font-semibold text-slate-700">Pengingat Waktu Shalat</h2>
              <p className="text-xs text-slate-400">
                Kirim notifikasi ke semua pengguna sebelum waktu shalat tiba
              </p>
            </div>
          </div>
          <button
            onClick={() => setNotifConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
              notifConfig.enabled ? 'bg-green-500' : 'bg-slate-300'
            }`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
              notifConfig.enabled ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>

        {notifConfig.enabled && (
          <div className="space-y-5 mt-5 pt-5 border-t border-slate-100">
            {/* Minutes before */}
            <div>
              <label className="text-sm font-medium text-slate-600 mb-2 block">
                Default notifikasi muncul berapa menit sebelum waktu shalat?
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setNotifConfig(prev => ({
                    ...prev,
                    minutes_before: Math.max(1, prev.minutes_before - 1),
                  }))}
                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <Minus size={16} className="text-slate-600" />
                </button>
                <div className="text-center min-w-20">
                  <div className="text-3xl font-bold text-slate-800">{notifConfig.minutes_before}</div>
                  <div className="text-xs text-slate-400">menit</div>
                </div>
                <button
                  onClick={() => setNotifConfig(prev => ({
                    ...prev,
                    minutes_before: Math.min(60, prev.minutes_before + 1),
                  }))}
                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <Plus size={16} className="text-slate-600" />
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">Range: 1–60 menit. Pengguna tetap bisa mengubah menit di aplikasi.</p>
            </div>

            {/* Prayer selection */}
            <div>
              <label className="text-sm font-medium text-slate-600 mb-3 block">
                Default shalat yang tersedia untuk diingatkan:
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {allPrayers.map(({ key, label, emoji }) => {
                  const isChecked = notifConfig.prayers.includes(key);
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setNotifConfig(prev => ({
                          ...prev,
                          prayers: isChecked
                            ? prev.prayers.filter(p => p !== key)
                            : [...prev.prayers, key],
                        }));
                      }}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        isChecked
                          ? 'border-primary bg-purple-50 ring-1 ring-primary/30'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <span className="text-xl">{emoji}</span>
                      <span className={`text-sm font-medium ${isChecked ? 'text-primary' : 'text-slate-600'}`}>
                        {label}
                      </span>
                      {isChecked && (
                        <span className="ml-auto text-primary">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl bg-blue-50 border border-blue-200 p-3">
              <p className="text-xs text-blue-700">
                💡 Notifikasi muncul otomatis di HP pengguna sesuai waktu shalat lokal mereka.
                Pengguna memilih per-shalat di aplikasi, sedangkan dashboard ini mengatur default dan batas pilihan yang tersedia.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 p-4 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700">Struktur Suara Adzan Custom</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Menyiapkan konfigurasi audio dari dashboard untuk fase berikutnya.
                    Saat ini aplikasi tetap memakai suara notif sistem agar background notification tetap stabil.
                  </p>
                </div>
                <button
                  onClick={() => setNotifConfig(prev => ({
                    ...prev,
                    audio: { ...prev.audio, enabled: !prev.audio.enabled },
                  }))}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                    notifConfig.audio.enabled ? 'bg-green-500' : 'bg-slate-300'
                  }`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                    notifConfig.audio.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {notifConfig.audio.enabled && (
                <>
                  <div>
                    <label className="text-sm font-medium text-slate-600 mb-2 block">
                      Mode audio
                    </label>
                    <select
                      value={notifConfig.audio.mode}
                      onChange={(e) => setNotifConfig(prev => ({
                        ...prev,
                        audio: {
                          ...prev.audio,
                          mode: e.target.value as PrayerAdzanAudioConfig['mode'],
                        },
                      }))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="default">Gunakan suara notif sistem</option>
                      <option value="single_url">1 URL audio untuk semua shalat</option>
                      <option value="per_prayer">URL audio berbeda per shalat</option>
                    </select>
                  </div>

                  {notifConfig.audio.mode === 'single_url' && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-slate-600 mb-2 block">
                          🕌 URL audio adzan umum (Dzuhur, Ashar, Maghrib, Isya)
                        </label>
                        <input
                          type="url"
                          value={notifConfig.audio.global_url}
                          onChange={(e) => setNotifConfig(prev => ({
                            ...prev,
                            audio: { ...prev.audio, global_url: e.target.value },
                          }))}
                          placeholder="https://.../adzan.mp3"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                        <label className="text-sm font-medium text-amber-800 mb-2 block">
                          🌅 URL audio adzan Subuh (berbeda dari adzan biasa)
                        </label>
                        <input
                          type="url"
                          value={notifConfig.audio.subuh_url}
                          onChange={(e) => setNotifConfig(prev => ({
                            ...prev,
                            audio: { ...prev.audio, subuh_url: e.target.value },
                          }))}
                          placeholder="https://.../adzan-subuh.mp3"
                          className="w-full rounded-xl border border-amber-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-300/30"
                        />
                        <p className="text-xs text-amber-600 mt-1.5">
                          Adzan Subuh memiliki melodi khas yang berbeda dari adzan 4 waktu lainnya. Kosongkan jika ingin menggunakan URL audio umum.
                        </p>
                      </div>
                    </div>
                  )}

                  {notifConfig.audio.mode === 'per_prayer' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {allPrayers.map(({ key, label, emoji }) => (
                        <div key={key}>
                          <label className="text-sm font-medium text-slate-600 mb-2 block">
                            {emoji} {label}
                          </label>
                          <input
                            type="url"
                            value={notifConfig.audio.per_prayer_urls[key] ?? ''}
                            onChange={(e) => setNotifConfig(prev => ({
                              ...prev,
                              audio: {
                                ...prev.audio,
                                per_prayer_urls: {
                                  ...prev.audio.per_prayer_urls,
                                  [key]: e.target.value,
                                },
                              },
                            }))}
                            placeholder={`https://.../${key}.mp3`}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <label className="flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-200 p-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifConfig.audio.fallback_to_system_sound}
                      onChange={(e) => setNotifConfig(prev => ({
                        ...prev,
                        audio: {
                          ...prev.audio,
                          fallback_to_system_sound: e.target.checked,
                        },
                      }))}
                      className="mt-1"
                    />
                    <span className="text-xs text-slate-600 leading-5">
                      Jika URL audio belum siap atau gagal dipakai nanti, kembali ke suara notif sistem perangkat.
                    </span>
                  </label>
                </>
              )}
            </div>
          </div>
        )}
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
