'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Pencil, Trash2, MapPin, Phone, BookOpen, Radio, X } from 'lucide-react';

interface KajianOffline {
  id?: number;
  title: string;
  pemateri: string;
  materi: string;
  description: string;
  tempat: string;
  alamat: string;
  latitude: number | null;
  longitude: number | null;
  contact_person: string;
  contact_phone: string;
  hari: string;
  jam: string;
  is_relay: boolean;
  kitab_name: string;
  file_url: string;
  image_url: string;
  is_active: boolean;
  created_at?: string;
}

const emptyForm: KajianOffline = {
  title: '', pemateri: '', materi: '', description: '', tempat: '', alamat: '',
  latitude: null, longitude: null, contact_person: '', contact_phone: '',
  hari: '', jam: '', is_relay: false, kitab_name: '', file_url: '', image_url: '', is_active: true,
};

const HARI_OPTIONS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];

export default function KajianOfflinePage() {
  const [data, setData] = useState<KajianOffline[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<KajianOffline>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: result } = await supabase
      .from('kajian_offline')
      .select('*')
      .order('hari', { ascending: true });
    setData(result || []);
    setLoading(false);
  };

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (item: KajianOffline) => {
    setForm({ ...item });
    setEditingId(item.id!);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const saveForm = async () => {
    if (!form.title.trim() || !form.tempat.trim()) {
      alert('Judul dan Tempat wajib diisi');
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      pemateri: form.pemateri.trim(),
      materi: form.materi.trim(),
      description: form.description.trim(),
      tempat: form.tempat.trim(),
      alamat: form.alamat.trim(),
      latitude: form.latitude,
      longitude: form.longitude,
      contact_person: form.contact_person.trim(),
      contact_phone: form.contact_phone.trim(),
      hari: form.hari,
      jam: form.jam.trim(),
      is_relay: form.is_relay,
      kitab_name: form.kitab_name.trim(),
      file_url: form.file_url.trim(),
      image_url: form.image_url.trim(),
      is_active: form.is_active,
    };

    if (editingId) {
      await supabase.from('kajian_offline').update(payload).eq('id', editingId);
    } else {
      await supabase.from('kajian_offline').insert(payload);
    }
    setSaving(false);
    closeForm();
    fetchData();
  };

  const deleteItem = async (id: number) => {
    await supabase.from('kajian_offline').delete().eq('id', id);
    setDeletingId(null);
    fetchData();
  };

  const updateField = (field: keyof KajianOffline, value: unknown) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-800">Kajian Offline</h1>
          <p className="text-sm text-slate-400 mt-1">Kelola jadwal kajian di masjid-masjid Se-Sragen</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
          <Plus size={16} /> Tambah Kajian
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-10 px-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl mb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-800">
                {editingId ? 'Edit Kajian' : 'Tambah Kajian Baru'}
              </h2>
              <button onClick={closeForm} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"><X size={18} /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Judul Kajian *</label>
                <input type="text" value={form.title} onChange={e => updateField('title', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none" placeholder="Contoh: Kajian Kitab Tafsir" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Pemateri / Ustadz</label>
                <input type="text" value={form.pemateri} onChange={e => updateField('pemateri', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none" placeholder="Nama ustadz" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Nama Kitab</label>
                <input type="text" value={form.kitab_name} onChange={e => updateField('kitab_name', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none" placeholder="Nama kitab yang dikaji" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Tempat *</label>
                <input type="text" value={form.tempat} onChange={e => updateField('tempat', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none" placeholder="Nama masjid" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Alamat</label>
                <input type="text" value={form.alamat} onChange={e => updateField('alamat', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none" placeholder="Alamat lengkap" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Hari</label>
                <select value={form.hari} onChange={e => updateField('hari', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none">
                  <option value="">Pilih Hari</option>
                  {HARI_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Jam</label>
                <input type="text" value={form.jam} onChange={e => updateField('jam', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none" placeholder="Contoh: 06:00 - 07:30" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Latitude</label>
                <input type="number" step="any" value={form.latitude ?? ''} onChange={e => updateField('latitude', e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none" placeholder="-7.4300" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Longitude</label>
                <input type="number" step="any" value={form.longitude ?? ''} onChange={e => updateField('longitude', e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none" placeholder="111.0100" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Contact Person</label>
                <input type="text" value={form.contact_person} onChange={e => updateField('contact_person', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none" placeholder="Nama CP" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">No. Telepon</label>
                <input type="text" value={form.contact_phone} onChange={e => updateField('contact_phone', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none" placeholder="08xxxxxxxxxx" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Materi / Deskripsi</label>
                <textarea value={form.description} onChange={e => updateField('description', e.target.value)} rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none resize-none" placeholder="Deskripsi kajian" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">URL File/Materi</label>
                <input type="url" value={form.file_url} onChange={e => updateField('file_url', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">URL Gambar</label>
                <input type="url" value={form.image_url} onChange={e => updateField('image_url', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none" placeholder="https://..." />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_relay} onChange={e => updateField('is_relay', e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded" />
                  <span className="text-sm text-slate-600 font-medium">Relay Radio</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={e => updateField('is_active', e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded" />
                  <span className="text-sm text-slate-600 font-medium">Aktif</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
              <button onClick={closeForm}
                className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-semibold rounded-xl text-sm hover:bg-slate-200 transition-colors">Batal</button>
              <button onClick={saveForm} disabled={saving}
                className="flex-1 py-2.5 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
                {saving ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Tambah Kajian')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">Memuat data...</div>
      ) : data.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-400 text-sm">Belum ada data kajian offline</p>
          <p className="text-slate-300 text-xs mt-1">Klik tombol &quot;Tambah Kajian&quot; untuk memulai</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {data.map(item => (
            <div key={item.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              {deletingId === item.id ? (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-red-600 font-medium">Hapus kajian &quot;{item.title}&quot;?</p>
                  <div className="flex gap-2">
                    <button onClick={() => setDeletingId(null)}
                      className="px-3 py-1.5 text-xs bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300">Batal</button>
                    <button onClick={() => deleteItem(item.id!)}
                      className="px-3 py-1.5 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600">Ya, Hapus</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">🕌</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-slate-700">{item.title}</p>
                      {item.is_relay && (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[10px] font-bold rounded-full flex items-center gap-1">
                          <Radio size={10} /> RELAY
                        </span>
                      )}
                      {!item.is_active && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-500 text-[10px] font-bold rounded-full">NONAKTIF</span>
                      )}
                    </div>
                    {item.pemateri && <p className="text-xs text-purple-500 font-medium mt-0.5">{item.pemateri}</p>}
                    <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-slate-400">
                      {item.tempat && (
                        <span className="flex items-center gap-1"><MapPin size={11} /> {item.tempat}</span>
                      )}
                      {item.hari && <span>📅 {item.hari}, {item.jam}</span>}
                      {item.kitab_name && (
                        <span className="flex items-center gap-1"><BookOpen size={11} /> {item.kitab_name}</span>
                      )}
                      {item.contact_phone && (
                        <span className="flex items-center gap-1"><Phone size={11} /> {item.contact_phone}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(item)}
                      className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setDeletingId(item.id!)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
