'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface StatSummary {
  total_app_opens: number;
  total_listen_events: number;
  total_listen_hours: number;
  total_fcm_tokens: number;
  today_app_opens: number;
  today_listeners: number;
}

interface DailyStats {
  date: string;
  app_opens: number;
  listen_events: number;
  listen_hours: number;
}

/**
 * Halaman Statistik Pendengar Radio Mass FM.
 * Menampilkan ringkasan + data harian dari tabel `listener_stats`.
 */
export default function StatistikPage() {
  const [summary, setSummary] = useState<StatSummary>({
    total_app_opens: 0,
    total_listen_events: 0,
    total_listen_hours: 0,
    total_fcm_tokens: 0,
    today_app_opens: 0,
    today_listeners: 0,
  });
  const [daily, setDaily] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(7); // 7 or 30 days

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    setLoading(true);

    const today = new Date().toISOString().split('T')[0];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);
    const startStr = startDate.toISOString();

    try {
      // Total app opens
      const { count: totalOpens } = await supabase
        .from('listener_stats')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'app_open');

      // Total listen events
      const { count: totalListens } = await supabase
        .from('listener_stats')
        .select('*', { count: 'exact', head: true })
        .like('event_type', 'listen_%');

      // Total listen seconds
      const { data: durationData } = await supabase
        .from('listener_stats')
        .select('duration_seconds')
        .eq('event_type', 'listen_duration');
      const totalSeconds = (durationData || []).reduce(
        (acc, d) => acc + (d.duration_seconds || 0), 0
      );

      // FCM tokens count
      const { count: tokenCount } = await supabase
        .from('fcm_tokens')
        .select('*', { count: 'exact', head: true });

      // Today stats
      const { count: todayOpens } = await supabase
        .from('listener_stats')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'app_open')
        .gte('created_at', `${today}T00:00:00`);

      const { count: todayListens } = await supabase
        .from('listener_stats')
        .select('*', { count: 'exact', head: true })
        .like('event_type', 'listen_%')
        .gte('created_at', `${today}T00:00:00`);

      setSummary({
        total_app_opens: totalOpens || 0,
        total_listen_events: totalListens || 0,
        total_listen_hours: Math.round(totalSeconds / 3600 * 10) / 10,
        total_fcm_tokens: tokenCount || 0,
        today_app_opens: todayOpens || 0,
        today_listeners: todayListens || 0,
      });

      // Daily stats for bar chart (manual aggregation)
      const { data: periodData } = await supabase
        .from('listener_stats')
        .select('event_type, duration_seconds, created_at')
        .gte('created_at', startStr)
        .order('created_at', { ascending: true });

      const dailyMap: Record<string, DailyStats> = {};
      for (const item of (periodData || [])) {
        const date = new Date(item.created_at).toISOString().split('T')[0];
        if (!dailyMap[date]) {
          dailyMap[date] = { date, app_opens: 0, listen_events: 0, listen_hours: 0 };
        }
        if (item.event_type === 'app_open') {
          dailyMap[date].app_opens++;
        }
        if (item.event_type === 'listen_duration') {
          dailyMap[date].listen_events++;
          dailyMap[date].listen_hours += (item.duration_seconds || 0) / 3600;
        }
      }
      setDaily(Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date)));
    } catch (err) {
      console.error('Stats fetch error:', err);
    }

    setLoading(false);
  };

  const maxOpens = Math.max(...daily.map(d => d.app_opens), 1);
  const maxListens = Math.max(...daily.map(d => d.listen_events), 1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-800">
            Statistik Pendengar
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Data penggunaan aplikasi Radio Mass FM
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              if (!confirm('Reset SEMUA data statistik pendengar? Data yang dihapus tidak bisa dikembalikan.')) return;
              try {
                const { error } = await supabase.from('listener_stats').delete().neq('id', 0);
                if (error) throw error;
                alert('Data statistik berhasil direset!');
                fetchStats();
              } catch (err) {
                alert('Gagal mereset: ' + (err as Error).message);
              }
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
          >
            Reset Data
          </button>
          <button
            onClick={() => setPeriod(7)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              period === 7 ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            7 Hari
          </button>
          <button
            onClick={() => setPeriod(30)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              period === 30 ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            30 Hari
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Memuat statistik...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <SummaryCard label="Total App Opens" value={summary.total_app_opens.toLocaleString()} icon="📱" color="purple" />
            <SummaryCard label="Perangkat Terdaftar" value={summary.total_fcm_tokens.toLocaleString()} icon="👥" color="blue" />
            <SummaryCard label="Total Jam Dengar" value={`${summary.total_listen_hours}h`} icon="🎧" color="orange" />
            <SummaryCard label="App Opens Hari Ini" value={summary.today_app_opens.toLocaleString()} icon="📊" color="green" />
            <SummaryCard label="Pendengar Hari Ini" value={summary.today_listeners.toLocaleString()} icon="🔊" color="red" />
            <SummaryCard label="Total Sesi Dengar" value={summary.total_listen_events.toLocaleString()} icon="🎵" color="indigo" />
          </div>

          {/* Daily Chart: App Opens */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h2 className="text-lg font-bold text-slate-700 mb-4">
              App Opens ({period} hari terakhir)
            </h2>
            {daily.length === 0 ? (
              <p className="text-center py-8 text-slate-400 text-sm">Belum ada data</p>
            ) : (
              <div className="flex items-end gap-1 h-40">
                {daily.map((d) => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-slate-400 font-bold">
                      {d.app_opens}
                    </span>
                    <div
                      className="w-full bg-purple-400 rounded-t-md transition-all"
                      style={{ height: `${(d.app_opens / maxOpens) * 120}px`, minHeight: '2px' }}
                    />
                    <span className="text-[8px] text-slate-400 -rotate-45 origin-top-left whitespace-nowrap mt-1">
                      {new Date(d.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Daily Chart: Listen Events */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h2 className="text-lg font-bold text-slate-700 mb-4">
              Sesi Mendengarkan ({period} hari terakhir)
            </h2>
            {daily.length === 0 ? (
              <p className="text-center py-8 text-slate-400 text-sm">Belum ada data</p>
            ) : (
              <div className="flex items-end gap-1 h-40">
                {daily.map((d) => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-slate-400 font-bold">
                      {d.listen_events}
                    </span>
                    <div
                      className="w-full bg-orange-400 rounded-t-md transition-all"
                      style={{ height: `${(d.listen_events / maxListens) * 120}px`, minHeight: '2px' }}
                    />
                    <span className="text-[8px] text-slate-400 -rotate-45 origin-top-left whitespace-nowrap mt-1">
                      {new Date(d.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Card component
function SummaryCard({ label, value, icon, color }: {
  label: string; value: string; icon: string; color: string;
}) {
  const bgColors: Record<string, string> = {
    purple: 'bg-purple-50', blue: 'bg-blue-50', orange: 'bg-orange-50',
    green: 'bg-green-50', red: 'bg-red-50', indigo: 'bg-indigo-50',
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${bgColors[color]} rounded-xl flex items-center justify-center text-lg`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
          <p className="text-[11px] text-slate-400 font-medium">{label}</p>
        </div>
      </div>
    </div>
  );
}
