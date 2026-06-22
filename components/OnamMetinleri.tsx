'use client';
import { useState } from 'react';
import { Printer, AlertTriangle } from 'lucide-react';

const DOCS = [
  { id: 'aydinlatma', title: '1. Aydınlatma Metni', sub: 'KVKK m.10 · Sürüm 1.0' },
  { id: 'acik-riza', title: '2. Açık Rıza Beyanı', sub: 'KVKK m.6/3 · Sağlık verisi' },
  { id: 'hizmet-sozlesmesi', title: '3. Hizmet Sözleşmesi', sub: 'Çerçeve sözleşme' },
  { id: 'online', title: '4. Online Görüşme Ek Protokolü', sub: '' },
  { id: 'kayit', title: '5. Ses/Görüntü Kaydı Onamı', sub: '' },
  { id: 'cocuk', title: '6. Çocuk & Ergen Onam Formu', sub: 'Vasi onayı' },
  { id: 'acil', title: '7. Acil Durum Protokolü', sub: 'Kriz hatları' },
  { id: 'sonlandirma', title: '8. Sonlandırma & Çekilme Politikası', sub: '' },
  { id: 'cerez', title: '9. Çerez & Web Sitesi Politikası', sub: 'KVKK · GDPR' },
];

const ph = (text: string) => (
  <span className="bg-amber-50 border border-dashed border-amber-300 rounded px-1 text-amber-700 text-xs font-mono">{text}</span>
);

const SigBlock = ({ fields }: { fields: [string, string][] }) => (
  <div className="bg-[#FAF8F5] rounded-2xl p-5 mt-4 grid grid-cols-2 gap-6 text-sm text-[#6B7280]">
    {fields.map(([label]) => (
      <div key={label}>
        <div className="font-semibold text-[#3A3C42] mb-1">{label}</div>
        <div className="border-t border-[#D8D5CE] mt-10 pt-2">Ad Soyad / İmza / Tarih</div>
      </div>
    ))}
  </div>
);

export default function OnamMetinleri({ initialActive = 'aydinlatma' }: { initialActive?: string }) {
  const [active, setActive] = useState(initialActive);

  return (
    <div className="flex gap-0 min-h-[70vh]">
      {/* Sidebar nav */}
      <aside className="w-52 flex-shrink-0 border-r border-[#E7E5E0] pr-2 sticky top-24 self-start">
        <p className="text-[10px] uppercase tracking-widest text-[#9CA3AF] font-semibold mb-3">Belgeler</p>
        <ul className="space-y-0.5">
          {DOCS.map(d => (
            <li key={d.id}>
              <button
                onClick={() => setActive(d.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs transition border-l-2 ${active === d.id ? 'border-[#0E0F12] bg-[#FAF8F5] font-semibold text-[#0E0F12]' : 'border-transparent text-[#6B7280] hover:text-[#0E0F12] hover:bg-[#FAF8F5]'}`}
              >
                {d.title}
              </button>
            </li>
          ))}
        </ul>
        <button onClick={() => window.print()} className="mt-6 w-full flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-[#E7E5E0] hover:bg-[#FAF8F5] transition text-[#5a5a5a]">
          <Printer className="w-3.5 h-3.5" /> Yazdır / PDF
        </button>
      </aside>

      {/* Content */}
      <div className="flex-1 pl-8 max-w-2xl">
        {/* Legal warning */}
        <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-sm text-amber-800">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div><strong>Yasal not.</strong> Bu metinler kurumsal bir taslak olarak hazırlanmıştır. Yürürlüğe almadan önce bir hukuk müşaviri tarafından gözden geçirilmesi önerilir. Köşeli parantezli alanlar doldurulacaktır.</div>
        </div>

        {active === 'aydinlatma' && (
          <div className="space-y-5">
            <div><h2 className="text-[22px] font-semibold text-[#0E0F12]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>1. Aydınlatma Metni</h2><p className="text-xs text-[#9CA3AF] mt-1">KVKK m.10 · Sürüm 1.0 · {ph('[Yayım tarihi]')}</p></div>
            <div>
              <h3 className="text-sm font-semibold text-[#0E0F12] mb-2">Veri Sorumlusu</h3>
              <p className="text-sm text-[#5a5a5a] leading-relaxed">Bu metin, 6698 sayılı KVKK uyarınca, veri sorumlusu sıfatıyla {ph('[Terapist Ad Soyad / unvan / VKN-TCKN / iletişim adresi]')} tarafından hazırlanmıştır.</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#0E0F12] mb-2">İşlenen Veri Kategorileri</h3>
              <ul className="text-sm text-[#5a5a5a] space-y-1 list-disc pl-4">
                <li>Kimlik (ad, soyad, doğum tarihi)</li>
                <li>İletişim (telefon, e-posta, adres)</li>
                <li>Sağlık verisi (özel nitelikli): klinik öykü, tanı izlenimleri, seans notları, formülasyonlar, ölçek puanları</li>
                <li>Finansal: ödeme bilgisi (yalnızca makbuz amacıyla; kart bilgisi <strong>saklanmaz</strong>)</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#0E0F12] mb-2">Toplama Yöntemi & Hukuki Sebep</h3>
              <p className="text-sm text-[#5a5a5a] leading-relaxed">Veriler doğrudan danışandan, sözlü, yazılı veya elektronik ortamda toplanır. Hukuki sebepler: KVKK m.5/2-c (sözleşmenin kurulması/ifası), m.6/3 (sağlık verisinin <em>açık rıza</em> ile işlenmesi).</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#0E0F12] mb-2">Saklama Süresi</h3>
              <p className="text-sm text-[#5a5a5a] leading-relaxed">Klinik kayıtlar mesleki etik gereği <strong>en az 5 yıl</strong>, vaka karmaşıklığına göre <strong>10 yıla kadar</strong> saklanır.</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#0E0F12] mb-2">İlgili Kişi Hakları (KVKK m.11)</h3>
              <p className="text-sm text-[#5a5a5a] leading-relaxed">Verisinin işlenip işlenmediğini öğrenme, bilgi talep etme, düzeltme/silinme isteme, itiraz hakkı. Talepler {ph('[başvuru e-posta]')} adresine yazılı iletilir; en geç <strong>30 gün</strong> içinde yanıtlanır.</p>
            </div>
          </div>
        )}

        {active === 'acik-riza' && (
          <div className="space-y-5">
            <div><h2 className="text-[22px] font-semibold text-[#0E0F12]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>2. Açık Rıza Beyanı</h2><p className="text-xs text-[#9CA3AF] mt-1">KVKK m.6/3 · Sağlık verisi için</p></div>
            <p className="text-sm text-[#5a5a5a] leading-relaxed">Yukarıdaki Aydınlatma Metnini okuduğumu, anladığımı; özel nitelikli kişisel verilerimin işlenmesine ve kimliksizleştirilmiş biçimde süpervizyon amacıyla paylaşılmasına;</p>
            <div className="bg-[#FAF8F5] rounded-2xl p-4 space-y-3">
              {['Açık rıza veriyorum.', 'Süpervizyonda kimliksizleştirilmiş paylaşıma açık rıza veriyorum.', 'Hatırlatma mesajlarının seçtiğim kanallardan gönderilmesine açık rıza veriyorum.'].map(t => (
                <label key={t} className="flex items-start gap-3 text-sm text-[#3A3C42] cursor-pointer">
                  <input type="checkbox" className="mt-0.5 accent-[#0E0F12]" /> {t}
                </label>
              ))}
            </div>
            <SigBlock fields={[['Danışan', ''], ['Terapist', '']]} />
          </div>
        )}

        {active === 'hizmet-sozlesmesi' && (
          <div className="space-y-5">
            <div><h2 className="text-[22px] font-semibold text-[#0E0F12]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>3. Terapi Hizmet Sözleşmesi</h2></div>
            <div><h3 className="text-sm font-semibold text-[#0E0F12] mb-2">Taraflar</h3>
              <p className="text-sm text-[#5a5a5a]"><strong>Terapist:</strong> {ph('[Ad Soyad, unvan, oda üyelik no]')}<br /><strong>Danışan:</strong> {ph('[Ad Soyad]')}</p></div>
            <div><h3 className="text-sm font-semibold text-[#0E0F12] mb-2">Süre, Sıklık, Ücret</h3>
              <ul className="text-sm text-[#5a5a5a] list-disc pl-4 space-y-1">
                <li>Seans süresi: {ph('[50 dk]')}</li>
                <li>Sıklık: haftalık (klinik gerekçeyle değişebilir)</li>
                <li>Ücret: {ph('[… TL]')} — ödeme: {ph('[banka/IBAN]')}; kart bilgileri saklanmaz</li>
              </ul></div>
            <div><h3 className="text-sm font-semibold text-[#0E0F12] mb-2">İptal & Geç Kalma</h3>
              <p className="text-sm text-[#5a5a5a] leading-relaxed"><strong>24 saatten az</strong> kala iptal edilen seans ücretinin tamamı, 24–48 saat arasında ise yarısı talep edilir. 15 dakikadan fazla geç kalınan seans, kalan sürede yapılır.</p></div>
            <div><h3 className="text-sm font-semibold text-[#0E0F12] mb-2">Gizlilik</h3>
              <p className="text-sm text-[#5a5a5a] leading-relaxed">Tüm seans içeriği gizlidir. İstisnalar: (a) yaşamsal tehlike, (b) çocuk/savunmasız bireye istismar bildirimi, (c) yetkili mahkeme kararı.</p></div>
          </div>
        )}

        {active === 'online' && (
          <div className="space-y-5">
            <div><h2 className="text-[22px] font-semibold text-[#0E0F12]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>4. Online Görüşme Ek Protokolü</h2></div>
            <p className="text-sm text-[#5a5a5a] leading-relaxed">Online görüşme; uçtan uca şifreli platform üzerinden yürütülür ({ph('[platform adı]')}). Danışan;</p>
            <ul className="text-sm text-[#5a5a5a] list-disc pl-4 space-y-1">
              <li>Kapalı, sessiz, başkalarınca duyulmayacak bir mekânda bulunmayı,</li>
              <li>Görüşmeyi <strong>kaydetmemeyi</strong> ve ekran görüntüsü almamayı,</li>
              <li>Bağlantı kesilirse {ph('[yedek kanal]')} ile derhal yeniden bağlanmayı kabul eder.</li>
            </ul>
            <div className="bg-[#FAF8F5] rounded-2xl p-4">
              <label className="flex items-start gap-3 text-sm text-[#3A3C42] cursor-pointer"><input type="checkbox" className="mt-0.5 accent-[#0E0F12]" /> Online görüşme koşullarını kabul ediyorum.</label>
            </div>
          </div>
        )}

        {active === 'kayit' && (
          <div className="space-y-5">
            <div><h2 className="text-[22px] font-semibold text-[#0E0F12]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>5. Ses/Görüntü Kaydı Onamı</h2></div>
            <p className="text-sm text-[#5a5a5a] leading-relaxed">Seansların kaydı <strong>varsayılan olarak yapılmaz</strong>. Yalnızca aşağıdaki amaçlarla, açık rıza ile yapılabilir:</p>
            <ul className="text-sm text-[#5a5a5a] list-disc pl-4 space-y-1">
              <li>Süpervizyon (kayıtlar 30 gün içinde silinir)</li>
              <li>Eğitim/araştırma (anonimleştirilmiş, ek özel onam ile)</li>
            </ul>
            <div className="bg-[#FAF8F5] rounded-2xl p-4 space-y-3">
              {['Süpervizyon amacıyla kayıt alınmasına onay veriyorum.', 'Eğitim/araştırma amacıyla anonimleştirilmiş kullanıma onay veriyorum.', 'Hiçbir kayıt alınmasını istemiyorum.'].map(t => (
                <label key={t} className="flex items-start gap-3 text-sm text-[#3A3C42] cursor-pointer"><input type="checkbox" className="mt-0.5 accent-[#0E0F12]" /> {t}</label>
              ))}
            </div>
          </div>
        )}

        {active === 'cocuk' && (
          <div className="space-y-5">
            <div><h2 className="text-[22px] font-semibold text-[#0E0F12]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>6. Çocuk & Ergen Onam Formu</h2></div>
            <p className="text-sm text-[#5a5a5a] leading-relaxed">18 yaş altı danışanlar için tedavi, vasi(ler)in açık onayını gerektirir. 12 yaş ve üzeri ergenlerin <em>onayı (assent)</em> da ayrıca alınır.</p>
            <ul className="text-sm text-[#5a5a5a] list-disc pl-4 space-y-1">
              <li>Vasi olarak hizmet kapsamını okudum, anladım.</li>
              <li>Çocuğumun seans içeriğinin gizli olduğunu, yalnızca yaşamsal risk ve yasal zorunluluk hâllerinde paylaşılacağını kabul ediyorum.</li>
            </ul>
            <SigBlock fields={[['Vasi 1', ''], ['Vasi 2 (varsa)', ''], ['Ergen Onayı (12+)', ''], ['Terapist', '']]} />
          </div>
        )}

        {active === 'acil' && (
          <div className="space-y-5">
            <div><h2 className="text-[22px] font-semibold text-[#0E0F12]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>7. Acil Durum Protokolü</h2></div>
            <p className="text-sm text-[#5a5a5a] leading-relaxed">Aşağıdaki durumlardan biri yaşanırsa lütfen <strong>seansı beklemeden</strong> ilgili acil hatları arayın:</p>
            <ul className="text-sm text-[#5a5a5a] list-disc pl-4 space-y-1">
              <li>Kendinize veya bir başkasına zarar verme düşünceniz yoğunlaşıyorsa,</li>
              <li>Akut psikotik belirtiler, ağır intoksikasyon, ciddi fiziksel rahatsızlık varsa.</li>
            </ul>
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-2">
              <div className="text-sm font-semibold text-red-800">Türkiye Acil Hatları</div>
              <div className="text-sm text-red-700 space-y-1">
                <div><strong>Acil sağlık:</strong> 112</div>
                <div><strong>Sosyal destek:</strong> 182 (MHRS), 183 (ALO Sosyal Destek)</div>
                <div>En yakın acil servis veya psikiyatri kliniği</div>
              </div>
            </div>
          </div>
        )}

        {active === 'sonlandirma' && (
          <div className="space-y-5">
            <div><h2 className="text-[22px] font-semibold text-[#0E0F12]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>8. Sonlandırma & Çekilme Politikası</h2></div>
            <ul className="text-sm text-[#5a5a5a] list-disc pl-4 space-y-2">
              <li>Danışan istediği zaman, gerekçe sunmaksızın hizmeti sonlandırabilir.</li>
              <li>Terapist; klinik uyumsuzluk veya etik ihlal durumunda sonlandırabilir; bu durumda en az <strong>1 sonuç seansı</strong> ve uygun yönlendirme sağlanır.</li>
              <li>Sonlandırma sonrası kayıtlar etik gereği belirlenen süre boyunca saklanır.</li>
              <li>Terapötik ilişki bittikten sonra terapist, en az <strong>2 yıl</strong> süreyle ikili (sosyal/ticari) ilişki kurmaz.</li>
            </ul>
          </div>
        )}

        {active === 'cerez' && (
          <div className="space-y-5">
            <div><h2 className="text-[22px] font-semibold text-[#0E0F12]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>9. Çerez & Web Sitesi Politikası</h2></div>
            <p className="text-sm text-[#5a5a5a] leading-relaxed">Bu site, çalışması için zorunlu olan teknik çerezler dışında <strong>üçüncü taraf izleme çerezi kullanmaz</strong>.</p>
            <ul className="text-sm text-[#5a5a5a] list-disc pl-4 space-y-1">
              <li>Zorunlu çerezler: oturum yönetimi, güvenlik (her zaman aktif).</li>
              <li>Tercih çerezleri: dil, tema (kullanıcı tercihi).</li>
              <li>Analitik çerezler: yalnızca açık rıza ile aktif edilir.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
