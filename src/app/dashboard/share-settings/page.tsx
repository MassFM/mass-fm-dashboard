'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Share2, Save, RotateCcw, Sparkles } from 'lucide-react';

export default function ShareSettingsPage() {
  const [template, setTemplate] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const defaultTemplate = `🎙️ Radio Mass FM 88.0 MHz Sragen
📻 Sedang LIVE: {judul}
👤 Pemateri: {pemateri}
📖 Program: {program}

🤲 Saluran Islami Menggapai Ridho Ilahi
▶️ Dengarkan streaming: {stream_url}`;

  useEffect(() => {
    fetchTemplate();
  }, []);

  async function fetchTemplate() {
    setLoading(true);
    const { data } = await supabase
      .from('app_settings')
      .select('share_template')
      .limit(1)
      .single();
    if (data?.share_template) {
      setTemplate(data.share_template);
    } else {
      setTemplate(defaultTemplate);
    }
    setLoading(false);
  }

  async function saveTemplate() {
    setSaving(true);
    const { data: existing } = await supabase.from('app_settings').select('id').limit(1).single();
    if (existing) {
      await supabase.from('app_settings').update({ share_template: template }).eq('id', existing.id);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function resetToDefault() {
    setTemplate(defaultTemplate);
  }

  // Preview
  const preview = template
    .replace(/\{judul\}/g, 'Fiqh Wanita')
    .replace(/\{pemateri\}/g, 'Ust. Ahmad Subhan')
    .replace(/\{program\}/g, 'Kajian Ba\'da Shubuh')
    .replace(/\{stream_url\}/g, 'http://s5.xajist.com:8522/stream');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Pengaturan Share Text</h1>
        <p className="text-slate-500 text-sm mt-1">Kustomisasi teks yang dibagikan pendengar saat share program</p>
      </div>

      {/* Info placeholder */}
      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
        <div className="flex items-start gap-3">
          <Sparkles size={18} className="text-blue-500 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-blue-700">Placeholder yang tersedia:</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {['{judul}', '{pemateri}', '{program}', '{stream_url}'].map(p => (
                <code key={p} className="px-2.5 py-1 bg-white rounded-lg text-xs font-mono text-blue-700 border border-blue-200">
                  {p}
                </code>
              ))}
            </div>
            <p className="text-xs text-blue-500 mt-2">Placeholder akan diganti dengan data program yang sedang live</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Editor */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Share2 size={18} className="text-primary" />
            <h2 className="font-bold text-slate-700">Template Share</h2>
          </div>
          {loading ? (
            <div className="text-center py-10 text-slate-400">Memuat...</div>
          ) : (
            <textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={12}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
            />
          )}
          <div className="flex gap-3 mt-4">
            <button onClick={saveTemplate} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-all">
              <Save size={16} />
              {saving ? 'Menyimpan...' : saved ? '✓ Tersimpan!' : 'Simpan Template'}
            </button>
            <button onClick={resetToDefault}
              className="flex items-center gap-2 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition-all">
              <RotateCcw size={16} />
              Reset Default
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Share2 size={18} className="text-green-600" />
            <h2 className="font-bold text-slate-700">Preview</h2>
            <span className="text-xs text-slate-400 ml-auto">Contoh data</span>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans leading-relaxed">
              {preview}
            </pre>
          </div>
          <div className="mt-4 bg-amber-50 rounded-xl p-3 border border-amber-100">
            <p className="text-xs text-amber-700">
              <strong>💡 Tips:</strong> Gunakan emoji untuk membuat teks lebih menarik. 
              Pendengar akan men-share teks ini ke WhatsApp, Instagram, dan media sosial lainnya.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
