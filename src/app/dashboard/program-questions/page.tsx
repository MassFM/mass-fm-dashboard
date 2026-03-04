'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ProgramQuestion } from '@/types/database';
import { MessageSquareText, Search, Filter, Send, Mic, Archive, Clock, CheckCircle2, RefreshCw } from 'lucide-react';

export default function ProgramQuestionsPage() {
  const [questions, setQuestions] = useState<ProgramQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRecording, setFilterRecording] = useState(false);
  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchQuestions();
    const channel = supabase
      .channel('program_questions_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'program_questions' }, () => {
        fetchQuestions();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchQuestions = async () => {
    const { data, error } = await supabase
      .from('program_questions')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setQuestions(data);
    setLoading(false);
  };

  const handleReply = async (id: number) => {
    if (!replyText.trim()) return;
    setIsSubmitting(true);
    const { error } = await supabase
      .from('program_questions')
      // @ts-expect-error - untyped table
      .update({ admin_reply: replyText.trim(), status: 'answered' })
      .eq('id', id);
    if (!error) {
      setReplyingId(null);
      setReplyText('');
      fetchQuestions();
    }
    setIsSubmitting(false);
  };

  const handleStatusChange = async (id: number, status: string) => {
    // @ts-expect-error - untyped table
    await supabase.from('program_questions').update({ status }).eq('id', id);
    fetchQuestions();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus pertanyaan ini?')) return;
    await supabase.from('program_questions').delete().eq('id', id);
    fetchQuestions();
  };

  const filtered = questions.filter((q) => {
    const matchSearch =
      q.program_name.toLowerCase().includes(search.toLowerCase()) ||
      q.sender_name.toLowerCase().includes(search.toLowerCase()) ||
      q.question.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || q.status === filterStatus;
    const matchRecording = !filterRecording || q.is_recording_request;
    return matchSearch && matchStatus && matchRecording;
  });

  const stats = {
    total: questions.length,
    pending: questions.filter((q) => q.status === 'pending').length,
    answered: questions.filter((q) => q.status === 'answered').length,
    recording: questions.filter((q) => q.is_recording_request).length,
  };

  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    pending: { label: 'Menunggu', color: 'bg-amber-100 text-amber-700', icon: <Clock size={14} /> },
    answered: { label: 'Dijawab', color: 'bg-green-100 text-green-700', icon: <CheckCircle2 size={14} /> },
    archived: { label: 'Diarsipkan', color: 'bg-slate-100 text-slate-500', icon: <Archive size={14} /> },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pertanyaan Program</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola pertanyaan & catatan pendengar per program siaran</p>
        </div>
        <button onClick={fetchQuestions} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm hover:bg-slate-50 transition-colors">
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <p className="text-sm text-slate-500">Total Pertanyaan</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{stats.total}</p>
        </div>
        <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
          <p className="text-sm text-amber-600">Menunggu Jawaban</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-green-50 rounded-2xl p-5 border border-green-100">
          <p className="text-sm text-green-600">Sudah Dijawab</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{stats.answered}</p>
        </div>
        <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
          <p className="text-sm text-blue-600">Request Rekaman</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{stats.recording}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari pertanyaan, program, pengirim..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none"
        >
          <option value="all">Semua Status</option>
          <option value="pending">Menunggu</option>
          <option value="answered">Dijawab</option>
          <option value="archived">Diarsipkan</option>
        </select>
        <button
          onClick={() => setFilterRecording(!filterRecording)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border transition-colors ${
            filterRecording ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600'
          }`}
        >
          <Mic size={16} />
          Request Rekaman
        </button>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">Memuat...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <MessageSquareText size={48} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-400">Belum ada pertanyaan</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => {
            const cfg = statusConfig[q.status || 'pending'];
            return (
              <div key={q.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                        {q.program_name}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${cfg.color}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                      {q.is_recording_request && (
                        <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
                          <Mic size={12} /> Minta Rekaman
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {q.created_at ? new Date(q.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                    </span>
                  </div>

                  {/* Sender & Question */}
                  <div className="mb-3">
                    <p className="text-xs text-slate-400 mb-1">Dari: <span className="font-medium text-slate-600">{q.sender_name || 'Anonim'}</span></p>
                    <p className="text-sm text-slate-700 leading-relaxed">{q.question}</p>
                  </div>

                  {/* Admin Reply (if answered) */}
                  {q.admin_reply && (
                    <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-3">
                      <p className="text-xs text-green-600 font-semibold mb-1">Balasan Admin:</p>
                      <p className="text-sm text-green-800">{q.admin_reply}</p>
                    </div>
                  )}

                  {/* Reply Form */}
                  {replyingId === q.id && (
                    <div className="bg-slate-50 rounded-xl p-3 mb-3 border border-slate-200">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Tulis balasan untuk pertanyaan ini..."
                        className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm resize-none h-24 outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={() => { setReplyingId(null); setReplyText(''); }}
                          className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                        >
                          Batal
                        </button>
                        <button
                          onClick={() => handleReply(q.id!)}
                          disabled={isSubmitting || !replyText.trim()}
                          className="px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-1"
                        >
                          <Send size={12} />
                          {isSubmitting ? 'Mengirim...' : 'Kirim Balasan'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                    {q.status !== 'answered' && replyingId !== q.id && (
                      <button
                        onClick={() => { setReplyingId(q.id!); setReplyText(q.admin_reply || ''); }}
                        className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors flex items-center gap-1"
                      >
                        <Send size={12} /> Balas
                      </button>
                    )}
                    {q.status === 'answered' && (
                      <button
                        onClick={() => { setReplyingId(q.id!); setReplyText(q.admin_reply || ''); }}
                        className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors"
                      >
                        Edit Balasan
                      </button>
                    )}
                    {q.status !== 'archived' && (
                      <button
                        onClick={() => handleStatusChange(q.id!, 'archived')}
                        className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors flex items-center gap-1"
                      >
                        <Archive size={12} /> Arsipkan
                      </button>
                    )}
                    {q.status === 'archived' && (
                      <button
                        onClick={() => handleStatusChange(q.id!, 'pending')}
                        className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-200 transition-colors"
                      >
                        Buka Kembali
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(q.id!)}
                      className="px-3 py-1.5 text-red-400 rounded-lg text-xs font-medium hover:bg-red-50 hover:text-red-600 transition-colors ml-auto"
                    >
                      Hapus
                    </button>
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
