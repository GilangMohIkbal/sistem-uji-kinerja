# Checklist finalisasi Tahap 0-5

**6 November 2026 — seluruh kotak browser tetap belum dinyatakan lulus.** Pada Tahap 5 Chrome dapat dibaca, tetapi satu percobaan preview terisolasi 127.0.0.1:3212/login menghasilkan ERR_CONNECTION_TIMED_OUT. Tidak diulang. Landing pada tab development yang sudah ada sempat terbaca; itu bukan smoke build akhir atau alur empat akun. Tes logika 47/47, typecheck, generate dan verifikasi source/output lulus. Docker/WSL menolak akses; Linux ci belum dijalankan.

## Prioritas sebelum presentasi dan publikasi

- [ ] Jalankan sepuluh langkah DEMO_GUIDE dari periode aktif sampai feedback peserta pada origin yang akan dipresentasikan.
- [ ] Desktop 1440px dan mobile 390px/320px: navigasi, dialog, rubrik dan tabel terbaca; fokus keyboard dan zoom 200% dapat dipakai.
- [ ] Putar YouTube, seek timestamp, fallback manual/link dan buka ketiga PDF bawaan. Verifikasi file lokal setelah refresh tidak dianggap upload permanen.
- [ ] Simpan draf, ganti empat akun, refresh deep link, pastikan privasi pasangan/peserta; Reset-Batal lalu Reset-Ya dan ulangi seed.
- [ ] Jalankan workflow Linux pada repository UKIN yang telah ditentukan; catat hasil npm ci, build dan verifikasi. Metadata lockfile lulus bukan pengganti langkah ini.
- [ ] Setelah otorisasi deployment, cek route/aset/404 pada URL Cloudflare sebenarnya dan catat URL/commit/runtime. Jangan memakai repository/proyek LMS.

Pengujian service/domain mencakup siklus lintas akun, persistensi snapshot, reset dan versi, tetapi tidak memverifikasi klik/layout browser. Kotak berikut sengaja tetap kosong sampai hasil manual dicatat.


## Tahap 4 - belum diuji melalui browser

- [ ] Pengelolaan tab periode/akun/penugasan/pengumuman/aktivitas terbaca pada desktop dan ponsel; label input, urutan fokus dan pesan error jelas.
- [ ] Duplikasi periode, tanggal WIB, bidang studi, sumber kasus/video, kuota opsional; aturan lama yang dipakai tidak dapat diganti. Arsip menutup editor peserta/penguji.
- [ ] Tambahkan peserta ke periode baru dan berpindah paket melalui pemilih periode; paket lama tetap tersedia.
- [ ] Penugasan hanya paket lengkap; dosen/guru harus berbeda dan aktif. Penggantian beralasan tidak memindahkan nilai; arsip/kasus/publikasi/wawancara mengikuti konsekuensi yang ditampilkan.
- [ ] Akun tambahan hanya data fiktif; tidak muncul sebagai login kelima. Nonaktif penguji memblokir pekerjaannya.
- [ ] Monitoring filter periode/bidang dan lima perspektif; metrik sesuai state. CSV periode terbuka di spreadsheet dan data formula tidak dieksekusi.
- [ ] Moderasi hanya dua final sesuai versi. Pasangan hanya melihat indikator terpilih, tanpa draf/feedback komponen/catatan video lain.
- [ ] Dosen merevisi sendiri, guru mempertahankan; final lama tetap ada. Draf atau respons usang menahan penutupan. Kasus dapat selesai meskipun skor berbeda.
- [ ] Sesudah periode tutup, hanya jendela moderasi beralasan yang membuka revisi final; penilaian awal tetap tertutup.
- [ ] Publikasi: pratinjau, alasan dan konfirmasi wajib. Perubahan state memaksa tinjau ulang. Klik ulang tidak membuat versi ganda.
- [ ] Koreksi publikasi membuat versi baru; penarikan menampilkan status netral pada peserta dan mempertahankan arsip pengelola.
- [ ] Peserta hanya melihat hasil sendiri yang sengaja diterbitkan. Skor default tidak tampil; opsi dua skor komponen terpisah tanpa nilai gabungan/kelulusan.
- [ ] Wawancara tampil hanya di periode terkait. Jadwal ulang/status selesai berfungsi, catatan internal tidak terlihat peserta; gate opsional dan wajib berbeda.
- [ ] Pengumuman draft/arsip tersembunyi, periode/peran target tepat, penanda baca mengikuti akun dan bertahan setelah refresh.
- [ ] Refresh/switch/reset satu origin mempertahankan pekerjaan tersimpan. File lokal memerlukan pemulihan; YouTube/seek/fallback diperiksa di jaringan presentasi.

## Penilaian Tahap 3 - masih perlu pemeriksaan browser

- [ ] Dosen/guru: filter periode, bidang, status dan nama; angka/status sama dengan dashboard. Paket belum lengkap/tertutup/diarsipkan tidak dapat dinilai.
- [ ] Ruang kerja menampilkan identitas, versi paket/rubrik, penguji aktif dan privasi pasangan. Periksa PDF/studi kasus, 12 indikator beserta deskriptornya, rujukan bukti, radio skor dan feedback.
- [ ] Skor kosong berbeda dari 1; skor/feedback kosong atau tinjauan belum dikonfirmasi menahan final. Tidak ada nilai gabungan atau kelulusan.
- [ ] Isian tetap saat pindah komponen atau membuka dokumen di tab baru. Simpan draf, ganti akun, kembali, refresh: seluruh skor/catatan/feedback tersimpan. Perubahan belum disimpan memunculkan guard keluar.
- [ ] Catatan video pada full/summary tidak tercampur. Coba timestamp detik, mm:ss, hh:mm:ss, negatif dan melebihi durasi diketahui. Ambil waktu player, klik seek, atau fallback link YouTube. Uji jaringan offline/private/embed ditolak.
- [ ] Tandai kendala beralasan: status tertahan di penguji/pengelola, skor tidak menjadi nol. Penyelesaian memerlukan alasan pemilik. Kendala belum selesai menahan final.
- [ ] Dialog final menampilkan versi dan ringkasan yang tepat. Konfirmasi wajib, klik ganda/reload tidak menduplikasi final. Final tidak dapat diedit langsung.
- [ ] Pasangan hanya melihat assessment sendiri. Peserta tidak melihat skor/feedback internal. Halaman Progres hanya menampilkan metadata/alasan teknis; Monitoring menampilkan jumlah komponen setelah dua final current. Draf tetap pribadi.
- [ ] Izin revisi pengelola beralasan; pemilik membuka revisi beralasan dan mengonfirmasi ulang tiga tinjauan. Final v1 tetap terbaca setelah final v2. Akun/versi lain tidak bisa memakai izin.
- [ ] Revisi paket mengarsipkan assessment lama; editor lama tidak dapat finalisasi. Assignment baru mulai kosong dan riwayat final sendiri tetap dapat membaca bukti arsip.
- [ ] Desktop/mobile: panel bukti/rubrik terbaca, scroll tidak menjebak, savebar tidak menutup kontrol; keyboard/fokus/dialog, label/error, reduced-motion dan kontras diuji.
- [ ] Dari state schema 2 atau 3 yang disalin aman pada origin uji, schema 4 mempertahankan receipt/revisi/retaker/jam/sesi. Final metadata lama jelas berlabel contoh. Jangan reset data presentasi hanya untuk tes.

## Alur paket Tahap 2 yang dipertahankan

Gunakan satu tab dan origin aplikasi. Untuk alur berikut, gunakan file contoh dan data fiktif.

- [ ] Login peserta Alya, buka Paket UKIN. Identitas, tiga komponen, status paket/kelengkapan, tenggat dan jam demo terbaca.
- [ ] Pilih PDF perangkat, LKPD opsional, video contoh integrasi, dan studi kasus teks empat bagian atau PDF contoh. Buka ketiga PDF di tab lain; semuanya dapat dibaca.
- [ ] Simpan draf parsial. Refresh dan ganti akun: draf tetap tersimpan, dashboard dihitung dari state. Pengelola tidak melihat isi draf.
- [ ] Ubah teks tanpa menyimpan; klik navigasi/ganti akun/logout/refresh. Peringatan muncul; Batal mempertahankan isian. Simpan kemudian keluar tidak memunculkan peringatan palsu.
- [ ] Tinjau pengiriman: checklist dan kendala kosong/invalid terlihat, ringkasan bukti sesuai, penjelasan penguncian jelas. Konfirmasi final menghasilkan receipt v1. Klik ganda tidak membuat versi ganda; peserta tidak dapat mengedit final.
- [ ] Ganti pengelola, buka Pemeriksaan, cari Alya dan filter periode/status. Buka bukti. Coba permintaan perbaikan kosong: ditolak. Centang perangkat/kasus dan beri alasan teknis video, lalu konfirmasi perbaikan.
- [ ] Ganti peserta: catatan terlihat dan draf revisi terbuka. Perbaiki, kirim ulang; receipt v2 berbeda dan v1 tetap dapat dibuka tanpa perubahan isi.
- [ ] Ganti pengelola: v2 kembali pending. Periksa bukti, centang tiga komponen dan tandai lengkap. Status ini tidak menyebut kompeten/lulus/nilai.
- [ ] Ganti penguji dosen lalu guru: hanya paket final yang ditugaskan dapat dibaca; input nilai setelah kelengkapan lengkap, tanpa draf/skor pasangan.
- [ ] Pengelola membuka Farhan (retaker), lalu Riwayat percobaan. Bukti percobaan 1 tetap arsip terpisah dari percobaan 2 dan tidak menyediakan pemeriksaan baru.

## File dan video

- [ ] Pilih PDF/PNG/JPEG perangkat; nama/jenis/ukuran/status tampil. Tipe salah, file kosong atau >10 MiB ditolak; main/laporan kasus hanya PDF.
- [ ] Kirim paket dengan file lokal lalu refresh. Tautan blob tidak lagi ditampilkan sebagai tersedia; pilih ulang isi identik oleh pemilik memulihkan bukti tanpa mengubah versi.
- [ ] Coba file berbeda dengan nama/ukuran sama: pemulihan final ditolak. Pengelola/penguji tidak mendapat kontrol untuk mengganti file final.
- [ ] URL YouTube normal, youtu.be dan embed dinormalisasi. Host palsu, iframe mentah dan ID invalid ditolak.
- [ ] Muat pemutar pada jaringan presentasi lalu putar contoh integrasi. Bedakan URL valid, player siap, pemutaran teramati dan pemeriksaan manual. Periksa fallback buka YouTube saat offline/private/embed ditolak.

## Akses, waktu, tampilan dan storage

- [ ] Tanpa sesi, route privat menuju login; peserta tidak masuk Pemeriksaan, penguji tidak mengedit Paket. Unknown ID/URL menampilkan jalan kembali.
- [ ] Pengelola mengganti jam tertutup; peserta tidak dapat simpan/kirim. Kembali aktif memulihkan hak yang sesuai.
- [ ] Antrean kosong/filter tanpa hasil dapat dipulihkan; hitungan tidak lepas dari daftar.
- [ ] Desktop 1440x900, mobile 390x844 dan 320px: editor, receipt, pemeriksaan, tabel mendatar dan dialog terbaca tanpa overflow halaman.
- [ ] Keyboard/Tab/Shift+Tab, Escape, focus dialog, skip link, reduced motion dan zoom 200% dapat digunakan.
- [ ] Reset–Batal mempertahankan data; Reset–Ya hanya mereset UKIN. Gunakan sentinel dummy aplikasi lain bila memeriksa isolasi storage, jangan data LMS nyata.
- [ ] Storage diblokir/penuh/rusak memberi notice; tidak mengklaim file telah tersimpan permanen. Refresh deep link memuat JS/CSS/favicon.

## Batas yang tetap terbuka

Clean install/build Linux, smoke browser empat akun, responsivitas, PDF dalam browser dan playback/seek YouTube belum terverifikasi. Konfigurasi periode, moderasi, publikasi dan wawancara sudah tersedia pada source Tahap 4; tidak perlu membangun ulang fitur tersebut untuk menutup checklist. Gunakan data fiktif dan satu origin. Pemeriksaan HTTP/browser yang gagal tidak dianggap respons 200 atau UAT lulus. Tidak diperlukan backend, E2E suite besar atau audit production.
