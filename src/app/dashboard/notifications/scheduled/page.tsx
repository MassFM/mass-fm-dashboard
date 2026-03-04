'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { CalendarClock, Plus, Edit2, Trash2, Send, X, Clock, CheckCircle2, Ban, RefreshCw } from 'lucide-react';

interface ScheduledNotification {
  id?: number;
  title: string;
  body: string;
  topic: string;
  scheduled_at: string;
  status: 'pending' | 'sent' | 'cancelled';
  repeat_type: 'none' | 'daily' | 'weekly';
  created_at?: string;
  sent_at?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  pending: { label: 'Menunggu', color: 'text-orange-600', bg: 'bg-orange-50', icon: Clock },
  sent: { label: 'Terkirim', color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle2 },
  cancelled: { label: 'Dibatalkan', color: 'text-slate-400', bg: 'bg-slate-50', icon: Ban },
};

export default function ScheduledNotificationsPage() {
  const [items, setItems] = useState<ScheduledNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Form state
  const [form, setForm] = useState<ScheduledNotification>({
    title: '', body: '', topic: 'all_users',
    scheduled_at: '', status: 'pending', repeat_type: 'none',
  });

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .order('scheduled_at', { ascending: true });
    setItems(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const resetForm = () => {
    setForm({ title: '', body: '', topic: 'all_users', scheduled_at: '', status: 'pending', repeat_type: 'none' });
    setEditId(null);
  };

  const openAdd = () => {
    resetForm();
    // Set default to 1 hour from now
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    const localISO = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setForm(prev => ({ ...prev, scheduled_at: localISO }));
    setShowModal(true);
  };

  const openEdit = (item: ScheduledNotification) => {
    const localDt = item.scheduled_at
      ? new Date(new Date(item.scheduled_at).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
      : '';
    setForm({ ...item, scheduled_at: localDt });
    setEditId(item.id || null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.body.trim() || !form.scheduled_at) {
      return alert('Judul, isi pesan, dan waktu kirim wajib diisi');
    }
    const scheduledUtc = new Date(form.scheduled_at).toISOString();
    const payload = {
      title: form.title.trim(),
      body: form.body.trim(),
      topic: form.topic,
      scheduled_at: scheduledUtc,
      status: form.status,
      repeat_type: form.repeat_type,
    };

    if (editId) {
      await supabase.from('scheduled_notifications').update(payload as any).eq('id', editId);
    } else {
      await supabase.from('scheduled_notifications').insert(payload as any);
    }
    setShowModal(false);
    resetForm();
    fetchItems();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus notifikasi terjadwal ini?')) return;
    await supabase.from('scheduled_notifications').delete().eq('id', id);
    fetchItems();
  };

  const handleCancel = async (id: number) => {
    await supabase.from('scheduled_notifications').update({ status: 'cancelled' } as any).eq('id', id);
    fetchItems();
  };

  const handleSendNow = async (item: ScheduledNotification) => {
    if (!confirm(`Kirim notifikasi "${item.title}" sekarang?`)) return;
    try {
      const { error } = await supabase.functions.invoke('send-notification', {
        body: { title: item.title, message: item.body, topic: item.topic },
      });
      if (error) throw error;

      // Log ke riwayat notifikasi
      await supabase.from('notifications').insert({
        title: item.title, body: item.body, topic: item.topic,
      } as any);

      // Update status
      await supabase.from('scheduled_notifications')
        .update({ status: 'sent', sent_at: new Date().toISOString() } as any)
        .eq('id', item.id!);

      alert('Notifikasi berhasil dikirim!');
      fetchItems();
    } catch (err) {
      console.error('Send error:', err);
      alert('Gagal mengirim notifikasi');
    }
  };

  // Filter
  const filtered = items.filter(item => filterStatus === 'all' || item.status === filterStatus);

  // Stats
  const pendingCount = items.filter(i => i.status === 'pending').length;
  const sentCount = items.filter(i => i.status === 'sent').length;
  const cancelledCount = items.filter(i => i.status === 'cancelled').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-900 rounded-xl flex items-center justify-center">
              <CalendarClock className="text-white" size={20} />
            </div>
            Notifikasi Terjadwal
          </h1>
          <p className="text-slate-400 text-sm mt-1">Jadwalkan notifikasi untuk dikirim di waktu tertentu</p>
        </div>
        <button onClick={openAdd}
          className="bg-gradient-to-r from-primary to-purple-900 text-white px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition shadow-lg shadow-primary/20">
          <Plus size={16} /> Jadwalkan Baru
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-50 cursor-pointer hover:shadow-md transition" onClick={() => setFilterStatus('all')}>
          <p className="text-2xl font-bold text-primary">{items.length}</p>
          <p className="text-xs text-slate-400">Total</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-50 cursor-pointer hover:shadow-md transition" onClick={() => setFilterStatus('pending')}>
          <p className="text-2xl font-bold text-orange-500">{pendingCount}</p>
          <p className="text-xs text-slate-400">Menunggu</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-50 cursor-pointer hover:shadow-md transition" onClick={() => setFilterStatus('sent')}>
          <p className="text-2xl font-bold text-green-500">{sentCount}</p>
          <p className="text-xs text-slate-400">Terkirim</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-50 cursor-pointer hover:shadow-md transition" onClick={() => setFilterStatus('cancelled')}>
          <p className="text-2xl font-bold text-slate-300">{cancelledCount}</p>
          <p className="text-xs text-slate-400">Dibatalkan</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['all', 'pending', 'sent', 'cancelled'].map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${filterStatus === s ? 'bg-primary text-white shadow' : 'bg-white text-slate-400 hover:bg-slate-50'}`}>
            {s === 'all' ? 'Semua' : STATUS_CONFIG[s]?.label || s}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-20 text-slate-300">Memuat...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-300">
          {filterStatus === 'all' ? 'Belum ada notifikasi terjadwal' : `Tidak ada notifikasi dengan status "${STATUS_CONFIG[filterStatus]?.label || filterStatus}"`}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
            const StatusIcon = cfg.icon;
            const scheduledDate = new Date(item.scheduled_at);
            const isPast = scheduledDate < new Date() && item.status === 'pending';

            return (
              <div key={item.id} className={`bg-white rounded-2xl p-5 border transition hover:shadow-md ${isPast ? 'border-red-200 bg-red-50/30' : 'border-slate-50'}`}>
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                    <StatusIcon size={18} className={cfg.color} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-slate-700">{item.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      {item.repeat_type !== 'none' && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-500 text-[10px] font-semibold rounded-full flex items-center gap-1">
                          <RefreshCw size={8} /> {item.repeat_type === 'daily' ? 'Harian' : 'Mingguan'}
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-500 text-[10px] font-semibold rounded-full">
                        {item.topic}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.body}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <CalendarClock size={12} />
                        {scheduledDate.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        {' '}{scheduledDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </span>
                      {isPast && (
                        <span className="text-[10px] text-red-500 font-bold">⚠️ Waktu sudah lewat!</span>
                      )}
                      {item.sent_at && (
                        <span className="text-[10px] text-green-500">
                          Terkirim: {new Date(item.sent_at).toLocaleString('id-ID')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {item.status === 'pending' && (
                      <>
                        <button onClick={() => handleSendNow(item)}
                          className="p-2 rounded-lg hover:bg-green-50 text-green-500" title="Kirim Sekarang">
                          <Send size={16} />
                        </button>
                        <button onClick={() => handleCancel(item.id!)}
                          className="p-2 rounded-lg hover:bg-slate-100 text-slate-400" title="Batalkan">
                          <Ban size={16} />
                        </button>
                      </>
                    )}
                    <button onClick={() => openEdit(item)}
                      className="p-2 rounded-lg hover:bg-blue-50 text-blue-500" title="Edit">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(item.id!)}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-400" title="Hapus">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
        <h3 className="text-sm font-bold text-blue-700 mb-2">ℹ️ Cara Kerja</h3>
        <ul className="text-xs text-blue-600 space-y-1 list-disc list-inside">
          <li>Buat notifikasi dengan waktu kirim yang diinginkan</li>
          <li>Sistem akan otomatis mengirim notifikasi saat waktunya tiba (via cron setiap menit)</li>
          <li>Gunakan <strong>Kirim Sekarang</strong> untuk mengirim langsung tanpa menunggu jadwal</li>
          <li>Notifikasi dengan pengulangan (harian/mingguan) akan otomatis dijadwalkan ulang setelah terkirim</li>
          <li>Status <strong>Dibatalkan</strong> tidak akan dikirim oleh cron</li>
        </ul>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-slate-700">
                {editId ? 'Edit Notifikasi Terjadwal' : 'Jadwalkan Notifikasi Baru'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Judul */}
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Judul Notifikasi *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Contoh: Jangan lewatkan kajian sore ini!" 
                  className="w-full px-4 py-3 rounded-xl border border-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>

              {/* Isi Pesan */}
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Isi Pesan *</label>
                <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="Tulis isi notifikasi..." rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
              </div>

              {/* Waktu Kirim */}
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Waktu Kirim *</label>
                <input type="datetime-local" value={form.scheduled_at}
                  onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Topik */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Topik</label>
                  <select value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white">
                    <option value="all_users">Semua Pengguna</option>
                    <option value="jadwal_update">Update Jadwal</option>
                    <option value="kajian_baru">Kajian Baru</option>
                  </select>
                </div>

                {/* Pengulangan */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Pengulangan</label>
                  <select value={form.repeat_type} onChange={(e) => setForm({ ...form, repeat_type: e.target.value as any })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white">
                    <option value="none">Tidak berulang</option>
                    <option value="daily">Harian</option>
                    <option value="weekly">Mingguan</option>
                  </select>
                </div>
              </div>

              {/* Status (hanya untuk edit) */}
              {editId && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white">
                    <option value="pending">Menunggu</option>
                    <option value="sent">Terkirim</option>
                    <option value="cancelled">Dibatalkan</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-slate-50">Batal</button>
              <button onClick={handleSave}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary to-purple-900 text-white hover:opacity-90 shadow">
                {editId ? 'Simpan Perubahan' : 'Jadwalkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
