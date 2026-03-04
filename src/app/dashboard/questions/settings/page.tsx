'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Trash2, Save } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const [expiryDays, setExpiryDays] = useState('30');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('app_question_settings')
      .select('value')
      .eq('key', 'expiry_days')
      .single();
    
    if (data) setExpiryDays(data.value);
  };

  const saveSettings = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('app_question_settings')
      .upsert({ key: 'expiry_days', value: expiryDays });

    if (error) {
      alert('Gagal menyimpan!');
    } else {
      alert('Pengaturan tersimpan. Pertanyaan > ' + expiryDays + ' hari akan otomatis dihapus.');
    }
    setSaving(false);
  };

  return (
    <div className="p-8 w-full max-w-2xl mx-auto">
      {/* Tombol Kembali yang benar */}
      <Link href="/dashboard/questions" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary mb-6 text-sm font-medium transition-colors">
        <ArrowLeft size={16} />
        Kembali ke Daftar
      </Link>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500">
            <Trash2 size={20} />
          </div>
          <h1 className="font-display text-xl font-bold text-slate-900">Pembersihan Otomatis</h1>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Masa Simpan Pertanyaan (Hari)
            </label>
            <div className="flex gap-3">
              <input 
                type="number" 
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm font-medium"
              />
              <div className="bg-slate-50 px-4 py-3 rounded-xl text-slate-500 text-sm font-bold flex items-center">
                Hari
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              *Pertanyaan (baik yang menunggu atau sudah dijawab) yang usianya sudah melewati batas hari ini akan <span className="text-red-500 font-bold">dihapus otomatis secara permanen</span> setiap tengah malam oleh sistem.
            </p>
          </div>

          <button 
            onClick={saveSettings}
            disabled={saving}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {saving ? (
              'Menyimpan...'
            ) : (
              <>
                <Save size={18} />
                Simpan Pengaturan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}