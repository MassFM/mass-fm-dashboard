'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { PosterCategory } from '@/types/database';
import {
  Plus, Trash2, Save, X, GripVertical, Palette,
  FolderOpen, Edit3, Power, PowerOff, Loader2,
} from 'lucide-react';

const PRESET_COLORS = [
  '#822a6e', '#E65100', '#1565C0', '#2E7D32',
  '#6A1B9A', '#C62828', '#00838F', '#4E342E',
  '#F9A825', '#37474F',
];

export default function PosterCategoriesPage() {
  const [categories, setCategories] = useState<PosterCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [posterCounts, setPosterCounts] = useState<Record<string, number>>({});

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formColor, setFormColor] = useState('#822a6e');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    const { data, error } = await supabase
      .from('poster_categories')
      .select('*')
      .order('sort_order', { ascending: true });
    if (!error && data) setCategories(data);

    // Count posters per category
    const { data: posters } = await supabase
      .from('posters')
      .select('category_id');
    if (posters) {
      const counts: Record<string, number> = {};
      posters.forEach((p: any) => {
        const key = p.category_id || 'uncategorized';
        counts[key] = (counts[key] || 0) + 1;
      });
      setPosterCounts(counts);
    }
    setLoading(false);
  }

  function openCreate() {
    setEditingId(null);
    setFormName('');
    setFormDesc('');
    setFormColor('#822a6e');
    setShowForm(true);
  }

  function openEdit(cat: PosterCategory) {
    setEditingId(cat.id!);
    setFormName(cat.name);
    setFormDesc(cat.description);
    setFormColor(cat.color);
    setShowForm(true);
  }

  async function handleSave() {
    if (!formName.trim()) return;
    setSaving(true);

    if (editingId) {
      await supabase.from('poster_categories').update({
        name: formName.trim(),
        description: formDesc.trim(),
        color: formColor,
      }).eq('id', editingId);
    } else {
      const nextOrder = categories.length > 0
        ? Math.max(...categories.map(c => c.sort_order)) + 1
        : 0;
      await supabase.from('poster_categories').insert({
        name: formName.trim(),
        description: formDesc.trim(),
        color: formColor,
        sort_order: nextOrder,
      });
    }

    setSaving(false);
    setShowForm(false);
    fetchCategories();
  }

  async function handleDelete(id: string) {
    const count = posterCounts[id] || 0;
    const msg = count > 0
      ? `Kategori ini memiliki ${count} poster. Poster akan menjadi tanpa kategori. Lanjutkan hapus?`
      : 'Yakin ingin menghapus kategori ini?';
    if (!confirm(msg)) return;

    await supabase.from('posters').update({ category_id: null }).eq('category_id', id);
    await supabase.from('poster_categories').delete().eq('id', id);
    fetchCategories();
  }

  async function toggleActive(cat: PosterCategory) {
    await supabase.from('poster_categories').update({
      is_active: !cat.is_active,
    }).eq('id', cat.id);
    fetchCategories();
  }

  async function moveCategory(index: number, direction: 'up' | 'down') {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === categories.length - 1) return;

    const newCats = [...categories];
    const target = direction === 'up' ? index - 1 : index + 1;
    [newCats[index], newCats[target]] = [newCats[target], newCats[index]];

    const updates = newCats.map((c, i) => ({ id: c.id, name: c.name, sort_order: i }));
    await supabase.from('poster_categories').upsert(updates);
    fetchCategories();
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-800">Kategori Poster</h1>
          <p className="text-slate-500 text-sm mt-1">
            Organisasi poster dakwah dengan kategori. Poster bisa ditampilkan/disembunyikan per kategori.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-secondary transition-colors shadow-sm"
        >
          <Plus size={18} />
          Tambah Kategori
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">
                {editingId ? 'Edit Kategori' : 'Kategori Baru'}
              </h2>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Nama Kategori</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Contoh: Ramadhan, Hadits, Fiqih..."
                  className="w-full rounded-xl border-slate-200 focus:ring-primary focus:border-primary text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Deskripsi</label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  placeholder="Deskripsi singkat (opsional)"
                  className="w-full rounded-xl border-slate-200 focus:ring-primary focus:border-primary text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Warna Label</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setFormColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        formColor === color ? 'border-slate-800 scale-110 shadow-md' : 'border-transparent hover:border-slate-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <div className="relative">
                    <input
                      type="color"
                      value={formColor}
                      onChange={e => setFormColor(e.target.value)}
                      className="w-8 h-8 rounded-full cursor-pointer border-0 p-0"
                      title="Pilih warna custom"
                    />
                  </div>
                </div>
              </div>
              {/* Preview */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Preview</label>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: formColor + '18' }}
                  >
                    <FolderOpen size={20} style={{ color: formColor }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-700">{formName || 'Nama Kategori'}</p>
                    <p className="text-xs text-slate-400">{formDesc || 'Deskripsi'}</p>
                  </div>
                  <span
                    className="ml-auto text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: formColor + '18', color: formColor }}
                  >
                    LABEL
                  </span>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex gap-3 justify-end">
              <button
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formName.trim()}
                className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-secondary disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {editingId ? 'Simpan Perubahan' : 'Buat Kategori'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-primary" />
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
          <FolderOpen size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-400 font-semibold">Belum ada kategori poster</p>
          <p className="text-slate-300 text-sm mt-1">Buat kategori pertama untuk mengorganisasi poster dakwah</p>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat, index) => {
            const count = posterCounts[cat.id!] || 0;
            return (
              <div
                key={cat.id}
                className={`bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 group transition-all hover:shadow-sm ${
                  !cat.is_active ? 'opacity-60' : ''
                }`}
              >
                {/* Drag / Order */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => moveCategory(index, 'up')}
                    disabled={index === 0}
                    className="text-slate-300 hover:text-primary disabled:opacity-30 transition-colors"
                  >
                    <GripVertical size={14} className="rotate-180" />
                  </button>
                  <button
                    onClick={() => moveCategory(index, 'down')}
                    disabled={index === categories.length - 1}
                    className="text-slate-300 hover:text-primary disabled:opacity-30 transition-colors"
                  >
                    <GripVertical size={14} />
                  </button>
                </div>

                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: cat.color + '15' }}
                >
                  <FolderOpen size={22} style={{ color: cat.color }} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-700 text-sm">{cat.name}</h3>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: cat.color + '18', color: cat.color }}
                    >
                      {count} poster
                    </span>
                    {!cat.is_active && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-400">
                        NONAKTIF
                      </span>
                    )}
                  </div>
                  {cat.description && (
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{cat.description}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => toggleActive(cat)}
                    className={`p-2 rounded-lg transition-colors ${
                      cat.is_active
                        ? 'text-green-500 hover:bg-green-50'
                        : 'text-red-400 hover:bg-red-50'
                    }`}
                    title={cat.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  >
                    {cat.is_active ? <Power size={16} /> : <PowerOff size={16} />}
                  </button>
                  <button
                    onClick={() => openEdit(cat)}
                    className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 transition-colors"
                    title="Edit"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id!)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Hapus"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-700">
        <p className="font-semibold mb-1">💡 Tips</p>
        <ul className="list-disc list-inside space-y-1 text-xs text-amber-600">
          <li>Kategori yang <strong>nonaktif</strong> tidak akan ditampilkan di aplikasi beserta poster-posternya</li>
          <li>Menghapus kategori tidak menghapus posternya — poster akan menjadi &quot;Tanpa Kategori&quot;</li>
          <li>Gunakan warna berbeda agar mudah dibedakan di daftar poster</li>
        </ul>
      </div>
    </div>
  );
}
