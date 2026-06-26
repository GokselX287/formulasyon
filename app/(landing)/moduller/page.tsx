'use client';

import { useEffect } from 'react';

// Tek-sayfaya geçişte eski /moduller route'u → ana sayfadaki #moduller bölümüne.
// Aynısını /nasil-calisir(#problem), /ozellikler(#ozellikler), /fiyat(#fiyat),
// /sss(#sss) için kopyala — ya da bu route klasörlerini tümden sil
// (menü/footer linkleri artık #çıpa olduğundan route'lara gerek yok).
export default function Page() {
  useEffect(() => {
    window.location.replace('/#moduller');
  }, []);
  return null;
}
