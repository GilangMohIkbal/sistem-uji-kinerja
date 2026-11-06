# Referensi lokal — konteks untuk Codex, bukan aset halaman publik

## Referensi identitas visual

| File | Yang dipelajari |
|---|---|
| `screenshots/lms-landing.png` | Emerald/teal, navy, judul sans tegas, permukaan putih, ilustrasi berlapis. |
| `screenshots/lms-login.png` | Identitas sama pada akses masuk; isi input telah disembunyikan. |
| `screenshots/lms-dashboard.png` | Navigasi/aksi tegas, panel, metadata, dan variasi warna terkontrol. |
| `screenshots/exam-landing-login.png` | Referensi tambahan karakter warna, keterbacaan, kedalaman, dan ilustrasi. |

Semua berasal dari screenshot yang diberikan pengguna dalam percakapan, bukan hasil screenshot live baru. Jangan menyalin layout atau memuat gambar ini sebagai hero website. Jangan menyimpulkan semua detail gambar harus dipertahankan.

## Referensi fungsi UKIN nasional

| File | Batas penggunaan |
|---|---|
| `screenshots/national-examiner-sidebar.png` | Menu penguji yang terlihat saja. |
| `screenshots/national-manager-sidebar.png` | Kelompok pengelolaan/monitoring yang terlihat saja. |
| `screenshots/national-assessment-summary.png` | Crop filter/status/periode/kuota, tanpa identitas orang pada header/daftar. |
| `screenshots/national-assessment-table-header.png` | Kolom daftar peserta tanpa baris nama/foto. |

Warna ungu/logo kementerian bukan patokan visual UKIN UNJ. Data nama/foto peserta dari screenshot asli tidak dibawa ke paket. Angka 48 pada referensi adalah keadaan screenshot, bukan angka seed yang wajib diikuti. Pembayaran/peminjaman/analitik tidak didefinisikan dari label saja.

## Referensi mesin

- `brand.tokens.json`: nilai token yang dibaca dari source LMS, bukan ekstraksi warna web ujian.
- `brand-tokens.css`: salinan minimal token untuk memudahkan adaptasi, bukan aplikasi/style LMS lengkap. Codex boleh memetakan ke Nuxt UI/Tailwind yang dipilih.
- `rubric-demo.v1.json`: data instrumen demonstrasi 3 komponen × 4 indikator, skala 1–4. Bukan rubrik resmi; sinkron dengan `docs/RUBRIC_DEMO.md`.

Paket ini tidak membawa `AGENTS.md`, mock state, node_modules, lockfile, credential, ataupun domain deployment LMS sebagai konfigurasi UKIN. Jangan mengimpor screenshot/context ini ke public assets aplikasi.

Sumber dan batas verifikasi: `docs/DECISIONS_AND_SOURCES.md`. Semua path relatif mengacu root repository UKIN setelah ekstraksi paket.
