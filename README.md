# Hug Me By Vet - Prototype Website

Versi ini adalah prototype website rekam medis kucing yang bisa langsung dijalankan di VS Code tanpa database.

## Fitur
- Dashboard
- Front Office untuk registrasi pasien
- Halaman RFID terpisah untuk scan UID dan hubungkan kartu
- Halaman dokter untuk isi rekam medis
- Halaman apotek untuk data obat
- Penyimpanan sementara menggunakan localStorage browser

## Cara Menjalankan
Pastikan Node.js sudah terpasang.

```bash
npm install
npm run dev
```

Setelah itu buka link yang muncul di terminal, biasanya:

```bash
http://localhost:5173
```

## Catatan
- Belum memakai database MySQL
- Belum terhubung ke RFID asli, masih simulasi input UID
- Cocok untuk dasar pengembangan skripsi tahap awal
