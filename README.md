# UKIN PPG UNJ

Mock frontend Uji Kinerja Pendidikan Profesi Guru, Universitas Negeri Jakarta. Tahap 0-4: landing, empat akun, paket berversi, pemeriksaan/revisi, penilaian independen dosen/guru, pengelolaan, moderasi, publikasi dan wawancara kondisional. Semua data fiktif; terpisah dari LMS, tanpa backend atau deployment.

**6 November 2026 — finalisasi source dan persiapan Tahap 5 selesai; penerimaan browser/Linux masih terbuka.** Tahap 0–4 dipertahankan. Seluruh 47 tes, Nuxt typecheck, static generate Windows, verify sebelum/sesudah build dan verify:output lulus. Belum ada push atau deployment; repository tujuan belum ditentukan. Detail: [PROGRESS.md](docs/PROGRESS.md).

## Menjalankan

Dependency dan lockfile sudah tersedia di workspace; tidak perlu instalasi ulang untuk melanjutkan:

```sh
npm run dev
```

Runtime yang diperiksa: Node 22.17.0 dan npm 11.21.1. Untuk checkout baru dengan jaringan dan tanpa dependency, gunakan lockfile yang tersedia dengan npm ci --include=optional; clean install Linux belum diuji pada sesi ini.

Login memakai tombol isi akun contoh; password dummy semua akun adalah DemoUKIN123!.

| Akun | Email |
|---|---|
| Peserta | peserta@demo.invalid |
| Penguji dosen | dosen@demo.invalid |
| Penguji guru | guru@demo.invalid |
| Pengelola | pengelola@demo.invalid |

Gunakan satu tab/satu origin. Ganti akun mempertahankan data. Reset hanya dua key UKIN dan mengeluarkan sesi. Guard/frontend ini bukan autentikasi production. Storage yang gagal memakai memori dengan notice.

## Alur Tahap 2-4

Peserta menyusun Paket UKIN, menyimpan draf dan mengirim final. Pengelola memeriksa kelengkapan atau meminta perbaikan beralasan. Pengiriman ulang membuat versi baru; final sebelumnya tetap arsip. Alur Tahap 2 dipertahankan.

Penguji membuka **Penugasan saya**: filter periode/bidang/status, lalu menilai perangkat, video dan studi kasus melalui 12 indikator demo skala 1-4. Skor kosong bukan nol. Catatan video terikat versi/timestamp. Simpan draf, tinjau seluruh komponen, lalu konfirmasi final. Dosen/guru mempunyai record pribadi terpisah; skor pasangan tidak tersedia. **Riwayat penilaian** menyimpan final/revisi sendiri.

Pengelola melihat **Progres penilaian** dan **Monitoring**, mengatur periode/akun/penugasan/pengumuman melalui **Pengelolaan**, serta mengekspor CSV status fiktif. Aturan periode yang sudah dipakai dibekukan; duplikasi membuat periode baru. Akun tambahan hanya data administrasi, bukan login tambahan.

Setelah dua final terkini, pengelola dapat membuka **Moderasi** untuk indikator terpilih. Penguji mempertahankan atau merevisi penilaian sendiri dengan alasan. Dua tanggapan current tanpa draf memungkinkan penutupan, tanpa harus menyamakan skor. Final lama tetap utuh.

**Publikasi hasil** menyediakan feedback terpilih, pratinjau, konfirmasi, versi, dan penarikan beralasan. Peserta hanya melihat snapshot terbit miliknya di **Hasil publikasi**. Skor komponen opsional dan terpisah. Wawancara hanya aktif sesuai periode, dengan jadwal/status/link simulasi; bukan skor keempat. Rubrik bukan instrumen resmi; tidak ada nilai gabungan/kelulusan.

File lokal hanya tersedia selama halaman aktif. Setelah refresh, isi file harus dipilih ulang; bukti final memerlukan SHA-256 yang sama. Contoh PDF bawaan tetap tersedia setelah refresh. Video contoh bukan rekaman praktik peserta; pemutaran memerlukan internet dan belum diverifikasi pada sesi ini.

## Verifikasi

```sh
npm run test
npm run typecheck
npm run verify
npm run generate
npm run verify
npm run verify:output
```

Test memakai native type stripping Node 22. Generate menghasilkan SPA statis di .output/public. Verify memeriksa source, aset dan kesamaan rubrik; verify:output memeriksa hasil generate. Command dibatasi waktunya untuk menghindari hang; log lokal ada di tmp/verification. Keberhasilan tes/build tidak menggantikan [checklist browser](docs/MANUAL_CHECKLIST.md).

## Routes dan struktur

| Route | Fungsi |
|---|---|
| /, /login | Landing dan login |
| /app/peserta, /app/penguji, /app/pengelola | Dashboard peran |
| /app/panduan | Panduan |
| /app/paket?id=attemptId | Editor paket pemilik |
| /app/bukti-kirim?id=evidenceVersionId | Receipt dan bukti final |
| /app/pemeriksaan?id=evidenceVersionId | Antrean/detail pemeriksaan pengelola |
| /app/bukti?id=evidenceVersionId | Bukti final sesuai akses |
| /app/penugasan | Antrean dan filter penugasan pribadi |
| /app/penilaian?id=assignmentId | Bukti, tiga instrumen, draf/final pribadi |
| /app/riwayat | Final dan revisi milik penguji |
| /app/progres-penilaian | Progres, kendala dan izin revisi pengelola |
| /app/pengelolaan | Periode, akun fiktif, pasangan penguji, pengumuman, aktivitas |
| /app/monitoring | Lima perspektif, filter dan CSV status fiktif |
| /app/moderasi?id=caseId | Perbandingan indikator, tanggapan dan penutupan kasus |
| /app/publikasi?id=attemptId | Pratinjau, publikasi versi baru dan penarikan |
| /app/hasil | Hasil yang sengaja dipublikasikan kepada peserta |
| /app/wawancara | Jadwal/status kondisional sesuai periode dan akun |

Domain/data/services menangani state dan validasi; plugin menjadi adaptor dengan proyeksi sesuai akun. Snapshot schema 1/2/3 dimigrasikan ke 4 tanpa mengganti key UKIN atau membuang data sebelumnya. Metadata final lama menjadi assessment fixture berlabel melalui migrasi Tahap 3; migrasi ke Tahap 4 mempertahankan nilai/draf yang sudah ada. JSON lokal tetap bisa dibaca developer tools; pembatasan akses bukan keamanan production. Screenshot referensi tidak menjadi aset publik.

## Dokumen

[AGENTS](AGENTS.md) · [PRD](docs/PRD.md) · [Rencana](docs/IMPLEMENTATION_PLAN.md) · [Arsitektur](docs/ARCHITECTURE.md) · [Workflow](docs/ASSESSMENT_AND_WORKFLOW.md) · [Desain](docs/DESIGN_SYSTEM.md) · [Panduan demo](docs/DEMO_GUIDE.md)

CODEX_PROMPT.md adalah prompt awal Tahap 0-1; instruksi pengguna berikutnya mengizinkan Tahap 2, 3, lalu 4. MANIFEST.json adalah inventaris konteks awal. Workspace belum memiliki Git; tidak ada remote, commit, push, atau deployment. Berhenti untuk review Tahap 4.
