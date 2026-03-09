'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Settings, ArrowUp, ArrowDown, Trash2, X, Power, PowerOff, Loader2 } from 'lucide-react';

interface DzikirCollectionType {
  id?: string;
  name: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  intro_arabic: string | null;
  intro_translation: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
}

interface DzikirItem {
  id?: number;
  collection_type: string;
  title: string;
  arabic: string;
  transliteration: string;
  translation: string;
  source: string;
  repetition: number;
  benefit: string;
  reference: string;
  note: string;
  audio_url: string;
  order_index: number;
  is_active: boolean;
  created_at?: string;
}

const EMOJI_OPTIONS = ['☀️', '🌙', '🤲', '🕌', '📿', '🌅', '🌃', '✨', '🕋', '📖', '🌟', '💫', '🎯', '🕐', '💎', '🌺', '⭐', '🔔', '💚', '🤍'];
const COLOR_PRESETS = ['#F59E0B', '#6366F1', '#14B8A6', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#822a6e', '#F97316'];

export default function DzikirManager() {
  // === Collections ===
  const [collections, setCollections] = useState<DzikirCollectionType[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showCatForm, setShowCatForm] = useState(false);
  const [editingCat, setEditingCat] = useState<DzikirCollectionType | null>(null);
  const [catName, setCatName] = useState('');
  const [catLabel, setCatLabel] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catIcon, setCatIcon] = useState('📿');
  const [catColor, setCatColor] = useState('#822a6e');
  const [catIntroArabic, setCatIntroArabic] = useState('');
  const [catIntroTranslation, setCatIntroTranslation] = useState('');
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({});

  // === Items ===
  const [activeTab, setActiveTab] = useState('');
  const [items, setItems] = useState<DzikirItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<DzikirItem | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [arabic, setArabic] = useState('');
  const [transliteration, setTransliteration] = useState('');
  const [translation, setTranslation] = useState('');
  const [source, setSource] = useState('');
  const [repetition, setRepetition] = useState(1);
  const [benefit, setBenefit] = useState('');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [orderIndex, setOrderIndex] = useState(0);

  // === Fetch Collections ===
  const fetchCollections = useCallback(async () => {
    setLoadingCollections(true);
    const { data } = await supabase
      .from('dzikir_collections')
      .select('*')
      .order('sort_order', { ascending: true });
    if (data) {
      setCollections(data);
      if (data.length > 0) {
        setActiveTab(prev => {
          const exists = data.find((c: DzikirCollectionType) => c.name === prev);
          if (exists) return prev;
          const firstActive = data.find((c: DzikirCollectionType) => c.is_active);
          return firstActive?.name || data[0].name;
        });
      }
    }
    // Fetch item counts per collection
    const { data: allItems } = await supabase.from('dzikir_items').select('collection_type');
    if (allItems) {
      const counts: Record<string, number> = {};
      allItems.forEach((item: { collection_type: string }) => {
        counts[item.collection_type] = (counts[item.collection_type] || 0) + 1;
      });
      setItemCounts(counts);
    }
    setLoadingCollections(false);
  }, []);

  const fetchItems = useCallback(async () => {
    if (!activeTab) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('dzikir_items')
      .select('*')
      .eq('collection_type', activeTab)
      .order('order_index', { ascending: true });
    if (data) setItems(data);
    if (error) console.error('Fetch error:', error);
    setLoading(false);
  }, [activeTab]);

  useEffect(() => { fetchCollections(); }, [fetchCollections]);
  useEffect(() => { fetchItems(); }, [fetchItems]);

  // === Category CRUD ===
  const resetCatForm = () => {
    setEditingCat(null);
    setCatName(''); setCatLabel(''); setCatDescription('');
    setCatIcon('📿'); setCatColor('#822a6e');
    setCatIntroArabic(''); setCatIntroTranslation('');
    setShowCatForm(false);
  };

  const openEditCat = (cat: DzikirCollectionType) => {
    setEditingCat(cat);
    setCatName(cat.name);
    setCatLabel(cat.label);
    setCatDescription(cat.description || '');
    setCatIcon(cat.icon || '📿');
    setCatColor(cat.color || '#822a6e');
    setCatIntroArabic(cat.intro_arabic || '');
    setCatIntroTranslation(cat.intro_translation || '');
    setShowCatForm(true);
  };

  const handleCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim() || !catLabel.trim()) {
      alert('Nama slug dan Label wajib diisi!');
      return;
    }
    const payload = {
      name: catName.trim().toLowerCase().replace(/\s+/g, '_'),
      label: catLabel.trim(),
      description: catDescription.trim(),
      icon: catIcon,
      color: catColor,
      intro_arabic: catIntroArabic.trim() || null,
      intro_translation: catIntroTranslation.trim() || null,
      sort_order: editingCat ? editingCat.sort_order : collections.length,
    };

    if (editingCat?.id) {
      const { error } = await supabase.from('dzikir_collections').update(payload).eq('id', editingCat.id);
      if (error) { alert('Gagal update: ' + error.message); return; }
    } else {
      const { error } = await supabase.from('dzikir_collections').insert([{ ...payload, is_active: true }]);
      if (error) { alert('Gagal tambah: ' + error.message); return; }
    }
    resetCatForm();
    fetchCollections();
  };

  const deleteCat = async (cat: DzikirCollectionType) => {
    const count = itemCounts[cat.name] || 0;
    const msg = count > 0
      ? `Kategori "${cat.label}" memiliki ${count} dzikir. Hapus kategori ini? (Dzikir tidak akan dihapus, hanya kategori-nya)`
      : `Hapus kategori "${cat.label}"?`;
    if (!confirm(msg)) return;
    await supabase.from('dzikir_collections').delete().eq('id', cat.id);
    fetchCollections();
  };

  const toggleCatActive = async (cat: DzikirCollectionType) => {
    await supabase.from('dzikir_collections').update({ is_active: !cat.is_active }).eq('id', cat.id);
    fetchCollections();
  };

  const moveCat = async (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= collections.length) return;
    const a = collections[idx];
    const b = collections[targetIdx];
    await supabase.from('dzikir_collections').update({ sort_order: b.sort_order }).eq('id', a.id);
    await supabase.from('dzikir_collections').update({ sort_order: a.sort_order }).eq('id', b.id);
    fetchCollections();
  };

  const resetForm = () => {
    setEditingItem(null);
    setTitle('');
    setArabic('');
    setTransliteration('');
    setTranslation('');
    setSource('');
    setRepetition(1);
    setBenefit('');
    setReference('');
    setNote('');
    setAudioUrl('');
    setOrderIndex(items.length);
    setShowForm(false);
  };

  const openEditForm = (item: DzikirItem) => {
    setEditingItem(item);
    setTitle(item.title || '');
    setArabic(item.arabic || '');
    setTransliteration(item.transliteration || '');
    setTranslation(item.translation || '');
    setSource(item.source || '');
    setRepetition(item.repetition || 1);
    setBenefit(item.benefit || '');
    setReference(item.reference || '');
    setNote(item.note || '');
    setAudioUrl(item.audio_url || '');
    setOrderIndex(item.order_index || 0);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openAddForm = () => {
    resetForm();
    setOrderIndex(items.length);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arabic.trim() || !translation.trim()) {
      alert('Teks Arab dan Terjemahan wajib diisi!');
      return;
    }

    const payload: Partial<DzikirItem> = {
      collection_type: activeTab,
      title: title.trim(),
      arabic: arabic.trim(),
      transliteration: transliteration.trim(),
      translation: translation.trim(),
      source: source.trim(),
      repetition,
      benefit: benefit.trim(),
      reference: reference.trim(),
      note: note.trim(),
      audio_url: audioUrl.trim(),
      order_index: orderIndex,
      is_active: true,
    };

    if (editingItem?.id) {
      const { error } = await supabase
        .from('dzikir_items')
        .update(payload)
        .eq('id', editingItem.id);
      if (error) {
        alert('Gagal update: ' + error.message);
        return;
      }
    } else {
      const { error } = await supabase.from('dzikir_items').insert([payload]);
      if (error) {
        alert('Gagal tambah: ' + error.message);
        return;
      }
    }

    alert(editingItem ? 'Berhasil diperbarui!' : 'Berhasil ditambahkan!');
    resetForm();
    fetchItems();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus dzikir ini?')) return;
    const { error } = await supabase.from('dzikir_items').delete().eq('id', id);
    if (error) {
      alert('Gagal hapus: ' + error.message);
      return;
    }
    fetchItems();
  };

  const toggleActive = async (item: DzikirItem) => {
    const { error } = await supabase
      .from('dzikir_items')
      .update({ is_active: !item.is_active })
      .eq('id', item.id);
    if (!error) fetchItems();
  };

  const moveItem = async (item: DzikirItem, direction: 'up' | 'down') => {
    const currentIndex = items.findIndex(i => i.id === item.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const targetItem = items[targetIndex];
    await supabase.from('dzikir_items').update({ order_index: targetItem.order_index }).eq('id', item.id);
    await supabase.from('dzikir_items').update({ order_index: item.order_index }).eq('id', targetItem.id);
    fetchItems();
  };

  const activeConfig = collections.find(c => c.name === activeTab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Kelola Dzikir</h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola kategori dan konten dzikir secara dinamis
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCategoryManager(!showCategoryManager)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
              showCategoryManager
                ? 'bg-primary text-white border-primary'
                : 'text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Settings size={16} />
            Kelola Kategori
          </button>
          {activeTab && (
            <button
              onClick={openAddForm}
              className="bg-primary hover:bg-[#6b2259] text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
            >
              <Plus size={16} />
              Tambah Dzikir
            </button>
          )}
        </div>
      </div>

      {/* ===== Category Manager ===== */}
      {showCategoryManager && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Kategori Dzikir</h2>
              <p className="text-xs text-slate-400 mt-1">Tambah, edit, dan urutkan kategori. Kategori baru otomatis muncul di aplikasi tanpa build ulang.</p>
            </div>
            <button
              onClick={() => { resetCatForm(); setShowCatForm(!showCatForm); }}
              className="bg-primary hover:bg-[#6b2259] text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
            >
              <Plus size={16} />
              Tambah Kategori
            </button>
          </div>

          {/* Category Form */}
          {showCatForm && (
            <form onSubmit={handleCatSubmit} className="bg-slate-50 rounded-xl p-5 space-y-4 border border-slate-100">
              <h3 className="text-sm font-bold text-slate-600">
                {editingCat ? 'Edit Kategori' : 'Tambah Kategori Baru'}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Nama Slug *</label>
                  <input
                    type="text"
                    value={catName}
                    onChange={e => setCatName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    placeholder="contoh: tidur"
                    required
                    disabled={!!editingCat}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Huruf kecil, tanpa spasi. Digunakan sebagai ID.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Label / Judul *</label>
                  <input
                    type="text"
                    value={catLabel}
                    onChange={e => setCatLabel(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    placeholder="contoh: Dzikir Sebelum Tidur"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Deskripsi</label>
                <input
                  type="text"
                  value={catDescription}
                  onChange={e => setCatDescription(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  placeholder="Dibaca sebelum tidur malam"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Ikon</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {EMOJI_OPTIONS.map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setCatIcon(emoji)}
                        className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                          catIcon === emoji ? 'bg-primary scale-110 shadow-md' : 'bg-white border border-slate-200 hover:border-primary/30'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Warna</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {COLOR_PRESETS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setCatColor(color)}
                        className={`w-8 h-8 rounded-full transition-all ${
                          catColor === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <input
                      type="color"
                      value={catColor}
                      onChange={e => setCatColor(e.target.value)}
                      className="w-8 h-8 rounded-full cursor-pointer border-0"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Teks Pembuka (Arab)</label>
                  <textarea
                    value={catIntroArabic}
                    onChange={e => setCatIntroArabic(e.target.value)}
                    rows={2}
                    dir="rtl"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-serif focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    placeholder="أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Terjemahan Pembuka</label>
                  <textarea
                    value={catIntroTranslation}
                    onChange={e => setCatIntroTranslation(e.target.value)}
                    rows={2}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    placeholder="Aku berlindung kepada Allah dari godaan syaitan yang terkutuk."
                  />
                </div>
              </div>
              {/* Preview */}
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: catColor + '20' }}>
                  {catIcon}
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-700">{catLabel || 'Nama Kategori'}</p>
                  <p className="text-[10px] text-slate-400">{catDescription || 'Deskripsi kategori'}</p>
                </div>
                <div className="ml-auto w-4 h-4 rounded-full" style={{ backgroundColor: catColor }} />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="bg-primary hover:bg-[#6b2259] text-white px-5 py-2 rounded-xl text-sm font-medium">
                  {editingCat ? 'Simpan' : 'Tambah'}
                </button>
                <button type="button" onClick={resetCatForm} className="px-5 py-2 rounded-xl text-sm text-slate-500 border border-slate-200 hover:bg-slate-50">
                  Batal
                </button>
              </div>
            </form>
          )}

          {/* Category List */}
          {loadingCollections ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-2">
              {collections.map((cat, idx) => (
                <div
                  key={cat.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    cat.is_active ? 'bg-white border-slate-100' : 'bg-slate-50 border-slate-100 opacity-50'
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => moveCat(idx, 'up')} disabled={idx === 0} className="text-slate-300 hover:text-slate-500 disabled:opacity-20">
                      <ArrowUp size={12} />
                    </button>
                    <button onClick={() => moveCat(idx, 'down')} disabled={idx === collections.length - 1} className="text-slate-300 hover:text-slate-500 disabled:opacity-20">
                      <ArrowDown size={12} />
                    </button>
                  </div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ backgroundColor: cat.color + '20' }}>
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-700">{cat.label}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-mono">{cat.name}</span>
                    </div>
                    <p className="text-[10px] text-slate-400">{cat.description}</p>
                  </div>
                  <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full shrink-0">
                    {itemCounts[cat.name] || 0} dzikir
                  </span>
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleCatActive(cat)}
                      className={`p-1.5 rounded-lg transition-colors ${cat.is_active ? 'text-green-500 hover:bg-green-50' : 'text-red-400 hover:bg-red-50'}`}
                      title={cat.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    >
                      {cat.is_active ? <Power size={14} /> : <PowerOff size={14} />}
                    </button>
                    <button onClick={() => openEditCat(cat)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 text-xs">
                      Edit
                    </button>
                    <button onClick={() => deleteCat(cat)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {collections.length === 0 && (
                <p className="text-center text-slate-400 text-sm py-8">Belum ada kategori. Tambahkan kategori pertama.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab Selector (Dynamic) */}
      {loadingCollections ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      ) : (
        <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex-wrap">
          {collections.filter(c => c.is_active).map(ct => (
            <button
              key={ct.name}
              onClick={() => { setActiveTab(ct.name); setShowForm(false); }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all min-w-30 ${
                activeTab === ct.name
                  ? 'text-white shadow-lg'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
              style={activeTab === ct.name ? { backgroundColor: ct.color, boxShadow: `0 4px 14px ${ct.color}33` } : undefined}
            >
              <span>{ct.icon}</span>
              {ct.label}
            </button>
          ))}
          {collections.filter(c => c.is_active).length === 0 && (
            <p className="text-sm text-slate-400 py-2 w-full text-center">Tidak ada kategori aktif. Buka &quot;Kelola Kategori&quot; untuk menambah.</p>
          )}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">
              {editingItem ? 'Edit Dzikir' : 'Tambah Dzikir Baru'}
            </h2>
            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 text-sm">
              Tutup
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Judul (opsional)</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  placeholder="Contoh: Sayyidul Istighfar"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Pengulangan</label>
                  <input
                    type="number"
                    min={1}
                    value={repetition}
                    onChange={e => setRepetition(parseInt(e.target.value) || 1)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Urutan</label>
                  <input
                    type="number"
                    min={0}
                    value={orderIndex}
                    onChange={e => setOrderIndex(parseInt(e.target.value) || 0)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Teks Arab *</label>
              <textarea
                value={arabic}
                onChange={e => setArabic(e.target.value)}
                rows={3}
                dir="rtl"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-lg leading-loose focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-serif"
                placeholder="Ketik teks Arab di sini..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Transliterasi Latin</label>
              <textarea
                value={transliteration}
                onChange={e => setTransliteration(e.target.value)}
                rows={2}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm italic focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                placeholder="A'udzu billahi minasy-syaithanir rajiim"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Terjemahan *</label>
              <textarea
                value={translation}
                onChange={e => setTranslation(e.target.value)}
                rows={3}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                placeholder="Aku berlindung kepada Allah dari setan yang terkutuk"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Sumber Hadits</label>
                <input
                  type="text"
                  value={source}
                  onChange={e => setSource(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  placeholder="HR. Bukhari No. 6306"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Referensi Kitab</label>
                <input
                  type="text"
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  placeholder="Hisnul Muslim No. 27"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Keutamaan / Fadhilah</label>
              <textarea
                value={benefit}
                onChange={e => setBenefit(e.target.value)}
                rows={2}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                placeholder="Barangsiapa membacanya di pagi hari..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Catatan</label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                placeholder="Catatan tambahan..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Audio URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={audioUrl}
                  onChange={e => setAudioUrl(e.target.value)}
                  className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  placeholder="https://... (link audio mp3)"
                />
                {audioUrl && (
                  <button type="button" onClick={() => {
                    const audio = new Audio(audioUrl);
                    audio.play().catch(() => alert('Gagal memutar audio'));
                    setTimeout(() => audio.pause(), 5000);
                  }} className="px-3 py-2 rounded-xl bg-green-50 text-green-600 text-xs font-semibold hover:bg-green-100 transition shrink-0">
                    Test
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Masukkan URL audio (mp3/m4a) dari storage atau link publik</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="bg-primary hover:bg-[#6b2259] text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-primary/20"
              >
                {editingItem ? 'Simpan Perubahan' : 'Tambah Dzikir'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 border border-slate-200"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Items List */}
      {activeConfig && (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="p-4 border-b border-slate-50">
          <h3 className="font-bold text-slate-700 flex items-center gap-2">
            <span>{activeConfig.icon}</span>
            {activeConfig.label}
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full ml-2">
              {items.length} item
            </span>
          </h3>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
            Memuat data...
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400 text-lg mb-2">Belum ada dzikir</p>
            <p className="text-slate-300 text-sm mb-4">Mulai tambahkan dzikir untuk {activeConfig?.label || 'koleksi ini'}</p>
            <button
              onClick={openAddForm}
              className="bg-primary hover:bg-[#6b2259] text-white px-4 py-2 rounded-xl text-sm font-medium"
            >
              + Tambah Dzikir Pertama
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {items.map((item, idx) => (
              <div key={item.id} className={`p-4 hover:bg-slate-50/50 transition-colors ${!item.is_active ? 'opacity-40' : ''}`}>
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-1 min-w-8">
                    <button
                      onClick={() => moveItem(item, 'up')}
                      disabled={idx === 0}
                      className="text-slate-300 hover:text-slate-500 disabled:opacity-30 text-xs"
                    >
                      &uarr;
                    </button>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 w-6 h-6 flex items-center justify-center rounded-full">
                      {idx + 1}
                    </span>
                    <button
                      onClick={() => moveItem(item, 'down')}
                      disabled={idx === items.length - 1}
                      className="text-slate-300 hover:text-slate-500 disabled:opacity-30 text-xs"
                    >
                      &darr;
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    {item.title && (
                      <p className="font-bold text-sm text-slate-700 mb-1">{item.title}</p>
                    )}
                    <p className="text-lg leading-loose text-right font-serif text-slate-800 mb-2" dir="rtl">
                      {item.arabic.length > 120 ? item.arabic.slice(0, 120) + '...' : item.arabic}
                    </p>
                    <p className="text-xs text-slate-500 line-clamp-2">{item.translation}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                        {item.repetition}x pengulangan
                      </span>
                      {item.source && (
                        <span className="text-[10px] text-slate-400">{item.source}</span>
                      )}
                      {item.audio_url && (
                        <span className="text-[10px] text-green-500">Audio</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleActive(item)}
                      className={`p-2 rounded-lg text-xs transition-colors ${
                        item.is_active ? 'text-green-500 hover:bg-green-50' : 'text-slate-300 hover:bg-slate-100'
                      }`}
                      title={item.is_active ? 'Aktif - klik untuk nonaktifkan' : 'Nonaktif - klik untuk aktifkan'}
                    >
                      {item.is_active ? 'Aktif' : 'Nonaktif'}
                    </button>
                    <button
                      onClick={() => openEditForm(item)}
                      className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 text-xs"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id!)}
                      className="p-2 rounded-lg text-red-400 hover:bg-red-50 text-xs"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

    </div>
  );
}