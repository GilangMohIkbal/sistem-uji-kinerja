# Sistem desain UKIN — kebutuhan pengalaman, bukan template layout

**v0.4 - 6 November 2026 - Finalisasi source Tahap 5; render browser belum diverifikasi.**

Baca [PPG_UNJ_DESIGN_FOUNDATION.md](PPG_UNJ_DESIGN_FOUNDATION.md) sebagai fondasi. Pengguna menyetujui keluarga emerald/teal, navy, putih, gradient, dan pengalaman visual hidup. Persetujuan itu tidak berarti tampilan UKIN baru sudah ditinjau.

## Sasaran peran

**Peserta:** menenangkan, jelas, menunjukkan langkah berikutnya. Pekerjaan yang belum lengkap terlihat tanpa mempermalukan peserta. Konfirmasi final menyebut bukti/versi serta dampak penguncian.

**Penguji dosen/guru:** area kerja fokus. Bukti, indikator, catatan, dan status simpan mudah diakses. Scrolling panjang tidak menghilangkan konteks peserta/periode. Draf tidak hilang ketika pindah perangkat → video → studi kasus.

**Pengelola:** memperlihatkan hambatan dan tindakan. Angka antrean membuka daftar terkait. Kategori pemeriksaan dokumen, penilaian, dan publikasi tidak disatukan menjadi label lulus.

## Halaman publik

Landing memperkenalkan UKIN PPG UNJ, tiga komponen, alur, panduan, dan akses masuk. Login berada pada halaman berbeda. Jangan menyalin pola login yang tertanam di hero web ujian hanya karena itu referensi warna.

Komposisi, headline, posisi ilustrasi, dan layout adalah keputusan kreatif Codex. Hindari testimonial, logo mitra, jumlah peserta, dan klaim keamanan yang dibuat-buat. Tombol ke website utama baru tidak diaktifkan karena URL belum tersedia.

## Navigasi setelah login

Kelompok fungsi, bukan kewajiban bentuk sidebar:

| Peserta | Penguji | Pengelola |
|---|---|---|
| Dashboard | Dashboard | Dashboard |
| Paket UKIN | Penugasan | Periode & peserta |
| Status & umpan balik | Riwayat penilaian | Paket & kelengkapan |
| Jadwal (bila aktif) | Wawancara (bila aktif) | Penugasan penguji |
| Pengumuman/panduan | Pengumuman/panduan | Monitoring & moderasi |
| | | Pengumuman & pengguna |

Dashboard penguji dosen/guru berbagi komponen, bukan salinan halaman berbeda yang mudah menyimpang. Nama halaman menggunakan istilah jelas seperti "Penilaian UKIN", tidak wajib meniru "Dokumen UKPPPG".

## Komponen pengalaman yang perlu dirancang

- Identitas layanan, pemilih periode, pemilih akun demo, dan indikator mode demo.
- Checklist paket serta jenis bukti; badge keadaan yang memiliki teks.
- Preview bukti dan pesan "File perangkat perlu dipilih ulang".
- Pemutar video dengan klik untuk memuat, status error, dan catatan timestamp.
- Butir rubrik dengan deskriptor, kontrol skor yang dapat diakses keyboard, serta catatan bukti.
- Status draf tersimpan, belum tersimpan, dan final; feedback tidak hanya berupa toast cepat.
- Perbandingan moderasi yang jelas siapa pemilik skor, versi, dan alasannya.
- Timeline receipt, pemeriksaan teknis, penilaian, serta publikasi.
- Filter kosong, data tidak tersedia, belum ditugaskan, dan periode tertutup dengan langkah pemulihan.

Tabel diperbolehkan bila sesuai pekerjaan pengelola; larangan dashboard generik bukan larangan tabel yang berguna. Jangan membuat semua isi sebagai kartu hanya demi variasi.

## Keadaan dan salinan penting

Bedakan "Berkas lengkap", "Siap dinilai", "Penilaian selesai", dan "Hasil dipublikasikan". Tidak satu pun otomatis berarti lulus. "URL valid" tidak sama dengan "Video dapat diputar" atau "Video ditinjau".

Peserta tidak diberi badge "Nilai tersedia" sebelum pengelola menerbitkan hasil. Penguji tidak melihat finalisasi pasangan sebagai izin melihat skor. Pengelola tidak memiliki editor skor tersembunyi.

## Aksesibilitas dan gerak

Light mode dahulu. Teks penting tidak diperkecil demi mengisi kartu. Fokus terlihat di bidang gelap dan terang; kontrol berlabel; status tak mengandalkan warna; modal memiliki jalan batal; feedback error menunjuk field. Pindahkan fokus secara masuk akal setelah submit, tutup dialog, dan pergantian rute.

Transisi dan animasi boleh lebih ekspresif daripada LMS apabila bermanfaat. Sediakan reduced motion, hindari kedipan/autoplay audio, dan jangan menaruh gerak berkelanjutan di ruang penilaian. Jam/progres tidak digerakkan palsu oleh animasi.

## Responsivitas

Periksa desktop dan ponsel dasar, khususnya editor paket, video + rubrik, tabel monitoring, serta dialog konfirmasi. Layout desktop boleh mempunyai rail atau split view; pada mobile gunakan susunan/tabs yang tetap memberi akses semua tindakan. Jangan sekadar mengecilkan seluruh desktop.

## Bukti yang harus dicatat setelah implementasi

Tambahkan arah ilustrasi aktual, komponen yang dibuat, perubahan token, screenshot render yang benar-benar diperiksa, serta keterbatasan browser. Kualitas tidak dibuktikan dengan daftar kelas CSS saja. Jangan tandai AC responsif atau keyboard lulus tanpa menjalankannya.

## Implementasi Tahap 1 - 6 November 2026 (checkpoint awal)

Arah visual aktual: ruang bukti kinerja dengan dokumen berlapis, simbol buku/check, aksen video dan refleksi. Komposisi landing ekspresif; login split dengan bidang teal gelap; dashboard area baca putih di canvas dingin dengan rail desktop dan dialog navigasi mobile. Ilustrasi, favicon, dan ikon dibuat orisinal sebagai SVG/CSS lokal, tidak menyalin aset screenshot atau mengaku sebagai logo resmi UNJ.

Seluruh 14 token warna dari references/brand.tokens.json tetap sama dalam app/assets/css/main.css. Palet brand50–950 ditambahkan untuk Nuxt UI; primary mengarah ke brand600 (#007F6D). System sans tanpa fetch font. Tidak ada UI kit atau dependensi animasi tambahan.

Komponen: BrandMark, AppIcon, UkinIllustration, WorkspaceNav, ComponentOverview. Halaman menerapkan focus-visible, skip link, native dialog dengan pembatalan, label form, live feedback, pengumuman dibaca, reduced motion, dan breakpoint mobile. Teks body utama14–16px; metadata penting12px atau lebih. Status preview dan data fiktif diberi label. Tidak ada tombol unggah/penilaian palsu.

Screenshot LMS landing/login/dashboard dan web ujian yang tersedia lokal telah diperiksa sebagai referensi. Tidak ada inspeksi ulang situs live atau browser aplikasi UKIN. Source/aset diperiksa; hasil render, kontras semua kombinasi, zoom, keyboard, dan mobile masih menunggu checklist manual karena instalasi registry gagal.

## Implementasi Tahap 2 — 6 November 2026

Identitas dan 14 token warna tetap dipertahankan. Landing/login tidak didesain ulang. Editor peserta menyusun satu paket bernomor 01–03 dengan checklist/deadline/simpan pada rail desktop dan susunan satu kolom pada layar sempit. Status paket dan pemeriksaan tampil terpisah; dialog pengiriman menjelaskan penguncian, versi, dan batas file/YouTube.

Pengelola memakai antrean berfilter dan detail bukti berdampingan dengan pemeriksaan per komponen; alasan teknis terlihat dekat komponen terkait. Receipt memakai bidang emerald, nomor bukti, timeline aktor/waktu. AttemptHistory menampilkan arsip retaker terpisah dari versi perbaikan. Komponen baru: EvidenceFileCard, EvidenceVideo, EvidenceReadView, AttemptHistory. Dokumen contoh pedagogi dibuat fiktif dan dibundel lokal.

Nuxt UI tetap satu-satunya UI kit; tidak ada dependency animasi/font baru. Source menyediakan breakpoint, status teks, label/focus, native dialog dan reduced motion. Typecheck/build/aset lulus; **render desktop/mobile, fokus dialog, kontras aktual, zoom dan player eksternal belum diverifikasi** karena akses browser alat terhambat. Laporan pengguna bahwa aplikasi dapat dibuka dicatat terpisah di PROGRESS.md.


## Ruang penilaian Tahap 3 — 6 November 2026

- Identitas emerald/teal, navy, putih dan 14 token bersama dipertahankan. Landing/login tidak didesain ulang. CSS khusus `.assessment-page` ada di `app/assets/css/assessment.css`, memakai Nuxt UI dan komponen Vue tanpa UI kit atau dependency baru.
- Penugasan berupa kartu dengan status pribadi, kelengkapan, versi paket, dan tindakan kontekstual. Filter periode, bidang studi, status dan nama berasal dari state; kendala/terkunci dijelaskan dengan kalimat.
- Ruang kerja menempatkan bukti dan rubrik berdampingan pada layar lebar. Panel bukti sticky dengan scroll sendiri, lalu bertumpuk di bawah 1150 px. Tab tiga komponen mempertahankan instance editor/video melalui v-show. PDF dapat dibuka di tab lain tanpa mereset draf; empat bagian studi kasus dibaca di panel yang sama.
- Setiap indikator menampilkan nama/deskripsi dan empat deskriptor, radio skala 1–4, rujukan bukti, serta catatan. Tidak memakai tabel skor kosong. Pilihan terpilih memakai emerald terang dengan border; kosong diberi label berbeda dan aksi kosongkan. Feedback/konfirmasi tinjauan ada per komponen.
- Savebar navy menampilkan status belum disimpan/tersimpan/final, tombol simpan dan tinjau. Dialog modal memakai ringkasan per komponen, feedback, versi dan konfirmasi. Tidak ada nilai gabungan atau label lulus. Fokus native/dialog dan kontras masih perlu diuji manual di browser.
- Video memakai EvidenceVideo Tahap 2. Notebook menyediakan pilihan video, timestamp manual/ambil waktu, indikator opsional, daftar catatan dengan aksi seek dan fallback link YouTube. Catatan bersifat pribadi; kendala teknis yang dilaporkan ke pengelola memakai formulir terpisah.
- Riwayat memperlihatkan final per versi dalam disclosure, skor/deskriptor/feedback sendiri, alasan revisi, izin, dan aktor/waktu. Final fixture diberi label contoh skenario. Pengelola mendapat progres dan izin revisi minimal tanpa nilai pasangan atau editor moderasi.
- Responsive card/grid, focus-visible, label form, status/error live, dan reduced-motion tersedia di source. Belum mengklaim pemeriksaan visual desktop/mobile atau interaksi browser lulus.


## Penyempurnaan Tahap 5

Pesan landing disesuaikan dengan fitur Tahap 0–4 yang sudah tersedia. Panel peringatan pengelola menggunakan token --warning yang sudah didefinisikan, menggantikan referensi --gold yang tidak tersedia. Tidak mengubah 14 warna brand, layout, ilustrasi atau pola interaksi. Review CSS/source tidak menggantikan pemeriksaan visual; desktop/mobile masih perlu diperiksa karena preview browser timeout.

## Ruang pengelola dan moderasi Tahap 4

Enam halaman baru memakai operations.css serta komponen/ikon lama: pengelolaan, monitoring, moderasi, publikasi, hasil, wawancara. Empat belas warna brand tetap identik. Landing/login dan ruang penilaian Tahap 3 dipertahankan.

- Navigasi menambah ruang kerja sesuai peran. Wawancara hanya muncul bila periode terkait mengaktifkannya. Pengelolaan memakai tab periode/akun/penugasan/pengumuman/aktivitas, dengan alasan tindakan administratif yang terlihat.
- Monitoring memakai filter periode/bidang dan perspektif peserta/dokumen/penguji/nilai/wawancara. Metrik berasal dari data yang tersaring. Tabel status bisa digulir pada layar sempit; catatan rubrik tidak diekspor.
- Moderasi memakai dua kartu penguji berdampingan, label final dan indikator terpilih. Kartu milik sendiri ditandai border emerald. Tanggapan dan alasan penutupan berada di bawah perbandingan. Pada layar kecil kartu ditumpuk.
- Publikasi memisahkan kesiapan, alasan tindakan, pemilihan indikator kasus, penulisan feedback dan pratinjau peserta. Checkbox konfirmasi direset saat isi pratinjau berubah. Riwayat memperlihatkan versi/status dan alasan penarikan.
- Hasil peserta menonjolkan kekuatan, pengembangan dan feedback tiga komponen. Skor opsional berlabel dosen/guru, tanpa nilai gabungan atau kelulusan. Status belum terbit/ditarik menjelaskan langkah berikutnya.
- Wawancara menampilkan jadwal WIB, pasangan dan status; catatan internal tidak muncul pada peserta. Form menyebut tautan eksternal/simulasi secara jujur.
- Panel putih, gradient emerald terkontrol, tipografi navy, label form, focus-visible dan status/error live dipakai konsisten. Pemeriksaan visual desktop/mobile, fokus keyboard dan interaksi browser tetap harus dilakukan manual; build bukan bukti render UI.
