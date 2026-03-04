import Sidebar from '@/components/Sidebar';
import { AuthGuard } from '@/lib/auth-guard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background-light">
        {/* Sidebar tetap di kiri */}
        <Sidebar />

        {/* Area Konten Utama - dengan margin kiri untuk sidebar fixed */}
        <main className="flex-1 ml-64 p-8">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}