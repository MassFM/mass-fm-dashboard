interface DzikirItem {
  arabic?: string;
  latin?: string;
  transliteration?: string;
  translation?: string;
  title?: string;
  notes?: string;
  note?: string;
  fawaid?: string;
  benefit?: string;
  reference?: string;
  source?: string;
  repeat?: number;
  repetition?: number;
}

// Data seed awal - teks Arab dapat diedit melalui halaman admin
export const DZIKIR_PAGI: DzikirItem[] = [
  {
    "title": "Ta'awudz",
    "arabic": "\u0623\u0639\u0648\u0630\u064F \u0628\u0627\u0644\u0644\u0651\u064e\u0647\u0650 \u0645\u0650\u0646\u0614 \u0627\u0644\u0634\u064e\u064a\u0652\u0637\u064e\u0627\u0646\u0650 \u0627\u0644\u0631\u064e\u0651\u062c\u0650\u064a\u0645\u0650",
    "latin": "A'udzu billahi minasy-syaithanir rajiim",
    "translation": "Aku berlindung kepada Allah dari godaan syetan yang terkutuk.",
    "notes": "Membaca Ta'awudz",
    "fawaid": "Perlindungan dari godaan syetan.",
    "source": "Al-Qur'an",
    "repeat": 1
  },
  {
    "title": "Ayat Kursi",
    "arabic": "\u0627\u0644\u0644\u0651\u064e\u0647\u064f \u0644\u064e\u0627 \u0625\u0650\u0644\u064e\u0670\u0647\u064e \u0625\u0650\u0644\u0651\u064e\u0627 \u0647\u064f\u0648\u064e \u0627\u0644\u0652\u062d\u064e\u064a\u064f\u0651 \u0627\u0644\u0652\u0642\u064e\u064a\u064f\u0651\u0648\u0645\u064f",
    "latin": "Allahu la ilaha illa huwal hayyul qayyum",
    "translation": "Allah, tidak ada ilah melainkan Dia. Yang Maha Hidup lagi terus-menerus mengurus makhluk-Nya.",
    "source": "Al-Qur'an (QS. Al-Baqarah: 255)",
    "repeat": 1
  }
];

export const DZIKIR_PETANG: DzikirItem[] = [
  {
    "title": "Ta'awudz",
    "arabic": "\u0623\u0639\u0648\u0630\u064F \u0628\u0627\u0644\u0644\u0651\u064e\u0647\u0650 \u0645\u0650\u0646\u0614 \u0627\u0644\u0634\u064e\u064a\u0652\u0637\u064e\u0627\u0646\u0650 \u0627\u0644\u0631\u064e\u0651\u062c\u0650\u064a\u0645\u0650",
    "latin": "A'udzu billahi minasy-syaithanir rajiim",
    "translation": "Aku berlindung kepada Allah dari godaan syetan yang terkutuk.",
    "notes": "Membaca Ta'awudz",
    "fawaid": "Perlindungan dari godaan syetan.",
    "source": "Al-Qur'an",
    "repeat": 1
  },
  {
    "title": "Ayat Kursi",
    "arabic": "\u0627\u0644\u0644\u0651\u064e\u0647\u064f \u0644\u064e\u0627 \u0625\u0650\u0644\u064e\u0670\u0647\u064e \u0625\u0650\u0644\u0651\u064e\u0627 \u0647\u064f\u0648\u064e \u0627\u0644\u0652\u062d\u064e\u064a\u064f\u0651 \u0627\u0644\u0652\u0642\u064e\u064a\u064f\u0651\u0648\u0645\u064f",
    "latin": "Allahu la ilaha illa huwal hayyul qayyum",
    "translation": "Allah, tidak ada ilah melainkan Dia. Yang Maha Hidup lagi terus-menerus mengurus makhluk-Nya.",
    "source": "Al-Qur'an (QS. Al-Baqarah: 255)",
    "repeat": 1
  }
];

export const SEED_MAP: Record<string, DzikirItem[]> = {
  'pagi': DZIKIR_PAGI,
  'petang': DZIKIR_PETANG,
};