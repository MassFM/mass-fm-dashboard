// Interface ini harus sama dengan model di Flutter agar sinkron
export interface Kajian {
    id?: number;
    created_at?: string;
    judul: string;
    program: string;
    pemateri: string;
    jam: string;
    is_live: boolean;
  }

export interface DonationAccount {
  id?: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  is_active: boolean;
}