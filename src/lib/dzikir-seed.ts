import type { Database } from '@/lib/database.types';

type DzikirItem = Omit<Database['public']['Tables']['dzikir']['Row'], 'id' | 'created_at' | 'collection'>;

export const DZIKIR_PAGI: DzikirItem[] = [
  {
    "arabic": "√уЏхж–х »ц«ббшуец гцду «б‘шунъЎу«дц «б—шућцнгц",
    "latin": "A'?dhu bill?hi minas-syait?nir-raj?m",
    "translation": "Aku berlindung kepada Allah dari godaan syetan yang terkutuk.",
    "notes": "Membaca Ta'awudz",
    "fawaid": "Perlindungan dari godaan syetan.",
    "source": "Al-Qur'an",
    "repeat": 1
  },
  {
    "arabic": "«ббшуех бу« ≈цбуеу ≈цбшу« ехжу «бъЌуншх «бъёуншхжгх бу«  у√ъќх–хех ”цду…с жубу« дужъгс буех гу« Ёцн «б”шугу«жу« ц жугу« Ёцн «бъ√у—ъ÷ц гудъ –у« «бшу–цн ну‘ъЁуЏх Џцдъѕуех ≈цбшу« »ц≈ц–ъдцец нуЏъбугх гу« »унъду √унъѕцнецгъ жугу« ќубъЁуехгъ жубу« нхЌцнЎхжду »ц‘унъЅт гцдъ Џцбъгцец ≈цбшу« »цгу« ‘у«Ѕу жу”цЏу ях—ъ”цншхех «б”шуMeningkatkan keimanan dan ketakwaan.",
    "source": "Al-Qur'an (QS. Al-Baqarah: 255)",
    "repeat": 1
  }
];

export const DZIKIR_PETANG: DzikirItem[] = [
  {
    "arabic": "√уЏхж–х »ц«ббшуец гцду «б‘шунъЎу«дц «б—шућцнгц",
    "latin": "A'?dhu bill?hi minas-syait?nir-raj?m",
    "translation": "Aku berlindung kepada Allah dari godaan syetan yang terkutuk.",
    "notes": "Membaca Ta'awudz",
    "fawaid": "Perlindungan dari godaan syetan.",
    "source": "Al-Qur'an",
    "repeat": 1
  },
  {
    "arabic": "«ббшуех бу« ≈цбуеу ≈цбшу« ехжу «бъЌуншх «бъёуншхжгх бу«  у√ъќх–хех ”цду…с жубу« дужъгс буех гу« Ёцн «б”шугу«жу« ц жугу« Ёцн «бъ√у—ъ÷ц гудъ –у« «бшу–цн ну‘ъЁуЏх Џцдъѕуех ≈цбшу« »ц≈ц–ъдцец нуЏъбугх гу« »унъду √унъѕцнецгъ жугу« ќубъЁуехгъ жубу« нхЌцнЎхжду »ц‘унъЅт гцдъ Џцбъгцец ≈цбшу« »цгу« ‘у«Ѕу жу”цЏу ях—ъ”цншхех «б”шуMeningkatkan keimanan dan ketakwaan.",
    "source": "Al-Qur'an (QS. Al-Baqarah: 255)",
    "repeat": 1
  }
];

export const SEED_MAP = {
  'pagi': DZIKIR_PAGI,
  'petang': DZIKIR_PETANG,
};
