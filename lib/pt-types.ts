/* =====================================================================
   pt-types — Kişisel Antrenör veri modeli (pt_* tabloları ile birebir)
   ===================================================================== */

export type PtDurum = 'aktif' | 'pasif';
export type PtMemberDurum = 'aktif' | 'dondurulmus' | 'ayrildi';

export interface PtTrainer {
  id: string;
  ad_soyad: string;
  telefon: string | null;
  email: string | null;
  uzmanlik: string | null;
  brans: string | null;
  bio: string | null;
  durum: string;
  program_json: string | null;   // [{gun:0-6, baslangic:'HH:MM', bitis, tip, not}]
  created_at: string;
  updated_at: string;
}

export interface PtMember {
  id: string;
  ad_soyad: string;
  telefon: string | null;
  email: string | null;
  yas: number | null;
  dogum_tarihi: string | null;
  meslek: string | null;
  trainer_id: string | null;
  durum: string;
  hedefler: string | null;
  qr_token: string;
  profile_json: string | null;   // {kimlik, parq, postur, saglik, hedefler}
  profile_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PtMeasurement {
  id: string;
  member_id: string;
  ay: string;                     // 'YYYY-MM'
  mezura_json: string | null;
  makine_json: string | null;
  notlar: string | null;
  created_at: string;
  updated_at: string;
}

export interface PtPackage {
  id: string;
  member_id: string;
  paket_no: number;
  ad: string | null;
  tutar: number;
  seans_adedi: number | null;
  kalan_seans: number | null;
  baslangic: string;
  bitis: string | null;
  durum: string;                  // aktif | bitti | iptal
  created_at: string;
}

export interface PtPayment {
  id: string;
  member_id: string;
  package_id: string | null;
  paket_no: number | null;
  tutar: number;
  tarih: string;
  yontem: string | null;
  sms_gonderildi: number;
  created_at: string;
}

export interface PtAttendance {
  id: string;
  member_id: string;
  tarih: string;
  giris_at: string | null;
  cikis_at: string | null;
  kaynak: string;                 // qr | manuel
  lesson_id: string | null;
  created_at: string;
}

export interface PtLesson {
  id: string;
  trainer_id: string | null;
  member_id: string | null;
  tarih: string;
  baslangic: string;
  bitis: string | null;
  tip: string;                    // ders | grup | musait | kapali
  durum: string;                  // planli | tamamlandi | iptal
  notlar: string | null;
  created_at: string;
}

export interface PtCollection {
  id: string;
  member_id: string;
  package_id: string | null;
  tutar: number | null;
  soz_tarihi: string;
  durum: string;                  // bekleyen | odendi | gecikti
  odeme_id: string | null;
  notlar: string | null;
  created_at: string;
}

export interface PtExpense {
  id: string;
  kategori: string | null;
  aciklama: string | null;
  tutar: number;
  tarih: string;
  created_at: string;
}

/** Yönetici bildirimi (türetilmiş + tahsilat kalıcı). */
export interface PtNotification {
  tip: 'olcum_eksik' | 'tahsilat_gecikti' | 'paket_bitti';
  severity: 'warn' | 'risk';
  memberId: string;
  memberName: string;
  detail: string;
  link: string;
}
