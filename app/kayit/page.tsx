import { redirect } from 'next/navigation';

// Kayıt kaldırıldı (kullanıcı talebi, 2026-06-23) — doğrudan uygulamaya yönlendir.
// Eski hesap oluşturma ekranı kaldırıldı; auth Lovable + Supabase'te yeniden kurulacak.
export default function KayitPage() {
  redirect('/uygulama');
}
