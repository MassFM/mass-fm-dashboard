'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { BookOpen, Plus, Edit2, Trash2, Search, ToggleLeft, ToggleRight } from 'lucide-react';

interface DailyDoa {
  id?: number;
  title: string;
  arabic: string;
  latin: string;
  translation: string;
  source: string;
  category: string;
  is_active: boolean;
  created_at?: string;
}

const CATEGORIES = ['Pagi & Sore', 'Tidur', 'Makan & Minum', 'Bepergian', 'Sholat', 'Harian', 'Lainnya'];

export default function DoaPage() {
  const [doaList, setDoaList] = useState<DailyDoa[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('Semua');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<DailyDoa>({
    title: '', arabic: '', latin: '', translation: '', source: '', category: '', is_active: true,
  });

  const fetchDoa = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('daily_doas').select('*').order('created_at', { ascending: false });
    setDoaList(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchDoa(); }, [fetchDoa]);

  const resetForm = () => {
    setForm({ title: '', arabic: '', latin: '', translation: '', source: '', category: '', is_active: true });
    setEditId(null);
  };

  const openAdd = () => { resetForm(); setShowModal(true); };

  const openEdit = (doa: DailyDoa) => {
    setForm(doa);
    setEditId(doa.id || null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return alert('Judul doa wajib diisi');
    const payload = {
      title: form.title, arabic: form.arabic, latin: form.latin,
      translation: form.translation, source: form.source, category: form.category, is_active: form.is_active,
    };
    if (editId) {
      await supabase.from('daily_doas').update(payload as any).eq('id', editId);
    } else {
      await supabase.from('daily_doas').insert(payload as any);
    }
    setShowModal(false);
    resetForm();
    fetchDoa();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus doa ini?')) return;
    await supabase.from('daily_doas').delete().eq('id', id);
    fetchDoa();
  };

  const toggleActive = async (doa: DailyDoa) => {
    await supabase.from('daily_doas').update({ is_active: !doa.is_active } as any).eq('id', doa.id!);
    fetchDoa();
  };

  // Filtered list
  const filtered = doaList.filter((d) => {
    const matchSearch = d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.arabic.includes(search) || d.latin.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === 'Semua' || d.category === filterCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-900 rounded-xl flex items-center justify-center">
              <BookOpen className="text-white" size={20} />
            </div>
            Doa Harian
          </h1>
          <p className="text-slate-400 text-sm mt-1">Kelola koleksi doa harian yang tampil di aplikasi</p>
        </div>
        <button onClick={openAdd}
          className="bg-gradient-to-r from-primary to-purple-900 text-white px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition shadow-lg shadow-primary/20">
          <Plus size={16} /> Tambah Doa
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[250px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari doa..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['Semua', ...CATEGORIES].map((cat) => (
            <button key={cat} onClick={() => setFilterCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${filterCategory === cat
                ? 'bg-primary text-white shadow' : 'bg-white text-slate-400 hover:bg-slate-50'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-50">
          <p className="text-2xl font-bold text-primary">{doaList.length}</p>
          <p className="text-xs text-slate-400">Total Doa</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-50">
          <p className="text-2xl font-bold text-green-500">{doaList.filter(d => d.is_active).length}</p>
          <p className="text-xs text-slate-400">Aktif</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-50">
          <p className="text-2xl font-bold text-slate-300">{doaList.filter(d => !d.is_active).length}</p>
          <p className="text-xs text-slate-400">Non-Aktif</p>
        </div>
      </div>

      {/* Doa List */}
      {loading ? (
        <div className="text-center py-20 text-slate-300">Memuat...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-300">Belum ada doa</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((doa) => (
            <div key={doa.id} className="bg-white rounded-2xl p-5 border border-slate-50 hover:shadow-md transition">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary/10 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">🤲</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-700">{doa.title}</h3>
                    {doa.category && (
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-semibold rounded-full">
                        {doa.category}
                      </span>
                    )}
                    {!doa.is_active && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-400 text-[10px] font-semibold rounded-full">
                        Non-Aktif
                      </span>
                    )}
                  </div>
                  {doa.arabic && (
                    <p className="text-base mt-2 text-right leading-relaxed" dir="rtl">{doa.arabic}</p>
                  )}
                  {doa.latin && (
                    <p className="text-xs text-slate-400 italic mt-1 line-clamp-1">{doa.latin}</p>
                  )}
                  {doa.translation && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{doa.translation}</p>
                  )}
                  {doa.source && (
                    <p className="text-[10px] text-primary/60 mt-1 font-medium">📖 {doa.source}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => toggleActive(doa)} className="p-2 rounded-lg hover:bg-slate-50" title="Toggle Aktif">
                    {doa.is_active ? <ToggleRight size={20} className="text-green-500" /> : <ToggleLeft size={20} className="text-slate-300" />}
                  </button>
                  <button onClick={() => openEdit(doa)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-500">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(doa.id!)} className="p-2 rounded-lg hover:bg-red-50 text-red-400">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-700 mb-4">{editId ? 'Edit Doa' : 'Tambah Doa Baru'}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Judul *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Contoh: Doa Sebelum Tidur" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Teks Arab</label>
                <textarea value={form.arabic} onChange={(e) => setForm({ ...form, arabic: e.target.value })}
                  rows={3} dir="rtl" className="w-full px-4 py-3 rounded-xl border border-slate-100 text-base focus:outline-none focus:ring-2 focus:ring-primary/20 leading-relaxed" placeholder="اللَّهُمَّ بِاسْمِكَ أَمُوتُ وَأَحْيَا" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Latin</label>
                <textarea value={form.latin} onChange={(e) => setForm({ ...form, latin: e.target.value })}
                  rows={2} className="w-full px-4 py-3 rounded-xl border border-slate-100 text-sm italic focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Allahumma bismika amuutu wa ahyaa" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Terjemahan</label>
                <textarea value={form.translation} onChange={(e) => setForm({ ...form, translation: e.target.value })}
                  rows={2} className="w-full px-4 py-3 rounded-xl border border-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Dengan nama-Mu ya Allah aku mati dan aku hidup" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Sumber</label>
                  <input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="HR. Bukhari" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Kategori</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white">
                    <option value="">Pilih Kategori</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setForm({ ...form, is_active: !form.is_active })}
                  className={`w-10 h-6 rounded-full relative transition ${form.is_active ? 'bg-green-500' : 'bg-slate-200'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition ${form.is_active ? 'left-4.5' : 'left-0.5'}`} />
                </button>
                <span className="text-sm text-slate-500">{form.is_active ? 'Aktif' : 'Non-Aktif'}</span>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-slate-50">Batal</button>
              <button onClick={handleSave}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary to-purple-900 text-white hover:opacity-90 shadow">
                {editId ? 'Simpan' : 'Tambah'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
