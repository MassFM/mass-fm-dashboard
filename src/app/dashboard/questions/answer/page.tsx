'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Mic, Save, User, MapPin, PlayCircle } from 'lucide-react'; // Tambah PlayCircle
import Link from 'next/link';

function AnswerForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  
  const [question, setQuestion] = useState<any>(null);
  const [answerText, setAnswerText] = useState('');
  const [ustadzName, setUstadzName] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    const { data } = await supabase.from('questions').select('*').eq('id', id).single();
    if (data) {
      setQuestion(data);
      setAnswerText(data.jawaban_teks || '');
      setUstadzName(data.nama_ustadz_penjawab || '');
    }
    setLoading(false);
  };

  const uploadAudio = async () => {
    if (!audioFile || !id) return null;
    const fileName = `ans_${id}_${Date.now()}.mp3`;
    const { error: uploadError } = await supabase.storage
      .from('answers') 
      .upload(fileName, audioFile);

    if (uploadError) throw uploadError;
    const { data: urlData } = supabase.storage.from('answers').getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsSubmitting(true);

    try {
      let audioUrl = question?.jawaban_audio_url;
      if (audioFile) audioUrl = await uploadAudio();

      const { error } = await supabase
        .from('questions')
        .update({
          jawaban_teks: answerText,
          jawaban_audio_url: audioUrl,
          nama_ustadz_penjawab: ustadzName,
          status: 'answered'
        })
        .eq('id', id);

      if (error) throw error;
      alert('Jawaban berhasil disimpan!');
      router.push('/dashboard/questions');
    } catch (err: any) {
      alert('Gagal menyimpan: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-400">Memuat data...</div>;
  if (!question) return <div className="p-12 text-center text-red-500">Data tidak ditemukan</div>;

  return (
    <div className="p-8 w-full max-w-4xl mx-auto">
      <Link href="/dashboard/questions" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary mb-6 text-sm font-medium transition-colors">
        <ArrowLeft size={16} />
        Kembali ke Daftar
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Kolom Kiri: Detail Pertanyaan */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Penanya</h2>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <User size={20} />
              </div>
              <div>
                <p className="font-bold text-slate-800">
                  {question.is_anonymous ? 'Hamba Allah' : question.nama_penanya}
                </p>
                <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                  <MapPin size={12} />
                  {question.lokasi || '-'}
                </div>
              </div>
            </div>
            
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 border-t border-slate-50 pt-4">Pertanyaan</h2>
            
            {/* TAMPILKAN PLAYER AUDIO JIKA PERTANYAAN BERUPA SUARA */}
            {question.pertanyaan_audio_url ? (
              <div className="mb-4 bg-purple-50 p-3 rounded-lg border border-purple-100">
                <div className="flex items-center gap-2 text-primary font-bold text-xs mb-2">
                  <Mic size={14} />
                  Voice Note Penanya
                </div>
                <audio controls className="w-full h-8" src={question.pertanyaan_audio_url}>
                  Browser Anda tidak mendukung audio.
                </audio>
              </div>
            ) : null}

            <p className="text-sm text-slate-700 leading-relaxed italic">
              "{question.isi_pertanyaan}"
            </p>
            <p className="text-xs text-slate-400 mt-4 text-right">
              {new Date(question.created_at).toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        {/* Kolom Kanan: Form Jawaban */}
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="font-display text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Mic className="text-primary" size={24} />
              Form Jawaban
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nama Ustadz Penjawab</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
                  value={ustadzName}
                  onChange={(e) => setUstadzName(e.target.value)}
                  placeholder="Contoh: Ustadz Khalid Basalamah"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Jawaban Tertulis</label>
                <textarea 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm h-40 resize-none"
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Tulis ringkasan jawaban disini..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Upload Audio Jawaban (MP3)</label>
                <div className="flex items-center justify-center w-full">
                  <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Mic className="w-8 h-8 text-slate-400 mb-2" />
                      <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Klik untuk upload</span> audio</p>
                      <p className="text-xs text-slate-400">MP3, WAV (MAX. 10MB)</p>
                    </div>
                    <input 
                      id="dropzone-file" 
                      type="file" 
                      accept="audio/*"
                      onChange={(e) => e.target.files && setAudioFile(e.target.files[0])}
                      className="hidden" 
                    />
                  </label>
                </div>
                {audioFile && (
                  <div className="mt-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg inline-block font-medium">
                    File terpilih: {audioFile.name}
                  </div>
                )}
                {question.jawaban_audio_url && !audioFile && (
                  <div className="mt-2 text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg inline-block font-medium">
                    Audio sudah ada. Upload baru untuk mengganti.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50 flex gap-4">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-[#6a225a] shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isSubmitting ? 'Menyimpan...' : <><Save size={18} /> Kirim Jawaban</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AnswerPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Memuat formulir...</div>}>
      <AnswerForm />
    </Suspense>
  );
}