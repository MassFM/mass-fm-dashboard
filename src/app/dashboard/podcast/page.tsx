'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Podcast {
  id?: number;
  title: string;
  description: string;
  pemateri: string;
  category: string;
  audio_url: string;
  cover_url: string;
  duration_seconds: number;
  is_published: boolean;
}

const CATEGORIES = ['Kajian', 'Tausiyah', 'Ceramah', 'Khutbah', 'Murottal', 'Lainnya'];

export default function PodcastPage() {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pemateri, setPemateri] = useState('');
  const [category, setCategory] = useState('Kajian');
  const [audioUrl, setAudioUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [isPublished, setIsPublished] = useState(true);

  useEffect(() => {
    fetchPodcasts();
  }, []);

  const fetchPodcasts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('podcasts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    setPodcasts(data || []);
    setLoading(false);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPemateri('');
    setCategory('Kajian');
    setAudioUrl('');
    setCoverUrl('');
    setDurationSeconds(0);
    setIsPublished(true);
    setEditingId(null);
    setShowForm(false);
  };

  const editPodcast = (p: Podcast) => {
    setTitle(p.title);
    setDescription(p.description);
    setPemateri(p.pemateri);
    setCategory(p.category);
    setAudioUrl(p.audio_url);
    setCoverUrl(p.cover_url || '');
    setDurationSeconds(p.duration_seconds);
    setIsPublished(p.is_published);
    setEditingId(p.id || null);
    setShowForm(true);
  };

  const savePodcast = async () => {
    const data = {
      title, description, pemateri, category,
      audio_url: audioUrl,
      cover_url: coverUrl || null,
      duration_seconds: durationSeconds,
      is_published: isPublished,
    };

    if (editingId) {
      await supabase.from('podcasts').update(data).eq('id', editingId);
    } else {
      await supabase.from('podcasts').insert(data);
    }

    resetForm();
    fetchPodcasts();
  };

  const deletePodcast = async (id: number) => {
    if (!confirm('Hapus podcast ini?')) return;
    await supabase.from('podcasts').delete().eq('id', id);
    fetchPodcasts();
  };

  const togglePublish = async (id: number, current: boolean) => {
    await supabase.from('podcasts').update({ is_published: !current }).eq('id', id);
    fetchPodcasts();
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-800">
            Kelola Podcast
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Upload dan kelola konten kajian on-demand
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="px-4 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
        >
          {showForm ? '✕ Tutup' : '+ Tambah Podcast'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h2 className="font-bold text-slate-700 mb-4">
            {editingId ? 'Edit Podcast' : 'Podcast Baru'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Judul</label>
              <input
                type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="Judul podcast"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Pemateri</label>
              <input
                type="text" value={pemateri} onChange={(e) => setPemateri(e.target.value)}
                placeholder="Nama pemateri"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Kategori</label>
              <select
                value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Durasi (detik)</label>
              <input
                type="number" value={durationSeconds} onChange={(e) => setDurationSeconds(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1">URL Audio</label>
              <input
                type="text" value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)}
                placeholder="https://... (URL file audio MP3)"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1">URL Cover (opsional)</label>
              <input
                type="text" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://... (URL gambar cover)"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Deskripsi</label>
              <textarea
                value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Deskripsi konten..."
                rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none resize-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox" checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="accent-purple-600"
              />
              <label className="text-sm text-slate-600">Publish langsung</label>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={savePodcast}
              disabled={!title || !pemateri || !audioUrl}
              className="px-6 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 disabled:opacity-50"
            >
              {editingId ? 'Update' : 'Simpan'}
            </button>
            <button onClick={resetForm} className="px-6 py-2.5 text-slate-500 rounded-xl font-semibold text-sm hover:bg-slate-50">
              Batal
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-slate-400">Memuat data...</div>
        ) : podcasts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-2">🎙️</p>
            <p className="text-slate-400 text-sm">Belum ada podcast</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="px-6 py-3 text-left">Podcast</th>
                <th className="px-4 py-3 text-left">Kategori</th>
                <th className="px-4 py-3 text-center">Durasi</th>
                <th className="px-4 py-3 text-center">Play</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {podcasts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-700">{p.title}</p>
                    <p className="text-xs text-slate-400">{p.pemateri}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className="px-2 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs font-medium">
                      {p.category}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center text-slate-500">
                    {formatDuration(p.duration_seconds)}
                  </td>
                  <td className="px-4 py-4 text-center text-slate-500">
                    {(p as Podcast & { play_count?: number }).play_count ?? 0}x
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => togglePublish(p.id!, p.is_published)}
                      className={`px-2 py-1 rounded-lg text-xs font-bold ${
                        p.is_published
                          ? 'bg-green-50 text-green-600'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {p.is_published ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => editPodcast(p)}
                      className="text-blue-500 hover:text-blue-700 mr-3 text-xs font-semibold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deletePodcast(p.id!)}
                      className="text-red-400 hover:text-red-600 text-xs font-semibold"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
