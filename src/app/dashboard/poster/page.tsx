'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Camera, Trash2, Edit3, ArrowUp, ArrowDown, Save, X } from 'lucide-react';

export default function ManajemenPoster() {
  const [judul, setJudul] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [posters, setPosters] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editJudul, setEditJudul] = useState('');

  useEffect(() => {
    fetchPosters();
  }, []);

  // --- 1. AMBIL SEMUA DATA POSTER ---
  const fetchPosters = async () => {
    const { data, error } = await supabase
      .from('posters')
      .select('*')
      .order('order_index', { ascending: true });
    if (error) console.error(error);
    else setPosters(data || []);
  };

  // --- 2. PROSES UPLOAD ---
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert('Pilih gambar dulu, Akhi!');

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('posters').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('posters').getPublicUrl(fileName);

      // Hitung order_index terakhir
      const nextIndex = posters.length > 0 ? Math.max(...posters.map(p => p.order_index)) + 1 : 0;

      const { error: dbError } = await supabase.from('posters').insert([{ 
        judul, 
        image_url: publicUrl,
        order_index: nextIndex 
      }]);

      if (dbError) throw dbError;

      alert('Poster berhasil diunggah!');
      setJudul('');
      setFile(null);
      fetchPosters();
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // --- 3. PROSES HAPUS (DATABASE & STORAGE) ---
  const handleDelete = async (id: string, imageUrl: string) => {
    if (!confirm('Yakin ingin menghapus poster ini?')) return;

    try {
      const fileName = imageUrl.split('/').pop();
      if (fileName) {
        await supabase.storage.from('posters').remove([fileName]);
      }
      await supabase.from('posters').delete().eq('id', id);
      fetchPosters();
    } catch (error) {
      alert('Gagal menghapus poster');
    }
  };

  // --- 4. PROSES UBAH URUTAN ---
  const movePoster = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === posters.length - 1) return;

    const newPosters = [...posters];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap data di array lokal
    const temp = newPosters[index];
    newPosters[index] = newPosters[targetIndex];
    newPosters[targetIndex] = temp;

    // Update order_index di database
    const updates = newPosters.map((p, idx) => ({
      id: p.id,
      judul: p.judul,
      image_url: p.image_url,
      order_index: idx
    }));

    const { error } = await supabase.from('posters').upsert(updates);
    if (!error) fetchPosters();
  };

  // --- 5. PROSES UPDATE JUDUL ---
  const handleUpdateJudul = async (id: string) => {
    const { error } = await supabase.from('posters').update({ judul: editJudul }).eq('id', id);
    if (!error) {
      setEditingId(null);
      fetchPosters();
    }
  };

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-display font-bold text-primary">Manajemen Poster Dakwah</h1>

      {/* FORM UPLOAD (SAMA SEPERTI SEBELUMNYA) */}
      <form onSubmit={handleUpload} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 max-w-xl">
        <h2 className="text-sm font-bold mb-4 uppercase text-slate-400">Tambah Poster Baru</h2>
        <div className="space-y-4">
          <input 
            type="text" 
            placeholder="Judul Poster..." 
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            className="w-full rounded-xl border-slate-200 focus:ring-primary focus:border-primary"
            required 
          />
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center relative">
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
            <p className="text-xs text-slate-500">{file ? file.name : "Pilih Gambar"}</p>
          </div>
          <button type="submit" disabled={uploading} className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-secondary disabled:opacity-50">
            {uploading ? "Mengunggah..." : "Publikasikan"}
          </button>
        </div>
      </form>

      {/* DAFTAR POSTER YANG SUDAH DIUPLOAD */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posters.map((poster, index) => (
          <div key={poster.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 flex flex-col">
            <div className="aspect-video relative group">
              <img src={poster.image_url} alt={poster.judul} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button onClick={() => movePoster(index, 'up')} className="p-2 bg-white rounded-full text-primary hover:bg-primary hover:text-white"><ArrowUp size={18}/></button>
                <button onClick={() => movePoster(index, 'down')} className="p-2 bg-white rounded-full text-primary hover:bg-primary hover:text-white"><ArrowDown size={18}/></button>
              </div>
            </div>
            
            <div className="p-5 flex-1 flex flex-col">
              {editingId === poster.id ? (
                <div className="flex gap-2 mb-4">
                  <input value={editJudul} onChange={(e) => setEditJudul(e.target.value)} className="flex-1 text-sm border-slate-200 rounded-lg p-1" />
                  <button onClick={() => handleUpdateJudul(poster.id)} className="text-green-500"><Save size={18}/></button>
                  <button onClick={() => setEditingId(null)} className="text-red-500"><X size={18}/></button>
                </div>
              ) : (
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-slate-700 text-sm line-clamp-2">{poster.judul}</h3>
                  <button onClick={() => { setEditingId(poster.id); setEditJudul(poster.judul); }} className="text-slate-400 hover:text-primary"><Edit3 size={16}/></button>
                </div>
              )}
              
              <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-center text-xs">
                <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-500 font-mono">Urutan: {poster.order_index}</span>
                <button onClick={() => handleDelete(poster.id, poster.image_url)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg flex items-center gap-1">
                  <Trash2 size={16} />
                  Hapus
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}