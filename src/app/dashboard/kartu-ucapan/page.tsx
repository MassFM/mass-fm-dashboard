'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { GreetingCard, TextFieldConfig } from '@/types/database';
import {
  Image as ImageIcon, Trash2, Edit3, Save, X, Plus, Eye, EyeOff,
  ChevronDown, ChevronUp, GripVertical, Copy, ToggleLeft, ToggleRight,
  Download, Move,
} from 'lucide-react';

// ─── Konstanta ─────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'pernikahan', label: '💍 Pernikahan', color: '#E91E63' },
  { value: 'kelahiran', label: '👶 Kelahiran', color: '#4CAF50' },
  { value: 'dukacita', label: '🕊️ Duka Cita', color: '#607D8B' },
  { value: 'kesembuhan', label: '🤲 Doa Kesembuhan', color: '#00BCD4' },
  { value: 'idul_fitri', label: '🌙 Idul Fitri', color: '#FFC107' },
  { value: 'idul_adha', label: '🐪 Idul Adha', color: '#FF9800' },
  { value: 'ramadhan', label: '☪️ Ramadhan', color: '#9C27B0' },
  { value: 'tahun_baru_hijriyah', label: '📅 Tahun Baru Hijriyah', color: '#3F51B5' },
  { value: 'umum', label: '✨ Umum', color: '#795548' },
];

const WATERMARK_POSITIONS = [
  { value: 'bottom-center', label: 'Bawah Tengah' },
  { value: 'bottom-left', label: 'Bawah Kiri' },
  { value: 'bottom-right', label: 'Bawah Kanan' },
  { value: 'top-left', label: 'Atas Kiri' },
  { value: 'top-right', label: 'Atas Kanan' },
];

const defaultTextField = (label: string, y: number, enabled = true): TextFieldConfig => ({
  x: 50,
  y,
  fontSize: 18,
  color: '#FFFFFF',
  align: 'center' as const,
  label,
  enabled,
  fontWeight: 'bold' as const,
  maxLines: 1,
});

// ─── Halaman Utama ─────────────────────────────────────────────────

export default function ManajemenKartuUcapan() {
  const [cards, setCards] = useState<GreetingCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCard, setEditingCard] = useState<GreetingCard | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('greeting_cards')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) console.error(error);
    else setCards((data as GreetingCard[]) || []);
    setLoading(false);
  };

  const handleDelete = async (card: GreetingCard) => {
    if (!confirm(`Hapus kartu "${card.title}"?`)) return;
    try {
      // Hapus file dari storage
      const fileName = card.image_url.split('/').pop();
      if (fileName) {
        await supabase.storage.from('greeting-cards').remove([fileName]);
      }
      await supabase.from('greeting_cards').delete().eq('id', card.id);
      fetchCards();
    } catch (e: any) {
      alert('Gagal menghapus: ' + e.message);
    }
  };

  const handleToggleActive = async (card: GreetingCard) => {
    await supabase.from('greeting_cards').update({ is_active: !card.is_active }).eq('id', card.id);
    fetchCards();
  };

  const handleDuplicate = async (card: GreetingCard) => {
    const { id, created_at, ...rest } = card;
    const maxOrder = Math.max(0, ...cards.map(c => c.sort_order));
    await supabase.from('greeting_cards').insert([{
      ...rest,
      title: `${card.title} (salinan)`,
      sort_order: maxOrder + 1,
    }]);
    fetchCards();
  };

  const filteredCards = filterCategory === 'all'
    ? cards
    : cards.filter(c => c.category === filterCategory);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-primary">Kartu Ucapan</h1>
          <p className="text-sm text-slate-400 mt-1">Kelola template kartu ucapan untuk pengguna aplikasi</p>
        </div>
        <button
          onClick={() => { setEditingCard(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-secondary transition-colors"
        >
          <Plus size={18} /> Tambah Template
        </button>
      </div>

      {/* Filter Kategori */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            filterCategory === 'all' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
        >
          Semua ({cards.length})
        </button>
        {CATEGORIES.map(cat => {
          const count = cards.filter(c => c.category === cat.value).length;
          return (
            <button
              key={cat.value}
              onClick={() => setFilterCategory(cat.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filterCategory === cat.value ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Daftar Kartu */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Memuat data...</div>
      ) : filteredCards.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <ImageIcon size={48} className="mx-auto mb-3 opacity-30" />
          <p>Belum ada template kartu ucapan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              onEdit={() => { setEditingCard(card); setShowForm(true); }}
              onDelete={() => handleDelete(card)}
              onToggle={() => handleToggleActive(card)}
              onDuplicate={() => handleDuplicate(card)}
            />
          ))}
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <CardFormModal
          card={editingCard}
          onClose={() => { setShowForm(false); setEditingCard(null); }}
          onSaved={() => { setShowForm(false); setEditingCard(null); fetchCards(); }}
        />
      )}
    </div>
  );
}

// ─── Card Item ─────────────────────────────────────────────────────

function CardItem({ card, onEdit, onDelete, onToggle, onDuplicate }: {
  card: GreetingCard;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onDuplicate: () => void;
}) {
  const cat = CATEGORIES.find(c => c.value === card.category);

  return (
    <div className={`bg-white rounded-2xl overflow-hidden shadow-sm border transition-opacity ${
      card.is_active ? 'border-slate-100' : 'border-red-100 opacity-60'
    }`}>
      {/* Preview Image */}
      <div className="aspect-[9/16] relative group bg-slate-50">
        <img
          src={card.image_url}
          alt={card.title}
          className="w-full h-full object-cover"
        />
        {/* Overlay actions */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button onClick={onEdit} className="p-2.5 bg-white rounded-xl text-primary hover:bg-primary hover:text-white transition-colors" title="Edit">
            <Edit3 size={18} />
          </button>
          <button onClick={onDuplicate} className="p-2.5 bg-white rounded-xl text-primary hover:bg-primary hover:text-white transition-colors" title="Duplikat">
            <Copy size={18} />
          </button>
          <button onClick={onDelete} className="p-2.5 bg-white rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-colors" title="Hapus">
            <Trash2 size={18} />
          </button>
        </div>
        {/* Category badge */}
        <span
          className="absolute top-2 left-2 px-2 py-1 rounded-lg text-[10px] font-bold text-white"
          style={{ backgroundColor: cat?.color || '#666' }}
        >
          {cat?.label || card.category}
        </span>
        {!card.is_active && (
          <span className="absolute top-2 right-2 px-2 py-1 bg-red-500 rounded-lg text-[10px] font-bold text-white">
            Nonaktif
          </span>
        )}
        {card.is_seasonal && (
          <span className="absolute bottom-2 left-2 px-2 py-1 bg-amber-500 rounded-lg text-[10px] font-bold text-white">
            Musiman
          </span>
        )}
      </div>
      {/* Info */}
      <div className="p-4">
        <h3 className="font-bold text-slate-700 text-sm truncate">{card.title}</h3>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-1">
            {(card.sender_field as TextFieldConfig)?.enabled && (
              <span className="text-[10px] bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded font-medium">Pengirim</span>
            )}
            {(card.receiver_field as TextFieldConfig)?.enabled && (
              <span className="text-[10px] bg-green-50 text-green-500 px-1.5 py-0.5 rounded font-medium">Penerima</span>
            )}
            {(card.footnote_field as TextFieldConfig)?.enabled && (
              <span className="text-[10px] bg-amber-50 text-amber-500 px-1.5 py-0.5 rounded font-medium">Footnote</span>
            )}
          </div>
          <button onClick={onToggle} className="text-slate-400 hover:text-primary" title={card.is_active ? 'Nonaktifkan' : 'Aktifkan'}>
            {card.is_active ? <ToggleRight size={22} className="text-green-500" /> : <ToggleLeft size={22} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Card Form Modal ───────────────────────────────────────────────

function CardFormModal({ card, onClose, onSaved }: {
  card: GreetingCard | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!card;

  // Form state
  const [category, setCategory] = useState(card?.category || 'umum');
  const [title, setTitle] = useState(card?.title || '');
  const [imageUrl, setImageUrl] = useState(card?.image_url || '');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(card?.image_url || '');
  const [senderField, setSenderField] = useState<TextFieldConfig>(
    (card?.sender_field as TextFieldConfig) || defaultTextField('Nama Pengirim', 72)
  );
  const [receiverField, setReceiverField] = useState<TextFieldConfig>(
    (card?.receiver_field as TextFieldConfig) || defaultTextField('Nama Penerima', 45)
  );
  const [footnoteField, setFootnoteField] = useState<TextFieldConfig>(
    (card?.footnote_field as TextFieldConfig) || defaultTextField('Keterangan', 88, false)
  );
  const [watermarkPos, setWatermarkPos] = useState(card?.watermark_position || 'bottom-center');
  const [showLogo, setShowLogo] = useState(card?.show_logo ?? true);
  const [isActive, setIsActive] = useState(card?.is_active ?? true);
  const [isSeasonal, setIsSeasonal] = useState(card?.is_seasonal ?? false);
  const [seasonStart, setSeasonStart] = useState(card?.season_start || '');
  const [seasonEnd, setSeasonEnd] = useState(card?.season_end || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Preview state: which field is being dragged
  const [draggingField, setDraggingField] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreviewUrl(URL.createObjectURL(f));
    }
  };

  // Upload file ke storage
  const uploadImage = async (): Promise<string> => {
    if (!file) return imageUrl;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `card_${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('greeting-cards').upload(fileName, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('greeting-cards').getPublicUrl(fileName);
      setUploading(false);
      return publicUrl;
    } catch (e: any) {
      setUploading(false);
      throw e;
    }
  };

  // Handle drag di preview
  const handlePreviewMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggingField || !previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const x = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100));

    if (draggingField === 'sender') setSenderField(p => ({ ...p, x: Math.round(x), y: Math.round(y) }));
    else if (draggingField === 'receiver') setReceiverField(p => ({ ...p, x: Math.round(x), y: Math.round(y) }));
    else if (draggingField === 'footnote') setFootnoteField(p => ({ ...p, x: Math.round(x), y: Math.round(y) }));
  }, [draggingField]);

  const handlePreviewMouseUp = () => setDraggingField(null);

  // Save
  const handleSave = async () => {
    if (!title.trim()) return alert('Judul wajib diisi');
    if (!previewUrl && !file) return alert('Gambar template wajib diupload');

    setSaving(true);
    try {
      const finalImageUrl = await uploadImage();
      const payload = {
        category,
        title: title.trim(),
        image_url: finalImageUrl,
        sender_field: senderField,
        receiver_field: receiverField,
        footnote_field: footnoteField,
        watermark_position: watermarkPos,
        show_logo: showLogo,
        is_active: isActive,
        is_seasonal: isSeasonal,
        season_start: isSeasonal && seasonStart ? seasonStart : null,
        season_end: isSeasonal && seasonEnd ? seasonEnd : null,
        sort_order: card?.sort_order ?? 0,
      };

      if (isEdit) {
        const { error } = await supabase.from('greeting_cards').update(payload).eq('id', card.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('greeting_cards').insert([payload]);
        if (error) throw error;
      }

      onSaved();
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[95vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center rounded-t-3xl z-10">
          <h2 className="font-display font-bold text-primary text-lg">
            {isEdit ? 'Edit Template' : 'Tambah Template Baru'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 p-1">
            <X size={22} />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Form */}
          <div className="space-y-5">
            {/* Kategori */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border-slate-200 text-sm focus:ring-primary focus:border-primary"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Judul */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Judul Template</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Selamat Menempuh Hidup Baru..."
                className="w-full rounded-xl border-slate-200 text-sm focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Upload Gambar */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Gambar Template</label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center relative hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <ImageIcon size={24} className="mx-auto mb-2 text-slate-300" />
                <p className="text-xs text-slate-400">
                  {file ? file.name : 'Klik untuk pilih gambar (rasio 9:16 portrait untuk Story/Status)'}
                </p>
              </div>
            </div>

            {/* Text Fields */}
            <TextFieldEditor label="Field Penerima" field={receiverField} onChange={setReceiverField} color="green" />
            <TextFieldEditor label="Field Pengirim" field={senderField} onChange={setSenderField} color="blue" />
            <TextFieldEditor label="Field Keterangan" field={footnoteField} onChange={setFootnoteField} color="amber" />

            {/* Watermark */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Posisi Watermark</label>
                <select
                  value={watermarkPos}
                  onChange={(e) => setWatermarkPos(e.target.value)}
                  className="w-full rounded-xl border-slate-200 text-xs focus:ring-primary focus:border-primary"
                >
                  {WATERMARK_POSITIONS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-3 pb-1">
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={showLogo} onChange={(e) => setShowLogo(e.target.checked)} className="rounded text-primary focus:ring-primary" />
                  Tampilkan Logo
                </label>
              </div>
            </div>

            {/* Status */}
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded text-primary focus:ring-primary" />
                Aktif
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={isSeasonal} onChange={(e) => setIsSeasonal(e.target.checked)} className="rounded text-primary focus:ring-primary" />
                Musiman
              </label>
            </div>

            {/* Tanggal musiman */}
            {isSeasonal && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Mulai</label>
                  <input
                    type="date"
                    value={seasonStart}
                    onChange={(e) => setSeasonStart(e.target.value)}
                    className="w-full rounded-xl border-slate-200 text-xs focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Selesai</label>
                  <input
                    type="date"
                    value={seasonEnd}
                    onChange={(e) => setSeasonEnd(e.target.value)}
                    className="w-full rounded-xl border-slate-200 text-xs focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right: Live Preview */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">
              Preview — seret teks untuk atur posisi
            </label>
            <div
              ref={previewRef}
              className="relative bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 select-none"
              style={{ aspectRatio: '9/16' }}
              onMouseMove={handlePreviewMouseMove}
              onMouseUp={handlePreviewMouseUp}
              onMouseLeave={handlePreviewMouseUp}
            >
              {previewUrl ? (
                <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <ImageIcon size={48} />
                </div>
              )}

              {/* Text overlay: Receiver */}
              {receiverField.enabled && (
                <DraggableTextField
                  field={receiverField}
                  text="Ahmad Fadhil"
                  color="green"
                  onDragStart={() => setDraggingField('receiver')}
                  isDragging={draggingField === 'receiver'}
                />
              )}

              {/* Text overlay: Sender */}
              {senderField.enabled && (
                <DraggableTextField
                  field={senderField}
                  text="Keluarga Besar Radio Mass FM"
                  color="blue"
                  onDragStart={() => setDraggingField('sender')}
                  isDragging={draggingField === 'sender'}
                />
              )}

              {/* Text overlay: Footnote */}
              {footnoteField.enabled && (
                <DraggableTextField
                  field={footnoteField}
                  text="Sragen, 7 Maret 2026"
                  color="amber"
                  onDragStart={() => setDraggingField('footnote')}
                  isDragging={draggingField === 'footnote'}
                />
              )}

              {/* Watermark preview */}
              {showLogo && (
                <WatermarkPreview position={watermarkPos} />
              )}
            </div>

            <p className="text-[10px] text-slate-400 mt-2 text-center">
              💡 Drag teks di atas gambar untuk mengatur posisi. Warna border menunjukkan field mana.
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex justify-end gap-3 rounded-b-3xl">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100">
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-white hover:bg-secondary disabled:opacity-50 flex items-center gap-2"
          >
            <Save size={16} />
            {saving ? 'Menyimpan...' : uploading ? 'Mengunggah...' : isEdit ? 'Simpan Perubahan' : 'Publikasikan'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Text Field Editor ─────────────────────────────────────────────

function TextFieldEditor({ label, field, onChange, color }: {
  label: string;
  field: TextFieldConfig;
  onChange: (f: TextFieldConfig) => void;
  color: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const borderColor = { blue: 'border-blue-200', green: 'border-green-200', amber: 'border-amber-200' }[color] || 'border-slate-200';
  const bgColor = { blue: 'bg-blue-50', green: 'bg-green-50', amber: 'bg-amber-50' }[color] || 'bg-slate-50';

  return (
    <div className={`rounded-xl border ${borderColor} ${bgColor} p-3`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs cursor-pointer font-bold text-slate-600">
            <input
              type="checkbox"
              checked={field.enabled}
              onChange={(e) => onChange({ ...field, enabled: e.target.checked })}
              className={`rounded text-primary focus:ring-primary`}
            />
            {label}
          </label>
          <span className="text-[10px] text-slate-400">({field.x}%, {field.y}%)</span>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="text-slate-400 hover:text-primary p-1">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {expanded && field.enabled && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-slate-400 font-bold">Label</label>
            <input value={field.label} onChange={(e) => onChange({ ...field, label: e.target.value })}
              className="w-full rounded-lg border-slate-200 text-xs p-1.5" />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-bold">Ukuran Font</label>
            <input type="number" value={field.fontSize} min={8} max={72}
              onChange={(e) => onChange({ ...field, fontSize: Number(e.target.value) })}
              className="w-full rounded-lg border-slate-200 text-xs p-1.5" />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-bold">Warna</label>
            <div className="flex gap-1">
              <input type="color" value={field.color} onChange={(e) => onChange({ ...field, color: e.target.value })}
                className="w-8 h-8 rounded border-0 cursor-pointer" />
              <input value={field.color} onChange={(e) => onChange({ ...field, color: e.target.value })}
                className="flex-1 rounded-lg border-slate-200 text-xs p-1.5 font-mono" />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-bold">Rata Teks</label>
            <select value={field.align} onChange={(e) => onChange({ ...field, align: e.target.value as TextFieldConfig['align'] })}
              className="w-full rounded-lg border-slate-200 text-xs p-1.5">
              <option value="left">Kiri</option>
              <option value="center">Tengah</option>
              <option value="right">Kanan</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-bold">Tebal</label>
            <select value={field.fontWeight} onChange={(e) => onChange({ ...field, fontWeight: e.target.value as 'normal' | 'bold' })}
              className="w-full rounded-lg border-slate-200 text-xs p-1.5">
              <option value="normal">Normal</option>
              <option value="bold">Bold</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-bold">Maks. Baris</label>
            <input type="number" value={field.maxLines} min={1} max={5}
              onChange={(e) => onChange({ ...field, maxLines: Number(e.target.value) })}
              className="w-full rounded-lg border-slate-200 text-xs p-1.5" />
          </div>
          <div className="col-span-2 grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 font-bold">Posisi X (%)</label>
              <input type="range" min={5} max={95} value={field.x}
                onChange={(e) => onChange({ ...field, x: Number(e.target.value) })}
                className="w-full accent-primary" />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold">Posisi Y (%)</label>
              <input type="range" min={5} max={95} value={field.y}
                onChange={(e) => onChange({ ...field, y: Number(e.target.value) })}
                className="w-full accent-primary" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Draggable Text in Preview ─────────────────────────────────────

function DraggableTextField({ field, text, color, onDragStart, isDragging }: {
  field: TextFieldConfig;
  text: string;
  color: string;
  onDragStart: () => void;
  isDragging: boolean;
}) {
  const borderColors: Record<string, string> = {
    blue: 'border-blue-400',
    green: 'border-green-400',
    amber: 'border-amber-400',
  };

  // Compute transform based on alignment
  const translateX = field.align === 'center' ? '-50%' : field.align === 'right' ? '-100%' : '0%';

  return (
    <div
      className={`absolute cursor-move border-2 border-dashed ${borderColors[color] || 'border-white'} rounded px-2 py-1 ${isDragging ? 'opacity-90 scale-105' : 'opacity-80 hover:opacity-100'} transition-all`}
      style={{
        left: `${field.x}%`,
        top: `${field.y}%`,
        transform: `translate(${translateX}, -50%)`,
        textAlign: field.align as any,
        maxWidth: '80%',
      }}
      onMouseDown={(e) => { e.preventDefault(); onDragStart(); }}
    >
      <p style={{
        fontSize: `${Math.max(8, field.fontSize * 0.55)}px`,
        color: field.color,
        fontWeight: field.fontWeight === 'bold' ? 700 : 400,
        textShadow: '0 1px 3px rgba(0,0,0,0.5)',
        lineHeight: 1.3,
        whiteSpace: 'nowrap',
      }}>
        {text}
      </p>
      <div className={`absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full ${
        { blue: 'bg-blue-400', green: 'bg-green-400', amber: 'bg-amber-400' }[color] || 'bg-white'
      }`} />
    </div>
  );
}

// ─── Watermark Preview ─────────────────────────────────────────────

function WatermarkPreview({ position }: { position: string }) {
  const posStyles: Record<string, string> = {
    'bottom-center': 'bottom-2 left-1/2 -translate-x-1/2',
    'bottom-left': 'bottom-2 left-2',
    'bottom-right': 'bottom-2 right-2',
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2',
  };

  return (
    <div className={`absolute ${posStyles[position] || posStyles['bottom-center']} flex items-center gap-1 bg-black/30 rounded-lg px-2 py-1`}>
      <div className="w-3 h-3 bg-white/80 rounded-sm" /> {/* Logo placeholder */}
      <span className="text-[7px] text-white/80 font-medium leading-tight">
        Dibagikan via<br/>Radio MASS FM
      </span>
    </div>
  );
}
