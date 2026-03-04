'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Image as ImageIcon, Heart, LogOut, Radio, MessageSquare, MessageCircleQuestion, Headphones, BarChart3, Bell, MapPin, Settings, MessageSquareDashed, MessageCircle, BookOpen, CalendarClock, AlertTriangle, Share2, MessageSquareText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const menuItems = [
  { name: 'Kelola Jadwal', href: '/dashboard/jadwal', icon: Calendar },
  { name: 'Upload Poster', href: '/dashboard/poster', icon: ImageIcon },
  { name: 'Data Donasi', href: '/dashboard/donasi', icon: Heart },
  { name: 'Kritik & Saran', href: '/dashboard/feedback', icon: MessageSquare },
  { name: 'Tanya Ustadz', href: '/dashboard/questions', icon: MessageCircleQuestion },
  { name: 'Podcast', href: '/dashboard/podcast', icon: Headphones },
  { name: 'Kajian Offline', href: '/dashboard/kajian-offline', icon: MapPin },
  { name: 'Statistik', href: '/dashboard/statistik', icon: BarChart3 },
  { name: 'Notifikasi', href: '/dashboard/notifications', icon: Bell },
  { name: 'Auto Notifikasi', href: '/dashboard/notifications/settings', icon: Settings },
  { name: 'Notif Terjadwal', href: '/dashboard/notifications/scheduled', icon: CalendarClock },
  { name: 'Popup Info', href: '/dashboard/popups', icon: MessageSquareDashed },
  { name: 'Live Chat', href: '/dashboard/chat', icon: MessageCircle },
  { name: 'Doa Harian', href: '/dashboard/doa', icon: BookOpen },
  { name: 'Laporan Gangguan', href: '/dashboard/trouble-reports', icon: AlertTriangle },
  { name: 'Pertanyaan Program', href: '/dashboard/program-questions', icon: MessageSquareText },
  { name: 'Share Settings', href: '/dashboard/share-settings', icon: Share2 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-slate-100 flex flex-col fixed left-0 top-0 h-full z-10">
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
      <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
        {menuItems.map((item) => {
          // Logic agar submenu aktif jika URL diawali href menu tersebut
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
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