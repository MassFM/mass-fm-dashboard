'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { PopupItem, ClickArea } from '@/types/database';
import {
  Plus, Trash2, ToggleLeft, ToggleRight, Edit,
  MessageSquareDashed, Smartphone, LogOut as LogOutIcon,
  Globe, MessageCircle, Layout, MousePointer2, X, RotateCcw,
  Upload, ImageIcon, Link2, Send, Zap,
} from 'lucide-react';

// ─── Daftar halaman aplikasi yang bisa dijadikan target navigasi ───
const APP_SCREENS: { value: string; label: string; group: string }[] = [
  // Interaksi
  { value: 'live_chat', label: 'Live Chat', group: 'Interaksi' },
  { value: 'tanya_ustadz', label: 'Tanya Ustadz', group: 'Interaksi' },
  { value: 'trouble_report', label: 'Lapor Gangguan', group: 'Interaksi' },
  { value: 'feedback', label: 'Kritik & Saran', group: 'Interaksi' },
  // Ibadah
  { value: 'dzikir', label: 'Dzikir', group: 'Ibadah' },
  { value: 'doa_harian', label: 'Doa Harian', group: 'Ibadah' },
  { value: 'prayer_times', label: 'Waktu Shalat', group: 'Ibadah' },
  { value: 'qibla', label: 'Arah Kiblat', group: 'Ibadah' },
  { value: 'kalender', label: 'Kalender Hijriah', group: 'Ibadah' },
  // Kajian & Konten
  { value: 'podcast', label: 'Podcast', group: 'Kajian & Konten' },
  { value: 'ebook', label: 'Ebook Islami', group: 'Kajian & Konten' },
  { value: 'kajian_offline', label: 'Kajian Rutin', group: 'Kajian & Konten' },
  { value: 'school_info', label: 'Info Sekolah', group: 'Kajian & Konten' },
  { value: 'mimbar', label: 'Mimbar', group: 'Kajian & Konten' },
  { value: 'greeting_card', label: 'Kartu Ucapan', group: 'Kajian & Konten' },
  { value: 'event', label: 'Event & Acara', group: 'Kajian & Konten' },
  // Lainnya
  { value: 'donasi', label: 'Donasi', group: 'Lainnya' },
  { value: 'mitra_dakwah', label: 'Mitra Dakwah', group: 'Lainnya' },
  { value: 'statistik', label: 'Statistik', group: 'Lainnya' },
  { value: 'weather', label: 'Prakiraan Cuaca', group: 'Lainnya' },
  { value: 'widget_settings', label: 'Pengaturan Widget', group: 'Lainnya' },
  { value: 'onboarding', label: 'Tutorial', group: 'Lainnya' },
  { value: 'about_app', label: 'Tentang Aplikasi', group: 'Lainnya' },
];

type FormState = {
  type: 'open' | 'close' | 'instant';
  title: string;
  body: string;
  image_url: string;
  image_urls: string[];  // Multiple images for carousel
  action_type: 'url' | 'whatsapp' | 'screen';
  action_url: string;
  action_label: string;
  click_area: ClickArea | null;
  is_active: boolean;
  show_once: boolean;
};

const emptyForm: FormState = {
  type: 'open',
  title: '',
  body: '',
  image_url: '',
  image_urls: [],
  action_type: 'url',
  action_url: '',
  action_label: 'Selengkapnya',
  click_area: null,
  is_active: true,
  show_once: false,
};

// ═══════════════════════════════════════════════════════════════
//  VISUAL AREA PICKER COMPONENT
// ═══════════════════════════════════════════════════════════════

function ClickAreaPicker({
  imageUrl,
  clickArea,
  onChange,
}: {
  imageUrl: string;
  clickArea: ClickArea | null;
  onChange: (area: ClickArea | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [tempArea, setTempArea] = useState<ClickArea | null>(null);

  const getRelativePos = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)),
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const pos = getRelativePos(e);
    setDragStart(pos);
    setIsDragging(true);
    setTempArea(null);
  }, [getRelativePos]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragStart) return;
    const pos = getRelativePos(e);
    const x = Math.min(dragStart.x, pos.x);
    const y = Math.min(dragStart.y, pos.y);
    const w = Math.abs(pos.x - dragStart.x);
    const h = Math.abs(pos.y - dragStart.y);
    setTempArea({ x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) });
  }, [isDragging, dragStart, getRelativePos]);

  const handleMouseUp = useCallback(() => {
    if (tempArea && tempArea.w >= 3 && tempArea.h >= 3) {
      onChange(tempArea);
    }
    setIsDragging(false);
    setDragStart(null);
    setTempArea(null);
  }, [tempArea, onChange]);

  const area = tempArea || clickArea;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
          <MousePointer2 size={14} />
          Area Klik pada Gambar
        </label>
        {clickArea && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors"
          >
            <RotateCcw size={12} /> Reset Area
          </button>
        )}
      </div>
      <p className="text-xs text-slate-400">
        Klik &amp; drag pada gambar untuk menandai area yang bisa diklik pengguna.
        {!clickArea && ' Jika tidak diset, tombol aksi biasa akan ditampilkan.'}
      </p>

      <div
        ref={containerRef}
        className="relative select-none cursor-crosshair border-2 border-dashed border-slate-200 rounded-xl overflow-hidden bg-slate-50"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          if (isDragging) handleMouseUp();
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Preview popup"
          className="w-full h-auto block pointer-events-none"
          draggable={false}
        />

        {/* Area overlay */}
        {area && (
          <div
            className="absolute border-2 border-blue-500 bg-blue-400/20 rounded-sm transition-all"
            style={{
              left: `${area.x}%`,
              top: `${area.y}%`,
              width: `${area.w}%`,
              height: `${area.h}%`,
            }}
          >
            {/* Corner indicators */}
            <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-blue-500 rounded-full" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full" />
            <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-blue-500 rounded-full" />
            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full" />
            {/* Label */}
            <div className="absolute top-1 left-1 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
              KLIK
            </div>
          </div>
        )}

        {/* Guide overlay when no area set */}
        {!area && !isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/5">
            <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm text-xs text-slate-500 font-medium">
              Drag untuk menandai area klik
            </div>
          </div>
        )}
      </div>

      {/* Coordinate display */}
      {clickArea && (
        <div className="flex gap-3 text-[10px] font-mono text-slate-400">
          <span>X: {clickArea.x}%</span>
          <span>Y: {clickArea.y}%</span>
          <span>W: {clickArea.w}%</span>
          <span>H: {clickArea.h}%</span>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  ACTION TYPE BADGE
// ═══════════════════════════════════════════════════════════════

function ActionTypeBadge({ type }: { type: string }) {
  const config: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    url: { color: 'bg-blue-50 text-blue-500', icon: <Globe size={10} />, label: 'URL' },
    whatsapp: { color: 'bg-green-50 text-green-500', icon: <MessageCircle size={10} />, label: 'WhatsApp' },
    screen: { color: 'bg-purple-50 text-purple-500', icon: <Layout size={10} />, label: 'In-App' },
  };
  const c = config[type] || config.url;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${c.color}`}>
      {c.icon} {c.label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════════

export default function PopupsPage() {
  const [popups, setPopups] = useState<PopupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [pushing, setPushing] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageMode, setImageMode] = useState<'url' | 'upload'>('url');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPopups = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('app_popups')
      .select('*')
      .order('created_at', { ascending: false });
    setPopups((data as PopupItem[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchPopups(); }, []);

  // ── Upload gambar ke Supabase Storage ──
  const handleImageUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    // Validasi tipe file
    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar (JPG, PNG, WebP, dll)');
      return;
    }
    // Maks 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran gambar maksimal 5 MB');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const fileName = `popups/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error } = await supabase.storage
        .from('popup-images')
        .upload(fileName, file, { upsert: true });

      if (error) {
        alert('Gagal upload: ' + error.message);
      } else {
        const { data: urlData } = supabase.storage
          .from('popup-images')
          .getPublicUrl(fileName);
        const newUrl = urlData.publicUrl;
        // Set as main image_url if none, and always add to image_urls array
        setForm((prev) => ({
          ...prev,
          image_url: prev.image_url || newUrl,
          image_urls: [...prev.image_urls, newUrl],
          click_area: null,
        }));
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown';
      alert('Error upload: ' + message);
    }
    setUploading(false);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    setSaving(true);
    const { image_urls, ...rest } = form;
    const payload = {
      ...rest,
      // Bersihkan action_url sesuai tipe
      action_url: form.action_type === 'whatsapp'
        ? form.action_url.replace(/\D/g, '') // Hanya angka untuk WA
        : form.action_url,
      // Simpan image_urls jika ada lebih dari 1 gambar
      image_urls: image_urls.length > 0 ? image_urls : null,
      updated_at: new Date().toISOString(),
    };
    if (editId) {
      await supabase.from('app_popups').update(payload).eq('id', editId);
    } else {
      await supabase.from('app_popups').insert(payload);
    }
    setSaving(false);
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm);
    fetchPopups();
  };

  const handleEdit = (item: PopupItem) => {
    setEditId(item.id!);
    setForm({
      type: item.type,
      title: item.title,
      body: item.body,
      image_url: item.image_url,
      image_urls: item.image_urls || (item.image_url ? [item.image_url] : []),
      action_type: item.action_type || 'url',
      action_url: item.action_url,
      action_label: item.action_label,
      click_area: item.click_area,
      is_active: item.is_active,
      show_once: item.show_once,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus popup ini?')) return;
    await supabase.from('app_popups').delete().eq('id', id);
    fetchPopups();
  };

  const toggleActive = async (id: number, current: boolean) => {
    await supabase.from('app_popups').update({ is_active: !current }).eq('id', id);
    fetchPopups();
  };

  // ── Kirim Sekarang: push popup ke semua user via Realtime ──
  const handlePushNow = async (item: PopupItem) => {
    if (!item.id) return;
    if (!confirm(
      `Popup "${item.title}" akan langsung ditampilkan ke SEMUA pengguna yang sedang membuka aplikasi.\n\nLanjutkan?`
    )) return;

    setPushing(item.id);
    try {
      // Update pushed_at + pastikan is_active = true
      // Ini akan mentrigger Supabase Realtime di semua app
      await supabase
        .from('app_popups')
        .update({
          pushed_at: new Date().toISOString(),
          is_active: true,
        })
        .eq('id', item.id);

      // Kirim FCM sebagai fallback (untuk app yang di background)
      try {
        await supabase.functions.invoke('send-notification', {
          body: {
            topic: 'all_users',
            title: item.title || 'Info dari Radio Mass FM',
            body: item.body || '',
            data: {
              type: 'popup',
              popup_id: item.id.toString(),
            },
          },
        });
      } catch (fcmErr) {
        console.warn('FCM fallback gagal (popup tetap dikirim via Realtime):', fcmErr);
      }

      fetchPopups();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert('Gagal mengirim popup: ' + message);
    }
    setPushing(null);
  };

  // Helper: label aksi tujuan untuk list item
  const getActionTarget = (item: PopupItem) => {
    if (!item.action_url) return null;
    switch (item.action_type) {
      case 'whatsapp':
        return `WA: ${item.action_url}`;
      case 'screen': {
        const screen = APP_SCREENS.find(s => s.value === item.action_url);
        return screen ? `→ ${screen.label}` : `→ ${item.action_url}`;
      }
      default:
        return item.action_url.length > 35
          ? item.action_url.slice(0, 35) + '…'
          : item.action_url;
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
            <MessageSquareDashed size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Popup Info</h1>
            <p className="text-sm text-slate-400">Kelola popup saat buka, tutup, atau kirim langsung ke pengguna</p>
          </div>
        </div>
        <button
          onClick={() => { setEditId(null); setForm(emptyForm); setShowForm(true); }}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          <Plus size={16} /> Tambah Popup
        </button>
      </div>

      {/* ─── Form ─── */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-700">{editId ? 'Edit Popup' : 'Buat Popup Baru'}</h2>
            <button onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }} className="text-slate-300 hover:text-slate-500">
              <X size={18} />
            </button>
          </div>

          {/* Row 1: Tipe + Action Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-600 block mb-1">Tipe Popup</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as 'open' | 'close' | 'instant' })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none"
              >
                <option value="open">🟢 Buka Aplikasi</option>
                <option value="close">🔴 Tutup Aplikasi</option>
                <option value="instant">⚡ Instant (Kirim Kapan Saja)</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 block mb-1">Tipe Aksi</label>
              <select
                value={form.action_type}
                onChange={(e) => setForm({ ...form, action_type: e.target.value as 'url' | 'whatsapp' | 'screen', action_url: '' })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none"
              >
                <option value="url">🌐 Buka URL / Website</option>
                <option value="whatsapp">💬 Buka WhatsApp</option>
                <option value="screen">📱 Buka Halaman Aplikasi</option>
              </select>
            </div>
          </div>

          {/* Row 2: Judul */}
          <div>
            <label className="text-sm font-medium text-slate-600 block mb-1">Judul</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none"
              placeholder="Judul popup"
            />
          </div>

          {/* Row 3: Body */}
          <div>
            <label className="text-sm font-medium text-slate-600 block mb-1">Isi Pesan</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none resize-none"
              placeholder="Isi pesan popup..."
            />
          </div>

          {/* Row 4: Action URL / WhatsApp / Screen picker */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-600 block mb-1">
                {form.action_type === 'url' && 'URL Tujuan'}
                {form.action_type === 'whatsapp' && 'Nomor WhatsApp'}
                {form.action_type === 'screen' && 'Halaman Aplikasi'}
              </label>
              {form.action_type === 'screen' ? (
                <select
                  value={form.action_url}
                  onChange={(e) => setForm({ ...form, action_url: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none"
                >
                  <option value="">— Pilih Halaman —</option>
                  {Object.entries(
                    APP_SCREENS.reduce<Record<string, typeof APP_SCREENS>>((acc, s) => {
                      (acc[s.group] ??= []).push(s);
                      return acc;
                    }, {})
                  ).map(([group, screens]) => (
                    <optgroup key={group} label={group}>
                      {screens.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              ) : (
                <input
                  type={form.action_type === 'url' ? 'url' : 'tel'}
                  value={form.action_url}
                  onChange={(e) => setForm({ ...form, action_url: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none"
                  placeholder={
                    form.action_type === 'url'
                      ? 'https://link-tujuan.com'
                      : '6281234567890 (awali dengan 62)'
                  }
                />
              )}
              {form.action_type === 'whatsapp' && (
                <p className="text-[10px] text-slate-400 mt-1">Format: 628xxxx (tanpa + atau 0 di awal)</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 block mb-1">Label Tombol Aksi</label>
              <input
                type="text"
                value={form.action_label}
                onChange={(e) => setForm({ ...form, action_label: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none"
                placeholder={
                  form.action_type === 'whatsapp'
                    ? 'Chat via WhatsApp'
                    : form.action_type === 'screen'
                    ? 'Buka Halaman'
                    : 'Selengkapnya'
                }
              />
            </div>
          </div>

          {/* Row 5: Image — URL atau Upload (Multi-Image Carousel Support) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-600">
                Gambar Poster (opsional)
                {form.image_urls.length > 1 && (
                  <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-500">
                    {form.image_urls.length} gambar — Carousel
                  </span>
                )}
              </label>
              <div className="flex bg-slate-100 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setImageMode('url')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    imageMode === 'url' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Link2 size={12} /> URL
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode('upload')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    imageMode === 'upload' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Upload size={12} /> Upload
                </button>
              </div>
            </div>

            {imageMode === 'url' ? (
              <div className="flex gap-2">
                <input
                  type="url"
                  id="popup-image-url-input"
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none"
                  placeholder="https://link-gambar.com/poster.jpg"
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('popup-image-url-input') as HTMLInputElement;
                    const url = input?.value?.trim();
                    if (!url) return;
                    setForm((prev) => ({
                      ...prev,
                      image_url: prev.image_url || url,
                      image_urls: [...prev.image_urls, url],
                      click_area: null,
                    }));
                    input.value = '';
                  }}
                  className="px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors whitespace-nowrap"
                >
                  <Plus size={14} className="inline mr-1" /> Tambah
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <label className="flex-1 relative cursor-pointer">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="sr-only"
                  />
                  <div className="w-full px-4 py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:border-purple-300 hover:text-purple-500 transition-colors flex items-center justify-center gap-2">
                    {uploading ? (
                      <><span className="animate-spin">⏳</span> Mengupload...</>
                    ) : (
                      <><ImageIcon size={16} /> Klik untuk pilih gambar (maks 5MB)</>
                    )}
                  </div>
                </label>
              </div>
            )}
            <p className="text-[10px] text-slate-400">
              Tambahkan beberapa gambar untuk menampilkan carousel di aplikasi. Gambar pertama juga digunakan sebagai gambar utama.
            </p>

            {/* Preview semua gambar (carousel list) */}
            {form.image_urls.length > 0 && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-3">
                  {form.image_urls.map((url, idx) => (
                    <div key={idx} className="relative group w-32 h-24 rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Gambar ${idx + 1}`} className="w-full h-full object-cover" />
                      {idx === 0 && (
                        <span className="absolute top-1 left-1 bg-purple-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                          UTAMA
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const newUrls = form.image_urls.filter((_, i) => i !== idx);
                          setForm({
                            ...form,
                            image_urls: newUrls,
                            image_url: newUrls[0] || '',
                            click_area: null,
                          });
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white p-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Hapus gambar"
                      >
                        <X size={10} />
                      </button>
                      <span className="absolute bottom-1 right-1 bg-black/50 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                        {idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Row 6: Visual Area Picker (only if single image — carousel disables area picking) */}
          {form.image_url && form.image_urls.length <= 1 && (
            <ClickAreaPicker
              imageUrl={form.image_url}
              clickArea={form.click_area}
              onChange={(area) => setForm({ ...form, click_area: area })}
            />
          )}
          {form.image_urls.length > 1 && (
            <p className="text-xs text-amber-500 flex items-center gap-1.5">
              <MousePointer2 size={12} /> Area klik tidak tersedia untuk mode carousel (multi-gambar).
            </p>
          )}

          {/* Row 7: Checkboxes */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="rounded accent-purple-600"
              />
              Aktif
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={form.show_once}
                onChange={(e) => setForm({ ...form, show_once: e.target.checked })}
                className="rounded accent-purple-600"
              />
              Tampilkan hanya sekali per user
            </label>
          </div>

          {/* Row 8: Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving || !form.title.trim()}
              className="bg-purple-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Menyimpan...' : editId ? 'Simpan Perubahan' : 'Simpan'}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }}
              className="bg-slate-100 text-slate-500 px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* ─── List ─── */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">Memuat data...</div>
      ) : popups.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-100">
          <MessageSquareDashed size={40} className="mx-auto text-slate-200 mb-3" />
          <p className="text-slate-400 text-sm">Belum ada popup info</p>
        </div>
      ) : (
        <div className="space-y-3">
          {popups.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-slate-100 px-6 py-4 flex items-center gap-4">
              {/* Type badge */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                item.type === 'open' ? 'bg-green-50 text-green-500' : item.type === 'instant' ? 'bg-amber-50 text-amber-500' : 'bg-red-50 text-red-400'
              }`}>
                {item.type === 'open' ? <Smartphone size={18} /> : item.type === 'instant' ? <Zap size={18} /> : <LogOutIcon size={18} />}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-700 text-sm truncate">{item.title}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.type === 'open'
                      ? 'bg-green-50 text-green-500'
                      : item.type === 'instant'
                      ? 'bg-amber-50 text-amber-500'
                      : 'bg-red-50 text-red-400'
                  }`}>
                    {item.type === 'open' ? 'BUKA APP' : item.type === 'instant' ? 'INSTANT' : 'TUTUP APP'}
                  </span>
                  {item.action_url && <ActionTypeBadge type={item.action_type || 'url'} />}
                  {item.show_once && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-400">1x</span>
                  )}
                  {item.click_area && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-500 flex items-center gap-0.5">
                      <MousePointer2 size={8} /> AREA
                    </span>
                  )}
                  {item.image_urls && item.image_urls.length > 1 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-500 flex items-center gap-0.5">
                      <ImageIcon size={8} /> {item.image_urls.length} GAMBAR
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {item.body || '-'}
                  {getActionTarget(item) && (
                    <span className="ml-2 text-slate-300">• {getActionTarget(item)}</span>
                  )}
                </p>
              </div>
              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Kirim Sekarang button — available for all types */}
                <button
                  onClick={() => handlePushNow(item)}
                  disabled={pushing === item.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors text-xs font-bold disabled:opacity-50"
                  title="Kirim popup ke semua pengguna sekarang"
                >
                  {pushing === item.id ? (
                    <><span className="animate-spin">⏳</span> Mengirim...</>
                  ) : (
                    <><Send size={12} /> Kirim Sekarang</>
                  )}
                </button>
                <button
                  onClick={() => toggleActive(item.id!, item.is_active)}
                  className="p-2 rounded-lg hover:bg-slate-50 transition-colors"
                  title={item.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                >
                  {item.is_active
                    ? <ToggleRight size={20} className="text-green-500" />
                    : <ToggleLeft size={20} className="text-slate-300" />}
                </button>
                <button
                  onClick={() => handleEdit(item)}
                  className="p-2 rounded-lg hover:bg-slate-50 transition-colors text-slate-400"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(item.id!)}
                  className="p-2 rounded-lg hover:bg-red-50 transition-colors text-red-400"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
