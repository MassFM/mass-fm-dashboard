'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { HomeSlide } from '@/types/database';
import {
  Plus, Trash2, Edit3, ArrowUp, ArrowDown, Save, X,
  Upload, Eye, EyeOff, Loader2, Search, Image as ImageIcon,
  Layers, Calendar, Tag, ExternalLink, Monitor,
  GripVertical, Copy, ToggleLeft, ToggleRight, Link2,
} from 'lucide-react';

// ─── CONSTANTS ──────────────────────────────────────────────

const CONTENT_TYPES = [
  { value: 'poster', label: 'Poster Dakwah', color: '#822a6e' },
  { value: 'ad', label: 'Iklan', color: '#e67e22' },
  { value: 'mimbar', label: 'Mimbar', color: '#2ecc71' },
  { value: 'kajian', label: 'Kajian Rutin', color: '#3498db' },
  { value: 'doa', label: 'Doa', color: '#9b59b6' },
  { value: 'dzikir', label: 'Dzikir', color: '#1abc9c' },
  { value: 'info', label: 'Informasi', color: '#f39c12' },
  { value: 'custom', label: 'Custom', color: '#95a5a6' },
  { value: 'podcast', label: 'Podcast', color: '#e74c3c' },
  { value: 'ebook', label: 'Ebook', color: '#2980b9' },
  { value: 'event', label: 'Event', color: '#d35400' },
];

const ACTION_TYPES = [
  { value: 'preview', label: 'Preview Gambar', desc: 'Buka gambar fullscreen' },
  { value: 'screen', label: 'Buka Screen', desc: 'Navigasi ke halaman fitur' },
  { value: 'url', label: 'Buka URL', desc: 'Buka link di browser' },
  { value: 'none', label: 'Tanpa Aksi', desc: 'Tidak ada aksi saat di-tap' },
];

/** Map content_type → Supabase table + columns for content_id picker */
const CONTENT_TABLE_MAP: Record<string, { table: string; idCol: string; titleCol: string } | null> = {
  poster: null,
  ad: { table: 'ads', idCol: 'id', titleCol: 'title' },
  mimbar: { table: 'mimbar_materials', idCol: 'id', titleCol: 'title' },
  kajian: { table: 'kajian_offline', idCol: 'id', titleCol: 'title' },
  doa: { table: 'daily_doas', idCol: 'id', titleCol: 'title' },
  dzikir: { table: 'dzikir_collections', idCol: 'id', titleCol: 'label' },
  info: null,
  custom: null,
  podcast: { table: 'podcasts', idCol: 'id', titleCol: 'title' },
  ebook: { table: 'ebooks', idCol: 'id', titleCol: 'title' },
  event: { table: 'events', idCol: 'id', titleCol: 'title' },
};

// ─── HELPERS ────────────────────────────────────────────────

/** Convert ISO / any date string to `YYYY-MM-DDTHH:mm` for datetime-local */
function toLocalDatetime(v: string | null | undefined): string {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ─── MAIN COMPONENT ─────────────────────────────────────────

export default function HomeSlides() {
  const [slides, setSlides] = useState<HomeSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HomeSlide | null>(null);
  const [form, setForm] = useState<Partial<HomeSlide>>({
    content_type: 'poster',
    image_url: '',
    title: '',
    subtitle: '',
    badge_text: '',
    badge_color: '#822a6e',
    action_type: 'preview',
    action_data: '',
    is_active: true,
    sort_order: 0,
    start_date: null,
    end_date: null,
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Content ID picker
  const [contentItems, setContentItems] = useState<{ id: string; title: string }[]>([]);
  const [loadingContentItems, setLoadingContentItems] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSlides();
  }, []);

  // Fetch content items when content_type changes (for content_id picker)
  const fetchContentItems = useCallback(async (type: string) => {
    const mapping = CONTENT_TABLE_MAP[type];
    if (!mapping) {
      setContentItems([]);
      return;
    }
    setLoadingContentItems(true);
    try {
      const { data } = await supabase
        .from(mapping.table)
        .select(`${mapping.idCol}, ${mapping.titleCol}`)
        .order(mapping.titleCol, { ascending: true })
        .limit(200);
      if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setContentItems(
          (data as any[]).map((d) => ({
            id: String(d[mapping.idCol] ?? ''),
            title: String(d[mapping.titleCol] ?? '(tanpa judul)'),
          }))
        );
      }
    } catch {
      setContentItems([]);
    }
    setLoadingContentItems(false);
  }, []);

  // Trigger fetch when form content_type changes while form is open
  useEffect(() => {
    if (showForm && form.content_type) {
      fetchContentItems(form.content_type);
    }
  }, [showForm, form.content_type, fetchContentItems]);

  // ─── DATA FETCHING ──────────────────────────────────────────

  async function fetchSlides() {
    setLoading(true);
    const { data, error } = await supabase
      .from('home_slides')
      .select('*')
      .order('sort_order', { ascending: true });
    if (!error && data) setSlides(data);
    setLoading(false);
  }

  // ─── UPLOAD IMAGE ───────────────────────────────────────────

  async function uploadImage(file: File): Promise<string | null> {
    const ext = file.name.split('.').pop();
    const fileName = `home_slides/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from('posters')
      .upload(fileName, file, { cacheControl: '31536000', upsert: false });

    if (error) {
      alert('Upload gagal: ' + error.message);
      return null;
    }

    const { data: urlData } = supabase.storage.from('posters').getPublicUrl(fileName);
    return urlData.publicUrl;
  }

  // ─── SAVE SLIDE ─────────────────────────────────────────────

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      let imageUrl = form.image_url || '';

      // Upload image jika ada file baru
      if (file) {
        setUploading(true);
        const url = await uploadImage(file);
        setUploading(false);
        if (!url) { setSaving(false); return; }
        imageUrl = url;
      }

      if (!imageUrl) {
        alert('Gambar wajib diisi!');
        setSaving(false);
        return;
      }

      const payload = {
        content_type: form.content_type || 'poster',
        content_id: form.content_id || null,
        image_url: imageUrl,
        title: form.title || '',
        subtitle: form.subtitle || '',
        badge_text: form.badge_text || '',
        badge_color: form.badge_color || '#822a6e',
        action_type: form.action_type || 'preview',
        action_data: form.action_data || '',
        is_active: form.is_active ?? true,
        sort_order: form.sort_order ?? 0,
        start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
        end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
      };

      if (editingSlide?.id) {
        // Update
        const { error } = await supabase
          .from('home_slides')
          .update(payload)
          .eq('id', editingSlide.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('home_slides')
          .insert(payload);
        if (error) throw error;
      }

      resetForm();
      await fetchSlides();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      alert('Gagal menyimpan: ' + msg);
    }
    setSaving(false);
  }

  function resetForm() {
    setShowForm(false);
    setEditingSlide(null);
    setFile(null);
    setForm({
      content_type: 'poster',
      image_url: '',
      title: '',
      subtitle: '',
      badge_text: '',
      badge_color: '#822a6e',
      action_type: 'preview',
      action_data: '',
      is_active: true,
      sort_order: 0,
      start_date: null,
      end_date: null,
    });
  }

  function openEditForm(slide: HomeSlide) {
    setEditingSlide(slide);
    setForm({
      ...slide,
      start_date: slide.start_date ? toLocalDatetime(slide.start_date) : null,
      end_date: slide.end_date ? toLocalDatetime(slide.end_date) : null,
    });
    setFile(null);
    setShowForm(true);
  }

  // ─── DELETE ─────────────────────────────────────────────────

  async function handleDelete(id: number) {
    if (!confirm('Hapus slide ini?')) return;
    const { error } = await supabase.from('home_slides').delete().eq('id', id);
    if (!error) await fetchSlides();
  }

  // ─── TOGGLE ACTIVE ─────────────────────────────────────────

  async function toggleActive(slide: HomeSlide) {
    const { error } = await supabase
      .from('home_slides')
      .update({ is_active: !slide.is_active })
      .eq('id', slide.id);
    if (!error) await fetchSlides();
  }

  // ─── REORDER ────────────────────────────────────────────────

  async function moveSlide(slide: HomeSlide, direction: 'up' | 'down') {
    const idx = slides.findIndex(s => s.id === slide.id);
    if (direction === 'up' && idx <= 0) return;
    if (direction === 'down' && idx >= slides.length - 1) return;

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const swapSlide = slides[swapIdx];

    await Promise.all([
      supabase.from('home_slides').update({ sort_order: swapSlide.sort_order }).eq('id', slide.id),
      supabase.from('home_slides').update({ sort_order: slide.sort_order }).eq('id', swapSlide.id),
    ]);

    await fetchSlides();
  }

  // ─── DUPLICATE ──────────────────────────────────────────────

  async function duplicateSlide(slide: HomeSlide) {
    const { id, created_at, updated_at, ...rest } = slide;
    const payload = { ...rest, title: rest.title + ' (copy)', sort_order: slides.length };
    const { error } = await supabase.from('home_slides').insert(payload);
    if (!error) await fetchSlides();
  }

  // ─── FILTERS ────────────────────────────────────────────────

  const filteredSlides = slides.filter(s => {
    if (filterType !== 'all' && s.content_type !== filterType) return false;
    if (filterStatus === 'active' && !s.is_active) return false;
    if (filterStatus === 'inactive' && s.is_active) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        s.title.toLowerCase().includes(q) ||
        s.subtitle.toLowerCase().includes(q) ||
        s.content_type.toLowerCase().includes(q) ||
        s.badge_text.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // ─── STATS ──────────────────────────────────────────────────

  const stats = {
    total: slides.length,
    active: slides.filter(s => s.is_active).length,
    inactive: slides.filter(s => !s.is_active).length,
    types: [...new Set(slides.map(s => s.content_type))].length,
  };

  // ─── HELPERS ────────────────────────────────────────────────

  function getContentTypeInfo(type: string) {
    return CONTENT_TYPES.find(t => t.value === type) || { value: type, label: type, color: '#95a5a6' };
  }

  function getActionTypeInfo(type: string) {
    return ACTION_TYPES.find(t => t.value === type) || { value: type, label: type, desc: '' };
  }

  // ─── RENDER ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ── HEADER ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Home Slides</h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola slider konten variatif di halaman utama aplikasi
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition shadow-lg shadow-primary/20"
        >
          <Plus size={18} />
          Tambah Slide
        </button>
      </div>

      {/* ── STATS ─────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Slide', value: stats.total, color: 'bg-blue-50 text-blue-600', icon: <Layers size={18} /> },
          { label: 'Aktif', value: stats.active, color: 'bg-green-50 text-green-600', icon: <Eye size={18} /> },
          { label: 'Nonaktif', value: stats.inactive, color: 'bg-red-50 text-red-600', icon: <EyeOff size={18} /> },
          { label: 'Tipe Konten', value: stats.types, color: 'bg-purple-50 text-purple-600', icon: <Tag size={18} /> },
        ].map(stat => (
          <div key={stat.label} className={`rounded-xl p-4 ${stat.color}`}>
            <div className="flex items-center gap-2 mb-1 opacity-70">{stat.icon}<span className="text-xs font-medium">{stat.label}</span></div>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ── LIVE PREVIEW ──────────────────────────────────── */}
      {slides.filter(s => s.is_active).length > 0 && (
        <div className="bg-white rounded-2xl border p-6">
          <h3 className="text-sm font-semibold text-slate-500 mb-4 flex items-center gap-2">
            <Monitor size={16} />
            Preview Slider (Aktif)
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {slides.filter(s => s.is_active).map(slide => (
              <div key={slide.id} className="flex-shrink-0 w-72 h-40 rounded-2xl overflow-hidden relative group">
                <img
                  src={slide.image_url}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="288" height="160"><rect fill="%23e2e8f0" width="288" height="160"/><text x="50%" y="50%" fill="%2394a3b8" text-anchor="middle" dy=".3em" font-size="14">No Image</text></svg>'; }}
                />
                {/* Overlay */}
                {(slide.title || slide.badge_text) && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                    <div className="flex items-center gap-2">
                      {slide.badge_text && (
                        <span
                          className="text-[10px] font-semibold text-white px-2 py-0.5 rounded"
                          style={{ backgroundColor: slide.badge_color || '#822a6e' }}
                        >
                          {slide.badge_text}
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        {slide.title && <p className="text-white text-xs font-semibold truncate">{slide.title}</p>}
                        {slide.subtitle && <p className="text-white/70 text-[10px] truncate">{slide.subtitle}</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── FILTERS ───────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari slide..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">Semua Tipe</option>
          {CONTENT_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
          className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
        </select>
      </div>

      {/* ── SLIDE LIST ────────────────────────────────────── */}
      <div className="space-y-3">
        {filteredSlides.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Layers size={48} className="mx-auto mb-3 opacity-50" />
            <p className="font-medium">Belum ada slide</p>
            <p className="text-sm mt-1">Klik &quot;Tambah Slide&quot; untuk menambahkan konten slider</p>
          </div>
        ) : (
          filteredSlides.map((slide, idx) => {
            const typeInfo = getContentTypeInfo(slide.content_type);
            const actionInfo = getActionTypeInfo(slide.action_type);
            return (
              <div
                key={slide.id}
                className={`bg-white rounded-xl border p-4 flex items-center gap-4 transition hover:shadow-md ${
                  !slide.is_active ? 'opacity-60' : ''
                }`}
              >
                {/* Drag handle + order */}
                <div className="flex flex-col items-center gap-1 text-slate-300">
                  <GripVertical size={16} />
                  <span className="text-[10px] font-bold">{slide.sort_order}</span>
                </div>

                {/* Thumbnail */}
                <div className="w-28 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
                  <img
                    src={slide.image_url}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="112" height="64"><rect fill="%23e2e8f0" width="112" height="64"/><text x="50%" y="50%" fill="%2394a3b8" text-anchor="middle" dy=".3em" font-size="10">No Img</text></svg>'; }}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-[10px] font-semibold text-white px-2 py-0.5 rounded"
                      style={{ backgroundColor: typeInfo.color }}
                    >
                      {typeInfo.label}
                    </span>
                    {slide.badge_text && (
                      <span
                        className="text-[10px] font-semibold text-white px-2 py-0.5 rounded"
                        style={{ backgroundColor: slide.badge_color }}
                      >
                        {slide.badge_text}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                      {actionInfo.label}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {slide.title || '(tanpa judul)'}
                  </p>
                  {slide.subtitle && (
                    <p className="text-xs text-slate-400 truncate">{slide.subtitle}</p>
                  )}
                  {(slide.start_date || slide.end_date) && (
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                      <Calendar size={10} />
                      {slide.start_date && new Date(slide.start_date).toLocaleDateString('id-ID')}
                      {slide.start_date && slide.end_date && ' – '}
                      {slide.end_date && new Date(slide.end_date).toLocaleDateString('id-ID')}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleActive(slide)}
                    className={`p-2 rounded-lg transition ${slide.is_active ? 'text-green-500 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-50'}`}
                    title={slide.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  >
                    {slide.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  </button>
                  <button
                    onClick={() => moveSlide(slide, 'up')}
                    disabled={idx === 0}
                    className="p-2 rounded-lg text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition"
                    title="Naik"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    onClick={() => moveSlide(slide, 'down')}
                    disabled={idx === filteredSlides.length - 1}
                    className="p-2 rounded-lg text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition"
                    title="Turun"
                  >
                    <ArrowDown size={16} />
                  </button>
                  <button
                    onClick={() => duplicateSlide(slide)}
                    className="p-2 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-500 transition"
                    title="Duplikat"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    onClick={() => openEditForm(slide)}
                    className="p-2 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-500 transition"
                    title="Edit"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => slide.id && handleDelete(slide.id)}
                    className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition"
                    title="Hapus"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── FORM MODAL ────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => resetForm()}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-slate-800">
                {editingSlide ? 'Edit Slide' : 'Tambah Slide Baru'}
              </h2>
              <button onClick={resetForm} className="p-2 hover:bg-slate-100 rounded-lg transition">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              {/* Content Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tipe Konten</label>
                <div className="flex flex-wrap gap-2">
                  {CONTENT_TYPES.map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, content_type: type.value, content_id: null }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                        form.content_type === type.value
                          ? 'text-white border-transparent shadow'
                          : 'text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                      style={form.content_type === type.value ? { backgroundColor: type.color } : {}}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content ID Picker — only for types with data tables */}
              {CONTENT_TABLE_MAP[form.content_type || ''] && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                    <Link2 size={14} />
                    Pilih Item Spesifik
                    <span className="text-xs text-slate-400 font-normal">(opsional — untuk deep link ke detail)</span>
                  </label>
                  {loadingContentItems ? (
                    <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                      <Loader2 size={14} className="animate-spin" /> Memuat data...
                    </div>
                  ) : contentItems.length > 0 ? (
                    <select
                      value={form.content_id || ''}
                      onChange={e => setForm(f => ({ ...f, content_id: e.target.value || null }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Tanpa deep link (buka halaman utama fitur)</option>
                      {contentItems.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.title}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs text-slate-400 py-2">Belum ada data untuk tipe ini</p>
                  )}
                </div>
              )}

              {/* Image */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Gambar Slide *</label>
                <div className="flex items-start gap-4">
                  {/* Preview */}
                  <div className="w-40 h-24 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border-2 border-dashed border-slate-200">
                    {(file || form.image_url) ? (
                      <img
                        src={file ? URL.createObjectURL(file) : form.image_url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                        <ImageIcon size={24} />
                        <span className="text-[10px] mt-1">Preview</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={e => setFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm hover:bg-slate-50 transition"
                    >
                      <Upload size={16} />
                      Upload Gambar
                    </button>
                    <div className="text-xs text-slate-400">atau gunakan URL:</div>
                    <input
                      type="text"
                      value={form.image_url || ''}
                      onChange={e => { setForm(f => ({ ...f, image_url: e.target.value })); setFile(null); }}
                      placeholder="https://..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Judul</label>
                  <input
                    type="text"
                    value={form.title || ''}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Judul slide (opsional)"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={form.subtitle || ''}
                    onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                    placeholder="Subtitle (opsional)"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Badge */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Badge Text</label>
                  <input
                    type="text"
                    value={form.badge_text || ''}
                    onChange={e => setForm(f => ({ ...f, badge_text: e.target.value }))}
                    placeholder='misal: "BARU", "PROMO"'
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Badge Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.badge_color || '#822a6e'}
                      onChange={e => setForm(f => ({ ...f, badge_color: e.target.value }))}
                      className="w-10 h-10 rounded-lg border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={form.badge_color || '#822a6e'}
                      onChange={e => setForm(f => ({ ...f, badge_color: e.target.value }))}
                      className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>

              {/* Action */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Aksi Saat Di-tap</label>
                <div className="grid grid-cols-2 gap-2">
                  {ACTION_TYPES.map(action => (
                    <button
                      key={action.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, action_type: action.value }))}
                      className={`p-3 rounded-xl border text-left transition ${
                        form.action_type === action.value
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <p className="text-sm font-medium text-slate-700">{action.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{action.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Data — conditional */}
              {form.action_type === 'screen' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Screen Tujuan</label>
                  <select
                    value={form.action_data || ''}
                    onChange={e => setForm(f => ({ ...f, action_data: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Otomatis (berdasarkan tipe konten)</option>
                    <option value="mitra_dakwah">Mitra Dakwah (Iklan)</option>
                    <option value="kajian_offline">Kajian Rutin</option>
                    <option value="doa">Doa Harian</option>
                    <option value="dzikir">Dzikir Harian</option>
                    <option value="mimbar">Mimbar</option>
                    <option value="podcast">Podcast</option>
                    <option value="ebook">Ebook</option>
                    <option value="event">Event & Acara</option>
                  </select>
                </div>
              )}

              {form.action_type === 'url' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">URL Tujuan</label>
                  <div className="flex items-center gap-2">
                    <ExternalLink size={16} className="text-slate-400 flex-shrink-0" />
                    <input
                      type="url"
                      value={form.action_data || ''}
                      onChange={e => setForm(f => ({ ...f, action_data: e.target.value }))}
                      placeholder="https://..."
                      className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              )}

              {/* Scheduling */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Calendar size={14} />
                  Penjadwalan (Opsional)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500">Mulai Tayang</label>
                    <input
                      type="datetime-local"
                      value={form.start_date || ''}
                      onChange={e => setForm(f => ({ ...f, start_date: e.target.value || null }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Berhenti Tayang</label>
                    <input
                      type="datetime-local"
                      value={form.end_date || ''}
                      onChange={e => setForm(f => ({ ...f, end_date: e.target.value || null }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Urutan</label>
                <input
                  type="number"
                  value={form.sort_order ?? 0}
                  onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                  className="w-24 px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                  className={`relative w-12 h-6 rounded-full transition ${form.is_active ? 'bg-green-500' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition ${form.is_active ? 'left-6' : 'left-0.5'}`} />
                </button>
                <span className="text-sm text-slate-600">{form.is_active ? 'Aktif' : 'Nonaktif'}</span>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition disabled:opacity-50 shadow-lg shadow-primary/20"
                >
                  {(saving || uploading) ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {editingSlide ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
