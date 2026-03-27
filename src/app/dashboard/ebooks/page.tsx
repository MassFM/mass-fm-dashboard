'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Pencil, Trash2, Save, X, Search, Star, BookOpen, FileText, Download, Loader2, Image as ImageIcon, Tag, Eye, EyeOff, ArrowUpDown, Upload } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = (supabase as any);

interface EbookItem {
  id?: number;
  created_at?: string;
  updated_at?: string;
  title: string;
  author: string;
  description: string;
  kategori: string;
  thumbnail_url: string;
  file_url: string;
  total_pages: number;
  file_size_mb: number;
  download_count: number;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
}

const emptyForm: EbookItem = {
  title: '', author: '', description: '', kategori: '',
  thumbnail_url: '', file_url: '',
  total_pages: 0, file_size_mb: 0, download_count: 0,
  is_featured: false, is_active: true, sort_order: 0,
};

const DEFAULT_KATEGORI = [
  'Aqidah', 'Fiqih', 'Sirah', 'Tafsir', 'Hadits',
  'Akhlak', 'Doa', 'Tarbiyah', 'Umum',
];

type TabFilter = 'all' | 'active' | 'featured' | 'inactive';

const EBOOK_BUCKET = 'kajian-files';
let ebookBucketReady = false;

async function ensureEbookBucket() {
  if (ebookBucketReady) return;
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    if (buckets && !buckets.find(b => b.id === EBOOK_BUCKET)) {
      await supabase.storage.createBucket(EBOOK_BUCKET, {
        public: true,
        fileSizeLimit: 52428800,
        allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      });
    }
  } catch {
    // Bucket sudah dibuat via SQL — lanjutkan upload
  }
  ebookBucketReady = true;
}

export default function EbooksPage() {
  const [data, setData] = useState<EbookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<EbookItem>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [tabFilter, setTabFilter] = useState<TabFilter>('all');
  const [kategoriOptions, setKategoriOptions] = useState<string[]>(DEFAULT_KATEGORI);
  const [kategoriMode, setKategoriMode] = useState<'select' | 'add'>('select');
  const [newKategori, setNewKategori] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'title' | 'downloads'>('newest');
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // ── Fetch data ──

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: rows, error } = await db
      .from('ebooks')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && rows) {
      setData(rows);
      const fromDb = new Set<string>(
        rows.map((r: EbookItem) => r.kategori).filter(Boolean)
      );
      const merged = new Set([...DEFAULT_KATEGORI, ...fromDb]);
      setKategoriOptions([...merged].sort());
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Save ──

  const handleSave = async () => {
    if (!form.title.trim()) {
      alert('Judul ebook wajib diisi!');
      return;
    }
    if (!form.file_url.trim()) {
      alert('URL file PDF wajib diisi!');
      return;
    }
    setSaving(true);
    const payload = { ...form };
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;

    if (editingId) {
      await db.from('ebooks').update(payload).eq('id', editingId);
    } else {
      await db.from('ebooks').insert(payload);
    }
    setSaving(false);
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    fetchData();
  };

  // ── Delete ──

  const handleDelete = async (id: number) => {
    await db.from('ebooks').delete().eq('id', id);
    setDeletingId(null);
    fetchData();
  };

  // ── Toggle Active ──

  const toggleActive = async (item: EbookItem) => {
    await db.from('ebooks').update({ is_active: !item.is_active }).eq('id', item.id);
    fetchData();
  };

  // ── Toggle Featured ──

  const toggleFeatured = async (item: EbookItem) => {
    await db.from('ebooks').update({ is_featured: !item.is_featured }).eq('id', item.id);
    fetchData();
  };

  // ── Edit ──

  const startEdit = (item: EbookItem) => {
    setForm({ ...item });
    setEditingId(item.id!);
    setShowForm(true);
  };

  // ── Filter & Sort ──

  const filteredData = data
    .filter((item) => {
      if (tabFilter === 'active' && !item.is_active) return false;
      if (tabFilter === 'featured' && !item.is_featured) return false;
      if (tabFilter === 'inactive' && item.is_active) return false;
      if (search) {
        const q = search.toLowerCase();
        return item.title.toLowerCase().includes(q)
          || item.author.toLowerCase().includes(q)
          || item.kategori.toLowerCase().includes(q)
          || item.description.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'downloads') return (b.download_count || 0) - (a.download_count || 0);
      return 0; // newest — already sorted by created_at desc from DB
    });

  // ── Tab Counts ──

  const activeCount = data.filter(d => d.is_active).length;
  const featuredCount = data.filter(d => d.is_featured).length;
  const inactiveCount = data.filter(d => !d.is_active).length;

  // ── Stats ──

  const totalDownloads = data.reduce((sum, d) => sum + (d.download_count || 0), 0);
  const totalPages = data.reduce((sum, d) => sum + (d.total_pages || 0), 0);
  const totalSizeMb = data.reduce((sum, d) => sum + (d.file_size_mb || 0), 0);

  // ── Helper: format file size ──

  const formatSize = (mb: number) => {
    if (!mb) return '-';
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Ebook Islami</h1>
          <p className="text-sm text-gray-400 mt-1">
            Kelola koleksi ebook & pustaka digital Islami
          </p>
        </div>
        <button
          onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
        >
          <Plus size={18} /> Tambah Ebook
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Ebook</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{data.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Download</p>
          <p className="text-2xl font-bold text-teal-600 mt-1">{totalDownloads.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Halaman</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{totalPages.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Ukuran</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{formatSize(totalSizeMb)}</p>
        </div>
      </div>

      {/* Tab Filter + Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-100">
          {([
            { key: 'all' as TabFilter, label: 'Semua', count: data.length },
            { key: 'active' as TabFilter, label: 'Aktif', count: activeCount },
            { key: 'featured' as TabFilter, label: 'Featured', count: featuredCount },
            { key: 'inactive' as TabFilter, label: 'Nonaktif', count: inactiveCount },
          ]).map(t => (
            <button
              key={t.key}
              onClick={() => setTabFilter(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tabFilter === t.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari judul, penulis, kategori..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as typeof sortBy)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="newest">Terbaru</option>
          <option value="title">Judul A-Z</option>
          <option value="downloads">Download Terbanyak</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : filteredData.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <BookOpen size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold">Belum ada ebook</p>
          <p className="text-sm">Klik &quot;Tambah Ebook&quot; untuk menambahkan koleksi</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredData.map(item => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all">
              <div className="flex">
                {/* Cover thumbnail */}
                <div className="w-32 min-h-[140px] bg-gradient-to-br from-teal-50 to-emerald-50 flex-shrink-0 flex items-center justify-center">
                  {item.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen size={32} className="text-teal-300" />
                  )}
                </div>
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Badges */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {item.kategori && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-700">
                            <Tag size={10} className="inline mr-1" />
                            {item.kategori}
                          </span>
                        )}
                        {item.is_featured && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700">
                            <Star size={10} className="inline mr-1" />Featured
                          </span>
                        )}
                        {!item.is_active && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-50 text-red-500">
                            Nonaktif
                          </span>
                        )}
                      </div>

                      {/* Title & Author */}
                      <h3 className="font-bold text-gray-800 text-sm">{item.title}</h3>
                      {item.author && (
                        <p className="text-xs text-gray-500 mt-0.5">{item.author}</p>
                      )}

                      {/* Description preview */}
                      {item.description && (
                        <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">{item.description}</p>
                      )}

                      {/* Meta */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-400">
                        {item.total_pages > 0 && (
                          <span className="flex items-center gap-1">
                            <FileText size={12} /> {item.total_pages} halaman
                          </span>
                        )}
                        {item.file_size_mb > 0 && (
                          <span className="flex items-center gap-1">
                            <ArrowUpDown size={12} /> {formatSize(item.file_size_mb)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Download size={12} /> {item.download_count || 0} download
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 ml-3 flex-shrink-0">
                      <button
                        onClick={() => toggleFeatured(item)}
                        title={item.is_featured ? 'Hapus featured' : 'Jadikan featured'}
                        className={`p-2 rounded-lg transition-all ${
                          item.is_featured
                            ? 'bg-amber-50 text-amber-500 hover:bg-amber-100'
                            : 'hover:bg-gray-50 text-gray-300 hover:text-amber-500'
                        }`}
                      >
                        <Star size={15} />
                      </button>
                      <button
                        onClick={() => toggleActive(item)}
                        title={item.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        className={`p-2 rounded-lg transition-all ${
                          item.is_active
                            ? 'hover:bg-gray-50 text-gray-400 hover:text-green-500'
                            : 'bg-red-50 text-red-400 hover:bg-red-100'
                        }`}
                      >
                        {item.is_active ? <Eye size={15} /> : <EyeOff size={15} />}
                      </button>
                      <button onClick={() => startEdit(item)}
                        className="p-2 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-primary transition-all">
                        <Pencil size={15} />
                      </button>
                      {deletingId === item.id ? (
                        <div className="flex gap-1">
                          <button onClick={() => handleDelete(item.id!)}
                            className="px-2 py-1 text-[10px] bg-red-500 text-white rounded-lg font-bold">
                            Ya
                          </button>
                          <button onClick={() => setDeletingId(null)}
                            className="px-2 py-1 text-[10px] bg-gray-200 text-gray-600 rounded-lg font-bold">
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setDeletingId(item.id!)}
                          className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ FORM MODAL ═══ */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl my-8">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                {editingId ? 'Edit Ebook' : 'Tambah Ebook Baru'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Judul */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Judul Ebook *</label>
                <input type="text" value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Riyadhus Shalihin" />
              </div>

              {/* Penulis */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Penulis / Author</label>
                <input type="text" value={form.author}
                  onChange={e => setForm({ ...form, author: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Imam An-Nawawi" />
              </div>

              {/* Kategori */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Kategori</label>
                {kategoriMode === 'select' ? (
                  <div className="flex gap-2">
                    <select value={form.kategori}
                      onChange={e => setForm({ ...form, kategori: e.target.value })}
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary">
                      <option value="">— Pilih Kategori —</option>
                      {kategoriOptions.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                    <button onClick={() => setKategoriMode('add')}
                      className="px-3 py-2 border border-dashed border-gray-300 rounded-xl text-xs text-gray-500 hover:border-primary hover:text-primary transition-all">
                      + Baru
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input type="text" value={newKategori}
                      onChange={e => setNewKategori(e.target.value)}
                      placeholder="Nama kategori baru"
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm" />
                    <button onClick={() => {
                      if (newKategori.trim()) {
                        setKategoriOptions(prev => [...new Set([...prev, newKategori.trim()])].sort());
                        setForm({ ...form, kategori: newKategori.trim() });
                        setNewKategori('');
                      }
                      setKategoriMode('select');
                    }} className="px-3 py-2 bg-primary text-white rounded-xl text-xs font-bold">Simpan</button>
                    <button onClick={() => { setKategoriMode('select'); setNewKategori(''); }}
                      className="px-3 py-2 bg-gray-100 text-gray-500 rounded-xl text-xs font-bold">Batal</button>
                  </div>
                )}
              </div>

              {/* File PDF */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  <FileText size={12} className="inline mr-1" /> File PDF Ebook *
                </label>
                {form.file_url ? (
                  <div className="flex items-center gap-2 p-2.5 bg-green-50 border border-green-200 rounded-xl">
                    <FileText size={18} className="text-green-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-green-700 truncate">
                        {form.file_url.split('/').pop()?.split('?')[0] || 'file.pdf'}
                      </p>
                      <a href={form.file_url} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] text-green-500 hover:text-green-700 underline truncate block">
                        Lihat file
                      </a>
                    </div>
                    <button type="button" onClick={async () => {
                      if (!confirm('Hapus file PDF ini?')) return;
                      try {
                        const url = new URL(form.file_url);
                        const pathParts = url.pathname.split('/storage/v1/object/public/');
                        if (pathParts.length > 1) {
                          const fullPath = pathParts[1];
                          const bucketAndPath = fullPath.split('/');
                          const bucket = bucketAndPath[0];
                          const filePath = bucketAndPath.slice(1).join('/');
                          await supabase.storage.from(bucket).remove([filePath]);
                        }
                      } catch {}
                      setForm(prev => ({ ...prev, file_url: '', file_size_mb: 0 }));
                    }}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="relative mb-2">
                      <input
                        type="file"
                        accept=".pdf"
                        disabled={uploadingPdf}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (!file.name.toLowerCase().endsWith('.pdf')) {
                            alert('Hanya file PDF yang diizinkan');
                            return;
                          }
                          if (file.size > 50 * 1024 * 1024) {
                            alert('Ukuran file maksimal 50MB');
                            return;
                          }
                          setUploadingPdf(true);
                          try {
                            await ensureEbookBucket();
                            const timestamp = Date.now();
                            const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                            const filePath = `ebook-pdf/${timestamp}_${safeName}`;
                            const { error: uploadError } = await supabase.storage
                              .from(EBOOK_BUCKET)
                              .upload(filePath, file, { cacheControl: '31536000', upsert: false });
                            if (uploadError) throw uploadError;
                            const { data: urlData } = supabase.storage
                              .from(EBOOK_BUCKET)
                              .getPublicUrl(filePath);
                            const sizeMb = parseFloat((file.size / (1024 * 1024)).toFixed(2));
                            setForm(prev => ({ ...prev, file_url: urlData.publicUrl, file_size_mb: sizeMb }));
                          } catch (err: unknown) {
                            const msg = err instanceof Error ? err.message : String(err);
                            alert('Gagal upload PDF: ' + msg);
                          } finally {
                            setUploadingPdf(false);
                            e.target.value = '';
                          }
                        }}
                        className="hidden"
                        id="ebook-upload-pdf"
                      />
                      <label htmlFor="ebook-upload-pdf"
                        className={`flex items-center justify-center gap-2 w-full px-3 py-3 border-2 border-dashed rounded-xl text-sm cursor-pointer transition-colors ${
                          uploadingPdf
                            ? 'border-green-300 bg-green-50 text-green-400'
                            : 'border-gray-200 hover:border-green-300 hover:bg-green-50 text-gray-400 hover:text-green-500'
                        }`}>
                        {uploadingPdf ? (
                          <><Loader2 size={16} className="animate-spin" /> Mengupload PDF...</>
                        ) : (
                          <><Upload size={16} /> Upload File PDF</>
                        )}
                      </label>
                    </div>
                    <input type="url" value={form.file_url}
                      onChange={e => setForm({ ...form, file_url: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder="Atau masukkan URL file PDF: https://..." />
                  </div>
                )}
              </div>

              {/* Cover / Thumbnail */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  <ImageIcon size={12} className="inline mr-1" /> Cover / Thumbnail
                </label>
                {form.thumbnail_url ? (
                  <div className="flex items-center gap-3 p-2.5 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="w-16 h-20 rounded-lg overflow-hidden bg-white border border-blue-100 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={form.thumbnail_url} alt="cover" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-blue-700 truncate">
                        {form.thumbnail_url.split('/').pop()?.split('?')[0] || 'cover'}
                      </p>
                      <a href={form.thumbnail_url} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] text-blue-500 hover:text-blue-700 underline truncate block">
                        Lihat gambar
                      </a>
                    </div>
                    <button type="button" onClick={async () => {
                      if (!confirm('Hapus cover ini?')) return;
                      try {
                        const url = new URL(form.thumbnail_url);
                        const pathParts = url.pathname.split('/storage/v1/object/public/');
                        if (pathParts.length > 1) {
                          const fullPath = pathParts[1];
                          const bucketAndPath = fullPath.split('/');
                          const bucket = bucketAndPath[0];
                          const filePath = bucketAndPath.slice(1).join('/');
                          await supabase.storage.from(bucket).remove([filePath]);
                        }
                      } catch {}
                      setForm(prev => ({ ...prev, thumbnail_url: '' }));
                    }}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="relative mb-2">
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingCover}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (!file.type.startsWith('image/')) {
                            alert('Hanya file gambar yang diizinkan');
                            return;
                          }
                          if (file.size > 10 * 1024 * 1024) {
                            alert('Ukuran gambar maksimal 10MB');
                            return;
                          }
                          setUploadingCover(true);
                          try {
                            await ensureEbookBucket();
                            const timestamp = Date.now();
                            const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
                            const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.[^.]+$/, '');
                            const filePath = `ebook-covers/${timestamp}_${safeName}.${ext}`;
                            const { error: uploadError } = await supabase.storage
                              .from(EBOOK_BUCKET)
                              .upload(filePath, file, { cacheControl: '31536000', upsert: false });
                            if (uploadError) throw uploadError;
                            const { data: urlData } = supabase.storage
                              .from(EBOOK_BUCKET)
                              .getPublicUrl(filePath);
                            setForm(prev => ({ ...prev, thumbnail_url: urlData.publicUrl }));
                          } catch (err: unknown) {
                            const msg = err instanceof Error ? err.message : String(err);
                            alert('Gagal upload cover: ' + msg);
                          } finally {
                            setUploadingCover(false);
                            e.target.value = '';
                          }
                        }}
                        className="hidden"
                        id="ebook-upload-cover"
                      />
                      <label htmlFor="ebook-upload-cover"
                        className={`flex items-center justify-center gap-2 w-full px-3 py-3 border-2 border-dashed rounded-xl text-sm cursor-pointer transition-colors ${
                          uploadingCover
                            ? 'border-blue-300 bg-blue-50 text-blue-400'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-400 hover:text-blue-500'
                        }`}>
                        {uploadingCover ? (
                          <><Loader2 size={16} className="animate-spin" /> Mengupload Cover...</>
                        ) : (
                          <><Upload size={16} /> Upload Cover / Thumbnail</>
                        )}
                      </label>
                    </div>
                    <input type="url" value={form.thumbnail_url}
                      onChange={e => setForm({ ...form, thumbnail_url: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder="Atau masukkan URL gambar: https://..." />
                  </div>
                )}
              </div>

              {/* Deskripsi */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Deskripsi</label>
                <textarea rows={4} value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Ringkasan isi ebook..." />
              </div>

              {/* Total Pages & File Size */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Total Halaman</label>
                  <input type="number" min="0" value={form.total_pages || ''}
                    onChange={e => setForm({ ...form, total_pages: parseInt(e.target.value) || 0 })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="0" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Ukuran File (MB)</label>
                  <input type="number" min="0" step="0.01" value={form.file_size_mb || ''}
                    onChange={e => setForm({ ...form, file_size_mb: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="0.00" />
                </div>
              </div>

              {/* Flags */}
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.is_featured}
                    onChange={e => setForm({ ...form, is_featured: e.target.checked })}
                    className="w-4 h-4 rounded text-primary focus:ring-primary" />
                  <Star size={14} className="text-amber-500" /> Featured (highlight)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.is_active}
                    onChange={e => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4 rounded text-primary focus:ring-primary" />
                  Aktif (tampil di aplikasi)
                </label>
              </div>

              {/* Sort Order */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Sort Order</label>
                <input type="number" value={form.sort_order}
                  onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                  className="w-24 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                <p className="text-[10px] text-gray-400 mt-1">Angka lebih kecil tampil lebih atas</p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}
                className="px-5 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 rounded-xl transition-all">
                Batal
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {editingId ? 'Simpan Perubahan' : 'Tambah Ebook'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
