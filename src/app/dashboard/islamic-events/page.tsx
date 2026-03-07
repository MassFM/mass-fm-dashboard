'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { IslamicEvent } from '@/types/database';
import { useRouter } from 'next/navigation';
import { Star, Moon, Flag, Plus, Pencil, Trash2, Save, X, Search } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = (supabase as any);

type TabType = 'islamic_event' | 'sunnah_fasting' | 'national_holiday';

const HIJRI_MONTHS = [
  { value: 1, label: 'Muharram' },
  { value: 2, label: 'Safar' },
  { value: 3, label: "Rabi'ul Awal" },
  { value: 4, label: "Rabi'ul Akhir" },
  { value: 5, label: 'Jumadil Awal' },
  { value: 6, label: 'Jumadil Akhir' },
  { value: 7, label: 'Rajab' },
  { value: 8, label: "Sya'ban" },
  { value: 9, label: 'Ramadhan' },
  { value: 10, label: 'Syawal' },
  { value: 11, label: 'Dzulqa\'dah' },
  { value: 12, label: 'Dzulhijjah' },
];

const MASEHI_MONTHS = [
  { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' }, { value: 3, label: 'Maret' },
  { value: 4, label: 'April' }, { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' }, { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' }, { value: 11, label: 'November' }, { value: 12, label: 'Desember' },
];

const DAY_OF_WEEK_OPTIONS = [
  { value: '', label: '— Tidak ada —' },
  { value: 'monday', label: 'Senin' },
  { value: 'tuesday', label: 'Selasa' },
  { value: 'wednesday', label: 'Rabu' },
  { value: 'thursday', label: 'Kamis' },
  { value: 'friday', label: 'Jumat' },
  { value: 'saturday', label: 'Sabtu' },
  { value: 'sunday', label: 'Minggu' },
];

const BADGE_COLORS = [
  { value: '#832a6e', label: 'Ungu (Primary)' },
  { value: '#E91E63', label: 'Pink' },
  { value: '#F44336', label: 'Merah' },
  { value: '#FF9800', label: 'Orange' },
  { value: '#FF5722', label: 'Deep Orange' },
  { value: '#4CAF50', label: 'Hijau' },
  { value: '#2196F3', label: 'Biru' },
  { value: '#03A9F4', label: 'Light Blue' },
  { value: '#9C27B0', label: 'Purple' },
  { value: '#795548', label: 'Coklat' },
];

const TAB_CONFIG: { key: TabType; label: string; icon: React.ComponentType<{ size?: number; className?: string }>; color: string; bgColor: string }[] = [
  { key: 'islamic_event', label: 'Hari Besar Islam', icon: Star, color: 'text-purple-700', bgColor: 'bg-purple-50' },
  { key: 'sunnah_fasting', label: 'Puasa Sunnah', icon: Moon, color: 'text-blue-700', bgColor: 'bg-blue-50' },
  { key: 'national_holiday', label: 'Hari Libur Nasional', icon: Flag, color: 'text-red-700', bgColor: 'bg-red-50' },
];

export default function IslamicEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<IslamicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('islamic_event');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formHijriMonth, setFormHijriMonth] = useState<number | null>(null);
  const [formHijriDay, setFormHijriDay] = useState<number | null>(null);
  const [formMasehiMonth, setFormMasehiMonth] = useState<number | null>(null);
  const [formMasehiDay, setFormMasehiDay] = useState<number | null>(null);
  const [formDayOfWeek, setFormDayOfWeek] = useState('');
  const [formIsAnnual, setFormIsAnnual] = useState(true);
  const [formSpecificDate, setFormSpecificDate] = useState('');
  const [formBadgeColor, setFormBadgeColor] = useState('#832a6e');
  const [formIsActive, setFormIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push('/login');
    };
    checkUser();
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [activeTab]);

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('islamic_events')
      .select('*')
      .eq('event_type', activeTab)
      .order('hijri_month', { ascending: true, nullsFirst: false })
      .order('hijri_day', { ascending: true, nullsFirst: false })
      .order('masehi_month', { ascending: true, nullsFirst: false })
      .order('masehi_day', { ascending: true, nullsFirst: false })
      .order('name', { ascending: true });
    if (data) setEvents(data as IslamicEvent[]);
    if (error) console.error('Fetch error:', error.message);
    setLoading(false);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormName('');
    setFormDescription('');
    setFormHijriMonth(null);
    setFormHijriDay(null);
    setFormMasehiMonth(null);
    setFormMasehiDay(null);
    setFormDayOfWeek('');
    setFormIsAnnual(true);
    setFormSpecificDate('');
    setFormBadgeColor('#832a6e');
    setFormIsActive(true);
  };

  const handleEdit = (event: IslamicEvent) => {
    setEditingId(event.id || null);
    setFormName(event.name);
    setFormDescription(event.description || '');
    setFormHijriMonth(event.hijri_month ?? null);
    setFormHijriDay(event.hijri_day ?? null);
    setFormMasehiMonth(event.masehi_month ?? null);
    setFormMasehiDay(event.masehi_day ?? null);
    setFormDayOfWeek(event.day_of_week || '');
    setFormIsAnnual(event.is_annual);
    setFormSpecificDate(event.specific_date || '');
    setFormBadgeColor(event.badge_color || '#832a6e');
    setFormIsActive(event.is_active);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Nama event harus diisi!');
      return;
    }
    setSaving(true);

    const payload: Partial<IslamicEvent> = {
      event_type: activeTab,
      name: formName.trim(),
      description: formDescription.trim(),
      hijri_month: formHijriMonth || null,
      hijri_day: formHijriDay || null,
      masehi_month: formMasehiMonth || null,
      masehi_day: formMasehiDay || null,
      day_of_week: formDayOfWeek,
      is_annual: formIsAnnual,
      specific_date: formSpecificDate || null,
      badge_color: formBadgeColor,
      is_active: formIsActive,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (editingId) {
      const { error: err } = await db.from('islamic_events').update(payload).eq('id', editingId);
      error = err;
    } else {
      const { error: err } = await db.from('islamic_events').insert([payload]);
      error = err;
    }

    if (!error) {
      alert(editingId ? 'Event berhasil diperbarui!' : 'Event berhasil ditambahkan!');
      resetForm();
      fetchEvents();
    } else {
      alert('Gagal menyimpan: ' + error.message);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus event ini?')) return;
    const { error } = await db.from('islamic_events').delete().eq('id', id);
    if (!error) {
      alert('Event berhasil dihapus.');
      fetchEvents();
    } else {
      alert('Gagal menghapus: ' + error.message);
    }
  };

  const toggleActive = async (event: IslamicEvent) => {
    const { error } = await db
      .from('islamic_events')
      .update({ is_active: !event.is_active, updated_at: new Date().toISOString() })
      .eq('id', event.id!);
    if (!error) fetchEvents();
  };

  const filteredEvents = events.filter(ev =>
    ev.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ev.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDateLabel = (ev: IslamicEvent) => {
    const parts: string[] = [];
    if (ev.hijri_month && ev.hijri_day) {
      const monthName = HIJRI_MONTHS.find(m => m.value === ev.hijri_month)?.label || '';
      parts.push(`${ev.hijri_day} ${monthName}`);
    } else if (ev.hijri_day) {
      parts.push(`Tgl ${ev.hijri_day} (setiap bulan Hijriyah)`);
    } else if (ev.hijri_month) {
      const monthName = HIJRI_MONTHS.find(m => m.value === ev.hijri_month)?.label || '';
      parts.push(`Bulan ${monthName}`);
    }
    if (ev.masehi_month && ev.masehi_day) {
      const monthName = MASEHI_MONTHS.find(m => m.value === ev.masehi_month)?.label || '';
      parts.push(`${ev.masehi_day} ${monthName}`);
    }
    if (ev.day_of_week) {
      const dayLabel = DAY_OF_WEEK_OPTIONS.find(d => d.value === ev.day_of_week)?.label || ev.day_of_week;
      parts.push(`Setiap ${dayLabel}`);
    }
    if (ev.specific_date) {
      parts.push(ev.specific_date);
    }
    return parts.join(' • ') || 'Tidak ditentukan';
  };

  const currentTabConfig = TAB_CONFIG.find(t => t.key === activeTab)!;

  return (
    <div className="p-8 max-w-6xl mx-auto bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-primary">Kalender Islam</h1>
          <p className="text-sm text-slate-400 mt-1">Kelola hari besar Islam, puasa sunnah, dan hari libur nasional</p>
        </div>
        {!showForm && (
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 flex items-center gap-2 hover:opacity-90 transition"
          >
            <Plus size={16} /> Tambah Event
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-6">
        {TAB_CONFIG.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSearchQuery(''); }}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                {events.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-700">
              {editingId ? '✏️ Edit Event' : '➕ Tambah Event Baru'}
            </h2>
            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name & Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Nama Event *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Contoh: Maulid Nabi Muhammad ﷺ"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Deskripsi</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Keterangan tambahan..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                />
              </div>
            </div>

            {/* Date fields based on tab type */}
            {(activeTab === 'islamic_event' || activeTab === 'sunnah_fasting') && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Bulan Hijriyah</label>
                  <select
                    value={formHijriMonth ?? ''}
                    onChange={e => setFormHijriMonth(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                  >
                    <option value="">— Pilih Bulan —</option>
                    {HIJRI_MONTHS.map(m => (
                      <option key={m.value} value={m.value}>{m.value}. {m.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Tanggal Hijriyah</label>
                  <input
                    type="number"
                    value={formHijriDay ?? ''}
                    onChange={e => setFormHijriDay(e.target.value ? Number(e.target.value) : null)}
                    placeholder="1 - 30"
                    min={1} max={30}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                  />
                </div>
                {activeTab === 'sunnah_fasting' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Hari dalam Minggu</label>
                    <select
                      value={formDayOfWeek}
                      onChange={e => setFormDayOfWeek(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                    >
                      {DAY_OF_WEEK_OPTIONS.map(d => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'national_holiday' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Bulan Masehi</label>
                  <select
                    value={formMasehiMonth ?? ''}
                    onChange={e => setFormMasehiMonth(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                  >
                    <option value="">— Pilih Bulan —</option>
                    {MASEHI_MONTHS.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Tanggal Masehi</label>
                  <input
                    type="number"
                    value={formMasehiDay ?? ''}
                    onChange={e => setFormMasehiDay(e.target.value ? Number(e.target.value) : null)}
                    placeholder="1 - 31"
                    min={1} max={31}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Tanggal Spesifik (non-tahunan)</label>
                  <input
                    type="date"
                    value={formSpecificDate}
                    onChange={e => setFormSpecificDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Badge color, annual, active */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Warna Badge</label>
                <div className="flex items-center gap-2">
                  <select
                    value={formBadgeColor}
                    onChange={e => setFormBadgeColor(e.target.value)}
                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                  >
                    {BADGE_COLORS.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  <div className="w-8 h-8 rounded-lg border border-slate-200 shrink-0" style={{ backgroundColor: formBadgeColor }} />
                </div>
              </div>
              <div className="flex items-end gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsAnnual}
                    onChange={e => setFormIsAnnual(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-purple-200"
                  />
                  <span className="text-sm text-slate-600">Berulang Tiap Tahun</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={e => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-purple-200"
                  />
                  <span className="text-sm text-slate-600">Aktif</span>
                </label>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 flex items-center gap-2 hover:opacity-90 transition disabled:opacity-50"
              >
                <Save size={16} /> {saving ? 'Menyimpan...' : editingId ? 'Update Event' : 'Simpan Event'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-white text-slate-500 border border-slate-200 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-50 transition"
              >
                Batalkan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={`Cari ${currentTabConfig.label.toLowerCase()}...`}
          className="w-full pl-10 pr-4 py-2.5 border border-slate-100 rounded-xl text-sm bg-white focus:ring-2 focus:ring-purple-200 outline-none"
        />
      </div>

      {/* Event List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="animate-spin w-8 h-8 border-3 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
            Memuat data...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <currentTabConfig.icon size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-bold">Belum ada data {currentTabConfig.label.toLowerCase()}</p>
            <p className="text-xs mt-1">Klik tombol &ldquo;Tambah Event&rdquo; untuk menambahkan</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Event</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal / Waktu</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deskripsi</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Warna</th>
                <th className="text-right px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((ev, idx) => (
                <tr key={ev.id} className={`border-b border-slate-50 hover:bg-slate-50/50 transition ${!ev.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => toggleActive(ev)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition ${
                        ev.is_active
                          ? 'bg-green-50 text-green-600 hover:bg-green-100'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      }`}
                      title={ev.is_active ? 'Aktif - klik untuk nonaktifkan' : 'Nonaktif - klik untuk aktifkan'}
                    >
                      {ev.is_active ? '✓' : '—'}
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-sm text-slate-700">{ev.name}</div>
                    {ev.is_annual && (
                      <span className="text-[9px] bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded font-bold">TAHUNAN</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs text-slate-500">{getDateLabel(ev)}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs text-slate-400 line-clamp-2">{ev.description || '—'}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md border border-slate-100" style={{ backgroundColor: ev.badge_color }} />
                      <span className="text-[10px] text-slate-400 font-mono">{ev.badge_color}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleEdit(ev)}
                        className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 flex items-center justify-center transition"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => ev.id && handleDelete(ev.id)}
                        className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition"
                        title="Hapus"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        {TAB_CONFIG.map(tab => {
          const count = tab.key === activeTab ? events.length : 0;
          return (
            <div key={tab.key} className={`${tab.bgColor} rounded-2xl p-4 border border-slate-50`}>
              <div className="flex items-center gap-2 mb-1">
                <tab.icon size={14} className={tab.color} />
                <span className="text-[10px] font-bold text-slate-400 uppercase">{tab.label}</span>
              </div>
              <p className={`text-2xl font-bold ${tab.color}`}>
                {tab.key === activeTab ? filteredEvents.length : '—'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
