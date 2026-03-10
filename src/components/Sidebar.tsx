'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Image as ImageIcon, Heart, LogOut, Radio, MessageSquare, MessageCircleQuestion, Headphones, BarChart3, Bell, MapPin, Settings, MessageSquareDashed, MessageCircle, BookOpen, BookOpenCheck, CalendarClock, AlertTriangle, Share2, MessageSquareText, Moon, Menu, Clock, Star, Smartphone, Palette, Play, PartyPopper, FolderOpen, CalendarDays } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ size?: number }>;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    label: 'Konten',
    items: [
      { name: 'Kelola Jadwal', href: '/dashboard/jadwal', icon: Calendar },
      { name: 'Upload Poster', href: '/dashboard/poster', icon: ImageIcon },
      { name: 'Kategori Poster', href: '/dashboard/poster/categories', icon: FolderOpen },
      { name: 'Share Poster', href: '/dashboard/poster/share-settings', icon: Share2 },
      { name: 'Kartu Ucapan', href: '/dashboard/kartu-ucapan', icon: PartyPopper },
      { name: 'Podcast', href: '/dashboard/podcast', icon: Headphones },
      { name: 'Kajian Offline', href: '/dashboard/kajian-offline', icon: MapPin },
      { name: 'Event & Acara', href: '/dashboard/events', icon: CalendarDays },
      { name: 'Ebook Islami', href: '/dashboard/ebooks', icon: BookOpenCheck },
    ],
  },
  {
    label: 'Ibadah',
    items: [
      { name: 'Doa Harian', href: '/dashboard/doa', icon: BookOpen },
      { name: 'Dzikir Harian', href: '/dashboard/dzikir', icon: Moon },
      { name: 'Kalender Islam', href: '/dashboard/islamic-events', icon: Star },
    ],
  },
  {
    label: 'Komunikasi',
    items: [
      { name: 'Live Chat', href: '/dashboard/chat', icon: MessageCircle },
      { name: 'Tanya Ustadz', href: '/dashboard/questions', icon: MessageCircleQuestion },
      { name: 'Pertanyaan Program', href: '/dashboard/program-questions', icon: MessageSquareText },
      { name: 'Kritik & Saran', href: '/dashboard/feedback', icon: MessageSquare },
    ],
  },
  {
    label: 'Notifikasi',
    items: [
      { name: 'Notifikasi', href: '/dashboard/notifications', icon: Bell },
      { name: 'Auto Notifikasi', href: '/dashboard/notifications/settings', icon: Settings },
      { name: 'Notif Terjadwal', href: '/dashboard/notifications/scheduled', icon: CalendarClock },
      { name: 'Popup Info', href: '/dashboard/popups', icon: MessageSquareDashed },
    ],
  },
  {
    label: 'Data & Laporan',
    items: [
      { name: 'Data Donasi', href: '/dashboard/donasi', icon: Heart },
      { name: 'Statistik', href: '/dashboard/statistik', icon: BarChart3 },
      { name: 'Laporan Gangguan', href: '/dashboard/trouble-reports', icon: AlertTriangle },
    ],
  },
  {
    label: 'Tampilan Aplikasi',
    items: [
      { name: 'Splash Screen', href: '/dashboard/splash-settings', icon: Smartphone },
      { name: 'Tema Widget Info', href: '/dashboard/widget-theme', icon: Palette },
      { name: 'Tema Widget Player', href: '/dashboard/player-theme', icon: Play },
    ],
  },
  {
    label: 'Pengaturan',
    items: [
      { name: 'Pengaturan Waktu', href: '/dashboard/time-settings', icon: Clock },
      { name: 'Share Settings', href: '/dashboard/share-settings', icon: Share2 },
      { name: 'Menu Settings', href: '/dashboard/menu-settings', icon: Menu },
    ],
  },
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
      <nav className="flex-1 px-4 mt-4 overflow-y-auto">
        {menuGroups.map((group, gi) => (
          <div key={group.label} className={gi > 0 ? 'mt-5' : ''}>
            <p className="px-4 mb-2 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-primary'
                    }`}
                  >
                    <item.icon size={17} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
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