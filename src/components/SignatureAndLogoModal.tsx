import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  Check,
  Eraser,
  Image as ImageIcon,
  PenTool,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { OwnerProfile, PenempatanLogoMode } from '../types/kafela';
import { ekstrakTandaTanganDariKertasCanvas } from '../utils/formatters';

interface SignatureAndLogoModalProps {
  owner: OwnerProfile;
  onSave: (updates: Partial<OwnerProfile>) => void;
  onClose: () => void;
}

export const SignatureAndLogoModal: React.FC<SignatureAndLogoModalProps> = ({
  owner,
  onSave,
  onClose,
}) => {
  const [logoUrl, setLogoUrl] = useState<string>(owner.logoBrandUrl || '');
  const [penempatanLogo, setPenempatanLogo] = useState<PenempatanLogoMode>(
    owner.penempatanLogo || 'KEDUANYA'
  );
  const [ttdUrl, setTtdUrl] = useState<string>(owner.ttdUrl || '');
  const [tabMode, setTabMode] = useState<'UPLOAD' | 'GORES'>('UPLOAD');

  // Slider Ekstraksi Foto Kertas (Persis dia_tandatangan.xml)
  const [persenTebal, setPersenTebal] = useState<number>(100);
  const [persenBersih, setPersenBersih] = useState<number>(70);
  const [rawPaperImg, setRawPaperImg] = useState<HTMLImageElement | null>(null);

  // Canvas Gores Layar
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Re-run extractor saat slider digeser
  useEffect(() => {
    if (rawPaperImg) {
      const hasil = ekstrakTandaTanganDariKertasCanvas(rawPaperImg, persenTebal, persenBersih);
      if (hasil) setTtdUrl(hasil);
    }
  }, [rawPaperImg, persenTebal, persenBersih]);

  /**
   * Auto-Crop Center Square 1:1 (Persis autoCropCenterSquare di PengaturanActivity.kt)
   */
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const sisi = Math.min(img.width, img.height);
        const startX = (img.width - sisi) / 2;
        const startY = (img.height - sisi) / 2;
        const targetSize = Math.min(512, sisi);

        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, startX, startY, sisi, sisi, 0, 0, targetSize, targetSize);
          setLogoUrl(canvas.toDataURL('image/png'));
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  /**
   * Pilih Foto Tanda Tangan Kertas -> Ekstraksi Tinta Otomatis
   */
  const handlePaperPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        setRawPaperImg(img);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Gores Layar Handlers
  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#152238';
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const moveDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const endDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = drawCanvasRef.current;
    if (canvas) {
      setTtdUrl(canvas.toDataURL('image/png'));
    }
  };

  const clearDrawCanvas = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    setTtdUrl('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">
              Pengaturan Tampilan Struk (Logo, Watermark & Tanda Tangan)
            </h3>
            <p className="text-xs text-slate-400">
              Atur logo brand, watermark tengah, dan tanda tangan digital untuk invoice
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* BAGIAN 1: LOGO BRAND & WATERMARK */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-sky-400">1. Logo Brand & Watermark Struk</h4>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl border border-slate-700 bg-white flex items-center justify-center overflow-hidden shrink-0">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo Brand"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-7 h-7 text-slate-400" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <label className="inline-flex items-center justify-center gap-2 w-full rounded-lg border border-sky-500/60 bg-sky-500/10 hover:bg-sky-500/20 px-4 py-2 text-xs font-semibold text-sky-300 cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Pilih / Ganti Logo (Auto Crop 1:1 Tengah)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileChange}
                    className="hidden"
                  />
                </label>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    className="w-full text-center text-xs font-semibold text-rose-400 hover:text-rose-300 cursor-pointer"
                  >
                    Hapus Logo dari Struk
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <p className="text-xs font-semibold text-slate-300">
                Opsi Penempatan Logo di Struk Nota:
              </p>
              {(
                [
                  {
                    val: 'KEDUANYA',
                    label: 'Tampil di Keduanya (Header Samping + Watermark Tengah)',
                  },
                  {
                    val: 'SAMPING',
                    label: 'Hanya di Header Samping (Tanpa Watermark Logo)',
                  },
                  {
                    val: 'WATERMARK',
                    label: 'Hanya jadi Watermark di Tengah (Nama Brand Rata Tengah)',
                  },
                  {
                    val: 'TIDAK_TAMPIL',
                    label: 'Jangan Tampilkan Logo di Struk',
                  },
                ] as { val: PenempatanLogoMode; label: string }[]
              ).map((opt) => (
                <label
                  key={opt.val}
                  className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer py-1"
                >
                  <input
                    type="radio"
                    name="penempatanLogo"
                    checked={penempatanLogo === opt.val}
                    onChange={() => setPenempatanLogo(opt.val)}
                    className="accent-sky-500"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
              <p className="text-[11px] italic text-emerald-400">
                *Jika logo dimatikan atau tidak ada, nama brand otomatis rata tengah (center).
              </p>
            </div>
          </div>

          <div className="border-t border-slate-800" />

          {/* BAGIAN 2: TANDA TANGAN DIGITAL OWNER */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-sky-400">2. Tanda Tangan Digital Struk</h4>
              {ttdUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setTtdUrl('');
                    setRawPaperImg(null);
                  }}
                  className="flex items-center gap-1 text-xs font-semibold text-rose-400 hover:text-rose-300 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Tanda Tangan</span>
                </button>
              )}
            </div>

            {/* Toggle Metode TTD */}
            <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-slate-950 border border-slate-800">
              <button
                type="button"
                onClick={() => setTabMode('UPLOAD')}
                className={`flex items-center justify-center gap-2 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  tabMode === 'UPLOAD'
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Foto Kertas (Ekstrak Otomatis)</span>
              </button>
              <button
                type="button"
                onClick={() => setTabMode('GORES')}
                className={`flex items-center justify-center gap-2 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  tabMode === 'GORES'
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Gores Layar Langsung</span>
              </button>
            </div>

            {tabMode === 'UPLOAD' ? (
              <div className="space-y-3">
                <div className="relative h-40 rounded-xl bg-white border-2 border-dashed border-slate-400 flex flex-col items-center justify-center p-4 overflow-hidden">
                  {ttdUrl ? (
                    <img
                      src={ttdUrl}
                      alt="Preview Tanda Tangan"
                      referrerPolicy="no-referrer"
                      className="max-h-28 max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-slate-500">
                      <Camera className="w-8 h-8 mx-auto mb-1 text-indigo-500" />
                      <p className="text-xs font-semibold text-slate-700">
                        Unggah Foto Tanda Tangan di Kertas Putih
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Latar kertas akan dihapus otomatis menjadi transparan
                      </p>
                    </div>
                  )}
                </div>

                <label className="flex items-center justify-center gap-2 w-full rounded-lg border border-indigo-500/60 bg-indigo-500/10 hover:bg-indigo-500/20 py-2 text-xs font-semibold text-indigo-300 cursor-pointer transition-colors">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Pilih / Ganti Foto Tanda Tangan Kertas</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePaperPhotoChange}
                    className="hidden"
                  />
                </label>

                {/* Panel 2 Slider Ekstraksi Fisik (Persis SignaturePhotoExtractor.kt) */}
                {rawPaperImg && (
                  <div className="rounded-xl bg-slate-950 border border-slate-800 p-3.5 space-y-3">
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-300">
                          Ketebalan Tinta Pulpen (Dilatasi hingga 200%)
                        </span>
                        <span className="font-mono text-pink-400">{persenTebal}%</span>
                      </div>
                      <input
                        type="range"
                        min={20}
                        max={200}
                        value={persenTebal}
                        onChange={(e) => setPersenTebal(Number(e.target.value))}
                        className="w-full accent-pink-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-300">Pembersih Bayangan Kertas</span>
                        <span className="font-mono text-emerald-400">{persenBersih}%</span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={100}
                        value={persenBersih}
                        onChange={(e) => setPersenBersih(Number(e.target.value))}
                        className="w-full accent-emerald-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative rounded-xl bg-white border border-slate-300 overflow-hidden">
                  <canvas
                    ref={drawCanvasRef}
                    width={500}
                    height={170}
                    onMouseDown={startDraw}
                    onMouseMove={moveDraw}
                    onMouseUp={endDraw}
                    onMouseLeave={endDraw}
                    className="w-full h-[170px] cursor-crosshair"
                  />
                  <div className="pointer-events-none absolute bottom-3 inset-x-8 border-b border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400">
                      Goreskan tanda tangan dengan mouse / touchpad di sini
                    </span>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={clearDrawCanvas}
                    className="flex items-center gap-1 text-xs font-semibold text-rose-400 hover:text-rose-300 cursor-pointer"
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    <span>Bersihkan Goresan</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-800 bg-slate-950">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              onSave({
                logoBrandUrl: logoUrl,
                penempatanLogo,
                ttdUrl,
              });
              onClose();
            }}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Simpan Pengaturan Struk</span>
          </button>
        </div>
      </div>
    </div>
  );
};
