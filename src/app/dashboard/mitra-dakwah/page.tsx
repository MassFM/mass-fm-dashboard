'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Ad } from '@/types/database';
import {
  Plus, Trash2, ToggleLeft, ToggleRight, Edit,
  Megaphone, Star, Upload, ImageIcon, X,
  BarChart3, FileText, Search, Filter,
} from 'lucide-react';
import Link from 'next/link';

// ─── CONSTANTS ───

const PACKAGE_TYPES = [
  { value: 'banner', label: 'Banner', desc: 'Tampil di katalog iklan' },
  { value: 'interstitial', label: 'Interstitial', desc: 'Popup saat buka/tutup/transisi' },
  { value: 'home_slider', label: 'Home Slider', desc: 'Tampil di slider utama halaman depan' },
  { value: 'featured', label: 'Featured', desc: 'Highlight di carousel + katalog' },
  { value: 'premium', label: 'Premium', desc: 'Featured + Home Slider + Interstitial + Prioritas' },
];

const PLACEMENTS = [
  { value: 'catalog', label: 'Katalog' },
  { value: 'home_slider', label: 'Home Slider' },
  { value: 'interstitial_open', label: 'Interstitial - Buka App' },
  { value: 'interstitial_close', label: 'Interstitial - Tutup App' },
  { value: 'interstitial_transition', label: 'Interstitial - Transisi' },
];

const ACTION_TYPES = [
  { value: 'webview', label: 'WebView In-App' },
  { value: 'url', label: 'Buka Browser' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'screen', label: 'Halaman App' },
];

const CATEGORIES = [
  'umum', 'makanan', 'fashion', 'jasa', 'properti',
  'kesehatan', 'pendidikan', 'teknologi', 'otomotif', 'lainnya',
];

type FormState = {
  client_name: string;
  client_phone: string;
  client_email: string;
  package_type: 'banner' | 'interstitial' | 'home_slider' | 'featured' | 'premium';
  title: string;
  description: string;
  image_url: string;
  landing_url: string;
  action_type: 'webview' | 'url' | 'whatsapp' | 'screen';
  category: string;
  placement: 'catalog' | 'home_slider' | 'interstitial_open' | 'interstitial_close' | 'interstitial_transition';
  start_date: string;
  expiry_date: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  priority: number;
  show_duration_seconds: number;
  max_impressions_per_day: number;
};

const today = new Date().toISOString().split('T')[0];
const defaultExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

const emptyForm: FormState = {
  client_name: '',
  client_phone: '',
  client_email: '',
  package_type: 'banner',
  title: '',
  description: '',
  image_url: '',
  landing_url: '',
  action_type: 'webview',
  category: 'umum',
  placement: 'catalog',
  start_date: today,
  expiry_date: defaultExpiry,
  is_active: true,
  is_featured: false,
  sort_order: 0,
  priority: 0,
  show_duration_seconds: 5,
  max_impressions_per_day: 0,
};

export default function MitraDakwahPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPackage, setFilterPackage] = useState('all');
  const [uploading, setUploading] = useState(false);

  // ─── FETCH ADS ───
  const fetchAds = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ads')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!error && data) setAds(data as Ad[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAds(); }, [fetchAds]);

  // ─── IMAGE UPLOAD ───
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const ext = file.name.split('.').pop();
    const fileName = `ads/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      alert('Gagal upload gambar: ' + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('media').getPublicUrl(fileName);
    if (urlData?.publicUrl) {
      setForm(prev => ({ ...prev, image_url: urlData.publicUrl }));
    }
    setUploading(false);
  };

  // ─── SAVE ───
  const handleSave = async () => {
    if (!form.title.trim() || !form.image_url.trim()) {
      alert('Judul dan gambar wajib diisi');
      return;
    }

    setSaving(true);

    const payload = {
      client_name: form.client_name,
      client_phone: form.client_phone,
      client_email: form.client_email,
      package_type: form.package_type,
      title: form.title,
      description: form.description,
      image_url: form.image_url,
      landing_url: form.landing_url,
      action_type: form.action_type,
      category: form.category,
      placement: form.placement,
      start_date: form.start_date,
      expiry_date: form.expiry_date,
      is_active: form.is_active,
      is_featured: form.is_featured,
      sort_order: form.sort_order,
      priority: form.priority,
      show_duration_seconds: form.show_duration_seconds,
      max_impressions_per_day: form.max_impressions_per_day,
    };

    if (editingId) {
      await supabase.from('ads').update(payload).eq('id', editingId);
    } else {
      await supabase.from('ads').insert(payload);
    }

    setSaving(false);
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    fetchAds();
  };

  // ─── TOGGLE ACTIVE ───
  const toggleActive = async (ad: Ad) => {
    await supabase.from('ads').update({ is_active: !ad.is_active }).eq('id', ad.id);
    fetchAds();
  };

  // ─── TOGGLE FEATURED ───
  const toggleFeatured = async (ad: Ad) => {
    await supabase.from('ads').update({ is_featured: !ad.is_featured }).eq('id', ad.id);
    fetchAds();
  };

  // ─── DELETE ───
  const handleDelete = async (id: string) => {
    if (!confirm('Hapus iklan ini? Data analytics juga akan terhapus.')) return;
    await supabase.from('ads').delete().eq('id', id);
    fetchAds();
  };

  // ─── EDIT ───
  const handleEdit = (ad: Ad) => {
    setEditingId(ad.id ?? null);
    setForm({
      client_name: ad.client_name,
      client_phone: ad.client_phone,
      client_email: ad.client_email,
      package_type: ad.package_type,
      title: ad.title,
      description: ad.description,
      image_url: ad.image_url,
      landing_url: ad.landing_url,
      action_type: ad.action_type,
      category: ad.category,
      placement: ad.placement,
      start_date: ad.start_date,
      expiry_date: ad.expiry_date,
      is_active: ad.is_active,
      is_featured: ad.is_featured,
      sort_order: ad.sort_order,
      priority: ad.priority,
      show_duration_seconds: ad.show_duration_seconds,
      max_impressions_per_day: ad.max_impressions_per_day,
    });
    setShowForm(true);
  };

  // ─── FILTERED ADS ───
  const filteredAds = ads.filter(ad => {
    const matchSearch = ad.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ad.client_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchPackage = filterPackage === 'all' || ad.package_type === filterPackage;
    return matchSearch && matchPackage;
  });

  // ─── STATS ───
  const totalActive = ads.filter(a => a.is_active).length;
  const totalFeatured = ads.filter(a => a.is_featured).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Megaphone size={28} className="text-primary" />
            Mitra Dakwah
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Kelola iklan & mitra Radio Mass FM
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/mitra-dakwah/analytics"
            className="px-4 py-2.5 rounded-xl text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition flex items-center gap-2"
          >
            <BarChart3 size={16} /> Analytics
          </Link>
          <Link
            href="/dashboard/mitra-dakwah/regulations"
            className="px-4 py-2.5 rounded-xl text-sm font-medium bg-amber-50 text-amber-600 hover:bg-amber-100 transition flex items-center gap-2"
          >
            <FileText size={16} /> Regulasi & Harga
          </Link>
          <button
            onClick={() => { setEditingId(null); setForm(emptyForm); setShowForm(true); }}
            className="px-4 py-2.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary/90 transition flex items-center gap-2"
          >
            <Plus size={16} /> Tambah Iklan
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <p className="text-2xl font-bold text-slate-800">{ads.length}</p>
          <p className="text-xs text-slate-400">Total Iklan</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <p className="text-2xl font-bold text-green-600">{totalActive}</p>
          <p className="text-xs text-slate-400">Aktif</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <p className="text-2xl font-bold text-amber-600">{totalFeatured}</p>
          <p className="text-xs text-slate-400">Featured</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari iklan..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={filterPackage}
            onChange={e => setFilterPackage(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary/20 appearance-none bg-white"
          >
            <option value="all">Semua Paket</option>
            {PACKAGE_TYPES.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Ads Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Memuat...</div>
        ) : filteredAds.length === 0 ? (
          <div className="p-12 text-center">
            <Megaphone size={48} className="mx-auto text-slate-200 mb-3" />
            <p className="text-slate-400">Belum ada iklan</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Iklan</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Klien</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Paket</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Placement</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Periode</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Status</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredAds.map(ad => {
                const isExpired = new Date(ad.expiry_date) < new Date();
                return (
                  <tr key={ad.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {ad.image_url ? (
                          <img src={ad.image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                            <ImageIcon size={18} className="text-slate-300" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-slate-700 text-sm">{ad.title || 'Tanpa judul'}</p>
                          <p className="text-xs text-slate-400">{ad.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">{ad.client_name || '-'}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        ad.package_type === 'premium' ? 'bg-amber-100 text-amber-700' :
                        ad.package_type === 'featured' ? 'bg-purple-100 text-purple-700' :
                        ad.package_type === 'interstitial' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {PACKAGE_TYPES.find(p => p.value === ad.package_type)?.label ?? ad.package_type}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">
                      {PLACEMENTS.find(p => p.value === ad.placement)?.label ?? ad.placement}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">
                      <span className={isExpired ? 'text-red-500' : ''}>
                        {ad.start_date} — {ad.expiry_date}
                        {isExpired && ' (expired)'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleActive(ad)} title={ad.is_active ? 'Nonaktifkan' : 'Aktifkan'}>
                          {ad.is_active
                            ? <ToggleRight size={22} className="text-green-500" />
                            : <ToggleLeft size={22} className="text-slate-300" />
                          }
                        </button>
                        <button onClick={() => toggleFeatured(ad)} title={ad.is_featured ? 'Unfeature' : 'Feature'}>
                          <Star size={16} className={ad.is_featured ? 'text-amber-500 fill-amber-500' : 'text-slate-300'} />
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(ad)}
                          className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary transition"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(ad.id!)}
                          className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-start justify-center pt-8 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 mb-8">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">
                {editingId ? 'Edit Iklan' : 'Tambah Iklan Baru'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Klien Info */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase">Info Klien</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Nama Klien</label>
                    <input
                      type="text"
                      value={form.client_name}
                      onChange={e => setForm(prev => ({ ...prev, client_name: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      placeholder="PT. Contoh"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Telepon</label>
                    <input
                      type="text"
                      value={form.client_phone}
                      onChange={e => setForm(prev => ({ ...prev, client_phone: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      placeholder="08xxx"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Email</label>
                    <input
                      type="email"
                      value={form.client_email}
                      onChange={e => setForm(prev => ({ ...prev, client_email: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      placeholder="email@contoh.com"
                    />
                  </div>
                </div>
              </div>

              {/* Konten Iklan */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase">Konten Iklan</p>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Judul *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                    placeholder="Nama produk / jasa..."
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Deskripsi</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none"
                    placeholder="Keterangan iklan..."
                  />
                </div>

                {/* Upload Gambar */}
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Gambar Iklan *</label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1">
                      <div className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition ${
                        uploading ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-primary'
                      }`}>
                        {uploading ? (
                          <p className="text-sm text-primary">Mengupload...</p>
                        ) : (
                          <div className="flex items-center justify-center gap-2 text-slate-400">
                            <Upload size={16} />
                            <span className="text-sm">Upload gambar</span>
                          </div>
                        )}
                      </div>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                    {form.image_url && (
                      <img src={form.image_url} alt="preview" className="w-20 h-20 rounded-xl object-cover" />
                    )}
                  </div>
                  {form.image_url && (
                    <input
                      type="text"
                      value={form.image_url}
                      onChange={e => setForm(prev => ({ ...prev, image_url: e.target.value }))}
                      className="w-full mt-2 px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-400"
                      placeholder="atau paste URL gambar"
                    />
                  )}
                  {!form.image_url && (
                    <input
                      type="text"
                      value={form.image_url}
                      onChange={e => setForm(prev => ({ ...prev, image_url: e.target.value }))}
                      className="w-full mt-2 px-3 py-2 rounded-lg border border-slate-200 text-xs"
                      placeholder="atau paste URL gambar"
                    />
                  )}
                </div>
              </div>

              {/* Paket & Placement */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Paket Iklan</label>
                  <select
                    value={form.package_type}
                    onChange={e => setForm(prev => ({ ...prev, package_type: e.target.value as FormState['package_type'] }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm appearance-none bg-white"
                  >
                    {PACKAGE_TYPES.map(p => (
                      <option key={p.value} value={p.value}>{p.label} — {p.desc}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Placement</label>
                  <select
                    value={form.placement}
                    onChange={e => setForm(prev => ({ ...prev, placement: e.target.value as FormState['placement'] }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm appearance-none bg-white"
                  >
                    {PLACEMENTS.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action & Landing */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Tipe Aksi</label>
                  <select
                    value={form.action_type}
                    onChange={e => setForm(prev => ({ ...prev, action_type: e.target.value as FormState['action_type'] }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm appearance-none bg-white"
                  >
                    {ACTION_TYPES.map(a => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">
                    {form.action_type === 'whatsapp' ? 'Nomor WhatsApp' : 'URL Landing Page'}
                  </label>
                  <input
                    type="text"
                    value={form.landing_url}
                    onChange={e => setForm(prev => ({ ...prev, landing_url: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                    placeholder={form.action_type === 'whatsapp' ? '6281xxx' : 'https://...'}
                  />
                </div>
              </div>

              {/* Kategori & Jadwal */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Kategori</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm appearance-none bg-white"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={e => setForm(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Tanggal Berakhir</label>
                  <input
                    type="date"
                    value={form.expiry_date}
                    onChange={e => setForm(prev => ({ ...prev, expiry_date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                </div>
              </div>

              {/* Interstitial Settings */}
              {(form.placement.startsWith('interstitial') || form.package_type === 'interstitial' || form.package_type === 'premium') && (
                <div className="bg-blue-50 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-blue-400 uppercase">Pengaturan Interstitial</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-blue-500 mb-1 block">Durasi Tampil (detik)</label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={form.show_duration_seconds}
                        onChange={e => setForm(prev => ({ ...prev, show_duration_seconds: parseInt(e.target.value) || 5 }))}
                        className="w-full px-3 py-2 rounded-lg border border-blue-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-blue-500 mb-1 block">Max Impressions/Hari (0=unlimited)</label>
                      <input
                        type="number"
                        min={0}
                        value={form.max_impressions_per_day}
                        onChange={e => setForm(prev => ({ ...prev, max_impressions_per_day: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 rounded-lg border border-blue-200 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Priority & Sort */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Urutan (sort_order)</label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={e => setForm(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Prioritas (semakin tinggi = lebih utama)</label>
                  <input
                    type="number"
                    value={form.priority}
                    onChange={e => setForm(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={e => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-slate-600">Aktif</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={e => setForm(prev => ({ ...prev, is_featured: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-slate-600">Featured (Unggulan)</span>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 rounded-xl text-sm text-slate-500 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition"
              >
                {saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Iklan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
