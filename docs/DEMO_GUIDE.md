# Panduan demo - UKIN PPG UNJ

**6 November 2026 — finalisasi source dan persiapan Tahap 5 selesai; penerimaan browser/Linux masih terbuka.** Tahap 0–4 dipertahankan. Seluruh 47 tes, Nuxt typecheck, static generate Windows, verify sebelum/sesudah build dan verify:output lulus. Belum ada push atau deployment; repository tujuan belum ditentukan.


## Skenario utama sepuluh langkah

Gunakan satu tab, browser dan origin. Gunakan PDF bawaan serta data fiktif; simpan sebelum berpindah akun. Uji ini sendiri sebelum presentasi karena smoke browser otomatis belum berhasil.

1. **Pengelola:** buka periode Simulasi UKIN PPG UNJ 2026 dan pilih jam demo aktif. Periode seed sudah terbuka pada 18 November 2026, 09.00 WIB; ini bukan jadwal resmi. Bila perlu periode baru, duplikasi melalui Pengelolaan sebelum dipakai, tambahkan Alya dan pilih periode yang sama di seluruh alur.
2. **Peserta Alya:** pilih PDF contoh perangkat, video contoh integrasi dan studi kasus. Simpan draf. Jangan memakai file lokal sebagai satu-satunya bukti presentasi.
3. Tinjau dan konfirmasikan pengiriman paket final; perlihatkan receipt serta versi paket.
4. **Pengelola:** periksa tiga komponen dan tandai lengkap. Periksa pasangan dosen Raka/guru Nisa pada Penugasan; fixture dapat sudah menugaskan pasangan tersebut. Tidak perlu mengganti penugasan yang sudah benar.
5. **Dosen:** isi 12 indikator, rujukan bukti, feedback dan tinjauan tiga komponen; simpan lalu tinjau/konfirmasi final. Catatan video memakai detik manual jika API tidak tersedia.
6. **Guru:** nilai paket yang sama secara independen. Perlihatkan bahwa draf/skor dosen tidak tampak. Lengkapi dan finalisasi penilaian sendiri.
7. **Pengelola:** tinjau dua final terkini; buka moderasi indikator P1 dengan alasan dan konfirmasi.
8. **Dosen dan guru:** tanggapi sesuai alur rinci di bawah (dosen revisi beralasan, guru mempertahankan). Pengelola menutup setelah dua respons terkini; skor tidak harus disamakan.
9. **Pengelola:** isi ringkasan/feedback publik, tinjau tampilan peserta dan konfirmasi penerbitan. Skor default tidak ditampilkan; tidak ada nilai gabungan atau keputusan kelulusan resmi.
10. **Peserta:** buka Hasil publikasi dan refresh; hanya snapshot yang diterbitkan terlihat. Setelah sesi, gunakan Reset demo di footer dan konfirmasi untuk kembali ke seed. Reset membuang pekerjaan demo UKIN pada origin ini, bukan storage aplikasi lain.

Sebelum reset, periksa juga Batal mempertahankan data. Login kembali setelah reset untuk mengulang skenario. Perubahan tersimpan tidak otomatis pindah ke origin preview/publik. Detail pemeriksaan: [MANUAL_CHECKLIST.md](MANUAL_CHECKLIST.md); persiapan hosting: [DEPLOYMENT.md](DEPLOYMENT.md).

## Alur Tahap 4 yang tersedia

Ini panduan penggunaan source, bukan klaim UAT browser lulus. Gunakan satu tab/origin dan empat akun demo yang tersedia.

1. Selesaikan alur paket Alya pada Tahap 2 dan dua final independen pada Tahap 3. Citra dapat dipakai sebagai paket siap dinilai; Eva mempunyai kasus moderasi contoh hasil migrasi.
2. Pengelola membuka **Monitoring**: cek filter periode/bidang dan lima perspektif. Status berasal dari assessment. Skor komponen baru terlihat ketika dua final terkini lengkap. CSV memakai filter periode, berisi status fiktif tanpa catatan internal atau skor.
3. Buka **Publikasi hasil**, pilih Alya. Periksa prasyarat. Untuk demonstrasi moderasi, pilih indikator P1, isi alasan, centang konfirmasi lalu **Buka moderasi indikator terpilih**.
4. Sebagai dosen, buka kasus di **Moderasi**. Perbandingan hanya berisi P1; feedback internal komponen lain tetap tersembunyi. Buka penilaian pribadi, beri alasan revisi, tinjau ulang tiga komponen, simpan dan finalisasi v2. Kembali ke Moderasi, tulis penjelasan, konfirmasi, pilih **Catat final revisi**.
5. Sebagai guru, buka kasus yang sama dan **Pertahankan final awal** dengan penjelasan/konfirmasi. Dosen tidak dapat mengubah penilaian guru.
6. Pengelola menutup kasus dengan catatan setelah kedua tanggapan menunjuk final terkini. Tidak perlu menyamakan angka. Jika masih ada draf revisi atau respons usang, penutupan ditolak.
7. Pada **Publikasi hasil**, tulis kekuatan, saran dan feedback tiga komponen. Skor default tersembunyi; aktifkan opsi bila ingin dua skor komponen terpisah. Isi alasan tindakan, **Tinjau tampilan peserta**, baca pratinjau, centang konfirmasi lalu terbitkan.
8. Ganti peserta dan buka **Hasil publikasi**. Hanya isi yang diterbitkan terlihat. Refresh pada origin yang sama, kemudian kembali ke pengelola: versi publikasi tetap tersimpan. Koreksi menggunakan isi baru dan versi berikutnya; penarikan beralasan menyembunyikan hasil aktif tanpa menghapus arsip.
9. **Pengelolaan / Penugasan** menyediakan pasangan manual pada paket lengkap. Tinjau konsekuensi penggantian: pekerjaan lama tetap diarsipkan, kasus terbuka diarsipkan, publikasi ditarik, jadwal dibatalkan. Penguji pengganti tidak menerima skor lama. Akun tambahan berlabel data saja dan tidak dapat login.
10. **Pengelolaan / Periode**: duplikasi periode untuk aturan baru, pilih bidang studi, rentang waktu WIB, sumber kasus/video, kuota dan opsi wawancara. Aturan periode lama yang telah digunakan tidak dapat diganti. Tambahkan Alya ke periode baru dan pilih paket periode tersebut di Paket UKIN. Ini membuat draf kosong dan mempertahankan paket lama.
11. Untuk wawancara, aktifkan pada periode baru sebelum penilaian dimulai; pilih apakah wajib sebelum publikasi. Setelah paket lengkap dan pasangan tersedia, buka **Wawancara**, atur jadwal/tautan contoh. Catat selesai setelah DemoClock mencapai jadwal. Peserta melihat waktu/link/status, tanpa catatan internal. meet.demo.invalid tidak menyediakan konferensi.
12. Untuk revisi sesudah tutup penilaian, atur **Jendela moderasi** beralasan yang mencakup skenario jam tertutup (11 Desember 2026). Jendela ini membuka revisi final yang sudah ada, bukan penilaian awal.
13. Buat draf **Pengumuman**, pilih periode/peran, simpan dan terbitkan dengan alasan. Ganti penerima, tandai dibaca, kembali ke pengelola untuk arsip. Read marker tetap per akun; draf/arsip tidak tampil.
14. **Aktivitas** menyimpan alasan, aktor, entity dan DemoClock administrasi. Reset demo tetap hanya namespace UKIN. Form administrasi/publikasi memakai simpan eksplisit, bukan autosave.

## Alur Tahap 3 yang tersedia

1. Jalankan `npm run dev` dengan dependency yang tersedia. Gunakan satu tab/origin, masuk sebagai dosen/guru dan pilih **Penugasan saya**. Citra adalah contoh paket lengkap belum dinilai; Damar mempunyai final contoh dosen; Eva mempunyai kasus moderasi contoh dari metadata lama. Atau gunakan paket Alya setelah alur Tahap 2 di bawah.
2. Coba filter periode, bidang studi, status dan nama. Buka penugasan: identitas, paket vN, rubrik 1.0 dan penguji aktif terlihat. Final skenario lama diberi label contoh, bukan penilaian pengguna.
3. Di **Perangkat**, baca PDF/lampiran, pilih skor berdasarkan empat deskriptor setiap indikator, rujukan dan catatan. Di **Video**, muat pemutar atau buka YouTube. Catat waktu manual 01:30 atau ambil waktu pemutar, opsional pilih indikator, lalu tambahkan catatan. Tekan timestamp untuk seek bila pemutar siap; fallback link YouTube tetap ada.
4. Berpindah ke **Studi kasus** tidak membuang editor. Tulis feedback setiap komponen dan centang pernyataan telah ditinjau. Pilih **Simpan draf**, ganti akun lalu kembali, atau refresh pada origin sama: draf tersimpan tetap ada. Perubahan belum disimpan diperingatkan sebelum keluar. Ini bukan autosave.
5. Coba finalisasi dengan indikator kosong, feedback kosong, atau kendala teknis beralasan: ditolak tanpa skor nol. Jika kendala telah diselesaikan, penguji mengisi alasan penyelesaian lalu memeriksa ulang bukti.
6. **Tinjau & finalisasi** menyimpan draf dan menampilkan ringkasan, feedback, paket/rubrik/revisi. Centang konfirmasi dan finalisasi; klik ulang tidak menciptakan final kedua. **Riwayat penilaian** menampilkan versi, tanggal DemoClock, aktor dan isi penilaian pribadi.
7. Ganti penguji pasangan: draf/skor/catatan sebelumnya tidak terlihat. Buat penilaian sendiri untuk paket yang sama. Ganti peserta: tidak ada nilai/feedback internal yang dipublikasikan.
8. Pengelola membuka **Progres penilaian**: hanya status, metadata dan alasan teknis. Untuk final yang memenuhi syarat, buka **Izinkan revisi**, tulis alasan dan konfirmasi. Penguji pemilik membuka draf revisi dengan alasan sendiri, meninjau ulang tiga komponen dan finalisasi v2. Final v1 tetap utuh dalam riwayat. Moderasi manual dan publikasi tersedia pada alur Tahap 4 di atas.
9. Jika paket direvisi melalui alur Tahap 2, assignment/assessment lama diarsipkan. Setelah paket versi baru lengkap, kedua penguji memperoleh penugasan baru yang belum dinilai. Riwayat final lama tetap menunjuk paket lama.

Jalankan checklist browser sebelum presentasi; langkah di atas menjelaskan source, bukan bukti UAT lulus.

## Alur Tahap 2 yang tersedia

1. Jalankan npm run dev menggunakan dependency yang sudah terpasang, lalu buka URL lokal yang dilaporkan terminal. Gunakan satu tab/origin.
2. Login peserta, buka **Paket UKIN**. Pilih **Gunakan PDF contoh**, opsional **Tambah LKPD contoh**, lalu **Isi video contoh integrasi**. Studi kasus teks contoh boleh disesuaikan dengan data fiktif, atau pilih dokumen laporan contoh.
3. Pilih **Simpan draf**, tinjau checklist, kemudian **Tinjau pengiriman**. Periksa ringkasan dan centang konfirmasi penguncian. **Kirim paket final** membuka receipt versi 1.
4. Ganti akun menjadi pengelola pada header; buka **Kelengkapan paket** dan paket Alya. Centang perangkat/kasus yang dapat ditinjau, beri alasan perbaikan teknis pada video, pilih **Minta perbaikan teknis** dan konfirmasi.
5. Ganti peserta, buka draf perbaikan, baca alasannya dan perbaiki. Kirim ulang menjadi versi 2. Versi 1 beserta receipt tetap tersedia sebagai arsip.
6. Ganti pengelola, periksa versi 2 dan centang tiga komponen setelah memeriksa akses. **Tandai lengkap** tidak berarti lulus atau memperoleh nilai. Fixture pasangan penguji mendapat akses versi baru.
7. Ganti penguji dosen/guru untuk membaca bukti sesuai penugasan dan melanjutkan alur Tahap 3 di atas. Untuk retaker, pengelola membuka Farhan lalu **Riwayat percobaan** guna membaca arsip percobaan sebelumnya.
8. Refresh: PDF bawaan tetap tersedia; file perangkat perlu dipilih ulang oleh pemilik dengan SHA-256 yang sama. Jangan mengubah file final melalui nama/ukuran yang sama. Video contoh hanya integrasi YouTube; periksa pemutarannya langsung pada jaringan demo.

Alur ini merupakan checklist manual, bukan klaim browser telah lulus. Semua waktu aktivitas berasal dari jam demo. [Checklist lengkap](MANUAL_CHECKLIST.md) mencakup mobile, akses, file lokal, storage dan navigasi tanpa simpan.

## Akun fiktif

| Peran | Email contoh | Password dummy |
|---|---|---|
| Peserta | peserta@demo.invalid | DemoUKIN123! |
| Penguji dosen | dosen@demo.invalid | DemoUKIN123! |
| Penguji guru | guru@demo.invalid | DemoUKIN123! |
| Pengelola | pengelola@demo.invalid | DemoUKIN123! |

Nama bebas dibuat fiktif; jangan memakai nama/foto peserta pada screenshot nasional. Akun ini hanya fixture UX, bukan credential untuk situs UNJ, YouTube, atau Cloudflare.

Gunakan satu browser, satu tab, dan satu origin. Pilih "Ganti akun" untuk memperlihatkan hubungan antarperan. Website publik tetap menyimpan perubahan lokal, tidak tersinkron ke perangkat lain.

## Alur checkpoint Tahap 1 (historis)

Pada checkpoint awal dependency belum terpasang. Hambatan instalasi lokal tersebut sudah dilaporkan teratasi pengguna; build lokal sekarang lulus. Langkah fondasi berikut tetap tersedia, tetapi batas fitur paket diperbarui oleh bagian Tahap 2 di atas.

1. Buka landing /, lanjut /login, pilih tombol akun contoh, kemudian Masuk ke UKIN.
2. Peserta membuka /app/peserta; penguji dosen/guru /app/penguji; pengelola /app/pengelola.
3. Baca ringkasan dan tiga komponen. Status perangkat/final/moderasi hanya metadata fixture, bukan bukti unggah atau penilaian baru.
4. Tandai pengumuman dibaca, ganti akun melalui select header, lalu kembali; tanda baca mengikuti akun dan tidak dihapus.
5. Penguji/pengelola dapat menyaring dan mencari baris pratinjau. Tombol ringkasan memfilter daftar.
6. Pengelola mengubah jam aktif/tertutup; label periode pada akun lain mengikuti snapshot yang sama.
7. Panduan demo berada di /app/panduan. Reset demo pada footer meminta konfirmasi; Batal mempertahankan data, Ya mereset UKIN dan keluar.

Akun peserta: Alya Prameswari; dosen: Dr. Raka Adinata; guru: Nisa Kartika, S.Pd.; pengelola: Dina Saraswati. Seluruhnya fiktif. Fixture enam peserta dengan satu arsip retaker. Tidak ada file/video peserta sungguhan.

## Seed aktual dan target lanjutan

Enam peserta fiktif: satu akun interaktif paket draf, satu belum lengkap, satu siap dinilai, satu satu-penguji-final, satu moderasi, dan satu retaker dengan riwayat. Semua jumlah dashboard harus dihitung dari fixture aktual. Pilih paket kasus berbeda agar state tidak bertentangan.

Reset saat ini kembali ke satu seed bawaan. Pemilih preset reset lain belum tersedia. Finalisasi contoh diberi label data simulasi, bukan hasil tindakan pengguna baru.

Periode utama "Simulasi UKIN PPG UNJ 2026". Jam demo tetap 18 November 2026, 09.00 WIB; tampilkan label agar tidak disangka waktu aktual. Periode contoh tidak diklaim sebagai jadwal nasional.

## Target siklus lengkap lintas tahap

Tabel berikut merangkum siklus yang sudah tersedia pada source Tahap 0-4. Gunakan alur aktual di atas untuk review browser; belum ada klaim UAT lulus.

| Langkah | Aksi | Hasil target |
|---|---|---|
| 1 | Landing → login peserta memakai tombol isi akun | Dashboard menunjukkan checklist tiga komponen. |
| 2 | Pilih PDF contoh perangkat, tambah tautan video yang sudah diuji, isi studi kasus | Kelengkapan dihitung nyata; video contoh dilabeli bukan rekaman peserta jika hanya uji integrasi. |
| 3 | Simpan draf, refresh, periksa lagi | Teks/tautan tetap; dokumen bawaan tetap bisa dibuka. |
| 4 | Pratinjau lalu kirim final | Receipt unik dan paket versi pertama terkunci. |
| 5 | Ganti pengelola, periksa bukti dan tandai lengkap, tetapkan dosen + guru | Paket masuk antrean penugasan kedua akun. |
| 6 | Ganti dosen, buka bukti dan rubrik tiga komponen | Catatan terhubung dengan bukti/indikator. |
| 7 | Buat catatan timestamp video, isi skor + feedback, simpan draf | Draf hanya untuk dosen; guru/peserta belum melihat nilai. |
| 8 | Finalisasi dosen; ganti guru dan nilai secara independen | Dua final berbeda dengan versi bukti/rubrik yang sama. |
| 9 | Ganti pengelola, tinjau rekap; buka moderasi contoh bila perlu | Perbandingan terkontrol, alasan tercatat, bukan rata-rata otomatis. |
| 10 | Kedua penguji menanggapi moderasi; pengelola menutup dan menerbitkan feedback | Gate publikasi terpenuhi; tidak ada label lulus palsu. |
| 11 | Ganti peserta, buka hasil dan refresh | Hanya snapshot terbit serta feedback yang diizinkan tampil. |
| 12 | Reset UKIN, konfirmasi, masuk lagi | Kembali ke seed; data LMS dan storage aplikasi lain tidak disentuh. |

## Contoh studi kasus fiktif

Konteks: beberapa peserta didik menyamakan pembilang dengan ukuran pecahan tanpa mempertimbangkan penyebut.

Tindakan: pengajar memakai potongan bentuk dan pertanyaan pembanding, kemudian meminta peserta didik menjelaskan alasannya.

Bukti hasil: jawaban contoh sebelum/sesudah dan penjelasan singkat menunjukkan sebagian peserta mulai mempertimbangkan ukuran bagian. Data dan pernyataan ini dibuat untuk mock, bukan hasil penelitian.

Refleksi: perlu meninjau peserta yang masih mengandalkan hitungan bagian dan memberikan variasi representasi. Jangan menuliskan identitas atau foto anak nyata.

## Demonstrasi opsional

- Paket belum lengkap: permintaan perbaikan teknis, versi baru, dan receipt baru.
- File perangkat: pilih PDF lokal, refresh, tampilkan kebutuhan pilih ulang; jangan memasukkannya sebagai satu-satunya bukti skenario utama.
- Periode tertutup: tombol finalisasi menjelaskan alasan; balik ke jam demo aktif melalui pengelola.
- Tahap 4: wawancara aktif dengan jadwal/status selesai, tanpa skor keempat.
- Retaker: hasil lama tetap arsip, attempt baru terpisah.

## Pemeriksaan sebelum presentasi

Jalankan alur inti pada URL yang akan dipakai, bukan hanya localhost. Coba laptop/ponsel dasar, beberapa deep link lalu refresh, role switch, simpan draf, konfirmasi, dan reset. Pastikan video dapat dimainkan di jaringan presentasi; bila gagal, gunakan skenario hasil simulasi tanpa berpura-pura telah menonton video.

Panduan ini tidak memerlukan live email, OTP, pembayaran, atau data resmi kampus.

