import { NextResponse, type NextRequest } from 'next/server';

// ──────────────────────────────────────────────────────────────────────────
// Giriş kapısı KALDIRILDI (kullanıcı talebi, 2026-06-23).
// Tek-kullanıcı test/prototip — tüm rotalar herkese açık; oturum zorlanmaz.
// /giris ve /kayit doğrudan /uygulama'ya yönlenir (app/giris, app/kayit).
// Lovable + Supabase'e taşındığında auth yeniden kurulacak.
// ──────────────────────────────────────────────────────────────────────────

export function proxy(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  // Statik varlıkları ve token'lı/public uçları proxy'den muaf tut (proxy zaten
  // no-op; matcher yalnızca gereksiz çağrıyı azaltır).
  matcher: [
    '/((?!api/auth|api/form/|api/pt/gise|giris|kayit|sifre-sifirla|dogrula|form/|pt/gise|ozet/[^/]+|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
