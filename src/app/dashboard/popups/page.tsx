'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, ToggleLeft, ToggleRight, Edit, MessageSquareDashed, Smartphone, LogOut as LogOutIcon } from 'lucide-react';

interface PopupItem {
  id: number;
  type: 'open' | 'close';
  title: string;
  body: string;
  image_url: string;
  action_url: string;
  action_label: string;
  is_active: boolean;
  show_once: boolean;
  created_at: string;
}

const emptyForm: Omit<PopupItem, 'id' | 'created_at'> = {
  type: 'open',
  title: '',
  body: '',
  image_url: '',
  action_url: '',
  action_label: 'Selengkapnya',
  is_active: true,
  show_once: false,
};

export default function PopupsPage() {
  const [popups, setPopups] = useState<PopupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

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

  const handleSave = async () => {
    setSaving(true);
    if (editId) {
      await supabase.from('app_popups').update({
        ...form,
        updated_at: new Date().toISOString(),
      }).eq('id', editId);
    } else {
      await supabase.from('app_popups').insert(form);
    }
    setSaving(false);
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm);
    fetchPopups();
  };

  const handleEdit = (item: PopupItem) => {
    setEditId(item.id);
    setForm({
      type: item.type,
      title: item.title,
      body: item.body,
      image_url: item.image_url,
      action_url: item.action_url,
      action_label: item.action_label,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
            <MessageSquareDashed size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Popup Info</h1>
            <p className="text-sm text-slate-400">Kelola popup saat buka & tutup aplikasi</p>
          </div>
        </div>
        <button
          onClick={() => { setEditId(null); setForm(emptyForm); setShowForm(true); }}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          <Plus size={16} /> Tambah Popup
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-4">
          <h2 className="font-bold text-slate-700">{editId ? 'Edit Popup' : 'Buat Popup Baru'}</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-600 block mb-1">Tipe Popup</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as 'open' | 'close' })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none"
              >
                <option value="open">🟢 Buka Aplikasi</option>
                <option value="close">🔴 Tutup Aplikasi</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 block mb-1">Label Tombol Aksi</label>
              <input
                type="text"
                value={form.action_label}
                onChange={(e) => setForm({ ...form, action_label: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none"
                placeholder="Selengkapnya"
              />
            </div>
          </div>

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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-600 block mb-1">URL Gambar (opsional)</label>
              <input
                type="url"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 block mb-1">URL Aksi (opsional)</label>
              <input
                type="url"
                value={form.action_url}
                onChange={(e) => setForm({ ...form, action_url: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none"
                placeholder="https://link-tujuan.com"
              />
            </div>
          </div>

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

      {/* List */}
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
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                item.type === 'open' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-400'
              }`}>
                {item.type === 'open' ? <Smartphone size={18} /> : <LogOutIcon size={18} />}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 text-sm truncate">{item.title}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.type === 'open'
                      ? 'bg-green-50 text-green-500'
                      : 'bg-red-50 text-red-400'
                  }`}>
                    {item.type === 'open' ? 'BUKA APP' : 'TUTUP APP'}
                  </span>
                  {item.show_once && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-400">1x</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 truncate mt-0.5">{item.body || '-'}</p>
              </div>
              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(item.id, item.is_active)}
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
                  onClick={() => handleDelete(item.id)}
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
