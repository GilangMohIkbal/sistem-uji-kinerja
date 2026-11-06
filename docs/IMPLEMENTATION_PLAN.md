# Rencana implementasi UKIN — enam tahap (0–5)

**6 November 2026 — finalisasi source dan persiapan Tahap 5 selesai; penerimaan browser/Linux masih terbuka.** Tahap 0–4 dipertahankan. Seluruh 47 tes, Nuxt typecheck, static generate Windows, verify sebelum/sesudah build dan verify:output lulus. Belum ada push atau deployment; repository tujuan belum ditentukan.

## Tahap 0 — fondasi proyek dan instalasi yang dapat diulang

Siapkan repository UKIN mandiri, Nuxt/TypeScript/Nuxt UI/Tailwind stabil, tokens, folder domain/service, accounts, clock, serta fixture tipis. Periksa registry dan buat lockfile dari instalasi bersih. Pilih versi Node/npm yang kompatibel; pin versi yang benar-benar diuji. Jangan mewarisi dependency offline Windows atau konfigurasi deploy LMS.

Buat script dev/typecheck/test selektif/generate/verify output yang diperlukan. Lakukan clean install dan build awal Linux jika runner tersedia; catat batas bila tidak tersedia. Tidak perlu menguji seluruh domain yang belum dibuat.

**Keluar tahap:** fondasi bisa dijalankan; source dan lockfile valid tersimpan; hasil nyata dicatat. Jika jaringan gagal, jangan hapus lingkungan yang masih bekerja atau mengarang keberhasilan install.

## Tahap 1 — pengalaman masuk dan kerangka empat peran

Landing, login mock terpisah, shell desktop/mobile, dashboard peserta, penguji (akun dosen/guru berbeda), dan pengelola. Fixture memiliki periode dan tiga komponen; dashboard ringkasan dari state. Sediakan pemilih akun, bantuan, mode demo, clock, serta reset.

Identitas mengacu pada fondasi bersama/screenshot lokal. Ilustrasi dan animasi orisinal diperbolehkan. Fitur fase lanjut tidak boleh tampil sebagai aksi palsu. Preview read-only boleh dengan label batas.

**Keluar tahap:** empat akun bisa masuk/berganti, navigasi dasar bekerja, visual siap ditinjau, generate berhasil. **Berhenti untuk review.** Jangan memperbanyak halaman dengan arah desain belum sesuai.

## Tahap 2 — paket bukti peserta

**Tersedia dan dipertahankan:** editor tiga komponen, contoh PDF, file lokal dengan pemulihan SHA-256, player/fallback YouTube, draft/receipt/versioning, pemeriksaan pengelola, revisi, akses final penguji, migrasi schema 1 ke 2, dan navigasi arsip retaker. Alur domain teruji; tinjauan visual/interaksi browser masih tertunda. Tahap 3 dimulai setelah instruksi pengguna berikutnya, bukan otomatis.

Editor tiga komponen, PDF/file contoh nyata, file perangkat sementara, video YouTube dengan error/fallback, laporan studi kasus, draft, checklist, submit idempotent, receipt, versi bukti, serta riwayat percobaan/retaker.

Tambahkan pemeriksaan kelengkapan pengelola yang minimal: lihat paket terkirim, tandai lengkap, minta perbaikan dengan alasan. Penugasan dapat memakai fixture pasangan tetap terlebih dahulu. Source studi kasus dari ujian hanya snapshot simulasi, tidak integrasi.

**Keluar tahap:** peserta mengirim paket, pengelola memeriksa, revisi tersimpan sebagai versi baru, file setelah refresh tidak diklaim tersedia permanen. Tes selektif versi/akses/submit; tinjau halaman paket dan preview.

## Tahap 3 — penilaian independen dosen dan guru

**Tersedia:** `/app/penugasan`, `/app/penilaian?id=assignmentId`, `/app/riwayat`, dan `/app/progres-penilaian`. Snapshot schema 3; migrasi schema 2 mempertahankan seluruh koleksi lama. Assessment, draf, final, catatan, izin revisi dan jejak proses terikat penguji/paket/rubrik. Statistik dari record assessment. Pengelola hanya memperoleh progres/kendala dan kontrol izin revisi beralasan, tanpa skor atau editor moderasi. Finalisasi dan revisi diuji selektif; UI/playback masih perlu pemeriksaan manual.

Antrean penugasan, ruang bukti/rubrik tiga komponen, deskriptor JSON versi tetap, catatan timestamp video, simpan draft, finalisasi, riwayat penilaian, serta revision guard. Akun dosen/guru tidak berbagi draft atau membocorkan skor pasangan.

Tampilkan skor komponen demo tanpa nilai gabungan/kelulusan. Paket bermasalah tidak diberi nol otomatis. Tunda publikasi peserta sampai mekanisme tahap 4.

**Keluar tahap:** dua akun dapat menilai paket yang sama secara terpisah dan final tercatat pada versi yang tepat. Tidak ada penilaian AI atau editor rubrik besar.

## Tahap 4 — pengelolaan, moderasi, wawancara, publikasi

CRUD ringan periode/pengguna, penugasan pasangan, monitoring seluruh sudut pandang, kuota opsional default nonaktif, moderasi manual, revisi beralasan, publikasi feedback, pengumuman, CSV fiktif, dan wawancara kondisional.

Pastikan kedua final sesuai versi sebelum publikasi; moderasi terbuka memblokirnya. Pengelola mengatur alur, tidak mengedit skor. Wawancara bukan skor keempat. Counter seluruh halaman dari state bersama.

**Keluar tahap:** siklus peserta → dua penguji → pengelola → peserta lengkap, termasuk satu kasus revisi/moderasi, tanpa backend.

## Tahap 5 — kesiapan presentasi dan deployment

**Aktual:** koreksi pesan landing yang usang, pemeriksaan lockfile Linux, .nvmrc, ignore file lokal, workflow Linux manual tanpa deploy, template Workers Static Assets dan panduan final tersedia. Tidak ada perubahan state/schema/rubrik atau dependency. Browser terisolasi timeout; Linux ci belum dapat dijalankan karena Docker/WSL ditolak. Panduan demo/manual diperbarui tanpa menandai UAT lulus. URL publik dan pemeriksaan di hosting tetap menunggu target serta otorisasi, bukan bagian yang diklaim selesai.

Jalankan satu alur manual pada laptop/ponsel, perbaiki bug yang menghambat demo, periksa refresh route dan assets, reset/role-switch/persistence, tautan/video, serta data fiktif. Hindari redesign besar dan fitur baru.

Clean install Linux dari lockfile, typecheck/test relevan/generate/output. Siapkan Worker UKIN terpisah (rekomendasi), jangan deploy ke Worker LMS. Publikasikan hanya setelah otorisasi. Catat URL aktual, commit, command, serta hasil smoke test. Sediakan panduan demo yang cocok dengan source, bukan hanya target dokumen.

**Keluar tahap:** URL terverifikasi dan skenario presentasi bisa diulang; bagian belum diuji tetap disebut. Tidak ada klaim siap production.

## Aturan lintas tahap

Jangan memakai angka jumlah tes sebagai target. Pertahankan regresi penting dan tambahkan tes hanya untuk logika rawan. Browser automation yang gagal bukan alasan membuat lusinan percobaan ulang; sediakan checklist manual, lanjutkan fitur sesuai instruksi pengguna. Setiap penyelesaian menghasilkan catatan faktual pada PROGRESS, bukan menyalin checklist sebagai klaim lulus.
