import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Konfigurasi Static Export: 
     Ini akan mengubah Dashboard Anda menjadi file HTML/CSS statis 
     agar bisa berjalan di server Hawkhost tanpa perlu Node.js runtime.
  */
  output: 'export', 
  
  /* Menonaktifkan optimasi gambar bawaan: 
     Wajib disetel 'unoptimized: true' karena fitur optimasi gambar otomatis 
     Next.js membutuhkan server Node.js yang aktif.
  */
  images: {
    unoptimized: true,
  },

  /* Opsional: Memastikan folder output rapi saat proses 'npm run build'
  */
  distDir: 'out',
};

export default nextConfig;