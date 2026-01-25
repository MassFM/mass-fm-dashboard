'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
// Menambahkan MessageSquare untuk ikon feedback
import { Calendar, Image as ImageIcon, Heart, LogOut, Radio, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const menuItems = [
  { name: 'Kelola Jadwal', href: '/dashboard/jadwal', icon: Calendar },
  { name: 'Upload Poster', href: '/dashboard/poster', icon: ImageIcon },
  { name: 'Data Donasi', href: '/dashboard/donasi', icon: Heart },
  // Menambahkan menu Kritik & Saran ke dalam daftar
  { name: 'Kritik & Saran', href: '/dashboard/feedback', icon: MessageSquare },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-slate-100 flex flex-col">
      {/* Logo & Nama Radio */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
          <Radio size={24} />
        </div>
        <div>
          <h1 className="font-display font-bold text-primary text-sm leading-tight">MASS FM</h1>
          <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">88.0 MHZ</p>
        </div>
      </div>

      {/* Menu Navigasi */}
      <nav className="flex-1 px-4 space-y-1 mt-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-primary'
              }`}
            >
              <item.icon size={18} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Tombol Logout */}
      <div className="p-4 border-t border-slate-50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut size={18} />
          Keluar Admin
        </button>
      </div>
    </aside>
  );
}