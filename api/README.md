# API Hug Me By Vet v55

Folder ini adalah backend PHP untuk React/Vite.

Sumber data utama versi v55:

- owners
- animals
- visits
- visit_medicines
- medicines
- inventory_transactions
- finance_entries
- users
- rfid_logs

`app_state` hanya backup legacy. Jangan jadikan tabel itu sebagai patokan utama lagi.

File penting:

- `koneksi.php` konfigurasi database.
- `db_helpers.php` fungsi pembacaan dan sinkronisasi tabel relasional.
- `bootstrap.php` mengambil semua data dari tabel relasional.
- `save_state.php` menyimpan data dari React ke tabel relasional.
- `patients.php`, `visits.php`, `medicines.php`, `inventory.php`, `finance.php` adalah endpoint CRUD.
- `login.php` untuk login role staff.
- `rfid_log.php` untuk log scan RFID.
