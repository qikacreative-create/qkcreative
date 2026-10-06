import React, { useState } from 'react';
import {
  CheckCircle2,
  Printer,
  Send,
  Bluetooth,
  X,
  FileImage,
  Share2,
} from 'lucide-react';
import { JadwalFotografi, OwnerProfile, RekeningModel } from '../types/kafela';
import {
  formatJamWIB,
  formatNomorWA,
  formatTanggalIndo,
  keRupiah,
} from '../utils/formatters';

interface StrukModalProps {
  jadwal: JadwalFotografi;
  owner: OwnerProfile;
  rekening?: RekeningModel;
  namaAdminAktif?: string;
  onClose: () => void;
}

const KNOWN_PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb',
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
  '0000ff00-0000-1000-8000-00805f9b34fb',
  '0000ffe0-0000-1000-8000-00805f9b34fb',
  '0000ae30-0000-1000-8000-00805f9b34fb',
];

const KNOWN_PRINTER_CHARACTERISTICS = [
  '00002af1-0000-1000-8000-00805f9b34fb',
  'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f',
  '49535343-8841-43f4-a8d4-ecbe34729bb3',
  '0000ff02-0000-1000-8000-00805f9b34fb',
  '0000ffe1-0000-1000-8000-00805f9b34fb',
  '0000ae01-0000-1000-8000-00805f9b34fb',
];

export const StrukModal: React.FC<StrukModalProps> = ({
  jadwal,
  owner,
  namaAdminAktif,
  onClose,
}) => {
  const [isGeneratingPng, setIsGeneratingPng] = useState(false);
  const [btStatus, setBtStatus] = useState<string | null>(null);
  const [showRawBtFallback, setShowRawBtFallback] = useState(false);

  const adminName = namaAdminAktif || owner.namaOwner || owner.namaBrand || 'Admin Studio';
  const isLunas = (jadwal.status || '').toLowerCase() === 'lunas';
  const noStruk = (jadwal.idJadwal || 'INV001').slice(0, 8).toUpperCase();
  const tanggalBayar = formatTanggalIndo(Date.now(), true);

  const hargaPaketDasar =
    jadwal.hargaPaketDasar > 0 ? jadwal.hargaPaketDasar : jadwal.hargaKotor;
  const hargaTambahan = jadwal.hargaTambahan || 0;
  const totalTarif = hargaPaketDasar + hargaTambahan;
  const diskon = jadwal.diskon || 0;
  const tagihanSetelahDiskon = Math.max(0, totalTarif - diskon);

  const dpDibayar = jadwal.dpDibayar || 0;
  const sisaTagihan = isLunas ? 0 : Math.max(0, tagihanSetelahDiskon - dpDibayar);
  const nominalDibayar = isLunas ? tagihanSetelahDiskon : dpDibayar;

  const modeLogo = owner.penempatanLogo || 'KEDUANYA';
  const adaLogo = Boolean(owner.logoBrandUrl) && modeLogo !== 'TIDAK_TAMPIL';
  const tampilLogoSamping =
    adaLogo && (modeLogo === 'KEDUANYA' || modeLogo === 'SAMPING');
  const tampilLogoWatermark =
    adaLogo && (modeLogo === 'KEDUANYA' || modeLogo === 'WATERMARK');
  const adaTtd = Boolean(owner.ttdUrl);

  const watermarkBrand = (owner.namaBrand || "KAFELA'S AGENDA").toUpperCase();

  /**
   * Render struk menjadi gambar PNG beresolusi tinggi (lengkap dengan watermark miring -25°,
   * logo, rincian harga, dan tanda tangan) persis seperti di aplikasi Android.
   * Dilengkapi proteksi otomatis terhadap CORS Tainted Canvas.
   */
  const renderCanvasReceipt = async (includeExternalImages: boolean): Promise<string> => {
    const canvas = document.createElement('canvas');
    const w = 680;
    const h = 980;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // 1. Background Kertas Putih Bersih
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);

    // 2. Watermark Teks Miring Berulang (-25 derajat ala Struk Bank / DANA)
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate((-25 * Math.PI) / 180);
    ctx.font = '700 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.045)';
    const patternText = `${watermarkBrand}     `;
    const textWidth = ctx.measureText(patternText).width || 240;
    let row = 0;
    for (let y = -h; y <= h; y += 68) {
      const offset = row % 2 === 0 ? 0 : textWidth / 2;
      for (let x = -w + offset; x <= w; x += textWidth) {
        ctx.fillText(patternText, x, y);
      }
      row++;
    }
    ctx.restore();

    const loadImg = (src: string): Promise<HTMLImageElement | null> =>
      new Promise((resolve) => {
        if (!src || !includeExternalImages) return resolve(null);
        const img = new Image();
        if (!src.startsWith('data:')) {
          img.crossOrigin = 'anonymous';
        }
        const timer = setTimeout(() => resolve(null), 3500);
        img.onload = () => {
          clearTimeout(timer);
          resolve(img);
        };
        img.onerror = () => {
          clearTimeout(timer);
          resolve(null);
        };
        img.src = src;
      });

    // 3. Watermark Logo Tengah (Jika Aktif)
    if (tampilLogoWatermark && owner.logoBrandUrl) {
      const logoImg = await loadImg(owner.logoBrandUrl);
      if (logoImg) {
        ctx.save();
        ctx.globalAlpha = 0.06;
        ctx.drawImage(logoImg, w / 2 - 110, h / 2 - 110, 220, 220);
        ctx.restore();
      }
    }

    let curY = 44;

    // 4. Indikator Sukses Atas
    ctx.font = '700 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#2E7D32';
    ctx.textAlign = 'center';
    ctx.fillText(
      isLunas ? '✓ Pembayaran Lunas!' : '✓ Pembayaran Tersimpan!',
      w / 2,
      curY
    );
    curY += 36;

    // 5. Header Brand & Logo Samping
    if (tampilLogoSamping && owner.logoBrandUrl) {
      const logoImg = await loadImg(owner.logoBrandUrl);
      if (logoImg) {
        ctx.drawImage(logoImg, w / 2 - 170, curY - 22, 54, 54);
        ctx.textAlign = 'left';
        ctx.font = '800 26px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#0F172A';
        ctx.fillText(owner.namaBrand || "Kafela's Agenda", w / 2 - 102, curY + 4);
        ctx.font = '500 14px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#64748B';
        ctx.fillText('Struk Pembayaran Digital Resmi', w / 2 - 102, curY + 26);
      } else {
        ctx.textAlign = 'center';
        ctx.font = '800 26px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#0F172A';
        ctx.fillText(owner.namaBrand || "Kafela's Agenda", w / 2, curY + 4);
        ctx.font = '500 14px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#64748B';
        ctx.fillText('Struk Pembayaran Digital Resmi', w / 2, curY + 26);
      }
    } else {
      ctx.textAlign = 'center';
      ctx.font = '800 26px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#0F172A';
      ctx.fillText(owner.namaBrand || "Kafela's Agenda", w / 2, curY + 4);
      ctx.font = '500 14px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.fillText('Struk Pembayaran Digital Resmi', w / 2, curY + 26);
    }
    curY += 52;

    if (isLunas) {
      ctx.textAlign = 'center';
      ctx.font = '700 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#2E7D32';
      ctx.fillText('BUKTI PELUNASAN', w / 2, curY);
      curY += 28;
    } else {
      curY += 10;
    }

    const drawRow = (
      label: string,
      val: string,
      valColor = '#0F172A',
      boldVal = false
    ) => {
      ctx.textAlign = 'left';
      ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.fillText(label, 48, curY);

      ctx.textAlign = 'right';
      ctx.font = `${boldVal ? '700' : '600'} 16px "JetBrains Mono", monospace`;
      ctx.fillStyle = valColor;
      ctx.fillText(val, w - 48, curY);
      curY += 30;
    };

    const drawDashedLine = () => {
      curY += 4;
      ctx.save();
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(48, curY);
      ctx.lineTo(w - 48, curY);
      ctx.stroke();
      ctx.restore();
      curY += 24;
    };

    drawRow('No. Invoice', noStruk);
    drawRow('Tanggal Bayar', tanggalBayar);
    drawRow('Admin', adminName);

    drawDashedLine();

    drawRow('Paket', jadwal.paket || '-');
    drawRow('Yth. Bpk/Ibu', jadwal.namaKlien || '-', '#0F172A', true);
    drawRow('Acara', jadwal.namaAcara || '-');
    drawRow('Lokasi', jadwal.lokasi || 'Studio');
    drawRow(
      'Waktu Acara',
      `${formatTanggalIndo(jadwal.waktuMulai, true)}, ${formatJamWIB(jadwal.waktuMulai)} WIB`
    );

    if (jadwal.catatan && jadwal.catatan !== '-') {
      ctx.textAlign = 'left';
      ctx.font = '500 15px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.fillText('Catatan:', 48, curY);
      curY += 22;
      ctx.font = 'italic 15px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#334155';
      ctx.fillText(jadwal.catatan.slice(0, 68), 48, curY);
      curY += 26;
    }

    drawDashedLine();

    if (hargaTambahan > 0) {
      drawRow(jadwal.paket || 'Harga Paket Dasar', keRupiah(hargaPaketDasar));
      drawRow(
        jadwal.namaTambahan ? `Tambahan: ${jadwal.namaTambahan}` : 'Biaya Tambahan',
        `+ ${keRupiah(hargaTambahan)}`,
        '#2980B9',
        true
      );
    } else {
      drawRow('Total Tarif', keRupiah(totalTarif));
    }

    if (diskon > 0) {
      drawRow('Diskon', `- ${keRupiah(diskon)}`, '#D32F2F', true);
    }

    drawRow('Total Tagihan', keRupiah(tagihanSetelahDiskon), '#1976D2', true);

    if (isLunas && dpDibayar > 0 && dpDibayar < tagihanSetelahDiskon) {
      drawRow('Telah di-DP Sebelumnya', `- ${keRupiah(dpDibayar)}`, '#E74C3C');
    }

    curY += 6;
    if (isLunas) {
      drawRow('Status Pembayaran', 'LUNAS (Rp 0)', '#2E7D32', true);
    } else {
      drawRow('Telah Dibayar (DP)', keRupiah(nominalDibayar), '#0F172A', true);
      drawRow('Sisa Pelunasan', keRupiah(sisaTagihan), '#C62828', true);
    }

    // 6. Tanda Tangan Owner
    curY += 16;
    if (adaTtd && owner.ttdUrl) {
      const ttdImg = await loadImg(owner.ttdUrl);
      if (ttdImg) {
        const ttdW = 170;
        const ttdH = 72;
        ctx.drawImage(ttdImg, w / 2 - ttdW / 2, curY, ttdW, ttdH);
        curY += ttdH + 8;
      }
      ctx.textAlign = 'center';
      ctx.font = '700 15px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#1E293B';
      ctx.fillText(`( ${owner.namaBrand} )`, w / 2, curY);
      curY += 28;
    }

    ctx.textAlign = 'center';
    ctx.font = 'italic 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#64748B';
    ctx.fillText(
      'Terima kasih. Simpan struk ini sebagai bukti pembayaran yang sah.',
      w / 2,
      curY + 12
    );

    return canvas.toDataURL('image/png');
  };

  const generateReceiptPngDataUrl = async (): Promise<string> => {
    try {
      return await renderCanvasReceipt(true);
    } catch {
      // Fallback jika gambar Logo/TTD dari URL eksternal memicu CORS Tainted Canvas
      return await renderCanvasReceipt(false);
    }
  };

  const fileNamePng = `Struk_${(jadwal.namaKlien || 'Klien').replace(/[^a-zA-Z0-9]/g, '_')}_${noStruk}.png`;

  /**
   * 1. Simpan Gambar Struk (PNG) ke Perangkat
   */
  const handleDownloadPng = async () => {
    setIsGeneratingPng(true);
    setBtStatus('Menyiapkan gambar struk...');
    try {
      const dataUrl = await generateReceiptPngDataUrl();
      if (dataUrl) {
        const link = document.createElement('a');
        link.download = fileNamePng;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setBtStatus('✓ Gambar struk berhasil diunduh ke perangkat!');
        setTimeout(() => setBtStatus(null), 3500);
      }
    } catch {
      setBtStatus('Gagal menyimpan gambar struk.');
    } finally {
      setIsGeneratingPng(false);
    }
  };

  /**
   * 2. Bagikan Gambar Struk (Web Share API File PNG seperti di HP Android / iOS / PC)
   */
  const handleShareReceiptImage = async () => {
    setIsGeneratingPng(true);
    setBtStatus('Menyiapkan gambar struk untuk dibagikan...');
    try {
      const dataUrl = await generateReceiptPngDataUrl();
      if (!dataUrl) {
        setBtStatus('Gagal membuat gambar struk.');
        return;
      }

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], fileNamePng, { type: 'image/png' });

      const navShare = navigator as Navigator & {
        canShare?: (data?: ShareData) => boolean;
      };

      if (navShare.share && (!navShare.canShare || navShare.canShare({ files: [file] }))) {
        await navShare.share({
          title: `Struk ${owner.namaBrand} - ${jadwal.namaKlien}`,
          text: `Struk pembayaran ${jadwal.namaKlien} (${noStruk}) - ${owner.namaBrand}`,
          files: [file],
        });
        setBtStatus('✓ Gambar struk berhasil dibagikan!');
        setTimeout(() => setBtStatus(null), 3000);
        return;
      }

      // Fallback jika browser tidak mendukung share file langsung -> Unduh otomatis
      const link = document.createElement('a');
      link.download = fileNamePng;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setBtStatus('✓ Gambar struk diunduh (Siap dilampirkan ke WA/Aplikasi lain).');
      setTimeout(() => setBtStatus(null), 4000);
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        await handleDownloadPng();
      } else {
        setBtStatus(null);
      }
    } finally {
      setIsGeneratingPng(false);
    }
  };

  /**
   * 3. Kirim ke WhatsApp Klien (Tanpa Terblokir Popup Blocker + Otomatis Unduh PNG)
   */
  const handleSendWhatsAppWeb = async () => {
    const cleanPhone = formatNomorWA(jadwal.waPic);
    const pesan = `Halo Bapak/Ibu *${jadwal.namaKlien}*, berikut rincian struk bukti pembayaran Anda (*#${noStruk}*) dari *${owner.namaBrand}*:\n\n• Acara: *${jadwal.namaAcara}*\n• Paket: *${jadwal.paket}*\n• Waktu: *${formatTanggalIndo(jadwal.waktuMulai, true)}, ${formatJamWIB(jadwal.waktuMulai)} WIB*\n• Total Tagihan: *${keRupiah(tagihanSetelahDiskon)}*\n• Status: *${isLunas ? 'LUNAS' : `DP (${keRupiah(nominalDibayar)}) — Sisa: ${keRupiah(sisaTagihan)}`}*\n\nTerima kasih banyak atas kepercayaan Anda!`;

    const waUrl = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(pesan)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(pesan)}`;

    // Buka WhatsApp langsung pada klik user agar tidak diblokir browser
    const waLink = document.createElement('a');
    waLink.href = waUrl;
    waLink.target = '_blank';
    waLink.rel = 'noopener noreferrer';
    document.body.appendChild(waLink);
    waLink.click();
    document.body.removeChild(waLink);

    // Sekaligus unduh gambar struknya
    await handleDownloadPng();
  };

  /**
   * 4. Print Biasa (Printer Kasir USB / Inkjet / PC) via Iframe Cetak Bersih
   */
  const handleStandardPrint = async () => {
    setIsGeneratingPng(true);
    setBtStatus('Menyiapkan dokumen cetak struk...');
    try {
      const dataUrl = await generateReceiptPngDataUrl();
      if (!dataUrl) {
        window.print();
        return;
      }

      const oldIframe = document.getElementById('kafela-receipt-print-frame');
      if (oldIframe) oldIframe.remove();

      const iframe = document.createElement('iframe');
      iframe.id = 'kafela-receipt-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc) {
        window.print();
        return;
      }

      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Struk ${noStruk} - ${jadwal.namaKlien}</title>
            <style>
              @page { margin: 4mm; }
              body {
                margin: 0;
                padding: 0;
                background: #ffffff;
                display: flex;
                justify-content: center;
                align-items: flex-start;
              }
              img {
                width: 100%;
                max-width: 340px;
                height: auto;
                display: block;
              }
            </style>
          </head>
          <body>
            <img id="receipt-img" src="${dataUrl}" />
            <script>
              const img = document.getElementById('receipt-img');
              img.onload = function() {
                setTimeout(function() {
                  window.focus();
                  window.print();
                }, 150);
              };
            </script>
          </body>
        </html>
      `);
      doc.close();
      setBtStatus('✓ Dialog cetak printer dibuka!');
      setTimeout(() => setBtStatus(null), 3500);
    } catch {
      window.print();
    } finally {
      setIsGeneratingPng(false);
    }
  };

  /**
   * Format teks ESC/POS 32 karakter (58mm) untuk Printer Thermal Bluetooth & RawBT
   */
  const buildEscPosText = (): string => {
    const lineSep = '--------------------------------\n';
    const eqSep = '================================\n';
    return [
      '\x1B\x40', // Init printer
      '\x1B\x61\x01', // Center align
      '\x1B\x21\x10', // Double height
      `${(owner.namaBrand || "KAFELA'S STUDIO").toUpperCase()}\n`,
      '\x1B\x21\x00', // Normal text
      'Struk Pembayaran Resmi\n',
      eqSep,
      isLunas ? 'BUKTI PELUNASAN\n' : 'INVOICE PEMBAYARAN\n',
      lineSep,
      '\x1B\x61\x00', // Left align
      `No.Inv  : ${noStruk}\n`,
      `Tanggal : ${tanggalBayar}\n`,
      `Admin   : ${adminName}\n`,
      lineSep,
      `Klien   : ${jadwal.namaKlien}\n`,
      `Acara   : ${jadwal.namaAcara}\n`,
      `Paket   : ${jadwal.paket}\n`,
      `Lokasi  : ${jadwal.lokasi}\n`,
      `Waktu   : ${formatTanggalIndo(jadwal.waktuMulai, true)} ${formatJamWIB(jadwal.waktuMulai)}\n`,
      lineSep,
      hargaTambahan > 0
        ? `Paket   : ${keRupiah(hargaPaketDasar)}\nTambahan: +${keRupiah(hargaTambahan)}\n`
        : `Tarif   : ${keRupiah(totalTarif)}\n`,
      diskon > 0 ? `Diskon  : -${keRupiah(diskon)}\n` : '',
      `Tagihan : ${keRupiah(tagihanSetelahDiskon)}\n`,
      `Dibayar : ${keRupiah(nominalDibayar)}\n`,
      !isLunas ? `Sisa    : ${keRupiah(sisaTagihan)}\n` : '',
      eqSep,
      '\x1B\x61\x01', // Center align
      `STATUS: ${isLunas ? 'LUNAS (Rp 0)' : 'SUDAH DP'}\n\n`,
      'Terima kasih atas kepercayaan\n',
      'Anda. Simpan struk ini sebagai\n',
      'bukti pembayaran yang sah.\n\n\n\n',
    ].join('');
  };

  /**
   * 5. Cetak ke Printer Kasir Bluetooth (Multi-UUID + Chunk 64 Byte + Fallback RawBT)
   */
  const handleWebBluetoothPrint = async () => {
    setShowRawBtFallback(false);

    type BleCharacteristic = {
      properties?: {
        write?: boolean;
        writeWithoutResponse?: boolean;
      };
      writeValue?: (v: Uint8Array) => Promise<void>;
      writeValueWithoutResponse?: (v: Uint8Array) => Promise<void>;
    };

    type BleService = {
      getCharacteristic: (uuid: string) => Promise<BleCharacteristic>;
      getCharacteristics: () => Promise<BleCharacteristic[]>;
    };

    type BleServer = {
      getPrimaryService: (uuid: string) => Promise<BleService>;
      getPrimaryServices: () => Promise<BleService[]>;
    };

    const nav = navigator as unknown as {
      bluetooth?: {
        requestDevice: (opts: unknown) => Promise<{
          name?: string;
          gatt?: {
            connect: () => Promise<BleServer>;
          };
        }>;
      };
    };

    if (!nav.bluetooth) {
      setBtStatus(
        'Browser ini tidak mendukung Web Bluetooth langsung. Gunakan Chrome atau tombol RawBT di bawah.'
      );
      setShowRawBtFallback(true);
      return;
    }

    try {
      setBtStatus('Mencari printer thermal Bluetooth...');
      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: KNOWN_PRINTER_SERVICES,
      });

      setBtStatus(`Menghubungkan ke ${device.name || 'Printer Bluetooth'}...`);
      const server = await device.gatt?.connect();
      if (!server) {
        throw new Error('Gagal terhubung ke GATT server printer.');
      }

      let targetChar: BleCharacteristic | null = null;

      // 1. Cari dari daftar UUID service & characteristic printer thermal populer
      for (const sUuid of KNOWN_PRINTER_SERVICES) {
        if (targetChar) break;
        try {
          const service = await server.getPrimaryService(sUuid);
          for (const cUuid of KNOWN_PRINTER_CHARACTERISTICS) {
            try {
              const ch = await service.getCharacteristic(cUuid);
              if (ch) {
                targetChar = ch;
                break;
              }
            } catch {
              // Lanjut cek characteristic berikutnya
            }
          }
          if (!targetChar) {
            const chars = await service.getCharacteristics();
            targetChar =
              chars.find(
                (c) => c.properties?.writeWithoutResponse || c.properties?.write
              ) ||
              chars[0] ||
              null;
          }
        } catch {
          // Lanjut cek service berikutnya
        }
      }

      // 2. Jika belum ketemu, scan seluruh primary services yang tersedia di printer
      if (!targetChar) {
        try {
          const allServices = await server.getPrimaryServices();
          for (const svc of allServices) {
            const chars = await svc.getCharacteristics();
            const writable = chars.find(
              (c) => c.properties?.writeWithoutResponse || c.properties?.write
            );
            if (writable) {
              targetChar = writable;
              break;
            }
          }
        } catch {
          // Abaikan
        }
      }

      if (!targetChar) {
        throw new Error('Characteristic tulis (Write) printer tidak ditemukan.');
      }

      setBtStatus(`Mencetak struk ke ${device.name || 'Printer'}...`);
      const encoder = new TextEncoder();
      const rawBytes = encoder.encode(buildEscPosText());

      // Kirim bertahap per 64 byte dengan jeda 25ms agar buffer printer thermal tidak penuh/gagal
      const chunkSize = 64;
      for (let i = 0; i < rawBytes.length; i += chunkSize) {
        const chunk = rawBytes.slice(i, i + chunkSize);
        if (
          targetChar.properties?.writeWithoutResponse &&
          typeof targetChar.writeValueWithoutResponse === 'function'
        ) {
          await targetChar.writeValueWithoutResponse(chunk);
        } else if (typeof targetChar.writeValue === 'function') {
          await targetChar.writeValue(chunk);
        }
        await new Promise((r) => setTimeout(r, 25));
      }

      setBtStatus(`✓ Struk berhasil dicetak ke ${device.name || 'Printer Bluetooth'}!`);
      setTimeout(() => setBtStatus(null), 4000);
    } catch (err) {
      const msg = (err as Error)?.message || '';
      if (msg.toLowerCase().includes('cancelled') || msg.toLowerCase().includes('canceled')) {
        setBtStatus('Pemilihan printer Bluetooth dibatalkan.');
        setTimeout(() => setBtStatus(null), 2500);
        return;
      }
      setBtStatus(
        'Gagal kirim langsung via Web Bluetooth. Jika memakai HP Android, Anda juga bisa cetak via RawBT di bawah.'
      );
      setShowRawBtFallback(true);
    }
  };

  /**
   * Fallback Cetak ke Aplikasi RawBT Thermal Printer (Android)
   */
  const handlePrintViaRawBT = () => {
    const escPos = buildEscPosText();
    const base64Data = btoa(unescape(encodeURIComponent(escPos)));
    const rawBtUrl = `intent:base64,${base64Data}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;
    const a = document.createElement('a');
    a.href = rawBtUrl;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto">
      <div className="relative w-full max-w-md my-auto">
        {/* Tombol Close Atas */}
        <div className="flex justify-end mb-2 no-print">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-700 hover:bg-rose-600 text-white shadow-lg cursor-pointer transition-colors"
            title="Tutup Struk"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* KERTAS STRUK RESMI (Persis layout_struk_lunas.xml & layout_struk_dp.xml) */}
        <div
          id="printable-receipt-area"
          className="relative overflow-hidden rounded-xl bg-white text-slate-900 shadow-2xl border border-slate-200"
        >
          {/* 1. WATERMARK TEKS MIRING BERULANG ALA STRUK BANK / DANA */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden select-none opacity-[0.045]"
          >
            <div className="-rotate-[25deg] scale-150 flex flex-col gap-7 pt-6">
              {Array.from({ length: 14 }).map((_, rowIdx) => (
                <div
                  key={rowIdx}
                  className="whitespace-nowrap text-[15px] font-extrabold tracking-[0.18em] text-black"
                >
                  {Array.from({ length: 5 })
                    .map(() => watermarkBrand)
                    .join('     ')}
                </div>
              ))}
            </div>
          </div>

          {/* 2. WATERMARK LOGO BRAND DI TENGAH */}
          {tampilLogoWatermark && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
            >
              <img
                src={owner.logoBrandUrl}
                alt="Watermark Studio"
                referrerPolicy="no-referrer"
                className="w-40 h-40 object-contain opacity-[0.06]"
              />
            </div>
          )}

          {/* 3. KONTEN DATA STRUK DI DEPAN */}
          <div className="relative z-10 px-6 py-5 text-xs">
            {/* Indikator Sukses */}
            <div className="flex items-center justify-center gap-1.5 mb-2 text-emerald-700 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{isLunas ? 'Pembayaran Lunas!' : 'Pembayaran Tersimpan!'}</span>
            </div>

            {/* Header: Logo Samping atau Tengah */}
            <div className="flex items-center justify-center gap-3 mt-1 mb-2">
              {tampilLogoSamping && (
                <div className="w-12 h-12 rounded-lg border border-slate-300 overflow-hidden shrink-0 bg-white">
                  <img
                    src={owner.logoBrandUrl}
                    alt={owner.namaBrand}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className={tampilLogoSamping ? 'text-left' : 'text-center'}>
                <h2 className="text-lg font-extrabold text-black tracking-tight">
                  {owner.namaBrand || "Kafela's Agenda"}
                </h2>
                <p className="text-[11px] text-slate-600">Struk Pembayaran Digital</p>
              </div>
            </div>

            {isLunas && (
              <div className="text-center font-bold text-emerald-700 text-xs mb-2.5 tracking-wide">
                BUKTI PELUNASAN
              </div>
            )}

            {/* Rincian Nomor & Tanggal */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">No.</span>
                <span className="font-mono font-semibold text-black">{noStruk}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tanggal Bayar</span>
                <span className="font-mono text-black">{tanggalBayar}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Admin</span>
                <span className="text-black font-medium">{adminName}</span>
              </div>
            </div>

            <div className="my-2.5 border-t-2 border-dashed border-slate-300" />

            {/* Rincian Acara & Klien */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500 shrink-0">Paket</span>
                <span className="text-black font-semibold text-right">{jadwal.paket}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500 shrink-0">Yth. Bpk/Ibu</span>
                <span className="text-black font-bold text-right">{jadwal.namaKlien}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500 shrink-0">Acara</span>
                <span className="text-black text-right">{jadwal.namaAcara}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500 shrink-0">Lokasi</span>
                <span className="text-slate-800 text-right">{jadwal.lokasi}</span>
              </div>
              {jadwal.waktuMulai > 0 && (
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500 shrink-0">Waktu</span>
                  <span className="font-mono text-slate-800 text-right">
                    {formatTanggalIndo(jadwal.waktuMulai, true)}, {formatJamWIB(jadwal.waktuMulai)} WIB
                  </span>
                </div>
              )}
            </div>

            {jadwal.catatan && jadwal.catatan.trim() !== '' && jadwal.catatan !== '-' && (
              <div className="mt-2">
                <span className="text-slate-500 text-[11px] block">Catatan:</span>
                <p className="text-slate-800 italic text-xs mt-0.5 whitespace-pre-line">
                  {jadwal.catatan}
                </p>
              </div>
            )}

            <div className="my-2.5 border-t-2 border-dashed border-slate-300" />

            {/* Rincian Biaya */}
            <div className="space-y-1 text-xs">
              {hargaTambahan > 0 ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{jadwal.paket || 'Harga Paket'}</span>
                    <span className="font-mono text-slate-900">{keRupiah(hargaPaketDasar)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">
                      {jadwal.namaTambahan ? `Tambahan: ${jadwal.namaTambahan}` : 'Tambahan'}
                    </span>
                    <span className="font-mono font-bold text-sky-700">
                      + {keRupiah(hargaTambahan)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Tarif</span>
                  <span className="font-mono text-slate-900">{keRupiah(totalTarif)}</span>
                </div>
              )}

              {diskon > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Diskon</span>
                  <span className="font-mono font-bold text-rose-600">- {keRupiah(diskon)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-slate-500">Total Tagihan</span>
                <span className="font-mono font-bold text-blue-700">
                  {keRupiah(tagihanSetelahDiskon)}
                </span>
              </div>

              {isLunas && dpDibayar > 0 && dpDibayar < tagihanSetelahDiskon && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Telah di-DP (Uang Muka)</span>
                  <span className="font-mono text-rose-600">- {keRupiah(dpDibayar)}</span>
                </div>
              )}
            </div>

            <div className="my-2 border-t border-slate-200" />

            {/* Nominal Dibayar & Sisa */}
            {isLunas ? (
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-600 font-medium">Sisa Pembayaran</span>
                <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded text-xs">
                  Rp. 0 (LUNAS)
                </span>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-black font-medium">Telah Dibayar</span>
                  <span className="font-mono font-bold text-black">{keRupiah(nominalDibayar)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-rose-700 font-medium">Sisa Pelunasan</span>
                  <span className="font-mono font-bold text-rose-700">{keRupiah(sisaTagihan)}</span>
                </div>
              </div>
            )}

            {/* Wadah Tanda Tangan Owner Dinamis */}
            {adaTtd && (
              <div className="mt-3 mb-1 flex flex-col items-center justify-center">
                <img
                  src={owner.ttdUrl}
                  alt="Tanda Tangan"
                  referrerPolicy="no-referrer"
                  className="max-w-[175px] max-h-[70px] object-contain -mb-1"
                />
                <span className="text-[11px] font-bold text-slate-800">
                  ( {owner.namaBrand} )
                </span>
              </div>
            )}

            <p className="mt-2 text-center text-[10px] italic text-slate-500 leading-relaxed">
              Terima kasih.
              <br />
              Simpan struk ini sebagai bukti yang sah.
            </p>
          </div>
        </div>

        {/* Status Info / Bluetooth / Share */}
        {btStatus && (
          <div className="mt-2 rounded-lg bg-slate-800 border border-slate-700 text-sky-300 px-3 py-2 text-center text-xs font-medium no-print">
            {btStatus}
          </div>
        )}

        {showRawBtFallback && (
          <div className="mt-2 no-print">
            <button
              type="button"
              onClick={handlePrintViaRawBT}
              className="w-full py-2.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow"
            >
              <Bluetooth className="w-4 h-4 shrink-0" />
              <span>Cetak via Aplikasi RawBT (Khusus HP Android)</span>
            </button>
          </div>
        )}

        {/* AREA TOMBOL AKSI STRUK (Lengkap: Bagikan Gambar, WA, Print Biasa, Print Bluetooth, Unduh PNG) */}
        <div className="mt-3 space-y-2 no-print">
          {/* Tombol Utama: Bagikan Gambar Struk (Seperti APK Android) */}
          <button
            type="button"
            onClick={handleShareReceiptImage}
            disabled={isGeneratingPng}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#2980B9] hover:bg-[#2471A3] py-3 px-4 text-xs font-extrabold text-white shadow-lg cursor-pointer transition-colors"
          >
            <Share2 className="w-4 h-4 shrink-0" />
            <span>
              {isGeneratingPng ? 'Memproses Gambar Struk...' : 'Bagikan Gambar Struk (Share)'}
            </span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleSendWhatsAppWeb}
              disabled={isGeneratingPng}
              className="flex items-center justify-center gap-2 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] py-2.5 px-3 text-xs font-bold text-white shadow cursor-pointer transition-colors"
            >
              <Send className="w-4 h-4 shrink-0" />
              <span>Kirim WA Klien</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={isGeneratingPng}
              className="flex items-center justify-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 py-2.5 px-3 text-xs font-bold text-white shadow cursor-pointer transition-colors"
            >
              <FileImage className="w-4 h-4 text-sky-400 shrink-0" />
              <span>Simpan Gambar PNG</span>
            </button>

            <button
              type="button"
              onClick={handleStandardPrint}
              disabled={isGeneratingPng}
              className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 py-2.5 px-3 text-xs font-semibold text-slate-200 cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Print Biasa (USB/PC)</span>
            </button>

            <button
              type="button"
              onClick={handleWebBluetoothPrint}
              className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 py-2.5 px-3 text-xs font-semibold text-slate-200 cursor-pointer transition-colors"
            >
              <Bluetooth className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Print Bluetooth</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
