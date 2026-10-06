import { JadwalFotografi, OwnerProfile, RekeningModel } from '../types/kafela';

export function keRupiah(nominal: number): string {
  const angka = Math.round(Number(nominal) || 0);
  return 'Rp ' + angka.toLocaleString('id-ID');
}

export function formatRibuanInput(val: string): string {
  const clean = val.replace(/[^0-9]/g, '');
  if (!clean) return '';
  return Number(clean).toLocaleString('id-ID');
}

export function bersihkanTitik(val: string): number {
  const clean = val.replace(/[^0-9]/g, '');
  return parseInt(clean, 10) || 0;
}

export function formatNomorWA(nomor: string): string {
  let bersih = (nomor || '').replace(/[^0-9]/g, '');
  if (bersih.startsWith('0')) {
    bersih = '62' + bersih.substring(1);
  } else if (bersih.startsWith('8')) {
    bersih = '62' + bersih;
  }
  return bersih;
}

export function waKeEmailSistem(waInput: string): string {
  let waBersih = waInput.replace(/[^0-9]/g, '');
  if (waBersih.startsWith('62')) {
    waBersih = '0' + waBersih.substring(2);
  }
  return `${waBersih}@kafelaagenda.com`;
}

export function formatTanggalIndo(ms: number, pendek = false): string {
  if (!ms || ms <= 0) return '-';
  const d = new Date(ms);
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: pendek ? 'short' : 'long',
    year: 'numeric',
  });
}

export function formatHariTanggalIndo(ms: number): string {
  if (!ms || ms <= 0) return '-';
  const d = new Date(ms);
  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function formatJamWIB(ms: number): string {
  if (!ms || ms <= 0) return '08:00';
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function formatRekeningTeks(rekening: RekeningModel): string {
  const lines: string[] = [];
  if (rekening.bankUtama && rekening.rekUtama) {
    lines.push(`Bank ${rekening.bankUtama}: ${rekening.rekUtama} (a.n ${rekening.namaUtama || '-'})`);
  }
  if (rekening.bankAlternatif && rekening.rekAlternatif) {
    lines.push(`Alternatif ${rekening.bankAlternatif}: ${rekening.rekAlternatif} (a.n ${rekening.namaAlternatif || '-'})`);
  }
  if (rekening.linkPembayaran) {
    lines.push(`QRIS / Link: ${rekening.linkPembayaran}`);
  }
  return lines.length > 0 ? lines.join('\n') : '(Rekening belum diatur)';
}

export function bangunPesanWA(
  jadwal: JadwalFotografi,
  owner: OwnerProfile,
  rekening: RekeningModel,
  modePesan?: 'TAGIHAN' | 'KONFIRMASI' | 'WEB_BOOKING'
): string {
  const statusKecil = (jadwal.status || '').toLowerCase();
  const totalBersih = Math.max(0, jadwal.hargaKotor - jadwal.diskon);
  const sisaTagihan = statusKecil === 'lunas' ? 0 : Math.max(0, totalBersih - jadwal.dpDibayar);

  const infoRekening = formatRekeningTeks(rekening);
  const tglAcaraTeks = formatHariTanggalIndo(jadwal.waktuMulai);

  let template = owner.templateWaTagihan;
  if (modePesan === 'WEB_BOOKING' || (!modePesan && jadwal.dpDibayar === 0 && statusKecil !== 'lunas')) {
    template = owner.templateWaBookingWeb;
  } else if (modePesan === 'KONFIRMASI' || (!modePesan && statusKecil === 'lunas')) {
    template = owner.templateWaKonfirmasi;
  }

  return template
    .replace(/\[NAMA\]/g, jadwal.namaKlien || 'Kak')
    .replace(/\[ACARA\]/g, jadwal.namaAcara || jadwal.paket)
    .replace(/\[LOKASI\]/g, jadwal.lokasi || 'Studio')
    .replace(/\[BRAND\]/g, owner.namaBrand || "Kafela's Studio")
    .replace(/\[TANGGAL\]/g, tglAcaraTeks)
    .replace(/\[HARGA\]/g, keRupiah(totalBersih))
    .replace(/\[SISA\]/g, keRupiah(sisaTagihan))
    .replace(/\[REKENING\]/g, infoRekening);
}

/**
 * Port 1:1 dari SignaturePhotoExtractor.kt Android:
 * Mengekstrak goresan tanda tangan dari foto kertas dengan algoritma dilatasi Euclidean nyata (20% - 200%)
 * dan pembersih bayangan kertas otomatis, lalu melakukan auto-crop rapat.
 */
export function ekstrakTandaTanganDariKertasCanvas(
  imgElement: HTMLImageElement,
  persenTebal = 100,
  persenBersih = 70
): string {
  const maxDimensi = 750;
  const scale =
    imgElement.width > maxDimensi || imgElement.height > maxDimensi
      ? maxDimensi / Math.max(imgElement.width, imgElement.height)
      : 1;

  const w = Math.max(1, Math.round(imgElement.width * scale));
  const h = Math.max(1, Math.round(imgElement.height * scale));

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = w;
  tempCanvas.height = h;
  const ctx = tempCanvas.getContext('2d');
  if (!ctx) return '';

  ctx.drawImage(imgElement, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  const lum = new Int32Array(w * h);
  let totalLum = 0;

  for (let i = 0; i < w * h; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const l = Math.floor((r * 299 + g * 587 + b * 114) / 1000);
    lum[i] = l;
    totalLum += l;
  }

  const rataRataLum = Math.floor(totalLum / (w * h));
  const toleransiBersih = Math.round(170 + (persenBersih / 100) * 75);
  const batasTinta = Math.min(toleransiBersih, Math.floor(rataRataLum * 0.84));

  const maskInti = new Uint8Array(w * h);
  let adaTinta = false;

  for (let i = 0; i < w * h; i++) {
    if (lum[i] < batasTinta) {
      maskInti[i] = 1;
      adaTinta = true;
    }
  }

  if (!adaTinta) {
    for (let i = 0; i < w * h; i++) {
      if (lum[i] < 205) {
        maskInti[i] = 1;
      }
    }
  }

  const radiusMekar =
    persenTebal >= 180
      ? 4
      : persenTebal >= 140
      ? 3
      : persenTebal >= 100
      ? 2
      : persenTebal >= 60
      ? 1
      : 0;

  const outAlpha = new Uint8Array(w * h);
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (maskInti[idx] === 1) {
        outAlpha[idx] = 255;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;

        if (radiusMekar > 0) {
          const maxJarakKuadrat = radiusMekar * radiusMekar;
          for (let dy = -radiusMekar; dy <= radiusMekar; dy++) {
            const ny = y + dy;
            if (ny < 0 || ny >= h) continue;
            for (let dx = -radiusMekar; dx <= radiusMekar; dx++) {
              const nx = x + dx;
              if (nx < 0 || nx >= w) continue;
              const jarakKuadrat = dx * dx + dy * dy;
              if (jarakKuadrat <= maxJarakKuadrat) {
                const targetIdx = ny * w + nx;
                const alphaTambahan =
                  jarakKuadrat <= 2
                    ? 255
                    : jarakKuadrat <= 6
                    ? 230
                    : jarakKuadrat <= 12
                    ? 190
                    : 140;
                if (alphaTambahan > outAlpha[targetIdx]) {
                  outAlpha[targetIdx] = alphaTambahan;
                }
                if (nx < minX) minX = nx;
                if (nx > maxX) maxX = nx;
                if (ny < minY) minY = ny;
                if (ny > maxY) maxY = ny;
              }
            }
          }
        }
      }
    }
  }

  // Warna tinta pulpen royal blue gelap elegan (#152238)
  const rTinta = 21;
  const gTinta = 34;
  const bTinta = 56;

  for (let i = 0; i < w * h; i++) {
    const a = outAlpha[i];
    if (a > 30) {
      data[i * 4] = rTinta;
      data[i * 4 + 1] = gTinta;
      data[i * 4 + 2] = bTinta;
      data[i * 4 + 3] = a;
    } else {
      data[i * 4] = 0;
      data[i * 4 + 1] = 0;
      data[i * 4 + 2] = 0;
      data[i * 4 + 3] = 0;
    }
  }

  ctx.putImageData(imageData, 0, 0);

  if (maxX <= minX || maxY <= minY) {
    return tempCanvas.toDataURL('image/png');
  }

  const pad = 12;
  const cropX = Math.max(0, minX - pad);
  const cropY = Math.max(0, minY - pad);
  const cropW = Math.min(w - cropX, maxX - minX + pad * 2);
  const cropH = Math.min(h - cropY, maxY - minY + pad * 2);

  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = cropW;
  cropCanvas.height = cropH;
  const cropCtx = cropCanvas.getContext('2d');
  if (!cropCtx) return tempCanvas.toDataURL('image/png');

  cropCtx.drawImage(tempCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
  return cropCanvas.toDataURL('image/png');
}
