'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Bell, Clock, Send, Settings, RefreshCw } from 'lucide-react';

interface NotificationSettings {
  id?: number;
  auto_notify_enabled: boolean;
  notify_before_minutes: number;
  notify_topic: string;
  last_auto_sent_at?: string;
}

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings>({
    auto_notify_enabled: false,
    notify_before_minutes: 10,
    notify_topic: 'jadwal_update',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [todaySchedules, setTodaySchedules] = useState<Array<{ judul: string; program: string; pemateri: string; jam: string }>>([]);

  useEffect(() => {
    fetchSettings();
    fetchTodaySchedules();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('notification_settings')
      .select('*')
      .limit(1)
      .maybeSingle();
    if (data) {
      setSettings(data);
    }
    setLoading(false);
  };

  const fetchTodaySchedules = async () => {
    // Gunakan timezone WIB (Asia/Jakarta) untuk menentukan tanggal hari ini
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
    const { data } = await supabase
      .from('schedules')
      .select('judul, program, pemateri, jam')
      .eq('date', today)
      .order('jam', { ascending: true });
    setTodaySchedules(data || []);
  };

  const saveSettings = async () => {
    setSaving(true);
    const payload = {
      auto_notify_enabled: settings.auto_notify_enabled,
      notify_before_minutes: settings.notify_before_minutes,
      notify_topic: settings.notify_topic,
    };

    if (settings.id) {
      await supabase.from('notification_settings').update(payload).eq('id', settings.id);
    } else {
      const { data } = await supabase.from('notification_settings').insert(payload).select().single();
      if (data) setSettings(data);
    }
    setSaving(false);
    alert('Pengaturan berhasil disimpan!');
  };

  const sendTestNotification = async () => {
    setTestSending(true);
    try {
      // Get the next upcoming schedule
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const nextSchedule = todaySchedules.find(s => {
        // Normalize dots to colons (jam bisa "08.00 - 09.00" atau "08:00 - 09:00")
        const startTime = s.jam.replace(/\./g, ':').split(' - ')[0].trim();
        return startTime > currentTime;
      });

      // Hitung countdown aktual ke program berikutnya
      let minutesLeft = 0;
      if (nextSchedule) {
        const startTime = nextSchedule.jam.replace(/\./g, ':').split(' - ')[0].trim();
        const [h, m] = startTime.split(':').map(Number);
        if (!isNaN(h) && !isNaN(m)) {
          const programDate = new Date();
          programDate.setHours(h, m, 0, 0);
          minutesLeft = Math.max(0, Math.round((programDate.getTime() - now.getTime()) / 60000));
        }
      }

      const title = nextSchedule
        ? `${minutesLeft} menit lagi: ${nextSchedule.program}`
        : 'Tes Notifikasi Jadwal';
      const message = nextSchedule
        ? `${nextSchedule.judul} bersama ${nextSchedule.pemateri} (${nextSchedule.jam})`
        : 'Ini adalah tes notifikasi otomatis dari Radio Mass FM';

      const { error } = await supabase.functions.invoke('send-notification', {
        body: { title, message, topic: settings.notify_topic },
      });
      if (error) throw error;
      alert('Notifikasi tes berhasil dikirim!');
    } catch (err) {
      console.error('Test notification error:', err);
      alert('Gagal mengirim notifikasi tes. Periksa Edge Function.');
    }
    setTestSending(false);
  };

  const sendScheduleNotifications = async () => {
    if (!confirm('Kirim notifikasi untuk semua jadwal hari ini?')) return;
    setTestSending(true);
    try {
      for (const schedule of todaySchedules) {
        const title = `Kajian: ${schedule.program}`;
        const message = `${schedule.judul} - ${schedule.pemateri} (${schedule.jam})`;
        
        await supabase.functions.invoke('send-notification', {
          body: { title, message, topic: settings.notify_topic },
        });

        await supabase.from('notifications').insert({
          title, body: message, topic: settings.notify_topic,
        });
      }
      alert(`${todaySchedules.length} notifikasi jadwal berhasil dikirim!`);

      // Update last sent time
      if (settings.id) {
        await supabase.from('notification_settings')
          .update({ last_auto_sent_at: new Date().toISOString() })
          .eq('id', settings.id);
      }
    } catch (err) {
      console.error('Batch notification error:', err);
      alert('Sebagian notifikasi mungkin gagal dikirim');
    }
    setTestSending(false);
  };

  if (loading) {
    return <div className="text-center py-16 text-slate-400">Memuat pengaturan...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-800">Pengaturan Notifikasi Otomatis</h1>
        <p className="text-sm text-slate-400 mt-1">Konfigurasikan notifikasi jadwal otomatis untuk pengguna</p>
      </div>

      {/* Settings Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <Settings size={20} className="text-purple-600" />
          </div>
          <div>
            <h2 className="font-bold text-slate-700">Pengaturan Utama</h2>
            <p className="text-xs text-slate-400">Atur kapan notifikasi jadwal dikirim</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Enable/Disable toggle */}
          <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Bell size={18} className="text-purple-500" />
              <div>
                <p className="text-sm font-semibold text-slate-700">Notifikasi Otomatis</p>
                <p className="text-[11px] text-slate-400">Kirim pengingat sebelum program dimulai</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={settings.auto_notify_enabled}
                onChange={(e) => setSettings(prev => ({ ...prev, auto_notify_enabled: e.target.checked }))}
                className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Minutes before */}
          <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-blue-500" />
              <div>
                <p className="text-sm font-semibold text-slate-700">Kirim Sebelum</p>
                <p className="text-[11px] text-slate-400">Menit sebelum program dimulai</p>
              </div>
            </div>
            <select value={settings.notify_before_minutes}
              onChange={(e) => setSettings(prev => ({ ...prev, notify_before_minutes: parseInt(e.target.value) }))}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none">
              <option value={5}>5 menit</option>
              <option value={10}>10 menit</option>
              <option value={15}>15 menit</option>
              <option value={30}>30 menit</option>
            </select>
          </div>

          {/* Topic */}
          <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Send size={18} className="text-green-500" />
              <div>
                <p className="text-sm font-semibold text-slate-700">Topik FCM</p>
                <p className="text-[11px] text-slate-400">Kirim ke group pengguna tertentu</p>
              </div>
            </div>
            <select value={settings.notify_topic}
              onChange={(e) => setSettings(prev => ({ ...prev, notify_topic: e.target.value }))}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none">
              <option value="all_users">Semua Pengguna</option>
              <option value="jadwal_update">Update Jadwal</option>
              <option value="kajian_baru">Kajian Baru</option>
            </select>
          </div>

          <button onClick={saveSettings} disabled={saving}
            className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50">
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      </div>

      {/* Manual Send */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
            <Send size={20} className="text-orange-600" />
          </div>
          <div>
            <h2 className="font-bold text-slate-700">Kirim Manual</h2>
            <p className="text-xs text-slate-400">Kirim notifikasi jadwal secara manual</p>
          </div>
        </div>

        <div className="space-y-3">
          <button onClick={sendTestNotification} disabled={testSending}
            className="w-full py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            <RefreshCw size={16} className={testSending ? 'animate-spin' : ''} />
            {testSending ? 'Mengirim...' : 'Kirim Tes (Program Berikutnya)'}
          </button>
          <button onClick={sendScheduleNotifications} disabled={testSending || todaySchedules.length === 0}
            className="w-full py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            <Bell size={16} />
            Kirim Semua Jadwal Hari Ini ({todaySchedules.length} program)
          </button>
        </div>

        {settings.last_auto_sent_at && (
          <p className="text-[11px] text-slate-400 mt-3 text-center">
            Terakhir dikirim: {new Date(settings.last_auto_sent_at).toLocaleString('id-ID')}
          </p>
        )}
      </div>

      {/* Today's Schedule Preview */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h2 className="font-bold text-slate-700 mb-4">Jadwal Hari Ini</h2>
        {todaySchedules.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">Tidak ada jadwal hari ini</p>
        ) : (
          <div className="space-y-2">
            {todaySchedules.map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <span className="text-xs font-bold text-slate-500 bg-white px-2 py-1 rounded-lg min-w-[90px] text-center">{s.jam}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-purple-600 truncate">{s.program}</p>
                  <p className="text-[11px] text-slate-500 truncate">{s.judul} - {s.pemateri}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
