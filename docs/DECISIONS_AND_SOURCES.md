# Keputusan, sumber, dan batas kepastian

**Tanggal penyusunan: 6 November 2026.** Dokumen ini membedakan kebutuhan pengguna, observasi sumber, dan usulan implementasi. Jangan menaikkan usulan menjadi ketentuan resmi tanpa bukti baru.

## 1. Keputusan dari percakapan pengguna

| ID | Keputusan |
|---|---|
| D01 | UKIN adalah website tersendiri, bukan penambahan modul LMS. |
| D02 | Empat layanan PPG UNJ: website utama baru, ujian, LMS, UKIN; identitas khas bersama. |
| D03 | Acuan visual hanya LMS disetujui dan web ujian yang ditunjuk; website PPG lama bukan acuan. |
| D04 | UKIN mempunyai landing/beranda, lalu halaman login, baru dashboard. |
| D05 | Peserta mengumpulkan perangkat dan video; YouTube dipilih agar aplikasi tidak menyimpan video besar. |
| D06 | Tiga jenis penilaian: perangkat pembelajaran, video praktik pembelajaran, dan studi kasus. |
| D07 | Dosen dan guru sebagai penguji; pengelola masuk rancangan operasional. |
| D08 | Rubrik boleh mengacu standar yang relevan; pengguna belum memberikan instrumen resmi lengkap. |
| D09 | Screenshot nasional hanya referensi fungsi pelengkap, bukan acuan visual wajib. |
| D10 | Desain modern/tegas sekaligus menarik untuk mahasiswa; ilustrasi, karakter, animasi, dan komposisi kreatif diperbolehkan. |
| D11 | Prototipe frontend; pengujian proporsional untuk presentasi, bukan audit production penuh. |
| D12 | Pengguna mengizinkan melanjutkan penyusunan paket konteks, bukan deployment/ubah repository lama. |

## 2. Default usulan yang dibuat untuk menutup kebutuhan mock

Empat akun demo dengan satu peserta interaktif; dua penguji berbeda dosen/guru per attempt; enam peserta fixture; rubrik analitik 12 indikator dengan skala 1–4; skor per komponen tanpa agregat/kelulusan; moderasi manual; wawancara kondisional; kuota nonaktif default; sumber studi kasus participant_report atau exam_snapshot simulasi; data satu tab; fase 0–5; Workers Static Assets terpisah.

Default ini dapat langsung diimplementasikan untuk mock. Tidak satu pun diklaim sebagai peraturan nasional. Nama kegiatan/jadwal fixture juga fiktif. Instrumen resmi, bobot, kriteria kelulusan, prosedur banding, serta kewajiban wawancara tetap memerlukan sumber pengguna/penyelenggara sebelum produksi.

## 3. Referensi visual dan source yang benar-benar digunakan

**R01 — Source LMS milik pengguna.**
Repository: `https://github.com/GilangMohIkbal/Learning-Management-System_Mock`
Berkas dibaca melalui koneksi GitHub: `app/assets/css/main.css` (token dan tipografi), `docs/DESIGN_SYSTEM.md` (v0.7), `package.json`.
Blob dokumen desain yang diperiksa: `3baae26e1a3267e2a0da6f55edd4c967c890a5e3`.
Blob package.json yang diperiksa: `b708e6310b327fb85e3b4226b63021c3877e757f`.
Dukungan: token emerald/teal/navy, system sans, komponen Nuxt UI/Tailwind, dan keberadaan Nuxt UI alpha pada proyek lama. Bukan bukti versi tersebut wajib dipakai UKIN. Tidak menyalin AGENTS/domain/mock state/lockfile LMS.

**R02 — Screenshot LMS versi yang disetujui pengguna.**
Tersimpan lokal pada `references/screenshots/lms-landing.png`, `lms-login.png`, `lms-dashboard.png`. Bukti visual desktop tertentu, bukan audit interaksi/mobile. Login telah dihapus isi inputnya untuk menjaga data yang tidak diperlukan.

**R03 — Web ujian yang ditunjuk pengguna.**
URL: `https://simppg.unj.ac.id/ukmppg/login`.
Screenshot pengguna: `references/screenshots/exam-landing-login.png`.
Dukungan: identitas visual, emerald/teal, navy, putih, kontrol tegas, ilustrasi/gradient. **Akses live via alat browsing tidak berhasil pada sesi penyusunan**, sehingga tidak mengklaim HTML/CSS/interaksi situs live diperiksa. URL tetap disimpan agar Codex dapat mencoba akses sah bila tersedia. Tidak menyalin layout login-in-hero ke UKIN secara wajib.

**R04 — LMS hasil deployment yang dilaporkan pengguna.**
URL: `https://ppg-unj-lms.gilangmohikbal.workers.dev`.
URL tidak berhasil diambil lewat alat browsing pada sesi ini. Riwayat deployment percakapan menunjukkan Workers, bukan Pages. Screenshot dan source menjadi dasar nyata untuk desain. Tidak ada akses tulis atau perubahan pada layanan ini.

**R05 — Screenshot sistem UKIN nasional dari pengguna.**
Sidebar penguji: Dashboard, Dokumen UKPPPG, Wawancara UKPPPG, Riwayat Penilaian. Sidebar pengelola: Uji Kinerja/Pembayaran/Uji Kinerja Analitik; Monitoring Dokumen/Nilai/Penguji/Peserta/Wawancara; Kelola Penilai UKPPPG; Kelola User Dosen/Guru/Pemantau; Peminjaman.
Halaman Dokumen: filter tahun/kegiatan; Belum Dinilai/Sudah Dinilai/Proses Penilaian/Perlu Moderasi; periode; kuota harian; kolom nama/LPTK/pasangan penilai/status; Entry Nilai; label retaker.
Dukungan hanya fungsi/label terlihat. Tidak membuktikan bobot, ambang moderasi, kriteria lulus, aturan pembayaran/peminjaman, isi rubrik, atau identitas penilai wajib di semua periode. Paket hanya menyertakan crop summary/header yang tidak menampilkan data identitas peserta/penguji. Logo/ungu pada referensi tidak dipakai sebagai identitas UKIN UNJ.

## 4. Rujukan teknis primer yang diperiksa

**T01 — Codex AGENTS.md.**
`https://developers.openai.com/codex/guides/agents-md`
Mengarah ke dokumentasi ChatGPT Learn mengenai instruksi berlapis repository. Mendukung penggunaan AGENTS ringkas dan rujukan dokumen per proyek; bukan jaminan seluruh riwayat chat selalu terbawa.

**T02 — Codex Cloud.**
`https://help.openai.com/en/articles/20001545-using-codex-cloud`
Menjelaskan lingkungan proyek/repository serta workspace tugas terisolasi. Karena itu paket konteks perlu berada dalam repository UKIN; folder lokal saudara tidak diasumsikan tersedia.

**T03 — Nuxt UI.**
`https://nuxt.com/modules/ui`
Referensi fondasi UI/Tailwind. Halaman instalasi Nuxt UI yang dicoba mengembalikan content-type yang tidak dapat diparse alat browsing; verifikasi instruksi versi aktual saat implementasi. Tidak menetapkan versi baru dari tebakan.

**T04 — YouTube IFrame API.**
`https://developers.google.com/youtube/iframe_api_reference`
Mendukung pemutar embed dan kontrol waktu, termasuk contoh video ID `M7lc1UVf-VE`. ID tersebut hanya contoh teknis dokumentasi, bukan video praktik guru dan belum diuji pemutarannya dalam paket ini. Tidak mengambil identitas/rekaman anak sungguhan.

**T05 — Workers Static Assets.**
`https://developers.cloudflare.com/workers/static-assets/get-started/`
`https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/`
Rujukan deployment static asset serta HTML routing. Bentuk config paket adalah usulan; belum ada deployment UKIN.

## 5. Batas penggunaan standar penilaian

Paket ini **tidak melampirkan atau mengekstrak rubrik resmi nasional/internasional**. Percakapan sebelumnya membahas kemungkinan variasi jalur/periode dan prinsip penilaian berbasis bukti, tetapi keputusan scoring di paket diberi label demo, bukan kutipan instrumen.

Sebelum implementasi nyata, tetapkan jalur/periode dan berikan dokumen pedoman lengkap. Versi instrumen baru harus menyimpan provenance. Jangan menggunakan satu screenshot sebagai dasar klaim compliance, dan jangan menyalin indikator resmi yang belum diberikan.

## 6. Ruang tidak dibaca/diubah

Website PPG lama yang disebut pengguna tidak digunakan sebagai acuan. Tidak mengakses login bercredential situs nasional/ujian, tidak mengambil data peserta, tidak mengubah LMS, tidak membuat repository/akun cloud, dan tidak menerbitkan aplikasi.

## Implementasi terbatas — 6 November 2026

- I01: instruksi terbaru mengizinkan source lokal hanya Tahap 0 dan1; berhenti untuk review. Tidak ada izin deployment/push.
- I02: state Tahap 1 menyimpan metadata kesiapan/versi, penugasan, pengumuman/read marker, dan jam bersama. Tidak menyediakan editor bukti/penilaian. Snapshot schema1 dan seed2026-11-stage1; schema tidak dikenal dijaga di disk, seed sementara di memori sampai reset eksplisit.
- I03: simbol buku/check, ilustrasi bukti, favicon dan ikon orisinal SVG/CSS. System sans, Nuxt UI saja. Token shared tidak diganti. Source tidak bergantung LMS.
- I04: network registry ENOTFOUND; tidak membuat lockfile offline. Versi exact package.json adalah deklarasi yang belum diuji instalasinya. Runtime aktual dan command ada pada PROGRESS.md.
- I05: tidak ada repository Git dalam workspace ini; tidak membuat remote/commit/push. MANIFEST.json dipertahankan sebagai inventaris paket konteks awal, bukan manifest aplikasi terkini.

Tidak ada perubahan aturan bisnis FINAL atau klaim standar penilaian resmi.

## Kelanjutan Tahap 2 — 6 November 2026

- I06 (menggantikan checkpoint I01): pengguna mengizinkan Tahap 2 dan pemulihan dari source terakhir setelah proses lama dihentikan manual. Jangan mengulang Tahap 0–1, instalasi, atau menghapus dependency/lockfile tanpa alasan terverifikasi. Berhenti setelah Tahap 2; tidak ada izin Tahap 3/push/deployment/LMS.
- I07: keberhasilan instalasi dan membuka aplikasi lokal sebelumnya adalah laporan pengguna. Sesi pemulihan membuktikan dependency tersedia, 22 tes logika/typecheck Nuxt/generate Windows/source/output lulus. Tidak membuktikan clean install Linux atau browser desktop/mobile.
- I08: schema 1 dimigrasikan menjadi schema 2 di namespace lama UKIN; bukti yang ditambahkan pada metadata fixture lama diberi label simulasi. File perangkat bersifat sementara, final hanya dapat dipulihkan pemilik dengan SHA-256 cocok. Teks pengumuman kustom dipertahankan.
- I09: batas teknis demo adalah 10 MiB per file, 10 lampiran, 10.000 karakter per bagian laporan, dan 2.000 karakter alasan per komponen. Itu bukan ketentuan nasional. Default video utuh wajib/ringkasan opsional; exam_snapshot read-only diuji melalui fixture, tanpa editor periode.
- I10: riwayat percobaan retaker ditampilkan sebagai proyeksi final yang boleh diakses akun, terpisah dari versi revisi satu percobaan. Paket lengkap tidak memberi nilai/kelulusan. Penguji hanya baca bukti sesuai assignment aktif.
- I11: browser terintegrasi timeout ke localhost; fallback bind Chrome terhambat jendela minimized. Tidak mengulang kegagalan itu atau mengklaim render/playback teruji. Penyebab hang lama tidak dapat dipastikan; proses Node/npm lama tidak ditemukan melalui pemeriksaan yang tersedia, sedangkan CIM dibatasi.

## Kelanjutan Tahap 3 — 6 November 2026

- I12 (menggantikan batas tahap I06): pengguna mengizinkan ruang penilaian dosen/guru di atas Tahap 0–2, dengan batas berhenti setelah Tahap 3. Tidak ada izin moderasi penuh/publikasi/period CRUD/interview/backend/push/deployment/LMS.
- I13: schema 3 mempertahankan seluruh data schema 2 dan key UKIN. Metadata final lama dihidrasi sebagai assessment fixture berlabel, bukan rekonstruksi nilai pengguna. Data tak dikenal/rusak tidak ditimpa otomatis.
- I14: demo-12-v1 pada periode lama dipetakan ke sumber rubrik ukin-demo-rubric-v1 versi 1.0 tanpa mengganti isi/skala. Rubrik runtime sama persis dengan JSON referensi. Skor minimum 1, kosong null, ringkasan hanya per komponen.
- I15: izin proses revisi diwujudkan sebagai izin pengelola beralasan untuk penguji/versi final tertentu, lalu alasan penguji dan final baru. Final lama dipertahankan; tinjauan tiga komponen diulang. Izin bukan moderasi. Kasus moderasi terbuka, published atau versi usang ditahan untuk alur tahap lanjut.
- I16: penilaian sebelum/sesudah jendela DemoClock baca saja. Kendala teknis beralasan menahan final tanpa memberi nol. Penguji menandai penyelesaian kendala sendiri; pengelola dapat mengurus perbaikan paket lewat workflow Tahap 2.
- I17: UI/plugin memakai proyeksi sesuai akun. Tidak ada skor/catatan pasangan pada penguji; peserta tidak melihat assessment; pengelola tahap ini hanya progres dan alasan teknis. JSON localStorage tetap dapat dibaca developer tools, bukan keamanan production.
- I18: timestamp manual adalah fallback yang sah; getCurrentTime/getDuration/seekTo memakai komponen YouTube lama. Timestamp diikat video/paket/indikator. Playback nyata dan ketepatan seek pada jaringan presentasi tetap perlu verifikasi manual.


## Kelanjutan Tahap 4 - 6 November 2026

- I19 (menggantikan batas I12): pengguna mengizinkan Tahap 4 dari workspace terakhir. Pengelolaan, moderasi, wawancara kondisional dan publikasi dikerjakan sesuai rencana; berhenti sebelum Tahap 5. Tidak ada izin push/deployment/LMS.
- I20: schema 4 mempertahankan semua koleksi schema 3, key UKIN dan sesi. Kasus/publication dari metadata lama diberi penanda contoh. Migrasi Tahap 3 ke 4 tidak membuat nilai baru.
- I21: hanya indikator terpilih pada kasus dua final yang dibuka kepada pasangan. Izin revisi melalui kasus mengikat kasus/final/alasan. Penutupan memerlukan dua respons terkini; kesamaan angka bukan syarat.
- I22: publikasi berupa snapshot tersendiri. Default tanpa skor; opsi dua skor per komponen tanpa agregat/kelulusan. Pratinjau/token state dan request key mencegah publikasi usang/duplikasi. Koreksi berversi dan penarikan beralasan mempertahankan arsip.
- I23: penggantian pasangan menyimpan pekerjaan lama, tidak memindahkan skor, mengarsipkan kasus, menarik publikasi dan membatalkan wawancara terkait. Revisi bukti memakai invalidasi yang sama.
- I24: konfigurasi yang sudah digunakan dibekukan. Duplikasi membuat periode baru; jendela moderasi beralasan hanya membuka revisi final setelah deadline. Wawancara bukan skor, dan menjadi gate hanya jika diaktifkan. Tanpa integrasi konferensi atau ujian.
- I25: akun tambahan noninteraktif dan fiktif. CSV hanya status fiktif dalam lingkup/periode, dengan mitigasi formula. Service tetap bukan keamanan production. Tidak ada dependency baru atau instalasi ulang.
