import { PublicLayout } from '../components/PublicLayout';
import { Link } from 'react-router-dom';

const dokter = [
  { name: 'Dr. A', title: 'Dokter Bedah', desc: 'Menangani tindakan bedah jaringan lunak, steril, kastrasi, penanganan luka, dan evaluasi pra maupun pasca tindakan.' },
  { name: 'Dr. B', title: 'Dokter Poli Umum', desc: 'Fokus pada pemeriksaan rutin, konsultasi umum, vaksinasi, pemantauan nafsu makan, muntah, diare, dan kontrol berkala.' },
  { name: 'Dr. C', title: 'Dokter Dermatologi', desc: 'Berfokus pada masalah kulit dan bulu seperti jamur, kutu, alergi, kerontokan bulu, dan gangguan kulit berulang.' },
];

const artikel = [
  {
    title: '7 Tips on How to Feed a Cat',
    excerpt: 'Panduan ringan tentang kebiasaan makan kucing, penempatan mangkuk, dan rutinitas makan yang lebih nyaman.',
    source: 'Purina',
    link: 'https://www.purina.com/articles/cat/feeding/guides/how-to-feed-a-cat',
    imageClass: 'article-food',
  },
  {
    title: 'How Enrichment Helps Bored Cats',
    excerpt: 'Ide enrichment dan permainan yang membantu kucing indoor tetap aktif, ingin tahu, dan tidak cepat bosan.',
    source: 'PetMD',
    link: 'https://www.petmd.com/cat/general-health/how-enrichment-helps-bored-cats',
    imageClass: 'article-enrichment',
  },
  {
    title: 'Which Dog Toys Are Right for Your Dog?',
    excerpt: 'Artikel tentang memilih mainan anjing berdasarkan kebiasaan bermain, ukuran tubuh, dan aktivitasnya.',
    source: 'American Kennel Club',
    link: 'https://www.akc.org/expert-advice/lifestyle/types-dog-toys/',
    imageClass: 'article-toys',
  },
  {
    title: 'What to Know Before Getting a Cat',
    excerpt: 'Cocok untuk calon pemilik hewan yang ingin memahami kesiapan rumah, rutinitas, dan kebutuhan dasar kucing.',
    source: 'Purina',
    link: 'https://www.purina.com/articles/cat/getting-a-cat/should-i-get-a-cat',
    imageClass: 'article-newpet',
  },
  {
    title: 'Cat Nutrition Tips',
    excerpt: 'Ringkasan kebutuhan nutrisi dasar dan kebiasaan makan yang lebih teratur untuk kucing rumahan.',
    source: 'ASPCA',
    link: 'https://www.aspca.org/pet-care/cat-care/cat-nutrition-tips',
    imageClass: 'article-nutrition',
  },
];

const layananHarga = [
  { title: 'Pemeriksaan & Konsultasi', price: 'Rp70.000 – Rp100.000', text: 'Layanan konsultasi awal, pemeriksaan fisik dasar, dan diskusi rencana penanganan pasien.' },
  { title: 'Rawat Jalan', price: 'Menyesuaikan tindakan', text: 'Untuk pasien yang tidak memerlukan rawat inap dan dapat melanjutkan perawatan dari rumah.' },
  { title: 'Rawat Inap Non-Infeksius / Hari', price: 'Rp70.000 – Rp90.000', text: 'Pemantauan harian untuk pasien observasi atau pemulihan yang tidak bersifat infeksius.' },
  { title: 'Rawat Inap Infeksius / Hari', price: 'Rp90.000', text: 'Perawatan pasien rawat inap yang memerlukan penanganan terpisah karena faktor infeksius.' },
  { title: 'Visit Dokter / Hari', price: 'Rp25.000', text: 'Evaluasi harian dokter selama pasien dalam pemantauan klinik.' },
  { title: 'Vaksinasi Kucing & Anjing', price: 'Sesuai jenis vaksin', text: 'Vaksinasi dasar dan booster menyesuaikan jadwal, jenis pasien, dan vaksin yang digunakan.' },
  { title: 'Bedah Minor', price: 'Rp400.000 – Rp1.000.000', text: 'Tindakan bedah ringan seperti pembersihan luka tertentu, penanganan abses, dan prosedur minor lain.' },
  { title: 'Bedah Mayor', price: 'Mulai Rp1.000.000', text: 'Prosedur bedah dengan tingkat kompleksitas lebih tinggi sesuai kondisi pasien.' },
  { title: 'Scalling Gigi', price: 'Rp400.000 – Rp800.000', text: 'Pembersihan karang gigi dan evaluasi rongga mulut pada pasien.' },
  { title: 'Lab Darah', price: 'Rp100.000', text: 'Pemeriksaan penunjang darah untuk membantu evaluasi kondisi klinis pasien.' },
  { title: 'Lab Micro Test', price: 'Rp30.000', text: 'Pemeriksaan mikro sederhana untuk membantu menilai sampel tertentu.' },
  { title: 'Skin Scraping', price: 'Rp50.000', text: 'Pemeriksaan kulit untuk kasus dermatologi tertentu seperti parasit atau kelainan kulit.' },
  { title: 'Rapid Test Ab & Ag', price: 'Rp100.000', text: 'Rapid test antibodi/antigen menyesuaikan indikasi pemeriksaan.' },
  { title: 'USG', price: 'Rp100.000', text: 'Pemeriksaan ultrasonografi sebagai penunjang evaluasi organ dalam.' },
  { title: 'Terapi Laser', price: 'Menyesuaikan kebutuhan terapi', text: 'Terapi penunjang untuk kasus tertentu sesuai evaluasi dokter.' },
  { title: 'Incubator Treatment', price: 'Mulai Rp50.000', text: 'Perawatan dengan inkubator untuk pasien yang membutuhkan stabilisasi suhu dan pemantauan.' },
  { title: 'Respiratory Treatment', price: 'Rp100.000', text: 'Penanganan penunjang respirasi sesuai kebutuhan klinis pasien.' },
];

const layananHighlight = [
  { title: 'Pemeriksaan & Konsultasi', price: 'Rp70.000 – Rp100.000', text: 'Pemeriksaan fisik dasar dan konsultasi awal bersama dokter.' },
  { title: 'Rawat Inap', price: 'Rp70.000 – Rp90.000/hari', text: 'Observasi pasien rawat inap non-infeksius maupun infeksius sesuai kebutuhan.' },
  { title: 'Bedah Minor & Mayor', price: 'Rp400.000 – >Rp1.000.000', text: 'Tindakan bedah disesuaikan dengan kompleksitas dan kondisi pasien.' },
  { title: 'Pemeriksaan Penunjang', price: 'Mulai Rp30.000', text: 'Lab darah, micro test, rapid test, skin scraping, hingga USG.' },
  { title: 'Terapi Penunjang', price: 'Mulai Rp50.000', text: 'Termasuk terapi laser, incubator treatment, dan respiratory treatment.' },
];

const fasilitasHighlight = [
  { title: 'Front Office', text: 'Area registrasi pasien, verifikasi data pemilik, dan pengelolaan administrasi kunjungan.', imageClass: 'facility-front' },
  { title: 'Ruang Tunggu', text: 'Ruang tunggu yang dibuat lebih nyaman agar pemilik dan pasien tidak terlalu tegang saat menanti giliran.', imageClass: 'facility-waiting' },
  { title: 'Ruang Periksa / UGD', text: 'Ruang pemeriksaan umum dan penanganan awal untuk kebutuhan klinis harian maupun kasus darurat ringan.', imageClass: 'facility-exam' },
  { title: 'Area Tindakan', text: 'Area tindakan untuk perawatan luka, prosedur tertentu, dan kebutuhan tindakan medis klinis.', imageClass: 'facility-action' },
  { title: 'Rawat Inap Non-Infeksius', text: 'Area pemantauan pasien rawat inap yang tidak memerlukan isolasi infeksius.', imageClass: 'facility-observe' },
  { title: 'Rawat Inap Infeksius', text: 'Area terpisah untuk pasien rawat inap dengan pertimbangan infeksius.', imageClass: 'facility-observe' },
  { title: 'Farmasi Klinik', text: 'Pengelolaan obat, stok farmasi, dan kebutuhan terapi pasien yang lebih terstruktur.', imageClass: 'facility-pharmacy' },
  { title: 'Pemeriksaan Penunjang', text: 'Dukungan pemeriksaan laboratorium, rapid test, dan USG sesuai kebutuhan klinis.', imageClass: 'facility-exam' },
];

export const PublicHomePage = () => (
  <PublicLayout>
    <section className="home-intro-shell">
      <div className="home-hero-card">
        <div className="home-hero-copy">
          <p className="eyebrow">Klinik Hewan Modern</p>
          <h1>Melayani dengan hangat, informatif, dan profesional untuk setiap pasien kesayangan Anda.</h1>
          <p>Halaman utama ini menampilkan gambaran singkat layanan, fasilitas, dokter, dan informasi klinik. Untuk penjelasan penuh, masuk ke menu Profil, Fasilitas, Pelayanan, Lokasi, dan Artikel.</p>
          <div className="button-row compact-row">
            <Link className="primary-button" to="/profil/sejarah">Lihat Profil Klinik</Link>
            <Link className="secondary-button" to="/pelayanan">Lihat Pelayanan</Link>
          </div>
        </div>
        <div className="home-hero-image" />
      </div>
    </section>

    <section className="public-page-card home-summary-grid">
      <div className="summary-block">
        <p className="section-kicker">Fasilitas Klinik</p>
        <h2>Area layanan yang dibuat lebih nyaman, informatif, dan mudah dipahami oleh pemilik.</h2>
        <p>Bagian ini menampilkan ringkasan. Detail seluruh fasilitas tetap tersedia di menu Fasilitas.</p>
      </div>
      <div className="marketing-grid teaser-grid facility-preview-grid">
        {fasilitasHighlight.slice(0, 3).map((item) => (
          <article className="card teaser-card facility-preview-card" key={item.title}>
            <div className={`teaser-image ${item.imageClass}`} />
            <h3>{item.title}</h3>
            {'price' in item ? <strong className="price-tag">{(item as { price?: string }).price}</strong> : null}
            <p>{item.text}</p>
          </article>
        ))}
      </div>
      <div className="section-cta-row">
        <Link className="primary-button small" to="/fasilitas">Pelajari Lebih Lanjut</Link>
      </div>
    </section>

    <section className="public-page-card">
      <div className="section-heading split-heading">
        <div>
          <p className="section-kicker">Layanan & Lab Klinik</p>
          <h2>Layanan yang paling menarik ditampilkan lebih dulu, detail lengkap ada di menu Pelayanan.</h2>
        </div>
        <Link className="secondary-button small" to="/pelayanan">Lihat Full Pelayanan</Link>
      </div>
      <div className="marketing-grid detailed service-highlight-grid">
        {layananHighlight.map((item) => (
          <article className="card service-highlight-card" key={item.title}>
            <div className="service-icon">✦</div>
            <h3>{item.title}</h3>
            {'price' in item ? <strong className="price-tag">{(item as { price?: string }).price}</strong> : null}
            <p>{item.text}</p>
          </article>
        ))}
      </div>
    </section>

    <section className="public-page-card doctor-home-block">
      <div className="section-heading split-heading">
        <div>
          <p className="section-kicker">Dokter dan Staf Kami</p>
          <h2>Tim dokter yang menangani poli umum, bedah, dan dermatologi.</h2>
        </div>
        <Link className="secondary-button small" to="/profil/dokter-staf">Lihat Semua Anggota Staf</Link>
      </div>
      <div className="marketing-grid detailed doctor-preview-grid">
        {dokter.map((item) => (
          <article className="card doctor-card compact" key={item.name}>
            <div className="doctor-photo" />
            <h3>{item.name}</h3>
            <strong>{item.title}</strong>
            <p>{item.desc}</p>
            <span className="role-chip">Dokter</span>
          </article>
        ))}
      </div>
    </section>

    <section className="public-page-card two-col-section home-bottom-grid">
      <div>
        <div className="section-heading">
          <p className="section-kicker">Artikel Pilihan</p>
          <h2>Artikel luar yang ringan, aman, dan nyaman dibaca oleh pemilik hewan.</h2>
        </div>
        <div className="article-list">
          {artikel.slice(0, 3).map((item) => (
            <article className="card article-teaser article-link-card" key={item.title}>
              <div className={`article-thumb ${item.imageClass}`} />
              <div>
                <h3>{item.title}</h3>
                <p>{item.excerpt}</p>
                <a className="inline-link" href={item.link} target="_blank" rel="noreferrer">Buka Artikel Luar</a>
              </div>
            </article>
          ))}
        </div>
      </div>
      <div className="stacked-info">
        <div className="card info-card">
          <p className="section-kicker">Jam Layanan</p>
          <h3>24 Jam untuk unit gawat darurat</h3>
          <p>UGD: 24 Jam • Konsultasi reguler: 08.00–21.00 • Jam jenguk observasi: 14.00–17.00</p>
        </div>
        <div className="card info-card">
          <p className="section-kicker">Testimonial Pengunjung</p>
          <p>“Pelayanannya jelas, dokter komunikatif, dan kliniknya terasa lebih tertata sehingga pemilik paham langkah kontrol selanjutnya.”</p>
          <strong>- Pemilik Pasien</strong>
        </div>
        <div className="card info-card">
          <p className="section-kicker">Chat Cepat</p>
          <p>Klik ikon chat di kanan bawah halaman untuk langsung terhubung ke WhatsApp klinik.</p>
          <Link className="inline-link" to="/lokasi">Buka Lokasi Klinik</Link>
        </div>
      </div>
    </section>
  </PublicLayout>
);

export const SejarahPage = () => (
  <PublicLayout>
    <section className="public-page-card split-hero">
      <div><p className="eyebrow">WEBSITE KLINIK HEWAN</p><h1>Latar Belakang dan Sejarah</h1><p>Hug Me By Vet hadir dari kebutuhan klinik hewan kecil akan pelayanan yang ramah, klinis, dan mudah dipahami pemilik. Klinik ini dibangun untuk menjawab kebutuhan konsultasi, kontrol, tindakan, dan pencatatan pasien secara lebih tertata.</p></div>
      <div className="side-image" />
    </section>
  </PublicLayout>
);

export const VisiMisiPage = () => (
  <PublicLayout>
    <section className="public-page-card"><h1>Visi dan Misi</h1><p><strong>Visi:</strong> Menjadi klinik hewan yang terpercaya, komunikatif, dan modern dalam pelayanan pasien hewan kecil.</p><p><strong>Misi:</strong> memberikan pelayanan medis yang profesional, informasi yang jelas kepada pemilik, serta alur kontrol dan tindak lanjut yang lebih tertata.</p></section>
  </PublicLayout>
);

export const KerjasamaPage = () => (
  <PublicLayout>
    <section className="public-page-card split-hero"><div><p className="eyebrow">WEBSITE KLINIK HEWAN</p><h1>Kerja Sama</h1><p>Peluang kolaborasi dengan pet shop, breeder, komunitas pecinta hewan, klinik rujukan, laboratorium, serta institusi pendidikan untuk kegiatan edukasi dan layanan kesehatan hewan.</p></div><div className="side-image" /></section>
  </PublicLayout>
);

export const DokterStaffPage = () => (
  <PublicLayout>
    <section className="public-page-card"><h1>Dokter dan Staf</h1><div className="marketing-grid detailed">{dokter.map((item) => <div className="card doctor-card" key={item.name}><div className="doctor-photo" /><h3>{item.name}</h3><strong>{item.title}</strong><p>{item.desc}</p></div>)}</div></section>
  </PublicLayout>
);

export const FasilitasPage = () => (
  <PublicLayout>
    <section className="public-page-card">
      <div className="section-heading split-heading">
        <div>
          <p className="section-kicker">Fasilitas Klinik</p>
          <h1>Fasilitas dan layanan pendukung untuk kunjungan yang lebih nyaman dan tertata.</h1>
          <p>Selain ruang fisik klinik, kami juga menampilkan daftar layanan yang paling sering dicari beserta kisaran biayanya agar pemilik memiliki gambaran awal sebelum konsultasi.</p>
        </div>
      </div>
      <div className="marketing-grid detailed facility-grid-large">
        {fasilitasHighlight.map((item) => (
          <article className="card facility-card-large" key={item.title}>
            <div className={`facility-large-image ${item.imageClass}`} />
            <div className="facility-card-body">
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>

    <section className="public-page-card">
      <div className="section-heading">
        <p className="section-kicker">Daftar Layanan & Kisaran Biaya</p>
        <h2>Estimasi biaya layanan klinik</h2>
        <p>Nilai berikut bersifat estimasi. Total akhir dapat menyesuaikan kondisi pasien, kebutuhan obat, tindakan tambahan, dan evaluasi dokter saat pemeriksaan.</p>
      </div>
      <div className="marketing-grid detailed">
        {layananHarga.map((item) => (
          <article className="card service-highlight-card" key={item.title}>
            <div className="service-icon">✦</div>
            <h3>{item.title}</h3>
            <strong className="price-tag">{item.price}</strong>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  </PublicLayout>
);

export const AlurLayananPage = () => (
  <PublicLayout><section className="public-page-card"><h1>Alur Layanan</h1><div className="timeline-grid"><div className="timeline-item"><span>1</span><h3>Registrasi</h3><p>Front office mencatat data pemilik dan hewan.</p></div><div className="timeline-item"><span>2</span><h3>Pemeriksaan Dokter</h3><p>Keluhan, pemeriksaan fisik, dan diagnosis dicatat oleh dokter.</p></div><div className="timeline-item"><span>3</span><h3>Tindakan & Obat</h3><p>Terapi, tindakan, dan pemberian obat dilakukan sesuai kebutuhan pasien.</p></div><div className="timeline-item"><span>4</span><h3>Kontrol Ulang</h3><p>Pemilik mendapatkan arahan kontrol sesuai kondisi pasien.</p></div></div></section></PublicLayout>
);

export const PelayananPage = () => (
  <PublicLayout>
    <section className="public-page-card">
      <div className="section-heading">
        <p className="section-kicker">Pelayanan Klinik</p>
        <h1>Pelayanan yang tersedia di klinik beserta kisaran biaya.</h1>
        <p>Halaman ini membantu pemilik memahami jenis layanan yang tersedia. Harga dapat berubah mengikuti kompleksitas kasus dan keputusan medis dokter.</p>
      </div>
      <div className="marketing-grid detailed">
        {layananHarga.map((item) => (
          <article className="card service-highlight-card" key={item.title}>
            <div className="service-icon">✦</div>
            <h3>{item.title}</h3>
            <strong className="price-tag">{item.price}</strong>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  </PublicLayout>
);

export const LokasiPage = () => (
  <PublicLayout><section className="public-page-card two-col-section"><div><h1>Lokasi Klinik</h1><p>Jl. Veteran No. 123, Jakarta. Klinik mudah dijangkau dan dapat dihubungi untuk reservasi serta konsultasi awal.</p><p><strong>Jam Layanan:</strong> Senin - Minggu, 08.00 - 21.00</p></div><div className="card map-card"><iframe title="Lokasi Klinik" src="https://maps.google.com/maps?q=jakarta%20vet%20clinic&t=&z=13&ie=UTF8&iwloc=&output=embed" width="100%" height="320" style={{ border: 0, borderRadius: '18px' }} loading="lazy"></iframe></div></section></PublicLayout>
);

export const ArtikelPage = () => (
  <PublicLayout>
    <section className="public-page-card">
      <div className="section-heading">
        <p className="section-kicker">Artikel Klinik</p>
        <h1>Artikel luar seputar hewan, makanan, dan aktivitas yang aman dibaca oleh pemilik.</h1>
        <p>Bagian ini sengaja diarahkan ke artikel luar yang membahas topik ringan seperti nutrisi umum, enrichment, mainan, dan kesiapan memelihara hewan. Kami tidak menampilkan panduan obat atau penanganan sakit di rumah untuk menghindari tindakan yang keliru.</p>
      </div>
      <div className="article-list article-grid-full external-article-grid">
        {artikel.map((item) => (
          <article className="card article-external-card" key={item.title}>
            <div className={`article-banner ${item.imageClass}`} />
            <div className="article-card-content">
              <p className="section-kicker">Sumber: {item.source}</p>
              <h3>{item.title}</h3>
              <p>{item.excerpt}</p>
              <a className="primary-button article-link-button" href={item.link} target="_blank" rel="noreferrer">Buka Artikel Luar</a>
            </div>
          </article>
        ))}
      </div>
    </section>
  </PublicLayout>
);

export const KontakPage = () => (
  <PublicLayout><section className="public-page-card two-col-section"><div><h1>Kontak</h1><p><strong>WhatsApp:</strong> 0812-3456-7890</p><p><strong>Email:</strong> info@hugmevet.com</p><p><strong>Instagram:</strong> @hugmebyvet</p><p>Kami terbuka untuk pertanyaan layanan, kerja sama, dan reservasi konsultasi. Anda juga bisa menekan ikon chat WhatsApp yang selalu muncul di kanan bawah halaman untuk langsung terhubung ke klinik.</p></div><div className="card"><h3>Informasi Klinik</h3><p>Hug Me By Vet melayani konsultasi, tindakan, kontrol, edukasi pemilik, dan pengelolaan pasien secara lebih terstruktur agar pengalaman klinik terasa lebih nyaman.</p></div></section></PublicLayout>
  );
