'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { BookOpen, Plus, Edit2, Trash2, Search, ToggleLeft, ToggleRight, X, Upload, Star, Eye, FileText, Globe, RefreshCw, Check, XCircle, ExternalLink, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';

// ═══════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════

interface PendingMaterial {
  id: string;
  source_url: string;
  source_site: string;
  raw_title: string;
  raw_content: string;
  status: 'draft' | 'reviewed' | 'published' | 'rejected';
  category: string;
  language: string;
  notes: string;
  published_id: string | null;
  created_at: string;
  updated_at: string;
}

interface WPNotes {
  wp_id?: number;
  wp_date?: string;
  wp_author?: string;
  wp_thumbnail?: string;
  wp_categories?: string[];
}

interface MimbarMaterial {
  id?: string;
  title: string;
  content_html: string;
  excerpt: string;
  author: string;
  category: string;
  language: string;
  reading_time_minutes: number;
  thumbnail_url: string;
  pdf_url: string;
  source_url: string;
  tags: string[];
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  view_count?: number;
  created_at?: string;
}

const CATEGORIES = [
  { value: 'khutbah_jumat', label: 'Khutbah Jum\'at', emoji: '🕌' },
  { value: 'kultum', label: 'Kultum', emoji: '📖' },
  { value: 'khutbah_idul_fitri', label: 'Khutbah Idul Fitri', emoji: '🌙' },
  { value: 'khutbah_idul_adha', label: 'Khutbah Idul Adha', emoji: '🐑' },
  { value: 'tausyiah', label: 'Tausyiah', emoji: '💬' },
];

const LANGUAGES = [
  { code: 'id', label: 'Indonesia', flag: '🇮🇩' },
  { code: 'jv', label: 'Basa Jawa', flag: '🏛️' },
];

const getCategoryLabel = (v: string) => CATEGORIES.find(c => c.value === v)?.label ?? v;
const getCategoryEmoji = (v: string) => CATEGORIES.find(c => c.value === v)?.emoji ?? '📄';
const getLanguageLabel = (c: string) => LANGUAGES.find(l => l.code === c)?.label ?? c;
const getLanguageFlag = (c: string) => LANGUAGES.find(l => l.code === c)?.flag ?? '';

const DEFAULT_FORM: MimbarMaterial = {
  title: '', content_html: '', excerpt: '', author: '', category: 'khutbah_jumat',
  language: 'id', reading_time_minutes: 5, thumbnail_url: '', pdf_url: '',
  source_url: '', tags: [], is_featured: false, is_active: true, sort_order: 0,
};

// ═══════════════════════════════════════════════
//  HELPER FUNCTIONS
// ═══════════════════════════════════════════════

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function generateExcerpt(html: string, maxLen = 150): string {
  const plain = stripHtml(html);
  if (plain.length <= maxLen) return plain;
  return plain.substring(0, maxLen).replace(/\s+\S*$/, '') + '...';
}

function calcReadingTime(html: string): number {
  const wordCount = stripHtml(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(wordCount / 200));
}

function parseNotes(notes: string): WPNotes {
  try { return JSON.parse(notes); } catch { return {}; }
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  } catch { return dateStr; }
}

// ═══════════════════════════════════════════════
//  MAIN PAGE — Tab Bar
// ═══════════════════════════════════════════════

export default function MimbarPage() {
  const [activeTab, setActiveTab] = useState<'materi' | 'import'>('materi');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-900 rounded-xl flex items-center justify-center">
              <BookOpen className="text-white" size={20} />
            </div>
            Mimbar
          </h1>
          <p className="text-slate-400 text-sm mt-1">Kelola materi khutbah, kultum & tausyiah</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        <button
          onClick={() => setActiveTab('materi')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
            activeTab === 'materi'
              ? 'bg-white text-primary shadow-sm'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <BookOpen size={16} />
          Materi
        </button>
        <button
          onClick={() => setActiveTab('import')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
            activeTab === 'import'
              ? 'bg-white text-primary shadow-sm'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Globe size={16} />
          Import WordPress
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'materi' ? <MateriTab /> : <ImportTab />}
    </div>
  );
}

// ═══════════════════════════════════════════════
//  TAB 1: MATERI (existing functionality)
// ═══════════════════════════════════════════════

function MateriTab() {
  const [list, setList] = useState<MimbarMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('Semua');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<MimbarMaterial>({ ...DEFAULT_FORM });
  const [tagsInput, setTagsInput] = useState('');
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('mimbar_materials')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
    setList(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetForm = () => { setForm({ ...DEFAULT_FORM }); setEditId(null); setTagsInput(''); };

  const openAdd = () => { resetForm(); setShowModal(true); };

  const openEdit = (item: MimbarMaterial) => {
    setForm(item);
    setEditId(item.id || null);
    setTagsInput((item.tags || []).join(', '));
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return alert('Judul wajib diisi');
    const payload = {
      title: form.title,
      content_html: form.content_html,
      excerpt: form.excerpt,
      author: form.author || 'Anonim',
      category: form.category,
      language: form.language,
      reading_time_minutes: form.reading_time_minutes,
      thumbnail_url: form.thumbnail_url,
      pdf_url: form.pdf_url,
      source_url: form.source_url,
      tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      is_featured: form.is_featured,
      is_active: form.is_active,
      sort_order: form.sort_order,
    };
    if (editId) {
      await supabase.from('mimbar_materials').update(payload as any).eq('id', editId);
    } else {
      await supabase.from('mimbar_materials').insert(payload as any);
    }
    setShowModal(false);
    resetForm();
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus materi ini?')) return;
    await supabase.from('mimbar_materials').delete().eq('id', id);
    fetchData();
  };

  const toggleActive = async (item: MimbarMaterial) => {
    await supabase.from('mimbar_materials').update({ is_active: !item.is_active } as any).eq('id', item.id!);
    fetchData();
  };

  const toggleFeatured = async (item: MimbarMaterial) => {
    await supabase.from('mimbar_materials').update({ is_featured: !item.is_featured } as any).eq('id', item.id!);
    fetchData();
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { alert('File harus PDF'); return; }
    if (file.size > 20 * 1024 * 1024) { alert('Ukuran file maksimal 20MB'); return; }
    setUploadingPdf(true);
    try {
      const fileName = `mimbar-pdf-${Date.now()}.pdf`;
      const { error } = await supabase.storage.from('mimbar').upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (error) { alert('Gagal upload: ' + error.message); return; }
      const { data: urlData } = supabase.storage.from('mimbar').getPublicUrl(fileName);
      setForm({ ...form, pdf_url: urlData.publicUrl });
    } catch { alert('Gagal upload PDF'); }
    finally { setUploadingPdf(false); }
  };

  const handleThumbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('File harus gambar'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('Ukuran file maksimal 5MB'); return; }
    setUploadingThumb(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `mimbar-thumb-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('mimbar').upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (error) { alert('Gagal upload: ' + error.message); return; }
      const { data: urlData } = supabase.storage.from('mimbar').getPublicUrl(fileName);
      setForm({ ...form, thumbnail_url: urlData.publicUrl });
    } catch { alert('Gagal upload gambar'); }
    finally { setUploadingThumb(false); }
  };

  // Filtered
  const filtered = list.filter((item) => {
    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.author.toLowerCase().includes(search.toLowerCase()) ||
      item.excerpt.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === 'Semua' || item.category === filterCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filter + Add button */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-4 flex-wrap flex-1">
          <div className="flex-1 min-w-[250px] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari materi..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['Semua', ...CATEGORIES.map(c => c.value)].map((cat) => {
              const catCount = cat === 'Semua' ? list.length : list.filter(d => d.category === cat).length;
              const label = cat === 'Semua' ? 'Semua' : getCategoryLabel(cat);
              return (
                <button key={cat} onClick={() => setFilterCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                    filterCategory === cat
                      ? 'bg-primary text-white shadow' : 'bg-white text-slate-400 hover:bg-slate-50'
                  }`}>
                  {cat !== 'Semua' && <span>{getCategoryEmoji(cat)}</span>}
                  {label}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filterCategory === cat ? 'bg-white/20' : 'bg-slate-100'}`}>{catCount}</span>
                </button>
              );
            })}
          </div>
        </div>
        <button onClick={openAdd}
          className="bg-gradient-to-r from-primary to-purple-900 text-white px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition shadow-lg shadow-primary/20 whitespace-nowrap">
          <Plus size={16} /> Tambah Materi
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-50">
          <p className="text-2xl font-bold text-primary">{list.length}</p>
          <p className="text-xs text-slate-400">Total Materi</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-50">
          <p className="text-2xl font-bold text-green-500">{list.filter(d => d.is_active).length}</p>
          <p className="text-xs text-slate-400">Aktif</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-amber-50">
          <p className="text-2xl font-bold text-amber-500">{list.filter(d => d.is_featured).length}</p>
          <p className="text-xs text-slate-400">Featured</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-blue-50">
          <p className="text-2xl font-bold text-blue-500">{list.filter(d => d.language === 'jv').length}</p>
          <p className="text-xs text-slate-400">Basa Jawa</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-50">
          <p className="text-2xl font-bold text-slate-300">{list.reduce((a, b) => a + (b.view_count || 0), 0)}</p>
          <p className="text-xs text-slate-400">Total Views</p>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-20 text-slate-300">Memuat...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-300">Belum ada materi</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-5 border border-slate-50 hover:shadow-md transition">
              <div className="flex items-start gap-4">
                {/* Thumbnail */}
                <div className="w-14 h-16 bg-gradient-to-br from-primary/10 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {item.thumbnail_url ? (
                    <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <span className="text-2xl">{getCategoryEmoji(item.category)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm text-slate-700">{item.title}</h3>
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-semibold rounded-full">
                      {getCategoryLabel(item.category)}
                    </span>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-500 text-[10px] font-semibold rounded-full">
                      {getLanguageFlag(item.language)} {getLanguageLabel(item.language)}
                    </span>
                    {item.is_featured && (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-500 text-[10px] font-semibold rounded-full flex items-center gap-0.5">
                        <Star size={8} /> Featured
                      </span>
                    )}
                    {!item.is_active && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-400 text-[10px] font-semibold rounded-full">Non-Aktif</span>
                    )}
                    {item.pdf_url && (
                      <span className="px-2 py-0.5 bg-red-50 text-red-400 text-[10px] font-semibold rounded-full flex items-center gap-0.5">
                        <FileText size={8} /> PDF
                      </span>
                    )}
                    {item.source_url && item.source_url.includes('khotbahjumat.com') && (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-500 text-[10px] font-semibold rounded-full flex items-center gap-0.5">
                        <Globe size={8} /> khotbahjumat.com
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    ✍️ {item.author || 'Anonim'} · ⏱️ {item.reading_time_minutes} mnt · 👁️ {item.view_count || 0} views
                  </p>
                  {item.excerpt && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">{item.excerpt}</p>
                  )}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {item.tags.map((tag, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-slate-50 text-slate-400 text-[9px] rounded"># {tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => toggleFeatured(item)}
                    title={item.is_featured ? 'Unfeature' : 'Feature'}
                    className={`p-2 rounded-lg transition ${item.is_featured ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-300 hover:text-amber-400'}`}>
                    <Star size={15} />
                  </button>
                  <button onClick={() => toggleActive(item)}
                    title={item.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    className={`p-2 rounded-lg transition ${item.is_active ? 'bg-green-50 text-green-500' : 'bg-slate-50 text-slate-300'}`}>
                    {item.is_active ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                  </button>
                  <button onClick={() => openEdit(item)}
                    className="p-2 rounded-lg bg-blue-50 text-blue-400 hover:bg-blue-100 transition">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => handleDelete(item.id!)}
                    className="p-2 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 transition">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-8 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-700">
                {editId ? 'Edit Materi' : 'Tambah Materi Baru'}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm(); }}
                className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 transition">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Title */}
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Judul *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Judul khutbah / kultum / tausyiah" />
              </div>

              {/* Category + Language row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Kategori</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white">
                    {CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Bahasa</label>
                  <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white">
                    {LANGUAGES.map(l => (
                      <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Author + Reading time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Penulis</label>
                  <input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Nama penulis / ustadz" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Waktu Baca (menit)</label>
                  <input type="number" value={form.reading_time_minutes}
                    onChange={(e) => setForm({ ...form, reading_time_minutes: parseInt(e.target.value) || 5 })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    min={1} max={60} />
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Ringkasan / Excerpt</label>
                <textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Ringkasan singkat materi..." rows={2} />
              </div>

              {/* Content - Rich Text Editor */}
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Konten</label>
                <RichTextEditor
                  content={form.content_html}
                  onChange={(html) => setForm({ ...form, content_html: html })}
                  placeholder="Tulis isi khutbah / kultum / tausyiah di sini..."
                />
              </div>

              {/* Tags */}
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Tags (pisahkan koma)</label>
                <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="sabar, taubat, sedekah" />
              </div>

              {/* PDF Upload */}
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">File PDF</label>
                <div className="flex items-center gap-3">
                  <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-200 text-sm cursor-pointer hover:bg-slate-50 transition ${uploadingPdf ? 'opacity-50' : ''}`}>
                    <Upload size={14} className="text-slate-400" />
                    <span className="text-slate-500">{uploadingPdf ? 'Mengupload...' : 'Upload PDF'}</span>
                    <input type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} disabled={uploadingPdf} />
                  </label>
                  {form.pdf_url && (
                    <div className="flex items-center gap-2">
                      <a href={form.pdf_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                        <FileText size={12} /> Lihat PDF
                      </a>
                      <button onClick={() => setForm({ ...form, pdf_url: '' })} className="text-red-400 hover:text-red-600">
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Thumbnail Upload */}
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Thumbnail</label>
                <div className="flex items-center gap-3">
                  <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-200 text-sm cursor-pointer hover:bg-slate-50 transition ${uploadingThumb ? 'opacity-50' : ''}`}>
                    <Upload size={14} className="text-slate-400" />
                    <span className="text-slate-500">{uploadingThumb ? 'Mengupload...' : 'Upload Gambar'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleThumbUpload} disabled={uploadingThumb} />
                  </label>
                  {form.thumbnail_url && (
                    <div className="flex items-center gap-2">
                      <img src={form.thumbnail_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      <button onClick={() => setForm({ ...form, thumbnail_url: '' })} className="text-red-400 hover:text-red-600">
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Source URL + Sort Order */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">URL Sumber (opsional)</label>
                  <input value={form.source_url} onChange={(e) => setForm({ ...form, source_url: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="https://..." />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Urutan</label>
                  <input type="number" value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-200 text-primary focus:ring-primary/20" />
                  <span className="text-sm text-slate-600">Aktif</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_featured}
                    onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-200 text-primary focus:ring-primary/20" />
                  <span className="text-sm text-slate-600">Featured (Pilihan Utama)</span>
                </label>
              </div>
            </div>
            {/* Footer */}
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => { setShowModal(false); resetForm(); }}
                className="px-5 py-2.5 rounded-xl text-sm text-slate-500 hover:bg-slate-50 transition">
                Batal
              </button>
              <button onClick={handleSave}
                className="bg-gradient-to-r from-primary to-purple-900 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition shadow-lg shadow-primary/20">
                {editId ? 'Simpan Perubahan' : 'Tambah Materi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
//  TAB 2: IMPORT WORDPRESS
// ═══════════════════════════════════════════════

function ImportTab() {
  const [pending, setPending] = useState<PendingMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [pendingPage, setPendingPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  const [previewItem, setPreviewItem] = useState<PendingMaterial | null>(null);
  const [approveItem, setApproveItem] = useState<PendingMaterial | null>(null);
  const [approveForm, setApproveForm] = useState({
    title: '',
    category: 'khutbah_jumat',
    language: 'id',
    author: '',
    thumbnail_url: '',
  });
  const [approving, setApproving] = useState(false);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('pending_materials')
      .select('*')
      .eq('source_site', 'khotbahjumat.com')
      .order('created_at', { ascending: false });
    setPending((data as PendingMaterial[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  // ── Sync from WordPress ──
  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    setSyncProgress(null);
    try {
      let totalSynced = 0;
      let totalSkipped = 0;
      let totalWp = 0;
      let totalPages = 1;

      for (let page = 1; page <= totalPages; page++) {
        setSyncProgress(`⏳ Mengambil halaman ${page}/${totalPages} dari WordPress...`);

        // 1) Fetch posts dari WP via API route (server-side, bypass CORS)
        const res = await fetch('/api/mimbar/wp-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ page, per_page: 100 }),
        });
        const result = await res.json();

        if (!res.ok) {
          setSyncResult(`❌ Error: ${result.error}${result.detail ? ` — ${result.detail}` : ''}`);
          break;
        }

        totalWp = result.total_wp;
        totalPages = result.total_pages;
        const rows = result.rows || [];

        if (!rows.length) continue;

        setSyncProgress(`⏳ Menyimpan halaman ${page}/${totalPages} (${rows.length} artikel)...`);

        // 2) Upsert ke Supabase dari client (pakai session authenticated)
        const { data, error } = await supabase
          .from('pending_materials')
          .upsert(rows, {
            onConflict: 'source_url',
            ignoreDuplicates: true,
          })
          .select('id');

        if (error) {
          setSyncResult(`❌ Supabase error: ${error.message}`);
          break;
        }

        const synced = data?.length || 0;
        totalSynced += synced;
        totalSkipped += rows.length - synced;
      }

      setSyncProgress(null);
      setSyncResult(
        totalSynced > 0
          ? `✅ Berhasil mengimpor ${totalSynced} artikel baru (${totalSkipped} sudah ada). Total di WP: ${totalWp}`
          : `ℹ️ Semua artikel sudah ada di database. Total di WP: ${totalWp}`
      );
      fetchPending();
    } catch (err: any) {
      setSyncProgress(null);
      setSyncResult(`❌ Gagal sync: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  // ── Reject ──
  const handleReject = async (item: PendingMaterial) => {
    if (!confirm(`Tolak artikel:\n"${item.raw_title}"?`)) return;
    await supabase
      .from('pending_materials')
      .update({ status: 'rejected', updated_at: new Date().toISOString() } as any)
      .eq('id', item.id);
    fetchPending();
  };

  // ── Restore to draft ──
  const handleRestoreDraft = async (item: PendingMaterial) => {
    await supabase
      .from('pending_materials')
      .update({ status: 'draft', updated_at: new Date().toISOString() } as any)
      .eq('id', item.id);
    fetchPending();
  };

  // ── Open approve modal ──
  const openApproveModal = (item: PendingMaterial) => {
    const notes = parseNotes(item.notes);
    setApproveItem(item);
    setApproveForm({
      title: item.raw_title,
      category: item.category || 'khutbah_jumat',
      language: item.language || 'id',
      author: notes.wp_author || 'Anonim',
      thumbnail_url: notes.wp_thumbnail || '',
    });
  };

  // ── Approve & publish ──
  const handleApprove = async () => {
    if (!approveItem) return;
    if (!approveForm.title.trim()) return alert('Judul wajib diisi');

    setApproving(true);
    try {
      const content = approveItem.raw_content;
      const excerpt = generateExcerpt(content);
      const readingTime = calcReadingTime(content);

      // Insert ke mimbar_materials
      const { data: inserted, error: insertError } = await supabase
        .from('mimbar_materials')
        .insert({
          title: approveForm.title,
          content_html: content,
          excerpt,
          author: approveForm.author || 'Anonim',
          category: approveForm.category,
          language: approveForm.language,
          reading_time_minutes: readingTime,
          thumbnail_url: approveForm.thumbnail_url,
          source_url: approveItem.source_url,
          tags: ['khotbahjumat.com'],
          is_active: true,
          is_featured: false,
          sort_order: 0,
        } as any)
        .select('id')
        .single();

      if (insertError) {
        alert('Gagal publish: ' + insertError.message);
        return;
      }

      // Update pending_materials status
      await supabase
        .from('pending_materials')
        .update({
          status: 'published',
          published_id: inserted.id,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', approveItem.id);

      setApproveItem(null);
      fetchPending();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setApproving(false);
    }
  };

  // ── Filter ──
  const filteredPending = pending.filter((item) =>
    filterStatus === 'all' ? true : item.status === filterStatus
  );

  // Pagination
  const totalFilteredPages = Math.ceil(filteredPending.length / ITEMS_PER_PAGE);
  const paginatedPending = filteredPending.slice(
    (pendingPage - 1) * ITEMS_PER_PAGE,
    pendingPage * ITEMS_PER_PAGE
  );

  const statusCounts = {
    all: pending.length,
    draft: pending.filter(p => p.status === 'draft').length,
    published: pending.filter(p => p.status === 'published').length,
    rejected: pending.filter(p => p.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      {/* Sync Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <Globe size={18} className="text-primary" />
              Import dari khotbahjumat.com
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Sinkronkan artikel khutbah dari WordPress khotbahjumat.com ke antrian review
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition shadow-lg ${
              syncing
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:opacity-90 shadow-emerald-200'
            }`}
          >
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Menyinkronkan...' : 'Sync dari WordPress'}
          </button>
        </div>
        {syncProgress && (
          <div className="mt-4 px-4 py-3 rounded-xl text-sm bg-amber-50 text-amber-700 flex items-center gap-2">
            <RefreshCw size={14} className="animate-spin" />
            {syncProgress}
          </div>
        )}
        {syncResult && (
          <div className={`mt-4 px-4 py-3 rounded-xl text-sm ${
            syncResult.startsWith('✅') ? 'bg-emerald-50 text-emerald-700' :
            syncResult.startsWith('❌') ? 'bg-red-50 text-red-700' :
            'bg-blue-50 text-blue-700'
          }`}>
            {syncResult}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { key: 'all', label: 'Total Import', color: 'text-slate-700', bg: '' },
          { key: 'draft', label: 'Menunggu Review', color: 'text-amber-500', bg: 'border-amber-50' },
          { key: 'published', label: 'Dipublish', color: 'text-green-500', bg: 'border-green-50' },
          { key: 'rejected', label: 'Ditolak', color: 'text-red-400', bg: 'border-red-50' },
        ].map((stat) => (
          <button
            key={stat.key}
            onClick={() => { setFilterStatus(stat.key); setPendingPage(1); }}
            className={`bg-white rounded-xl p-4 border transition text-left ${
              filterStatus === stat.key ? 'ring-2 ring-primary/30 border-primary/20' : `border-slate-50 ${stat.bg} hover:shadow-sm`
            }`}
          >
            <p className={`text-2xl font-bold ${stat.color}`}>
              {statusCounts[stat.key as keyof typeof statusCounts]}
            </p>
            <p className="text-xs text-slate-400">{stat.label}</p>
          </button>
        ))}
      </div>

      {/* Pending List */}
      {loading ? (
        <div className="text-center py-20 text-slate-300">Memuat...</div>
      ) : filteredPending.length === 0 ? (
        <div className="text-center py-20">
          <Globe size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-400 text-sm">
            {pending.length === 0
              ? 'Belum ada artikel diimpor. Klik "Sync dari WordPress" untuk memulai.'
              : 'Tidak ada artikel dengan status ini.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedPending.map((item) => {
            const notes = parseNotes(item.notes);
            return (
              <div key={item.id} className="bg-white rounded-2xl p-5 border border-slate-50 hover:shadow-md transition">
                <div className="flex items-start gap-4">
                  {/* Thumbnail */}
                  <div className="w-14 h-16 bg-gradient-to-br from-emerald-50 to-green-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {notes.wp_thumbnail ? (
                      <img src={notes.wp_thumbnail} alt="" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <Globe size={20} className="text-emerald-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-slate-700">{item.raw_title}</h3>
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                        item.status === 'draft' ? 'bg-amber-50 text-amber-500' :
                        item.status === 'published' ? 'bg-green-50 text-green-500' :
                        item.status === 'rejected' ? 'bg-red-50 text-red-400' :
                        'bg-slate-100 text-slate-400'
                      }`}>
                        {item.status === 'draft' ? '⏳ Menunggu' :
                         item.status === 'published' ? '✅ Dipublish' :
                         item.status === 'rejected' ? '❌ Ditolak' : item.status}
                      </span>
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-semibold rounded-full">
                        {getCategoryLabel(item.category)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      ✍️ {notes.wp_author || 'Anonim'}
                      {notes.wp_date && ` · 📅 ${formatDate(notes.wp_date)}`}
                      {` · ⏱️ ${calcReadingTime(item.raw_content)} mnt baca`}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                      {generateExcerpt(item.raw_content, 120)}
                    </p>
                    <a href={item.source_url} target="_blank" rel="noopener noreferrer"
                      className="text-[10px] text-blue-400 hover:underline flex items-center gap-1 mt-1">
                      <ExternalLink size={9} /> {item.source_url}
                    </a>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => setPreviewItem(item)}
                      className="p-2 rounded-lg bg-blue-50 text-blue-400 hover:bg-blue-100 transition"
                      title="Preview">
                      <Eye size={15} />
                    </button>
                    {item.status === 'draft' && (
                      <>
                        <button onClick={() => openApproveModal(item)}
                          className="p-2 rounded-lg bg-green-50 text-green-500 hover:bg-green-100 transition"
                          title="Approve & Publish">
                          <Check size={15} />
                        </button>
                        <button onClick={() => handleReject(item)}
                          className="p-2 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 transition"
                          title="Tolak">
                          <XCircle size={15} />
                        </button>
                      </>
                    )}
                    {item.status === 'rejected' && (
                      <button onClick={() => handleRestoreDraft(item)}
                        className="p-2 rounded-lg bg-amber-50 text-amber-500 hover:bg-amber-100 transition"
                        title="Kembalikan ke Draft">
                        <RefreshCw size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination Controls */}
          {totalFilteredPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-xs text-slate-400">
                Menampilkan {(pendingPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(pendingPage * ITEMS_PER_PAGE, filteredPending.length)} dari {filteredPending.length} artikel
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPendingPage(p => Math.max(1, p - 1))}
                  disabled={pendingPage === 1}
                  className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalFilteredPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalFilteredPages || Math.abs(p - pendingPage) <= 2)
                  .reduce<(number | string)[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    typeof p === 'string' ? (
                      <span key={`dots-${idx}`} className="px-2 text-xs text-slate-300">...</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPendingPage(p)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                          pendingPage === p
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-slate-500 hover:bg-slate-50 border border-slate-200'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  onClick={() => setPendingPage(p => Math.min(totalFilteredPages, p + 1))}
                  disabled={pendingPage === totalFilteredPages}
                  className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-8 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-700">Preview Artikel</h2>
                <p className="text-xs text-slate-400 mt-0.5">Sumber: khotbahjumat.com</p>
              </div>
              <button onClick={() => setPreviewItem(null)}
                className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 transition">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-slate-800 mb-3">{previewItem.raw_title}</h3>
              <div className="flex items-center gap-3 mb-4 text-xs text-slate-400">
                {(() => {
                  const notes = parseNotes(previewItem.notes);
                  return (
                    <>
                      <span>✍️ {notes.wp_author || 'Anonim'}</span>
                      {notes.wp_date && <span>📅 {formatDate(notes.wp_date)}</span>}
                      <span>⏱️ {calcReadingTime(previewItem.raw_content)} mnt baca</span>
                    </>
                  );
                })()}
              </div>
              <div
                className="prose prose-sm max-w-none text-slate-600"
                dangerouslySetInnerHTML={{ __html: previewItem.raw_content }}
              />
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-between items-center">
              <a href={previewItem.source_url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                <ExternalLink size={12} /> Buka di khotbahjumat.com
              </a>
              <div className="flex gap-3">
                <button onClick={() => setPreviewItem(null)}
                  className="px-5 py-2.5 rounded-xl text-sm text-slate-500 hover:bg-slate-50 transition">
                  Tutup
                </button>
                {previewItem.status === 'draft' && (
                  <button onClick={() => { setPreviewItem(null); openApproveModal(previewItem); }}
                    className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition flex items-center gap-2">
                    <Check size={14} /> Approve & Publish
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {approveItem && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-8 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                <ArrowRight size={18} className="text-green-500" />
                Publish ke Mimbar
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Review & edit sebelum dipublikasikan ke aplikasi
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Judul *</label>
                <input value={approveForm.title}
                  onChange={(e) => setApproveForm({ ...approveForm, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Kategori</label>
                  <select value={approveForm.category}
                    onChange={(e) => setApproveForm({ ...approveForm, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white">
                    {CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Bahasa</label>
                  <select value={approveForm.language}
                    onChange={(e) => setApproveForm({ ...approveForm, language: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white">
                    {LANGUAGES.map(l => (
                      <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Penulis</label>
                <input value={approveForm.author}
                  onChange={(e) => setApproveForm({ ...approveForm, author: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Nama penulis / ustadz" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Thumbnail URL</label>
                <div className="flex items-center gap-3">
                  <input value={approveForm.thumbnail_url}
                    onChange={(e) => setApproveForm({ ...approveForm, thumbnail_url: e.target.value })}
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="https://..." />
                  {approveForm.thumbnail_url && (
                    <img src={approveForm.thumbnail_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  )}
                </div>
              </div>

              {/* Preview info */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-slate-500">Info Otomatis</p>
                <div className="flex gap-4 text-xs text-slate-400">
                  <span>⏱️ ~{calcReadingTime(approveItem.raw_content)} mnt baca</span>
                  <span>📝 {stripHtml(approveItem.raw_content).split(/\s+/).length} kata</span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">
                  {generateExcerpt(approveItem.raw_content)}
                </p>
              </div>

              {/* Source attribution info */}
              <div className="bg-emerald-50 rounded-xl p-4 flex items-start gap-3">
                <Globe size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-emerald-700">Sumber Artikel</p>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    Artikel ini akan dipublikasikan dengan atribusi sumber dari khotbahjumat.com.
                    Link sumber akan ditampilkan di aplikasi.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setApproveItem(null)}
                className="px-5 py-2.5 rounded-xl text-sm text-slate-500 hover:bg-slate-50 transition">
                Batal
              </button>
              <button onClick={handleApprove} disabled={approving}
                className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
                  approving
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:opacity-90 shadow-lg shadow-emerald-200'
                }`}>
                <Check size={14} />
                {approving ? 'Mempublish...' : 'Publish ke Mimbar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}