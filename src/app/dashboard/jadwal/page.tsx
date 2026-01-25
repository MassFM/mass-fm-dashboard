'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Kajian } from '@/types/database';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf'; // Library PDF
import autoTable from 'jspdf-autotable'; // Library Tabel PDF

export default function KelolaJadwal() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<Kajian[]>([]);
  const [loading, setLoading] = useState(true);
  const [isJingleMode, setIsJingleMode] = useState(false);

  // --- STATE NAVIGASI HARI ---
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // State Form & Edit Mode
  const [editingId, setEditingId] = useState<string | null>(null);
  const [judul, setJudul] = useState('');
  const [program, setProgram] = useState('');
  const [pemateri, setPemateri] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [jamMulai, setJamMulai] = useState('08:00');
  const [jamSelesai, setJamSelesai] = useState('09:00');

  // --- STATE TANGGAL KHUSUS IMPOR ---
  const [importDate, setImportDate] = useState(''); 

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push('/login');
    };
    checkUser();
    fetchSettings();
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [selectedDate]);

  const fetchSchedules = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('schedules')
      .select('*')
      .eq('date', selectedDate)
      .order('jam', { ascending: true });
    if (data) setSchedules(data);
    setLoading(false);
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from('app_settings').select('*').single();
    if (data) setIsJingleMode(data.is_jingle_mode);
  };

  // --- FUNGSI EXPORT PDF ---
  const exportToPDF = () => {
    if (schedules.length === 0) {
      alert("Tidak ada jadwal untuk diekspor pada tanggal ini.");
      return;
    }

    const doc = new jsPDF();
    
    // Header PDF
    doc.setFontSize(18);
    doc.setTextColor(130, 42, 110); // Warna Ungu Mass FM
    doc.text("RADIO MASS FM 88.0 MHz SRAGEN", 14, 15);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Jadwal Siaran Tanggal: ${selectedDate}`, 14, 22);
    doc.line(14, 25, 196, 25); // Garis pembatas

    // Generate Tabel Otomatis
    autoTable(doc, {
      startY: 30,
      head: [['JAM', 'PROGRAM', 'JUDUL KAJIAN', 'PEMATERI']],
      body: schedules.map(s => [
        s.jam, 
        s.program.toUpperCase(), 
        s.judul, 
        s.pemateri
      ]),
      headStyles: { 
        fillColor: [130, 42, 110], 
        textColor: [255, 255, 255], 
        fontStyle: 'bold' 
      },
      styles: { fontSize: 9, cellPadding: 5 },
      columnStyles: { 
        0: { cellWidth: 35, fontStyle: 'bold' } 
      }
    });

    // Simpan File
    doc.save(`Jadwal_MassFM_${selectedDate}.pdf`);
  };

  const toggleJingleMode = async (status: boolean) => {
    // 1. Ambil data settings terlebih dahulu untuk mendapatkan ID-nya
    const { data: settings } = await supabase.from('app_settings').select('id').single();
  
    if (settings) {
      // 2. Jalankan update berdasarkan ID yang ditemukan
      const { error } = await supabase
        .from('app_settings')
        .update({ is_jingle_mode: status, updated_at: new Date() })
        .eq('id', settings.id); // Otomatis menggunakan ID yang ada di database
  
      if (!error) {
        setIsJingleMode(status);
        alert(status ? "Mode Jingle Aktif" : "Mode Live Aktif");
      } else {
        console.error("Gagal update mode:", error.message);
        alert("Gagal mengubah mode: " + error.message);
      }
    } else {
      alert("Data settings belum ada di database. Silakan buat satu baris di tabel app_settings.");
    }
  };

  const handleEdit = (item: Kajian) => {
    setEditingId(item.id);
    setJudul(item.judul);
    setProgram(item.program);
    setPemateri(item.pemateri);
    setFormDate(item.date || new Date().toISOString().split('T')[0]);
    
    const splitJam = item.jam.split(' - ');
    if (splitJam.length === 2) {
      setJamMulai(splitJam[0]);
      setJamSelesai(splitJam[1]);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setJudul(''); setProgram(''); setPemateri('');
    setJamMulai('08:00'); setJamSelesai('09:00');
    setFormDate(new Date().toISOString().split('T')[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullJam = `${jamMulai} - ${jamSelesai}`;
    const payload = { judul, program, pemateri, jam: fullJam, date: formDate };

    let error;
    if (editingId) {
      const { error: err } = await supabase.from('schedules').update(payload).eq('id', editingId);
      error = err;
    } else {
      const { error: err } = await supabase.from('schedules').insert([payload]);
      error = err;
    }

    if (!error) {
      alert("Berhasil disimpan!");
      resetForm();
      fetchSchedules();
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!importDate) {
      alert("Mohon pilih tanggal siaran terlebih dahulu pada kotak impor!");
      e.target.value = ''; 
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws) as any[];
      
      const formattedData = data.map(item => ({
        jam: item.Jam, 
        program: item.Program, 
        judul: item.Judul, 
        pemateri: item.Pemateri,
        is_live: false, 
        date: importDate 
      }));

      const { error } = await supabase.from('schedules').insert(formattedData);
      if (!error) { 
        alert(`Berhasil mengimpor ${formattedData.length} jadwal!`); 
        setImportDate('');
        fetchSchedules(); 
      } else {
        alert("Gagal impor: " + error.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  const deleteSchedule = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus jadwal ini?")) {
      try {
        const { error } = await supabase.from('schedules').delete().eq('id', id);
        if (error) throw error;
        alert("Jadwal berhasil dihapus.");
        fetchSchedules();
      } catch (err) {
        alert("Gagal menghapus jadwal.");
      }
    }
  };

  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      iso: d.toISOString().split('T')[0],
      label: d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' })
    };
  });

  return (
    <div className="p-8 max-w-6xl mx-auto bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-display font-bold text-primary">Dashboard Kontrol Mass FM</h1>
        {editingId && (
          <button onClick={resetForm} className="bg-white text-slate-500 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 hover:bg-slate-50">
            <span className="material-icons-round text-sm">close</span> BATALKAN EDIT
          </button>
        )}
      </div>
      
      {/* 1. KONTROL JINGLE/LIVE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <button onClick={() => toggleJingleMode(true)} className={`p-8 rounded-3xl border-2 transition-all text-left ${isJingleMode ? 'border-orange-500 bg-orange-50 shadow-lg' : 'border-white bg-white shadow-sm'}`}>
          <span className="text-2xl mb-2 block">📻</span>
          <h3 className={`font-bold ${isJingleMode ? 'text-orange-700' : 'text-slate-700'}`}>MODE JINGLE / IKLAN</h3>
          <p className="text-sm text-slate-500">Aplikasi menampilkan "Menunggu program berikutnya".</p>
        </button>
        <button onClick={() => toggleJingleMode(false)} className={`p-8 rounded-3xl border-2 transition-all text-left ${!isJingleMode ? 'border-primary bg-purple-50 shadow-lg' : 'border-white bg-white shadow-sm'}`}>
          <span className="text-2xl mb-2 block">🎙️</span>
          <h3 className={`font-bold ${!isJingleMode ? 'text-primary' : 'text-slate-700'}`}>MODE KAJIAN LIVE</h3>
          <p className="text-sm text-slate-500">Aplikasi menampilkan detail siaran aktif.</p>
        </button>
      </div>

      {/* 2. SLIDER NAVIGASI HARI */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-4 scrollbar-hide">
        {dateOptions.map((date) => (
          <button
            key={date.iso}
            onClick={() => setSelectedDate(date.iso)}
            className={`flex-shrink-0 px-6 py-3 rounded-2xl text-xs font-bold transition-all border ${
              selectedDate === date.iso 
              ? 'bg-primary text-white border-primary shadow-md scale-105' 
              : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
            }`}
          >
            {date.label.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 3. FORM INPUT */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 p-4 border-b border-slate-200">
              <h2 className="font-bold text-slate-700 flex items-center gap-2">
                <span className="material-icons-round text-sm">{editingId ? 'edit_note' : 'add_circle'}</span>
                {editingId ? 'Edit Jadwal' : 'Tambah Jadwal'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal Siaran</label>
                <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="w-full rounded-xl border-slate-200 p-2 text-sm focus:ring-primary" required />
              </div>
              <hr className="border-slate-100" />
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Waktu Siaran</label>
                <div className="flex items-center gap-2">
                  <input type="time" value={jamMulai} onChange={(e) => setJamMulai(e.target.value)} className="w-full rounded-xl border-slate-200 p-2 text-sm" required />
                  <span className="text-slate-300">-</span>
                  <input type="time" value={jamSelesai} onChange={(e) => setJamSelesai(e.target.value)} className="w-full rounded-xl border-slate-200 p-2 text-sm" required />
                </div>
              </div>
              <div className="border-t border-slate-50 pt-4 space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Program</label>
                <input type="text" placeholder="Contoh: Cahaya Sunnah" value={program} onChange={(e) => setProgram(e.target.value)} className="w-full rounded-xl border-slate-200 focus:ring-primary" required />
              </div>
              <div className="border-t border-slate-50 pt-4 space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Judul & Pemateri</label>
                <input type="text" placeholder="Judul kajian" value={judul} onChange={(e) => setJudul(e.target.value)} className="w-full rounded-xl border-slate-200 focus:ring-primary mb-2" required />
                <input type="text" placeholder="Nama Pemateri" value={pemateri} onChange={(e) => setPemateri(e.target.value)} className="w-full rounded-xl border-slate-200 focus:ring-primary" required />
              </div>
              <button type="submit" className={`w-full text-white font-bold py-3 rounded-2xl transition-all shadow-md ${editingId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-primary hover:bg-secondary'}`}>
                {editingId ? 'Update Perubahan' : 'Posting Jadwal'}
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-3xl border-2 border-dashed border-slate-200 text-center shadow-sm">
            <div className="mb-4 text-left">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">1. Pilih Tanggal Impor</label>
              <input type="date" value={importDate} onChange={(e) => setImportDate(e.target.value)} className="w-full rounded-xl border-slate-200 p-2 text-xs focus:ring-primary mb-2" required />
            </div>
            <input type="file" onChange={handleImportExcel} className="hidden" id="excel-import" accept=".xlsx, .xls, .csv" />
            <label htmlFor="excel-import" className={`cursor-pointer flex flex-col items-center gap-2 transition-all ${!importDate ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-70'}`}>
              <span className="material-icons-round text-3xl text-slate-300">cloud_upload</span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{importDate ? `2. Impor Excel (${importDate})` : 'Pilih Tanggal Dulu'}</span>
            </label>
          </div>
        </div>

        {/* 4. DAFTAR JADWAL */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
               <h3 className="font-bold text-slate-700 uppercase text-xs tracking-widest">JADWAL: {selectedDate}</h3>
               {/* TOMBOL EXPORT PDF */}
               <button 
                 onClick={exportToPDF}
                 className="flex items-center gap-2 bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-rose-500 hover:text-white transition-all shadow-sm"
               >
                 <span className="material-icons-round text-sm">picture_as_pdf</span> EXPORT PDF
               </button>
            </div>
            <table className="w-full text-left">
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td className="p-10 text-center text-slate-400 italic">Memuat data...</td></tr>
                ) : schedules.length === 0 ? (
                  <tr><td className="p-10 text-center text-slate-300 italic">Tidak ada jadwal untuk hari ini.</td></tr>
                ) : schedules.map((s) => (
                  <tr key={s.id} className={`hover:bg-slate-50 transition-colors ${editingId === s.id ? 'bg-purple-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap min-w-[140px]">
  <span className="text-[10px] font-bold text-slate-400 block mb-1">JAM</span>
  <span className="text-sm font-black text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg inline-block">
    {s.jam}
  </span>
</td>
                    <td className="px-6 py-4">
                      <p className="text-[10px] font-black text-primary uppercase leading-tight mb-1">{s.program}</p>
                      <p className="text-sm font-bold text-slate-800 leading-tight">{s.judul}</p>
                      <p className="text-xs text-slate-400 font-medium">{s.pemateri}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => handleEdit(s)} className="p-2.5 bg-blue-50 text-blue-500 rounded-2xl hover:bg-blue-500 hover:text-white transition-all shadow-sm" title="Edit">
                          <span className="material-icons-round text-lg">edit_note</span>
                        </button>
                        <button onClick={() => deleteSchedule(s.id)} className="p-2.5 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm" title="Hapus">
                          <span className="material-icons-round text-lg">delete_outline</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}