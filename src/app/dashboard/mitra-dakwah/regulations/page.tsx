'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { AdsConfig, AdPricing } from '@/types/database';
import {
  ArrowLeft, FileText, Save, Plus, Trash2,
  MessageCircle, Settings, DollarSign,
} from 'lucide-react';
import Link from 'next/link';

const defaultConfig: AdsConfig = {
  is_enabled: true,
  interstitial_enabled: true,
  interstitial_throttle_minutes: 30,
  catalog_title: 'Mitra Dakwah',
  catalog_subtitle: 'Partner & Iklan Radio Mass FM',
  regulations_html: '<h3>Ketentuan Iklan Radio Mass FM</h3><p>Hubungi admin untuk informasi lebih lanjut.</p>',
  pricing: [
    { name: 'Banner', price: 'Rp 100.000/bulan', description: 'Tampil di katalog iklan' },
    { name: 'Interstitial', price: 'Rp 250.000/bulan', description: 'Popup saat buka/tutup/transisi' },
    { name: 'Featured', price: 'Rp 500.000/bulan', description: 'Highlight di carousel + katalog' },
    { name: 'Premium', price: 'Rp 1.000.000/bulan', description: 'Featured + Interstitial + Prioritas' },
  ],
  contact_whatsapp: '6281234567890',
  contact_text: 'Hubungi kami untuk beriklan',
};

export default function MitraDakwahRegulationsPage() {
  const [config, setConfig] = useState<AdsConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('app_settings')
      .select('ads_config')
      .limit(1)
      .single();

    if (!error && data?.ads_config) {
      setConfig(data.ads_config as AdsConfig);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    const { error } = await supabase
      .from('app_settings')
      .update({ ads_config: config })
      .not('id', 'is', null); // Update all rows (should be 1)

    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      alert('Gagal menyimpan: ' + error.message);
    }
  };

  // ─── PRICING HELPERS ───
  const addPricing = () => {
    setConfig(prev => ({
      ...prev,
      pricing: [...prev.pricing, { name: '', price: '', description: '' }],
    }));
  };

  const updatePricing = (index: number, field: keyof AdPricing, value: string) => {
    setConfig(prev => ({
      ...prev,
      pricing: prev.pricing.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      ),
    }));
  };

  const removePricing = (index: number) => {
    setConfig(prev => ({
      ...prev,
      pricing: prev.pricing.filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Memuat pengaturan...</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/mitra-dakwah"
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <FileText size={28} className="text-amber-500" />
              Regulasi & Harga
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Pengaturan tampilan, harga, dan ketentuan Mitra Dakwah
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition ${
            saved
              ? 'bg-green-500 text-white'
              : 'bg-primary text-white hover:bg-primary/90'
          } disabled:opacity-50`}
        >
          <Save size={16} />
          {saving ? 'Menyimpan...' : saved ? 'Tersimpan!' : 'Simpan'}
        </button>
      </div>

      {/* Global Settings */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <Settings size={16} className="text-slate-400" />
          Pengaturan Umum
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.is_enabled}
              onChange={e => setConfig(prev => ({ ...prev, is_enabled: e.target.checked }))}
              className="rounded w-5 h-5"
            />
            <div>
              <p className="text-sm font-medium text-slate-700">Fitur Mitra Dakwah Aktif</p>
              <p className="text-xs text-slate-400">Tampilkan katalog iklan di aplikasi</p>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.interstitial_enabled}
              onChange={e => setConfig(prev => ({ ...prev, interstitial_enabled: e.target.checked }))}
              className="rounded w-5 h-5"
            />
            <div>
              <p className="text-sm font-medium text-slate-700">Interstitial Aktif</p>
              <p className="text-xs text-slate-400">Tampilkan popup iklan interstitial</p>
            </div>
          </label>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">
            Throttle Interstitial (menit antar popup)
          </label>
          <input
            type="number"
            min={5}
            max={1440}
            value={config.interstitial_throttle_minutes}
            onChange={e => setConfig(prev => ({
              ...prev,
              interstitial_throttle_minutes: parseInt(e.target.value) || 30,
            }))}
            className="w-48 px-3 py-2 rounded-lg border border-slate-200 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Judul Katalog</label>
            <input
              type="text"
              value={config.catalog_title}
              onChange={e => setConfig(prev => ({ ...prev, catalog_title: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Subtitle Katalog</label>
            <input
              type="text"
              value={config.catalog_subtitle}
              onChange={e => setConfig(prev => ({ ...prev, catalog_subtitle: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <DollarSign size={16} className="text-amber-500" />
            Daftar Harga Paket
          </h3>
          <button
            onClick={addPricing}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center gap-1"
          >
            <Plus size={14} /> Tambah
          </button>
        </div>

        {config.pricing.map((p, i) => (
          <div key={i} className="flex gap-3 items-start bg-slate-50 rounded-xl p-4">
            <div className="flex-1 grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Nama Paket</label>
                <input
                  type="text"
                  value={p.name}
                  onChange={e => updatePricing(i, 'name', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  placeholder="Banner"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Harga</label>
                <input
                  type="text"
                  value={p.price}
                  onChange={e => updatePricing(i, 'price', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  placeholder="Rp 100.000/bulan"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Keterangan</label>
                <input
                  type="text"
                  value={p.description}
                  onChange={e => updatePricing(i, 'description', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  placeholder="Deskripsi paket..."
                />
              </div>
            </div>
            <button
              onClick={() => removePricing(i)}
              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg mt-5"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      {/* Contact */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <MessageCircle size={16} className="text-green-500" />
          Kontak Pemasaran
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Nomor WhatsApp</label>
            <input
              type="text"
              value={config.contact_whatsapp}
              onChange={e => setConfig(prev => ({ ...prev, contact_whatsapp: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              placeholder="6281xxx"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Teks Tombol Kontak</label>
            <input
              type="text"
              value={config.contact_text}
              onChange={e => setConfig(prev => ({ ...prev, contact_text: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              placeholder="Hubungi kami untuk beriklan"
            />
          </div>
        </div>
      </div>

      {/* Regulations HTML */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <FileText size={16} className="text-slate-400" />
          Ketentuan & Regulasi (HTML)
        </h3>
        <textarea
          value={config.regulations_html}
          onChange={e => setConfig(prev => ({ ...prev, regulations_html: e.target.value }))}
          rows={8}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono resize-none"
          placeholder="<h3>Ketentuan Iklan</h3><p>...</p>"
        />
        {config.regulations_html && (
          <div className="border border-slate-100 rounded-xl p-4">
            <p className="text-xs text-slate-400 mb-2">Preview:</p>
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: config.regulations_html }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
