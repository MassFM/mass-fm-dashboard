'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Poster, PosterCategory } from '@/types/database';
import {
  Camera, Trash2, Edit3, ArrowUp, ArrowDown, Save, X,
  Upload, Image as ImageIcon,
  Eye, EyeOff, Loader2, ChevronDown, Search,
  ToggleLeft, ToggleRight, Layers,
} from 'lucide-react';

export default function ManajemenPoster() {
  const [posters, setPosters] = useState<Poster[]>([]);
  const [categories, setCategories] = useState<PosterCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload form
  const [judul, setJudul] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editJudul, setEditJudul] = useState('');
  const [editCategoryId, setEditCategoryId] = useState<string>('');

  // Filters
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Stats
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    await Promise.all([fetchPosters(), fetchCategories()]);
    setLoading(false);
  }

  async function fetchPosters() {
    const { data, error } = await supabase
      .from('posters')
      .select('*, poster_categories(*)')
      .order('order_index', { ascending: true });
    if (!error && data) {
      setPosters(data);
      setStats({
        total: data.length,
        active: data.filter((p: Poster) => p.is_active !== false).length,
        inactive: data.filter((p: Poster) => p.is_active === false).length,
      });
    }
  }

  async function fetchCategories() {
    const { data } = await supabase
      .from('poster_categories')
      .select('*')
      .order('sort_order', { ascending: true });
    if (data) setCategories(data);
  }

  // ── Upload ──
  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return alert('Pilih gambar dulu, Akhi!');
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('posters').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('posters').getPublicUrl(fileName);
      const nextIndex = posters.length > 0 ? Math.max(...posters.map(p => p.order_index)) + 1 : 0;

      const insertData: Record<string, unknown> = {
        judul: judul.trim(),
        image_url: publicUrl,
        order_index: nextIndex,
        is_active: true,
      };
      if (selectedCategoryId) insertData.category_id = selectedCategoryId;

      const { error: dbError } = await supabase.from('posters').insert([insertData]);
      if (dbError) throw dbError;

      setJudul('');
      setFile(null);
      setSelectedCategoryId('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setShowUploadForm(false);
      fetchPosters();
    } catch (error: unknown) {
      alert('Error: ' + (error as Error).message);
    } finally {
      setUploading(false);
    }
  }

  // ── Delete ──
  async function handleDelete(id: string, imageUrl: string) {
    if (!confirm('Yakin ingin menghapus poster ini?')) return;
    try {
      const fileName = imageUrl.split('/').pop();
      if (fileName) await supabase.storage.from('posters').remove([fileName]);
      await supabase.from('posters').delete().eq('id', id);
      fetchPosters();
    } catch { alert('Gagal menghapus poster'); }
  }

  // ── Toggle Active ──
  async function togglePosterActive(poster: Poster) {
    await supabase.from('posters').update({ is_active: !poster.is_active }).eq('id', poster.id);
    fetchPosters();
  }

  // ── Bulk toggle ──
  async function bulkToggle(active: boolean) {
    const filtered = getFilteredPosters();
    if (filtered.length === 0) return;
    const msg = active
      ? `Aktifkan semua ${filtered.length} poster yang ditampilkan?`
      : `Nonaktifkan semua ${filtered.length} poster yang ditampilkan?`;
    if (!confirm(msg)) return;

    const ids = filtered.map(p => p.id);
    await supabase.from('posters').update({ is_active: active }).in('id', ids);
    fetchPosters();
  }

  // ── Reorder ──
  async function movePoster(index: number, direction: 'up' | 'down') {
    const filtered = getFilteredPosters();
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === filtered.length - 1) return;

    const poster = filtered[index];
    const target = filtered[direction === 'up' ? index - 1 : index + 1];

    // Swap order_index
    const tempOrder = poster.order_index;
    await supabase.from('posters').update({ order_index: target.order_index }).eq('id', poster.id);
    await supabase.from('posters').update({ order_index: tempOrder }).eq('id', target.id);
    fetchPosters();
  }

  // ── Update poster ──
  async function handleUpdate(id: string) {
    const updateData: Record<string, unknown> = { judul: editJudul.trim() };
    updateData.category_id = editCategoryId || null;
    await supabase.from('posters').update(updateData).eq('id', id);
    setEditingId(null);
    fetchPosters();
  }

  // ── Filter logic ──
  function getFilteredPosters() {
    return posters.filter(p => {
      if (filterCategory !== 'all') {
        if (filterCategory === 'uncategorized') {
          if (p.category_id) return false;
        } else if (p.category_id !== filterCategory) return false;
      }
      if (filterStatus === 'active' && p.is_active === false) return false;
      if (filterStatus === 'inactive' && p.is_active !== false) return false;
      if (searchQuery && !p.judul.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }

  const filteredPosters = getFilteredPosters();
  const getCategoryForPoster = (p: Poster) =>
    categories.find(c => c.id === p.category_id);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-800">Manajemen Poster Dakwah</h1>
          <p className="text-slate-500 text-sm mt-1">
            Kelola poster dakwah dengan kategori, aktifkan/nonaktifkan sesuai kebutuhan
          </p>
        </div>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-secondary transition-colors shadow-sm"
        >
          <Upload size={18} />
          Upload Poster
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <Layers size={20} className="text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
            <p className="text-xs text-slate-400">Total Poster</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
            <Eye size={20} className="text-green-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            <p className="text-xs text-slate-400">Aktif</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
            <EyeOff size={20} className="text-red-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-red-400">{stats.inactive}</p>
            <p className="text-xs text-slate-400">Nonaktif</p>
          </div>
        </div>
      </div>

      {/* Upload Form (collapsible) */}
      {showUploadForm && (
        <form onSubmit={handleUpload} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold uppercase text-slate-400">Upload Poster Baru</h2>
            <button type="button" onClick={() => setShowUploadForm(false)} className="text-slate-300 hover:text-slate-500">
              <X size={20} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Judul Poster</label>
                <input
                  type="text"
                  placeholder="Judul poster dakwah..."
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  className="w-full rounded-xl border-slate-200 focus:ring-primary focus:border-primary text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Kategori</label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full rounded-xl border-slate-200 focus:ring-primary focus:border-primary text-sm"
                >
                  <option value="">Tanpa Kategori</option>
                  {categories.filter(c => c.is_active).map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Gambar</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center relative hover:border-primary/40 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Camera size={24} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-xs text-slate-400">{file ? file.name : 'Klik untuk pilih gambar'}</p>
                </div>
              </div>
              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-secondary disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <><Loader2 size={18} className="animate-spin" /> Mengunggah...</>
                ) : (
                  <><Upload size={18} /> Publikasikan</>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-50">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
            <input
              type="text"
              placeholder="Cari poster..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border-slate-200 focus:ring-primary focus:border-primary text-sm"
            />
          </div>

          {/* Category filter */}
          <div className="relative">
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-sm text-slate-600 focus:ring-primary focus:border-primary"
            >
              <option value="all">Semua Kategori</option>
              <option value="uncategorized">Tanpa Kategori</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({posters.filter(p => p.category_id === cat.id).length})
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Status filter */}
          <div className="flex bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
            {(['all', 'active', 'inactive'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-2 text-xs font-semibold transition-colors ${
                  filterStatus === status
                    ? 'bg-primary text-white'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {status === 'all' ? 'Semua' : status === 'active' ? 'Aktif' : 'Nonaktif'}
              </button>
            ))}
          </div>

          {/* Bulk actions */}
          <div className="flex gap-1 ml-auto">
            <button
              onClick={() => bulkToggle(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-green-600 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
              title="Aktifkan semua yang ditampilkan"
            >
              <ToggleRight size={14} /> Aktifkan Semua
            </button>
            <button
              onClick={() => bulkToggle(false)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
              title="Nonaktifkan semua yang ditampilkan"
            >
              <ToggleLeft size={14} /> Nonaktifkan
            </button>
          </div>
        </div>
        <div className="mt-3 text-xs text-slate-400">
          Menampilkan <strong className="text-slate-600">{filteredPosters.length}</strong> dari {posters.length} poster
        </div>
      </div>

      {/* Poster Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-primary" />
        </div>
      ) : filteredPosters.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <ImageIcon size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-400 font-semibold">Tidak ada poster ditemukan</p>
          <p className="text-slate-300 text-sm mt-1">
            {posters.length === 0 ? 'Upload poster pertama Anda' : 'Coba ubah filter pencarian'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPosters.map((poster, index) => {
            const cat = getCategoryForPoster(poster);
            const isActive = poster.is_active !== false;

            return (
              <div
                key={poster.id}
                className={`bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex flex-col transition-all ${
                  !isActive ? 'opacity-50 grayscale' : 'hover:shadow-md'
                }`}
              >
                {/* Image */}
                <div className="aspect-video relative group">
                  <img src={poster.image_url} alt={poster.judul} className="w-full h-full object-cover" />

                  {/* Overlay controls */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => movePoster(index, 'up')}
                      disabled={index === 0}
                      className="p-2 bg-white rounded-full text-primary hover:bg-primary hover:text-white disabled:opacity-30 transition-colors"
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      onClick={() => movePoster(index, 'down')}
                      disabled={index === filteredPosters.length - 1}
                      className="p-2 bg-white rounded-full text-primary hover:bg-primary hover:text-white disabled:opacity-30 transition-colors"
                    >
                      <ArrowDown size={16} />
                    </button>
                  </div>

                  {/* Status badge */}
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() => togglePosterActive(poster)}
                      className={`p-1.5 rounded-full shadow-lg transition-colors ${
                        isActive
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : 'bg-red-400 text-white hover:bg-red-500'
                      }`}
                      title={isActive ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                    >
                      {isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                  </div>

                  {/* Category badge */}
                  {cat ? (
                    <div className="absolute top-2 left-2">
                      <span
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg"
                        style={{ backgroundColor: cat.color, color: 'white' }}
                      >
                        {cat.name}
                      </span>
                    </div>
                  ) : (
                    <div className="absolute top-2 left-2">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg bg-slate-500 text-white">
                        Tanpa Kategori
                      </span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col">
                  {editingId === poster.id ? (
                    <div className="space-y-3 mb-3">
                      <input
                        value={editJudul}
                        onChange={(e) => setEditJudul(e.target.value)}
                        className="w-full text-sm border-slate-200 rounded-lg p-2 focus:ring-primary focus:border-primary"
                        placeholder="Judul poster"
                      />
                      <select
                        value={editCategoryId}
                        onChange={(e) => setEditCategoryId(e.target.value)}
                        className="w-full text-sm border-slate-200 rounded-lg p-2 focus:ring-primary focus:border-primary"
                      >
                        <option value="">Tanpa Kategori</option>
                        {categories.filter(c => c.is_active).map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdate(poster.id!)}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-green-500 text-white text-xs font-semibold py-2 rounded-lg hover:bg-green-600 transition-colors"
                        >
                          <Save size={14} /> Simpan
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-2 text-xs font-semibold text-slate-400 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-slate-700 text-sm leading-snug line-clamp-2 flex-1">
                        {poster.judul}
                      </h3>
                      <button
                        onClick={() => {
                          setEditingId(poster.id!);
                          setEditJudul(poster.judul);
                          setEditCategoryId(poster.category_id || '');
                        }}
                        className="text-slate-300 hover:text-primary ml-2 shrink-0 transition-colors"
                      >
                        <Edit3 size={14} />
                      </button>
                    </div>
                  )}

                  <div className="mt-auto pt-3 border-t border-slate-50 flex justify-between items-center">
                    <span className="text-[10px] bg-slate-50 px-2 py-1 rounded-md text-slate-400 font-mono">
                      #{poster.order_index}
                    </span>
                    <button
                      onClick={() => handleDelete(poster.id!, poster.image_url)}
                      className="text-red-400 hover:bg-red-50 p-1.5 rounded-lg flex items-center gap-1 text-xs transition-colors"
                    >
                      <Trash2 size={14} />
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