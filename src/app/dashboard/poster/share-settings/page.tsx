'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Image as ImageIcon, Save, RotateCcw, Sparkles, Eye } from 'lucide-react';

export default function PosterShareSettingsPage() {
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const defaultMessage = `🖼️ Poster Dakwah Radio Mass FM
🎙️ Radio Mass FM 88.0 MHz Sragen
🤲 Saluran Islami Menggapai Ridho Ilahi

📻 Dengarkan streaming:
http://s5.xajist.com:8522/stream`;

  useEffect(() => {
    fetchMessage();
  }, []);

  async function fetchMessage() {
    setLoading(true);
    const { data } = await supabase
      .from('app_settings')
      .select('poster_share_message')
      .limit(1)
      .single();
    if (data?.poster_share_message) {
      setMessage(data.poster_share_message);
    } else {
      setMessage(defaultMessage);
    }
    setLoading(false);
  }

  async function saveMessage() {
    setSaving(true);
    const { data: existing } = await supabase.from('app_settings').select('id').limit(1).single();
    if (existing) {
      await supabase.from('app_settings').update({ poster_share_message: message }).eq('id', existing.id);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function resetToDefault() {
    setMessage(defaultMessage);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Pesan Share Poster</h1>
        <p className="text-slate-500 text-sm mt-1">Kustomisasi teks yang dikirim bersamaan saat pendengar share poster dakwah</p>
      </div>

      {/* Info */}
      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
        <div className="flex items-start gap-3">
          <Sparkles size={18} className="text-blue-500 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-blue-700">Cara Kerja</p>
            <p className="text-xs text-blue-500 mt-1">
              Teks ini akan dikirim sebagai caption/pesan bersama gambar poster saat pendengar menekan tombol bagikan di preview poster.
              Gambar poster akan dikirim sebagai file gambar (bukan link) ke WhatsApp, Instagram, dan media sosial lainnya.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Editor */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon size={18} className="text-primary" />
            <h2 className="font-bold text-slate-700">Pesan Share Poster</h2>
          </div>
          {loading ? (
            <div className="text-center py-10 text-slate-400">Memuat...</div>
          ) : (
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={12}
              placeholder="Tulis pesan yang akan dikirim bersama poster..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
            />
          )}
          <div className="flex gap-3 mt-4">
            <button onClick={saveMessage} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-all">
              <Save size={16} />
              {saving ? 'Menyimpan...' : saved ? '✓ Tersimpan!' : 'Simpan Pesan'}
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
            <Eye size={18} className="text-green-600" />
            <h2 className="font-bold text-slate-700">Preview Share</h2>
          </div>
          
          {/* Mock phone preview */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            {/* Mock image */}
            <div className="w-full h-40 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mb-3">
              <div className="text-center">
                <ImageIcon size={32} className="text-purple-400 mx-auto mb-1" />
                <p className="text-xs text-purple-400">Gambar poster terlampir</p>
              </div>
            </div>
            
            {/* Message preview */}
            <div className="bg-white rounded-xl p-3 border border-slate-200">
              <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans leading-relaxed">
                {message || '(Kosong — akan dikirim hanya gambar tanpa teks)'}
              </pre>
            </div>
          </div>

          <div className="mt-4 bg-amber-50 rounded-xl p-3 border border-amber-100">
            <p className="text-xs text-amber-700">
              <strong>💡 Tips:</strong> Gunakan emoji agar teks lebih menarik. 
              Poster akan dikirim sebagai gambar (bukan link) sehingga bisa langsung dilihat di WhatsApp/Instagram.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
