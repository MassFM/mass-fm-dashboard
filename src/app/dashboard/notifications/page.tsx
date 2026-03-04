'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Pencil, Trash2, Send, X } from 'lucide-react';

interface NotificationHistory {
  id: number;
  title: string;
  body: string;
  topic: string;
  created_at: string;
}

export default function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [topic, setTopic] = useState('all_users');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    setHistory(data || []);
    setHistoryLoading(false);
  };

  const sendNotification = async () => {
    if (!title.trim() || !body.trim()) return;
    setLoading(true);
    try {
      await supabase.from('notifications').insert({
        title: title.trim(), body: body.trim(), topic,
      });
      const { error } = await supabase.functions.invoke('send-notification', {
        body: { title: title.trim(), message: body.trim(), topic },
      });
      if (error) throw error;
      alert('Notifikasi berhasil dikirim!');
      setTitle(''); setBody('');
      fetchHistory();
    } catch (err) {
      console.error('Gagal kirim notifikasi:', err);
      alert('Notifikasi tersimpan. Periksa Edge Function jika pengiriman gagal.');
      fetchHistory();
    } finally { setLoading(false); }
  };

  const startEdit = (item: NotificationHistory) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditBody(item.body);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditBody('');
  };

  const saveEdit = async () => {
    if (!editingId || !editTitle.trim() || !editBody.trim()) return;
    const { error } = await supabase
      .from('notifications')
      .update({ title: editTitle.trim(), body: editBody.trim() })
      .eq('id', editingId);
    if (!error) {
      cancelEdit();
      fetchHistory();
    } else {
      alert('Gagal menyimpan perubahan');
    }
  };

  const deleteNotification = async (id: number) => {
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (!error) {
      setDeletingId(null);
      fetchHistory();
    } else {
      alert('Gagal menghapus notifikasi');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-800">Push Notification</h1>
        <p className="text-sm text-slate-400 mt-1">Kirim notifikasi ke semua pengguna aplikasi</p>
      </div>

      {/* Form Kirim */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Topik</label>
            <select value={topic} onChange={(e) => setTopic(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none">
              <option value="all_users">Semua Pengguna</option>
              <option value="jadwal_update">Update Jadwal</option>
              <option value="kajian_baru">Kajian Baru</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Judul Notifikasi</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Jadwal Kajian Hari Ini"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Isi Pesan</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)}
              placeholder="Tulis pesan notifikasi..." rows={3}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none resize-none" />
          </div>
          <button onClick={sendNotification} disabled={loading || !title.trim() || !body.trim()}
            className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            <Send size={16} />
            {loading ? 'Mengirim...' : 'Kirim Notifikasi'}
          </button>
        </div>
      </div>

      {/* Riwayat */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h2 className="text-lg font-bold text-slate-700 mb-4">Riwayat Notifikasi</h2>
        {historyLoading ? (
          <div className="text-center py-8 text-slate-400">Memuat...</div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-slate-400">Belum ada notifikasi yang dikirim</div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div key={item.id} className="p-4 bg-slate-50 rounded-xl">
                {deletingId === item.id ? (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-red-600 font-medium">Hapus notifikasi ini?</p>
                    <div className="flex gap-2">
                      <button onClick={() => setDeletingId(null)}
                        className="px-3 py-1.5 text-xs bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300">Batal</button>
                      <button onClick={() => deleteNotification(item.id)}
                        className="px-3 py-1.5 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600">Ya, Hapus</button>
                    </div>
                  </div>
                ) : editingId === item.id ? (
                  <div className="space-y-3">
                    <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-200 outline-none" placeholder="Judul" />
                    <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={2}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-200 outline-none resize-none" placeholder="Isi pesan" />
                    <div className="flex gap-2 justify-end">
                      <button onClick={cancelEdit}
                        className="px-3 py-1.5 text-xs bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 flex items-center gap-1">
                        <X size={12} /> Batal
                      </button>
                      <button onClick={saveEdit}
                        className="px-3 py-1.5 text-xs bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-1">
                        <Pencil size={12} /> Simpan
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-sm">🔔</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-700">{item.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.body}</p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full font-medium">{item.topic}</span>
                        <span className="text-[10px] text-slate-400">{new Date(item.created_at).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => startEdit(item)}
                        className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeletingId(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
