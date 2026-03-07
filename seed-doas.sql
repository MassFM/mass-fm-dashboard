-- ============================================================
-- SEED DOA HARIAN & DOA PILIHAN
-- Jalankan di Supabase SQL Editor (https://supabase.com/dashboard)
-- ============================================================

-- 1. Tambahkan kolom fawaid & notes jika belum ada
ALTER TABLE daily_doas ADD COLUMN IF NOT EXISTS fawaid TEXT;
ALTER TABLE daily_doas ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Insert 38 Doa Harian
INSERT INTO daily_doas (title, arabic, latin, translation, source, fawaid, notes, category, is_active) VALUES

-- === KATEGORI: Tidur ===
('Doa Sebelum Tidur',
 'بِاسْمِكَ اللَّهُمَّ أَمُوْتُ وَأَحْيَا',
 'Bismika Allāhumma amūtu wa aḥyā',
 'Dengan menyebut nama-Mu, ya Allah! Aku mati dan dan hidup.',
 'HR. al-Bukhari',
 'Dahulu nabi shallallahu ''alaihi wa sallam senantiasa memulai dan mengakhiri harinya dengan berdzikir.',
 NULL, 'Tidur', true),

('Doa Bangun Tidur',
 'الحَمْدُ للهِ الَّذِي أَحْيَانَا بعْدَ مَا أماتَنَا وإِلَيْهِ النُّشُورُ',
 'Alhamdulillāhillażī aḥyānā ba''da mā amātanā wa ilaihin nusyūr',
 'Segala puji bagi Allah, yang telah membangunkan kami setelah menidurkan kami dan kepada-Nya lah kami dibangkitkan.',
 'HR. Bukhari: 6327',
 'Dengan membaca doa di atas, seorang hamba memulai harinya dengan memuji nama Allah yang Maha Menghidupkan dan Maha Mematikan.',
 NULL, 'Tidur', true),

-- === KATEGORI: Sholat ===
('Doa Masuk Kamar Mandi',
 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ',
 'Allāhumma innī a''ūżu bika minal khubutsi wal khabāits',
 'Ya Allah, aku berlindung pada-Mu dari (godaan) syaitan laki-laki dan perempuan.',
 'HR. al-Bukhari dan Muslim',
 'Doa ini menjadi penghalang antara aurat seorang hamba dengan jin ketika memasuki Al-khala'' (kamar mandi).',
 NULL, 'Sholat', true),

('Doa Keluar Kamar Mandi',
 'غُفْرَانَكَ',
 'Ghufrānaka',
 'Aku mohon ampunan-Mu (ya Allah).',
 'HR. at-Tirmidzi',
 'Kamar mandi adalah salah satu rumah jin dan syaitan, maka dianjurkan meminta ampunan dari segala kesalahan yang sengaja maupun tidak sengaja selama di kamar mandi.',
 NULL, 'Sholat', true),

-- === KATEGORI: Makan & Minum ===
('Doa Sebelum Makan',
 'بِسْمِ اللَّهِ',
 'Bismillāh',
 'Dengan nama Allah (aku mulai makan).',
 'HR. al-Bukari No. 5376 dan Muslim No. 2022',
 'Manfaat membaca bismillah sebelum makan adalah untuk menghalangi syaitan ikut bergabung makan bersama manusia.',
 NULL, 'Makan & Minum', true),

('Doa Jika Terlupa Basmallah Diawal Makan',
 'بِسْمِ اللَّهِ أَوَّلَهُ وَآخِرَهُ',
 'Bismillāhi awwalahu wa ākhirahu',
 'Dengan menyebut nama Allah, untuk awal dan akhir (makan).',
 'HR. Abu Dawud',
 'Islam sangat memperhatikan adab, sekiranya anak adam lupa membaca doa makan di awal tetap dianjurkan membaca doa di pertengahan walaupun tersisa sesendok nasi.',
 NULL, 'Makan & Minum', true),

('Doa Sesudah Makan',
 'الْحَمْدُ لِلَّهِ الَّذِى أَطْعَمَنِى هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّى وَلاَ قُوَّةٍ',
 'Alhamdulillāhillażī aṭ''amanī hāżā wa razaqanīhi min ghayri ḥawlin minnī wa lā quwwatin',
 'Segala puji bagi Allah yang telah memberiku makanan ini, dan memberikan rezeki kepadaku tanpa daya serta kekuatan dariku.',
 'Shahih at-Tirmidzi',
 'Rasulullah ﷺ bersabda jika seseorang membaca doa tersebut maka diampuni dosanya yang telah lalu.',
 NULL, 'Makan & Minum', true),

-- === KATEGORI: Sholat (lanjutan) ===
('Doa Masuk Masjid',
 'اَللَّهُمَّ افْتَحْ لِيْ أَبْوَابَ رَحْمَتِكَ',
 'Allāhummaftaḥ lī abwāba raḥmatik',
 'Ya Allah, bukalah pintu-pintu rahmat-Mu untukku.',
 'HR. Muslim',
 'Masjid adalah rumah Allah, hendaknya seorang hamba mengagungkannya dan berharap rahmat Allah di dalamnya.',
 NULL, 'Sholat', true),

('Doa Keluar Masjid',
 'اَللَّهُمَّ إِنِّيْ أَسْأَلُكَ مِنْ فَضْلِكَ',
 'Allāhumma innī as''aluka min faḍlik',
 'Ya Allah, sesungguhnya aku memohon karunia-Mu.',
 'HR. Muslim No. 713',
 'Bumi Allah sangatlah luas, ada banyak jalan mencari rezeki. Hendalkah seorang hamba meminta karunia kepada Allah agar dimudahkan untuk mendapat rezeki yang telah Allah bagikan kepada seluruh hamba-Nya.',
 NULL, 'Sholat', true),

('Doa Sebelum Berwudhu',
 'بِسْمِ اللَّهِ',
 'Bismillāh',
 'Dengan nama Allah (aku mulai berwudhu).',
 'HR. at-Tirmidzi dan al-Baihaqi',
 'Disyariatkan memulai setiap perkara yang penting dengan mengucapkan bismillah dalam hal ibadah ataupun lainnya.',
 NULL, 'Sholat', true),

('Doa Sesudah Berwudhu',
 'أشْهَدُ أنْ لا إله إِلاَّ اللَّهُ وَحْدَهُ لا شَرِيك لَهُ ، وأشْهَدُ أنَّ مُحَمَّداً عَبْدُهُ وَرَسُولُهُ ، اللَّهُمَّ اجْعَلْنِي مِنَ التَوَّابِينَ ، واجْعَلْني مِنَ المُتَطَهِّرِينَ ، سُبْحانَكَ اللَّهُمَّ وبِحَمْدِكَ ، أشْهَدُ أنْ لا إلهَ إِلاَّ أنْتَ ، أسْتَغْفِرُكَ وأتُوبُ إِلَيْكَ',
 'Asyhadu an lā ilāha illāllāh waḥdahu lā syarīka lahu, wa asyhadu anna muḥammadan ''abduhu wa rasūluh. Allāhummaj''alnī minat tawwābīna waj''alnī minal mutaṭahhirīna. Subḥānakallāhumma wa biḥamdika asyhadu an lā ilāha illā anta astaghfiruka wa atūbu ilaik',
 'Aku bersaksi bahwa tidak ada tuhan selain Allah semata yang tidak ada sekutu bagi-Nya dan aku pun bersaksi bahwa Muhammad adalah hamba sekaligus Rasul utusan-Nya. Ya Allah, jadikanlah aku termasuk orang-orang yang bertaubat dan jadikanlah aku termasuk orang-orang yang bersuci. Maha Suci Engkau wahai tuhan kami dan segala puji bagi-Mu. Aku bersaksi bahwa tiada tuhan selain Engkau. Aku memohon ampunan dan bertaubat kepada-Mu.',
 'HR. Muslim, at-Tirmidzi dan an-Nasa''i',
 'Barang siapa yang mengucapkan doa tersebut maka akan dibukakan baginya delapan pintu Surga. Dia memasukinya dari arah mana saja yang ia kehendaki.',
 NULL, 'Sholat', true),

('Doa Buka Puasa',
 'ذَهَبَ الظَّمَأُ وابْتَلَّتِ الْعُرُوقُ وثَبَتَ اْلأَجْرُ إِنْ شَاءَاللهُ',
 'Żahabaẓẓama''u wabtallatil ''urūq wa ṡabatal ajru in syā''a Allāh',
 'Rasa haus telah hilang, urat-urat telah basah, dan pahala telah ditetapkan insya Allah.',
 'HR. Abu Daud, As-Sunan Al-Kubra Lil Baihaqi, Juz 4, Hal. 239, al-Hakim dalam Mustadrak ''alas Shahihain No. 1484',
 'Sangat dianjurkan bagi orang yang berpuasa untuk memperbanyak doa sebelum dan sesudah berbuka, karena doa orang yang berpuasa adalah salah satu 3 doa yang tak tertolak.',
 NULL, 'Sholat', true),

-- === KATEGORI: Harian ===
('Doa Masuk Rumah #1',
 'اَلسَّلَامُ عَلَيْكُمْ',
 'Assalāmu ''alaykum',
 'Semoga keselamatan terlimpah untukmu.',
 'HR. at-Tirmidzi',
 'Salam adalah doa pengharapan, pengharapan agar Anda selamat dari segala macam duka dan derita, serta diliputi rahmat dan keberkahan.',
 NULL, 'Harian', true),

('Doa Masuk Rumah #2',
 'اَلسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللهِ وَبَرَكَا تُهُ',
 'Assalāmu ''alaykum warahmatullāhi wabarakātuh',
 'Semoga keselamatan, rahmat dan keberkahan terlimpah untukmu.',
 'HR. at-Tirmidzi',
 'Salam adalah doa pengharapan, pengharapan agar Anda selamat dari segala macam duka dan derita, serta diliputi rahmat dan keberkahan.',
 NULL, 'Harian', true),

-- === KATEGORI: Bepergian ===
('Doa Keluar Rumah',
 'بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ، لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
 'Bismillāh, tawakkaltu ''alallāh, lā haula wa lā quwwata illā billāh',
 'Dengan nama Allah, aku bertawakkal kepada Allah, tiada daya dan kekuatan kecuali dengan pertolongan Allah.',
 'HR. Abu Dawud dan at-Tirmidzi',
 'Barang siapa yang membaca doa tersebut maka dikatakan kepadanya: "Engkau akan diberi petunjuk, dicukupkan dan dijaga". Syaitan pun akan menyingkir darinya.',
 NULL, 'Bepergian', true),

('Doa Agar Tidak Menyebabkan Keburukan atau Terkena Keburukan Di luar Rumah',
 'اللَّهُمَّ إِنِّى أَعُوذُ بِكَ أَنْ أَضِلَّ أَوْ أُضَلَّ أَوْ أَزِلَّ أَوْ أُزَلَّ أَوْ أَظْلِمَ أَوْ أُظْلَمَ أَوْ أَجْهَلَ أَوْ يُجْهَلَ عَلَىَّ',
 'Allāhumma innī a''ūżu bika an adhilla au udholla, au azilla au azulla, au azhlima au uzhlama, au ajhala au yujhala ''alayya',
 'Ya Allah, aku berlindung kepada-Mu, jangan sampai aku sesat atau disesatkan (setan atau orang yang berwatak setan), berbuat kesalahan atau disalahi, menganiaya atau dianiaya (orang), dan berbuat bodoh atau dibodohi.',
 'HR. Abu Dawud, at-Tirmidzi, Ibnu Majah dan an-Nasa''i',
 'Ketika seseorang keluar rumah maka ia akan banyak menemui segala macam hal baik maupun buruk, terutama keburukan yang diperbuat oleh dirinya sendiri. Oleh karena itu diperintahkan untuk berlindung dari diri sendiri dan dari orang lain.',
 NULL, 'Bepergian', true),

('Doa Safar',
 'الله أَكْبَرُ،الله أَكْبَرُ،الله أَكْبَرُ،سُبْحَانَ الَّذِى سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ اللَّهُمَّ إِنَّا نَسْأَلُكَ فِى سَفَرِنَا هَذَا الْبِرَّ وَالتَّقْوَى وَمِنَ الْعَمَلِ مَا تَرْضَى اللَّهُمَّ هَوِّنْ عَلَيْنَا سَفَرَنَا هَذَا وَاطْوِ عَنَّا بُعْدَهُ اللَّهُمَّ أَنْتَ الصَّاحِبُ فِى السَّفَرِ وَالْخَلِيفَةُ فِى الأَهْلِ اللَّهُمَّ إِنِّى أَعُوذُ بِكَ مِنْ وَعْثَاءِ السَّفَرِ وَكَآبَةِ الْمَنْظَرِ وَسُوءِ الْمُنْقَلَبِ فِى الْمَالِ وَالأَهْلِ',
 'Allāhu akbar, Allāhu akbar, Allāhu akbar. Subḥānallażī sakhkhara lanā hāżā wa mā kunnā lahū muqrinīn wa innā ilā rabbina lamunqalibūn. Allāhumma innā nas''aluka fī safarina hażāl birra wat taqwā wa minal ''amali mā tarḍā. Allāhumma hawwin ''alainā safaranā hāżā waṭwi ''annā bu''dah. Allāhumma anta ṣāḥibu fis safar wal khalīfatu fil ahli. Allāhumma innī a''ūżubika min wa''ṡā issafari wa kābatil manżari wa sū''il munqalabi fil māli wal ahli',
 'Allah Maha Besar, Allah Maha Besar, Allah Maha Besar. Maha Suci Allah yang telah menundukkan untuk kami kendaraan ini, padahal kami sebelumnya tidak mempunyai kemampuan untuk melakukannya, dan sesungguhnya hanya kepada Rabb kami, kami akan kembali. Ya Allah, sesungguhnya kami memohon kepada-Mu kebaikan, ketakwaan, dan amal yang Engkau ridhai dalam perjalanan kami ini. Ya Allah, mudahkanlah perjalanan kami ini, dekatkanlah bagi kami jarak yang jauh. Ya Allah, Engkau adalah rekan dalam perjalanan dan pengganti di tengah keluarga. Ya Allah, sesungguhnya aku berlindung kepada-Mu dari kesukaran perjalanan, tempat kembali yang menyedihkan, dan pemandangan yang buruk pada harta, keluarga, dan anak.',
 'HR. Muslim',
 'Didalam doa ini ada 2 bagian. Pertama adalah pujian kepada Allah ta''ala dan ketundukan diri hamba, yang kedua adalah permohonan kepada Allah untuk segala kemudahan baik dalam safar maupun urusan hal-hal yang seorang hamba tinggalkan di rumah.',
 NULL, 'Bepergian', true),

('Doa Orang Mukim Kepada Orang yang Hendak Bersafar',
 'أَسْتَوْدِعُ اللَّهَ دِينَكَ وَأَمَانَتَكَ وَخَوَاتِيمَ عَمَلِكَ',
 'Astawdi''ullaha dīnaka, wa amānataka, wa khawātīma a''mālik',
 'Aku menetipkan agamamu, amanahmu, dan amal terakhir kepada Allah.',
 'HR. Abu Dawud: 2601',
 'Tiga prioritas seorang hamba yang harus dijaga dimanapun, agama, amanah dan amal, sebab seseorang akan dimatikan sesuai dengan amalnya.',
 NULL, 'Bepergian', true),

('Doa Bekal Takwa dari Orang Mukim Kepada yang Hendak Bersafar',
 'زَوَّدَكَ اللَّهُ التَّقْوَى وَغَفَرَ ذَنْبَكَ  وَيَسَّرَ لَكَ الْخَيْرَ حَيْثُمَا كُنْتَ',
 'Zawwadakallāhut taqwā wa ghafara żanbaka wa yassara lakal khaira ḥayṡumā kunta',
 'Semoga Allah membekalimu ketakwaan, mengampuni dosamu, dan memudahkan kebaikan untukmu dimanapun kamu berada.',
 'HR. at-Tirmidzi',
 'Taqwa adalah sebaik-baik bekal yang harus disiapkan seorang hamba menuju akhirat, sebab tidak ada keselamatan kecuali dengan berbekal dengan ketaqwaan.',
 NULL, 'Bepergian', true),

-- === KATEGORI: Harian (lanjutan) ===
('Doa Memakai Pakaian Baru',
 'اللَّهُمَّ لَكَ الْحَمْدُ أَنْتَ كَسَوْتَنِيهِ أَسْأَلُكَ مِنْ خَيْرِهِ وَخَيْرِ مَا صُنِعَ لَهُ وَأَعُوذُ بِكَ مِنْ شَرِّهِ وَشَرِّ مَا صُنِعَ لَهُ',
 'Allāhumma lakal ḥamdu anta kasautanīh, as''aluka min khairihī wa khairi mā ṣuni''a lah, wa a''ūdzu bika min syarrihī wa syarri mā ṣuni''a lah',
 'Ya Allah, hanya milik-Mu lah segala pujian. Engkaulah yang memberi pakaian ini kepadaku. Aku memohon kepada-Mu agar memperoleh kebaikan dari pakaian ini dan kebaikan yang ia diciptakan karenanya. Aku berlindung kepada-Mu dari kejahatannya dan kejahatan yang diciptakan karenanya.',
 'HR. Ahmad, Abu Dawud, at-Tirmidzi dan Al-Hakim',
 'Dengan membaca doa ini, seseorang memohon agar baju yang telah dibeli dapat memberikan kebaikan sekaligus menjadi pelindung bagi berbagai keburukan.',
 NULL, 'Harian', true),

('Doa Memakai Pakaian',
 'الْحَمْدُ لِلَّهِ الَّذِى كَسَانِى هَذَا الثَّوْبَ وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّى وَلاَ قُوَّةٍ',
 'Alhamdulillāhillażī kasānī hāżā wa razaqanīhi min ghayri ḥawlin minnī wa lā quwwatin',
 'Segala puji bagi Allah yang memberi pakaian ini kepadaku sebagai rezeki dari-Nya tanpa daya dan kekuatan dariku.',
 'HR. seluruh penyusun kitab Sunan, kecuali Nasa''i',
 'Keutamaan membaca doa ini, akan diampuni dosa yang telah lalu, InsyaAllah.',
 NULL, 'Harian', true),

-- === KATEGORI: Bepergian (lanjutan) ===
('Doa Menaiki Kendaraan',
 'بِسْمِ اللَّهِ، بِسْمِ اللَّهِ، بِسْمِ اللَّهِ، الحَمْدُ للِه، سُبْحَانَ الَّذِى سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ، سُبْحَانَكَ إِنِّى قَدْ ظَلَمْتُ نَفْسِى فَاغْفِرْ لِى فَإِنَّهُ لاَ يَغْفِرُ الذُّنُوبَ إِلاَّ أَنْتَ',
 'Bismillāh, bismillāh, bismillāh. Alḥamdulillāh. Subḥānallażī sakhkhara lanā hāżā wa mā kunnā lahu muqrinīn wa innā ilā rabbinā lamunqalibūn. Subḥānaka innī qad ẓalamtu nafsī faghfir lī fa innahu lā yaghfiru aẓ ẓunūba illā anta',
 'Dengan menyebut nama Allah (3x). Segala puji bagi Allah. Maha Suci Allah yang telah menundukkan semua ini bagi kami padahal kami sebelumnya tidak mampu menguasainya, dan sesungguhnya kami akan kembali kepada Rabb kami. Maha Suci Engkau, sesungguhnya aku telah mendzalimi diriku sendiri maka ampunilah aku, karena tidak ada yang mengampuni dosa-dosa selain Engkau.',
 'HR. Abu Dawud dan at-Tirmidzi',
 'Dengan membaca doa naik kendaraan, perjalanan kita akan senantiasa mendapat perlindungan Allah ta''ala. Selain itu juga akan mendapat pahala, pertolongan dan hati yang lebih tenang.',
 NULL, 'Bepergian', true),

-- === KATEGORI: Harian (lanjutan - cuaca) ===
('Doa Ketika Turun Hujan',
 'اللَّهُمَّ صَيِّبًا نَافِعًا',
 'Allahumma shayyiban nāfi''ā',
 'Ya Allah turunkanlah pada kami hujan yang bermanfaat.',
 'HR. al-Bukhari No. 1032',
 'Ajuran untuk berdo''a ketika turun hujan agar kebaikan dan keberkahan semakin bertambah, begitu pula semakin banyak kemanfaatan.',
 NULL, 'Harian', true),

('Doa Ketika Hujan Lebat',
 'اللَّهُمَّ حَوَالَيْنَا وَلاَ عَلَيْنَا ، اللَّهُمَّ عَلَى الآكَامِ وَالظِّرَابِ وَبُطُونِ الأَوْدِيَةِ وَمَنَابِتِ الشَّجَرِ',
 'Allahumma hāwalaina wa lā ''alaina. Allahumma ''alal ākami wal jibāli, wazh zhiroobi, wa buthunil awdiyati, wa manābitisy syajari',
 'Ya Allah, turunkanlah hujan di sekitar kami, bukan untuk merusak kami. Ya Allah, turunkanlah hujan ke dataran tinggi, gunung-gunung, bukit-bukit, perut lembah dan tempat tumbuhnya pepohonan.',
 'HR. al-Bukhari No. 1014',
 'Bahwa do''a di atas dibaca ketika hujan semakin lebat atau khawatir hujan akan membawa dampak bahaya.',
 NULL, 'Harian', true),

('Doa Setelah Turun Hujan',
 'مُطِرْنا بفَضْلِ اللهِ ورَحْمَتِهِ',
 'Muthirna bi fadhlillahi wa rohmatih',
 'Kita diberi hujan karena karunia dan rahmat Allah.',
 'HR. al-Bukhari No. 846 dan Muslim No. 71',
 'Dengan membaca doa tersebut maka ia telah mengimani bahwasanya hujan turun atas kehendak Allah (keutamaan Allah), bukan dengan bintang-bintang sehingga mereka menjadi kufur kepada Allah.',
 NULL, 'Harian', true),

('Doa Ketika Angin Kencang',
 'اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَهَا، وَأَعُوْذُ بِكَ مِنْ شَرِّهَا',
 'Allāhumma innī as''aluka khoirohā wa a''ūżubika min syarrihā',
 'Ya Allah, sesungguhnya aku memohon kepada-Mu kebaikan angin ini dan aku berlindung kepada-Mu dari keburukannya.',
 'HR. Abu Dawud dan Ibnu Majah',
 'Diantara tanda kuasa Allah adalah angin yang kencang yang bisa mendatangkan nikmat dan adzab, yakni kebaikan dan keburukan. Maka seyogyanya seorang hamba terus meminta kebaikan dan berlindung dari segala marabahaya.',
 NULL, 'Harian', true),

-- === KATEGORI: Pagi & Sore ===
('Sayyid al-Istighfar',
 'اَللَّهُمَّ أَنْتَ رَبِّيْ ، لَا إِلٰـهَ إِلاَّ أَنْتَ خَلَقْتَنِيْ وَأَنَا عَبْدُكَ ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ ، أَعُوْذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ ، أَبُوْءُ لَكَ بِنِعْمتِكَ عَلَيَّ ، وَأَبُوْءُ بِذَنْبِيْ فَاغْفِرْ لِيْ ، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلاَّ أَنْتَ',
 'Allahumma anta rabbī lā ilāha illā anta khalaqtanī wa anna ''abduka wa anā ''alā ''ahdika wa wa''dika mastatha''tu a''ūżu bika min syarri mā shana''tu abū u laka bini'' matika ''alayya wa abū u biżanbī faghfir lī fa innahu lā yaghfiruż żunūba illa anta',
 'Ya Allah, Engkau adalah Rabb-ku, tidak ada Ilah (yang berhak diibadahi dengan benar) kecuali Engkau, Engkau-lah yang menciptakanku. Aku adalah hamba-Mu. Aku akan setia pada perjanjianku dengan-Mu semampuku. Aku berlindung kepada-Mu dari kejelekan (apa) yang kuperbuat. Aku mengakui nikmat-Mu (yang diberikan) kepadaku dan aku mengakui dosaku, oleh karena itu, ampunilah aku. Sesungguhnya tidak ada yang dapat mengampuni dosa kecuali Engkau.',
 'HR. al-Bukhari No. 6306, 6323, Ahmad IV/122-125, an-Nasa''i VIII/279-280',
 'Barang siapa yang membacanya dengan yakin ketika petang hari, kemudian dia meninggal, maka ia akan masuk surga, demikian juga jika (dibaca) pada pagi hari.',
 NULL, 'Pagi & Sore', true),

-- === KATEGORI: Harian (lanjutan - kebutuhan) ===
('Doa Meminta Kemudahan Dalam Segala Urusan',
 'اللَّهُمَّ لاَ سَهْلَ إِلاَّ مَا جَعَلْتَهُ سَهْلاً وَأَنْتَ تَجْعَلُ الحَزْنَ إِذَا شِئْتَ سَهْلاً',
 'Allahumma lā sahla illa mā ja''altahu sahlā, wa anta taj''alul hazna iża syi''ta sahlā',
 'Ya Allah, tidak ada kemudahan kecuali Engkau buat mudah. Dan engkau menjadikan kesedihan (kesulitan), jika Engkau kehendaki pasti akan menjadi mudah.',
 'HR. Ibnu Hibban',
 'Kemudahan hanya datang dari Allah. Sesuatu yang sulit sekalipun bisa menjadi mudah jika Allah kehendaki.',
 NULL, 'Harian', true),

('Doa Tertimpa Musibah',
 'إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ اللَّهُمَّ أْجُرْنِى فِى مُصِيبَتِى وَأَخْلِفْ لِى خَيْرًا مِنْهَا',
 'Inna lillahi wa inna ilaihi rooj''un. Allahumma''jurnī fī mushibatī wa akhlif lī khoiron minhā',
 'Segala sesuatu adalah milik Allah dan akan kembali pada-Nya. Ya Allah, berilah ganjaran terhadap musibah yang menimpaku dan berilah ganti dengan yang lebih baik.',
 'HR. Muslim',
 'Hendaklah seorang hamba membaca doa diatas ketika tertimpa musibah dengan rasa yakin dan harap, InsyaAllah dengan ini akan mendapatkan ganti yang lebih baik.',
 NULL, 'Harian', true),

('Doa Ketika Terlilit Hutang',
 'اللَّهُمَّ اكْفِنِى بِحَلاَلِكَ عَنْ حَرَامِكَ وَأَغْنِنِى بِفَضْلِكَ عَمَّنْ سِوَاكَ',
 'Allahumak finī bi halālika ''an haroomik, wa agh niniy bi fadhlika ''amman siwāk',
 'Ya Allah cukupkanlah aku dengan yang halal dan jauhkanlah aku dari yang haram, dan cukupkanlah aku dengan karunia-Mu dari bergantung pada selain-Mu.',
 'HR. at-Tirmidzi No. 2563',
 'Rezeki halal walaupun sedikit lebih baik dari harta haram yang jumlahnya melimpah.',
 NULL, 'Harian', true),

('Doa Memohon Perlindungan Dari Sifat Malas, Kesedihan, dan Lilitan Hutang',
 'اَللّٰهُمَّ إِنِّى أَعُوْذُبِكَ مِنَ الْهَمِّ وَالْحَزْنِ وَأَعُوْذُبِكَ مِنَ الْعَجْزِ وَالْكَسَلِ وَأَعُوْذُبِكَ مِنَ الْجُبْنِ وَالْبُخْلِ وَأَعُوْذُبِكَ مِنْ غَلَبَتِ الدَّيْنِ وَقَهْرِ الرجال',
 'Allahumma innī a''ūżu bika minal hammi wal hazan. Wa a''użu bika minal ''ajzi wal kasal. Wa a''ūżu bika minal jubni wal bukhl. Wa a''ūżu bika min ghalabatiddayni wa qahrirrijāl',
 'Ya Allah, aku berlindung kepada-Mu dari kebingungan dan kesedihan, aku berlindung kepada-Mu dari kelemahan dan kemalasan, aku berlindung kepada-Mu dari ketakutan dan kekikiran, aku berlindung kepada-Mu dari lilitan hutang dan tekanan orang-orang.',
 'HR. Abu Dawud No. 1555',
 'Abu Umamah lalu menuturkan: Setelah aku mengamalkan doa itu, Allah benar-benar menghilangkan kebingunganku dan memberi kemampuan melunasi hutang.',
 NULL, 'Harian', true),

('Doa Setelah Bersin',
 'الحَمْدُ للهِ',
 'Alḥamdulillāh',
 'Segala puji bagi Allah.',
 'HR. al-Bukhari',
 'Sesungguhnya Allah mencintai bersin, sebab bersin menggerakan seseorang untuk beribadah. Dan anjuran membalas pujian atas Allah orang yang memuji Allah, begitu juga sebaliknya.',
 NULL, 'Harian', true),

('Doa Saat Mendengar Orang Bersin',
 'يَرْحَمُكَ اللهُ',
 'Yarhamukallah',
 'Semoga Allah merahmatimu.',
 'HR. al-Bukhari',
 'Sesungguhnya Allah mencintai bersin, sebab bersin menggerakan seseorang untuk beribadah. Dan anjuran membalas pujian atas Allah orang yang memuji Allah, begitu juga sebaliknya.',
 NULL, 'Harian', true),

('Doa Balasan Kepada yang Mendoakan Kamu Bersin',
 'يَهْدِيكُمُ اللهُ وَيُصْلِحُ بَالَكُمْ',
 'Yahdikumullah wa yushlihu bālakum',
 'Semoga Allah memberikan petunjuk, dan memperbaiki keadaan kalian.',
 'HR. al-Bukhari',
 'Sesungguhnya Allah mencintai bersin, sebab bersin menggerakan seseorang untuk beribadah. Dan anjuran membalas pujian atas Allah orang yang memuji Allah, begitu juga sebaliknya.',
 NULL, 'Harian', true),

('Doa Meminta Akhlak yang Baik',
 'اللَّهُمَّ كَمَا حَسَّنْتَ خَلْقِي فَحَسِّنْ خُلُقِي',
 'Allahumma kamā hassanta kholqī fahassin khuluqī',
 'Ya Allah, sebagaimana Engkau memperbagus badanku maka perbaguslah akhlaku.',
 'HR. Ahmad, dishahihkan al-Albani dalam al-Irwa'', 1/115',
 'Paras yang menawan tidaklah cukup sebagai bekal seorang muslim, tapi harus diiringi dengan akhlak yang mulia. Maka hendaklah seorang muslim terus meminta untuk diperbaiki dan diperindah akhlaknya.',
 NULL, 'Harian', true),

('Doa Berlindung dari Syaitan',
 'رَبِّ أَعُوْذُ بِكَ مِنْ هَمَزَاتِ الشَّيَاطِيْنِ وَأَعُوْذُ بِكَ رَبِّ أَنْ يَحْضُرُوْنِ',
 'Rabbi a''ūżu bika min hamazātisy syayāthīn wa a''ūżu bika rabbi ay yahdhurūn',
 'Ya Tuhanku aku berlindung kepada Engkau dari bisikan-bisikan syaitan dan aku berlindung (pula) kepada Engkau ya Tuhanku, dari kedatangan mereka kepadaku.',
 'QS. Al-Mu''minun: 97-98',
 'Sesungguhnya Allah memerintahkan kepada nabi Muhammad dan seluruh ummat nya untuk berlindung dari bisikan syaitan dalam seluruh kegiatan dan terlebih saat menjelang kematian, yang mana syaitan membisikannya melalui hati seorang hamba dan membisikannya untuk melakukan kejelekan.',
 NULL, 'Harian', true),

-- === KATEGORI: Sholat (adzan) ===
('Doa Sesudah Adzan',
 'اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ، وَالصَّلَاةِ الْقَائِمَةِ، آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ',
 'Allahumma rabba hāżihid da''watit tāmmah, wasshalātil qāaimah, āti muhammadanil wasīlata wal fadhīilah, wab''aṡhu maqāman mahmūda allażī wa''adtah',
 'Ya Allah, pemilik seruan yang sempurna ini dan sholat yang ditegakkan, anugerahkanlah kepada Nabi Muhammad; wasilah (kedudukan yang tinggi di surga) dan keutamaan (melebihi seluruh makhluk), dan bangkitkanlah beliau dalam kedudukan terpuji (memberi syafa''at) yang telah Engkau janjikan.',
 'HR. Abu Dawud (529), at-Tirmidzi (211), an-Nasa''i (2:26), Ibnu Majah (722)',
 'Doa tersebut adalah doa yang disunnahkan oleh Rasulullah shallallahu alaihi wa sallam bagi orang yang mendengar panggilan shalat. Doa ini memiliki banyak keutamaan, di antaranya adalah mendapatkan syafaat dari Rasulullah shallallahu alaihi wa sallam dihari kiamat.',
 NULL, 'Sholat', true),

-- === KATEGORI: Harian (orangtua) ===
('Doa Memohon Ampunan untuk Kedua Orang Tua',
 'رَبَّنَا ٱغْفِرْ لِى وَلِوَٰلِدَىَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ ٱلْحِسَابُ',
 'Rabbanagfir lī wa liwālidayya wa lil mu''minīna yauma yaqūmul hīsāb',
 'Ya Tuhan kami, beri ampunilah aku dan kedua ibu bapaku dan sekalian orang-orang mukmin pada hari terjadinya hisab (hari kiamat)',
 'QS. Ibrahim: 41',
 'Doa tersebut adalah doa Nabi Ibrahim ''alaihissalam yang mengajarkan kita untuk menghormati dan menyayangi orang tua, mengingat hari akhir, dan peduli terhadap sesama mukmin.',
 NULL, 'Harian', true);


-- ============================================================
-- 3. Insert 8 Doa Pilihan
-- ============================================================
INSERT INTO daily_doas (title, arabic, latin, translation, source, fawaid, notes, category, is_active) VALUES

('Doa Sapu Jagat',
 'رَبَّنَا آَتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآَخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
 'Rabbanā ātinā fīddunyā ḥasanah wa fīlākhirati ḥasanah waqinā ''ażābannār',
 'Ya Allah, berikanlah kepada kami kebaikan di dunia, berikan pula kebaikan di akhirat dan lindungilah kami dari siksa neraka.',
 'QS. Al-Baqarah: 201, al-Bukhari: 6389, HR. Muslim: 2690',
 'Doa ini adalah doa yang paling sering dipanjatkan oleh Nabi Shallallahu ''alaihi wa sallam, sebagaimana penuturan sahabat Anas bin Malik radhiyallahu ''anhu.',
 NULL, 'Doa Pilihan', true),

('Doa Memohon Ketetapan Hati #1',
 'يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِى عَلَى دِينِكَ',
 'Yā muqallibal qulūb ṡabbit qalbī ''alā dīnik',
 'Wahai Dzat yang Maha membolak-balikkan hati, teguhkanlah hatiku di atas agama-Mu.',
 'HR. at-Tirmidzi, No. 3522 dan Ahmad, 6: 315',
 'Hati seseorang berada diantara jemari-jemari Allah ta''ala, dan Dia membolak-balikkan sesuai dengan kehendak-Nya. Maka, sudah selayaknya seseorang untuk senantiasa memohon agar Allah tetapkan hatinya di atas kebaikan.',
 NULL, 'Doa Pilihan', true),

('Doa Memohon Ketetapan Hati #2',
 'اللَّهُمَّ مُصَرِّفَ الْقُلُوبِ صَرِّفْ قُلُوبَنَا عَلَى طَاعَتِكَ',
 'Allāhumma muṣarrifal qulūb ṣarrif qulūbanā ''alā ṭā''ātika',
 'Ya Allah, Dzat yang memalingkan hati, palingkanlah hati kami kepada ketaatan beribadah kepada-Mu.',
 'HR. Muslim No. 2654',
 'Hati seseorang berada diantara jemari-jemari Allah ta''ala, dan Dia membolak-balikkan sesuai dengan kehendak-Nya.',
 NULL, 'Doa Pilihan', true),

('Doa Memohon Ketetapan Hati #3',
 'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا',
 'Rabbanā lā tuzigh qulūbanā ba''da iż hadaytanā',
 'Ya Tuhan kami, janganlah Engkau jadikan hati kami condong kepada kesesatan sesudah Engkau beri petunjuk kepada kami.',
 'QS. Ali Imran: 8',
 'Sudah selayaknya seseorang senantiasa memohon agar Allah tetapkan hatinya di atas kebaikan, dan senantiasa istiqamah dalam kebenaran.',
 NULL, 'Doa Pilihan', true),

('Doa Berlindung dari Hilangnya Kenikmatan',
 'اللَّهُمَّ إِنِّى أَعُوذُ بِكَ مِنْ زَوَالِ نِعْمَتِكَ وَتَحَوُّلِ عَافِيَتِكَ وَفُجَاءَةِ نِقْمَتِكَ وَجَمِيعِ سَخَطِكَ',
 'Allāhumma innī a''ūżu bika min zawāli ni''matika, wa taḥawwuli ''āfiyatika, wa fujā''ati niqmatik, wa jamī''i sakhaṭik',
 'Ya Allah, sesungguhnya aku berlindung kepada-Mu dari hilangnya kenikmatan yang telah Engkau berikan, dari berubahnya kesehatan yang telah Engkau anugerahkan, dari siksa-Mu yang datang secara tiba-tiba, dan dari segala kemurkaan-Mu.',
 'HR. Muslim No. 2739',
 'Kenikmatan yang ada saat ini sangat mungkin hilang, sehatnya jiwa raga dalam sekejap matapun sangat bisa berubah menjadi sakit, dan hanya Allah lah yang mampu mencegah itu terjadi.',
 NULL, 'Doa Pilihan', true),

('Doa Tolak Bala'' (Cobaan yang Berat)',
 'اللَّهُمَّ إِنِّي أَعُوْذُ بِكَ مِنْ جَهْدِ البَلاَءِ ، وَدَرَكِ الشَّقَاءِ ، وَسُوءِ القَضَاءِ ، وَشَمَاتَةِ الأَعْدَاء',
 'Allāhumma innī a''ūżu bika min jahdil balā'', wa darakisy syaqā'', wa sū''il qaḍā'', wa syamātatil a''dā''',
 'Ya Allah, aku berlindung kepada-Mu dari bencana yang sangat berat, kesengsaraan, dan segala faktor penyebabnya, dari buruknya akibat apa yang telah ditakdirkan, serta bahagianya musuh atas musibah yang menimpa diriku.',
 'HR. al-Bukhari: 6616, Muslim: 2707',
 'Berlindung dari ketentuan takdir yang berdampak buruk, tidak bertentangan dengan sikap ridha terhadap ketentuan takdir Allah azza wa jalla.',
 NULL, 'Doa Pilihan', true),

('Doa Agar Terlepas Dari Lilitan Hutang, Kegundahan, Kelemahan, Rasa Malas, Takut, dan Tekanan Orang Lain',
 'اَللّٰهُمَّ إِنِّى أَعُوْذُبِكَ مِنَ الْهَمِّ وَالْحَزْنِ وَأَعُوْذُبِكَ مِنَ الْعَجْزِ وَالْكَسَلِ وَأَعُوْذُبِكَ مِنَ الْجُبْنِ وَالْبُخْلِ وَأَعُوْذُبِكَ مِنْ غَلَبَتِ الدَّيْنِ وَقَهْرِ الرجال',
 'Allāhumma innī a''ūżu bika minal hammi wal ḥazan, wa a''ūżu bika minal ''ajzi wal kasal, wa a''ūżu bika minal jubni wal bukhl, wa a''ūżu bika min ghalabatiddayni wa qahrirrijāl',
 'Ya Allah, aku berlindung kepada-Mu dari kebingungan dan kesedihan, aku berlindung kepada-Mu dari kelemahan dan kemalasan, aku berlindung kepada-Mu dari ketakutan dan kekikiran, aku berlindung kepada-Mu dari lilitan hutang dan tekanan orang-orang.',
 'HR. Abu Dawud No. 1555',
 'Sahabat yang mulia Abu Umamah yang meriwayatkan hadits ini menuturkan: setelah aku mengamalkan doa itu, Allah benar-benar menghilangkan kebingunganku dan memberikanku kemampuan melunasi hutang.',
 NULL, 'Doa Pilihan', true),

('Doa Ketika Mendapatkan Sesuatu yang Menyenangkan',
 'الْحَمْدُ لِلَّهِ الَّذِى بِنِعْمَتِهِ تَتِمُّ الصَّالِحَاتُ',
 'Alhamdulillāhillażī bini''matihī tatimmuṣṣāliḥāt',
 'Segala puji bagi Allah, dimana dengan nikmatnya kebaikan menjadi sempurna.',
 'HR. Ibnu Majah dalam Sunannya, No. 3803 dan al-Hakim dalam al-Mustadrak (1/499)',
 'Aisyah radhiyallahu ''anha mengatakan, Rasulullah shallallahu ''alaihi wa sallam apabila melihat sesuatu yang beliau sukai, beliau membaca kalimat di atas.',
 NULL, 'Doa Pilihan', true);

-- ============================================================
-- SELESAI! Total: 38 doa harian + 8 doa pilihan = 46 doa
-- ============================================================
