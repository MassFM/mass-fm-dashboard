'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const [liveProgramId, setLiveProgramId] = useState<number | null>(null);

  // --- STATE NAVIGASI HARI ---
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // State Form & Edit Mode
  const [editingId, setEditingId] = useState<number | null>(null);
  const [judul, setJudul] = useState('');
  const [program, setProgram] = useState('');
  const [pemateri, setPemateri] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [isRelay, setIsRelay] = useState(false);
  const [kitabName, setKitabName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [recordingUrl, setRecordingUrl] = useState('');
  const [resumeHtml, setResumeHtml] = useState('');
  
  const [jamMulai, setJamMulai] = useState('08:00');
  const [jamSelesai, setJamSelesai] = useState('09:00');

  // --- STATE TANGGAL KHUSUS IMPOR ---
  const [importDate, setImportDate] = useState(''); 

  // --- STATE KALENDER ---
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calSchedules, setCalSchedules] = useState<Record<string, Kajian[]>>({});
  const [calPopupDate, setCalPopupDate] = useState<string | null>(null);
  const [calPopupData, setCalPopupData] = useState<Kajian[]>([]);

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
    if (data) {
      setIsJingleMode(data.is_jingle_mode);
      setLiveProgramId(data.live_program_id || null);
    }
  };

  // --- FETCH JADWAL BULAN INI UNTUK KALENDER ---
  const fetchCalendarSchedules = useCallback(async () => {
    const startDate = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(calYear, calMonth + 1, 0).getDate();
    const endDate = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    const { data } = await supabase
      .from('schedules')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('jam', { ascending: true });
    if (data) {
      const grouped: Record<string, Kajian[]> = {};
      data.forEach((s: Kajian) => {
        const d = s.date || '';
        if (!grouped[d]) grouped[d] = [];
        grouped[d].push(s);
      });
      setCalSchedules(grouped);
    }
  }, [calMonth, calYear]);

  useEffect(() => {
    if (viewMode === 'calendar') fetchCalendarSchedules();
  }, [viewMode, calMonth, calYear, fetchCalendarSchedules]);

  const openCalPopup = (dateStr: string) => {
    setCalPopupDate(dateStr);
    setCalPopupData(calSchedules[dateStr] || []);
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
    const { data: settings } = await supabase.from('app_settings').select('id').single();
  
    if (settings) {
      const { error } = await supabase
        .from('app_settings')
        .update({ is_jingle_mode: status, live_program_id: null, updated_at: new Date() })
        .eq('id', settings.id);
  
      if (!error) {
        setIsJingleMode(status);
        setLiveProgramId(null);
        alert(status ? "Mode Jingle Aktif" : "Mode Live Aktif");
      } else {
        console.error("Gagal update mode:", error.message);
        alert("Gagal mengubah mode: " + error.message);
      }
    } else {
      alert("Data settings belum ada di database. Silakan buat satu baris di tabel app_settings.");
    }
  };

  const lockLiveProgram = async (programId: number | null) => {
    const { data: settings } = await supabase.from('app_settings').select('id').single();
    if (settings) {
      const { error } = await supabase
        .from('app_settings')
        .update({ live_program_id: programId, is_jingle_mode: false, updated_at: new Date() })
        .eq('id', settings.id);
      if (!error) {
        setLiveProgramId(programId);
        setIsJingleMode(false);
        alert(programId ? 'Program dikunci sebagai LIVE!' : 'Lock program dilepas, kembali ke mode otomatis.');
      }
    }
  };

  const handleEdit = (item: Kajian) => {
    setEditingId(item.id ?? null);
    setJudul(item.judul);
    setProgram(item.program);
    setPemateri(item.pemateri);
    setFormDate(item.date || new Date().toISOString().split('T')[0]);
    setDescription((item as any).description || '');
    setIsRelay((item as any).is_relay || false);
    setKitabName((item as any).kitab_name || '');
    setFileUrl((item as any).file_url || '');
    setYoutubeUrl((item as any).youtube_url || '');
    setRecordingUrl((item as any).recording_url || '');
    setResumeHtml((item as any).resume_html || '');
    
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
    setDescription(''); setIsRelay(false); setKitabName(''); setFileUrl('');
    setYoutubeUrl(''); setRecordingUrl('');
    setResumeHtml('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullJam = `${jamMulai} - ${jamSelesai}`;
    const payload = {
      judul, program, pemateri, jam: fullJam, date: formDate,
      description: description.trim(),
      is_relay: isRelay,
      kitab_name: kitabName.trim(),
      file_url: fileUrl.trim(),
      youtube_url: youtubeUrl.trim() || null,
      recording_url: recordingUrl.trim() || null,
      resume_html: resumeHtml.trim() || null,
    };

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

  const deleteSchedule = async (id: number | undefined) => {
    if (id === undefined) return;
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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

      {/* LOCK PROGRAM LIVE */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">🔒</div>
            <div>
              <h3 className="text-sm font-bold text-slate-700">Kunci Program LIVE</h3>
              <p className="text-[11px] text-slate-400">Paksa program tertentu tetap LIVE meskipun jadwal sudah lewat (±10 menit)</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={liveProgramId || ''}
              onChange={(e) => lockLiveProgram(e.target.value ? Number(e.target.value) : null)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-200 outline-none min-w-[200px]"
            >
              <option value="">Otomatis (sesuai jadwal)</option>
              {schedules.map((s) => (
                <option key={s.id} value={s.id}>{s.jam} — {s.program}</option>
              ))}
            </select>
            {liveProgramId && (
              <button onClick={() => lockLiveProgram(null)} className="px-3 py-2 bg-red-50 text-red-500 rounded-xl text-xs font-bold hover:bg-red-100">
                Lepas Lock
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. VIEW MODE TOGGLE */}
      <div className="flex items-center gap-4 mb-4">
        <button onClick={() => setViewMode('list')} className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-primary text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100'}`}>
          📋 Daftar Harian
        </button>
        <button onClick={() => setViewMode('calendar')} className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${viewMode === 'calendar' ? 'bg-primary text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100'}`}>
          📅 Kalender Bulanan
        </button>
      </div>

      {viewMode === 'calendar' ? (
        <>
          {/* CALENDAR VIEW */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-8">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/30">
              <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else setCalMonth(calMonth - 1); }}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 font-bold text-lg">&larr;</button>
              <h3 className="font-bold text-slate-700 uppercase text-sm tracking-widest">
                {new Date(calYear, calMonth).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </h3>
              <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else setCalMonth(calMonth + 1); }}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 font-bold text-lg">&rarr;</button>
            </div>
            <div className="p-4">
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(d => (
                  <div key={d} className="text-center text-[10px] font-bold text-slate-400 py-2">{d}</div>
                ))}
              </div>
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {(() => {
                  const firstDay = new Date(calYear, calMonth, 1).getDay();
                  const adjust = firstDay === 0 ? 6 : firstDay - 1; // Monday start
                  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
                  const cells = [];
                  for (let i = 0; i < adjust; i++) cells.push(<div key={`e${i}`} />);
                  for (let day = 1; day <= daysInMonth; day++) {
                    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const count = (calSchedules[dateStr] || []).length;
                    const isToday = dateStr === new Date().toISOString().split('T')[0];
                    cells.push(
                      <button key={day} onClick={() => openCalPopup(dateStr)}
                        className={`relative p-2 rounded-xl text-center transition-all hover:bg-purple-50 min-h-[70px] flex flex-col items-center ${isToday ? 'ring-2 ring-primary bg-purple-50' : 'bg-slate-50/50'}`}>
                        <span className={`text-sm font-bold ${isToday ? 'text-primary' : 'text-slate-600'}`}>{day}</span>
                        {count > 0 && (
                          <div className="mt-1">
                            <span className="inline-block px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-bold rounded-full">{count} kajian</span>
                          </div>
                        )}
                      </button>
                    );
                  }
                  return cells;
                })()}
              </div>
            </div>
          </div>

          {/* CALENDAR POPUP MODAL */}
          {calPopupDate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setCalPopupDate(null)}>
              <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6 mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-slate-700">📅 {new Date(calPopupDate + 'T00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h2>
                  <button onClick={() => setCalPopupDate(null)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400">&times;</button>
                </div>
                {calPopupData.length === 0 ? (
                  <p className="text-slate-300 italic text-center py-10">Tidak ada jadwal</p>
                ) : (
                  <div className="space-y-3">
                    {calPopupData.map((s) => (
                      <div key={s.id} className="bg-slate-50 rounded-xl p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded">{s.jam}</span>
                            <p className="text-[10px] font-bold text-primary uppercase mt-1">{s.program}</p>
                            <p className="text-sm font-bold text-slate-700">{s.judul}</p>
                            <p className="text-xs text-slate-400">{s.pemateri}</p>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button onClick={() => { setCalPopupDate(null); handleEdit(s); setViewMode('list'); setSelectedDate(calPopupDate); }}
                              className="p-2 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition" title="Edit">
                              <span className="material-icons-round text-sm">edit_note</span>
                            </button>
                            <button onClick={async () => { await deleteSchedule(s.id); fetchCalendarSchedules(); setCalPopupData(prev => prev.filter(x => x.id !== s.id)); }}
                              className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition" title="Hapus">
                              <span className="material-icons-round text-sm">delete_outline</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                  <button onClick={() => { setCalPopupDate(null); setViewMode('list'); setSelectedDate(calPopupDate); }}
                    className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:opacity-90">
                    Buka Daftar Hari Ini
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
      <>
      {/* SLIDER NAVIGASI HARI */}
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
              <div className="border-t border-slate-50 pt-4 space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Detail Tambahan</label>
                <input type="text" placeholder="Nama Kitab (opsional)" value={kitabName} onChange={(e) => setKitabName(e.target.value)} className="w-full rounded-xl border-slate-200 focus:ring-primary mb-2" />
                <textarea placeholder="Deskripsi / keterangan (opsional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full rounded-xl border-slate-200 focus:ring-primary mb-2 resize-none" />
                <input type="url" placeholder="URL File/Materi (opsional)" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} className="w-full rounded-xl border-slate-200 focus:ring-primary mb-2" />
              </div>
              <div className="border-t border-slate-50 pt-4 space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sumber Kajian</label>
                <input type="url" placeholder="Link YouTube (opsional)" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} className="w-full rounded-xl border-slate-200 focus:ring-primary mb-2" />
                {youtubeUrl && (() => {
                  const match = youtubeUrl.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);
                  const videoId = match ? match[1] : null;
                  return videoId ? (
                    <div className="mb-2 rounded-xl overflow-hidden border border-slate-200">
                      <img src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} alt="YouTube thumbnail" className="w-full h-auto" />
                    </div>
                  ) : null;
                })()}
                <input type="url" placeholder="Link Rekaman MP3 (opsional)" value={recordingUrl} onChange={(e) => setRecordingUrl(e.target.value)} className="w-full rounded-xl border-slate-200 focus:ring-primary mb-2" />
              </div>
              {editingId && (
              <div className="border-t border-slate-50 pt-4 space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resume / Transkrip Kajian</label>
                <p className="text-[9px] text-slate-400 -mt-1">Tulis ringkasan materi di halaman editor khusus yang lebih leluasa</p>
                <button
                  type="button"
                  onClick={() => router.push(`/dashboard/jadwal/resume?id=${editingId}`)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-icons-round text-purple-400 group-hover:text-purple-600 transition-colors">article</span>
                    <div className="text-left">
                      <span className="text-xs font-bold text-purple-600">Buka Editor Resume</span>
                      <p className="text-[9px] text-slate-400 mt-0.5">{resumeHtml ? `~${resumeHtml.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length} kata tersimpan` : 'Belum ada resume'}</p>
                    </div>
                  </div>
                  <span className="material-icons-round text-purple-300 group-hover:text-purple-500 transition-colors">open_in_new</span>
                </button>
              </div>
              )}
              <div className="border-t border-slate-50 pt-4 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isRelay} onChange={(e) => setIsRelay(e.target.checked)} className="w-4 h-4 text-purple-600 rounded" />
                  <span className="text-xs text-slate-600 font-medium">Relay dari kajian offline</span>
                </label>
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
                      <p className="text-[10px] font-black text-primary uppercase leading-tight mb-1">
                        {s.program}
                        {(s as any).is_relay && <span className="ml-2 px-1.5 py-0.5 bg-orange-100 text-orange-600 text-[8px] rounded font-bold">RELAY</span>}
                      </p>
                      <p className="text-sm font-bold text-slate-800 leading-tight">{s.judul}</p>
                      <p className="text-xs text-slate-400 font-medium">{s.pemateri}</p>
                      {(s as any).kitab_name && <p className="text-[10px] text-purple-400 mt-0.5">📖 {(s as any).kitab_name}</p>}
                      <div className="flex gap-1 mt-1">
                        {(s as any).youtube_url && <span className="px-1.5 py-0.5 bg-red-50 text-red-500 text-[8px] rounded font-bold">▶ YouTube</span>}
                        {(s as any).recording_url && <span className="px-1.5 py-0.5 bg-green-50 text-green-600 text-[8px] rounded font-bold">🎙 Rekaman</span>}
                        {(s as any).resume_html && <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 text-[8px] rounded font-bold">📝 Resume</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => handleEdit(s)} className="p-2.5 bg-blue-50 text-blue-500 rounded-2xl hover:bg-blue-500 hover:text-white transition-all shadow-sm" title="Edit">
                          <span className="material-icons-round text-lg">edit_note</span>
                        </button>
                        <button onClick={() => router.push(`/dashboard/jadwal/resume?id=${s.id}`)} className="p-2.5 bg-purple-50 text-purple-500 rounded-2xl hover:bg-purple-500 hover:text-white transition-all shadow-sm" title="Resume">
                          <span className="material-icons-round text-lg">article</span>
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
      </>
      )}
    </div>
  );
}