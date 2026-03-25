'use client';

import { useEffect } from 'react';

/**
 * Mass FM CSE — Mesin Pencari Islam
 * 
 * Redirect ke /search.html (static) yang memuat Google CSE.
 * Halaman statis lebih reliable untuk WebView Flutter.
 */
export default function SearchPage() {
  useEffect(() => {
    window.location.replace('/search.html');
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-slate-400">Memuat Pencarian Islam...</p>
    </div>
  );
}

