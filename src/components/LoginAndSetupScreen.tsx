import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  Lock,
  Phone,
  Play,
  Settings,
  User,
  X,
} from 'lucide-react';
import { FirebaseCustomConfig, UserRoleType } from '../types/kafela';
import { ProfessionPresetKey } from '../services/demoDataSeeder';
import {
  getSavedFirebaseConfig,
  loginFirebaseWithGoogle,
  loginFirebaseWithWA,
  saveFirebaseConfig,
  signupFirebaseWithWA,
} from '../services/firebaseClient';
import { PWAInstallButton, PWAInstallFloatingBanner } from '../hooks/usePWAInstall';

interface LoginAndSetupScreenProps {
  onStartDemo: (preset: ProfessionPresetKey) => void;
  onLoginFirebaseSuccess: (session: {
    uid: string;
    targetOwnerId: string;
    role: UserRoleType;
    displayName: string;
  }) => void;
}

export const LoginAndSetupScreen: React.FC<LoginAndSetupScreenProps> = ({
  onStartDemo,
  onLoginFirebaseSuccess,
}) => {
  const [authTab, setAuthTab] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [waInput, setWaInput] = useState('');
  const [password, setPassword] = useState('');
  const [konfirmasiPassword, setKonfirmasiPassword] = useState('');
  const [namaOwner, setNamaOwner] = useState('');
  const [namaBrand, setNamaBrand] = useState('');
  const [setujuSyarat, setSetujuSyarat] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSyaratModal, setShowSyaratModal] = useState(false);
  const [showFbConfigModal, setShowFbConfigModal] = useState(false);
  const [showDemoPickerModal, setShowDemoPickerModal] = useState(false);

  const savedCfg = getSavedFirebaseConfig();
  const [fbConfig, setFbConfig] = useState<FirebaseCustomConfig>(savedCfg);
  const [fbSavedToast, setFbSavedToast] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!waInput.trim() || !password.trim()) {
      setErrorMsg('Harap isi Nomor WhatsApp dan Kata Sandi!');
      return;
    }
    if (!setujuSyarat) {
      setErrorMsg('Anda harus mencentang persetujuan Syarat & Ketentuan terlebih dahulu.');
      return;
    }

    try {
      setLoading(true);
      const session = await loginFirebaseWithWA(waInput, password);
      onLoginFirebaseSuccess(session);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal masuk ke sistem';
      setErrorMsg(`Login Gagal: Pastikan Nomor WA & Sandi benar. (${msg})`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!namaOwner.trim() || !namaBrand.trim() || !waInput.trim() || !password.trim()) {
      setErrorMsg('Harap lengkapi semua kolom pendaftaran!');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Kata sandi minimal 6 karakter!');
      return;
    }
    if (password !== konfirmasiPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok!');
      return;
    }
    if (!setujuSyarat) {
      setErrorMsg('Anda harus menyetujui Syarat & Ketentuan layanan.');
      return;
    }

    try {
      setLoading(true);
      const session = await signupFirebaseWithWA(namaOwner, namaBrand, waInput, password);
      onLoginFirebaseSuccess(session);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mendaftarkan akun';
      setErrorMsg(`Gagal Daftar: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    if (!setujuSyarat) {
      setErrorMsg('Silakan centang persetujuan Syarat & Ketentuan terlebih dahulu!');
      return;
    }

    try {
      setLoading(true);
      const session = await loginFirebaseWithGoogle();
      onLoginFirebaseSuccess(session);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal login Google';
      setErrorMsg(`Login Google Gagal: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFbConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveFirebaseConfig(fbConfig);
    setFbSavedToast(true);
    setTimeout(() => {
      setFbSavedToast(false);
      setShowFbConfigModal(false);
    }, 900);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 select-none"
      style={{ backgroundColor: '#121212', color: '#FFFFFF' }}
    >
      {/* KARTU TENGAH PERSIS activity_login.xml & activity_signup.xml */}
      <div
        className="w-full max-w-[440px] rounded-2xl p-6 sm:p-8 shadow-2xl border"
        style={{ backgroundColor: '#1E1E1E', borderColor: '#2E2E2E' }}
      >
        {authTab === 'LOGIN' ? (
          <>
            {/* Header Login persis activity_login.xml + Logo Resmi kafela's Agenda */}
            <div className="text-center mb-8">
              <img
                src="/logo-kafela.png"
                alt="kafela's Agenda"
                className="w-24 h-24 mx-auto mb-3 rounded-full shadow-xl border-2 border-amber-500/40 bg-[#FAF9F6] object-contain object-center p-1"
              />
              <h1
                className="font-bold tracking-tight"
                style={{ fontSize: '30px', color: '#FFFFFF' }}
              >
                Kafela&apos;s Agenda
              </h1>
              <p className="mt-1.5" style={{ fontSize: '14px', color: '#AAAAAA' }}>
                Silakan masuk ke akun Anda
              </p>
            </div>

            {errorMsg && (
              <div
                className="mb-4 rounded-xl p-3 text-xs leading-relaxed border"
                style={{
                  backgroundColor: 'rgba(231, 76, 60, 0.15)',
                  borderColor: '#E74C3C',
                  color: '#FFB4AB',
                }}
              >
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Input Nomor WhatsApp */}
              <div>
                <label className="block text-xs mb-1.5" style={{ color: '#AAAAAA' }}>
                  Nomor WhatsApp
                </label>
                <div
                  className="flex items-center rounded-lg border px-3.5 py-3 focus-within:border-[#64B5F6] transition-colors"
                  style={{ backgroundColor: '#161616', borderColor: '#3A3A3A' }}
                >
                  <Phone className="w-4 h-4 mr-3 shrink-0" style={{ color: '#888888' }} />
                  <input
                    type="tel"
                    placeholder="Contoh: 081234567890"
                    value={waInput}
                    onChange={(e) => setWaInput(e.target.value)}
                    className="w-full bg-transparent text-sm text-white placeholder-[#666666] focus:outline-none"
                  />
                </div>
              </div>

              {/* Input Kata Sandi */}
              <div>
                <label className="block text-xs mb-1.5" style={{ color: '#AAAAAA' }}>
                  Kata Sandi
                </label>
                <div
                  className="flex items-center rounded-lg border px-3.5 py-3 focus-within:border-[#64B5F6] transition-colors"
                  style={{ backgroundColor: '#161616', borderColor: '#3A3A3A' }}
                >
                  <Lock className="w-4 h-4 mr-3 shrink-0" style={{ color: '#888888' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan kata sandi"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent text-sm text-white placeholder-[#666666] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="ml-2 text-[#888888] hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Checkbox Syarat & Ketentuan */}
              <div className="pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={setujuSyarat}
                    onChange={(e) => setSetujuSyarat(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#64B5F6]"
                  />
                  <span style={{ fontSize: '13px', color: '#CCCCCC' }}>
                    Saya menyetujui Syarat &amp; Ketentuan
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowSyaratModal(true)}
                  className="ml-6 mt-0.5 text-left font-bold hover:underline cursor-pointer"
                  style={{ fontSize: '12px', color: '#64B5F6' }}
                >
                  Baca Ketentuan Layanan dan Kebijakan Privasi
                </button>
              </div>

              {/* Tombol MASUK (cornerRadius="30dp", height="55dp") */}
              <button
                type="submit"
                disabled={loading}
                className="w-full font-bold text-white transition-opacity hover:opacity-95 disabled:opacity-50 cursor-pointer shadow-lg mt-2"
                style={{
                  height: '52px',
                  borderRadius: '30px',
                  backgroundColor: '#2980B9',
                  fontSize: '15px',
                }}
              >
                {loading ? 'MEMUAT DATA...' : 'MASUK'}
              </button>

              {/* Divider ATAU */}
              <div className="flex items-center gap-3 py-2">
                <div className="flex-1 h-px" style={{ backgroundColor: '#333333' }} />
                <span className="font-bold" style={{ fontSize: '12px', color: '#666666' }}>
                  ATAU
                </span>
                <div className="flex-1 h-px" style={{ backgroundColor: '#333333' }} />
              </div>

              {/* Tombol Masuk / Daftar Cepat via Google (#2C2C2C) */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full font-bold text-white transition-colors hover:bg-[#363636] cursor-pointer border"
                style={{
                  height: '52px',
                  borderRadius: '30px',
                  backgroundColor: '#2C2C2C',
                  borderColor: '#3E3E3E',
                  fontSize: '14px',
                }}
              >
                Masuk / Daftar Cepat via Google
              </button>

              {/* Belum punya akun? Daftar di sini */}
              <div className="text-center pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setAuthTab('SIGNUP');
                  }}
                  className="font-bold hover:underline cursor-pointer py-2"
                  style={{ fontSize: '14px', color: '#64B5F6' }}
                >
                  Belum punya akun? Daftar di sini
                </button>
              </div>
            </form>
          </>
        ) : (
          /* FORM DAFTAR AKUN BARU PERSIS activity_signup.xml */
          <>
            <div className="text-center mb-6">
              <img
                src="/logo-kafela.png"
                alt="kafela's Agenda"
                className="w-20 h-20 mx-auto mb-2.5 rounded-full shadow-lg border-2 border-amber-500/40 bg-[#FAF9F6] object-contain object-center p-1"
              />
              <h1
                className="font-bold tracking-tight"
                style={{ fontSize: '26px', color: '#FFFFFF' }}
              >
                Buat Akun Baru
              </h1>
              <p className="mt-1" style={{ fontSize: '14px', color: '#AAAAAA' }}>
                Daftar untuk mulai mengelola jadwal
              </p>
            </div>

            {errorMsg && (
              <div
                className="mb-4 rounded-xl p-3 text-xs leading-relaxed border"
                style={{
                  backgroundColor: 'rgba(231, 76, 60, 0.15)',
                  borderColor: '#E74C3C',
                  color: '#FFB4AB',
                }}
              >
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSignupSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs mb-1" style={{ color: '#AAAAAA' }}>
                  Nama Lengkap (Owner)
                </label>
                <div
                  className="flex items-center rounded-lg border px-3.5 py-2.5"
                  style={{ backgroundColor: '#161616', borderColor: '#3A3A3A' }}
                >
                  <User className="w-4 h-4 mr-2.5 shrink-0" style={{ color: '#888888' }} />
                  <input
                    type="text"
                    placeholder="Nama Lengkap (Owner)"
                    value={namaOwner}
                    onChange={(e) => setNamaOwner(e.target.value)}
                    className="w-full bg-transparent text-sm text-white placeholder-[#666666] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs mb-1" style={{ color: '#AAAAAA' }}>
                  Nama Brand / Usaha
                </label>
                <div
                  className="flex items-center rounded-lg border px-3.5 py-2.5"
                  style={{ backgroundColor: '#161616', borderColor: '#3A3A3A' }}
                >
                  <input
                    type="text"
                    placeholder="Contoh: Kafela Creative"
                    value={namaBrand}
                    onChange={(e) => setNamaBrand(e.target.value)}
                    className="w-full bg-transparent text-sm text-white placeholder-[#666666] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs mb-1" style={{ color: '#AAAAAA' }}>
                  Nomor WhatsApp Aktif
                </label>
                <div
                  className="flex items-center rounded-lg border px-3.5 py-2.5"
                  style={{ backgroundColor: '#161616', borderColor: '#3A3A3A' }}
                >
                  <Phone className="w-4 h-4 mr-2.5 shrink-0" style={{ color: '#888888' }} />
                  <input
                    type="tel"
                    placeholder="Contoh: 081234567890"
                    value={waInput}
                    onChange={(e) => setWaInput(e.target.value)}
                    className="w-full bg-transparent text-sm text-white placeholder-[#666666] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs mb-1" style={{ color: '#AAAAAA' }}>
                  Buat Kata Sandi
                </label>
                <div
                  className="flex items-center rounded-lg border px-3.5 py-2.5"
                  style={{ backgroundColor: '#161616', borderColor: '#3A3A3A' }}
                >
                  <Lock className="w-4 h-4 mr-2.5 shrink-0" style={{ color: '#888888' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent text-sm text-white placeholder-[#666666] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="ml-2 text-[#888888] hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs mb-1" style={{ color: '#AAAAAA' }}>
                  Konfirmasi Kata Sandi
                </label>
                <div
                  className="flex items-center rounded-lg border px-3.5 py-2.5"
                  style={{ backgroundColor: '#161616', borderColor: '#3A3A3A' }}
                >
                  <Lock className="w-4 h-4 mr-2.5 shrink-0" style={{ color: '#888888' }} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Ulangi kata sandi"
                    value={konfirmasiPassword}
                    onChange={(e) => setKonfirmasiPassword(e.target.value)}
                    className="w-full bg-transparent text-sm text-white placeholder-[#666666] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="ml-2 text-[#888888] hover:text-white cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={setujuSyarat}
                    onChange={(e) => setSetujuSyarat(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#64B5F6]"
                  />
                  <span style={{ fontSize: '13px', color: '#CCCCCC' }}>
                    Saya menyetujui Syarat &amp; Ketentuan
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowSyaratModal(true)}
                  className="ml-6 mt-0.5 text-left font-bold hover:underline cursor-pointer"
                  style={{ fontSize: '12px', color: '#64B5F6' }}
                >
                  Baca Ketentuan Layanan dan Kebijakan Privasi
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full font-bold text-white transition-opacity hover:opacity-95 disabled:opacity-50 cursor-pointer shadow-lg mt-2"
                style={{
                  height: '52px',
                  borderRadius: '30px',
                  backgroundColor: '#27AE60',
                  fontSize: '15px',
                }}
              >
                {loading ? 'MENDAFTARKAN...' : 'DAFTAR SEKARANG'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setAuthTab('LOGIN');
                  }}
                  className="font-bold hover:underline cursor-pointer py-1.5"
                  style={{ fontSize: '14px', color: '#64B5F6' }}
                >
                  Sudah punya akun? Masuk di sini
                </button>
              </div>
            </form>
          </>
        )}

        {/* Bar Install Aplikasi (+ Tombol Download ZIP Khusus Saat Dibuka di AI Studio, Otomatis Hilang di kflsagnd.web.app) */}
        <div
          className="mt-6 pt-4 border-t flex flex-wrap items-center justify-center gap-2"
          style={{ borderColor: '#2E2E2E' }}
        >
          <PWAInstallButton compact />
          {typeof window !== 'undefined' &&
            !window.location.hostname.includes('kflsagnd') &&
            !window.location.hostname.includes('kafilasuci3') && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await fetch(`/kflsagnd-kasir-pc.zip?v=${Date.now()}`, {
                      cache: 'no-store',
                    });
                    if (!res.ok) throw new Error('HTTP ' + res.status);
                    const buf = await res.arrayBuffer();
                    const url = URL.createObjectURL(new Blob([buf], { type: 'application/zip' }));
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'kflsagnd-kasir-pc.zip';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    setTimeout(() => URL.revokeObjectURL(url), 5000);
                  } catch {
                    const a = document.createElement('a');
                    a.href = `/kflsagnd-kasir-pc.zip?v=${Date.now()}`;
                    a.download = 'kflsagnd-kasir-pc.zip';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }
                }}
                className="flex items-center gap-1.5 text-xs font-extrabold px-3 py-1.5 rounded-lg bg-[#F39C12] hover:opacity-95 text-slate-950 shadow-sm transition-opacity cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download ZIP Lengkap (Dist + Source)</span>
              </button>
            )}
        </div>
      </div>

      <PWAInstallFloatingBanner />

      {/* MODAL SYARAT & KETENTUAN (Persis tampilkanDialogKetentuan di LoginActivity.kt) */}
      {showSyaratModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div
            className="w-full max-w-lg rounded-2xl p-6 text-white space-y-4 border"
            style={{ backgroundColor: '#1E1E1E', borderColor: '#333333' }}
          >
            <div className="flex items-center justify-between border-b border-[#333333] pb-3">
              <h3 className="text-base font-bold">Ketentuan Layanan &amp; Privasi</h3>
              <button
                type="button"
                onClick={() => setShowSyaratModal(false)}
                className="p-1 rounded-lg text-[#AAAAAA] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs text-[#CCCCCC] leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
              <p className="font-bold text-white">Selamat datang di Kafela&apos;s Agenda!</p>
              <p>
                <strong>1. Keamanan &amp; Privasi Data:</strong> Kami berkomitmen menjaga privasi
                Anda. Seluruh data jadwal, transaksi, dan kontak klien yang Anda masukkan tersimpan
                di server Google Firebase dan hanya digunakan untuk keperluan manajemen bisnis Anda
                sendiri.
              </p>
              <p>
                <strong>2. Rahasia Perusahaan:</strong> Kami tidak akan pernah menjual, menyewakan,
                atau membagikan data pelanggan maupun omset bisnis Anda kepada pihak ketiga manapun.
              </p>
              <p>
                <strong>3. Tanggung Jawab Pengguna:</strong> Anda bertanggung jawab penuh atas
                keamanan kata sandi akun Anda, termasuk akun staf/admin yang Anda buat di dalam menu
                Kelola Tim.
              </p>
              <p>
                <strong>4. Layanan Berlangganan:</strong> Fitur aplikasi disesuaikan dengan paket
                langganan aktif Anda (Trial, Basic, Pro, atau Ultimate).
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#333333]">
              <button
                type="button"
                onClick={() => setShowSyaratModal(false)}
                className="px-4 py-2 rounded-lg text-xs text-[#AAAAAA] hover:bg-[#2C2C2C] cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  setSetujuSyarat(true);
                  setShowSyaratModal(false);
                }}
                className="px-4 py-2 rounded-lg bg-[#2980B9] text-xs font-bold text-white cursor-pointer"
              >
                Saya Setuju
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
