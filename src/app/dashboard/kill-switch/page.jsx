"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function KillSwitchManager() {
    const [isActive, setIsActive] = useState(true);
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Mengambil data saat komponen dimuat
    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from("app_config")
            .select("is_active, message")
            .eq("id", 1)
            .single();

        if (data) {
            setIsActive(data.is_active);
            setMessage(data.message || "");
        }
        if (error) {
            console.error("Gagal mengambil data:", error.message);
        }
        setIsLoading(false);
    };

    const handleSave = async () => {
        setIsSaving(true);
        const { error } = await supabase
            .from("app_config")
            .update({ is_active: isActive, message: message })
            .eq("id", 1);

        if (error) {
            alert("Gagal memperbarui status: " + error.message);
        } else {
            alert("Pengaturan Masa Aktif berhasil disimpan!");
        }
        setIsSaving(false);
    };

    if (isLoading) {
        return <div className="p-6 text-gray-500">Memuat pengaturan layanan...</div>;
    }

    return (
        <div className="max-w-2xl bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
                Manajemen Masa Aktif Aplikasi
            </h2>
            <p className="text-sm text-gray-500 mb-6">
                Gunakan pengaturan ini untuk menangguhkan atau mengaktifkan kembali aplikasi di HP pendengar.
            </p>

            {/* Toggle Switch untuk is_active */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-6">
                <div>
                    <p className="font-semibold text-gray-700">Status Aplikasi</p>
                    <p className="text-sm text-gray-500">
                        {isActive ? "Aplikasi berjalan normal." : "Aplikasi sedang ditangguhkan!"}
                    </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                    />
                    <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
                </label>
            </div>

            {/* Input Pesan Suspended */}
            <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Pesan Penangguhan (Muncul di layar HP saat mati)
                </label>
                <textarea
                    rows="3"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Contoh: Masa aktif habis, hubungi admin."
                    disabled={isActive} // Meredupkan input jika aplikasi sedang aktif
                />
            </div>

            {/* Tombol Simpan */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`px-6 py-2 rounded-lg text-white font-semibold transition-all ${isSaving ? "bg-gray-400" : "bg-purple-600 hover:bg-purple-700 shadow-md"
                        }`}
                >
                    {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
            </div>
        </div>
    );
}
