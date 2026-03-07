'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Smartphone, Upload, Trash2, Eye, Save, Loader2, Globe, Image as ImageIcon } from 'lucide-react';

interface SplashConfig {
  tagline: string;
  powered_by_text: string;
  powered_by_logo_url: string;
  website_url: string;
  show_powered_by: boolean;
  show_website: boolean;
  loading_text: string;
}

const defaultConfig: SplashConfig = {
  tagline: 'Saluran Islami Menggapai Ridho Ilahi',
  powered_by_text: 'Powered by',
  powered_by_logo_url: '',
  website_url: 'massfm.co.id',
  show_powered_by: true,
  show_website: true,
  loading_text: 'Mempersiapkan siaran...',
};

export default function SplashSettingsPage() {
  const [config, setConfig] = useState<SplashConfig>(defaultConfig);
  const [rowId, setRowId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    setLoading(true);
    const { data, error } = await supabase
      .from('app_settings')
      .select('id, splash_config')
      .limit(1)
      .single();

    if (!error && data) {
      setRowId(data.id as string);
      if (data.splash_config) {
        setConfig({ ...defaultConfig, ...(data.splash_config as SplashConfig) });
      }
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    if (!rowId) {
      setMessage({ type: 'error', text: 'ID pengaturan tidak ditemukan, coba refresh halaman.' });
      setSaving(false);
      return;
    }
    const { error } = await supabase
      .from('app_settings')
      .update({ splash_config: config })
      .eq('id', rowId);

    if (error) {
      setMessage({ type: 'error', text: 'Gagal menyimpan: ' + error.message });
    } else {
      setMessage({ type: 'success', text: 'Pengaturan splash screen berhasil disimpan!' });
    }
    setSaving(false);
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `splash-logo-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('app-assets')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      setMessage({ type: 'error', text: 'Gagal upload: ' + uploadError.message });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('app-assets').getPublicUrl(fileName);
    setConfig(prev => ({ ...prev, powered_by_logo_url: urlData.publicUrl }));
    setUploading(false);
  }

  async function handleDeleteLogo() {
    if (!config.powered_by_logo_url) return;
    const fileName = config.powered_by_logo_url.split('/').pop();
    if (fileName) {
      await supabase.storage.from('app-assets').remove([fileName]);
    }
    setConfig(prev => ({ ...prev, powered_by_logo_url: '' }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pengaturan Splash Screen</h1>
          <p className="text-slate-400 text-sm mt-1">Kustomisasi tampilan splash screen aplikasi</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          Simpan
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl mb-6 text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="space-y-6">
          {/* Tagline */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100">
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Smartphone size={16} /> Konten Utama
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Tagline</label>
                <input
                  type="text"
                  value={config.tagline}
                  onChange={e => setConfig(prev => ({ ...prev, tagline: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  placeholder="Tagline radio"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Teks Loading</label>
                <input
                  type="text"
                  value={config.loading_text}
                  onChange={e => setConfig(prev => ({ ...prev, loading_text: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  placeholder="Mempersiapkan siaran..."
                />
              </div>
            </div>
          </div>

          {/* Powered By */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100">
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <ImageIcon size={16} /> Powered By
            </h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.show_powered_by}
                  onChange={e => setConfig(prev => ({ ...prev, show_powered_by: e.target.checked }))}
                  className="w-4 h-4 rounded text-primary focus:ring-primary"
                />
                <span className="text-sm text-slate-600">Tampilkan &ldquo;Powered By&rdquo;</span>
              </label>
              {config.show_powered_by && (
                <>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Teks Powered By</label>
                    <input
                      type="text"
                      value={config.powered_by_text}
                      onChange={e => setConfig(prev => ({ ...prev, powered_by_text: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Logo Powered By</label>
                    {config.powered_by_logo_url ? (
                      <div className="flex items-center gap-3">
                        <img src={config.powered_by_logo_url} alt="Logo" className="h-12 rounded-lg bg-slate-100 p-1" />
                        <button onClick={handleDeleteLogo} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-primary/40 transition text-sm text-slate-400">
                        {uploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                        {uploading ? 'Mengupload...' : 'Upload Logo'}
                        <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                      </label>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Website */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100">
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Globe size={16} /> Website
            </h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.show_website}
                  onChange={e => setConfig(prev => ({ ...prev, show_website: e.target.checked }))}
                  className="w-4 h-4 rounded text-primary focus:ring-primary"
                />
                <span className="text-sm text-slate-600">Tampilkan URL Website</span>
              </label>
              {config.show_website && (
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">URL Website</label>
                  <input
                    type="text"
                    value={config.website_url}
                    onChange={e => setConfig(prev => ({ ...prev, website_url: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    placeholder="massfm.co.id"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-8 h-fit">
          <div className="bg-white rounded-2xl p-6 border border-slate-100">
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Eye size={16} /> Preview
            </h3>
            <div className="mx-auto w-[280px] h-[500px] rounded-[2rem] overflow-hidden border-4 border-slate-800 relative"
              style={{ background: 'radial-gradient(circle at 50% 35%, #2A1228, #120810)' }}
            >
              {/* Simulated splash content */}
              <div className="flex flex-col items-center justify-center h-full px-6">
                {/* Logo placeholder */}
                <div className="w-24 h-24 rounded-full bg-white/10 border-2 border-amber-400/40 flex items-center justify-center mb-6 shadow-lg shadow-purple-900/50">
                  <span className="text-3xl">📻</span>
                </div>
                <p className="text-white font-bold text-lg tracking-widest">RADIO MASS FM</p>
                <p className="text-amber-400/70 text-[10px] tracking-[3px] mt-1">88.0 MHZ SRAGEN</p>

                {/* Divider */}
                <div className="w-10 h-0.5 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent my-3" />

                {/* Tagline */}
                <p className="text-white/50 text-xs italic text-center">{config.tagline || 'Tagline'}</p>

                {/* Loading */}
                <div className="mt-8 flex flex-col items-center gap-2">
                  <div className="w-5 h-5 border-2 border-amber-400/40 border-t-transparent rounded-full animate-spin" />
                  <p className="text-white/20 text-[10px]">{config.loading_text}</p>
                </div>

                {/* Bottom section */}
                <div className="absolute bottom-8 left-0 right-0 px-6 flex flex-col items-center gap-2">
                  {config.show_powered_by && (
                    <div className="flex items-center gap-2">
                      <span className="text-white/30 text-[10px]">{config.powered_by_text}</span>
                      {config.powered_by_logo_url ? (
                        <img src={config.powered_by_logo_url} alt="Logo" className="h-4 opacity-50" />
                      ) : (
                        <span className="text-white/40 text-[10px]">[Logo]</span>
                      )}
                    </div>
                  )}
                  {config.show_website && (
                    <p className="text-white/20 text-[9px] tracking-wider">{config.website_url}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
