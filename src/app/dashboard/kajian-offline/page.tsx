'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Pencil, Trash2, MapPin, Phone, BookOpen, Radio, X, Map, Tag, Users, Loader2, Copy, Navigation, Search } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface KajianOffline {
  id?: string;
  title: string;
  pemateri: string;
  pemateri_bio: string;
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
  provinsi: string;
  kota: string;
  kecamatan: string;
  desa: string;
  kategori: string;
  audience: string;
  pekan: string;
  created_at?: string;
}

interface RegionItem {
  id: string;
  name: string;
}

const REGION_API = 'https://api-regional-indonesia.vercel.app';

const emptyForm: KajianOffline = {
  title: '', pemateri: '', pemateri_bio: '', materi: '', description: '', tempat: '', alamat: '',
  latitude: null, longitude: null, contact_person: '', contact_phone: '',
  hari: '', jam: '', is_relay: false, kitab_name: '', file_url: '', image_url: '', is_active: true,
  provinsi: '', kota: '', kecamatan: '', desa: '', kategori: '', audience: 'Umum', pekan: 'semua',
};

const HARI_OPTIONS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];

const DEFAULT_KATEGORI = ['Aqidah','Fiqh','Tafsir','Hadits','Sirah','Adab & Akhlaq','Manhaj','Bahasa Arab','Tarbiyah','Umum'];

const AUDIENCE_OPTIONS = ['Umum','Ikhwan','Akhwat'];

export default function KajianOfflinePage() {
  const [data, setData] = useState<KajianOffline[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<KajianOffline>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [kategoriOptions, setKategoriOptions] = useState<string[]>(DEFAULT_KATEGORI);
  const [kategoriMode, setKategoriMode] = useState<'select'|'add'|'manage'>('select');
  const [newKategori, setNewKategori] = useState('');
  const [editingKategori, setEditingKategori] = useState<string|null>(null);
  const [editKategoriValue, setEditKategoriValue] = useState('');

  // Cascading region state
  const [provinces, setProvinces] = useState<RegionItem[]>([]);
  const [cities, setCities] = useState<RegionItem[]>([]);
  const [districts, setDistricts] = useState<RegionItem[]>([]);
  const [villages, setVillages] = useState<RegionItem[]>([]);
  const [selProvId, setSelProvId] = useState<string>('');
  const [selCityId, setSelCityId] = useState<string>('');
  const [selDistId, setSelDistId] = useState<string>('');
  const [loadingRegion, setLoadingRegion] = useState<string>('');

  // Map picker state
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [mapSearching, setMapSearching] = useState(false);
  const [mapSearchResults, setMapSearchResults] = useState<{ display_name: string; lat: string; lon: string }[]>([]);

  // Geocode search using Nominatim
  async function handleMapSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!mapSearchQuery.trim()) return;
    setMapSearching(true);
    setMapSearchResults([]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearchQuery)}&limit=5&countrycodes=id`,
        { headers: { 'Accept-Language': 'id' } }
      );
      const data = await res.json();
      setMapSearchResults(data);
    } catch {
      setMapSearchResults([]);
    }
    setMapSearching(false);
  }

  function selectMapSearchResult(lat: string, lon: string) {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lon);
    updateField('latitude', parseFloat(latNum.toFixed(7)));
    updateField('longitude', parseFloat(lngNum.toFixed(7)));
    setMapSearchResults([]);
    setMapSearchQuery('');
    // Pan map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([latNum, lngNum], 16);
      const icon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
      });
      if (markerRef.current) {
        markerRef.current.setLatLng([latNum, lngNum]);
      } else {
        markerRef.current = L.marker([latNum, lngNum], { icon }).addTo(mapInstanceRef.current);
      }
    }
  }

  // Initialize / destroy Leaflet map
  useEffect(() => {
    if (!showMapPicker || !mapContainerRef.current) return;
    // Avoid double-init
    if (mapInstanceRef.current) {
      mapInstanceRef.current.invalidateSize();
      return;
    }
    const defaultLat = form.latitude ?? -7.43;
    const defaultLng = form.longitude ?? 110.84;
    const map = L.map(mapContainerRef.current, { attributionControl: false }).setView([defaultLat, defaultLng], form.latitude ? 15 : 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    mapInstanceRef.current = map;

    // Custom marker icon (fix default icon issue with bundlers)
    const icon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
    });

    if (form.latitude && form.longitude) {
      markerRef.current = L.marker([form.latitude, form.longitude], { icon }).addTo(map);
    }

    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      updateField('latitude', parseFloat(lat.toFixed(7)));
      updateField('longitude', parseFloat(lng.toFixed(7)));
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], { icon }).addTo(map);
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMapPicker]);

  // Sync marker when form lat/lng changes from manual input
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (form.latitude && form.longitude) {
      const icon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
      });
      if (markerRef.current) {
        markerRef.current.setLatLng([form.latitude, form.longitude]);
      } else {
        markerRef.current = L.marker([form.latitude, form.longitude], { icon }).addTo(mapInstanceRef.current);
      }
      mapInstanceRef.current.setView([form.latitude, form.longitude], 15);
    }
  }, [form.latitude, form.longitude]);

  const fetchRegion = useCallback(async (endpoint: string): Promise<RegionItem[]> => {
    try {
      const res = await fetch(`${REGION_API}${endpoint}`);
      const json = await res.json();
      if (json.status && json.data) return json.data.map((d: { id: string; name: string }) => ({ id: d.id, name: d.name }));
      return [];
    } catch { return []; }
  }, []);

  useEffect(() => {
    fetchRegion('/api/provinces?sort=name').then(setProvinces);
  }, [fetchRegion]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: result } = await supabase
      .from('kajian_offline')
      .select('*')
      .order('provinsi', { ascending: true })
      .order('kota', { ascending: true })
      .order('hari', { ascending: true });
    setData(result || []);
    // Merge unique categories from DB with defaults
    const dbKats = (result || []).map(k => k.kategori).filter(Boolean);
    setKategoriOptions(prev => [...new Set([...prev, ...dbKats])].sort());
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

  const duplicateItem = (item: KajianOffline) => {
    const { id, ...rest } = item;
    setForm({
      ...rest,
      title: `${item.title} (salinan)`,
      pemateri: '',
      pemateri_bio: '',
      kitab_name: '',
      materi: '',
    });
    setEditingId(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setShowMapPicker(false);
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
      pemateri_bio: form.pemateri_bio.trim(),
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
      provinsi: form.provinsi.trim(),
      kota: form.kota.trim(),
      kecamatan: form.kecamatan.trim(),
      desa: form.desa.trim(),
      kategori: form.kategori,
      audience: form.audience,
      pekan: form.pekan,
    };

    let error;
    if (editingId) {
      const res = await supabase.from('kajian_offline').update(payload).eq('id', editingId);
      error = res.error;
    } else {
      const res = await supabase.from('kajian_offline').insert(payload);
      error = res.error;
    }
    setSaving(false);
    if (error) {
      console.error('Save error:', error);
      alert('Gagal menyimpan: ' + error.message);
      return;
    }
    closeForm();
    fetchData();
  };

  const deleteItem = async (id: string) => {
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
          <h1 className="text-2xl font-display font-bold text-slate-800">Kajian Rutin</h1>
          <p className="text-sm text-slate-400 mt-1">Kelola jadwal kajian rutin seluruh Indonesia</p>
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
                <label className="block text-xs font-semibold text-slate-500 mb-1">Keterangan Pemateri</label>
                <input type="text" value={form.pemateri_bio} onChange={e => updateField('pemateri_bio', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none" placeholder="Misal: Pengajar Pesantren Al-Furqon Grobogan" />
              </div>
              <div className="md:col-span-2">
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
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-500">Lokasi (Latitude & Longitude)</label>
                  <button type="button" onClick={() => { setShowMapPicker(v => !v); setTimeout(() => mapInstanceRef.current?.invalidateSize(), 200); }}
                    className="flex items-center gap-1 text-[10px] text-purple-500 hover:text-purple-700 font-semibold">
                    <Navigation size={10} />{showMapPicker ? 'Sembunyikan Peta' : 'Pilih di Peta'}
                  </button>
                </div>
                {showMapPicker && (
                  <div className="mb-3 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                    {/* Map Search */}
                    <form onSubmit={handleMapSearch} className="flex items-center gap-2 p-2 bg-white border-b border-slate-100">
                      <div className="relative flex-1">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={mapSearchQuery}
                          onChange={e => setMapSearchQuery(e.target.value)}
                          placeholder="Cari lokasi..."
                          className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-purple-200 outline-none"
                        />
                      </div>
                      <button type="submit" disabled={mapSearching || !mapSearchQuery.trim()}
                        className="px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 disabled:opacity-50 transition flex items-center gap-1">
                        {mapSearching ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                        Cari
                      </button>
                    </form>
                    {/* Search Results */}
                    {mapSearchResults.length > 0 && (
                      <div className="max-h-36 overflow-y-auto bg-white border-b border-slate-100">
                        {mapSearchResults.map((r, i) => (
                          <button key={i} type="button"
                            onClick={() => selectMapSearchResult(r.lat, r.lon)}
                            className="w-full text-left px-3 py-2 text-xs text-slate-600 hover:bg-purple-50 transition border-b border-slate-50 last:border-0 flex items-start gap-2">
                            <MapPin size={12} className="text-purple-500 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{r.display_name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    <div ref={mapContainerRef} style={{ height: 260, width: '100%' }} />
                    <p className="text-[10px] text-slate-400 text-center py-1 bg-slate-50">Klik pada peta untuk menentukan titik lokasi</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">Latitude</label>
                    <input type="number" step="any" value={form.latitude ?? ''} onChange={e => updateField('latitude', e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none" placeholder="-7.4300" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">Longitude</label>
                    <input type="number" step="any" value={form.longitude ?? ''} onChange={e => updateField('longitude', e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none" placeholder="111.0100" />
                  </div>
                </div>
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
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Provinsi</label>
                <select value={selProvId} onChange={async e => {
                  const id = e.target.value;
                  const prov = provinces.find(p => p.id === id);
                  setSelProvId(id);
                  updateField('provinsi', prov?.name || '');
                  setSelCityId(''); setCities([]); setDistricts([]); setVillages([]);
                  updateField('kota', ''); updateField('kecamatan', ''); updateField('desa', '');
                  if (id) { setLoadingRegion('city'); setCities(await fetchRegion(`/api/cities/${id}?sort=name`)); setLoadingRegion(''); }
                }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none">
                  <option value="">Pilih Provinsi (38 provinsi)</option>
                  {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Kota / Kabupaten {loadingRegion === 'city' && <Loader2 size={12} className="inline animate-spin ml-1" />}</label>
                <select value={selCityId} onChange={async e => {
                  const id = e.target.value;
                  const city = cities.find(c => c.id === id);
                  setSelCityId(id);
                  updateField('kota', city?.name || '');
                  setSelDistId(''); setDistricts([]); setVillages([]);
                  updateField('kecamatan', ''); updateField('desa', '');
                  if (id) { setLoadingRegion('dist'); setDistricts(await fetchRegion(`/api/districts/${id}?sort=name`)); setLoadingRegion(''); }
                }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none">
                  <option value="">{selProvId ? 'Pilih Kota / Kabupaten' : 'Pilih provinsi terlebih dahulu'}</option>
                  {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Kecamatan {loadingRegion === 'dist' && <Loader2 size={12} className="inline animate-spin ml-1" />}</label>
                <select value={selDistId} onChange={async e => {
                  const id = e.target.value;
                  const dist = districts.find(d => d.id === id);
                  setSelDistId(id);
                  updateField('kecamatan', dist?.name || '');
                  setVillages([]);
                  updateField('desa', '');
                  if (id) { setLoadingRegion('village'); setVillages(await fetchRegion(`/api/villages/${id}?sort=name`)); setLoadingRegion(''); }
                }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none">
                  <option value="">{selCityId ? 'Pilih Kecamatan' : 'Pilih kota terlebih dahulu'}</option>
                  {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Desa / Kelurahan {loadingRegion === 'village' && <Loader2 size={12} className="inline animate-spin ml-1" />}</label>
                <select value={form.desa} onChange={e => {
                  const villageName = e.target.value;
                  updateField('desa', villageName);
                }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none">
                  <option value="">{selDistId ? 'Pilih Desa / Kelurahan' : 'Pilih kecamatan terlebih dahulu'}</option>
                  {villages.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-500">Kategori / Topik</label>
                  {kategoriMode === 'select' && (
                    <button type="button" onClick={() => setKategoriMode('manage')}
                      className="text-[10px] text-purple-500 hover:text-purple-700 font-semibold">Kelola Kategori</button>
                  )}
                  {kategoriMode !== 'select' && (
                    <button type="button" onClick={() => { setKategoriMode('select'); setNewKategori(''); setEditingKategori(null); }}
                      className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold">Selesai</button>
                  )}
                </div>

                {/* Mode: Select */}
                {kategoriMode === 'select' && (
                  <select value={form.kategori} onChange={e => {
                    if (e.target.value === '__add_new__') { setKategoriMode('add'); return; }
                    updateField('kategori', e.target.value);
                  }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none">
                    <option value="">Pilih Kategori</option>
                    {kategoriOptions.map(k => <option key={k} value={k}>{k}</option>)}
                    <option value="__add_new__">＋ Tambah Kategori Baru...</option>
                  </select>
                )}

                {/* Mode: Add */}
                {kategoriMode === 'add' && (
                  <div className="flex gap-2">
                    <input type="text" value={newKategori} onChange={e => setNewKategori(e.target.value)}
                      autoFocus placeholder="Nama kategori baru"
                      onKeyDown={e => {
                        if (e.key === 'Enter' && newKategori.trim()) {
                          const val = newKategori.trim();
                          if (!kategoriOptions.includes(val)) setKategoriOptions(prev => [...prev, val].sort());
                          updateField('kategori', val);
                          setNewKategori(''); setKategoriMode('select');
                        }
                        if (e.key === 'Escape') { setNewKategori(''); setKategoriMode('select'); }
                      }}
                      className="flex-1 px-3 py-2 border border-purple-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none" />
                    <button type="button" onClick={() => {
                      const val = newKategori.trim();
                      if (val) {
                        if (!kategoriOptions.includes(val)) setKategoriOptions(prev => [...prev, val].sort());
                        updateField('kategori', val);
                      }
                      setNewKategori(''); setKategoriMode('select');
                    }}
                      className="px-3 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary/90 transition-colors">Simpan</button>
                    <button type="button" onClick={() => { setNewKategori(''); setKategoriMode('select'); }}
                      className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors">Batal</button>
                  </div>
                )}

                {/* Mode: Manage (list with edit/delete per item + add) */}
                {kategoriMode === 'manage' && (
                  <div className="border border-slate-200 rounded-xl p-3 space-y-1.5 max-h-52 overflow-y-auto">
                    {kategoriOptions.map(k => (
                      <div key={k} className="flex items-center gap-1.5 group">
                        {editingKategori === k ? (
                          <>
                            <input type="text" value={editKategoriValue} onChange={e => setEditKategoriValue(e.target.value)}
                              autoFocus
                              onKeyDown={e => {
                                if (e.key === 'Enter' && editKategoriValue.trim()) {
                                  const newVal = editKategoriValue.trim();
                                  if (newVal !== k && !kategoriOptions.includes(newVal)) {
                                    setKategoriOptions(prev => prev.map(x => x === k ? newVal : x).sort());
                                    if (form.kategori === k) updateField('kategori', newVal);
                                    // Update existing data in DB
                                    supabase.from('kajian_offline').update({ kategori: newVal }).eq('kategori', k).then(() => fetchData());
                                  }
                                  setEditingKategori(null); setEditKategoriValue('');
                                }
                                if (e.key === 'Escape') { setEditingKategori(null); setEditKategoriValue(''); }
                              }}
                              className="flex-1 px-2 py-1 border border-purple-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-200 outline-none" />
                            <button type="button" onClick={() => {
                              const newVal = editKategoriValue.trim();
                              if (newVal && newVal !== k && !kategoriOptions.includes(newVal)) {
                                setKategoriOptions(prev => prev.map(x => x === k ? newVal : x).sort());
                                if (form.kategori === k) updateField('kategori', newVal);
                                supabase.from('kajian_offline').update({ kategori: newVal }).eq('kategori', k).then(() => fetchData());
                              }
                              setEditingKategori(null); setEditKategoriValue('');
                            }}
                              className="p-1 text-green-500 hover:bg-green-50 rounded">✓</button>
                            <button type="button" onClick={() => { setEditingKategori(null); setEditKategoriValue(''); }}
                              className="p-1 text-slate-400 hover:bg-slate-100 rounded"><X size={12} /></button>
                          </>
                        ) : (
                          <>
                            <span className={`flex-1 text-xs py-1 px-2 rounded-lg cursor-pointer transition-colors ${
                              form.kategori === k ? 'bg-purple-100 text-purple-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                            }`} onClick={() => { updateField('kategori', k); setKategoriMode('select'); }}>{k}</span>
                            <button type="button" onClick={() => { setEditingKategori(k); setEditKategoriValue(k); }}
                              className="p-1 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                              <Pencil size={11} />
                            </button>
                            <button type="button" onClick={() => {
                              if (!confirm(`Hapus kategori "${k}"? Data kajian dengan kategori ini akan dikosongkan.`)) return;
                              setKategoriOptions(prev => prev.filter(x => x !== k));
                              if (form.kategori === k) updateField('kategori', '');
                              // Clear kategori in DB for affected rows
                              supabase.from('kajian_offline').update({ kategori: '' }).eq('kategori', k).then(() => fetchData());
                            }}
                              className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 size={11} />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                    {/* Add new inline */}
                    <div className="flex gap-1.5 pt-1.5 border-t border-slate-100">
                      <input type="text" value={newKategori} onChange={e => setNewKategori(e.target.value)}
                        placeholder="+ Kategori baru"
                        onKeyDown={e => {
                          if (e.key === 'Enter' && newKategori.trim()) {
                            const val = newKategori.trim();
                            if (!kategoriOptions.includes(val)) setKategoriOptions(prev => [...prev, val].sort());
                            updateField('kategori', val);
                            setNewKategori('');
                          }
                        }}
                        className="flex-1 px-2 py-1 border border-dashed border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-200 outline-none placeholder:text-slate-300" />
                      <button type="button" onClick={() => {
                        const val = newKategori.trim();
                        if (val && !kategoriOptions.includes(val)) {
                          setKategoriOptions(prev => [...prev, val].sort());
                          updateField('kategori', val);
                          setNewKategori('');
                        }
                      }}
                        className="px-2 py-1 bg-primary text-white rounded-lg text-[10px] font-semibold hover:bg-primary/90 transition-colors">Tambah</button>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Audience / Peserta</label>
                <select value={form.audience} onChange={e => updateField('audience', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none">
                  {AUDIENCE_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              {/* Pekan / Minggu Ke- */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Pekan / Minggu Ke-</label>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => updateField('pekan', 'semua')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      form.pekan === 'semua'
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-purple-300'
                    }`}>Setiap Pekan</button>
                  {[1,2,3,4,5].map(w => {
                    const weeks = form.pekan === 'semua' ? [] : form.pekan.split(',').map(Number).filter(Boolean);
                    const isActive = weeks.includes(w);
                    return (
                      <button key={w} type="button" onClick={() => {
                        let next: number[];
                        if (isActive) {
                          next = weeks.filter(x => x !== w);
                        } else {
                          next = [...weeks, w].sort();
                        }
                        updateField('pekan', next.length === 0 ? 'semua' : next.join(','));
                      }}
                        className={`w-9 h-9 rounded-lg text-xs font-bold border transition-colors ${
                          isActive
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-purple-300'
                        }`}>{w}</button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Kosongkan / pilih &quot;Setiap Pekan&quot; jika berlaku setiap minggu</p>
              </div>
              <div className="md:col-span-2 flex items-center gap-6">
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
          <p className="text-slate-400 text-sm">Belum ada data kajian rutin</p>
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
                  <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
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
                    {item.pemateri && (
                      <div className="mt-0.5">
                        <p className="text-xs text-purple-500 font-medium">{item.pemateri}</p>
                        {item.pemateri_bio && <p className="text-[10px] text-slate-400 italic">{item.pemateri_bio}</p>}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-slate-400">
                      {(item.kota || item.provinsi) && (
                        <span className="flex items-center gap-1"><Map size={11} className="text-indigo-400" /> {[item.kota, item.provinsi].filter(Boolean).join(', ')}</span>
                      )}
                      {item.tempat && (
                        <span className="flex items-center gap-1"><MapPin size={11} /> {item.tempat}</span>
                      )}
                      {item.hari && <span>📅 {item.hari}, {item.jam}</span>}
                      {item.pekan && item.pekan !== 'semua' && (
                        <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 text-[10px] font-bold rounded-full">Pekan {item.pekan}</span>
                      )}
                      {item.kategori && (
                        <span className="flex items-center gap-1"><Tag size={11} className="text-teal-400" /> {item.kategori}</span>
                      )}
                      {item.audience && item.audience !== 'Umum' && (
                        <span className="flex items-center gap-1"><Users size={11} className="text-purple-400" /> {item.audience}</span>
                      )}
                      {item.kitab_name && (
                        <span className="flex items-center gap-1"><BookOpen size={11} /> {item.kitab_name}</span>
                      )}
                      {item.contact_phone && (
                        <span className="flex items-center gap-1"><Phone size={11} /> {item.contact_phone}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => duplicateItem(item)}
                      className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors" title="Duplikat">
                      <Copy size={14} />
                    </button>
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
