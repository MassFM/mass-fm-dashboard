'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { SchoolInfo } from '@/types/database';
import {
  School,
  Plus,
  Search,
  Loader2,
  Upload,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Save,
  X,
  ExternalLink,
  Image as ImageIcon,
  Layers,
  Bell,
  GalleryHorizontalEnd,
  MapPin,
} from 'lucide-react';

type SourceType = 'manual' | 'website';
type PopupType = 'open' | 'instant';

type SchoolInfoGlobalSettings = {
  directory_url: string;
  submit_url: string;
  header_title: string;
  header_subtitle: string;
};

type SchoolInfoForm = {
  source_type: SourceType;
  poster_url: string;
  school_name: string;
  level: string;
  foundation_name: string;
  advisor_name: string;
  foundation_chairman: string;
  principal_name: string;
  city: string;
  province: string;
  address: string;
  map_url: string;
  email: string;
  website_url: string;
  phone_1: string;
  phone_2: string;
  mobile_phone: string;
  contact_person: string;
  whatsapp: string;
  tuition_info: string;
  entry_fee_info: string;
  facebook_url: string;
  instagram_url: string;
  twitter_url: string;
  youtube_url: string;
  association_name: string;
  verification_note: string;
  profile_video_url: string;
  logo_url: string;
  description: string;
  website_item_url: string;
  submit_source_url: string;
  photo_urls_text: string;
  is_akhwat: boolean;
  is_ikhwan: boolean;
  is_full_day: boolean;
  is_boarding: boolean;
  has_paket_a: boolean;
  has_paket_b: boolean;
  has_paket_c: boolean;
  facilities_text: string;
  publish_to_home_slider: boolean;
  publish_to_popup: boolean;
  popup_type: PopupType;
  show_in_list: boolean;
  is_active: boolean;
  sort_order: number;
  home_slide_id: number | null;
  popup_id: number | null;
};

const EMPTY_FORM: SchoolInfoForm = {
  source_type: 'manual',
  poster_url: '',
  school_name: '',
  level: '',
  foundation_name: '',
  advisor_name: '',
  foundation_chairman: '',
  principal_name: '',
  city: '',
  province: '',
  address: '',
  map_url: '',
  email: '',
  website_url: '',
  phone_1: '',
  phone_2: '',
  mobile_phone: '',
  contact_person: '',
  whatsapp: '',
  tuition_info: '',
  entry_fee_info: '',
  facebook_url: '',
  instagram_url: '',
  twitter_url: '',
  youtube_url: '',
  association_name: '',
  verification_note: '',
  profile_video_url: '',
  logo_url: '',
  description: '',
  website_item_url: '',
  submit_source_url: 'https://sekolahsunnah.com/submit',
  photo_urls_text: '',
  is_akhwat: false,
  is_ikhwan: false,
  is_full_day: false,
  is_boarding: false,
  has_paket_a: false,
  has_paket_b: false,
  has_paket_c: false,
  facilities_text: '',
  publish_to_home_slider: false,
  publish_to_popup: false,
  popup_type: 'open',
  show_in_list: true,
  is_active: true,
  sort_order: 0,
  home_slide_id: null,
  popup_id: null,
};

const DEFAULT_GLOBAL_SETTINGS: SchoolInfoGlobalSettings = {
  directory_url: 'https://sekolahsunnah.com/',
  submit_url: 'https://sekolahsunnah.com/submit',
  header_title: 'Info Sekolah Sunnah',
  header_subtitle: 'Direktori sekolah bermanhaj salaf',
};

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function normalizeBool(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalizeFacilities(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((v) => String(v).trim())
      .filter((v) => v.length > 0);
  }
  return [];
}

function normalizeGlobalSettings(value: unknown): SchoolInfoGlobalSettings {
  let raw: Record<string, unknown> = {};

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object') {
        raw = parsed as Record<string, unknown>;
      }
    } catch {
      raw = {};
    }
  } else if (value && typeof value === 'object') {
    raw = value as Record<string, unknown>;
  }

  return {
    directory_url: normalizeString(raw.directory_url) || DEFAULT_GLOBAL_SETTINGS.directory_url,
    submit_url: normalizeString(raw.submit_url) || DEFAULT_GLOBAL_SETTINGS.submit_url,
    header_title: normalizeString(raw.header_title) || DEFAULT_GLOBAL_SETTINGS.header_title,
    header_subtitle: normalizeString(raw.header_subtitle) || DEFAULT_GLOBAL_SETTINGS.header_subtitle,
  };
}

function mapSchoolInfo(row: Record<string, unknown>): SchoolInfo {
  return {
    id: normalizeNumber(row.id, 0),
    created_at: normalizeString(row.created_at),
    updated_at: normalizeString(row.updated_at),
    source_type: (normalizeString(row.source_type) === 'website' ? 'website' : 'manual') as SourceType,
    poster_url: normalizeString(row.poster_url),
    school_name: normalizeString(row.school_name),
    level: normalizeString(row.level),
    foundation_name: normalizeString(row.foundation_name),
    advisor_name: normalizeString(row.advisor_name),
    foundation_chairman: normalizeString(row.foundation_chairman),
    principal_name: normalizeString(row.principal_name),
    city: normalizeString(row.city),
    province: normalizeString(row.province),
    address: normalizeString(row.address),
    map_url: normalizeString(row.map_url),
    email: normalizeString(row.email),
    website_url: normalizeString(row.website_url),
    phone_1: normalizeString(row.phone_1),
    phone_2: normalizeString(row.phone_2),
    mobile_phone: normalizeString(row.mobile_phone),
    contact_person: normalizeString(row.contact_person),
    whatsapp: normalizeString(row.whatsapp),
    tuition_info: normalizeString(row.tuition_info),
    entry_fee_info: normalizeString(row.entry_fee_info),
    facebook_url: normalizeString(row.facebook_url),
    instagram_url: normalizeString(row.instagram_url),
    twitter_url: normalizeString(row.twitter_url),
    youtube_url: normalizeString(row.youtube_url),
    association_name: normalizeString(row.association_name),
    verification_note: normalizeString(row.verification_note),
    profile_video_url: normalizeString(row.profile_video_url),
    logo_url: normalizeString(row.logo_url),
    description: normalizeString(row.description),
    website_item_url: normalizeString(row.website_item_url),
    submit_source_url: normalizeString(row.submit_source_url),
    photo_urls: normalizeFacilities(row.photo_urls),
    is_akhwat: normalizeBool(row.is_akhwat),
    is_ikhwan: normalizeBool(row.is_ikhwan),
    is_full_day: normalizeBool(row.is_full_day),
    is_boarding: normalizeBool(row.is_boarding),
    has_paket_a: normalizeBool(row.has_paket_a),
    has_paket_b: normalizeBool(row.has_paket_b),
    has_paket_c: normalizeBool(row.has_paket_c),
    facilities: normalizeFacilities(row.facilities),
    publish_to_home_slider: normalizeBool(row.publish_to_home_slider),
    publish_to_popup: normalizeBool(row.publish_to_popup),
    popup_type: (normalizeString(row.popup_type) === 'instant' ? 'instant' : 'open') as PopupType,
    home_slide_id: typeof row.home_slide_id === 'number' ? row.home_slide_id : null,
    popup_id: typeof row.popup_id === 'number' ? row.popup_id : null,
    show_in_list: normalizeBool(row.show_in_list, true),
    is_active: normalizeBool(row.is_active, true),
    sort_order: normalizeNumber(row.sort_order, 0),
  };
}

export default function SchoolInfoPage() {
  const [items, setItems] = useState<SchoolInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<SchoolInfo | null>(null);
  const [form, setForm] = useState<SchoolInfoForm>({ ...EMPTY_FORM });
  const [search, setSearch] = useState('');
  const [imageMode, setImageMode] = useState<'url' | 'upload'>('url');
  const [globalSettings, setGlobalSettings] = useState<SchoolInfoGlobalSettings>({ ...DEFAULT_GLOBAL_SETTINGS });
  const [savingGlobalSettings, setSavingGlobalSettings] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const stats = useMemo(() => {
    const active = items.filter((i) => i.is_active).length;
    const slider = items.filter((i) => i.publish_to_home_slider).length;
    const popup = items.filter((i) => i.publish_to_popup).length;
    return {
      total: items.length,
      active,
      slider,
      popup,
    };
  }, [items]);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((i) => {
      return (
        i.school_name.toLowerCase().includes(q) ||
        i.level.toLowerCase().includes(q) ||
        i.city.toLowerCase().includes(q) ||
        i.province.toLowerCase().includes(q) ||
        i.contact_person.toLowerCase().includes(q)
      );
    });
  }, [items, search]);

  async function fetchItems() {
    setLoading(true);
    const { data, error } = await supabase
      .from('school_infos')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      alert('Gagal memuat data sekolah: ' + error.message);
      setLoading(false);
      return;
    }

    const mapped = (data || []).map((row) => mapSchoolInfo(row as Record<string, unknown>));
    setItems(mapped);

    const { data: settingData } = await supabase
      .from('app_settings')
      .select('school_info_settings')
      .limit(1)
      .maybeSingle();

    if (settingData) {
      const raw = (settingData as Record<string, unknown>).school_info_settings;
      setGlobalSettings(normalizeGlobalSettings(raw));
    } else {
      setGlobalSettings({ ...DEFAULT_GLOBAL_SETTINGS });
    }

    setLoading(false);
  }

  async function saveGlobalSettings() {
    setSavingGlobalSettings(true);

    try {
      const payload: SchoolInfoGlobalSettings = {
        directory_url: globalSettings.directory_url.trim() || DEFAULT_GLOBAL_SETTINGS.directory_url,
        submit_url: globalSettings.submit_url.trim() || DEFAULT_GLOBAL_SETTINGS.submit_url,
        header_title: globalSettings.header_title.trim() || DEFAULT_GLOBAL_SETTINGS.header_title,
        header_subtitle: globalSettings.header_subtitle.trim() || DEFAULT_GLOBAL_SETTINGS.header_subtitle,
      };

      const { data: existing, error: fetchError } = await supabase
        .from('app_settings')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      if (existing && typeof (existing as Record<string, unknown>).id === 'number') {
        const { error: updateError } = await supabase
          .from('app_settings')
          .update({ school_info_settings: payload })
          .eq('id', (existing as Record<string, unknown>).id as number);

        if (updateError) {
          throw new Error(updateError.message);
        }
      } else {
        const { error: insertError } = await supabase
          .from('app_settings')
          .insert({ school_info_settings: payload });

        if (insertError) {
          throw new Error(insertError.message);
        }
      }

      setGlobalSettings(payload);
      alert('Pengaturan global Info Sekolah berhasil disimpan.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      alert('Gagal menyimpan pengaturan global: ' + message);
    }

    setSavingGlobalSettings(false);
  }

  function resetForm() {
    setShowForm(false);
    setEditingItem(null);
    setForm({ ...EMPTY_FORM });
    setImageMode('url');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function openCreate() {
    setEditingItem(null);
    setForm({
      ...EMPTY_FORM,
      submit_source_url: globalSettings.submit_url,
      sort_order: items.length,
    });
    setShowForm(true);
  }

  function openEdit(item: SchoolInfo) {
    setEditingItem(item);
    setForm({
      source_type: item.source_type,
      poster_url: item.poster_url,
      school_name: item.school_name,
      level: item.level,
      foundation_name: item.foundation_name,
      advisor_name: item.advisor_name,
      foundation_chairman: item.foundation_chairman,
      principal_name: item.principal_name,
      city: item.city,
      province: item.province,
      address: item.address,
      map_url: item.map_url,
      email: item.email,
      website_url: item.website_url,
      phone_1: item.phone_1,
      phone_2: item.phone_2,
      mobile_phone: item.mobile_phone,
      contact_person: item.contact_person,
      whatsapp: item.whatsapp,
      tuition_info: item.tuition_info,
      entry_fee_info: item.entry_fee_info,
      facebook_url: item.facebook_url,
      instagram_url: item.instagram_url,
      twitter_url: item.twitter_url,
      youtube_url: item.youtube_url,
      association_name: item.association_name,
      verification_note: item.verification_note,
      profile_video_url: item.profile_video_url,
      logo_url: item.logo_url,
      description: item.description,
      website_item_url: item.website_item_url,
      submit_source_url: item.submit_source_url || globalSettings.submit_url,
      photo_urls_text: item.photo_urls.join('\n'),
      is_akhwat: item.is_akhwat,
      is_ikhwan: item.is_ikhwan,
      is_full_day: item.is_full_day,
      is_boarding: item.is_boarding,
      has_paket_a: item.has_paket_a,
      has_paket_b: item.has_paket_b,
      has_paket_c: item.has_paket_c,
      facilities_text: item.facilities.join('\n'),
      publish_to_home_slider: item.publish_to_home_slider,
      publish_to_popup: item.publish_to_popup,
      popup_type: item.popup_type,
      show_in_list: item.show_in_list,
      is_active: item.is_active,
      sort_order: item.sort_order,
      home_slide_id: item.home_slide_id ?? null,
      popup_id: item.popup_id ?? null,
    });
    setShowForm(true);
  }

  async function uploadImage(file: File): Promise<string | null> {
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `school_infos/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    // Primary bucket (new)
    let { error } = await supabase.storage
      .from('school-brochures')
      .upload(fileName, file, { cacheControl: '31536000', upsert: false });

    // Fallback to existing posters bucket (for compatibility before bucket migration)
    if (error) {
      const fallback = await supabase.storage
        .from('posters')
        .upload(fileName, file, { cacheControl: '31536000', upsert: false });
      error = fallback.error || null;
      if (error) {
        alert('Gagal upload gambar: ' + error.message);
        return null;
      }
      const { data: urlData } = supabase.storage.from('posters').getPublicUrl(fileName);
      return urlData.publicUrl;
    }

    const { data: urlData } = supabase.storage.from('school-brochures').getPublicUrl(fileName);
    return urlData.publicUrl;
  }

  function buildStringList(text: string): string[] {
    return text
      .split(/\n|,/g)
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
  }

  async function syncHomeSlide(schoolId: number, localForm: SchoolInfoForm): Promise<number | null> {
    const existingId = localForm.home_slide_id;
    const subtitleParts = [localForm.level, [localForm.city, localForm.province].filter(Boolean).join(', ')]
      .filter((v) => v && v.trim().length > 0);

    const payload = {
      content_type: 'school_info',
      content_id: String(schoolId),
      image_url: localForm.poster_url,
      title: localForm.school_name || globalSettings.header_title,
      subtitle: subtitleParts.join(' • '),
      badge_text: 'SEKOLAH',
      badge_color: '#16a085',
      action_type: 'screen',
      action_data: `school_info:${schoolId}`,
      is_active: localForm.is_active,
      sort_order: localForm.sort_order,
    };

    if (localForm.publish_to_home_slider) {
      if (existingId) {
        const { error } = await supabase.from('home_slides').update(payload).eq('id', existingId);
        if (error) throw new Error('Gagal update home slider: ' + error.message);
        return existingId;
      }

      const { data, error } = await supabase
        .from('home_slides')
        .insert(payload)
        .select('id')
        .single();

      if (error) throw new Error('Gagal publish ke home slider: ' + error.message);
      return (data as Record<string, unknown>)?.id as number;
    }

    if (existingId) {
      await supabase.from('home_slides').update({ is_active: false }).eq('id', existingId);
    }
    return existingId;
  }

  async function syncPopup(schoolId: number, localForm: SchoolInfoForm): Promise<number | null> {
    const existingId = localForm.popup_id;

    const body =
      localForm.description.trim() ||
      [localForm.level, [localForm.city, localForm.province].filter(Boolean).join(', ')]
        .filter((v) => v && v.trim().length > 0)
        .join(' • ');

    const payload = {
      type: localForm.popup_type,
      title: localForm.school_name || globalSettings.header_title,
      body,
      image_url: localForm.poster_url,
      action_type: 'screen',
      action_url: `school_info:${schoolId}`,
      action_label: 'Lihat Detail',
      is_active: localForm.is_active,
      show_once: false,
      updated_at: new Date().toISOString(),
    };

    if (localForm.publish_to_popup) {
      if (existingId) {
        const { error } = await supabase.from('app_popups').update(payload).eq('id', existingId);
        if (error) throw new Error('Gagal update popup: ' + error.message);
        return existingId;
      }

      const { data, error } = await supabase
        .from('app_popups')
        .insert(payload)
        .select('id')
        .single();

      if (error) throw new Error('Gagal publish ke popup: ' + error.message);
      return (data as Record<string, unknown>)?.id as number;
    }

    if (existingId) {
      await supabase.from('app_popups').update({ is_active: false }).eq('id', existingId);
    }
    return existingId;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    if (!form.poster_url.trim()) {
      alert('Poster/Brosur wajib diisi.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        source_type: form.source_type,
        poster_url: form.poster_url.trim(),
        school_name: form.school_name.trim(),
        level: form.level.trim(),
        foundation_name: form.foundation_name.trim(),
        advisor_name: form.advisor_name.trim(),
        foundation_chairman: form.foundation_chairman.trim(),
        principal_name: form.principal_name.trim(),
        city: form.city.trim(),
        province: form.province.trim(),
        address: form.address.trim(),
        map_url: form.map_url.trim(),
        email: form.email.trim(),
        website_url: form.website_url.trim(),
        phone_1: form.phone_1.trim(),
        phone_2: form.phone_2.trim(),
        mobile_phone: form.mobile_phone.trim(),
        contact_person: form.contact_person.trim(),
        whatsapp: form.whatsapp.trim(),
        tuition_info: form.tuition_info.trim(),
        entry_fee_info: form.entry_fee_info.trim(),
        facebook_url: form.facebook_url.trim(),
        instagram_url: form.instagram_url.trim(),
        twitter_url: form.twitter_url.trim(),
        youtube_url: form.youtube_url.trim(),
        association_name: form.association_name.trim(),
        verification_note: form.verification_note.trim(),
        profile_video_url: form.profile_video_url.trim(),
        logo_url: form.logo_url.trim(),
        description: form.description.trim(),
        website_item_url: form.website_item_url.trim(),
        submit_source_url: form.submit_source_url.trim() || globalSettings.submit_url,
        photo_urls: buildStringList(form.photo_urls_text),
        is_akhwat: form.is_akhwat,
        is_ikhwan: form.is_ikhwan,
        is_full_day: form.is_full_day,
        is_boarding: form.is_boarding,
        has_paket_a: form.has_paket_a,
        has_paket_b: form.has_paket_b,
        has_paket_c: form.has_paket_c,
        facilities: buildStringList(form.facilities_text),
        publish_to_home_slider: form.publish_to_home_slider,
        publish_to_popup: form.publish_to_popup,
        popup_type: form.popup_type,
        show_in_list: form.show_in_list,
        is_active: form.is_active,
        sort_order: form.sort_order,
      };

      let schoolId = editingItem?.id ?? null;

      if (editingItem?.id) {
        const { error } = await supabase.from('school_infos').update(payload).eq('id', editingItem.id);
        if (error) throw new Error(error.message);
      } else {
        const { data, error } = await supabase
          .from('school_infos')
          .insert(payload)
          .select('id')
          .single();

        if (error) throw new Error(error.message);
        schoolId = (data as Record<string, unknown>)?.id as number;
      }

      if (!schoolId) throw new Error('ID school info tidak ditemukan setelah simpan.');

      const homeSlideId = await syncHomeSlide(schoolId, form);
      const popupId = await syncPopup(schoolId, form);

      await supabase
        .from('school_infos')
        .update({
          home_slide_id: homeSlideId,
          popup_id: popupId,
        })
        .eq('id', schoolId);

      await fetchItems();
      resetForm();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      alert('Gagal menyimpan: ' + msg);
    }

    setSaving(false);
  }

  async function toggleActive(item: SchoolInfo) {
    const next = !item.is_active;

    await supabase.from('school_infos').update({ is_active: next }).eq('id', item.id);
    if (item.home_slide_id) {
      await supabase.from('home_slides').update({ is_active: next }).eq('id', item.home_slide_id);
    }
    if (item.popup_id) {
      await supabase.from('app_popups').update({ is_active: next }).eq('id', item.popup_id);
    }

    await fetchItems();
  }

  async function handleDelete(item: SchoolInfo) {
    if (!confirm(`Hapus info sekolah "${item.school_name || 'Tanpa Nama'}"?`)) return;

    if (item.home_slide_id) {
      await supabase.from('home_slides').update({ is_active: false }).eq('id', item.home_slide_id);
    }
    if (item.popup_id) {
      await supabase.from('app_popups').update({ is_active: false }).eq('id', item.popup_id);
    }

    await supabase.from('school_infos').delete().eq('id', item.id);
    await fetchItems();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Info Sekolah</h1>
          <p className="text-sm text-slate-500 mt-1">
            Hybrid konten: referensi SekolahSunnah + input manual dashboard (poster wajib, field lain opsional)
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition shadow-lg shadow-primary/20"
        >
          <Plus size={18} />
          Tambah Info Sekolah
        </button>
      </div>

      <div className="bg-white rounded-2xl border p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Pengaturan Global Info Sekolah</h2>
            <p className="text-xs text-slate-500 mt-1">
              URL dan judul ini dipakai oleh aplikasi untuk halaman Info Sekolah dan tombol direktori/submit.
            </p>
          </div>
          <button
            onClick={saveGlobalSettings}
            disabled={savingGlobalSettings}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition disabled:opacity-60"
          >
            {savingGlobalSettings ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Simpan Pengaturan
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Judul Halaman</label>
            <input
              type="text"
              value={globalSettings.header_title}
              onChange={(e) => setGlobalSettings((s) => ({ ...s, header_title: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Subjudul Halaman</label>
            <input
              type="text"
              value={globalSettings.header_subtitle}
              onChange={(e) => setGlobalSettings((s) => ({ ...s, header_subtitle: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">URL Direktori</label>
            <input
              type="url"
              value={globalSettings.directory_url}
              onChange={(e) => setGlobalSettings((s) => ({ ...s, directory_url: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">URL Submit Sekolah</label>
            <input
              type="url"
              value={globalSettings.submit_url}
              onChange={(e) => setGlobalSettings((s) => ({ ...s, submit_url: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl p-4 bg-blue-50 text-blue-600">
          <div className="flex items-center gap-2 mb-1 opacity-70 text-xs font-medium">
            <Layers size={16} /> Total
          </div>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-xl p-4 bg-green-50 text-green-600">
          <div className="flex items-center gap-2 mb-1 opacity-70 text-xs font-medium">
            <Eye size={16} /> Aktif
          </div>
          <p className="text-2xl font-bold">{stats.active}</p>
        </div>
        <div className="rounded-xl p-4 bg-purple-50 text-purple-600">
          <div className="flex items-center gap-2 mb-1 opacity-70 text-xs font-medium">
            <GalleryHorizontalEnd size={16} /> Publish Slider
          </div>
          <p className="text-2xl font-bold">{stats.slider}</p>
        </div>
        <div className="rounded-xl p-4 bg-amber-50 text-amber-600">
          <div className="flex items-center gap-2 mb-1 opacity-70 text-xs font-medium">
            <Bell size={16} /> Publish Popup
          </div>
          <p className="text-2xl font-bold">{stats.popup}</p>
        </div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama sekolah, jenjang, kota, provinsi..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400 bg-white rounded-xl border">
            <School size={42} className="mx-auto mb-2 opacity-50" />
            <p className="font-medium">Belum ada data Info Sekolah</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div key={item.id} className={`bg-white rounded-xl border p-4 flex items-center gap-4 ${!item.is_active ? 'opacity-60' : ''}`}>
              <div className="w-28 h-16 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                {item.poster_url ? (
                  <Image
                    src={item.poster_url}
                    alt={item.school_name || 'Poster sekolah'}
                    width={112}
                    height={64}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <ImageIcon size={18} />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-600">
                    {item.source_type === 'website' ? 'Website' : 'Manual'}
                  </span>
                  {item.publish_to_home_slider && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-600">Slider</span>
                  )}
                  {item.publish_to_popup && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-600">Popup</span>
                  )}
                  {item.level && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-600">{item.level}</span>
                  )}
                </div>
                <p className="text-sm font-semibold text-slate-700 truncate">
                  {item.school_name || 'Tanpa Nama Sekolah'}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {[item.city, item.province].filter(Boolean).join(', ') || 'Lokasi belum diisi'}
                </p>
                {(item.website_item_url || item.website_url) && (
                  <a
                    href={item.website_item_url || item.website_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-primary mt-1 hover:underline"
                  >
                    <ExternalLink size={10} /> Buka Referensi
                  </a>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleActive(item)}
                  className={`p-2 rounded-lg transition ${item.is_active ? 'text-green-500 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-50'}`}
                  title={item.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                >
                  {item.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button
                  onClick={() => openEdit(item)}
                  className="p-2 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-500 transition"
                  title="Edit"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition"
                  title="Hapus"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={resetForm}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-slate-800">
                {editingItem ? 'Edit Info Sekolah' : 'Tambah Info Sekolah'}
              </h2>
              <button onClick={resetForm} className="p-2 hover:bg-slate-100 rounded-lg transition">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sumber Data</label>
                  <select
                    value={form.source_type}
                    onChange={(e) => setForm((f) => ({ ...f, source_type: e.target.value as SourceType }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="manual">Manual Dashboard</option>
                    <option value="website">Referensi Website</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Urutan</label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) || 0 }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Poster / Brosur <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setImageMode('url')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${imageMode === 'url' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}
                  >
                    URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageMode('upload')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${imageMode === 'upload' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}
                  >
                    Upload
                  </button>
                </div>

                {imageMode === 'url' ? (
                  <input
                    type="url"
                    value={form.poster_url}
                    onChange={(e) => setForm((f) => ({ ...f, poster_url: e.target.value }))}
                    placeholder="https://..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                ) : (
                  <div className="flex items-center gap-3">
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (!file.type.startsWith('image/')) {
                        alert('File harus berupa gambar.');
                        return;
                      }
                      if (file.size > 10 * 1024 * 1024) {
                        alert('Maksimal ukuran file 10 MB.');
                        return;
                      }
                      setUploading(true);
                      const url = await uploadImage(file);
                      setUploading(false);
                      if (url) {
                        setForm((f) => ({ ...f, poster_url: url }));
                      }
                    }} />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm hover:bg-slate-50 transition"
                    >
                      {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                      {uploading ? 'Mengupload...' : 'Pilih Gambar'}
                    </button>
                  </div>
                )}

                {form.poster_url && (
                  <div className="mt-3 rounded-xl border overflow-hidden bg-slate-50 max-h-52">
                    <Image
                      src={form.poster_url}
                      alt="Poster"
                      width={960}
                      height={540}
                      className="w-full h-full object-contain"
                      unoptimized
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Sekolah</label>
                  <input
                    type="text"
                    value={form.school_name}
                    onChange={(e) => setForm((f) => ({ ...f, school_name: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Jenjang</label>
                  <input
                    type="text"
                    value={form.level}
                    onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
                    placeholder="PAUD / TK / SD / SMP / SMA / Pesantren"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Yayasan / Instansi</label>
                <input
                  type="text"
                  value={form.foundation_name}
                  onChange={(e) => setForm((f) => ({ ...f, foundation_name: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Pembina</label>
                  <input
                    type="text"
                    value={form.advisor_name}
                    onChange={(e) => setForm((f) => ({ ...f, advisor_name: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ketua Yayasan</label>
                  <input
                    type="text"
                    value={form.foundation_chairman}
                    onChange={(e) => setForm((f) => ({ ...f, foundation_chairman: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kepala Sekolah</label>
                  <input
                    type="text"
                    value={form.principal_name}
                    onChange={(e) => setForm((f) => ({ ...f, principal_name: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kota/Kabupaten</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Provinsi</label>
                  <input
                    type="text"
                    value={form.province}
                    onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Alamat</label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">URL Google Maps</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="url"
                      value={form.map_url}
                      onChange={(e) => setForm((f) => ({ ...f, map_url: e.target.value }))}
                      placeholder="https://maps.google.com/..."
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Website Sekolah</label>
                  <input
                    type="url"
                    value={form.website_url}
                    onChange={(e) => setForm((f) => ({ ...f, website_url: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={form.contact_person}
                    onChange={(e) => setForm((f) => ({ ...f, contact_person: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">No. HP</label>
                  <input
                    type="text"
                    value={form.mobile_phone}
                    onChange={(e) => setForm((f) => ({ ...f, mobile_phone: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp</label>
                  <input
                    type="text"
                    value={form.whatsapp}
                    onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telepon 1</label>
                  <input
                    type="text"
                    value={form.phone_1}
                    onChange={(e) => setForm((f) => ({ ...f, phone_1: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telepon 2</label>
                  <input
                    type="text"
                    value={form.phone_2}
                    onChange={(e) => setForm((f) => ({ ...f, phone_2: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Facebook</label>
                  <input
                    type="url"
                    value={form.facebook_url}
                    onChange={(e) => setForm((f) => ({ ...f, facebook_url: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Instagram</label>
                  <input
                    type="url"
                    value={form.instagram_url}
                    onChange={(e) => setForm((f) => ({ ...f, instagram_url: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Twitter / X</label>
                  <input
                    type="url"
                    value={form.twitter_url}
                    onChange={(e) => setForm((f) => ({ ...f, twitter_url: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">YouTube</label>
                  <input
                    type="url"
                    value={form.youtube_url}
                    onChange={(e) => setForm((f) => ({ ...f, youtube_url: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Referensi URL SekolahSunnah</label>
                  <input
                    type="url"
                    value={form.website_item_url}
                    onChange={(e) => setForm((f) => ({ ...f, website_item_url: e.target.value }))}
                    placeholder="https://sekolahsunnah.com/..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">URL Submit</label>
                  <input
                    type="url"
                    value={form.submit_source_url}
                    onChange={(e) => setForm((f) => ({ ...f, submit_source_url: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Uang Masuk</label>
                  <input
                    type="text"
                    value={form.entry_fee_info}
                    onChange={(e) => setForm((f) => ({ ...f, entry_fee_info: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Biaya Bulanan</label>
                  <input
                    type="text"
                    value={form.tuition_info}
                    onChange={(e) => setForm((f) => ({ ...f, tuition_info: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fasilitas (opsional)</label>
                <textarea
                  value={form.facilities_text}
                  onChange={(e) => setForm((f) => ({ ...f, facilities_text: e.target.value }))}
                  rows={3}
                  placeholder="Satu fasilitas per baris, contoh:\nIkhwan\nAkhwat\nBoarding"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 border border-slate-100 rounded-xl p-4">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={form.is_ikhwan}
                    onChange={(e) => setForm((f) => ({ ...f, is_ikhwan: e.target.checked }))}
                    className="rounded accent-primary"
                  />
                  Ikhwan
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={form.is_akhwat}
                    onChange={(e) => setForm((f) => ({ ...f, is_akhwat: e.target.checked }))}
                    className="rounded accent-primary"
                  />
                  Akhwat
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={form.is_full_day}
                    onChange={(e) => setForm((f) => ({ ...f, is_full_day: e.target.checked }))}
                    className="rounded accent-primary"
                  />
                  Full Day
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={form.is_boarding}
                    onChange={(e) => setForm((f) => ({ ...f, is_boarding: e.target.checked }))}
                    className="rounded accent-primary"
                  />
                  Boarding
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={form.has_paket_a}
                    onChange={(e) => setForm((f) => ({ ...f, has_paket_a: e.target.checked }))}
                    className="rounded accent-primary"
                  />
                  Paket A
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={form.has_paket_b}
                    onChange={(e) => setForm((f) => ({ ...f, has_paket_b: e.target.checked }))}
                    className="rounded accent-primary"
                  />
                  Paket B
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={form.has_paket_c}
                    onChange={(e) => setForm((f) => ({ ...f, has_paket_c: e.target.checked }))}
                    className="rounded accent-primary"
                  />
                  Paket C
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Asosiasi</label>
                  <input
                    type="text"
                    value={form.association_name}
                    onChange={(e) => setForm((f) => ({ ...f, association_name: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Catatan Verifikasi</label>
                  <input
                    type="text"
                    value={form.verification_note}
                    onChange={(e) => setForm((f) => ({ ...f, verification_note: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Video Profile URL</label>
                  <input
                    type="url"
                    value={form.profile_video_url}
                    onChange={(e) => setForm((f) => ({ ...f, profile_video_url: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Logo URL</label>
                  <input
                    type="url"
                    value={form.logo_url}
                    onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Photo URL (opsional)</label>
                <textarea
                  value={form.photo_urls_text}
                  onChange={(e) => setForm((f) => ({ ...f, photo_urls_text: e.target.value }))}
                  rows={3}
                  placeholder="Satu URL per baris"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-slate-700">Distribusi Konten</h3>

                <label className="flex items-center gap-3 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={form.publish_to_home_slider}
                    onChange={(e) => setForm((f) => ({ ...f, publish_to_home_slider: e.target.checked }))}
                    className="rounded accent-primary"
                  />
                  Publish ke Home Slider
                </label>

                <label className="flex items-center gap-3 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={form.publish_to_popup}
                    onChange={(e) => setForm((f) => ({ ...f, publish_to_popup: e.target.checked }))}
                    className="rounded accent-primary"
                  />
                  Publish ke Popup Info
                </label>

                {form.publish_to_popup && (
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Tipe Popup</label>
                    <select
                      value={form.popup_type}
                      onChange={(e) => setForm((f) => ({ ...f, popup_type: e.target.value as PopupType }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="open">Popup saat buka aplikasi</option>
                      <option value="instant">Popup instant (kirim sekarang)</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={form.show_in_list}
                    onChange={(e) => setForm((f) => ({ ...f, show_in_list: e.target.checked }))}
                    className="rounded accent-primary"
                  />
                  Tampil di list aplikasi
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                    className="rounded accent-primary"
                  />
                  Aktif
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition disabled:opacity-50"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {editingItem ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border p-4 text-sm text-slate-500">
        <p className="font-medium text-slate-700 mb-1">Catatan implementasi</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Field wajib hanya <strong>Poster/Brosur</strong>.</li>
          <li>Saat publish aktif, data otomatis disinkronkan ke Home Slides dan Popup Info.</li>
          <li>Menu Info Sekolah di aplikasi membuka direktori website; detail item dibuka lewat slider/popup.</li>
        </ul>
      </div>
    </div>
  );
}
