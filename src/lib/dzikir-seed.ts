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

export const DZIKIR_PAGI: DzikirItem[] = [
  {
    "arabic": "������� ��������� ���� ������������ ����������",
    "latin": "A'?dhu bill?hi minas-syait?nir-raj?m",
    "translation": "Aku berlindung kepada Allah dari godaan syetan yang terkutuk.",
    "notes": "Membaca Ta'awudz",
    "fawaid": "Perlindungan dari godaan syetan.",
    "source": "Al-Qur'an",
    "repeat": 1
  },
  {
    "arabic": "������� ��� ������ ������ ���� �������� ����������� ��� ���������� ������ ����� ������ ���� ��� ��� ������������� ����� ��� ��������� ���� ��� ������� �������� �������� ������ ���������� �������� ��� ������ ����������� ����� ���������� ����� ���������� �������� ���� �������� ������ ����� ����� ������ ����������� �����Meningkatkan keimanan dan ketakwaan.",
    "source": "Al-Qur'an (QS. Al-Baqarah: 255)",
    "repeat": 1
  }
];

export const DZIKIR_PETANG: DzikirItem[] = [
  {
    "arabic": "������� ��������� ���� ������������ ����������",
    "latin": "A'?dhu bill?hi minas-syait?nir-raj?m",
    "translation": "Aku berlindung kepada Allah dari godaan syetan yang terkutuk.",
    "notes": "Membaca Ta'awudz",
    "fawaid": "Perlindungan dari godaan syetan.",
    "source": "Al-Qur'an",
    "repeat": 1
  },
  {
    "arabic": "������� ��� ������ ������ ���� �������� ����������� ��� ���������� ������ ����� ������ ���� ��� ��� ������������� ����� ��� ��������� ���� ��� ������� �������� �������� ������ ���������� �������� ��� ������ ����������� ����� ���������� ����� ���������� �������� ���� �������� ������ ����� ����� ������ ����������� �����Meningkatkan keimanan dan ketakwaan.",
    "source": "Al-Qur'an (QS. Al-Baqarah: 255)",
    "repeat": 1
  }
];

export const SEED_MAP: Record<string, DzikirItem[]> = {
  'pagi': DZIKIR_PAGI,
  'petang': DZIKIR_PETANG,
};
