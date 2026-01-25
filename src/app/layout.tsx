import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const montserrat = Montserrat({ 
  subsets: ["latin"], 
  weight: ["700", "800"], 
  variable: "--font-montserrat" 
});

export const metadata: Metadata = {
  title: "Admin Dashboard - Radio Mass FM",
  description: "Saluran Islami Menggapai Ridho Ilahi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${inter.variable} ${montserrat.variable} font-sans bg-slate-50 text-slate-900`}>
        {children}
        <head>
        {/* Tambahkan link ini agar ikon muncul */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" />
      </head>
      </body>
    </html>
  );
}