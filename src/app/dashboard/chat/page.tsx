'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MessageCircle, Trash2, Pin, PinOff, RefreshCw } from 'lucide-react';

interface ChatMsg {
  id: number;
  sender_name: string;
  message: string;
  is_pinned: boolean;
  created_at: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    setMessages((data as ChatMsg[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();
    // Realtime subscription DIHAPUS untuk menghemat egress bandwidth
    // Sebelumnya setiap event di tabel memicu fetchMessages() yang menarik semua data
    // User bisa klik tombol Refresh untuk memuat pesan baru
  }, []);

  const deleteMsg = async (id: number) => {
    const { error } = await supabase.from('chat_messages').delete().eq('id', id);
    if (error) {
      alert(`Gagal menghapus pesan: ${error.message}`);
      return;
    }
    fetchMessages();
  };

  const togglePin = async (id: number, current: boolean) => {
    await supabase.from('chat_messages').update({ is_pinned: !current }).eq('id', id);
    fetchMessages();
  };

  const clearAll = async () => {
    if (!confirm('Hapus semua pesan chat? Tindakan ini tidak bisa dibatalkan.')) return;
    const { error } = await supabase.from('chat_messages').delete().gt('id', 0);
    if (error) {
      alert(`Gagal menghapus semua pesan: ${error.message}\n\nJika terkendala RLS, jalankan SQL berikut di Supabase:\nCREATE POLICY "Authenticated can delete chat_messages" ON chat_messages FOR DELETE TO authenticated USING (true);`);
      return;
    }
    fetchMessages();
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center text-pink-600">
            <MessageCircle size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Live Chat</h1>
            <p className="text-sm text-slate-400">Moderasi shoutbox pendengar ({messages.length} pesan)</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchMessages} className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-medium hover:bg-slate-50">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={clearAll} className="flex items-center gap-2 bg-red-50 text-red-500 px-3 py-2 rounded-xl text-xs font-bold hover:bg-red-100">
            <Trash2 size={14} /> Hapus Semua
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Memuat pesan...</div>
      ) : messages.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-100">
          <MessageCircle size={40} className="mx-auto text-slate-200 mb-3" />
          <p className="text-slate-400 text-sm">Belum ada pesan chat</p>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map((msg) => (
            <div key={msg.id} className={`bg-white rounded-xl border px-5 py-3 flex items-start gap-3 ${msg.is_pinned ? 'border-amber-200 bg-amber-50/50' : 'border-slate-100'}`}>
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs flex-shrink-0 mt-0.5">
                {msg.sender_name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-700">{msg.sender_name}</span>
                  <span className="text-[10px] text-slate-400">{formatTime(msg.created_at)}</span>
                  {msg.is_pinned && <span className="text-[9px] font-bold text-amber-500 bg-amber-100 px-1.5 py-0.5 rounded">PIN</span>}
                </div>
                <p className="text-sm text-slate-600 mt-0.5">{msg.message}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => togglePin(msg.id, msg.is_pinned)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400" title={msg.is_pinned ? 'Unpin' : 'Pin'}>
                  {msg.is_pinned ? <PinOff size={14} /> : <Pin size={14} />}
                </button>
                <button onClick={() => deleteMsg(msg.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400" title="Hapus">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
