'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Ad, AdAnalytics } from '@/types/database';
import {
  BarChart3, Eye, MousePointer, TrendingUp,
  ArrowLeft, Calendar, Filter,
} from 'lucide-react';
import Link from 'next/link';

export default function MitraDakwahAnalyticsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [analytics, setAnalytics] = useState<AdAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdId, setSelectedAdId] = useState<string>('all');
  const [dateRange, setDateRange] = useState(30); // days

  const fetchData = useCallback(async () => {
    setLoading(true);

    // Fetch all ads
    const { data: adsData } = await supabase
      .from('ads')
      .select('id, title, client_name, image_url, package_type, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (adsData) setAds(adsData as Ad[]);

    // Fetch analytics for date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dateRange);
    const startStr = startDate.toISOString().split('T')[0];

    let query = supabase
      .from('ad_analytics')
      .select('id, ad_id, date, views, clicks, unique_views')
      .gte('date', startStr)
      .order('date', { ascending: true })
      .limit(1000);

    if (selectedAdId !== 'all') {
      query = query.eq('ad_id', selectedAdId);
    }

    const { data: analyticsData } = await query;
    if (analyticsData) setAnalytics(analyticsData as AdAnalytics[]);

    setLoading(false);
  }, [dateRange, selectedAdId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── AGGREGATE STATS ───
  const totalViews = analytics.reduce((s, a) => s + a.views, 0);
  const totalClicks = analytics.reduce((s, a) => s + a.clicks, 0);
  const totalUniqueViews = analytics.reduce((s, a) => s + a.unique_views, 0);
  const overallCTR = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : '0.00';

  // ─── DAILY DATA (for chart) ───
  const dailyData: Record<string, { views: number; clicks: number }> = {};
  analytics.forEach(a => {
    if (!dailyData[a.date]) dailyData[a.date] = { views: 0, clicks: 0 };
    dailyData[a.date].views += a.views;
    dailyData[a.date].clicks += a.clicks;
  });

  const sortedDays = Object.keys(dailyData).sort();
  const maxViews = Math.max(...sortedDays.map(d => dailyData[d].views), 1);

  // ─── PER-AD STATS ───
  const adStats: Record<string, { views: number; clicks: number; ctr: number }> = {};
  analytics.forEach(a => {
    if (!adStats[a.ad_id]) adStats[a.ad_id] = { views: 0, clicks: 0, ctr: 0 };
    adStats[a.ad_id].views += a.views;
    adStats[a.ad_id].clicks += a.clicks;
  });
  Object.keys(adStats).forEach(id => {
    adStats[id].ctr = adStats[id].views > 0
      ? (adStats[id].clicks / adStats[id].views) * 100
      : 0;
  });

  // Sort ads by views descending
  const rankedAds = ads
    .filter(a => adStats[a.id!])
    .sort((a, b) => (adStats[b.id!]?.views ?? 0) - (adStats[a.id!]?.views ?? 0));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/mitra-dakwah"
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 size={28} className="text-blue-500" />
              Analytics Iklan
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Statistik performa iklan Mitra Dakwah
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative">
            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={dateRange}
              onChange={e => setDateRange(parseInt(e.target.value))}
              className="pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm appearance-none bg-white"
            >
              <option value={7}>7 hari</option>
              <option value={14}>14 hari</option>
              <option value={30}>30 hari</option>
              <option value={60}>60 hari</option>
              <option value={90}>90 hari</option>
            </select>
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={selectedAdId}
              onChange={e => setSelectedAdId(e.target.value)}
              className="pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm appearance-none bg-white max-w-[200px]"
            >
              <option value="all">Semua Iklan</option>
              {ads.map(a => (
                <option key={a.id} value={a.id}>{a.title || a.client_name || 'Tanpa judul'}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">Memuat analytics...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Eye size={20} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{totalViews.toLocaleString()}</p>
                  <p className="text-xs text-slate-400">Total Views</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <MousePointer size={20} className="text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{totalClicks.toLocaleString()}</p>
                  <p className="text-xs text-slate-400">Total Clicks</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <TrendingUp size={20} className="text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{overallCTR}%</p>
                  <p className="text-xs text-slate-400">CTR</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Eye size={20} className="text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{totalUniqueViews.toLocaleString()}</p>
                  <p className="text-xs text-slate-400">Unique Views</p>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Chart (CSS-based bar chart) */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Views & Clicks Harian</h3>
            {sortedDays.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Belum ada data analytics</p>
            ) : (
              <div className="space-y-1">
                {sortedDays.map(day => {
                  const d = dailyData[day];
                  const viewWidth = (d.views / maxViews) * 100;
                  const clickWidth = maxViews > 0 ? (d.clicks / maxViews) * 100 : 0;
                  const dayCtr = d.views > 0 ? ((d.clicks / d.views) * 100).toFixed(1) : '0.0';

                  return (
                    <div key={day} className="flex items-center gap-3 group">
                      <span className="text-xs text-slate-400 w-20 shrink-0">
                        {new Date(day).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                      </span>
                      <div className="flex-1 relative h-6">
                        {/* Views bar */}
                        <div
                          className="absolute top-0 left-0 h-3 bg-blue-400 rounded-r-full transition-all"
                          style={{ width: `${Math.max(viewWidth, 1)}%` }}
                        />
                        {/* Clicks bar */}
                        <div
                          className="absolute bottom-0 left-0 h-3 bg-green-400 rounded-r-full transition-all"
                          style={{ width: `${Math.max(clickWidth, 0.5)}%` }}
                        />
                      </div>
                      <div className="text-xs text-slate-500 w-32 shrink-0 text-right opacity-0 group-hover:opacity-100 transition">
                        {d.views}v / {d.clicks}c ({dayCtr}%)
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-400 rounded-full" />
                    <span className="text-xs text-slate-400">Views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-400 rounded-full" />
                    <span className="text-xs text-slate-400">Clicks</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Per-Ad Ranking Table */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-700">Ranking Iklan</h3>
            </div>
            {rankedAds.length === 0 ? (
              <p className="p-8 text-center text-slate-400 text-sm">Belum ada data</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase">#</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase">Iklan</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase">Views</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase">Clicks</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase">CTR</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase">Paket</th>
                  </tr>
                </thead>
                <tbody>
                  {rankedAds.map((ad, i) => {
                    const stats = adStats[ad.id!] ?? { views: 0, clicks: 0, ctr: 0 };
                    return (
                      <tr key={ad.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="px-6 py-3 text-sm font-bold text-slate-400">{i + 1}</td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            {ad.image_url ? (
                              <img src={ad.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-100" />
                            )}
                            <div>
                              <p className="font-medium text-slate-700 text-sm">{ad.title}</p>
                              <p className="text-xs text-slate-400">{ad.client_name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-sm font-medium text-blue-600">
                          {stats.views.toLocaleString()}
                        </td>
                        <td className="px-6 py-3 text-sm font-medium text-green-600">
                          {stats.clicks.toLocaleString()}
                        </td>
                        <td className="px-6 py-3">
                          <span className={`text-sm font-bold ${
                            stats.ctr >= 5 ? 'text-green-600' :
                            stats.ctr >= 2 ? 'text-amber-600' :
                            'text-slate-500'
                          }`}>
                            {stats.ctr.toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                            ad.package_type === 'premium' ? 'bg-amber-100 text-amber-700' :
                            ad.package_type === 'featured' ? 'bg-purple-100 text-purple-700' :
                            ad.package_type === 'interstitial' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {ad.package_type}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
