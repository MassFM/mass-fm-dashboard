'use client';

import { useEffect, useState } from 'react';
// Ganti import lama dengan import dari lib lokal Akhi
import { supabase } from '@/lib/supabase'; 

export default function FeedbackPage() {
  // Hapus baris: const supabase = createClientComponentClient();
  // Karena kita sudah mengimport 'supabase' secara langsung di atas
  
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- FUNGSI AMBIL DATA ---
  const fetchFeedbacks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('feedbacks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (!error) setFeedbacks(data);
    setLoading(false);
  };

  // --- FUNGSI TANDAI SELESAI / BARU (TOGGLE STATUS) ---
  const toggleStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('feedbacks')
      .update({ is_read: !currentStatus })
      .eq('id', id);
    
    if (!error) {
      setFeedbacks(feedbacks.map(f => 
        f.id === id ? { ...f, is_read: !currentStatus } : f
      ));
    }
  };

  // --- FUNGSI HAPUS ---
  const deleteFeedback = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus feedback ini?')) return;

    const { error } = await supabase.from('feedbacks').delete().eq('id', id);
    if (!error) {
      setFeedbacks(feedbacks.filter((f) => f.id !== id));
      alert('Feedback berhasil dihapus');
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  return (
    <div className="p-6 sm:p-10 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Kritik & Saran Pendengar</h1>
            <p className="text-sm text-gray-500">Kelola masukan jamaah untuk perbaikan MASS FM 88.0 MHz</p>
          </div>
          <button 
            onClick={fetchFeedbacks}
            className="flex items-center gap-2 bg-white border border-gray-200 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-[#822a6e] hover:text-[#822a6e] transition-all shadow-sm"
          >
            <span className="material-icons-round text-lg">refresh</span>
            Refresh Data
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col justify-center items-center py-32 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#822a6e]"></div>
            <p className="text-gray-400 animate-pulse text-sm">Memuat data...</p>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="bg-white rounded-3xl p-20 text-center border border-gray-100 shadow-sm">
            <div className="bg-purple-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-icons-round text-4xl text-[#822a6e]/30">chat_bubble_outline</span>
            </div>
            <h3 className="text-gray-800 font-bold text-lg">Belum Ada Feedback</h3>
            <p className="text-gray-400 text-sm mt-2">Masukan dari pendengar aplikasi akan muncul di sini.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl shadow-purple-900/5 border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Tanggal</th>
                    <th className="px-6 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Rating</th>
                    <th className="px-6 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Kategori</th>
                    <th className="px-6 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Pesan Masukan</th>
                    <th className="px-6 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                    <th className="px-6 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {feedbacks.map((item) => (
                    <tr key={item.id} className={`transition-colors ${item.is_read ? 'bg-white' : 'bg-purple-50/30'}`}>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500 font-medium">
                        {new Date(item.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                        <span className="block text-[10px] text-gray-400 mt-1 uppercase">
                          {new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex text-amber-400 bg-amber-50 w-fit px-2 py-1 rounded-lg">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className={`material-icons-round text-sm ${i < item.rating ? 'fill-current' : 'text-gray-300'}`}>
                              {i < item.rating ? 'star' : 'star_outline'}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider bg-white text-[#822a6e] border border-purple-100 shadow-sm">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-600 max-w-md">
                        <p className={`line-clamp-2 leading-relaxed ${!item.is_read && 'font-semibold text-gray-900'}`}>
                          {item.message}
                        </p>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <button 
                          onClick={() => toggleStatus(item.id, item.is_read)}
                          title={item.is_read ? "Tandai sebagai baru" : "Tandai sudah selesai"}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all shadow-sm ${
                            item.is_read 
                              ? 'bg-gray-100 text-gray-400 hover:bg-gray-200' 
                              : 'bg-green-500 text-white hover:bg-green-600 shadow-green-200'
                          }`}
                        >
                          <span className="material-icons-round text-xs">
                            {item.is_read ? 'done_all' : 'mark_as_unread'}
                          </span>
                          {item.is_read ? 'Selesai' : 'Baru'}
                        </button>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button 
                          onClick={() => deleteFeedback(item.id)}
                          className="text-gray-300 hover:text-red-500 transition-all p-2 rounded-full hover:bg-red-50"
                          title="Hapus masukan"
                        >
                          <span className="material-icons-round text-xl">delete_outline</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Footer Table Info */}
            <div className="bg-gray-50/50 px-6 py-4 border-t border-gray-100 flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
               <span>Total Masukan: {feedbacks.length}</span>
               <span>MASS FM Feedback Management System</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}