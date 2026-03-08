'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { ProgramQuestion } from '@/types/database';
import { MessageSquareText, Search, Filter, Send, Mic, Archive, Clock, CheckCircle2, RefreshCw, Upload, Calendar, User, Radio, Link2 } from 'lucide-react';

export default function ProgramQuestionsPage() {
  const [questions, setQuestions] = useState<ProgramQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRecording, setFilterRecording] = useState(false);
  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [recordingUrl, setRecordingUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      .update({ admin_reply: replyText.trim(), status: 'answered' } as any)
      .eq('id', id);
    if (!error) {
      setReplyingId(null);
      setReplyText('');
      fetchQuestions();
    }
    setIsSubmitting(false);
  };

  const handleStatusChange = async (id: number, status: string) => {
    await supabase.from('program_questions').update({ status } as any).eq('id', id);
    fetchQuestions();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus pertanyaan ini?')) return;
    await supabase.from('program_questions').delete().eq('id', id);
    fetchQuestions();
  };

  const handleUploadRecording = async (id: number) => {
    if (!fileInputRef.current?.files?.length) return;
    setIsSubmitting(true);
    const file = fileInputRef.current.files[0];
    const fileName = `recordings/${id}_${Date.now()}_${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('program-recordings')
      .upload(fileName, file, { upsert: true });
    
    if (!error && data) {
      const { data: urlData } = supabase.storage
        .from('program-recordings')
        .getPublicUrl(fileName);
      
      await supabase.from('program_questions')
        .update({ recording_url: urlData.publicUrl, status: 'answered' } as any)
        .eq('id', id);
      
      setUploadingId(null);
      fetchQuestions();
    } else {
      alert('Gagal upload: ' + (error?.message || 'Unknown error'));
    }
    setIsSubmitting(false);
  };

  const handleSaveRecordingUrl = async (id: number) => {
    if (!recordingUrl.trim()) return;
    setIsSubmitting(true);
    await supabase.from('program_questions')
      .update({ recording_url: recordingUrl.trim(), status: 'answered' } as any)
      .eq('id', id);
    setUploadingId(null);
    setRecordingUrl('');
    fetchQuestions();
    setIsSubmitting(false);
  };

  const filtered = questions.filter((q) => {
    const matchSearch =
      q.program_name.toLowerCase().includes(search.toLowerCase()) ||
      q.sender_name.toLowerCase().includes(search.toLowerCase()) ||
      q.question.toLowerCase().includes(search.toLowerCase()) ||
      (q.schedule_speaker || '').toLowerCase().includes(search.toLowerCase());
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
                  {/* Header with schedule detail */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
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
                      {/* Schedule metadata */}
                      <div className="flex items-center gap-3 flex-wrap text-xs text-slate-400">
                        {q.schedule_program && (
                          <span className="flex items-center gap-1">
                            <Radio size={11} /> {q.schedule_program}
                          </span>
                        )}
                        {q.schedule_day && (
                          <span className="flex items-center gap-1">
                            <Calendar size={11} /> {q.schedule_day}
                          </span>
                        )}
                        {q.schedule_time && (
                          <span className="flex items-center gap-1">
                            <Clock size={11} /> {q.schedule_time} WIB
                          </span>
                        )}
                        {q.schedule_speaker && (
                          <span className="flex items-center gap-1">
                            <User size={11} /> {q.schedule_speaker}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap ml-3">
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

                  {/* Recording URL (if uploaded) */}
                  {q.recording_url && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-3">
                      <p className="text-xs text-blue-600 font-semibold mb-1 flex items-center gap-1"><Mic size={12} /> Rekaman Tersedia:</p>
                      <audio controls className="w-full mt-1 h-8" src={q.recording_url} />
                      <a href={q.recording_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline mt-1 inline-flex items-center gap-1">
                        <Link2 size={11} /> Buka link rekaman
                      </a>
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

                  {/* Recording Upload Form */}
                  {uploadingId === q.id && (
                    <div className="bg-blue-50 rounded-xl p-3 mb-3 border border-blue-200">
                      <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1"><Upload size={12} /> Upload Rekaman</p>
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">Upload file audio:</label>
                          <input ref={fileInputRef} type="file" accept="audio/*"
                            className="w-full text-xs file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-blue-100 file:text-blue-700 file:font-medium file:text-xs" />
                          <button
                            onClick={() => handleUploadRecording(q.id!)}
                            disabled={isSubmitting}
                            className="mt-2 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-50"
                          >
                            {isSubmitting ? 'Mengupload...' : 'Upload File'}
                          </button>
                        </div>
                        <div className="border-t border-blue-200 pt-2">
                          <label className="text-xs text-slate-500 mb-1 block">Atau paste URL rekaman:</label>
                          <div className="flex gap-2">
                            <input
                              type="url"
                              value={recordingUrl}
                              onChange={(e) => setRecordingUrl(e.target.value)}
                              placeholder="https://drive.google.com/..."
                              className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                            />
                            <button
                              onClick={() => handleSaveRecordingUrl(q.id!)}
                              disabled={isSubmitting || !recordingUrl.trim()}
                              className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-50"
                            >
                              Simpan
                            </button>
                          </div>
                        </div>
                        <button onClick={() => { setUploadingId(null); setRecordingUrl(''); }}
                          className="text-xs text-slate-400 hover:text-slate-600">Batal</button>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-50 flex-wrap">
                    {q.status !== 'answered' && replyingId !== q.id && (
                      <button
                        onClick={() => { setReplyingId(q.id!); setReplyText(q.admin_reply || ''); setUploadingId(null); }}
                        className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors flex items-center gap-1"
                      >
                        <Send size={12} /> Balas
                      </button>
                    )}
                    {q.status === 'answered' && (
                      <button
                        onClick={() => { setReplyingId(q.id!); setReplyText(q.admin_reply || ''); setUploadingId(null); }}
                        className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors"
                      >
                        Edit Balasan
                      </button>
                    )}
                    {q.is_recording_request && uploadingId !== q.id && (
                      <button
                        onClick={() => { setUploadingId(q.id!); setReplyingId(null); setRecordingUrl(q.recording_url || ''); }}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors flex items-center gap-1"
                      >
                        <Upload size={12} /> {q.recording_url ? 'Ganti Rekaman' : 'Upload Rekaman'}
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
