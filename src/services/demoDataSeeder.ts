import {
  AnggotaTimModel,
  JadwalFotografi,
  OwnerProfile,
  PaketLayanan,
  RekeningModel,
} from '../types/kafela';

export type ProfessionPresetKey = 'FOTO' | 'MUA' | 'WO' | 'MC';

const DEFAULT_SIGNATURE_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="240" height="90" viewBox="0 0 240 90">
  <path d="M22,68 C38,24 54,18 60,52 C65,78 88,22 104,40 C118,56 128,30 145,48 C160,64 185,25 215,35 M35,58 C85,48 145,44 205,42" fill="none" stroke="#152238" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`)}`;

const DEFAULT_LOGO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" rx="36" fill="#FFFFFF"/>
  <circle cx="100" cy="100" r="76" fill="none" stroke="#7A4224" stroke-width="6" stroke-dasharray="420 55" stroke-linecap="round"/>
  <text x="100" y="98" text-anchor="middle" font-family="Plus Jakarta Sans, Georgia, serif" font-weight="800" font-size="32" fill="#7A4224">kafela's</text>
  <text x="115" y="126" text-anchor="middle" font-family="Georgia, serif" font-size="21" fill="#7A4224">Agenda</text>
</svg>
`)}`;

export interface SeededWorkspaceData {
  owner: OwnerProfile;
  rekening: RekeningModel;
  paketList: PaketLayanan[];
  jadwalAktif: JadwalFotografi[];
  jadwalArsip: JadwalFotografi[];
  timList: AnggotaTimModel[];
}

export function generateDemoWorkspace(preset: ProfessionPresetKey = 'FOTO'): SeededWorkspaceData {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const todayDate = now.getDate();

  const makeTime = (dayOffset: number, hour: number, minute = 0) => {
    const d = new Date(y, m, todayDate + dayOffset, hour, minute, 0, 0);
    return d.getTime();
  };

  const makeDayStart = (dayOffset: number) => {
    const d = new Date(y, m, todayDate + dayOffset, 0, 0, 0, 0);
    return d.getTime();
  };

  const presetMeta: Record<
    ProfessionPresetKey,
    {
      namaBrand: string;
      namaOwner: string;
      jenisUsaha: string;
      tagline: string;
      warnaTema: string;
      paketList: PaketLayanan[];
      jadwalAktif: JadwalFotografi[];
    }
  > = {
    FOTO: {
      namaBrand: "Kafela's Photo Studio",
      namaOwner: 'Iqbal Saefinnuha',
      jenisUsaha: 'Fotografi & Studio Foto',
      tagline: 'Self Photo Studio, Wisuda & Wedding Cinema',
      warnaTema: '#34495E',
      paketList: [
        {
          idPaket: 'pkt-1',
          namaPaket: 'Self Photo Studio (15 Menit)',
          hargaPaket: 75000,
          deskripsiPaket: 'Bebas ekspresi 15 menit, semua file Google Drive + Cetak 2 Strip 4R',
          urutan: 0,
        },
        {
          idPaket: 'pkt-2',
          namaPaket: 'Paket Foto Wisuda & Keluarga Studio',
          hargaPaket: 350000,
          deskripsiPaket: 'Durasi 45 menit, maks 8 orang, 10 foto edit + Cetak 10R Frame',
          urutan: 1,
        },
        {
          idPaket: 'pkt-3',
          namaPaket: 'Silver Yearbook (3 Tema)',
          hargaPaket: 2500000,
          deskripsiPaket: 'Pemotretan buku tahunan sekolah 1 kelas, 2 fotografer + drone',
          urutan: 2,
        },
        {
          idPaket: 'pkt-4',
          namaPaket: 'Gold Wedding Documentation',
          hargaPaket: 5500000,
          deskripsiPaket: '2 Fotografer, 1 Videografer, Cinematic Highlight 3 menit, Album Magnetik',
          urutan: 3,
        },
        {
          idPaket: 'pkt-5',
          namaPaket: 'Pas Foto Kilat & Cetak Langsung',
          hargaPaket: 45000,
          deskripsiPaket: 'Ganti warna latar merah/biru, cetak ukuran 2x3, 3x4, 4x6 langsung jadi',
          urutan: 4,
        },
      ],
      jadwalAktif: [
        {
          idJadwal: 'JDW-882101',
          namaAcara: 'Sesi Foto Wisuda & Keluarga',
          namaKlien: 'Nabila Putri, S.Kom',
          lokasi: 'Studio Utama (Backdrop Cream)',
          paket: 'Paket Foto Wisuda & Keluarga Studio',
          hargaPaketDasar: 350000,
          namaTambahan: 'Tambah Cetak 16R + Frame',
          hargaTambahan: 100000,
          namaPic: 'Nabila Putri, S.Kom',
          waPic: '081288990011',
          waktuMulai: makeTime(0, 10, 0),
          waktuSelesai: makeTime(0, 11, 0),
          tanggalMulai: makeDayStart(0),
          tanggalSelesaiEvent: makeDayStart(0),
          status: 'Lunas',
          hargaKotor: 450000,
          diskon: 0,
          dpDibayar: 450000,
          catatan: 'Keluarga 6 orang, request tone hangat.',
          sumber: 'KASIR_POS',
          fotoTeknis: {
            jmlShooter: '1 Fotografer Studio',
            droneLighting: '3 Strobe Godox + Softbox Octa',
            namaKru: 'Rizky (Fotografer 1)',
            linkDrive: 'https://drive.google.com/drive/folders/kafela-wisuda',
          },
        },
        {
          idJadwal: 'JDW-882102',
          namaAcara: 'Self Photo Couple Session',
          namaKlien: 'Dimas & Aurel',
          lokasi: 'Room 2 Self Studio',
          paket: 'Self Photo Studio (15 Menit)',
          hargaPaketDasar: 75000,
          namaTambahan: 'Extra Time 10 Menit',
          hargaTambahan: 35000,
          namaPic: 'Dimas & Aurel',
          waPic: '081322334455',
          waktuMulai: makeTime(0, 13, 30),
          waktuSelesai: makeTime(0, 14, 0),
          tanggalMulai: makeDayStart(0),
          tanggalSelesaiEvent: makeDayStart(0),
          status: 'Lunas',
          hargaKotor: 110000,
          diskon: 10000,
          dpDibayar: 100000,
          catatan: 'Transaksi walk-in kasir langsung.',
          sumber: 'KASIR_POS',
        },
        {
          idJadwal: 'JDW-882103',
          namaAcara: 'Pemotretan Buku Tahunan',
          namaKlien: 'Andi (Panitia SMAN 1)',
          lokasi: 'Halaman Utama SMAN 1',
          paket: 'Silver Yearbook (3 Tema)',
          hargaPaketDasar: 2500000,
          namaTambahan: 'Sewa Smoke Bomb & Properti',
          hargaTambahan: 250000,
          namaPic: 'Andi (Panitia SMAN 1)',
          waPic: '085711223344',
          waktuMulai: makeTime(1, 8, 0),
          waktuSelesai: makeTime(1, 14, 0),
          tanggalMulai: makeDayStart(1),
          tanggalSelesaiEvent: makeDayStart(1),
          status: 'DP',
          hargaKotor: 2750000,
          diskon: 50000,
          dpDibayar: 1000000,
          catatan: 'Bawa lensa wide 16-35mm & baterai drone 3 buah.',
          sumber: '',
          fotoTeknis: {
            jmlShooter: '2 Fotografer + 1 Video',
            droneLighting: 'DJI Air 3 + Flash Outdoor',
            namaKru: 'Rizky, Farhan, Bima',
            linkDrive: 'https://drive.google.com/drive/folders/yearbook-sman1',
          },
        },
        {
          idJadwal: 'JDW-882104',
          namaAcara: 'Wedding Dinda & Fajar',
          namaKlien: 'Dinda Sari',
          lokasi: 'Gedung Sate / Grand Ballroom',
          paket: 'Gold Wedding Documentation',
          hargaPaketDasar: 5500000,
          namaTambahan: '',
          hargaTambahan: 0,
          namaPic: 'Dinda Sari',
          waPic: '081234567890',
          waktuMulai: makeTime(3, 8, 0),
          waktuSelesai: makeTime(3, 15, 0),
          tanggalMulai: makeDayStart(3),
          tanggalSelesaiEvent: makeDayStart(3),
          status: 'Menunggu Konfirmasi',
          hargaKotor: 5500000,
          diskon: 0,
          dpDibayar: 0,
          catatan: 'VIA WEB: Tolong fotografer datang jam 07.00 pagi untuk persiapan akad + tambah drone.',
          sumber: 'WEB',
        },
        {
          idJadwal: 'JDW-882105',
          namaAcara: 'Prewedding Outdoor Session',
          namaKlien: 'Reza & Karina',
          lokasi: 'Hutan Pinus Lembang',
          paket: 'Gold Wedding Documentation',
          hargaPaketDasar: 5500000,
          namaTambahan: '',
          hargaTambahan: 0,
          namaPic: 'Reza & Karina',
          waPic: '081987654321',
          waktuMulai: makeTime(-2, 7, 30),
          waktuSelesai: makeTime(-2, 13, 0),
          tanggalMulai: makeDayStart(-2),
          tanggalSelesaiEvent: makeDayStart(-2),
          status: 'Booking',
          hargaKotor: 2200000,
          diskon: 0,
          dpDibayar: 0,
          catatan: 'Menunggu transfer DP sore ini.',
          sumber: '',
        },
      ],
    },
    MUA: {
      namaBrand: "Kafela's Bridal & MUA",
      namaOwner: 'Siti Kafila',
      jenisUsaha: 'Make Up Artist (MUA)',
      tagline: 'Bridal Make Up, Attire & Sunda Siger Specialist',
      warnaTema: '#5E35B1',
      paketList: [
        {
          idPaket: 'mua-1',
          namaPaket: 'Make Up Wisuda / Party Studio',
          hargaPaket: 350000,
          deskripsiPaket: 'Make up flawless tahan 12 jam + hijab do / hairdo di studio',
          urutan: 0,
        },
        {
          idPaket: 'mua-2',
          namaPaket: 'Paket Akad & Resepsi (Full Attire)',
          hargaPaket: 6500000,
          deskripsiPaket: 'Make up CPW + Busana Pengantin + Make up 2 Ibu + Beskap Bapak',
          urutan: 1,
        },
        {
          idPaket: 'mua-3',
          namaPaket: 'Paket Lamaran / Engagement',
          hargaPaket: 1200000,
          deskripsiPaket: 'Make up home service + touch up sesi foto',
          urutan: 2,
        },
      ],
      jadwalAktif: [
        {
          idJadwal: 'MUA-901',
          namaAcara: 'Make Up Wisuda Kampus',
          namaKlien: 'Alya Zahra',
          lokasi: 'Studio Kafela MUA',
          paket: 'Make Up Wisuda / Party Studio',
          hargaPaketDasar: 350000,
          namaTambahan: 'Bulu Mata Premium 3D',
          hargaTambahan: 50000,
          namaPic: 'Alya Zahra',
          waPic: '081211112222',
          waktuMulai: makeTime(0, 6, 0),
          waktuSelesai: makeTime(0, 7, 30),
          tanggalMulai: makeDayStart(0),
          tanggalSelesaiEvent: makeDayStart(0),
          status: 'Lunas',
          hargaKotor: 400000,
          diskon: 0,
          dpDibayar: 400000,
          catatan: 'Skin type kombinasi, look soft coral.',
          sumber: 'KASIR_POS',
        },
        {
          idJadwal: 'MUA-902',
          namaAcara: 'Akad & Resepsi Adat Sunda',
          namaKlien: 'Syifa & Fauzan',
          lokasi: 'Hotel Horison Ultima',
          paket: 'Paket Akad & Resepsi (Full Attire)',
          hargaPaketDasar: 6500000,
          namaTambahan: 'Melati Segar Siger',
          hargaTambahan: 500000,
          namaPic: 'Syifa',
          waPic: '081355667788',
          waktuMulai: makeTime(2, 4, 30),
          waktuSelesai: makeTime(2, 14, 0),
          tanggalMulai: makeDayStart(2),
          tanggalSelesaiEvent: makeDayStart(2),
          status: 'DP',
          hargaKotor: 7000000,
          diskon: 200000,
          dpDibayar: 3000000,
          catatan: 'Fitting terakhir sudah selesai.',
          sumber: '',
          attire: {
            cpwModel: 'Kebaya Putih Payet Mutiara + Gaun Champagne',
            cpwUkuran: 'LD 90, Sepatu 38, Hijab Square',
            cppModel: 'Beskap Putih Sunda + Jas Champagne',
            cppUkuran: 'Size L, Peci 8, Selop 42',
            catatanAttire: 'Ibu CPW & Besan seragam sage green LD 105 & 110. Siger Sunda Kencana.',
          },
        },
        {
          idJadwal: 'MUA-903',
          namaAcara: 'Booking Lamaran Intimate',
          namaKlien: 'Tiara Maharani',
          lokasi: 'Rumah Mempelai Cisaat',
          paket: 'Paket Lamaran / Engagement',
          hargaPaketDasar: 1200000,
          namaTambahan: '',
          hargaTambahan: 0,
          namaPic: 'Tiara Maharani',
          waPic: '085699887766',
          waktuMulai: makeTime(4, 7, 0),
          waktuSelesai: makeTime(4, 11, 0),
          tanggalMulai: makeDayStart(4),
          tanggalSelesaiEvent: makeDayStart(4),
          status: 'Booking',
          hargaKotor: 1200000,
          diskon: 0,
          dpDibayar: 0,
          catatan: 'VIA WEB: Request tambahan hairdo untuk adik kandung 1 orang.',
          sumber: 'WEB',
        },
      ],
    },
    WO: {
      namaBrand: "Kafela's Signature WO",
      namaOwner: 'Iqbal Saefinnuha',
      jenisUsaha: 'Wedding Organizer (WO)',
      tagline: 'Full Service Wedding & Event Planner',
      warnaTema: '#1B5E20',
      paketList: [
        {
          idPaket: 'wo-1',
          namaPaket: 'WO On The Day (6 Kru)',
          hargaPaket: 4500000,
          deskripsiPaket: '1 Project Leader, 5 Crew lapangan, penyusunan buku panduan & teknikal meeting',
          urutan: 0,
        },
        {
          idPaket: 'wo-2',
          namaPaket: 'All-In Intimate Wedding Package',
          hargaPaket: 28000000,
          deskripsiPaket: 'Dekorasi, MUA, Dokumentasi, MC, Sound & Kru WO 8 orang',
          urutan: 1,
        },
      ],
      jadwalAktif: [
        {
          idJadwal: 'WO-701',
          namaAcara: 'Royal Wedding Anisa & Bagas',
          namaKlien: 'Keluarga Bpk. H. Darmawan',
          lokasi: 'Bale Hinggil Convention Hall',
          paket: 'All-In Intimate Wedding Package',
          hargaPaketDasar: 28000000,
          namaTambahan: 'Usher & Pagar Ayu Adat',
          hargaTambahan: 2000000,
          namaPic: 'Bpk. H. Darmawan',
          waPic: '081122334455',
          waktuMulai: makeTime(1, 7, 0),
          waktuSelesai: makeTime(1, 16, 0),
          tanggalMulai: makeDayStart(1),
          tanggalSelesaiEvent: makeDayStart(1),
          status: 'DP',
          hargaKotor: 30000000,
          diskon: 500000,
          dpDibayar: 15000000,
          catatan: 'Technical meeting semua vendor H-7 selesai.',
          sumber: '',
          woKoordinasi: {
            jmlUndangan: '500 Undangan (1.000 Pax Catering)',
            picGedung: 'Pak Hendra (Pengelola Bale Hinggil)',
            daftarVendor: 'Catering: Sari Rasa, Dekor: Flora Art, MUA: Kafela Bridal, Foto: Kafela Studio',
            linkRundown: 'https://docs.google.com/spreadsheets/d/rundown-anisa-bagas',
          },
        },
      ],
    },
    MC: {
      namaBrand: "Kafela's MC & Protocol",
      namaOwner: 'Iqbal Saefinnuha',
      jenisUsaha: 'Master of Ceremony (MC)',
      tagline: 'Professional Wedding, Formal & Bilingual Host',
      warnaTema: '#212121',
      paketList: [
        {
          idPaket: 'mc-1',
          namaPaket: 'MC Akad & Resepsi Pernikahan',
          hargaPaket: 1800000,
          deskripsiPaket: 'Pemandu acara akad nikah khidmat hingga resepsi selesai',
          urutan: 0,
        },
        {
          idPaket: 'mc-2',
          namaPaket: 'MC Gathering / Corporate Event',
          hargaPaket: 2500000,
          deskripsiPaket: 'Host interaktif lengkap dengan games & ice breaking',
          urutan: 1,
        },
      ],
      jadwalAktif: [
        {
          idJadwal: 'MC-501',
          namaAcara: 'Resepsi Pernikahan Zahra & Aldo',
          namaKlien: 'Aldo Pratama',
          lokasi: 'Ballroom Hotel Santika',
          paket: 'MC Akad & Resepsi Pernikahan',
          hargaPaketDasar: 1800000,
          namaTambahan: '',
          hargaTambahan: 0,
          namaPic: 'Aldo Pratama',
          waPic: '081299008877',
          waktuMulai: makeTime(0, 8, 0),
          waktuSelesai: makeTime(0, 14, 0),
          tanggalMulai: makeDayStart(0),
          tanggalSelesaiEvent: makeDayStart(0),
          status: 'Lunas',
          hargaKotor: 1800000,
          diskon: 0,
          dpDibayar: 1800000,
          catatan: 'Kirab adat Sunda menggunakan saxophonist.',
          sumber: '',
          mcProtokol: {
            bahasaGaya: 'Bahasa Indonesia & Pengantar Sunda Halus',
            dresscode: 'Jas Hitam Formal + Dasi Gold',
            tokohPenting: 'Saksi CPW: Prof. Dr. H. Ahmad Fauzi, M.Si | Sambutan: Drs. Bambang S.',
            catatanKhusus: 'Tidak ada sesi lempar bunga, diganti doorprize keluarga.',
          },
        },
      ],
    },
  };

  const chosen = presetMeta[preset];
  const archiveTime1 = new Date(y, m - 3, 14, 9, 0).getTime();
  const archiveTime2 = new Date(y, m - 4, 21, 10, 0).getTime();

  return {
    owner: {
      uid: 'demo-owner-kafela-001',
      namaOwner: chosen.namaOwner,
      namaBrand: chosen.namaBrand,
      noWhatsApp: '083132304649',
      jenisUsaha: chosen.jenisUsaha,
      paketAktif: 'Pro',
      tanggalDaftar: Date.now() - 20 * 86400000,
      tanggalLangganan: Date.now() + 25 * 86400000,
      username: 'kafelastudio',
      taglineWeb: chosen.tagline,
      linkIg: 'https://instagram.com/kafelastudio',
      linkTiktok: 'https://tiktok.com/@kafelastudio',
      lokasi1: 'Studio Pusat Cisaat - Sukabumi',
      lokasi2: 'Cabang Kota Bandung',
      lokasi3: '',
      logoBrandUrl: DEFAULT_LOGO_SVG,
      penempatanLogo: 'KEDUANYA',
      ttdUrl: DEFAULT_SIGNATURE_SVG,
      portofolioWeb: [],
      templateWaTagihan:
        'Halo kak [NAMA], kami dari [BRAND] ingin menginformasikan bahwa untuk acara *[ACARA]* di [LOKASI], masih terdapat sisa tagihan sebesar *[SISA]*.\n\nPembayaran dapat ditransfer ke:\n[REKENING]\n\nMohon untuk segera melakukan pelunasan ya kak. Terima kasih!',
      templateWaKonfirmasi:
        'Halo kak [NAMA], kami dari [BRAND] ingin mengkonfirmasi jadwal untuk acara *[ACARA]* pada *[TANGGAL]* di [LOKASI]. Apakah sudah siap?',
      templateWaBookingWeb:
        'Halo kak [NAMA], terima kasih sudah booking di [BRAND] untuk acara *[ACARA]* pada *[TANGGAL]*.\n\nTotal paket: [HARGA]\n\nSilakan transfer DP ke rekening:\n[REKENING]\n\nUntuk mengunci jadwal ya kak. Terima kasih!',
      warnaTema: chosen.warnaTema,
      isKacaGelap: true,
      opasitasOverlay: 'D9',
    },
    rekening: {
      bankUtama: 'BCA',
      rekUtama: '3770918273',
      namaUtama: chosen.namaOwner,
      bankAlternatif: 'DANA / Mandiri',
      rekAlternatif: '083132304649',
      namaAlternatif: chosen.namaOwner,
      linkPembayaran: 'https://kflsgnd.web.app/qris',
      catatanRekening: 'Mohon kirimkan bukti transfer setelah melakukan pembayaran DP atau Pelunasan.',
    },
    paketList: chosen.paketList,
    jadwalAktif: chosen.jadwalAktif,
    jadwalArsip: [
      {
        idJadwal: 'ARS-2026-01',
        namaAcara: 'Dokumentasi Wisuda Universitas',
        namaKlien: 'Rangga Saputra',
        lokasi: 'Studio Utama',
        paket: chosen.paketList[0].namaPaket,
        hargaPaketDasar: chosen.paketList[0].hargaPaket,
        namaTambahan: '',
        hargaTambahan: 0,
        namaPic: 'Rangga Saputra',
        waPic: '081277889900',
        waktuMulai: archiveTime1,
        waktuSelesai: archiveTime1 + 7200000,
        tanggalMulai: archiveTime1,
        tanggalSelesaiEvent: archiveTime1,
        status: 'Lunas',
        hargaKotor: chosen.paketList[0].hargaPaket,
        diskon: 0,
        dpDibayar: chosen.paketList[0].hargaPaket,
        catatan: 'Data terkompresi otomatis (> 60 hari) di arsip_kompresi.',
        sumber: '',
        isFromArchive: true,
        archiveDocId: `arsip_${new Date(archiveTime1).getFullYear()}_${new Date(archiveTime1).getMonth()}`,
      },
      {
        idJadwal: 'ARS-2026-02',
        namaAcara: 'Event Engagement Keluarga',
        namaKlien: 'Putri Wulandari',
        lokasi: 'Kediaman Mempelai',
        paket: chosen.paketList[1]?.namaPaket || chosen.paketList[0].namaPaket,
        hargaPaketDasar: chosen.paketList[1]?.hargaPaket || 1500000,
        namaTambahan: '',
        hargaTambahan: 0,
        namaPic: 'Putri Wulandari',
        waPic: '081344556677',
        waktuMulai: archiveTime2,
        waktuSelesai: archiveTime2 + 10800000,
        tanggalMulai: archiveTime2,
        tanggalSelesaiEvent: archiveTime2,
        status: 'DP',
        hargaKotor: chosen.paketList[1]?.hargaPaket || 1500000,
        diskon: 0,
        dpDibayar: 500000,
        catatan: 'Masih ada sisa pelunasan album cetak di gudang arsip.',
        sumber: '',
        isFromArchive: true,
        archiveDocId: `arsip_${new Date(archiveTime2).getFullYear()}_${new Date(archiveTime2).getMonth()}`,
      },
    ],
    timList: [
      {
        uid: 'tim-admin-01',
        nama: 'Nadia (Kasir Studio)',
        noWhatsApp: '081233445566',
        role: 'admin',
        posisi: 'Admin Kasir & CS',
        namaBrand: chosen.namaBrand,
        ownerParentId: 'demo-owner-kafela-001',
        tanggalDibuat: Date.now() - 10 * 86400000,
      },
      {
        uid: 'tim-kru-02',
        nama: 'Rizky Pratama',
        noWhatsApp: '085766778899',
        role: 'anggota',
        posisi: 'Fotografer Utama / Kru',
        namaBrand: chosen.namaBrand,
        ownerParentId: 'demo-owner-kafela-001',
        tanggalDibuat: Date.now() - 5 * 86400000,
      },
    ],
  };
}
