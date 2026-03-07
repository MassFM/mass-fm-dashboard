/**
 * Seed script untuk memasukkan data doa harian & doa pilihan ke Supabase.
 * 
 * Cara pakai:
 *   1. Pastikan sudah `npm install @supabase/supabase-js` di dashboard
 *   2. Jalankan: node seed-doas.mjs --email admin@email.com --password xxx
 *      atau: node seed-doas.mjs  (akan diminta input)
 * 
 * Flags:
 *   --update-fawaid  → hanya update fawaid/notes pada data yang sudah ada
 *   --email EMAIL    → admin email
 *   --password PASS  → admin password
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = 'https://mnjthnylygqxxgymakse.supabase.co';
const SUPABASE_KEY = 'sb_publishable_loRUOJSACblsNlMLt-1qiA_jqvtZczm';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper untuk membaca input dari terminal
function askInput(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) => rl.question(question, (ans) => { rl.close(); res(ans); }));
}

// Parse CLI args
function getArg(name) {
  const idx = process.argv.indexOf(name);
  return idx >= 0 && process.argv[idx + 1] ? process.argv[idx + 1] : null;
}

// Path ke file JSON di Flutter project
const FLUTTER_ASSETS = resolve(__dirname, '..', '..', 'mass_fm_app', 'assets', 'data');

// ── Kategori mapping berdasarkan judul doa ──────────────────────────

function assignCategory(title) {
  const t = title.toLowerCase();

  // Tidur
  if (t.includes('tidur')) return 'Tidur';

  // Makan & Minum
  if (t.includes('makan') || t.includes('basmallah')) return 'Makan & Minum';

  // Sholat & Ibadah
  if (t.includes('masjid') || t.includes('berwudhu') || t.includes('wudhu') || 
      t.includes('adzan') || t.includes('puasa') || t.includes('buka puasa'))
    return 'Sholat';

  // Bersuci
  if (t.includes('kamar mandi')) return 'Sholat';

  // Bepergian
  if (t.includes('safar') || t.includes('kendaraan') || t.includes('mukim') || 
      t.includes('bekal takwa') || t.includes('keluar rumah') || t.includes('keburukan'))
    return 'Bepergian';

  // Pagi & Sore (istighfar biasa dibaca pagi/sore)
  if (t.includes('sayyid al-istighfar')) return 'Pagi & Sore';

  // Harian (default untuk sisanya)
  return 'Harian';
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  console.log('🕌 Seed Doa Harian & Doa Pilihan ke Supabase\n');

  // 0. Authenticate as admin
  console.log('🔐 Login admin...');
  let email = getArg('--email');
  let password = getArg('--password');
  if (!email) email = await askInput('   Email admin: ');
  if (!password) password = await askInput('   Password: ');

  const { error: authErr } = await supabase.auth.signInWithPassword({ email, password });
  if (authErr) {
    console.error('   ❌ Login gagal:', authErr.message);
    console.log('   Pastikan email dan password admin dashboard benar.');
    process.exit(1);
  }
  console.log('   ✅ Berhasil login\n');

  // 1. Read JSON files
  console.log('1️⃣  Membaca file JSON...');
  
  let doaHarian, doaPilihan;
  try {
    doaHarian = JSON.parse(readFileSync(resolve(FLUTTER_ASSETS, 'doa_harian.json'), 'utf8'));
    console.log(`   📖 doa_harian.json: ${doaHarian.length} doa`);
  } catch (e) {
    console.error('   ❌ Gagal baca doa_harian.json:', e.message);
    return;
  }

  try {
    doaPilihan = JSON.parse(readFileSync(resolve(FLUTTER_ASSETS, 'doa_pilihan.json'), 'utf8'));
    console.log(`   📖 doa_pilihan.json: ${doaPilihan.length} doa`);
  } catch (e) {
    console.error('   ❌ Gagal baca doa_pilihan.json:', e.message);
    return;
  }

  // 3. Check if fawaid/notes columns exist by doing a test query
  console.log('\n3️⃣  Mengecek kolom tabel...');
  let hasFawaidCol = false;
  {
    const { error: testErr } = await supabase.from('daily_doas').select('fawaid').limit(1);
    if (!testErr) {
      hasFawaidCol = true;
      console.log('   ✅ Kolom fawaid & notes sudah ada');
    } else {
      console.log('   ⚠️  Kolom fawaid/notes belum ada — insert tanpa kolom tersebut dulu');
      console.log('   💡 Setelah selesai, tambahkan kolom via Supabase SQL Editor:');
      console.log('      ALTER TABLE daily_doas ADD COLUMN IF NOT EXISTS fawaid TEXT;');
      console.log('      ALTER TABLE daily_doas ADD COLUMN IF NOT EXISTS notes TEXT;');
      console.log('      Lalu jalankan: node seed-doas.mjs --update-fawaid');
    }
  }

  // 4. Prepare records
  console.log('\n4️⃣  Mempersiapkan data...');

  // Mode: --update-fawaid → hanya update fawaid/notes pada data yang sudah ada
  const updateOnly = process.argv.includes('--update-fawaid');

  if (updateOnly) {
    console.log('   🔄 Mode: Update fawaid & notes pada data yang sudah ada\n');
    const allDoas = [
      ...doaHarian.map(d => ({ ...d, _category: assignCategory(d.title) })),
      ...doaPilihan.map(d => ({ ...d, _category: 'Doa Pilihan' })),
    ];
    let updated = 0;
    for (const d of allDoas) {
      if (!d.fawaid && !d.notes) continue;
      const { error } = await supabase.from('daily_doas')
        .update({ fawaid: d.fawaid || null, notes: d.notes || null })
        .eq('title', d.title);
      if (!error) updated++;
      else console.log(`   ⚠️  Gagal update "${d.title}": ${error.message}`);
    }
    console.log(`   ✅ ${updated} doa berhasil di-update fawaid/notes`);
    console.log('\n🎉 Selesai!');
    return;
  }

  const makeRecord = (d, category) => {
    const rec = {
      title: d.title,
      arabic: d.arabic || '',
      latin: d.latin || '',
      translation: d.translation || '',
      source: d.source || '',
      category,
      is_active: true,
    };
    if (hasFawaidCol) {
      rec.fawaid = d.fawaid || null;
      rec.notes = d.notes || null;
    }
    return rec;
  };

  const harianRecords = doaHarian.map((d) => makeRecord(d, assignCategory(d.title)));
  const pilihanRecords = doaPilihan.map((d) => makeRecord(d, 'Doa Pilihan'));

  // Show category breakdown
  const catCount = {};
  [...harianRecords, ...pilihanRecords].forEach(r => {
    catCount[r.category] = (catCount[r.category] || 0) + 1;
  });
  console.log('   📊 Kategori breakdown:');
  Object.entries(catCount).sort().forEach(([cat, count]) => {
    console.log(`      ${cat}: ${count} doa`);
  });

  // 5. Insert doa harian
  console.log(`\n5️⃣  Insert ${harianRecords.length} doa harian...`);
  const { data: d1, error: e1 } = await supabase.from('daily_doas').insert(harianRecords).select();
  if (e1) {
    console.error('   ❌ Error:', e1.message);
    return;
  } else {
    console.log(`   ✅ ${d1?.length || harianRecords.length} doa harian berhasil diinsert`);
  }

  // 6. Insert doa pilihan
  console.log(`\n6️⃣  Insert ${pilihanRecords.length} doa pilihan...`);
  const { data: d2, error: e2 } = await supabase.from('daily_doas').insert(pilihanRecords).select();
  if (e2) {
    console.error('   ❌ Error:', e2.message);
  } else {
    console.log(`   ✅ ${d2?.length || pilihanRecords.length} doa pilihan berhasil diinsert`);
  }

  console.log('\n🎉 Selesai! Data doa sudah masuk ke database.');
  console.log('   Buka dashboard → Doa Harian untuk melihat hasilnya.');
  if (!hasFawaidCol) {
    console.log('\n   📝 Jangan lupa tambahkan kolom fawaid & notes, lalu jalankan:');
    console.log('      node seed-doas.mjs --update-fawaid');
  }
}

main().catch(console.error);
