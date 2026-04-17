'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { BookOpen, Plus, Edit2, Trash2, Search, ToggleLeft, ToggleRight, X, Upload, Star, Eye, Globe, RefreshCw, Check, XCircle, ExternalLink, ChevronLeft, ChevronRight, Tag, Save } from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';

// ═══════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════

interface PendingKisah {
  id: string;
  source_url: string;
  source_site: string;
  raw_title: string;
  raw_content: string;
  status: 'draft' | 'approved' | 'rejected';
  category: string;
  notes: string;
  created_at: string;
}

interface WPNotes {
  wp_id?: number;
  wp_date?: string;
  wp_author?: string;
  wp_thumbnail?: string;
  wp_categories?: string[];
  wp_category_slugs?: string[];
}

interface KisahMaterial {
  id?: string;
  title: string;
  content_html?: string;
  excerpt: string;
  author: string;
  category: string;
  reading_time_minutes: number;
  thumbnail_url: string;
  source_url: string;
  tags: string[];
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  view_count?: number;
  created_at?: string;
}

interface KisahCategory {
  id: string;
  slug: string;
  name: string;
  emoji: string;
  is_active: boolean;
  sort_order: number;
}

// ═══════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════

const FALLBACK_CATEGORIES = [
  { slug: 'kisah-nyata', name: 'Kisah Nyata', emoji: '📰' },
  { slug: 'kisah-nabi', name: 'Kisah Nabi', emoji: '🕌' },
  { slug: 'kisah-sahabat', name: 'Kisah Sahabat', emoji: '⭐' },
  { slug: 'kisah-ulama-salaf', name: 'Kisah Ulama & Salaf', emoji: '📚' },
  { slug: 'kisah-teladan', name: 'Kisah Teladan', emoji: '💎' },
  { slug: 'motivasi-islam', name: 'Motivasi Islam', emoji: '💪' },
];

const DEFAULT_FORM: KisahMaterial = {
  title: '', content_html: '', excerpt: '', author: '', category: 'kisah-nyata',
  reading_time_minutes: 5, thumbnail_url: '', source_url: '',
  tags: [], is_featured: false, is_active: true, sort_order: 0,
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'").replace(/\s+/g, ' ').trim();
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

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>;
    return (e.message || e.error_description || e.code || JSON.stringify(err, null, 2)) as string;
  }
  return String(err);
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
}

const ITEMS_PER_PAGE = 20;

// ═══════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════

export default function KisahMuslimPage() {
  const [activeTab, setActiveTab] = useState<'materi' | 'import' | 'kategori'>('materi');
  const [categories, setCategories] = useState<KisahCategory[]>([]);

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase
      .from('kisah_muslim_categories')
      .select('id, slug, name, emoji, is_active, sort_order')
      .order('sort_order', { ascending: true });
    setCategories(data || []);
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const getCategoryLabel = (slug: string) => {
    const cat = categories.find(c => c.slug === slug);
    if (cat) return cat.name;
    return FALLBACK_CATEGORIES.find(c => c.slug === slug)?.name ?? slug;
  };

  const getCategoryEmoji = (slug: string) => {
    const cat = categories.find(c => c.slug === slug);
    if (cat) return cat.emoji;
    return FALLBACK_CATEGORIES.find(c => c.slug === slug)?.emoji ?? '📖';
  };

  const activeCategories = categories.length > 0
    ? categories.filter(c => c.is_active)
    : FALLBACK_CATEGORIES.map((c, i) => ({ ...c, id: `fb-${i}`, is_active: true, sort_order: i }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-700 rounded-xl flex items-center justify-center">
              <BookOpen className="text-white" size={20} />
            </div>
            Kisah Muslim
          </h1>
          <p className="text-slate-400 text-sm mt-1">Kelola artikel kisah islami dari kisahmuslim.com</p>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        <button onClick={() => setActiveTab('materi')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition ${activeTab === 'materi' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
          <BookOpen size={16} /> Materi
        </button>
        <button onClick={() => setActiveTab('import')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition ${activeTab === 'import' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
          <Upload size={16} /> Import WordPress
        </button>
        <button onClick={() => setActiveTab('kategori')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition ${activeTab === 'kategori' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
          <Tag size={16} /> Kategori
        </button>
      </div>

      {activeTab === 'materi' && <MateriTab categories={activeCategories} getCategoryLabel={getCategoryLabel} getCategoryEmoji={getCategoryEmoji} />}
      {activeTab === 'import' && <ImportTab categories={activeCategories} getCategoryLabel={getCategoryLabel} getCategoryEmoji={getCategoryEmoji} />}
      {activeTab === 'kategori' && <KategoriTab categories={categories} onRefresh={fetchCategories} />}
    </div>
  );
}

// ═══════════════════════════════════════════════
//  KATEGORI TAB
// ═══════════════════════════════════════════════

function KategoriTab({ categories, onRefresh }: { categories: KisahCategory[]; onRefresh: () => void }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', emoji: '', slug: '', sort_order: 0 });
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', emoji: '📖', slug: '' });

  const handleEdit = (cat: KisahCategory) => {
    setEditingId(cat.id);
    setEditForm({ name: cat.name, emoji: cat.emoji, slug: cat.slug, sort_order: cat.sort_order });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('kisah_muslim_categories').update({
        name: editForm.name, emoji: editForm.emoji, sort_order: editForm.sort_order,
      }).eq('id', editingId);
      if (error) throw error;
      setEditingId(null);
      onRefresh();
    } catch (err) { alert('Gagal simpan: ' + getErrorMessage(err)); }
    setSaving(false);
  };

  const handleToggle = async (id: string, current: boolean) => {
    await supabase.from('kisah_muslim_categories').update({ is_active: !current }).eq('id', id);
    onRefresh();
  };

  const handleAdd = async () => {
    if (!addForm.name.trim() || !addForm.slug.trim()) return alert('Nama dan slug wajib diisi');
    setSaving(true);
    try {
      const { error } = await supabase.from('kisah_muslim_categories').insert({
        name: addForm.name.trim(), emoji: addForm.emoji || '📖',
        slug: addForm.slug.trim().toLowerCase().replace(/\s+/g, '-'),
        sort_order: categories.length + 1,
      });
      if (error) throw error;
      setShowAdd(false);
      setAddForm({ name: '', emoji: '📖', slug: '' });
      onRefresh();
    } catch (err) { alert('Gagal tambah: ' + getErrorMessage(err)); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus kategori ini?')) return;
    await supabase.from('kisah_muslim_categories').delete().eq('id', id);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{categories.length} kategori</p>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 transition shadow-lg shadow-amber-100">
          <Plus size={16} /> Tambah Kategori
        </button>
      </div>

      {showAdd && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 space-y-3">
          <h4 className="font-semibold text-sm text-amber-800">Tambah Kategori Baru</h4>
          <div className="grid grid-cols-3 gap-3">
            <input type="text" placeholder="Nama" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              className="px-3 py-2 border border-amber-200 rounded-lg text-sm" />
            <input type="text" placeholder="Slug (contoh: kisah-nabi)" value={addForm.slug} onChange={(e) => setAddForm({ ...addForm, slug: e.target.value })}
              className="px-3 py-2 border border-amber-200 rounded-lg text-sm" />
            <input type="text" placeholder="Emoji" value={addForm.emoji} onChange={(e) => setAddForm({ ...addForm, emoji: e.target.value })}
              className="px-3 py-2 border border-amber-200 rounded-lg text-sm" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 rounded-lg">Batal</button>
            <button onClick={handleAdd} disabled={saving}
              className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 disabled:opacity-50">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {categories.map((cat) => (
          <div key={cat.id} className={`bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-4 hover:shadow-sm transition ${!cat.is_active ? 'opacity-50' : ''}`}>
            {editingId === cat.id ? (
              <div className="flex-1 flex items-center gap-3">
                <input type="text" value={editForm.emoji} onChange={(e) => setEditForm({ ...editForm, emoji: e.target.value })}
                  className="w-14 px-2 py-2 border border-slate-200 rounded-lg text-center text-lg" />
                <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                <input type="number" value={editForm.sort_order} onChange={(e) => setEditForm({ ...editForm, sort_order: parseInt(e.target.value) || 0 })}
                  className="w-20 px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Urutan" />
                <button onClick={handleSaveEdit} disabled={saving} className="p-2 hover:bg-green-50 rounded-lg"><Save size={16} className="text-green-500" /></button>
                <button onClick={() => setEditingId(null)} className="p-2 hover:bg-slate-50 rounded-lg"><X size={16} className="text-slate-400" /></button>
              </div>
            ) : (
              <>
                <span className="text-2xl">{cat.emoji}</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-slate-700">{cat.name}</h4>
                  <p className="text-xs text-slate-400">slug: {cat.slug} | urutan: {cat.sort_order}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleToggle(cat.id, cat.is_active)} className="p-2 rounded-lg hover:bg-slate-50">
                    {cat.is_active ? <ToggleRight size={20} className="text-amber-500" /> : <ToggleLeft size={20} className="text-slate-300" />}
                  </button>
                  <button onClick={() => handleEdit(cat)} className="p-2 rounded-lg hover:bg-slate-50"><Edit2 size={16} className="text-slate-400" /></button>
                  <button onClick={() => handleDelete(cat.id)} className="p-2 rounded-lg hover:bg-red-50"><Trash2 size={16} className="text-red-400" /></button>
                </div>
              </>
            )}
          </div>
        ))}
        {categories.length === 0 && (
          <div className="text-center py-12 text-slate-300">
            <Tag size={48} className="mx-auto mb-3 opacity-30" />
            <p>Belum ada kategori. Jalankan SQL untuk bootstrap kategori default.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  MATERI TAB
// ═══════════════════════════════════════════════

interface TabProps {
  categories: { slug: string; name: string; emoji: string }[];
  getCategoryLabel: (slug: string) => string;
  getCategoryEmoji: (slug: string) => string;
}

function MateriTab({ categories, getCategoryLabel, getCategoryEmoji }: TabProps) {
  const [materials, setMaterials] = useState<KisahMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<KisahMaterial>({ ...DEFAULT_FORM });
  const [saving, setSaving] = useState(false);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    // Exclude content_html dari listing untuk menghemat egress (~30KB per record)
    const { data } = await supabase.from('kisah_muslim_materials')
      .select('id, title, excerpt, author, category, reading_time_minutes, thumbnail_url, source_url, tags, is_featured, is_active, sort_order, view_count, created_at')
      .order('sort_order', { ascending: true }).order('created_at', { ascending: false })
      .limit(200);
    setMaterials(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

  const handleSave = async () => {
    if (!form.title.trim()) return alert('Judul wajib diisi');
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(), content_html: form.content_html,
        excerpt: form.excerpt || generateExcerpt(form.content_html || ''),
        author: form.author.trim() || 'Anonim', category: form.category,
        reading_time_minutes: form.reading_time_minutes || calcReadingTime(form.content_html || ''),
        thumbnail_url: form.thumbnail_url, source_url: form.source_url,
        tags: form.tags, is_featured: form.is_featured, is_active: form.is_active, sort_order: form.sort_order,
      };
      if (editing) {
        const { error } = await supabase.from('kisah_muslim_materials').update(payload).eq('id', editing);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('kisah_muslim_materials').insert(payload);
        if (error) throw error;
      }
      setShowModal(false); setEditing(null); setForm({ ...DEFAULT_FORM }); fetchMaterials();
    } catch (err) {
      console.error('Save error:', err);
      alert('Gagal menyimpan: ' + getErrorMessage(err));
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus materi ini?')) return;
    await supabase.from('kisah_muslim_materials').delete().eq('id', id);
    fetchMaterials();
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    await supabase.from('kisah_muslim_materials').update({ is_active: !current }).eq('id', id);
    fetchMaterials();
  };

  const handleEdit = async (m: KisahMaterial) => {
    // Fetch content_html on-demand saat user klik Edit (hemat egress)
    let fullItem = { ...m };
    if (!m.content_html) {
      const { data } = await supabase.from('kisah_muslim_materials').select('content_html').eq('id', m.id).single();
      if (data) fullItem.content_html = data.content_html;
    }
    setForm(fullItem); setEditing(m.id!); setShowModal(true);
  };

  const filtered = materials.filter(m => {
    if (catFilter && m.category !== catFilter) return false;
    if (search && !m.title.toLowerCase().includes(search.toLowerCase()) && !m.author.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
          <input type="text" placeholder="Cari materi..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none" />
        </div>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm">
          <option value="">Semua Kategori</option>
          {categories.map(c => <option key={c.slug} value={c.slug}>{c.emoji} {c.name}</option>)}
        </select>
        <button onClick={() => { setForm({ ...DEFAULT_FORM }); setEditing(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 transition shadow-lg shadow-amber-100">
          <Plus size={16} /> Tambah Materi
        </button>
      </div>

      <div className="text-sm text-slate-400">{loading ? 'Memuat...' : `${filtered.length} materi`}</div>

      <div className="space-y-3">
        {filtered.map((m) => (
          <div key={m.id} className={`bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-4 hover:shadow-md transition ${!m.is_active ? 'opacity-50' : ''}`}>
            {m.thumbnail_url ? (
              <img src={m.thumbnail_url} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                <BookOpen size={20} className="text-amber-300" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-xs font-semibold rounded-lg">
                  {getCategoryEmoji(m.category)} {getCategoryLabel(m.category)}
                </span>
                {m.is_featured && <Star size={14} className="text-amber-400 fill-amber-400" />}
              </div>
              <h3 className="font-semibold text-slate-800 text-sm truncate">{m.title}</h3>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                <span>✍️ {m.author}</span>
                <span><Eye size={12} className="inline" /> {m.view_count ?? 0}</span>
                <span>{m.reading_time_minutes} mnt baca</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handleToggleActive(m.id!, m.is_active)} className="p-2 rounded-lg hover:bg-slate-50">
                {m.is_active ? <ToggleRight size={20} className="text-amber-500" /> : <ToggleLeft size={20} className="text-slate-300" />}
              </button>
              <button onClick={() => handleEdit(m)} className="p-2 rounded-lg hover:bg-slate-50"><Edit2 size={16} className="text-slate-400" /></button>
              <button onClick={() => handleDelete(m.id!)} className="p-2 rounded-lg hover:bg-red-50"><Trash2 size={16} className="text-red-400" /></button>
            </div>
          </div>
        ))}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-slate-300">
            <BookOpen size={48} className="mx-auto mb-3 opacity-30" />
            <p>Belum ada materi kisah muslim</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">{editing ? 'Edit Materi' : 'Tambah Materi'}</h2>
              <button onClick={() => { setShowModal(false); setEditing(null); }} className="p-2 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
            </div>
            <input type="text" placeholder="Judul" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm" />
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Penulis" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })}
                className="px-4 py-3 border border-slate-200 rounded-xl text-sm" />
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="px-4 py-3 border border-slate-200 rounded-xl text-sm">
                {categories.map(c => <option key={c.slug} value={c.slug}>{c.emoji} {c.name}</option>)}
              </select>
            </div>
            <RichTextEditor content={form.content_html || ''} onChange={(v) => setForm({ ...form, content_html: v })} />
            <textarea placeholder="Excerpt (opsional)" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm" rows={2} />
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="URL Thumbnail" value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
                className="px-4 py-3 border border-slate-200 rounded-xl text-sm" />
              <input type="text" placeholder="URL Sumber" value={form.source_url} onChange={(e) => setForm({ ...form, source_url: e.target.value })}
                className="px-4 py-3 border border-slate-200 rounded-xl text-sm" />
            </div>
            <input type="text" placeholder="Tags (pisahkan koma)" value={form.tags.join(', ')}
              onChange={(e) => setForm({ ...form, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm" />
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="rounded" /> Featured
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded" /> Aktif
              </label>
              <div className="flex items-center gap-2 text-sm">
                <label>Sort Order:</label>
                <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                  className="w-20 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => { setShowModal(false); setEditing(null); }} className="px-5 py-2.5 text-sm text-slate-500 hover:bg-slate-50 rounded-xl">Batal</button>
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2.5 text-sm bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 disabled:opacity-50 shadow-lg shadow-amber-100">
                {saving ? 'Menyimpan...' : (editing ? 'Update' : 'Simpan')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════
//  IMPORT TAB
// ═══════════════════════════════════════════════

function ImportTab({ categories, getCategoryLabel, getCategoryEmoji }: TabProps) {
  const [pending, setPending] = useState<PendingKisah[]>([]);
  const [totalPending, setTotalPending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState('');
  const [wpTotal, setWpTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [approveModal, setApproveModal] = useState<PendingKisah | null>(null);
  const [approveForm, setApproveForm] = useState<KisahMaterial>({ ...DEFAULT_FORM });
  const [approveSaving, setApproveSaving] = useState(false);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    // Server-side pagination: hanya ambil halaman yang ditampilkan
    // Exclude raw_content dari listing untuk hemat egress
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    let query = supabase.from('pending_kisah_muslim').select('id, source_url, source_site, raw_title, status, category, notes, created_at', { count: 'exact' });
    if (statusFilter) query = query.eq('status', statusFilter);
    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data, count } = await query;
    setPending((data as PendingKisah[]) || []);
    setTotalPending(count ?? 0);
    setLoading(false);
  }, [statusFilter, page]);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncProgress('Mengambil data dari kisahmuslim.com...');
    try {
      const firstRes = await fetch('/api/kisahmuslim/wp-sync', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: 1, per_page: 100 }),
      });
      const firstData = await firstRes.json();
      if (firstData.error) throw new Error(firstData.error);
      const totalPages = firstData.total_pages || 1;
      setWpTotal(firstData.total_wp || 0);
      const allRows = [...(firstData.rows || [])];
      for (let p = 2; p <= totalPages; p++) {
        setSyncProgress(`Mengambil halaman ${p} dari ${totalPages}...`);
        const res = await fetch('/api/kisahmuslim/wp-sync', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ page: p, per_page: 100 }),
        });
        const data = await res.json();
        if (data.rows) allRows.push(...data.rows);
      }
      setSyncProgress(`Menyimpan ${allRows.length} artikel ke database...`);
      for (let i = 0; i < allRows.length; i += 500) {
        const batch = allRows.slice(i, i + 500);
        const { error } = await supabase.from('pending_kisah_muslim')
          .upsert(batch, { onConflict: 'source_url', ignoreDuplicates: false });
        if (error) throw error;
        setSyncProgress(`Tersimpan ${Math.min(i + 500, allRows.length)} dari ${allRows.length}...`);
      }
      setSyncProgress(`✅ Sinkronisasi selesai! ${allRows.length} artikel disimpan.`);
      fetchPending();
    } catch (err) {
      console.error(err);
      setSyncProgress(`❌ Error: ${getErrorMessage(err)}`);
    }
    setSyncing(false);
  };

  const openApproveModal = async (item: PendingKisah) => {
    const notes = parseNotes(item.notes);
    // Fetch raw_content on-demand
    let rawContent = item.raw_content || '';
    if (!rawContent) {
      const { data } = await supabase.from('pending_kisah_muslim').select('raw_content').eq('id', item.id).single();
      if (data) rawContent = data.raw_content;
    }
    setApproveForm({
      ...DEFAULT_FORM, title: item.raw_title, content_html: rawContent,
      excerpt: generateExcerpt(rawContent), author: notes.wp_author || 'Anonim',
      category: item.category, reading_time_minutes: calcReadingTime(rawContent),
      thumbnail_url: notes.wp_thumbnail || '', source_url: item.source_url,
      tags: notes.wp_categories || [],
    });
    setApproveModal(item);
  };

  const handleApprove = async () => {
    if (!approveModal) return;
    setApproveSaving(true);
    try {
      const { error } = await supabase.from('kisah_muslim_materials').upsert({
        title: approveForm.title, content_html: approveForm.content_html,
        excerpt: approveForm.excerpt || generateExcerpt(approveForm.content_html || ''),
        author: approveForm.author || 'Anonim', category: approveForm.category,
        reading_time_minutes: approveForm.reading_time_minutes || calcReadingTime(approveForm.content_html || ''),
        thumbnail_url: approveForm.thumbnail_url, source_url: approveForm.source_url,
        tags: approveForm.tags, is_featured: approveForm.is_featured, is_active: true, sort_order: 0,
      }, { onConflict: 'source_url' });
      if (error) throw error;
      await supabase.from('pending_kisah_muslim').update({
        status: 'approved', approved_at: new Date().toISOString(),
      }).eq('id', approveModal.id);
      setApproveModal(null);
      fetchPending();
    } catch (err) {
      console.error('Approve error:', err);
      alert('Gagal approve: ' + getErrorMessage(err));
    }
    setApproveSaving(false);
  };

  const handleReject = async (id: string) => {
    await supabase.from('pending_kisah_muslim').update({ status: 'rejected' }).eq('id', id);
    fetchPending();
  };

  // Server-side pagination — data sudah di-paginate dari fetchPending
  const totalPages = Math.ceil(totalPending / ITEMS_PER_PAGE);
  const pageItems = pending;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
    else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <Globe size={18} className="text-amber-500" /> Import dari kisahmuslim.com
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Total di WP: <strong>{wpTotal}</strong> | Pending: <strong>{totalPending}</strong>
            </p>
          </div>
          <button onClick={handleSync} disabled={syncing}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 disabled:opacity-50 transition shadow-lg shadow-amber-100">
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing...' : 'Sync Semua'}
          </button>
        </div>
        {syncProgress && (
          <div className={`text-sm px-4 py-2 rounded-lg ${syncProgress.startsWith('❌') ? 'bg-red-50 text-red-600' : syncProgress.startsWith('✅') ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
            {syncProgress}
          </div>
        )}
      </div>

      <div className="flex gap-3 items-center">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm">
          <option value="">Semua Status</option>
          <option value="draft">Draft</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <span className="text-sm text-slate-400">{loading ? 'Memuat...' : `Halaman ${page} dari ${totalPages || 1}`}</span>
      </div>

      <div className="space-y-2">
        {pageItems.map((item) => {
          const notes = parseNotes(item.notes);
          return (
            <div key={item.id} className="bg-white rounded-xl border border-slate-100 p-4 flex items-start gap-4 hover:shadow-sm transition">
              {notes.wp_thumbnail && <img src={notes.wp_thumbnail} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${item.status === 'approved' ? 'bg-green-100 text-green-600' : item.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>{item.status}</span>
                  <span className="text-xs text-slate-400">{getCategoryEmoji(item.category)} {getCategoryLabel(item.category)}</span>
                </div>
                <h4 className="font-medium text-sm text-slate-700 line-clamp-1">{item.raw_title}</h4>
                <div className="text-xs text-slate-400 mt-1 flex gap-3">
                  <span>✍️ {notes.wp_author || 'Anonim'}</span>
                  <span>{formatDate(notes.wp_date || item.created_at)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {item.source_url && <a href={item.source_url} target="_blank" rel="noopener" className="p-2 hover:bg-slate-50 rounded-lg"><ExternalLink size={14} className="text-slate-400" /></a>}
                {item.status === 'draft' && (
                  <>
                    <button onClick={() => openApproveModal(item)} className="p-2 hover:bg-green-50 rounded-lg"><Check size={16} className="text-green-500" /></button>
                    <button onClick={() => handleReject(item.id)} className="p-2 hover:bg-red-50 rounded-lg"><XCircle size={16} className="text-red-400" /></button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30"><ChevronLeft size={18} /></button>
          {getPageNumbers().map((p, i) => typeof p === 'string' ? (
            <span key={`e${i}`} className="px-2 text-slate-300">...</span>
          ) : (
            <button key={p} onClick={() => setPage(p)} className={`w-9 h-9 rounded-lg text-sm font-semibold transition ${p === page ? 'bg-amber-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>{p}</button>
          ))}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30"><ChevronRight size={18} /></button>
        </div>
      )}

      {approveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Approve & Publish</h2>
              <button onClick={() => setApproveModal(null)} className="p-2 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
            </div>
            <input type="text" placeholder="Judul" value={approveForm.title} onChange={(e) => setApproveForm({ ...approveForm, title: e.target.value })} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm" />
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Penulis" value={approveForm.author} onChange={(e) => setApproveForm({ ...approveForm, author: e.target.value })} className="px-4 py-3 border border-slate-200 rounded-xl text-sm" />
              <select value={approveForm.category} onChange={(e) => setApproveForm({ ...approveForm, category: e.target.value })} className="px-4 py-3 border border-slate-200 rounded-xl text-sm">
                {categories.map(c => <option key={c.slug} value={c.slug}>{c.emoji} {c.name}</option>)}
              </select>
            </div>
            <RichTextEditor content={approveForm.content_html || ''} onChange={(v) => setApproveForm({ ...approveForm, content_html: v })} />
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="URL Thumbnail" value={approveForm.thumbnail_url} onChange={(e) => setApproveForm({ ...approveForm, thumbnail_url: e.target.value })} className="px-4 py-3 border border-slate-200 rounded-xl text-sm" />
              <input type="text" placeholder="Tags" value={approveForm.tags.join(', ')} onChange={(e) => setApproveForm({ ...approveForm, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })} className="px-4 py-3 border border-slate-200 rounded-xl text-sm" />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setApproveModal(null)} className="px-5 py-2.5 text-sm text-slate-500 hover:bg-slate-50 rounded-xl">Batal</button>
              <button onClick={handleApprove} disabled={approveSaving} className="px-5 py-2.5 text-sm bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 disabled:opacity-50 shadow-lg shadow-amber-100">
                {approveSaving ? 'Menyimpan...' : 'Approve & Publish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
