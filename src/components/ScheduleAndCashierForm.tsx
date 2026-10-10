import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Mic,
  Plus,
  Receipt,
  Sparkles,
  X,
} from 'lucide-react';
import {
  AttireModel,
  FotoTeknisModel,
  JadwalFotografi,
  McProtokolModel,
  PaketLayanan,
  WoKoordinasiModel,
} from '../types/kafela';
import {
  bersihkanTitik,
  formatRibuanInput,
  keRupiah,
} from '../utils/formatters';

interface ScheduleAndCashierFormProps {
  modeAwal?: 'KASIR_CEPAT' | 'AGENDA_LENGKAP';
  mode?: 'KASIR_CEPAT' | 'TAMBAH_AGENDA' | 'EDIT_JADWAL' | null;
  selectedDate?: Date;
  defaultDateMillis?: number;
  paketList: PaketLayanan[];
  jenisUsaha?: string;
  editItem?: JadwalFotografi | null;
  existingJadwal?: JadwalFotografi | null;
  allJadwalList?: JadwalFotografi[];
  onSave: (jadwal: JadwalFotografi, openStrukImmediately: boolean) => void;
  onOpenMasterPaket?: () => void;
  onCancel: () => void;
}

export const ScheduleAndCashierForm: React.FC<ScheduleAndCashierFormProps> = ({
  modeAwal,
  mode,
  selectedDate,
  defaultDateMillis,
  paketList,
  jenisUsaha = '',
  editItem,
  existingJadwal,
  allJadwalList = [],
  onSave,
  onOpenMasterPaket,
  onCancel,
}) => {
  const activeEditItem = editItem || existingJadwal || null;
  const resolvedInitialMode: 'KASIR_CEPAT' | 'AGENDA_LENGKAP' = activeEditItem
    ? 'AGENDA_LENGKAP'
    : modeAwal
    ? modeAwal
    : mode === 'KASIR_CEPAT'
    ? 'KASIR_CEPAT'
    : 'AGENDA_LENGKAP';

  const [formMode, setFormMode] = useState<'KASIR_CEPAT' | 'AGENDA_LENGKAP'>(
    resolvedInitialMode
  );

  const fallbackDateMs =
    (selectedDate instanceof Date && !Number.isNaN(selectedDate.getTime())
      ? selectedDate.getTime()
      : undefined) ||
    defaultDateMillis ||
    Date.now();

  const toDateInputStr = (ms: number) => {
    const d = new Date(ms || Date.now());
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const toTimeInputStr = (ms: number, fallback = '08:00') => {
    if (!ms || ms <= 0) return fallback;
    const d = new Date(ms);
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${min}`;
  };

  const [namaAcara, setNamaAcara] = useState(activeEditItem?.namaAcara || '');
  const [namaKlien, setNamaKlien] = useState(activeEditItem?.namaKlien || '');
  const [waKlien, setWaKlien] = useState(
    activeEditItem?.waPic && !activeEditItem.waPic.includes('tidak tersedia')
      ? activeEditItem.waPic
      : ''
  );
  const [paketNama, setPaketNama] = useState(
    activeEditItem?.paket || paketList[0]?.namaPaket || ''
  );
  const [lokasi, setLokasi] = useState(
    activeEditItem?.lokasi && activeEditItem.lokasi !== 'di tempat'
      ? activeEditItem.lokasi
      : 'Studio Utama'
  );

  const [tglMulaiStr, setTglMulaiStr] = useState(
    toDateInputStr(activeEditItem?.waktuMulai || fallbackDateMs)
  );
  const [tglSelesaiStr, setTglSelesaiStr] = useState(
    toDateInputStr(
      activeEditItem?.tanggalSelesaiEvent || activeEditItem?.waktuMulai || fallbackDateMs
    )
  );
  const [jamMulaiStr, setJamMulaiStr] = useState(
    toTimeInputStr(activeEditItem?.waktuMulai || 0, '09:00')
  );
  const [jamSelesaiStr, setJamSelesaiStr] = useState(
    activeEditItem?.waktuSelesai ? toTimeInputStr(activeEditItem.waktuSelesai, '11:00') : ''
  );

  const [hargaDasarStr, setHargaDasarStr] = useState(
    formatRibuanInput(
      String(
        activeEditItem
          ? activeEditItem.hargaPaketDasar || activeEditItem.hargaKotor
          : paketList[0]?.hargaPaket || 0
      )
    )
  );
  const [diskonStr, setDiskonStr] = useState(
    activeEditItem?.diskon ? formatRibuanInput(String(activeEditItem.diskon)) : ''
  );
  const [namaTambahan, setNamaTambahan] = useState(activeEditItem?.namaTambahan || '');
  const [hargaTambahanStr, setHargaTambahanStr] = useState(
    activeEditItem?.hargaTambahan
      ? formatRibuanInput(String(activeEditItem.hargaTambahan))
      : ''
  );

  const [statusBayar, setStatusBayar] = useState<'Booking' | 'DP' | 'Lunas'>(
    activeEditItem?.status === 'Booking' ||
      activeEditItem?.status === 'DP' ||
      activeEditItem?.status === 'Lunas'
      ? activeEditItem.status
      : formMode === 'KASIR_CEPAT'
      ? 'Lunas'
      : 'Booking'
  );
  const [nominalDpStr, setNominalDpStr] = useState(
    activeEditItem?.dpDibayar ? formatRibuanInput(String(activeEditItem.dpDibayar)) : ''
  );
  const [catatan, setCatatan] = useState(activeEditItem?.catatan || '');

  // Modul Spesifik Profesi (MUA, Foto, MC, WO)
  const [openMua, setOpenMua] = useState(Boolean(activeEditItem?.attire));
  const [attire, setAttire] = useState<AttireModel>({
    cpwModel: activeEditItem?.attire?.cpwModel || '',
    cpwUkuran: activeEditItem?.attire?.cpwUkuran || '',
    cppModel: activeEditItem?.attire?.cppModel || '',
    cppUkuran: activeEditItem?.attire?.cppUkuran || '',
    catatanAttire: activeEditItem?.attire?.catatanAttire || '',
  });

  const [openFoto, setOpenFoto] = useState(Boolean(activeEditItem?.fotoTeknis));
  const [fotoTeknis, setFotoTeknis] = useState<FotoTeknisModel>({
    jmlShooter: activeEditItem?.fotoTeknis?.jmlShooter || '',
    droneLighting: activeEditItem?.fotoTeknis?.droneLighting || '',
    namaKru: activeEditItem?.fotoTeknis?.namaKru || '',
    linkDrive: activeEditItem?.fotoTeknis?.linkDrive || '',
  });

  const [openMc, setOpenMc] = useState(Boolean(activeEditItem?.mcProtokol));
  const [mcProtokol, setMcProtokol] = useState<McProtokolModel>({
    bahasaGaya: activeEditItem?.mcProtokol?.bahasaGaya || '',
    dresscode: activeEditItem?.mcProtokol?.dresscode || '',
    tokohPenting: activeEditItem?.mcProtokol?.tokohPenting || '',
    catatanKhusus: activeEditItem?.mcProtokol?.catatanKhusus || '',
  });

  const [openWo, setOpenWo] = useState(Boolean(activeEditItem?.woKoordinasi));
  const [woKoordinasi, setWoKoordinasi] = useState<WoKoordinasiModel>({
    jmlUndangan: activeEditItem?.woKoordinasi?.jmlUndangan || '',
    picGedung: activeEditItem?.woKoordinasi?.picGedung || '',
    daftarVendor: activeEditItem?.woKoordinasi?.daftarVendor || '',
    linkRundown: activeEditItem?.woKoordinasi?.linkRundown || '',
  });

  useEffect(() => {
    if (!activeEditItem && formMode === 'KASIR_CEPAT') {
      setStatusBayar('Lunas');
      setLokasi('Studio Utama');
    }
  }, [formMode, activeEditItem]);

  const handlePaketChange = (namaBaru: string) => {
    setPaketNama(namaBaru);
    const cocok = paketList.find((p) => p.namaPaket === namaBaru);
    if (cocok) {
      setHargaDasarStr(formatRibuanInput(String(cocok.hargaPaket)));
    }
  };

  const hargaPaketDasar = bersihkanTitik(hargaDasarStr);
  const hargaTambahan = bersihkanTitik(hargaTambahanStr);
  const hargaTotalKotor = hargaPaketDasar + hargaTambahan;
  const diskon = bersihkanTitik(diskonStr);
  const tagihanBersih = Math.max(0, hargaTotalKotor - diskon);
  const nominalDp = bersihkanTitik(nominalDpStr);

  const generateSequentialInvoiceId = (targetMillis: number, existingList: JadwalFotografi[] = []): string => {
    const d = new Date(targetMillis || Date.now());
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    const dateCode = `${dd}${mm}${yy}`; // e.g. 190226

    const matchingOnDate = existingList.filter((j) => {
      const id = (j.idJadwal || '').toUpperCase();
      return id.includes(dateCode) || id.startsWith('INV' + dateCode);
    });

    const nextSeq = matchingOnDate.length + 1;
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

    if (isOffline) {
      const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
      const suffixIndex = Math.max(0, matchingOnDate.length - 1);
      const suffix = letters[suffixIndex % letters.length];
      return `inv${dateCode}/${nextSeq}${suffix}`;
    }

    return `inv${dateCode}/${nextSeq}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaKlien.trim() || !paketNama.trim()) {
      return;
    }
    // TODO: Implement quota check here, passing data from App.tsx via props.
    // Need to pass owner profile and current jadwal count to this component.

    const [yM, mM, dM] = tglMulaiStr.split('-').map(Number);
    const [jamM, minM] = (jamMulaiStr || '09:00').split(':').map(Number);

    const waktuMulaiMs =
      formMode === 'KASIR_CEPAT' && !activeEditItem
        ? Date.now()
        : new Date(yM, mM - 1, dM, jamM || 9, minM || 0, 0, 0).getTime();

    const tanggalMulaiMs = new Date(yM, mM - 1, dM, 0, 0, 0, 0).getTime();

    const [yS, mS, dS] = (tglSelesaiStr || tglMulaiStr).split('-').map(Number);
    const tanggalSelesaiMs = new Date(yS, mS - 1, dS, 0, 0, 0, 0).getTime();

    let waktuSelesaiMs = 0;
    if (jamSelesaiStr) {
      const [jamS, minS] = jamSelesaiStr.split(':').map(Number);
      waktuSelesaiMs = new Date(yM, mM - 1, dM, jamS || 11, minS || 0, 0, 0).getTime();
    }

    const finalAcara = namaAcara.trim()
      ? namaAcara.trim()
      : formMode === 'KASIR_CEPAT'
      ? `Studio - ${paketNama}`
      : `Event ${paketNama}`;

    const dpFinal =
      statusBayar === 'Lunas'
        ? tagihanBersih
        : statusBayar === 'DP'
        ? nominalDp
        : 0;

    const newJadwal: JadwalFotografi = {
      idJadwal: activeEditItem?.idJadwal || generateSequentialInvoiceId(waktuMulaiMs, allJadwalList),
      namaAcara: finalAcara,
      namaKlien: namaKlien.trim(),
      namaPic: namaKlien.trim(),
      waPic: waKlien.trim() || 'Whatsapp tidak tersedia',
      paket: paketNama.trim(),
      lokasi: lokasi.trim() || 'di tempat',
      status: statusBayar,
      hargaPaketDasar,
      namaTambahan: namaTambahan.trim(),
      hargaTambahan,
      hargaKotor: hargaTotalKotor,
      diskon,
      dpDibayar: dpFinal,
      catatan: catatan.trim(),
      sumber: formMode === 'KASIR_CEPAT' ? 'KASIR_POS' : activeEditItem?.sumber || '',
      waktuMulai: waktuMulaiMs,
      waktuSelesai: waktuSelesaiMs,
      tanggalMulai: tanggalMulaiMs,
      tanggalSelesaiEvent: Math.max(tanggalMulaiMs, tanggalSelesaiMs),
    };

    if (attire.cpwModel || attire.cppModel || attire.catatanAttire) {
      newJadwal.attire = attire;
    }
    if (fotoTeknis.jmlShooter || fotoTeknis.namaKru || fotoTeknis.linkDrive) {
      newJadwal.fotoTeknis = fotoTeknis;
    }
    if (mcProtokol.bahasaGaya || mcProtokol.tokohPenting || mcProtokol.catatanKhusus) {
      newJadwal.mcProtokol = mcProtokol;
    }
    if (woKoordinasi.jmlUndangan || woKoordinasi.daftarVendor || woKoordinasi.linkRundown) {
      newJadwal.woKoordinasi = woKoordinasi;
    }

    onSave(newJadwal, true);
  };

  return (
    <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg">
      {/* Header Form */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">
            {activeEditItem
              ? 'Edit Jadwal & Transaksi'
              : formMode === 'KASIR_CEPAT'
              ? 'Kasir Cepat'
              : 'Tambah Jadwal Baru'}
          </h3>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Mode Switcher (Kasir Cepat Walk-in vs Form Agenda Lengkap) */}
      {!activeEditItem && (
        <div className="px-5 pt-3">
          <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-slate-950 border border-slate-800">
            <button
              type="button"
              onClick={() => setFormMode('KASIR_CEPAT')}
              className={`py-1.5 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                formMode === 'KASIR_CEPAT'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Kasir Cepat
            </button>
            <button
              type="button"
              onClick={() => setFormMode('AGENDA_LENGKAP')}
              className={`py-1.5 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                formMode === 'AGENDA_LENGKAP'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Agenda Acara Lengkap
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
        {/* Baris 1: Nama Klien & Nomor WA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-400 font-medium mb-1">
              Yth. Nama Klien / Pelanggan *
            </label>
            <input
              type="text"
              required
              placeholder="Cth: Rina Sari"
              value={namaKlien}
              onChange={(e) => setNamaKlien(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 font-medium mb-1">
              Nomor WhatsApp (Kirim Struk)
            </label>
            <input
              type="tel"
              placeholder="0812xxxx (Opsional)"
              value={waKlien}
              onChange={(e) => setWaKlien(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white font-mono focus:border-sky-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Baris 2: Pilih Paket Layanan */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-slate-400 font-medium">Pilih Paket Layanan *</label>
            <button
              type="button"
              onClick={onOpenMasterPaket}
              className="text-[11px] font-bold text-sky-400 hover:text-sky-300 cursor-pointer"
            >
              + Tambah / Atur Paket
            </button>
          </div>
          <select
            value={paketNama}
            onChange={(e) => handlePaketChange(e.target.value)}
            className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
          >
            {paketList.map((p) => (
              <option key={p.idPaket} value={p.namaPaket}>
                {p.namaPaket} — {keRupiah(p.hargaPaket)}
              </option>
            ))}
          </select>
        </div>

        {/* Kolom Agenda Lengkap (Nama Acara, Tanggal, Jam, Lokasi) */}
        {formMode === 'AGENDA_LENGKAP' && (
          <div className="space-y-3 pt-1 border-t border-slate-800/80">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Nama Acara</label>
                <input
                  type="text"
                  placeholder="Cth: Pemotretan Buku Tahunan"
                  value={namaAcara}
                  onChange={(e) => setNamaAcara(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Lokasi Acara</label>
                <input
                  type="text"
                  placeholder="Cth: Studio Utama / Gedung Sate"
                  value={lokasi}
                  onChange={(e) => setLokasi(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Tgl Mulai</label>
                <input
                  type="date"
                  value={tglMulaiStr}
                  onChange={(e) => {
                    setTglMulaiStr(e.target.value);
                    if (e.target.value > tglSelesaiStr) setTglSelesaiStr(e.target.value);
                  }}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-white font-mono text-[11px]"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Tgl Selesai</label>
                <input
                  type="date"
                  value={tglSelesaiStr}
                  min={tglMulaiStr}
                  onChange={(e) => setTglSelesaiStr(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-white font-mono text-[11px]"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Jam Mulai</label>
                <input
                  type="time"
                  value={jamMulaiStr}
                  onChange={(e) => setJamMulaiStr(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-white font-mono text-[11px]"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Jam Selesai</label>
                <input
                  type="time"
                  value={jamSelesaiStr}
                  onChange={(e) => setJamSelesaiStr(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-white font-mono text-[11px]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Baris 3: Harga Paket, Diskon, Tambahan */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Harga Paket (Rp)</label>
            <input
              type="text"
              value={hargaDasarStr}
              onChange={(e) => setHargaDasarStr(formatRibuanInput(e.target.value))}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white font-mono font-semibold"
            />
          </div>
          <div>
            <label className="block text-slate-400 font-medium mb-1">Diskon (Opsional Rp)</label>
            <input
              type="text"
              placeholder="0"
              value={diskonStr}
              onChange={(e) => setDiskonStr(formatRibuanInput(e.target.value))}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-rose-300 font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-400 font-medium mb-1">
              Item Tambahan (Opsional)
            </label>
            <input
              type="text"
              placeholder="Cth: Cetak 10R / Extra Orang"
              value={namaTambahan}
              onChange={(e) => setNamaTambahan(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-slate-400 font-medium mb-1">
              Biaya Tambahan (Rp)
            </label>
            <input
              type="text"
              placeholder="0"
              value={hargaTambahanStr}
              onChange={(e) => setHargaTambahanStr(formatRibuanInput(e.target.value))}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sky-300 font-mono"
            />
          </div>
        </div>

        {/* Status Pembayaran Radio (Booking / DP / Lunas) */}
        <div className="rounded-lg bg-slate-950 border border-slate-800 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Status Pembayaran:</span>
            <span className="font-mono font-bold text-emerald-400">
              Total Bersih: {keRupiah(tagihanBersih)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(['Booking', 'DP', 'Lunas'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusBayar(st)}
                className={`py-2 rounded-lg font-bold text-xs border transition-colors cursor-pointer ${
                  statusBayar === st
                    ? st === 'Lunas'
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                      : st === 'DP'
                      ? 'bg-rose-600/20 border-rose-500 text-rose-300'
                      : 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {st === 'Booking' ? 'Belum DP' : st === 'DP' ? 'Sudah DP' : 'Lunas'}
              </button>
            ))}
          </div>

          {statusBayar === 'DP' && (
            <div className="pt-1">
              <label className="block text-slate-300 font-semibold mb-1">
                Nominal DP yang Dibayar (Rp) *
              </label>
              <input
                type="text"
                placeholder="Masukkan nominal uang muka"
                value={nominalDpStr}
                onChange={(e) => setNominalDpStr(formatRibuanInput(e.target.value))}
                className="w-full rounded-lg bg-slate-900 border border-rose-500/50 px-3 py-2 text-white font-mono font-bold"
              />
            </div>
          )}
        </div>

        {/* Catatan */}
        <div>
          <label className="block text-slate-400 font-medium mb-1">Catatan (Opsional)</label>
          <textarea
            rows={2}
            placeholder="Catatan tambahan untuk tim atau struk..."
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-white"
          />
        </div>

        {/* 4 MODUL KHUSUS PROFESI (MUA, FOTO, MC, WO) — Persis bs_tambahjadwal.xml */}
        {formMode === 'AGENDA_LENGKAP' && (
          <div className="space-y-2 pt-1">
            {/* 1. Modul MUA */}
            {(jenisUsaha.toLowerCase().includes('mua') ||
              jenisUsaha.toLowerCase().includes('pakaian') ||
              openMua) && (
              <div className="rounded-lg border border-purple-500/30 bg-purple-950/15 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenMua(!openMua)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs font-bold text-purple-300 hover:bg-purple-900/20 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Rincian Busana & Fitting (MUA)</span>
                  </span>
                  {openMua ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {openMua && (
                  <div className="p-3 space-y-2.5 border-t border-purple-500/20">
                    <input
                      type="text"
                      placeholder="Model & Warna Baju CPW"
                      value={attire.cpwModel}
                      onChange={(e) => setAttire({ ...attire, cpwModel: e.target.value })}
                      className="w-full rounded bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-white"
                    />
                    <input
                      type="text"
                      placeholder="Ukuran CPW (LD / Pinggang / Sepatu / Hijab)"
                      value={attire.cpwUkuran}
                      onChange={(e) => setAttire({ ...attire, cpwUkuran: e.target.value })}
                      className="w-full rounded bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-white"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Busana CPP"
                        value={attire.cppModel}
                        onChange={(e) => setAttire({ ...attire, cppModel: e.target.value })}
                        className="w-full rounded bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-white"
                      />
                      <input
                        type="text"
                        placeholder="Ukuran CPP (Jas/Peci/Selop)"
                        value={attire.cppUkuran}
                        onChange={(e) => setAttire({ ...attire, cppUkuran: e.target.value })}
                        className="w-full rounded bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Baju Ortu, Besan & Aksesoris/Siger"
                      value={attire.catatanAttire}
                      onChange={(e) => setAttire({ ...attire, catatanAttire: e.target.value })}
                      className="w-full rounded bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-white"
                    />
                  </div>
                )}
              </div>
            )}

            {/* 2. Modul Fotografi */}
            {(jenisUsaha.toLowerCase().includes('foto') ||
              jenisUsaha.toLowerCase().includes('video') ||
              openFoto) && (
              <div className="rounded-lg border border-sky-500/30 bg-sky-950/15 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFoto(!openFoto)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs font-bold text-sky-300 hover:bg-sky-900/20 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Camera className="w-3.5 h-3.5" />
                    <span>Detail Teknis & Tim Dokumentasi (Foto/Video)</span>
                  </span>
                  {openFoto ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {openFoto && (
                  <div className="p-3 space-y-2.5 border-t border-sky-500/20">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Jumlah Fotografer & Video"
                        value={fotoTeknis.jmlShooter}
                        onChange={(e) =>
                          setFotoTeknis({ ...fotoTeknis, jmlShooter: e.target.value })
                        }
                        className="w-full rounded bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-white"
                      />
                      <input
                        type="text"
                        placeholder="Pilot Drone / Lighting"
                        value={fotoTeknis.droneLighting}
                        onChange={(e) =>
                          setFotoTeknis({ ...fotoTeknis, droneLighting: e.target.value })
                        }
                        className="w-full rounded bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Nama-nama Crew yang Bertugas"
                      value={fotoTeknis.namaKru}
                      onChange={(e) => setFotoTeknis({ ...fotoTeknis, namaKru: e.target.value })}
                      className="w-full rounded bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-white"
                    />
                    <input
                      type="text"
                      placeholder="Link Google Drive File Mentah / Request Khusus"
                      value={fotoTeknis.linkDrive}
                      onChange={(e) => setFotoTeknis({ ...fotoTeknis, linkDrive: e.target.value })}
                      className="w-full rounded bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-white"
                    />
                  </div>
                )}
              </div>
            )}

            {/* 3. Modul MC */}
            {(jenisUsaha.toLowerCase().includes('mc') || openMc) && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-950/15 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenMc(!openMc)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs font-bold text-amber-300 hover:bg-amber-900/20 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Mic className="w-3.5 h-3.5" />
                    <span>Protokol & Catatan Khusus MC</span>
                  </span>
                  {openMc ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {openMc && (
                  <div className="p-3 space-y-2.5 border-t border-amber-500/20">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Bahasa / Gaya Acara"
                        value={mcProtokol.bahasaGaya}
                        onChange={(e) =>
                          setMcProtokol({ ...mcProtokol, bahasaGaya: e.target.value })
                        }
                        className="w-full rounded bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-white"
                      />
                      <input
                        type="text"
                        placeholder="Dresscode MC"
                        value={mcProtokol.dresscode}
                        onChange={(e) =>
                          setMcProtokol({ ...mcProtokol, dresscode: e.target.value })
                        }
                        className="w-full rounded bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Nama Saksi / Tokoh Penting & Gelar"
                      value={mcProtokol.tokohPenting}
                      onChange={(e) =>
                        setMcProtokol({ ...mcProtokol, tokohPenting: e.target.value })
                      }
                      className="w-full rounded bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-white"
                    />
                  </div>
                )}
              </div>
            )}

            {/* 4. Modul WO */}
            {(jenisUsaha.toLowerCase().includes('wo') || openWo) && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/15 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenWo(!openWo)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs font-bold text-emerald-300 hover:bg-emerald-900/20 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <ClipboardList className="w-3.5 h-3.5" />
                    <span>Koordinasi Vendor & Rundown (WO)</span>
                  </span>
                  {openWo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {openWo && (
                  <div className="p-3 space-y-2.5 border-t border-emerald-500/20">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Jumlah Tamu / Porsi Catering"
                        value={woKoordinasi.jmlUndangan}
                        onChange={(e) =>
                          setWoKoordinasi({ ...woKoordinasi, jmlUndangan: e.target.value })
                        }
                        className="w-full rounded bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-white"
                      />
                      <input
                        type="text"
                        placeholder="PIC Venue / Gedung"
                        value={woKoordinasi.picGedung}
                        onChange={(e) =>
                          setWoKoordinasi({ ...woKoordinasi, picGedung: e.target.value })
                        }
                        className="w-full rounded bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Daftar Vendor (Catering, Dekor, Sound, MUA, Foto)"
                      value={woKoordinasi.daftarVendor}
                      onChange={(e) =>
                        setWoKoordinasi({ ...woKoordinasi, daftarVendor: e.target.value })
                      }
                      className="w-full rounded bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-white"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tombol Simpan & Keluarkan Struk */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 py-3 px-4 text-xs font-bold text-white shadow-md cursor-pointer transition-colors"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              {editItem
                ? 'Simpan Perubahan & Tampilkan Struk'
                : formMode === 'KASIR_CEPAT'
                ? 'Simpan Transaksi & Langsung Cetak Struk'
                : 'Simpan Jadwal & Buka Struk'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
