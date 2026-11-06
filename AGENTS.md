# AGENTS.md — UKIN PPG UNJ

## Konteks dan batas mutlak

Repository ini hanya untuk **mock UKIN PPG UNJ**, bukan LMS dan bukan backend production. Bekerja hanya di root repository ini. Jangan mengubah folder, remote, akun, deployment, storage key, atau dokumen LMS. Repository lain boleh dibaca sebagai referensi hanya bila tersedia dan diizinkan; tidak menjadi dependensi build.

Tidak ada database, API server bisnis, SSO, pembayaran, AI penilai, atau integrasi ujian nyata. Empat akun demo mewakili peserta, penguji dosen, penguji guru, dan pengelola. Semua data fiktif. Guard frontend bukan keamanan production.

## Baca sebelum mengerjakan

1. `docs/PROGRESS.md` dan tahap aktif di `docs/IMPLEMENTATION_PLAN.md`.
2. `docs/PRD.md` dan `docs/DECISIONS_AND_SOURCES.md`.
3. `docs/PPG_UNJ_DESIGN_FOUNDATION.md`, `docs/DESIGN_SYSTEM.md`, dan gambar relevan di `references/screenshots/`.
4. `docs/ASSESSMENT_AND_WORKFLOW.md` untuk state/akses; `docs/RUBRIC_DEMO.md` untuk nilai; `docs/ARCHITECTURE.md` untuk implementasi.

Jika ada konflik, dahulukan instruksi pengguna terbaru, lalu keputusan terkini yang dicatat. Jangan mengubah aturan bisnis untuk menyamarkan bug. Jangan menganggap implementasi yang ada otomatis benar. Klarifikasi keputusan substansial bila benar-benar dibutuhkan, tetapi lanjutkan default demo yang sudah didokumentasikan tanpa bertanya berulang.

## Desain

Pertahankan emerald/teal, navy, permukaan putih, ketegasan tipografi, dan karakter modern keluarga PPG UNJ. Layout, komposisi, ilustrasi orisinal, karakter opsional, serta animasi tetap ruang kreatifmu. Jangan menyalin ungu/logo kementerian dari screenshot nasional, dan jangan memakai website PPG lama sebagai acuan.

Nuxt + TypeScript + Nuxt UI + Tailwind adalah fondasi. Komponen Vue khusus diperbolehkan. Pilih versi stabil kompatibel dan catat versi nyata; jangan menyalin Nuxt UI prerelease/lockfile LMS secara otomatis. Tidak ada UI kit kedua. Dependensi animasi tambahan boleh bila manfaatnya jelas dan diuji, bukan keharusan.

## Invariant domain

Tiga komponen: perangkat, video, studi kasus. Wawancara opsional dan bukan skor keempat. Paket final dan hasil final memiliki versi. Penguji tidak melihat draf/skor pasangan sebelum moderasi yang diotorisasi. Peserta hanya melihat hasil yang sengaja dipublikasikan pengelola. Nilai kosong bukan nol. Dilarang mengarang ambang kelulusan/standar resmi.

Gunakan snapshot state bersama; hitung ringkasan dari data, bukan angka lepas. Role switch dalam tab yang sama tidak mereset pekerjaan. Reset hanya namespace UKIN. File lokal sementara dan URL YouTube eksternal harus dijelaskan jujur.

## Pengerjaan dan verifikasi

Kerjakan hanya tahap yang diminta. Jangan mengimplementasikan seluruh PRD dalam satu sesi atau mempublikasikan repo/deployment tanpa otorisasi. Tambahkan fitur nyata bertahap; sembunyikan aksi yang belum tersedia atau beri keterangan jujur.

Cek jaringan dan clean install sejak awal. Jangan membuat lockfile offline dari `node_modules` yang disalin. Uji aturan rawan demo secara selektif; jalankan typecheck, test relevan, generate, dan cek aset bila script tersedia. Jangan mengklaim command tersedia/berhasil sebelum dibuat/dijalankan.

Jika browser gagal, catat satu upaya yang relevan dan keterbatasannya; jangan mengulang tanpa perubahan lingkungan. Perbarui `PROGRESS.md` dengan file/alur yang berubah, keputusan, hasil nyata, bagian belum diuji, dan tahap berikutnya. Bedakan implementasi, pemeriksaan source, tes logika, pemeriksaan browser, dan deployment.
