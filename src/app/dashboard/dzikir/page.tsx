'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { SEED_MAP } from '@/lib/dzikir-seed';

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

const COLLECTION_TYPES = [
  { value: 'pagi', label: 'Dzikir Pagi', color: 'bg-orange-500', icon: '\u2600\uFE0F' },
  { value: 'petang', label: 'Dzikir Petang', color: 'bg-indigo-500', icon: '\uD83C\uDF19' },
  { value: 'shalat', label: 'Dzikir Setelah Shalat', color: 'bg-teal-500', icon: '\uD83D\uDE4F' },
];


export default function DzikirManager() {
  const [activeTab, setActiveTab] = useState('pagi');
  const [items, setItems] = useState<DzikirItem[]>([]);
  const [loading, setLoading] = useState(true);
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

  const fetchItems = useCallback(async () => {
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

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

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

  const [importing, setImporting] = useState(false);

  const seedFromJson = async (collectionType: string) => {
    const seedItems = SEED_MAP[collectionType];
    if (!seedItems) return;

    if (!confirm(`Import ${seedItems.length} dzikir ${collectionType} dari JSON?\n\nData yang sudah ada di koleksi "${collectionType}" TIDAK akan dihapus. Item baru akan ditambahkan di bawah.`)) return;

    setImporting(true);
    try {
      const { data: existing } = await supabase
        .from('dzikir_items')
        .select('order_index')
        .eq('collection_type', collectionType)
        .order('order_index', { ascending: false })
        .limit(1);
      const startIndex = existing && existing.length > 0 ? existing[0].order_index + 1 : 0;

      const rows = seedItems.map((item, idx) => ({
        collection_type: collectionType,
        title: item.title || '',
        arabic: item.arabic || '',
        transliteration: item.transliteration || '',
        translation: item.translation || '',
        source: item.source || '',
        repetition: item.repetition || 1,
        benefit: item.benefit || '',
        reference: item.reference || '',
        note: item.note || '',
        order_index: startIndex + idx,
        is_active: true,
      }));

      const { error } = await supabase.from('dzikir_items').insert(rows);
      if (error) throw error;

      alert(`Berhasil import ${rows.length} dzikir ${collectionType}!`);
      if (collectionType === activeTab) fetchItems();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert('Gagal import: ' + message);
    } finally {
      setImporting(false);
    }
  };

  const seedAll = async () => {
    if (!confirm('Import SEMUA dzikir (pagi + petang + shalat) dari JSON?')) return;
    setImporting(true);
    for (const type of ['pagi', 'petang', 'shalat']) {
      const seedItems = SEED_MAP[type];
      const { data: existing } = await supabase
        .from('dzikir_items')
        .select('order_index')
        .eq('collection_type', type)
        .order('order_index', { ascending: false })
        .limit(1);
      const startIndex = existing && existing.length > 0 ? existing[0].order_index + 1 : 0;
      const rows = seedItems.map((item, idx) => ({
        collection_type: type,
        title: item.title || '',
        arabic: item.arabic || '',
        transliteration: item.transliteration || '',
        translation: item.translation || '',
        source: item.source || '',
        repetition: item.repetition || 1,
        benefit: item.benefit || '',
        reference: item.reference || '',
        note: item.note || '',
        order_index: startIndex + idx,
        is_active: true,
      }));
      const { error } = await supabase.from('dzikir_items').insert(rows);
      if (error) {
        alert(`Gagal import ${type}: ${error.message}`);
        setImporting(false);
        return;
      }
    }
    alert('Berhasil import semua dzikir!');
    fetchItems();
    setImporting(false);
  };

  const activeConfig = COLLECTION_TYPES.find(c => c.value === activeTab)!;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Kelola Dzikir</h1>
          <p className="text-sm text-slate-500 mt-1">
            Tambah, edit, dan kelola konten dzikir pagi, petang, dan setelah shalat
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">{items.length} dzikir</span>
          <button
            onClick={openAddForm}
            className="bg-[#822a6e] hover:bg-[#6b2259] text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-lg shadow-[#822a6e]/20"
          >
            + Tambah Dzikir
          </button>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
        {COLLECTION_TYPES.map(ct => (
          <button
            key={ct.value}
            onClick={() => { setActiveTab(ct.value); setShowForm(false); }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === ct.value
                ? 'bg-[#822a6e] text-white shadow-lg shadow-[#822a6e]/20'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <span>{ct.icon}</span>
            {ct.label}
          </button>
        ))}
      </div>

      {/* Seed Buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => seedFromJson(activeTab)}
          disabled={importing}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 disabled:opacity-50 transition"
        >
          Import Seed: {activeConfig.label}
        </button>
        <button
          onClick={seedAll}
          disabled={importing}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 disabled:opacity-50 transition"
        >
          {importing ? 'Mengimpor...' : 'Import Semua Dzikir'}
        </button>
      </div>

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
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#822a6e]/20 focus:border-[#822a6e] outline-none"
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
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#822a6e]/20 focus:border-[#822a6e] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Urutan</label>
                  <input
                    type="number"
                    min={0}
                    value={orderIndex}
                    onChange={e => setOrderIndex(parseInt(e.target.value) || 0)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#822a6e]/20 focus:border-[#822a6e] outline-none"
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
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-lg leading-loose focus:ring-2 focus:ring-[#822a6e]/20 focus:border-[#822a6e] outline-none font-serif"
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
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm italic focus:ring-2 focus:ring-[#822a6e]/20 focus:border-[#822a6e] outline-none"
                placeholder="A'udzu billahi minasy-syaithanir rajiim"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Terjemahan *</label>
              <textarea
                value={translation}
                onChange={e => setTranslation(e.target.value)}
                rows={3}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#822a6e]/20 focus:border-[#822a6e] outline-none"
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
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#822a6e]/20 focus:border-[#822a6e] outline-none"
                  placeholder="HR. Bukhari No. 6306"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Referensi Kitab</label>
                <input
                  type="text"
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#822a6e]/20 focus:border-[#822a6e] outline-none"
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
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#822a6e]/20 focus:border-[#822a6e] outline-none"
                placeholder="Barangsiapa membacanya di pagi hari..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Catatan</label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#822a6e]/20 focus:border-[#822a6e] outline-none"
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
                  className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#822a6e]/20 focus:border-[#822a6e] outline-none"
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
                className="bg-[#822a6e] hover:bg-[#6b2259] text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-[#822a6e]/20"
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
            <div className="animate-spin w-8 h-8 border-2 border-[#822a6e] border-t-transparent rounded-full mx-auto mb-3" />
            Memuat data...
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400 text-lg mb-2">Belum ada dzikir</p>
            <p className="text-slate-300 text-sm mb-4">Mulai tambahkan dzikir untuk {activeConfig.label}</p>
            <button
              onClick={openAddForm}
              className="bg-[#822a6e] hover:bg-[#6b2259] text-white px-4 py-2 rounded-xl text-sm font-medium"
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
                      <span className="text-[10px] bg-[#822a6e]/10 text-[#822a6e] px-2 py-0.5 rounded-full font-medium">
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

    </div>
  );
}