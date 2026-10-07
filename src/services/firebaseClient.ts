import { FirebaseApp, getApps, initializeApp, deleteApp } from 'firebase/app';
import {
  Auth,
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  Firestore,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  AnggotaTimModel,
  FirebaseCustomConfig,
  JadwalFotografi,
  OwnerProfile,
  PaketLayanan,
  RekeningModel,
  UserRoleType,
} from '../types/kafela';
import { waKeEmailSistem } from '../utils/formatters';

const STORAGE_KEY_FB_CONFIG = 'KAFELA_FIREBASE_CONFIG_V1';

/**
 * Konfigurasi resmi bawaan dari proyek Firebase kafilasuci3 (kfslgnd.web.app)
 */
export const DEFAULT_KAFELA_FIREBASE_CONFIG: FirebaseCustomConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || '',
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || '',
};

export function getSavedFirebaseConfig(): FirebaseCustomConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FB_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw) as FirebaseCustomConfig;
      if (parsed && parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch {
    // Gunakan konfigurasi bawaan kafilasuci3
  }
  return DEFAULT_KAFELA_FIREBASE_CONFIG;
}

export function saveFirebaseConfig(cfg: FirebaseCustomConfig): void {
  localStorage.setItem(STORAGE_KEY_FB_CONFIG, JSON.stringify(cfg));
}

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;
let cachedDb: Firestore | null = null;

export function initKafelaFirebase(customCfg?: FirebaseCustomConfig): {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
} | null {
  const cfg = customCfg || getSavedFirebaseConfig();
  if (!cfg || !cfg.apiKey || !cfg.projectId) return null;

  try {
    const existing = getApps().find((a) => a.name === 'KafelaAgendaPC');
    cachedApp = existing || initializeApp(cfg, 'KafelaAgendaPC');
    cachedAuth = getAuth(cachedApp);
    cachedDb = getFirestore(cachedApp);
    return { app: cachedApp, auth: cachedAuth, db: cachedDb };
  } catch (err) {
    console.error('Gagal menginisialisasi Firebase:', err);
    return null;
  }
}

export function listenFirebaseAuthState(
  callback: (
    session: {
      uid: string;
      targetOwnerId: string;
      role: UserRoleType;
      displayName: string;
    } | null
  ) => void
): () => void {
  const fb = initKafelaFirebase();
  if (!fb) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(fb.auth, async (user: User | null) => {
    if (!user) {
      callback(null);
      return;
    }
    try {
      const resolved = await resolveUserRoleFromFirestore(fb.db, user.uid, user);
      callback(resolved);
    } catch {
      callback({
        uid: user.uid,
        targetOwnerId: user.uid,
        role: 'owner',
        displayName: user.displayName || user.email || 'Owner',
      });
    }
  });
}

/**
 * Login via Nomor WhatsApp + Kata Sandi (Persis seperti LoginActivity.kt)
 */
export async function loginFirebaseWithWA(
  waInput: string,
  password: string
): Promise<{
  uid: string;
  targetOwnerId: string;
  role: UserRoleType;
  displayName: string;
}> {
  const fb = initKafelaFirebase();
  if (!fb) {
    throw new Error('Konfigurasi Firebase belum siap.');
  }

  const trimmed = waInput.trim();
  const emailSistem = trimmed.includes('@') ? trimmed : waKeEmailSistem(trimmed);
  const cred = await signInWithEmailAndPassword(fb.auth, emailSistem, password);
  const userUid = cred.user.uid;

  return await resolveUserRoleFromFirestore(fb.db, userUid, cred.user);
}

/**
 * Login / Daftar via Google (Persis seperti LoginActivity.kt & SignupActivity.kt)
 */
export async function loginFirebaseWithGoogle(): Promise<{
  uid: string;
  targetOwnerId: string;
  role: UserRoleType;
  displayName: string;
}> {
  const fb = initKafelaFirebase();
  if (!fb) {
    throw new Error('Konfigurasi Firebase belum siap.');
  }

  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(fb.auth, provider);
  const user = cred.user;

  const ownerRef = doc(fb.db, 'owners', user.uid);
  const ownerSnap = await getDoc(ownerRef);

  if (!ownerSnap.exists()) {
    const masaTrialMillis = Date.now() + 10 * 24 * 60 * 60 * 1000;
    const namaGoogle = user.displayName || 'Owner';
    await setDoc(ownerRef, {
      uid: user.uid,
      namaOwner: namaGoogle,
      namaBrand: namaGoogle,
      noWhatsApp: user.email || '',
      passkon: 'GOOGLE_AUTH',
      role: 'owner',
      ownerParentId: user.uid,
      paketAktif: 'Ultimate',
      tanggalDaftar: Date.now(),
      tanggalLangganan: masaTrialMillis,
    });
  }

  return {
    uid: user.uid,
    targetOwnerId: user.uid,
    role: 'owner',
    displayName: user.displayName || 'Owner',
  };
}

/**
 * Daftar Akun Baru via Nomor WA + Kata Sandi (Bonus Trial 10 Hari Ultimate)
 */
export async function signupFirebaseWithWA(
  namaOwner: string,
  namaBrand: string,
  waInput: string,
  password: string
): Promise<{
  uid: string;
  targetOwnerId: string;
  role: UserRoleType;
  displayName: string;
}> {
  const fb = initKafelaFirebase();
  if (!fb) {
    throw new Error('Konfigurasi Firebase belum siap.');
  }

  let waBersih = waInput.replace(/[^0-9]/g, '');
  if (waBersih.startsWith('62')) {
    waBersih = '0' + waBersih.substring(2);
  }
  const emailSistem = `${waBersih}@kafelaagenda.com`;
  const cred = await createUserWithEmailAndPassword(fb.auth, emailSistem, password);
  const uid = cred.user.uid;
  const masaTrialMillis = Date.now() + 10 * 24 * 60 * 60 * 1000;

  await setDoc(doc(fb.db, 'owners', uid), {
    uid,
    namaOwner,
    namaBrand,
    noWhatsApp: waBersih,
    passkon: password,
    role: 'owner',
    ownerParentId: uid,
    paketAktif: 'Ultimate',
    tanggalDaftar: Date.now(),
    tanggalLangganan: masaTrialMillis,
  });

  return {
    uid,
    targetOwnerId: uid,
    role: 'owner',
    displayName: namaOwner,
  };
}

export async function resolveUserRoleFromFirestore(
  db: Firestore,
  userUid: string,
  authUser?: User | null
): Promise<{
  uid: string;
  targetOwnerId: string;
  role: UserRoleType;
  displayName: string;
}> {
  // 1. Cek di koleksi tim_studio/{userUid} TERLEBIH DAHULU (agar staf/admin terbaca benar sebagai staf/admin dari studio owner)
  try {
    const timDoc = await getDoc(doc(db, 'tim_studio', userUid));
    if (timDoc.exists()) {
      const data = timDoc.data();
      const roleRaw = ((data.role as string) || 'anggota').toLowerCase();
      const parentId = (data.ownerParentId as string) || userUid;
      return {
        uid: userUid,
        targetOwnerId: parentId,
        role: roleRaw === 'admin' ? 'admin' : 'anggota',
        displayName: (data.nama as string) || 'Staf',
      };
    }
  } catch (e) {
    console.warn('Cek tim_studio gagal:', e);
  }

  // 1b. Auto-recovery: Cari di dalam subkoleksi tim milik semua owners jika dokumen tim_studio belum ada
  try {
    const ownersSnap = await getDocs(collection(db, 'owners'));
    for (const ownerDocSnap of ownersSnap.docs) {
      const ownerId = ownerDocSnap.id;
      const staffDocRef = doc(db, 'owners', ownerId, 'tim', userUid);
      const staffSnap = await getDoc(staffDocRef);
      if (staffSnap.exists()) {
        const data = staffSnap.data();
        const roleRaw = ((data.role as string) || 'anggota').toLowerCase();
        const parentId = (data.ownerParentId as string) || ownerId;

        // Auto-heal tim_studio/{userUid} agar ke depan langsung terbaca instan
        try {
          await setDoc(
            doc(db, 'tim_studio', userUid),
            {
              ...data,
              uid: userUid,
              ownerParentId: parentId,
            },
            { merge: true }
          );
        } catch {}

        return {
          uid: userUid,
          targetOwnerId: parentId,
          role: roleRaw === 'admin' ? 'admin' : 'anggota',
          displayName: (data.nama as string) || 'Staf',
        };
      }
    }
  } catch (e) {
    console.warn('Cari tim di semua owners gagal:', e);
  }

  // 2. Cek di koleksi owners/{userUid} (jika bukan staf, berarti dia adalah Owner)
  try {
    const ownerDoc = await getDoc(doc(db, 'owners', userUid));
    if (ownerDoc.exists()) {
      const data = ownerDoc.data();
      return {
        uid: userUid,
        targetOwnerId: userUid,
        role: 'owner',
        displayName: (data.namaOwner as string) || (data.namaBrand as string) || 'Owner',
      };
    }
  } catch (e) {
    console.warn('Cek owners gagal:', e);
  }

  // Fallback jika akun Auth ada namun dokumen belum terbaca
  return {
    uid: userUid,
    targetOwnerId: userUid,
    role: 'owner',
    displayName: authUser?.displayName || 'Owner',
  };
}

/**
 * Tarik Seluruh Data Studio dari proyek kafilasuci3 dalam 1 Sesi Hemat
 */
export async function fetchOwnerWorkspaceFromFirebase(
  targetOwnerId: string
): Promise<{
  owner: OwnerProfile;
  rekening: RekeningModel;
  paketList: PaketLayanan[];
  jadwalAktif: JadwalFotografi[];
  jadwalArsip: JadwalFotografi[];
  timList: AnggotaTimModel[];
  totalReadsUsed: number;
}> {
  const fb = initKafelaFirebase();
  if (!fb) throw new Error('Firebase belum terhubung');

  let readsCount = 0;

  // 1. Baca Dokumen Owner
  const ownerRef = doc(fb.db, 'owners', targetOwnerId);
  const ownerSnap = await getDoc(ownerRef);
  readsCount += 1;
  const oData = ownerSnap.data() || {};

  const rawBrand = (oData.namaBrand as string) || "Kafela's Studio";
  const slugBrand =
    rawBrand
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 24) || 'kafelastudio';
  const resolvedUsername = ((oData.username as string) || '').trim() || slugBrand;

  // Jika dokumen owner belum memiliki field username di Firestore, langsung sinkronkan otomatis
  if (!oData.username || String(oData.username).trim() === '') {
    try {
      await setDoc(
        ownerRef,
        {
          uid: targetOwnerId,
          namaBrand: rawBrand,
          username: resolvedUsername,
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Auto-sync username dilewati:', e);
    }
  }

  const resolvedPortofolio: string[] = Array.isArray(oData.portofolioWeb)
    ? (oData.portofolioWeb as string[]).filter((u) => u && String(u).trim() !== '').slice(0, 8)
    : [];
  const resolvedCaptions: string[] = Array.isArray(oData.portofolioCaptions)
    ? (oData.portofolioCaptions as string[]).slice(0, 8)
    : [];

  const owner: OwnerProfile = {
    uid: targetOwnerId,
    namaOwner: (oData.namaOwner as string) || 'Owner',
    namaBrand: rawBrand,
    noWhatsApp: (oData.noWhatsApp as string) || '',
    jenisUsaha: (oData.jenisUsaha as string) || 'Fotografi & Studio Foto',
    paketAktif: ((oData.paketAktif as string) || 'Pro') as OwnerProfile['paketAktif'],
    tanggalDaftar: Number(oData.tanggalDaftar) || Date.now(),
    tanggalLangganan: Number(oData.tanggalLangganan) || Date.now() + 30 * 86400000,
    username: resolvedUsername,
    taglineWeb: (oData.taglineWeb as string) || '',
    bioWeb: (oData.bioWeb as string) || '',
    linkIg: (oData.linkIg as string) || '',
    linkTiktok: (oData.linkTiktok as string) || '',
    lokasi1: (oData.lokasi1 as string) || '',
    lokasi2: (oData.lokasi2 as string) || '',
    lokasi3: (oData.lokasi3 as string) || '',
    logoBrandUrl: (oData.logoBrandUrl as string) || '/logo-kafela.svg',
    penempatanLogo: ((oData.penempatanLogo as string) || 'KEDUANYA') as OwnerProfile['penempatanLogo'],
    ttdUrl: (oData.ttdUrl as string) || '',
    portofolioWeb: resolvedPortofolio,
    portofolioCaptions: resolvedCaptions,
    temaWeb: ((oData.temaWeb as string) || 'MODERN_STUDIO') as OwnerProfile['temaWeb'],
    layoutWeb: ((oData.layoutWeb as string) || 'HORIZONTAL_BOOK') as OwnerProfile['layoutWeb'],
    pesanPenutupWeb: (oData.pesanPenutupWeb as string) || '',
    jamOperasionalWeb: (oData.jamOperasionalWeb as string) || '',
    ctaTeksKustom: (oData.ctaTeksKustom as string) || '',
    ctaLinkKustom: (oData.ctaLinkKustom as string) || '',
    teksTombolBooking: (oData.teksTombolBooking as string) || '',
    webProfil2: oData.webProfil2 ? (oData.webProfil2 as any) : undefined,
    templateWaTagihan:
      (oData.templateWaTagihan as string) ||
      'Halo kak [NAMA], kami dari [BRAND] menginformasikan untuk acara *[ACARA]* di [LOKASI], masih terdapat sisa tagihan sebesar *[SISA]*.\n\nPembayaran dapat ditransfer ke:\n[REKENING]\n\nTerima kasih!',
    templateWaKonfirmasi:
      (oData.templateWaKonfirmasi as string) ||
      'Halo kak [NAMA], kami dari [BRAND] ingin mengkonfirmasi jadwal untuk besok di [LOKASI]. Apakah sudah siap?',
    templateWaBookingWeb:
      (oData.templateWaBookingWeb as string) ||
      'Halo kak [NAMA], terima kasih sudah booking di [BRAND] untuk acara *[ACARA]* pada *[TANGGAL]*.\n\nTotal paket: [HARGA]\n\nSilakan transfer DP ke rekening:\n[REKENING]\n\nUntuk mengunci jadwal ya kak. Terima kasih!',
    warnaTema: (oData.warnaTema as string) || '#34495E',
    isKacaGelap: true,
    opasitasOverlay: 'D9',
  };

  // 2. Baca Rekening
  let rekening: RekeningModel = {
    bankUtama: '',
    rekUtama: '',
    namaUtama: '',
    bankAlternatif: '',
    rekAlternatif: '',
    namaAlternatif: '',
    linkPembayaran: '',
    catatanRekening: '',
  };
  try {
    const rekSnap = await getDoc(doc(fb.db, 'owners', targetOwnerId, 'pengaturan', 'rekening'));
    readsCount += 1;
    const rData = rekSnap.data() || {};
    rekening = {
      bankUtama: (rData.bankUtama as string) || '',
      rekUtama: (rData.rekUtama as string) || '',
      namaUtama: (rData.namaUtama as string) || '',
      bankAlternatif: (rData.bankAlternatif as string) || (rData.bank2 as string) || '',
      rekAlternatif: (rData.rekAlternatif as string) || (rData.rek2 as string) || '',
      namaAlternatif: (rData.namaAlternatif as string) || (rData.nama2 as string) || '',
      linkPembayaran: (rData.linkPembayaran as string) || '',
      catatanRekening: (rData.catatanRekening as string) || '',
    };
  } catch (e) {
    console.warn('Gagal memuat rekening:', e);
  }

  // 3. Baca Paket Layanan (Tanpa orderBy di server agar dokumen lama tanpa field urutan tetap terbaca seperti di MasterPaketActivity.kt)
  let paketList: PaketLayanan[] = [];
  try {
    const paketSnap = await getDocs(
      collection(fb.db, 'owners', targetOwnerId, 'paket_layanan')
    );
    readsCount += Math.max(1, paketSnap.size);
    paketList = paketSnap.docs
      .map((d) => {
        const p = d.data();
        return {
          idPaket: (p.idPaket as string) || d.id,
          namaPaket: (p.namaPaket as string) || '',
          hargaPaket: Number(p.hargaPaket) || 0,
          deskripsiPaket:
            (p.deskripsiPaket as string) || (p.catatan as string) || (p.deskripsi as string) || '',
          urutan: p.urutan !== undefined ? Number(p.urutan) : 999,
        };
      })
      .sort((a, b) => a.urutan - b.urutan);
  } catch (e) {
    console.warn('Gagal memuat paket_layanan:', e);
  }

  // 4. Baca Jadwal Aktif
  let jadwalAktif: JadwalFotografi[] = [];
  try {
    const jadwalSnap = await getDocs(collection(fb.db, 'owners', targetOwnerId, 'jadwal'));
    readsCount += Math.max(1, jadwalSnap.size);
    jadwalAktif = jadwalSnap.docs.map((d) => mapFirestoreDocToJadwal(d.id, d.data()));
  } catch (e) {
    console.warn('Gagal memuat jadwal:', e);
  }

  // 5. Baca Tim
  let timList: AnggotaTimModel[] = [];
  try {
    const timSnap = await getDocs(collection(fb.db, 'owners', targetOwnerId, 'tim'));
    readsCount += Math.max(1, timSnap.size);
    timList = timSnap.docs.map((d) => {
      const t = d.data();
      return {
        uid: (t.uid as string) || d.id,
        nama: (t.nama as string) || '',
        noWhatsApp: (t.noWhatsApp as string) || '',
        password: (t.password as string) || '',
        role: ((t.role as string) || 'anggota') as 'admin' | 'anggota',
        posisi: (t.posisi as string) || 'Kru',
        namaBrand: (t.namaBrand as string) || owner.namaBrand,
        ownerParentId: (t.ownerParentId as string) || targetOwnerId,
        tanggalDibuat: Number(t.tanggalDibuat) || Date.now(),
      };
    });
  } catch (e) {
    console.warn('Gagal memuat tim:', e);
  }

  // 6. Baca Arsip Kompresi
  const jadwalArsip: JadwalFotografi[] = [];
  try {
    const arsipSnap = await getDocs(collection(fb.db, 'owners', targetOwnerId, 'arsip_kompresi'));
    readsCount += Math.max(1, arsipSnap.size);
    arsipSnap.docs.forEach((docArsip) => {
      const arr = docArsip.data().data_event;
      if (Array.isArray(arr)) {
        arr.forEach((item: Record<string, unknown>) => {
          const mapped = mapFirestoreDocToJadwal((item.idJadwal as string) || '', item);
          mapped.isFromArchive = true;
          mapped.archiveDocId = docArsip.id;
          jadwalArsip.push(mapped);
        });
      }
    });
  } catch (e) {
    console.warn('Gagal memuat arsip_kompresi:', e);
  }

  return {
    owner,
    rekening,
    paketList,
    jadwalAktif,
    jadwalArsip,
    timList,
    totalReadsUsed: readsCount,
  };
}

export function subscribeLiveJadwalUltimate(
  targetOwnerId: string,
  onUpdate: (jadwalList: JadwalFotografi[], readDelta: number) => void
): (() => void) | null {
  const fb = initKafelaFirebase();
  if (!fb) return null;

  const colRef = collection(fb.db, 'owners', targetOwnerId, 'jadwal');
  return onSnapshot(colRef, (snap) => {
    const list = snap.docs.map((d) => mapFirestoreDocToJadwal(d.id, d.data()));
    const delta = Math.max(1, snap.docChanges().length);
    onUpdate(list, delta);
  });
}

export async function saveJadwalToFirebase(
  targetOwnerId: string,
  jadwal: JadwalFotografi
): Promise<void> {
  const fb = initKafelaFirebase();
  if (!fb) return;

  const docRef = doc(fb.db, 'owners', targetOwnerId, 'jadwal', jadwal.idJadwal);
  const payload: Record<string, unknown> = {
    idJadwal: jadwal.idJadwal,
    namaAcara: jadwal.namaAcara,
    namaKlien: jadwal.namaKlien,
    namaPic: jadwal.namaPic || jadwal.namaKlien,
    waPic: jadwal.waPic,
    paket: jadwal.paket,
    lokasi: jadwal.lokasi,
    status: jadwal.status,
    hargaKotor: jadwal.hargaKotor,
    hargaPaketDasar: jadwal.hargaPaketDasar,
    namaTambahan: jadwal.namaTambahan,
    hargaTambahan: jadwal.hargaTambahan,
    diskon: jadwal.diskon,
    dpDibayar: jadwal.dpDibayar,
    catatan: jadwal.catatan,
    sumber: jadwal.sumber,
    waktuMulai: jadwal.waktuMulai,
    waktuSelesai: jadwal.waktuSelesai,
    tanggalMulai: jadwal.tanggalMulai,
    tanggalSelesaiEvent: jadwal.tanggalSelesaiEvent,
  };
  if (jadwal.attire) payload.attire = jadwal.attire;
  if (jadwal.fotoTeknis) payload.fotoTeknis = jadwal.fotoTeknis;
  if (jadwal.mcProtokol) payload.mcProtokol = jadwal.mcProtokol;
  if (jadwal.woKoordinasi) payload.woKoordinasi = jadwal.woKoordinasi;

  await setDoc(docRef, payload, { merge: true });
}

export async function deleteJadwalFromFirebase(
  targetOwnerId: string,
  idJadwal: string
): Promise<void> {
  const fb = initKafelaFirebase();
  if (!fb) return;
  await deleteDoc(doc(fb.db, 'owners', targetOwnerId, 'jadwal', idJadwal));
}

export async function restoreArsipToFirebase(
  targetOwnerId: string,
  jadwal: JadwalFotografi
): Promise<void> {
  const fb = initKafelaFirebase();
  if (!fb) return;

  await saveJadwalToFirebase(targetOwnerId, { ...jadwal, isFromArchive: false });
  if (jadwal.archiveDocId) {
    const arsipRef = doc(fb.db, 'owners', targetOwnerId, 'arsip_kompresi', jadwal.archiveDocId);
    const snap = await getDoc(arsipRef);
    if (snap.exists()) {
      const arr = snap.data().data_event;
      if (Array.isArray(arr)) {
        const match = arr.find((x: Record<string, unknown>) => x.idJadwal === jadwal.idJadwal);
        if (match) {
          await updateDoc(arsipRef, {
            data_event: arrayRemove(match),
          });
        }
      }
    }
  }
}

/**
 * Kompresi Otomatis & Manual Jadwal Lama (> 60 Hari / 2 Bulan) ke arsip_kompresi
 * Persis seperti fungsi bersihkanDanKompresArsipLama() di MainActivity.kt APK Android
 */
export async function compressOldSchedulesToFirebase(
  targetOwnerId: string,
  oldSchedules: JadwalFotografi[]
): Promise<void> {
  const fb = initKafelaFirebase();
  if (!fb || !targetOwnerId || oldSchedules.length === 0) return;

  // Kelompokkan berdasarkan bulan (arsip_YYYY_MM)
  const grouped: Record<string, Record<string, unknown>[]> = {};
  for (const j of oldSchedules) {
    const ms = j.tanggalMulai || j.waktuMulai || Date.now();
    const d = new Date(ms);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const docArsipId = `arsip_${yyyy}_${mm}`;
    if (!grouped[docArsipId]) {
      grouped[docArsipId] = [];
    }
    const cleanPayload: Record<string, unknown> = {
      idJadwal: j.idJadwal,
      namaAcara: j.namaAcara,
      namaKlien: j.namaKlien,
      namaPic: j.namaPic || j.namaKlien,
      waPic: j.waPic,
      paket: j.paket,
      lokasi: j.lokasi,
      status: j.status,
      hargaKotor: j.hargaKotor,
      hargaPaketDasar: j.hargaPaketDasar,
      namaTambahan: j.namaTambahan,
      hargaTambahan: j.hargaTambahan,
      diskon: j.diskon,
      dpDibayar: j.dpDibayar,
      catatan: j.catatan,
      sumber: j.sumber,
      waktuMulai: j.waktuMulai,
      waktuSelesai: j.waktuSelesai,
      tanggalMulai: j.tanggalMulai,
      tanggalSelesaiEvent: j.tanggalSelesaiEvent,
    };
    if (j.attire) cleanPayload.attire = j.attire;
    if (j.fotoTeknis) cleanPayload.fotoTeknis = j.fotoTeknis;
    if (j.mcProtokol) cleanPayload.mcProtokol = j.mcProtokol;
    if (j.woKoordinasi) cleanPayload.woKoordinasi = j.woKoordinasi;

    grouped[docArsipId].push(cleanPayload);
  }

  for (const [docArsipId, items] of Object.entries(grouped)) {
    const arsipRef = doc(fb.db, 'owners', targetOwnerId, 'arsip_kompresi', docArsipId);
    await setDoc(
      arsipRef,
      {
        bulan_tahun: docArsipId,
        terakhir_diupdate: Date.now(),
        data_event: arrayUnion(...items),
      },
      { merge: true }
    );
  }

  // Hapus dari koleksi jadwal aktif setelah tersimpan di arsip_kompresi
  for (const j of oldSchedules) {
    await deleteDoc(doc(fb.db, 'owners', targetOwnerId, 'jadwal', j.idJadwal));
  }
}

export async function savePaketToFirebase(
  targetOwnerId: string,
  paket: PaketLayanan
): Promise<void> {
  const fb = initKafelaFirebase();
  if (!fb) return;
  await setDoc(doc(fb.db, 'owners', targetOwnerId, 'paket_layanan', paket.idPaket), paket);
}

export async function deletePaketFromFirebase(
  targetOwnerId: string,
  idPaket: string
): Promise<void> {
  const fb = initKafelaFirebase();
  if (!fb) return;
  await deleteDoc(doc(fb.db, 'owners', targetOwnerId, 'paket_layanan', idPaket));
}

export async function saveOwnerProfileToFirebase(
  targetOwnerId: string,
  updates: Partial<OwnerProfile>
): Promise<void> {
  const fb = initKafelaFirebase();
  if (!fb) return;
  const cleanUpdates: Record<string, unknown> = { ...updates };
  if (typeof cleanUpdates.username === 'string') {
    cleanUpdates.username = cleanUpdates.username.trim().replace(/\s+/g, '');
  }

  // Simpan hingga 8 foto galeri + judul foto langsung di dokumen utama owners/{targetOwnerId}
  // Cukup 1 Write saja (sangat irit kuota & 100% di bawah batas 1MB Firestore)
  if (Array.isArray(updates.portofolioWeb)) {
    const rawPhotos = updates.portofolioWeb.slice(0, 8);
    const rawCaptions = Array.isArray(updates.portofolioCaptions)
      ? updates.portofolioCaptions.slice(0, 8)
      : [];
    const validPhotos: string[] = [];
    const validCaptions: string[] = [];

    for (let idx = 0; idx < rawPhotos.length; idx++) {
      const u = (rawPhotos[idx] || '').trim();
      if (u !== '') {
        validPhotos.push(u);
        validCaptions.push((rawCaptions[idx] || '').trim());
      }
    }

    cleanUpdates.portofolioWeb = validPhotos;
    cleanUpdates.portofolioCaptions = validCaptions;
  }

  await setDoc(doc(fb.db, 'owners', targetOwnerId), cleanUpdates, { merge: true });
}

export async function saveRekeningToFirebase(
  targetOwnerId: string,
  rekening: RekeningModel
): Promise<void> {
  const fb = initKafelaFirebase();
  if (!fb) return;
  await setDoc(doc(fb.db, 'owners', targetOwnerId, 'pengaturan', 'rekening'), rekening);
}

export async function logoutFirebaseSession(): Promise<void> {
  const fb = initKafelaFirebase();
  if (fb) {
    await signOut(fb.auth);
  }
}

export async function saveTimToFirebase(
  targetOwnerId: string,
  anggota: AnggotaTimModel
): Promise<void> {
  const fb = initKafelaFirebase();
  if (!fb) return;

  let waBersih = anggota.noWhatsApp.replace(/[^0-9]/g, '');
  if (waBersih.startsWith('62')) {
    waBersih = '0' + waBersih.substring(2);
  }
  const emailSistem = `${waBersih}@kafelaagenda.com`;
  const password = anggota.password || '123456';

  let userUid = anggota.uid || `staff_${Date.now()}`;
  try {
    const savedCfg = getSavedFirebaseConfig() || DEFAULT_KAFELA_FIREBASE_CONFIG;
    const secondaryApp = initializeApp(savedCfg, `SecondaryStaffApp_${Date.now()}`);
    const secondaryAuth = getAuth(secondaryApp);
    const cred = await createUserWithEmailAndPassword(secondaryAuth, emailSistem, password);
    userUid = cred.user.uid;
    await signOut(secondaryAuth);
    await deleteApp(secondaryApp);
  } catch (authErr) {
    console.warn('Akun auth staf mungkin sudah ada atau gagal:', authErr);
  }

  const payload = {
    ...anggota,
    uid: userUid,
    noWhatsApp: waBersih,
    ownerParentId: targetOwnerId,
  };

  await setDoc(doc(fb.db, 'owners', targetOwnerId, 'tim', userUid), payload, { merge: true });
  await setDoc(doc(fb.db, 'tim_studio', userUid), payload, { merge: true });
}

export async function deleteTimFromFirebase(
  targetOwnerId: string,
  uid: string
): Promise<void> {
  const fb = initKafelaFirebase();
  if (!fb) return;
  await deleteDoc(doc(fb.db, 'owners', targetOwnerId, 'tim', uid));
  await deleteDoc(doc(fb.db, 'tim_studio', uid));
}

function parseNumberClean(val: unknown): number {
  if (typeof val === 'number' && !Number.isNaN(val)) return val;
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^0-9-]/g, '');
    const n = Number(cleaned);
    return Number.isNaN(n) ? 0 : n;
  }
  if (val && typeof val === 'object' && 'toMillis' in val && typeof (val as { toMillis: () => number }).toMillis === 'function') {
    return (val as { toMillis: () => number }).toMillis();
  }
  return 0;
}

function mapFirestoreDocToJadwal(id: string, d: Record<string, unknown>): JadwalFotografi {
  const waktuMulaiRaw = parseNumberClean(d.waktuMulai) || parseNumberClean(d.tanggalMulai) || Date.now();
  const tglMulai = parseNumberClean(d.tanggalMulai) || waktuMulaiRaw;
  const tglSelesaiRaw = parseNumberClean(d.tanggalSelesaiEvent);
  const tglSelesai = tglSelesaiRaw >= tglMulai ? tglSelesaiRaw : tglMulai;
  const hargaKotor = parseNumberClean(d.hargaKotor);
  const catatanStr = (d.catatan as string) || '';
  const statusStr = ((d.status as string) || 'Booking') as JadwalFotografi['status'];
  const sumberRaw = (d.sumber as string) || (d.asalBooking as string) || '';
  const isFromWeb =
    sumberRaw.toUpperCase().includes('WEB') ||
    statusStr.toLowerCase() === 'menunggu konfirmasi' ||
    catatanStr.toUpperCase().includes('VIA WEB') ||
    catatanStr.toUpperCase().includes('[WEB]');

  return {
    idJadwal: (d.idJadwal as string) || id,
    namaAcara: (d.namaAcara as string) || '',
    namaKlien: (d.namaKlien as string) || '',
    lokasi: (d.lokasi as string) || 'Studio',
    paket: (d.paket as string) || '',
    hargaPaketDasar: parseNumberClean(d.hargaPaketDasar) || hargaKotor,
    namaTambahan: (d.namaTambahan as string) || '',
    hargaTambahan: parseNumberClean(d.hargaTambahan),
    namaPic: (d.namaPic as string) || (d.namaKlien as string) || '',
    waPic: (d.waPic as string) || (d.noWa as string) || '',
    waktuMulai: waktuMulaiRaw,
    waktuSelesai: parseNumberClean(d.waktuSelesai),
    tanggalMulai: tglMulai,
    tanggalSelesaiEvent: tglSelesai,
    status: statusStr,
    hargaKotor,
    diskon: parseNumberClean(d.diskon),
    dpDibayar: parseNumberClean(d.dpDibayar) || parseNumberClean(d.dp),
    catatan: catatanStr,
    sumber: (isFromWeb ? 'WEB' : sumberRaw) as JadwalFotografi['sumber'],
    attire: d.attire as JadwalFotografi['attire'],
    fotoTeknis: d.fotoTeknis as JadwalFotografi['fotoTeknis'],
    mcProtokol: d.mcProtokol as JadwalFotografi['mcProtokol'],
    woKoordinasi: d.woKoordinasi as JadwalFotografi['woKoordinasi'],
  };
}

