'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { DonationAccount } from '@/types/database';
import { Plus, Trash2, CreditCard } from 'lucide-react';

export default function KelolaDonasi() {
  const [accounts, setAccounts] = useState<DonationAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // State Form
  const [bankName, setBankName] = useState('');
  const [accNumber, setAccNumber] = useState('');
  const [accName, setAccName] = useState('');

  const fetchAccounts = async () => {
    setLoading(true);
    const { data } = await supabase.from('donation_accounts').select('*');
    if (data) setAccounts(data);
    setLoading(false);
  };

  useEffect(() => { fetchAccounts(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('donation_accounts').insert([
      { bank_name: bankName, account_number: accNumber, account_name: accName, is_active: true }
    ]);

    if (!error) {
      alert("Rekening berhasil ditambahkan!");
      setBankName(''); setAccNumber(''); setAccName('');
      fetchAccounts();
    }
  };

  const deleteAccount = async (id: number) => {
    if (confirm('Hapus rekening ini?')) {
      await supabase.from('donation_accounts').delete().eq('id', id);
      fetchAccounts();
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-display font-bold text-primary">Kelola Rekening Donasi</h1>

      {/* Form Input Rekening */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input 
            type="text" placeholder="Nama Bank (misal: BSI)" value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="rounded-xl border-slate-200 focus:ring-primary focus:border-primary text-sm" required
          />
          <input 
            type="text" placeholder="Nomor Rekening" value={accNumber}
            onChange={(e) => setAccNumber(e.target.value)}
            className="rounded-xl border-slate-200 focus:ring-primary text-sm" required
          />
          <input 
            type="text" placeholder="Atas Nama" value={accName}
            onChange={(e) => setAccName(e.target.value)}
            className="md:col-span-2 rounded-xl border-slate-200 focus:ring-primary text-sm" required
          />
        </div>
        <button type="submit" className="mt-4 w-full bg-primary text-white font-bold py-3 rounded-xl hover:opacity-90 flex items-center justify-center gap-2">
          <Plus size={18} /> Tambah Rekening
        </button>
      </form>

      {/* List Rekening Aktif */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.map((acc) => (
          <div key={acc.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl text-primary">
                <CreditCard size={24} />
              </div>
              <div>
                <p className="font-bold text-slate-800">{acc.bank_name}</p>
                <p className="text-sm font-mono text-primary font-bold">{acc.account_number}</p>
                <p className="text-xs text-slate-500">a.n {acc.account_name}</p>
              </div>
            </div>
            <button onClick={() => deleteAccount(acc.id!)} className="text-slate-300 hover:text-red-500 transition-colors">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}