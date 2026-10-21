import { useEffect, useState } from 'react';

const layanan = [
  { title: 'Poli Umum', text: 'Menangani pemeriksaan awal, kontrol rutin, demam, muntah, diare, penurunan nafsu makan, dan keluhan umum lainnya.' },
  { title: 'Poli Dermatologi', text: 'Menangani masalah kulit, jamur, alergi, kerontokan bulu, parasit, dan infeksi dermatologis.' },
  { title: 'Poli Bedah', text: 'Menangani tindakan operasi, perawatan luka, evaluasi pra dan pasca bedah, serta tindakan medis khusus.' },
  { title: 'Laboratorium', text: 'Mendukung pemeriksaan lanjutan seperti pemeriksaan darah, evaluasi hasil, dan layanan penunjang diagnostik.' },
];

const fasilitas = [
  'Ruang periksa yang nyaman dan bersih',
  'Area tindakan dan evaluasi pasien',
  'Ruang observasi / rawat inap',
  'Penunjang pemeriksaan laboratorium',
  'Alur pelayanan front office, dokter, dan apotek yang terintegrasi',
  'Konsultasi dan tindak lanjut pasien',
];

const dokter = [
  { name: 'Dr. A', desc: 'Dokter bedah yang berfokus pada penanganan kasus tindakan, luka, dan prosedur medis khusus.' },
  { name: 'Dr. B', desc: 'Dokter poli umum yang menangani pemeriksaan awal, kontrol, dan evaluasi keluhan pasien sehari-hari.' },
  { name: 'Dr. C', desc: 'Dokter poli dermatologi yang fokus pada keluhan kulit, bulu, parasit, dan alergi.' },
];

const artikel = [
  'Tips membawa hewan ke klinik agar tidak stres',
  'Kapan hewan perlu kontrol ulang?',
  'Tanda-tanda gangguan kulit pada kucing dan anjing',
];

const testimoni = [
  'Pelayanannya ramah, kliniknya bersih, dan dokter menjelaskan kondisi hewan dengan sangat jelas.',
  'Alur dari front office sampai dokter terasa rapi dan membantu sekali saat kontrol ulang.',
  'Cocok untuk pemilik hewan yang ingin pelayanan lebih tertata dan informatif.',
];

export const HomePage = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2200);
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      const audio = new AudioCtx();
      const o1 = audio.createOscillator();
      const o2 = audio.createOscillator();
      const g = audio.createGain();
      o1.type = 'triangle';
      o2.type = 'sine';
      o1.frequency.setValueAtTime(420, audio.currentTime);
      o1.frequency.linearRampToValueAtTime(620, audio.currentTime + 0.9);
      o2.frequency.setValueAtTime(680, audio.currentTime + 1);
      o2.frequency.linearRampToValueAtTime(460, audio.currentTime + 2);
      g.gain.setValueAtTime(0.001, audio.currentTime);
      g.gain.exponentialRampToValueAtTime(0.05, audio.currentTime + 0.1);
      g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 2);
      o1.connect(g); o2.connect(g); g.connect(audio.destination);
      o1.start(); o1.stop(audio.currentTime + 1.1);
      o2.start(audio.currentTime + 0.95); o2.stop(audio.currentTime + 2);
    }
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return (
      <div className="splash-screen">
        <div className="pet-row"><div className="pet-bounce">🐱</div><div className="pet-bounce delay">🐶</div></div>
        <h1>Selamat datang di Hug Me By Vet</h1>
        <p>Klinik hewan yang melayani dengan ramah, profesional, dan tertata.</p>
      </div>
    );
  }

  return (
    <div className="public-page clinic-site">
      <nav className="public-navbar">
        <div className="public-brand">🐾 Hug Me By Vet</div>
        <div className="public-menu">
          <a href="#profil">Profil</a>
          <a href="#fasilitas">Fasilitas</a>
          <a href="#alur">Alur Layanan</a>
          <a href="#pelayanan">Pelayanan</a>
          <a href="#dokter">Dokter</a>
          <a href="#artikel">Artikel</a>
          <a href="#kontak">Kontak</a>
        </div>
      </nav>

      <header className="hero-klinik">
        <div className="hero-copy">
          <p className="eyebrow">Klinik Hewan Modern & Terpercaya</p>
          <h1>Perawatan hewan kesayangan yang lebih hangat, rapi, dan profesional.</h1>
          <p>
            Hug Me By Vet hadir sebagai klinik hewan yang mengutamakan pelayanan ramah, alur pemeriksaan yang jelas,
            serta tindak lanjut pasien yang lebih tertata bagi pemilik dan dokter.
          </p>
          <div className="button-row">
            <button className="primary-button" type="button">Konsultasi Sekarang</button>
            <button className="secondary-button" type="button">Lihat Layanan</button>
          </div>
        </div>
        <div className="hero-image-card">
          <div className="hero-image" />
        </div>
      </header>

      <section id="profil" className="public-section two-col-section">
        <div className="card">
          <h2>Profil Klinik</h2>
          <p>
            Hug Me By Vet adalah klinik hewan yang dirancang untuk memberikan pelayanan menyeluruh, mulai dari front office,
            pemeriksaan dokter, hingga tindak lanjut pasien dan pengelolaan data yang lebih teratur.
          </p>
          <p>
            Fokus utama kami adalah menghadirkan pengalaman klinik yang nyaman bagi pemilik hewan, dengan pelayanan yang jelas,
            penjelasan yang mudah dipahami, dan penanganan medis yang lebih terstruktur.
          </p>
        </div>
        <div className="card stats-card">
          <div><strong>24 Jam</strong><span>untuk layanan tertentu / kondisi darurat</span></div>
          <div><strong>3 Poli</strong><span>umum, dermatologi, dan bedah</span></div>
          <div><strong>Tim Dokter</strong><span>berpengalaman dan komunikatif</span></div>
        </div>
      </section>

      <section id="fasilitas" className="public-section">
        <div className="section-heading">
          <h2>Fasilitas Klinik</h2>
          <p>Kami menyediakan fasilitas yang mendukung pemeriksaan, tindakan, observasi, dan kenyamanan pasien.</p>
        </div>
        <div className="marketing-grid detailed">
          {fasilitas.map((item) => (
            <div className="card facility-card" key={item}><h3>{item}</h3></div>
          ))}
        </div>
      </section>

      <section id="alur" className="public-section timeline-section">
        <div className="section-heading">
          <h2>Alur Layanan</h2>
          <p>Dari registrasi hingga tindak lanjut pasien, seluruh proses dibuat lebih jelas dan mudah dipahami.</p>
        </div>
        <div className="timeline-grid">
          <div className="timeline-item"><span>1</span><h3>Registrasi</h3><p>Front office membantu pencatatan data pemilik dan hewan secara rapi.</p></div>
          <div className="timeline-item"><span>2</span><h3>Pemeriksaan</h3><p>Dokter melakukan pemeriksaan, mencatat keluhan, diagnosis, tindakan, dan terapi.</p></div>
          <div className="timeline-item"><span>3</span><h3>Tindak Lanjut</h3><p>Hasil kunjungan dapat dilihat sebagai riwayat pasien untuk kontrol berikutnya.</p></div>
          <div className="timeline-item"><span>4</span><h3>Informasi Pemilik</h3><p>Pemilik menerima ringkasan hasil pemeriksaan dan informasi lanjutan.</p></div>
        </div>
      </section>

      <section id="pelayanan" className="public-section">
        <div className="section-heading">
          <h2>Pelayanan & Poli</h2>
          <p>Setiap poli memiliki fokus layanan yang berbeda sesuai kebutuhan pasien.</p>
        </div>
        <div className="marketing-grid detailed">
          {layanan.map((item) => (
            <div className="card service-card" key={item.title}><h3>{item.title}</h3><p>{item.text}</p></div>
          ))}
        </div>
      </section>

      <section id="dokter" className="public-section">
        <div className="section-heading">
          <h2>Dokter dan Staf</h2>
          <p>Tim kami hadir untuk menangani pasien dengan pendekatan profesional dan komunikatif.</p>
        </div>
        <div className="marketing-grid detailed">
          {dokter.map((item) => (
            <div className="card doctor-card" key={item.name}><div className="doctor-photo" /><h3>{item.name}</h3><p>{item.desc}</p></div>
          ))}
        </div>
      </section>

      <section id="artikel" className="public-section two-col-section">
        <div className="card">
          <h2>Artikel & Edukasi</h2>
          {artikel.map((item) => <p key={item}>• {item}</p>)}
        </div>
        <div className="card">
          <h2>Jam Layanan & Testimoni</h2>
          <p><strong>Jam Layanan:</strong> 24 Jam untuk kondisi tertentu / UGD, serta layanan konsultasi sesuai jam operasional klinik.</p>
          {testimoni.map((item) => <p key={item}>“{item}”</p>)}
        </div>
      </section>

      <section id="kontak" className="public-section two-col-section">
        <div className="card">
          <h2>Kontak Klinik</h2>
          <p><strong>Alamat:</strong> Jl. Veteran No. 123, Jakarta</p>
          <p><strong>WhatsApp:</strong> 0812-3456-7890</p>
          <p><strong>Email:</strong> info@hugmevet.com</p>
          <p>
            Customer page ini memang ditujukan untuk pemasaran klinik, edukasi, informasi layanan, dan kemudahan pemilik hewan
            mengenal klinik sebelum datang ke lokasi.
          </p>
        </div>
        <div className="card map-card">
          <h2>Lokasi</h2>
          <iframe title="Lokasi Klinik" src="https://maps.google.com/maps?q=jakarta%20vet%20clinic&t=&z=13&ie=UTF8&iwloc=&output=embed" width="100%" height="320" style={{ border: 0, borderRadius: '18px' }} loading="lazy"></iframe>
        </div>
      </section>
    </div>
  );
};
