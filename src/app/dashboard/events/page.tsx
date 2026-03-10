'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Pencil, Trash2, Save, X, Search, Star, MapPin, Calendar, Clock, Users, Loader2, ExternalLink, Image as ImageIcon, Tag } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = (supabase as any);

interface EventItem {
  id?: number;
  created_at?: string;
  updated_at?: string;
  title: string;
  description: string;
  kategori: string;
  poster_url: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  jam_mulai: string;
  jam_selesai: string;
  tempat: string;
  alamat: string;
  provinsi: string;
  kota: string;
  latitude: number | null;
  longitude: number | null;
  pemateri: string;
  contact_person: string;
  contact_phone: string;
  registration_url: string;
  is_featured: boolean;
  is_free: boolean;
  is_active: boolean;
  sort_order: number;
}

const emptyForm: EventItem = {
  title: '', description: '', kategori: '', poster_url: '',
  tanggal_mulai: '', tanggal_selesai: '', jam_mulai: '08:00', jam_selesai: '12:00',
  tempat: '', alamat: '', provinsi: '', kota: '',
  latitude: null, longitude: null,
  pemateri: '', contact_person: '', contact_phone: '', registration_url: '',
  is_featured: false, is_free: true, is_active: true, sort_order: 0,
};

const DEFAULT_KATEGORI = [
  'Kajian Akbar', 'Tabligh Akbar', 'Seminar', 'Workshop',
  'Daurah', 'Bakti Sosial', 'Santunan', 'Lomba',
];

type TabFilter = 'all' | 'upcoming' | 'ongoing' | 'past';

export default function EventsPage() {
  const [data, setData] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<EventItem>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [tabFilter, setTabFilter] = useState<TabFilter>('all');
  const [kategoriOptions, setKategoriOptions] = useState<string[]>(DEFAULT_KATEGORI);
  const [kategoriMode, setKategoriMode] = useState<'select'|'add'>('select');
  const [newKategori, setNewKategori] = useState('');

  // ── Fetch data ──

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: rows, error } = await db
      .from('events')
      .select('*')
      .order('tanggal_mulai', { ascending: false });
    if (!error && rows) {
      setData(rows);
      // Collect unique kategori from data
      const fromDb = new Set<string>(
        rows.map((r: EventItem) => r.kategori).filter(Boolean)
      );
      const merged = new Set([...DEFAULT_KATEGORI, ...fromDb]);
      setKategoriOptions([...merged].sort());
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Save ──

  const handleSave = async () => {
    if (!form.title.trim() || !form.tanggal_mulai) {
      alert('Judul dan Tanggal Mulai wajib diisi!');
      return;
    }
    setSaving(true);
    const payload = { ...form };
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;

    if (editingId) {
      await db.from('events').update(payload).eq('id', editingId);
    } else {
      await db.from('events').insert(payload);
    }
    setSaving(false);
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    fetchData();
  };

  // ── Delete ──

  const handleDelete = async (id: number) => {
    await db.from('events').delete().eq('id', id);
    setDeletingId(null);
    fetchData();
  };

  // ── Edit ──

  const startEdit = (item: EventItem) => {
    setForm({ ...item });
    setEditingId(item.id!);
    setShowForm(true);
  };

  // ── Filter logic ──

  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const filteredData = data.filter((item) => {
    // Tab filter
    if (tabFilter === 'upcoming' && item.tanggal_mulai <= today) return false;
    if (tabFilter === 'past') {
      const end = item.tanggal_selesai || item.tanggal_mulai;
      if (end >= today) return false;
    }
    if (tabFilter === 'ongoing') {
      const end = item.tanggal_selesai || item.tanggal_mulai;
      if (item.tanggal_mulai > today || end < today) return false;
    }
    // Search
    if (search) {
      const q = search.toLowerCase();
      return item.title.toLowerCase().includes(q)
        || item.pemateri.toLowerCase().includes(q)
        || item.tempat.toLowerCase().includes(q)
        || item.kategori.toLowerCase().includes(q);
    }
    return true;
  });

  // ── Tab counts ──

  const upcomingCount = data.filter(d => d.tanggal_mulai > today).length;
  const ongoingCount = data.filter(d => {
    const end = d.tanggal_selesai || d.tanggal_mulai;
    return d.tanggal_mulai <= today && end >= today;
  }).length;
  const pastCount = data.filter(d => {
    const end = d.tanggal_selesai || d.tanggal_mulai;
    return end < today;
  }).length;

  // ── Status badge helper ──

  const getStatus = (item: EventItem) => {
    const end = item.tanggal_selesai || item.tanggal_mulai;
    if (item.tanggal_mulai > today) return { label: 'Akan Datang', color: 'bg-blue-50 text-blue-700' };
    if (end < today) return { label: 'Selesai', color: 'bg-gray-100 text-gray-500' };
    return { label: 'Berlangsung', color: 'bg-green-50 text-green-700' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Event & Acara</h1>
          <p className="text-sm text-gray-400 mt-1">
            Kelola event kajian akbar, tabligh, seminar, dan acara lainnya
          </p>
        </div>
        <button
          onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
        >
          <Plus size={18} /> Tambah Event
        </button>
      </div>

      {/* Tab Filter + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-100">
          {([
            { key: 'all' as TabFilter, label: 'Semua', count: data.length },
            { key: 'upcoming' as TabFilter, label: 'Akan Datang', count: upcomingCount },
            { key: 'ongoing' as TabFilter, label: 'Berlangsung', count: ongoingCount },
            { key: 'past' as TabFilter, label: 'Selesai', count: pastCount },
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
            placeholder="Cari event..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : filteredData.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Calendar size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold">Belum ada event</p>
          <p className="text-sm">Klik &quot;Tambah Event&quot; untuk menambahkan</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredData.map(item => {
            const status = getStatus(item);
            return (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all">
                <div className="flex">
                  {/* Poster thumbnail */}
                  {item.poster_url && (
                    <div className="w-40 min-h-[120px] bg-gray-50 flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.poster_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Badges */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${status.color}`}>
                            {status.label}
                          </span>
                          {item.kategori && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700">
                              <Tag size={10} className="inline mr-1" />
                              {item.kategori}
                            </span>
                          )}
                          {item.is_featured && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700">
                              <Star size={10} className="inline mr-1" />Featured
                            </span>
                          )}
                          {item.is_free && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-green-50 text-green-700">
                              Gratis
                            </span>
                          )}
                          {!item.is_active && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-50 text-red-500">
                              Nonaktif
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-gray-800 text-sm">{item.title}</h3>

                        {/* Meta */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-400">
                          {item.pemateri && (
                            <span className="flex items-center gap-1">
                              <Users size={12} /> {item.pemateri}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {item.tanggal_mulai}
                            {item.tanggal_selesai && item.tanggal_selesai !== item.tanggal_mulai && ` — ${item.tanggal_selesai}`}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> {item.jam_mulai} - {item.jam_selesai}
                          </span>
                          {item.tempat && (
                            <span className="flex items-center gap-1">
                              <MapPin size={12} /> {item.tempat}{item.kota ? `, ${item.kota}` : ''}
                            </span>
                          )}
                          {item.registration_url && (
                            <a href={item.registration_url} target="_blank" rel="noreferrer"
                               className="flex items-center gap-1 text-primary hover:underline">
                              <ExternalLink size={12} /> Link Pendaftaran
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1 ml-3 flex-shrink-0">
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
            );
          })}
        </div>
      )}

      {/* ═══ FORM MODAL ═══ */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl my-8">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                {editingId ? 'Edit Event' : 'Tambah Event Baru'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Judul */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Judul Event *</label>
                <input type="text" value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Kajian Akbar Bersama Ust. ..." />
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

              {/* Pemateri */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Pemateri / Pembicara</label>
                <input type="text" value={form.pemateri}
                  onChange={e => setForm({ ...form, pemateri: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Ust. ..." />
              </div>

              {/* Tanggal & Waktu */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Tanggal Mulai *</label>
                  <input type="date" value={form.tanggal_mulai}
                    onChange={e => setForm({ ...form, tanggal_mulai: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Tanggal Selesai</label>
                  <input type="date" value={form.tanggal_selesai}
                    onChange={e => setForm({ ...form, tanggal_selesai: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Jam Mulai</label>
                  <input type="time" value={form.jam_mulai}
                    onChange={e => setForm({ ...form, jam_mulai: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Jam Selesai</label>
                  <input type="time" value={form.jam_selesai}
                    onChange={e => setForm({ ...form, jam_selesai: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
              </div>

              {/* Lokasi */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Nama Tempat</label>
                  <input type="text" value={form.tempat}
                    onChange={e => setForm({ ...form, tempat: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Masjid ..." />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Kota</label>
                  <input type="text" value={form.kota}
                    onChange={e => setForm({ ...form, kota: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Sragen" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Alamat Lengkap</label>
                <textarea rows={2} value={form.alamat}
                  onChange={e => setForm({ ...form, alamat: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Jl. ..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Provinsi</label>
                  <input type="text" value={form.provinsi}
                    onChange={e => setForm({ ...form, provinsi: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Jawa Tengah" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Latitude / Longitude</label>
                  <div className="flex gap-2">
                    <input type="number" step="any" value={form.latitude ?? ''}
                      onChange={e => setForm({ ...form, latitude: e.target.value ? parseFloat(e.target.value) : null })}
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                      placeholder="Lat" />
                    <input type="number" step="any" value={form.longitude ?? ''}
                      onChange={e => setForm({ ...form, longitude: e.target.value ? parseFloat(e.target.value) : null })}
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                      placeholder="Lng" />
                  </div>
                </div>
              </div>

              {/* Poster URL */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  <ImageIcon size={12} className="inline mr-1" /> URL Poster
                </label>
                <input type="url" value={form.poster_url}
                  onChange={e => setForm({ ...form, poster_url: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="https://..." />
                {form.poster_url && (
                  <div className="mt-2 rounded-xl overflow-hidden border border-gray-100 max-h-40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.poster_url} alt="preview" className="w-full h-40 object-cover" />
                  </div>
                )}
              </div>

              {/* Deskripsi */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Deskripsi</label>
                <textarea rows={4} value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Detail event..." />
              </div>

              {/* Contact */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Contact Person</label>
                  <input type="text" value={form.contact_person}
                    onChange={e => setForm({ ...form, contact_person: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">No. Telepon CP</label>
                  <input type="text" value={form.contact_phone}
                    onChange={e => setForm({ ...form, contact_phone: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
              </div>

              {/* Registration URL */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Link Pendaftaran</label>
                <input type="url" value={form.registration_url}
                  onChange={e => setForm({ ...form, registration_url: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="https://forms.google.com/..." />
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
                  <input type="checkbox" checked={form.is_free}
                    onChange={e => setForm({ ...form, is_free: e.target.checked })}
                    className="w-4 h-4 rounded text-primary focus:ring-primary" />
                  Gratis
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.is_active}
                    onChange={e => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4 rounded text-primary focus:ring-primary" />
                  Aktif
                </label>
              </div>

              {/* Sort Order */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Sort Order</label>
                <input type="number" value={form.sort_order}
                  onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                  className="w-24 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary" />
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
                {editingId ? 'Simpan Perubahan' : 'Tambah Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
