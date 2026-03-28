'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { BookOpen, Plus, Edit2, Trash2, Search, ToggleLeft, ToggleRight, X, Upload, Image as ImageIcon, Star } from 'lucide-react';

interface DailyDoa {
  id?: number;
  title: string;
  arabic: string;
  latin: string;
  translation: string;
  source: string;
  category: string;
  fawaid?: string | null;
  notes?: string | null;
  audio_url?: string | null;
  background_image_url?: string | null;
  is_active: boolean;
  created_at?: string;
}

const DEFAULT_CATEGORIES = ['Pagi & Sore', 'Tidur', 'Makan & Minum', 'Bepergian', 'Sholat', 'Harian', 'Doa Pilihan', 'Lainnya'];

export default function DoaPage() {
  const [doaList, setDoaList] = useState<DailyDoa[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('Semua');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<DailyDoa>({
    title: '', arabic: '', latin: '', translation: '', source: '', category: '', fawaid: '', notes: '', audio_url: '', background_image_url: '', is_active: true,
  });
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categoryInput, setCategoryInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);

  // Compute dynamic categories from existing data + defaults
  const allCategories = Array.from(new Set([
    ...DEFAULT_CATEGORIES,
    ...doaList.map(d => d.category).filter(Boolean),
  ])).sort();

  const fetchDoa = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('daily_doas').select('*').order('created_at', { ascending: false });
    setDoaList(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchDoa(); }, [fetchDoa]);

  const resetForm = () => {
    setForm({ title: '', arabic: '', latin: '', translation: '', source: '', category: '', fawaid: '', notes: '', audio_url: '', background_image_url: '', is_active: true });
    setEditId(null);
  };

  const openAdd = () => { resetForm(); setCategoryInput(''); setShowModal(true); };

  const openEdit = (doa: DailyDoa) => {
    setForm(doa);
    setEditId(doa.id || null);
    setCategoryInput(doa.category || '');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return alert('Judul doa wajib diisi');
    const payload = {
      title: form.title, arabic: form.arabic, latin: form.latin,
      translation: form.translation, source: form.source, category: form.category,
      fawaid: form.fawaid || null, notes: form.notes || null, audio_url: form.audio_url || null,
      background_image_url: form.background_image_url || null, is_active: form.is_active,
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

  const toggleFeatured = async (doa: DailyDoa) => {
    const isFeatured = doa.category === 'Doa Pilihan';
    // Toggle: jika sudah "Doa Pilihan", kembalikan ke "Harian". Jika belum, set ke "Doa Pilihan".
    const newCategory = isFeatured ? 'Harian' : 'Doa Pilihan';
    await supabase.from('daily_doas').update({ category: newCategory } as any).eq('id', doa.id!);
    fetchDoa();
  };

  const handleDeleteCategory = async (category: string) => {
    const count = doaList.filter(d => d.category === category).length;
    if (!confirm(`Hapus semua ${count} doa dalam kategori "${category}"?\n\nTindakan ini tidak bisa dibatalkan.`)) return;
    const { error } = await supabase.from('daily_doas').delete().eq('category', category);
    if (error) {
      alert('Gagal menghapus: ' + error.message);
      return;
    }
    if (filterCategory === category) setFilterCategory('Semua');
    fetchDoa();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('File harus berupa gambar'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('Ukuran file maksimal 5MB'); return; }
    setUploadingImage(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `doa-bg-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('doa-images').upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (uploadError) { alert('Gagal upload: ' + uploadError.message); return; }
      const { data: urlData } = supabase.storage.from('doa-images').getPublicUrl(fileName);
      setForm({ ...form, background_image_url: urlData.publicUrl });
    } catch (err) {
      alert('Gagal upload gambar');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ['audio/mpeg', 'audio/mp4', 'audio/m4a', 'audio/x-m4a', 'audio/ogg', 'audio/wav'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp3|m4a|ogg|wav)$/i)) {
      alert('File harus berupa audio (mp3, m4a, ogg, wav)');
      return;
    }
    if (file.size > 20 * 1024 * 1024) { alert('Ukuran file audio maksimal 20MB'); return; }
    setUploadingAudio(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `doa-audio/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('doa-images').upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (uploadError) { alert('Gagal upload audio: ' + uploadError.message); return; }
      const { data: urlData } = supabase.storage.from('doa-images').getPublicUrl(fileName);
      setForm({ ...form, audio_url: urlData.publicUrl });
    } catch (err) {
      alert('Gagal upload audio');
    } finally {
      setUploadingAudio(false);
    }
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
          {['Semua', ...allCategories].map((cat) => {
            const catCount = cat === 'Semua' ? doaList.length : doaList.filter(d => d.category === cat).length;
            return (
              <div key={cat} className="relative group flex items-center">
                <button onClick={() => setFilterCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${filterCategory === cat
                    ? 'bg-primary text-white shadow' : 'bg-white text-slate-400 hover:bg-slate-50'}`}>
                  {cat}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filterCategory === cat ? 'bg-white/20' : 'bg-slate-100'}`}>{catCount}</span>
                </button>
                {cat !== 'Semua' && catCount > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat); }}
                    className="ml-0.5 w-5 h-5 rounded-full bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title={`Hapus semua doa kategori "${cat}"`}
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-50">
          <p className="text-2xl font-bold text-primary">{doaList.length}</p>
          <p className="text-xs text-slate-400">Total Doa</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-50">
          <p className="text-2xl font-bold text-green-500">{doaList.filter(d => d.is_active).length}</p>
          <p className="text-xs text-slate-400">Aktif</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-amber-50">
          <p className="text-2xl font-bold text-amber-500">{doaList.filter(d => d.category === 'Doa Pilihan').length}</p>
          <p className="text-xs text-slate-400">Doa Pilihan Hari Ini</p>
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
                  {doa.fawaid && (
                    <p className="text-[10px] text-amber-600/70 mt-1 line-clamp-1">✨ {doa.fawaid}</p>
                  )}
                  {doa.audio_url && (
                    <p className="text-[10px] text-green-600/70 mt-1 flex items-center gap-1">
                      🎧 Audio tersedia
                    </p>
                  )}
                  {doa.background_image_url && (
                    <p className="text-[10px] text-blue-600/70 mt-1 flex items-center gap-1">
                      🖼️ Background image
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => toggleFeatured(doa)} className={`p-2 rounded-lg transition ${doa.category === 'Doa Pilihan' ? 'bg-amber-50 hover:bg-amber-100' : 'hover:bg-slate-50'}`} title="Tandai sebagai Doa Pilihan Hari Ini">
                    <Star size={16} className={doa.category === 'Doa Pilihan' ? 'text-amber-500 fill-amber-500' : 'text-slate-300'} />
                  </button>
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
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Fawaid / Keutamaan</label>
                <textarea value={form.fawaid || ''} onChange={(e) => setForm({ ...form, fawaid: e.target.value })}
                  rows={2} className="w-full px-4 py-3 rounded-xl border border-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Keutamaan atau manfaat dari doa ini..." />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Catatan</label>
                <textarea value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2} className="w-full px-4 py-3 rounded-xl border border-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Catatan tambahan (opsional)" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Audio Doa</label>
                <div className="flex gap-2 items-start">
                  <div className="flex-1">
                    <input value={form.audio_url || ''} onChange={(e) => setForm({ ...form, audio_url: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="URL audio atau upload file..." />
                  </div>
                  <label className={`px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition ${uploadingAudio ? 'bg-slate-100 text-slate-400' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                    {uploadingAudio ? (
                      <span className="animate-spin">⏳</span>
                    ) : (
                      <Upload size={14} />
                    )}
                    {uploadingAudio ? 'Uploading...' : 'Upload'}
                    <input type="file" accept="audio/*,.mp3,.m4a,.ogg,.wav" className="hidden" onChange={handleAudioUpload} disabled={uploadingAudio} />
                  </label>
                  {form.audio_url && (
                    <button type="button" onClick={() => {
                      const audio = new Audio(form.audio_url!);
                      audio.play().catch(() => alert('Gagal memutar audio'));
                      setTimeout(() => audio.pause(), 5000);
                    }} className="px-3 py-2.5 rounded-xl bg-green-50 text-green-600 text-xs font-semibold hover:bg-green-100 transition">
                      🎧 Test
                    </button>
                  )}
                  {form.audio_url && (
                    <button type="button" onClick={() => setForm({ ...form, audio_url: '' })}
                      className="px-2 py-2.5 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 transition">
                      <X size={14} />
                    </button>
                  )}
                </div>
                {form.audio_url && (
                  <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-green-50/50 rounded-lg border border-green-100">
                    <span className="text-green-500">🎧</span>
                    <p className="text-[11px] text-green-700 truncate flex-1">{form.audio_url.split('/').pop()}</p>
                  </div>
                )}
                <p className="text-[10px] text-slate-400 mt-1">Upload file audio (mp3/m4a, maks 20MB) atau masukkan URL langsung</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Background Image (Doa Pilihan)</label>
                <div className="flex gap-2 items-start">
                  <div className="flex-1">
                    <input value={form.background_image_url || ''} onChange={(e) => setForm({ ...form, background_image_url: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="URL gambar atau upload..." />
                  </div>
                  <label className={`px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition ${uploadingImage ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>
                    {uploadingImage ? (
                      <span className="animate-spin">⏳</span>
                    ) : (
                      <Upload size={14} />
                    )}
                    {uploadingImage ? 'Uploading...' : 'Upload'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                  </label>
                  {form.background_image_url && (
                    <button type="button" onClick={() => setForm({ ...form, background_image_url: '' })}
                      className="px-2 py-2.5 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 transition">
                      <X size={14} />
                    </button>
                  )}
                </div>
                {form.background_image_url && (
                  <div className="mt-2 relative w-full h-24 rounded-xl overflow-hidden border border-slate-100">
                    <img src={form.background_image_url} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-2">
                      <span className="text-[10px] text-white font-medium">Preview Background</span>
                    </div>
                  </div>
                )}
                <p className="text-[10px] text-slate-400 mt-1">Gambar background untuk kartu Doa Pilihan di halaman utama doa</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Sumber</label>
                  <input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="HR. Bukhari" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Kategori</label>
                  <div className="relative">
                    <input
                      value={categoryInput}
                      onChange={(e) => {
                        setCategoryInput(e.target.value);
                        setForm({ ...form, category: e.target.value });
                        setShowCategoryDropdown(true);
                      }}
                      onFocus={() => setShowCategoryDropdown(true)}
                      onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 200)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Pilih atau ketik kategori baru"
                    />
                    {showCategoryDropdown && (
                      <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {allCategories
                          .filter(c => c.toLowerCase().includes(categoryInput.toLowerCase()))
                          .map((c) => (
                            <button
                              key={c}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setCategoryInput(c);
                                setForm({ ...form, category: c });
                                setShowCategoryDropdown(false);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/5 hover:text-primary transition"
                            >
                              {c}
                            </button>
                          ))}
                        {categoryInput.trim() && !allCategories.some(c => c.toLowerCase() === categoryInput.toLowerCase()) && (
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setForm({ ...form, category: categoryInput.trim() });
                              setShowCategoryDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-green-600 font-semibold hover:bg-green-50 transition border-t border-slate-100"
                          >
                            ➕ Buat kategori baru: &quot;{categoryInput.trim()}&quot;
                          </button>
                        )}
                      </div>
                    )}
                  </div>
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
