import { NextResponse, type NextRequest } from 'next/server';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/session';

// ──────────────────────────────────────────────────────────────────────────
// Next 16 Proxy (eski "middleware") — tek terapist girişi kapısı.
// Geçerli siyi_session çerezi yoksa: sayfalar /giris'e yönlenir, /api/* 401 döner.
// Node.js runtime'da çalışır (node:crypto kullanılabilir). 'runtime' AYARLANMAZ.
// Herkese açık rotalar matcher'da hariç tutulur (danışan form/özet linkleri,
// giriş sayfası/API'si, admin kendi auth'u, Next statik varlıkları).
// ──────────────────────────────────────────────────────────────────────────

export function proxy(req: NextRequest) {
  // Kök "/" = HERKESE AÇIK pazarlama landing'i (SEO). Uygulama /uygulama altında.
  if (req.nextUrl.pathname === '/') return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (verifySessionToken(token)) return NextResponse.next();

  // API istekleri için yönlendirme yerine 401 (fetch'ler HTML almasın).
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ ok: false, error: 'Yetkisiz. Giriş gerekli.' }, { status: 401 });
  }

  const url = req.nextUrl.clone();
  url.pathname = '/giris';
  url.search = '';
  url.searchParams.set('next', req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(url);
}

export const config = {
  // Hariç tutulanlar (herkese açık): auth API (OAuth callback dahil), token'lı
  // danışan form API'si, giriş/kayıt/şifre-sıfırlama/doğrulama sayfaları, token'lı
  // form/özet sayfaları, statik varlıklar.
  // NOT: /admin ve /api/admin ARTIK kapıya dahil — admin = giriş yapan terapist.
  // ozet/[^/]+ yalnız token'lı /ozet/<token>'i muaf tutar; çıplak /ozet korunur.
  // Son kalıp .*\..* : nokta içeren tüm yollar (sitemap.xml, robots.txt, og
  // görseli, /public statikleri) muaf → crawler/sosyal önizleme erişebilir.
  matcher: [
    '/((?!api/auth|api/form/|api/pt/gise|giris|kayit|sifre-sifirla|dogrula|form/|pt/gise|ozet/[^/]+|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
