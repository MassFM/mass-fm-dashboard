'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MessageSquarePlus, Download, Filter, Search } from 'lucide-react';
import Link from 'next/link';

interface ListenerRequest {
  id: string;
  created_at: string;
  request_type: 'PROGRAM' | 'KAJIAN' | 'MUROTAL' | 'LAINNYA';
  user_name: string;
  user_phone?: string;
  user_location?: string;
  title_request: string;
  detail_info?: string;
  preferred_time?: string;
  status: 'pending' | 'approved' | 'processed' | 'played' | 'rejected';
}

export default function ListenerRequests() {
  // const supabase = supabase;
  const [requests, setRequests] = useState<ListenerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRequests();

    // Realtime subscription
    const channel = supabase
      .channel('listener_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listener_requests' }, (payload) => {
        fetchRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRequests = async () => {
    let query = supabase
      .from('listener_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (filterStatus !== 'all') {
      query = query.eq('status', filterStatus);
    }

    const { data, error } = await query;
    if (error) console.error('Error fetching requests:', error);
    else setRequests(data || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, newStatus: ListenerRequest['status']) => {
    const { error } = await supabase.from('listener_requests').update({ status: newStatus }).eq('id', id);
    if (error) console.error('Error updating status:', error);
    else fetchRequests(); // Refresh
  };

  const filteredRequests = requests.filter((r) => {
    const matchesSearch = r.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.title_request.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.detail_info?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && (filterStatus === 'all' || r.status === filterStatus);
  });

const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    processed: 'bg-blue-100 text-blue-800',
    played: 'bg-purple-100 text-purple-800',
    rejected: 'bg-red-100 text-red-800',
  } as const;

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <MessageSquarePlus className="w-8 h-8 text-primary" />
        <div>
  <h1 className="text-xl font-bold text-slate-800 leading-tight">Request Pendengar</h1>
          <p className="text-slate-500">Kelola request program, kajian, murottal dari pendengar aplikasi</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-slate-700 mb-2">Filter Status</label>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Disetujui</option>
            <option value="processed">Diproses</option>
            <option value="played">Diputar</option>
            <option value="rejected">Ditolak</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-slate-700 mb-2">Cari</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Nama atau judul request..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
        <button
          onClick={fetchRequests}
          className="px-6 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-2 text-slate-700 font-medium"
        >
          <Filter className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 text-white p-6 rounded-2xl shadow-lg">
          <div className="text-sm opacity-90">Pending</div>
  <div className="text-lg font-bold mt-1">{requests.filter(r => r.status === 'pending').length}</div>
        </div>
        <div className="bg-gradient-to-br from-green-400 to-green-500 text-white p-6 rounded-2xl shadow-lg">
          <div className="text-sm opacity-90">Disetujui</div>
          <div className="text-lg font-bold mt-1">{requests.filter(r => r.status === 'approved').length}</div>
        </div>
        <div className="bg-gradient-to-br from-blue-400 to-blue-600 text-white p-6 rounded-2xl shadow-lg">
          <div className="text-sm opacity-90">Diproses</div>
          <div className="text-lg font-bold mt-1">{requests.filter(r => r.status === 'processed').length}</div>
        </div>
        <div className="bg-gradient-to-br from-red-400 to-red-500 text-white p-6 rounded-2xl shadow-lg">
          <div className="text-sm opacity-90">Ditolak</div>
          <div className="text-lg font-bold mt-1">{requests.filter(r => r.status === 'rejected').length}</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tipe</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Pengirim</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Judul</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Detail</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Waktu</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {request.request_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {request.user_name}
                    {request.user_phone && <div className="text-xs text-blue-500">{request.user_phone}</div>}
                    {request.user_location && <div className="text-xs text-slate-500">{request.user_location}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold">{request.title_request}</div>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    {request.detail_info ? (
                      <div className="text-sm text-slate-700 line-clamp-2 whitespace-pre-line">{request.detail_info}</div>
                    ) : (
                      <span className="text-slate-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(request.created_at).toLocaleDateString('id-ID', { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${statusColors[request.status as keyof typeof statusColors]}`}>
                      {request.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <select 
                        value={request.status}
                        onChange={(e) => updateStatus(request.id, e.target.value as ListenerRequest['status'])}
                        className="px-3 py-1 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Disetujui</option>
                        <option value="processed">Diproses</option>
                        <option value="rejected">Ditolak</option>
                      </select>
                      <button 
                        onClick={() => navigator.clipboard.writeText(JSON.stringify(request, null, 2))}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                        title="Copy JSON"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredRequests.length === 0 && (
          <div className="text-center py-12">
            <MessageSquarePlus className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Belum ada request</h3>
            <p className="text-slate-500">Request dari pendengar akan muncul di sini secara real-time</p>
          </div>
        )}
      </div>

      <div className="text-xs text-slate-400 text-center">
        Total: {filteredRequests.length} request {filterStatus !== 'all' && `(${filterStatus})`}
      </div>
    </div>
  );
}

