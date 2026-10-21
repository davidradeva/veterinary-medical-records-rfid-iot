# Hug Me By Vet — Sistem Rekam Medis Hewan Berbasis Website dan RFID

Aplikasi berbasis website untuk mendukung pengelolaan data pasien hewan dan aktivitas operasional klinik Hug Me By Vet. Project ini dikembangkan menggunakan React, TypeScript, dan Vite pada sisi frontend, serta PHP dan MySQL untuk mendukung pengelolaan data melalui API.

## Fitur Utama

- **Dashboard:** Menampilkan informasi dan ringkasan aktivitas sistem.
- **Front Office:** Mendukung pengelolaan data pemilik, pasien hewan, dan proses administrasi.
- **Rekam Medis Dokter:** Mendukung pencatatan pemeriksaan dan riwayat medis pasien.
- **Identifikasi RFID:** Menyediakan halaman untuk proses pemindaian atau pengaitan UID RFID dengan data pasien, sesuai konfigurasi perangkat.
- **Apotek:** Mendukung pengelolaan data obat.
- **Pembayaran dan Keuangan:** Menyediakan modul terkait pembayaran dan pencatatan keuangan.
- **Inventaris:** Mendukung pengelolaan data persediaan dan transaksi inventaris.
- **API Backend:** Menggunakan PHP untuk menangani komunikasi aplikasi dengan database.
- **Database:** Menggunakan MySQL untuk penyimpanan data sistem.

## Teknologi yang Digunakan

- React
- TypeScript
- Vite
- PHP
- MySQL
- HTML dan CSS
- ESP32 dan RFID RC522 untuk kebutuhan integrasi perangkat keras

## Struktur Project

```text
api-source-database/
├── api/          # Backend API berbasis PHP
├── cpanel/       # Konfigurasi pendukung hosting
├── database/     # Skrip SQL dan pembaruan database
├── dist/         # Hasil build frontend
├── src/          # Source code frontend
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Cara Menjalankan Frontend

Pastikan Node.js dan npm sudah terpasang.

1. Clone repository:

   ```bash
   git clone https://github.com/davidradeva/veterinary-medical-records-rfid-iot.git
   ```

2. Masuk ke direktori project:

   ```bash
   cd veterinary-medical-records-rfid-iot
   ```

3. Instal dependensi:

   ```bash
   npm install
   ```

4. Jalankan server pengembangan:

   ```bash
   npm run dev
   ```

5. Buka alamat lokal yang ditampilkan di terminal, biasanya `http://localhost:5173`.

## Build untuk Deployment

Untuk menghasilkan file frontend siap deploy, jalankan:

```bash
npm run build
```

Hasil build akan tersedia di direktori `dist/`. Untuk pengujian hasil build secara lokal, jalankan:

```bash
npm run preview
```

## Konfigurasi Backend dan Database

1. Siapkan database MySQL sesuai struktur dan kebutuhan aplikasi.
2. Sesuaikan konfigurasi koneksi database pada `api/koneksi.php`.
3. Periksa konfigurasi alamat API pada `src/api/clinicApi.ts`.
4. Siapkan backend PHP pada server yang mendukung PHP dan MySQL, seperti hosting cPanel.
5. Pastikan frontend dapat mengakses endpoint API yang sesuai dengan konfigurasi deployment.

Gunakan skrip SQL pada direktori `database/` sesuai kebutuhan dan versi struktur database. Skrip pembaruan database perlu dijalankan setelah memastikan skema dasar dan dependensinya tersedia.

## Integrasi RFID

Sistem menyediakan fitur identifikasi pasien menggunakan UID RFID. Integrasi dengan perangkat ESP32 dan modul RFID RC522 memerlukan konfigurasi perangkat keras, komunikasi, serta endpoint yang sesuai. Keberhasilan pemindaian menggunakan perangkat fisik bergantung pada implementasi firmware dan konfigurasi sistem yang digunakan.

## Catatan Pengembangan

Project ini dikembangkan sebagai bagian dari pengembangan sistem rekam medis hewan berbasis website dengan dukungan identifikasi RFID. Ketersediaan dan keberfungsian setiap fitur bergantung pada konfigurasi frontend, backend, database, serta perangkat keras yang digunakan.
