'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { MessageCircle, CheckCircle, Clock, Settings } from 'lucide-react';

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [filter, setFilter] = useState('pending'); // 'pending' or 'answered'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestions();
  }, [filter]);

  const fetchQuestions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('questions')
      .select('id, created_at, nama_penanya, is_anonymous, lokasi, isi_pertanyaan, status')
      .eq('status', filter)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.error('Error fetching questions:', error);
    } else {
      setQuestions(data || []);
    }
    setLoading(false);
  };

  return (
    <div className="p-8 w-full max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Tanya Ustadz</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola pertanyaan masuk dari pendengar.</p>
        </div>
        
        {/* Perbaiki link ke settings (pastikan nama folder 'settings' pakai s) */}
        <Link 
          href="/dashboard/questions/settings"
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium"
        >
          <Settings size={16} />
          Pengaturan Hapus
        </Link>
      </div>

      {/* Tabs Filter */}
      <div className="flex gap-4 mb-6 border-b border-slate-200">
        <button
          onClick={() => setFilter('pending')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            filter === 'pending' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Clock size={16} />
          Menunggu Jawaban
        </button>
        <button
          onClick={() => setFilter('answered')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            filter === 'answered' 
              ? 'border-green-600 text-green-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CheckCircle size={16} />
          Sudah Dijawab
        </button>
      </div>

      {/* Tabel Data */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Memuat data pertanyaan...</div>
        ) : questions.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <MessageCircle size={24} className="text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">Tidak ada pertanyaan {filter === 'pending' ? 'baru' : 'yang sudah dijawab'}.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Penanya</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Pertanyaan</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {questions.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 text-sm text-slate-500 whitespace-nowrap">
                    {new Date(q.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })}
                    <div className="text-xs text-slate-400">
                      {new Date(q.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-slate-800 text-sm">
                      {q.is_anonymous ? 'Hamba Allah' : q.nama_penanya}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-1">
                      {q.lokasi || 'Lokasi tidak diketahui'}
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-slate-600 line-clamp-2 max-w-md">{q.isi_pertanyaan}</p>
                  </td>
                  <td className="p-4 text-right">
                    {/* PERBAIKAN PENTING DI SINI: MENGGUNAKAN query ?id= */}
                    <Link 
                      href={`/dashboard/questions/answer?id=${q.id}`}
                      className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        filter === 'pending' 
                          ? 'bg-primary text-white hover:bg-[#6a225a] shadow-md shadow-primary/20' 
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {filter === 'pending' ? 'Jawab Sekarang' : 'Edit Jawaban'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}