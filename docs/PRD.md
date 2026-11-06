# PRD — UKIN PPG UNJ

**v1.0 · 6 November 2026 · Status: spesifikasi mock untuk implementasi bertahap.**

Dokumen ini membedakan keputusan pengguna dengan usulan aturan demo. Bukti dari screenshot nasional bukan spesifikasi kebijakan lengkap. Rujukan dan keterbatasannya ada di [DECISIONS_AND_SOURCES.md](DECISIONS_AND_SOURCES.md).

## 1. Tujuan

Membuat prototipe frontend interaktif untuk menunjukkan proses pengumpulan dan penilaian bukti kinerja peserta PPG UNJ. Prototipe harus nyaman dipresentasikan dari empat akun demo pada browser dan origin yang sama, dapat dibangun secara statis, serta menggunakan data fiktif.

**Hasil utama:** peserta memahami kelengkapan dan status paketnya; dosen/guru dapat meninjau bukti dan menilai secara independen; pengelola dapat menemukan hambatan, mengatur penugasan, dan mempublikasikan umpan balik yang tepat.

Keberhasilan bukan jumlah halaman atau banyaknya efek visual. Satu alur peserta → pengelola → dosen → guru → pengelola → peserta harus dapat diperlihatkan tanpa data terputus.

## 2. Lingkungan empat produk

| Produk | Batas fungsi |
|---|---|
| Website utama PPG UNJ | Profil/informasi publik, belum dibuat; tidak menjadi pekerjaan repository ini. |
| Website ujian | Ujian dan aktivitas terkait; referensi visual, tidak ada integrasi akun/data nyata. |
| LMS | Pembelajaran; sudah dibangun dan menjadi referensi visual, bukan tempat kode UKIN ditulis. |
| UKIN | Bukti kinerja, penilaian, moderasi, monitoring, serta publikasi hasil simulasi. |

Semua memakai identitas keluarga PPG UNJ. Acuan saat ini hanya LMS disetujui dan web ujian yang ditunjuk pengguna. Jangan menggunakan website PPG lama sebagai acuan desain. Tautan produk lain boleh ditampilkan dengan label tujuan; website utama yang belum tersedia tidak diberi URL atau tombol aktif palsu.

## 3. Pengguna dan hak pekerjaan

| Peran aplikasi | Akun demo | Pekerjaan inti |
|---|---|---|
| Peserta | 1 akun interaktif + peserta fiktif untuk daftar | Menyusun paket, mengirim, memperbaiki bila dibuka kembali, melihat jadwal dan feedback yang dipublikasikan. |
| Penguji, jenis dosen | 1 akun interaktif | Menilai paket yang ditugaskan dan instrumen periode, membuat catatan, finalisasi, berpartisipasi dalam moderasi. |
| Penguji, jenis guru | 1 akun interaktif | Alur yang sama, hasil independen. Bukan salinan state akun dosen. |
| Pengelola | 1 akun interaktif | Periode, kelengkapan, penugasan, monitoring, moderasi, pengumuman, publikasi hasil. |

Untuk demo, satu paket mendapat dua penguji berbeda: dosen dan guru. Ini **aturan skenario**, bukan klaim jumlah penguji resmi bagi semua kegiatan. Pengelola tidak mengubah skor penguji secara langsung. Pemantau read-only bukan akun wajib versi pertama.

## 4. Alur publik

Landing page `/` memperkenalkan UKIN dan tiga komponen penilaian. Sertakan penjelasan alur, panduan ringkas, akses menuju login, serta keterkaitan produk PPG UNJ yang nyata. Tidak perlu berita, pricing, testimoni buatan, statistik adopsi palsu, atau klaim sertifikasi.

Login `/login` terpisah dari landing. Form berlabel jelas, password dummy, pengisian empat akun contoh, error validasi, dan pemberitahuan mode demo. Setelah masuk, arahkan ke dashboard sesuai akun. Tidak perlu pendaftaran, pemulihan password sungguhan, atau SSO.

## 5. Paket UKIN peserta

### 5.1 Satu paket per percobaan/periode

Paket melekat pada peserta, periode, bidang studi, dan nomor percobaan. Retaker memiliki percobaan berbeda; bukti/hasil lama tidak ditimpa. Siapkan satu retaker fiktif untuk demonstrasi riwayat, bukan sistem registrasi ulang penuh.

Dashboard menampilkan kelengkapan tiga komponen, batas waktu demo, langkah berikutnya, perbaikan yang diminta, dan status proses. Tidak ada persentase kesiapan yang dihitung dari angka hardcoded.

### 5.2 Perangkat pembelajaran

Dokumen utama PDF dan lampiran pendukung opsional. Kategori contoh: bahan ajar, LKPD, asesmen, media. Ini pengelompokan demo, bukan kewajiban setiap kategori menjadi file terpisah. Untuk alur utama, gunakan file contoh lokal bawaan yang selalu dapat dibuka.

Fitur: pilih dokumen contoh atau file perangkat, lihat nama/jenis/ukuran, pratinjau atau buka terpisah, ganti/hapus selama draf, serta status ketersediaan. Default batas file **10 MiB** merupakan keputusan teknis demo. PDF, PNG, dan JPEG cukup; tolak HTML/script sebagai upload. Jangan menjanjikan OCR atau verifikasi isi otomatis.

### 5.3 Video praktik pembelajaran

Satu komponen dapat memiliki dua tautan: video utuh dan video ringkasan. Kewajiban masing-masing diatur di periode; skenario utama mewajibkan video utuh, ringkasan opsional. Durasi tidak diklaim sebagai aturan nasional; batas durasi resmi belum ditetapkan.

Dukung URL YouTube yang dinormalisasi menjadi ID video, pratinjau pemutar, error video private/tidak tersedia/embed ditolak, serta buka di YouTube. Jangan menyamakan URL valid dengan video telah ditinjau. Pemutaran membutuhkan internet; tidak ada API key rahasia atau upload video ke server UKIN.

### 5.4 Studi kasus

Komponen ketiga, bukan tugas LMS atau ujian baru yang otomatis diduplikasi. Dua mode periode:
- `participant_report`: peserta mengisi laporan terstruktur atau memilih dokumen laporan.
- `exam_snapshot`: laporan tampil read-only sebagai **simulasi data dari web ujian**, dengan provenance; tidak ada fetch/integrasi nyata.

Default demo pertama `participant_report`. Isi teks dapat diorganisasi sebagai konteks/masalah, tindakan, bukti hasil, serta refleksi/tindak lanjut. Batas input teknis bukan ketentuan jumlah kata resmi.

### 5.5 Draf dan kirim final

Draf dapat belum lengkap dan tersimpan lokal. Sebelum finalisasi, tampilkan checklist, pratinjau, konsekuensi penguncian, serta pernyataan penggunaan bukti simulasi. Paket final menghasilkan receipt unik, waktu, dan versi.

Pengiriman final mengunci isi snapshot; klik dua kali tidak membuat dua pengiriman. Peserta tidak dapat mengganti isi diam-diam. Perubahan setelah kirim melalui pembukaan revisi oleh pengelola dengan alasan; aturan rinci ada pada dokumen workflow.

## 6. Pemeriksaan kelengkapan

Pengelola melihat antrean paket terkirim, memeriksa akses bukti, memberi status lengkap atau perlu perbaikan teknis dengan alasan per komponen, dan menetapkan pasangan penguji. **Lengkap tidak berarti memenuhi kompetensi.**

Kendala video/file tidak otomatis menjadi skor nol. Penguji dapat menandai masalah untuk pengelola; finalisasi komponen yang belum bisa ditinjau ditahan dengan pesan alasan. Data contoh yang diklaim sudah ditinjau harus diberi penanda fixture simulasi.

## 7. Ruang kerja penguji

Daftar penugasan dapat difilter tahun/periode, bidang studi, status, dan peserta. Tampilkan pasangan penguji sebagai identitas penugasan tanpa membocorkan skor. Kartu/ringkasan harus membuka daftar relevan.

Ruang penilaian menghubungkan paket versi tertentu dengan rubrik versi tertentu. Codex bebas menyusun layout bukti/rubrik/catatan, tetapi perpindahan komponen tidak menghapus draf atau konteks video.

Tiga rubrik terpisah: perangkat, video, studi kasus. Setiap indikator memuat deskripsi, tingkat pencapaian, pilihan skor, rujukan bukti, dan catatan. Isi rubrik contoh ada di [RUBRIC_DEMO.md](RUBRIC_DEMO.md). Tidak ada klaim instrumen resmi/standar tersertifikasi.

Catatan video menyimpan ID bukti, waktu dalam detik, teks, indikator terkait opsional, dan versi paket. Klik catatan mengarahkan pemutar ke waktu terkait bila API tersedia. Sediakan input timestamp manual ketika API gagal; jangan mengklaim otomatis menangkap waktu jika belum tersambung.

Penguji menyimpan draf dan memfinalisasi setelah seluruh indikator wajib terisi, bukti dapat ditinjau, dan feedback komponen tersedia. Kosong berbeda dengan nol. Finalisasi dan revisi beralasan tercatat; state final tidak diganti diam-diam.

## 8. Moderasi dan publikasi

Moderasi versi pertama dipicu manual oleh pengelola setelah kedua penguji final, disertai alasan dan indikator yang perlu ditinjau. Tidak ada selisih skor/bobot/ambang resmi yang diciptakan otomatis.

Pasangan penguji dapat melihat perbandingan yang diperlukan dalam kasus moderasi itu. Masing-masing mempertahankan atau merevisi hasil miliknya dengan alasan. Pengelola memverifikasi tanggapan lengkap dan menutup kasus, bukan mengedit skor.

Status penilaian selesai dan hasil dipublikasikan adalah dua keadaan berbeda. Peserta hanya melihat ringkasan/feedback yang diterbitkan pengelola. Default tidak menampilkan lulus/tidak lulus, IPK, nilai gabungan, atau draf internal. Riwayat nilai sebelum publikasi tetap internal.

## 9. Pengelola dan modul pendukung

### Periode dan penugasan

CRUD ringan periode demo, waktu pengumpulan/penilaian dalam WIB, rubrik yang digunakan, sumber studi kasus, persyaratan video, opsi wawancara, dan kuota opsional. Konfigurasi yang memengaruhi penilaian dibekukan setelah penilaian dimulai; duplikasi periode untuk aturan baru.

Kelola pengguna sederhana untuk akun fiktif, jenis peran, dan aktif/nonaktif; tanpa email undangan/password reset nyata. Penugasan terpisah dari pengelolaan akun. Cegah satu akun menjadi kedua penilai, menilai diri sendiri, atau akses di luar tugasnya.

### Monitoring

Sudut pandang dokumen, peserta, penguji, nilai, dan wawancara. Boleh berupa tab/filter tanpa lima menu terpisah. Hitung dari state yang sama. Sediakan eksport CSV aman untuk rekap fiktif; netralkan nilai yang dapat dibaca sebagai formula spreadsheet. CSV bukan laporan akademik resmi.

### Wawancara kondisional

Aktif per periode, bukan komponen skor keempat. Jadwal, tautan simulasi, peserta/penguji, status terjadwal/selesai/dijadwalkan ulang, dan catatan. Tidak perlu konferensi video atau perekaman. Secara default bukan gate publikasi hasil; jika periode mengaktifkan `interviewRequiredForRelease`, UI harus menjelaskan syarat tambahan itu.

### Pengumuman dan riwayat

Pengumuman dibuat pengelola, draf/terbit/arsip, ditargetkan per periode/peran. Baca per akun, bukan penanda global. Riwayat penilaian berisi finalisasi dan revisi milik penguji. Aktivitas administratif menampilkan aktor, waktu demo, objek, dan alasan.

## 10. Cakupan tidak dibuat

Backend, database, autentikasi sungguhan, SSO, sinkronisasi lintas browser, pembayaran, peminjaman yang belum terdefinisi, AI penilai, biometrik, proctoring, banding lengkap, sertifikat resmi, pengiriman WhatsApp/email, dan integrasi sistem nasional. Rubrik builder kompleks dan penugasan otomatis ditunda.

## 11. Kriteria penerimaan versi presentasi

| ID | Kriteria |
|---|---|
| AC01 | Landing, login, dan dashboard tersedia untuk empat akun; role switch mempertahankan data UKIN. |
| AC02 | Identitas keluarga LMS/ujian konsisten tanpa menyalin struktur halaman atau tema ungu nasional. |
| AC03 | Paket mencakup tiga komponen; draf dan pengiriman final menghasilkan keadaan serta receipt yang benar. |
| AC04 | Dokumen bawaan dapat dibuka; upload perangkat jujur tentang batas memori/persistence setelah refresh. |
| AC05 | URL video dinormalisasi; kesalahan embed terlihat; timestamp mengacu ke video yang tepat. |
| AC06 | Pengelola dapat memeriksa kelengkapan, meminta perbaikan, dan menugaskan pasangan berbeda. |
| AC07 | Penilai hanya mengakses tugasnya; draf dan skor pasangan tidak bocor melalui UI sebelum moderasi. |
| AC08 | Rubrik demo memiliki deskriptor; skor di luar skala/kosong tidak dapat difinalisasi. |
| AC09 | Penilaian final menyimpan versi paket/instrumen; revisi beralasan tidak menghapus hasil sebelumnya. |
| AC10 | Moderasi manual memiliki alasan, tanggapan pasangan, dan penutupan; tidak mengarang ambang otomatis. |
| AC11 | Peserta melihat feedback hanya setelah publikasi pengelola; tidak ada keputusan kelulusan palsu. |
| AC12 | Monitoring dan jumlah antrean diturunkan dari state; pemfilteran kosong memiliki jalan kembali. |
| AC13 | Wawancara muncul hanya saat aktif; catatan/status tidak mengubah skor tiga komponen. |
| AC14 | Reset hanya data UKIN; skenario awal pulih; draft data per akun tidak tertukar. |
| AC15 | Typecheck/generate/clean install yang benar-benar dilakukan dilaporkan; build output dapat di-host. |
| AC16 | Skenario utama berjalan di browser; tampilan laptop/ponsel dasar tidak rusak. Status belum diuji tetap terbuka. |

Pemeriksaan formal production, coverage tinggi, dan E2E besar tidak menjadi target. Tetap periksa sanitasi input, link aman, data fiktif, aksesibilitas dasar, serta tidak adanya credential nyata.
