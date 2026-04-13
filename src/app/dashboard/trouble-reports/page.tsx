'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, CheckCircle, Clock, MessageSquare, Search, Filter } from 'lucide-react';

interface TroubleReport {
  id: number;
  category: string;
  description: string;
  contact_name: string;
  contact_phone: string;
  status: 'pending' | 'in_progress' | 'resolved';
  admin_note: string | null;
  created_at: string;
}

export default function TroubleReportsPage() {
  const [reports, setReports] = useState<TroubleReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => { fetchReports(); }, []);

  async function fetchReports() {
    setLoading(true);
    const { data } = await supabase
      .from('trouble_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    setReports(data || []);
    setLoading(false);
  }

  async function updateStatus(id: number, status: string) {
    setUpdatingId(id);
    await supabase.from('trouble_reports').update({ status } as any).eq('id', id);
    await fetchReports();
    setUpdatingId(null);
  }

  async function saveAdminNote(id: number) {
    await supabase.from('trouble_reports').update({ admin_note: adminNote } as any).eq('id', id);
    setEditingId(null);
    setAdminNote('');
    await fetchReports();
  }

  const filtered = reports.filter(r => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.description.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        (r.contact_name || '').toLowerCase().includes(q);
    }
    return true;
  });

  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    inProgress: reports.filter(r => r.status === 'in_progress').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
  };

  const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
    pending: { label: 'Menunggu', color: 'text-amber-600', bgColor: 'bg-amber-50 border-amber-200', icon: Clock },
    in_progress: { label: 'Diproses', color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200', icon: AlertTriangle },
    resolved: { label: 'Selesai', color: 'text-green-600', bgColor: 'bg-green-50 border-green-200', icon: CheckCircle },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Laporan Gangguan Radio</h1>
        <p className="text-slate-500 text-sm mt-1">Kelola laporan trouble/gangguan dari pendengar</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Laporan', value: stats.total, color: 'text-slate-700', bg: 'bg-slate-50' },
          { label: 'Menunggu', value: stats.pending, color: 'text-amber-700', bg: 'bg-amber-50' },
          { label: 'Diproses', value: stats.inProgress, color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'Selesai', value: stats.resolved, color: 'text-green-700', bg: 'bg-green-50' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl p-4 border`}>
            <p className="text-xs font-medium text-slate-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter & Search */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari laporan..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'Semua' },
            { key: 'pending', label: 'Menunggu' },
            { key: 'in_progress', label: 'Diproses' },
            { key: 'resolved', label: 'Selesai' },
          ].map(f => (
            <button key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === f.key 
                  ? 'bg-primary text-white shadow-md' 
                  : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">Memuat data...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <AlertTriangle size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-400">Tidak ada laporan</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((report) => {
            const config = statusConfig[report.status] || statusConfig.pending;
            const StatusIcon = config.icon;
            return (
              <div key={report.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl ${config.bgColor} border`}>
                    <StatusIcon size={18} className={config.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-[11px] font-bold text-slate-600">
                        {report.category}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-lg border text-[11px] font-bold ${config.bgColor} ${config.color}`}>
                        {config.label}
                      </span>
                      <span className="text-xs text-slate-400 ml-auto">
                        {new Date(report.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 mt-2">{report.description}</p>
                    {(report.contact_name || report.contact_phone) && (
                      <p className="text-xs text-slate-400 mt-2">
                        👤 {report.contact_name || 'Anonim'} {report.contact_phone && `• ${report.contact_phone}`}
                      </p>
                    )}
                    {report.admin_note && (
                      <div className="mt-3 bg-green-50 rounded-xl p-3 border border-green-100">
                        <p className="text-xs font-bold text-green-700 mb-1">💬 Catatan Admin:</p>
                        <p className="text-sm text-green-700">{report.admin_note}</p>
                      </div>
                    )}

                    {/* Edit admin note */}
                    {editingId === report.id && (
                      <div className="mt-3 flex gap-2">
                        <input
                          value={adminNote}
                          onChange={(e) => setAdminNote(e.target.value)}
                          placeholder="Tulis catatan admin..."
                          className="flex-1 px-3 py-2 rounded-xl border text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        />
                        <button onClick={() => saveAdminNote(report.id)}
                          className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90">
                          Simpan
                        </button>
                        <button onClick={() => { setEditingId(null); setAdminNote(''); }}
                          className="px-3 py-2 bg-slate-100 text-slate-500 rounded-xl text-sm">
                          Batal
                        </button>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      {report.status !== 'in_progress' && (
                        <button onClick={() => updateStatus(report.id, 'in_progress')}
                          disabled={updatingId === report.id}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 disabled:opacity-50">
                          Proses
                        </button>
                      )}
                      {report.status !== 'resolved' && (
                        <button onClick={() => updateStatus(report.id, 'resolved')}
                          disabled={updatingId === report.id}
                          className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-medium hover:bg-green-100 disabled:opacity-50">
                          Selesai
                        </button>
                      )}
                      <button onClick={() => { setEditingId(report.id); setAdminNote(report.admin_note || ''); }}
                        className="px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-100">
                        <MessageSquare size={12} className="inline mr-1" /> Catatan
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
