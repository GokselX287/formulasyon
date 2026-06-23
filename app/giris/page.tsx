import { redirect } from 'next/navigation';

// Giriş kaldırıldı (kullanıcı talebi, 2026-06-23) — doğrudan uygulamaya yönlendir.
// Eski e-posta/şifre + OAuth ekranı kaldırıldı; auth Lovable + Supabase'te yeniden kurulacak.
export default function GirisPage() {
  redirect('/uygulama');
}
