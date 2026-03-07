'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { ssr: false });

export default function ResumeEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scheduleId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [resumeHtml, setResumeHtml] = useState('');
  const [schedule, setSchedule] = useState<{
    id: string;
    judul: string;
    program: string;
    pemateri: string;
    jam: string;
    date: string;
  } | null>(null);

  useEffect(() => {
    if (!scheduleId) {
      router.push('/dashboard/jadwal');
      return;
    }
    fetchSchedule();
  }, [scheduleId]);

  const fetchSchedule = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('schedules')
      .select('id, judul, program, pemateri, jam, date, resume_html')
      .eq('id', scheduleId)
      .single();
    if (error || !data) {
      alert('Jadwal tidak ditemukan');
      router.push('/dashboard/jadwal');
      return;
    }
    setSchedule({
      id: data.id,
      judul: data.judul,
      program: data.program,
      pemateri: data.pemateri,
      jam: data.jam,
      date: data.date,
    });
    setResumeHtml((data as any).resume_html || '');
    setLoading(false);
  };

  const handleSave = useCallback(async () => {
    if (!scheduleId) return;
    setSaving(true);
    const { error } = await supabase
      .from('schedules')
      .update({ resume_html: resumeHtml.trim() || null })
      .eq('id', scheduleId);
    setSaving(false);
    if (error) {
      alert('Gagal menyimpan: ' + error.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }, [scheduleId, resumeHtml]);

  // Keyboard shortcut Ctrl+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  if (!schedule) return null;

  const formattedDate = new Date(schedule.date).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push('/dashboard/jadwal')}
          className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"
          title="Kembali"
        >
          <span className="material-icons-round text-slate-500">arrow_back</span>
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-black text-slate-800">Resume / Transkrip Kajian</h1>
          <p className="text-xs text-slate-400">Tulis ringkasan materi agar membantu pendengar memahami isi program</p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-xs text-green-500 font-bold animate-pulse">✓ Tersimpan</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-2xl transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                Menyimpan...
              </>
            ) : (
              <>
                <span className="material-icons-round text-base">save</span>
                Simpan
              </>
            )}
          </button>
        </div>
      </div>

      {/* Schedule Info Card */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-4 mb-5">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-xl shadow-sm">
            <span className="material-icons-round text-purple-500 text-2xl">event_note</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-purple-500 uppercase tracking-wider mb-0.5">{schedule.program}</p>
            <p className="text-base font-bold text-slate-800 leading-tight">{schedule.judul}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
              {schedule.pemateri && (
                <span className="text-xs text-slate-500">
                  <span className="text-slate-400">👤</span> {schedule.pemateri}
                </span>
              )}
              <span className="text-xs text-slate-500">
                <span className="text-slate-400">🕐</span> {schedule.jam} WIB
              </span>
              <span className="text-xs text-slate-500">
                <span className="text-slate-400">📅</span> {formattedDate}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Area — full width */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-icons-round text-slate-400 text-base">article</span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Editor Resume</span>
          </div>
          <span className="text-[10px] text-slate-400">Ctrl+S untuk menyimpan</span>
        </div>
        <div className="min-h-[50vh]">
          <RichTextEditor
            content={resumeHtml}
            onChange={setResumeHtml}
            placeholder="Tulis resume/transkrip kajian di sini... Gunakan heading, list, dan format lainnya untuk memperjelas isi materi."
          />
        </div>
      </div>

      {/* Word count / status */}
      <div className="flex items-center justify-between mt-3 px-1">
        <p className="text-[10px] text-slate-400">
          {resumeHtml && resumeHtml !== '<p></p>'
            ? `~${resumeHtml.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length} kata`
            : 'Belum ada konten'}
        </p>
        <p className="text-[10px] text-slate-400">
          ID: {schedule.id}
        </p>
      </div>
    </div>
  );
}
