# Fondasi desain bersama — keluarga layanan PPG UNJ

**v1.0 · 6 November 2026 · Snapshot acuan untuk UKIN, bukan perubahan pada LMS.**

## 1. Hierarki sumber visual

1. Keputusan pengguna terbaru: modern, tegas, menarik untuk mahasiswa, konsisten lintas empat layanan.
2. LMS emerald/teal yang sudah disetujui: screenshot lokal dan token dari source repository.
3. Web ujian yang ditunjuk pengguna: screenshot lokal; URL sebagai rujukan tambahan bila bisa diakses.
4. Screenshot UKIN nasional: **fungsi saja**, bukan warna, logo, atau layout wajib.

Website PPG lama tidak dipakai sebagai dasar. Website utama baru belum tersedia, sehingga jangan mengarang desain yang diklaim berasal darinya.

Sumber LMS diperiksa pada `app/assets/css/main.css` serta `docs/DESIGN_SYSTEM.md` versi 0.7. Snapshot ini tidak berarti desain pada website live telah diaudit pada saat paket dibuat. URL live LMS dan web ujian tidak dapat dibuka oleh alat browsing pada sesi penyusunan; screenshot pengguna tetap menjadi dasar visual. Rinciannya ada di [DECISIONS_AND_SOURCES.md](DECISIONS_AND_SOURCES.md).

## 2. Yang dibagikan dan yang bebas

| Bagikan sebagai identitas keluarga | Bebas dieksplorasi sesuai fungsi |
|---|---|
| Keluarga emerald/teal dan navy; putih/netral dingin | Komposisi hero/landing dan posisi ilustrasi |
| Ketegasan tipografi sans-serif dan skala yang terbaca | Layout dashboard peran dan ruang penilaian |
| Karakter kontrol, focus ring, radius, ikon konsisten | Karakter/ilustrasi orisinal UKIN dalam gaya selaras |
| Status bermakna dengan teks, bukan warna saja | Transisi, gerak singkat, dan detail ekspresif |
| Bahasa antarmuka Indonesia dan penjelasan mode demo | Navigasi, tabel, kartu, timeline, split view sesuai pekerjaan |

Tidak ada perintah untuk menyalin dua kolom, ukuran sidebar, posisi logo, atau urutan section dari LMS. Nama produk adalah UKIN, bukan LMS. Identitas institusi disampaikan melalui teks dan aset resmi yang benar-benar disediakan; jangan menganggap ikon generik sebagai logo resmi.

## 3. Token terverifikasi dari source LMS

Salinan mesin ada di `references/brand.tokens.json`; CSS reference ada di `references/brand-tokens.css`. Nilai bukan hasil menebak piksel screenshot web ujian.

| Token | Nilai | Peran |
|---|---|---|
| brand | `#007F6D` | Aksi utama dan aksen aktif |
| brand-dark | `#005C53` | Penekanan dan teks brand |
| brand-deep | `#063D39` | Bidang identitas gelap |
| accent | `#52E0BF` | Detail terang pada bidang gelap |
| ink | `#142B40` | Judul dan teks utama |
| muted | `#506579` | Teks pendukung yang tetap terbaca |
| canvas | `#F3F7FA` | Latar aplikasi |
| paper | `#FFFFFF` | Form dan area baca |
| line | `#D7E2E8` | Pemisah |
| control-border | `#7A8E9E` | Batas kontrol |
| tint | `#E8F7F2` | Bidang pendukung lembut |
| warning | `#93450D` | Perhatian, dengan label teks |
| danger | `#B42335` | Error/destruktif |
| focus | `#2376D2` | Fokus keyboard |

Gradient dasar dari LMS: `linear-gradient(125deg, #005C53, #007F6D)`. Bayangan: `0 10px 30px #102D4010`. Font dasar: `"Segoe UI", "Helvetica Neue", Arial, sans-serif`.

Pertahankan pengenalan keluarga, tetapi perluas semantic tokens bila ada kebutuhan informasi/moderasi. Jangan menyatakan seluruh kombinasi warna telah lolos kontras; periksa pasangan aktual saat digunakan. Mint terang bukan warna teks kecil pada putih.

## 4. Tipografi, permukaan, dan kepadatan

Gunakan sans-serif dengan heading tegas dan body yang nyaman dibaca. Sistem font LMS menjadi fallback yang aman; font lain boleh diusulkan secara konsisten dan berlisensi, bukan memaksa CDN. Tidak ada berkas font dalam paket ini.

Target arahan, bukan ukuran halaman yang dikunci: body sekitar 15–16px, label/metadata penting tetap jelas, kontrol utama sekitar 44px, paragraf dan rubrik tidak terlalu panjang per baris. Radius kontrol 8–10px, panel 12–18px, ilustrasi lebih fleksibel. Tidak semua panel harus punya shadow besar.

Gunakan warna tegas untuk identitas, prioritas, dan keadaan aktif. Area perangkat/rubrik tetap putih dan tenang. Desain resmi tidak harus pucat, dan desain muda tidak harus menyerupai game.

## 5. Ilustrasi dan animasi

Bahasa awal: objek pendidikan berlapis, outline/icon terkontrol, kedalaman ringan, serta aksen emerald/teal. Karakter pendamping, ilustrasi manusia orisinal, atau objek tiga dimensi ringan diperbolehkan bila selaras; tidak wajib menyalin buku LMS. Jangan membawa larangan maskot pada dokumen LMS sebagai larangan global UKIN.

Landing/login boleh ekspresif. Dashboard memakai gerak untuk orientasi dan feedback. Ruang membaca/menonton/menilai mengutamakan fokus. Hormati reduced motion, jangan membuat tombol menunggu animasi, jangan memberi progress/sukses palsu, dan hindari animasi berulang di dekat video/rubrik. Animasi bukan bukti proses unggah/validasi telah terjadi.

Aset orisinal atau berlisensi sesuai penggunaan; catat sumber. Screenshot referensi bukan aset publik dan bukan lisensi untuk menyalin ilustrasi pihak ketiga.

## 6. Cara membagikan identitas tanpa monorepo

Pada versi mock, setiap repository membawa salinan fondasi + token yang memiliki versi sama. Perubahan brand dicatat agar dapat diterapkan sengaja ke produk lain, bukan dilakukan otomatis oleh Codex.

Jangan impor CSS dari URL live LMS, path `../LMS`, atau folder lokal developer. UKIN harus build dari repository sendiri. Bila kelak empat produk perlu komponen bersama, Nuxt layer/paket internal bisa dievaluasi terpisah; itu bukan syarat tahap awal.
