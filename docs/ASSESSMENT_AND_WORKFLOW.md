# Aturan penilaian, akses, dan alur state

**v1.0 · Kontrak perilaku mock · Semua kebijakan di bawah adalah default usulan demo kecuali dinyatakan keputusan pengguna.** Tidak ada klaim bahwa rumus/status ini merekonstruksi aturan nasional secara lengkap.

## 1. Pisahkan empat dimensi

Jangan menyimpan satu field `status` untuk seluruh proses:

1. **Paket bukti:** `draft`, `submitted`, `revision_requested`, `resubmitted`.
2. **Kelengkapan:** `pending`, `complete`, `needs_correction` — pemeriksaan administratif/teknis.
3. **Penilaian per penguji:** `not_started`, `draft`, `final`; revisi disimpan sebagai draft terpisah dari final aktif.
4. **Publikasi hasil:** `unpublished`, `published`, `withdrawn`.

Moderasi memiliki lifecycle sendiri: `open`, `awaiting_responses`, `resolved`. Ringkasan proses peserta diturunkan dari keempat dimensi dan moderasi, bukan dimutasi pada banyak halaman.

## 2. Matriks akses aplikasi

| Objek/aksi | Peserta | Penguji dosen/guru | Pengelola |
|---|---|---|---|
| Draf paket | Milik sendiri | Tidak | Ringkasan kesiapan, bukan melihat draf isi secara default |
| Paket final | Milik sendiri | Hanya penugasan aktif | Peserta/periode yang dikelola |
| Ubah bukti | Draf/revisi yang dibuka | Tidak | Membuka revisi dengan alasan, bukan mengganti bukti |
| Draft assessment | Tidak | Milik sendiri | Hanya status penyelesaian, bukan isi draft |
| Assessment final | Hanya melalui hasil publikasi | Milik sendiri | Rekap hasil final |
| Skor final pasangan | Tidak | Tidak secara default; terbuka terbatas pada kasus moderasi yang diotorisasi | Ya setelah pasangan final |
| Rubrik periode | Versi panduan yang dipublikasikan | Versi yang ditugaskan | Memilih versi sebelum penilaian dimulai |
| Moderasi | Status proses netral bila diperlukan | Kasus yang ditugaskan, setelah pasangan final | Buka, koordinasi, tutup |
| Publikasi hasil | Baca milik sendiri | Tidak | Ya setelah syarat terpenuhi |
| Wawancara | Jadwal/status sendiri | Tugas sendiri | Atur dan pantau |

Ini batas tampilan/layanan mock, **bukan perlindungan data sungguhan**. Fixture dan state lokal dapat diperiksa pemilik browser. Jangan memasukkan data nyata.

## 3. Periode dan waktu demo

Periode menyimpan tahun, nama kegiatan, jalur deskriptif, bidang studi, waktu pengumpulan, waktu penilaian, `rubricVersionId`, `caseStudySource`, kebutuhan video, opsi wawancara, dan kuota opsional.

Semua timestamp disimpan ISO UTC; format tampilan WIB. Semua logika deadline mengambil satu `DemoClock`, tidak mencampur `Date.now()` dengan tanggal fixture. Tombol pengelola "Gunakan waktu demo"/skenario waktu harus jelas; tidak mengubah jam sistem.

Seed periode generik **"Simulasi UKIN PPG UNJ 2026"**, bukan nama kegiatan nasional yang diklaim nyata. Waktu awal `2026-11-18T02:00:00.000Z` (18 November 2026, 09.00 WIB), pengumpulan 1–30 November dan penilaian 1 November–10 Desember. Ini sengaja tumpang-tindih untuk demo, bukan kalender resmi.

Sebelum periode penilaian dibuka: boleh melihat penugasan dan panduan, tidak boleh memfinalisasi. Setelah ditutup: read-only untuk penilaian reguler. Moderasi/revisi setelah tutup memerlukan jendela moderasi yang dibuka pengelola dengan alasan.

Kuota harian default `null` = tidak dibatasi. Jika diaktifkan, hitung finalisasi pertama pasangan `(penguji, paket, versi)` pada tanggal WIB. Menyimpan draf dan revisi moderasi tidak menghabiskan kuota lagi. UI harus menyebut kuota sebagai aturan simulasi.

## 4. Transisi paket

| Dari | Peristiwa | Syarat | Hasil |
|---|---|---|---|
| draft | Simpan | Field yang terisi valid | Draf tetap, pembaruan revision counter |
| draft | Kirim final | Tiga komponen lengkap; persyaratan video sesuai periode; file tersedia; konfirmasi | Snapshot v1, receipt, submitted, completeness pending |
| submitted/resubmitted | Tandai lengkap | Pengelola memeriksa akses/kelengkapan | completeness complete, kandidat siap dinilai |
| submitted/resubmitted | Minta perbaikan | Alasan dan komponen yang perlu diperbaiki | revision_requested, completeness needs_correction |
| revision_requested | Kirim ulang | Validasi lengkap dan konfirmasi | Snapshot vN+1, receipt baru, completeness pending |

Draf bukan objek final. Snapshot memuat judul/deskripsi/teks kasus, referensi file dan ID video, pengirim, waktu, serta versi. **Menyimpan URL YouTube tidak membekukan isi videonya.** Catat `lastPlaybackCheckedAt` bila benar-benar diperiksa; tidak menjanjikan keutuhan bukti eksternal.

Jika revisi paket diminta setelah penilaian dimulai: pertahankan hasil lama sebagai arsip yang menunjuk versi lama, batalkan kelayakannya sebagai hasil versi baru, hentikan finalisasi editor versi lama, dan wajibkan kedua penguji meninjau versi baru. Jika hasil lama sudah dipublikasikan, tarik publikasi dengan alasan dan beri peserta pemberitahuan netral; jangan diam-diam menampilkan hasil lama pada bukti baru.

Membuka ulang paket bukan tindakan rutin tanpa sebab. Gunakan satu konfirmasi yang menjelaskan efek terhadap penilaian dan publikasi.

## 5. Penugasan dan identitas penguji

Setiap assignment berisi period, attempt, paket/versi yang dinilai, examinerId, examinerKind, serta aktif/nonaktif. Satu pasangan: dua user berbeda, satu dosen dan satu guru. Tidak menilai diri sendiri. Pemilihan penguji manual cukup.

Pergantian penguji boleh sebelum mulai. Setelah ada draf/final: wajib alasan dan arsip assignment lama; nilai lama tidak dipindahkan menjadi milik penguji baru. Peserta tidak memperoleh akses ke akun penguji.

Role switch menggunakan akun, bukan mengganti field role pada satu user yang sama. Penguji dosen dan guru harus menghasilkan record assessment berbeda.

## 6. Assessment tiga komponen

Kunci satu assessment: `(assignmentId, evidenceVersionId, rubricVersionId)`. Nilai per indikator, catatan, serta evidence reference tersimpan dalam draf. Tiga komponen selalu dipisahkan di UI.

Skala default demonstrasi **integer 1–4**. `null` berarti belum diisi; `0` tidak valid. Rubrik demo ini bukan instrumen nasional. Jangan menggunakan angka 1–10 yang terlihat pada sumber lain tanpa sengaja mengganti versi instrumen.

Sebelum final: semua indikator wajib terisi; feedback per komponen nonkosong; bukti wajib tersedia/dapat ditinjau; periode/assignment aktif; versi form belum usang; pernyataan "Penilaian simulasi ditinjau" dikonfirmasi. Tidak perlu mengukur waktu tonton sebagai bukti objektif bahwa video benar-benar dipahami.

Skor komponen ditampilkan sebagai jumlah skor terhadap maksimum, misalnya **12/16 (rubrik demo)**. Jika menunjukkan persentase, tulis rumus `(jumlah skor / skor maksimum) × 100`, bukan label nilai resmi. Tidak ada rata-rata tiga komponen, rata-rata pasangan, bobot, atau lulus/tidak lulus default.

Finalisasi menghasilkan snapshot immutable dengan waktu dan versi. Revisi final wajib alasan dan izin proses. Selama draft revisi dibuat, final sebelumnya tetap arsip/hasil aktif sampai revisi difinalisasi; publikasi ke peserta tidak otomatis ikut berubah. Dalam moderasi terbuka, pengelola tidak boleh mempublikasikan baru.

## 7. Catatan bukti dan video

Setiap catatan memiliki owner examiner, komponen, evidence id, evidence version, indikator opsional, teks, dan timestamp detik untuk video. `mm:ss`/`hh:mm:ss` diubah ke integer nonnegatif. Pastikan waktu tidak melebihi durasi bila durasi tersedia dari player; durasi metadata kosong tidak diisi tebakan.

`getCurrentTime` dan `seekTo` hanya dipakai ketika player siap. Jika API tidak tersedia, catatan timestamp manual tetap dapat dibuat, namun tombol lompat video harus menjelaskan keadaan. Tampilkan "Waktu diisi manual" bila relevan.

Peserta tidak otomatis melihat catatan internal mentah. Hanya feedback yang dipilih untuk hasil publikasi ditampilkan.

## 8. Moderasi manual

Syarat membuka: dua assessment final aktif untuk versi paket/rubrik yang sama; pengelola memilih indikator/komponen dan menulis alasan. Tidak ada pemicu otomatis berdasar selisih angka yang belum ditetapkan pengguna.

Penguji terkait melihat perbandingan yang relevan dan merespons: mempertahankan dengan penjelasan atau merevisi hasil sendiri. Riwayat lama dipertahankan. Pengelola menutup setelah dua respons selesai, tidak ada draft revisi yang belum final, dan catatan penyelesaian terisi.

Penutupan **tidak menuntut skor kedua penguji harus identik**. Bila tetap berbeda, catat penjelasannya dan tampilkan berdampingan. Ketidaksetujuan bukan otomatis gagal/lulus. Selama kasus belum selesai, hasil tidak boleh diterbitkan.

## 9. Publikasi hasil

Gate: paket lengkap, dua final pada versi aktif, tidak ada moderasi terbuka, dan wawancara selesai hanya bila periode mengaktifkan gate tersebut.

Pengelola menyiapkan ringkasan kekuatan/perbaikan dan memilih feedback publik. Default hasil peserta: "Penilaian simulasi selesai", nama komponen, ringkasan, serta tanggal. Skor rinci tidak dipublikasikan secara default; bila opsi demo `showComponentScores` aktif, tampilkan dua skor per komponen dengan label penguji, tanpa angka gabungan atau keputusan kelulusan.

Setiap publikasi adalah snapshot tersendiri. Koreksi membutuhkan versi publikasi baru/penarikan beralasan. Angka di dashboard peserta berasal dari snapshot terbit, bukan draft assessment.

## 10. Riwayat, retaker, dan idempotensi

Event log minimal: actorId, action, entityId, versi, waktu demo, alasan bila wajib. Log lokal hanya simulasi audit trail, bukan catatan anti-manipulasi.

Retaker menyimpan `previousAttemptId`; jangan mereset attempt lama ketika membuat yang baru. Kuota/nilai mengikuti attempt aktif.

Satu klik atau double-click submit tidak membuat dua receipt/topik/moderasi yang sama. Tombol disabled saat aksi sinkron berlangsung atau operation id sederhana cukup; tidak perlu infrastruktur distribusi. Penulisan paralel lintas tab bukan cakupan; sebutkan batas satu tab.

## 11. Matriks skenario untuk tes selektif

Prioritaskan: kirim paket tidak lengkap ditolak; draf tetap privat di UI; double-submit tidak duplikat; penilai pasangan tidak melihat draft; skor kosong bukan nol; finalisasi versi lama ditolak; publikasi menunggu dua final; moderasi terbuka memblokir publikasi; file setelah refresh diberi penjelasan; reset tidak menyentuh LMS; revisi paket mempertahankan arsip dan membatalkan kelayakan hasil lama.

Tidak perlu membuat target jumlah tes/coverage. Satu alur nyata pada URL presentasi lebih penting daripada laporan puluhan tes yang tidak membuka aplikasi.

## Batas implementasi Tahap 3 (6 November 2026)

Ruang penilaian independen dan revisi final minimal tersedia. Matriks akses serta proses moderasi/publikasi di atas tetap target tahap lanjut: pada Tahap 3 pengelola **hanya** melihat metadata progres, alasan kendala teknis dan izin revisi; tidak melihat skor final pasangan atau isi draf. Peserta tidak menerima skor/feedback baru.

Izin revisi final: pengelola dalam lingkup periode memilih versi final dan memberi alasan. Penguji pemilik membuka draf dengan alasan sendiri, memeriksa ulang bukti dan memfinalisasi versi berikutnya. Izin dipakai sekali; final lama utuh. Moderasi terbuka/publikasi/versi paket usang memblokir alur revisi minimal ini. Proses respons/penutupan moderasi belum dibuat.

Bukti arsip assessment pribadi tetap bisa dibaca pemilik melalui riwayat penilaian, termasuk ketika assignment telah diarsipkan oleh revisi paket. Ini pengecualian baca arsip untuk assessment sendiri; tidak memberi akses umum ke seluruh bukti lama atau mengizinkan finalisasi draf usang. Assignment baru tidak membawa nilai/catatan lama.

Seluruh penyimpanan draf pada UI bersifat eksplisit melalui Simpan draf. Berpindah komponen tidak membuang isian. Navigasi/role-switch/refresh memperingatkan jika ada perubahan belum disimpan; draf yang sudah disimpan bertahan pada tab/origin yang sama ketika storage tersedia. Tidak ada autosave atau dukungan penulisan paralel lintas tab.


## Implementasi Tahap 4

Batas Tahap 3 di atas kini digantikan alur berikut. Aturan bisnis bagian 1-10 tetap berlaku.

1. Dua final pada versi paket/rubrik aktif memungkinkan pengelola membuka kasus manual dengan indikator dan alasan. Kasus terbuka memblokir publikasi. Hanya pasangan kasus dapat melihat perbandingan indikator yang dipilih; draf dan feedback lain tetap pribadi.
2. Penguji mempertahankan final awal dengan penjelasan, atau membuka revisi sendiri menggunakan otorisasi kasus. Final revisi mencatat permissionId yang terhubung moderationCaseId. Tanggapan revisi wajib menunjuk final revisi kasus ini. Penutupan memerlukan dua respons pada final terkini, tanpa draf tersisa, serta catatan pengelola; angka tidak harus sama.
3. Selepas jendela penilaian, pengelola menetapkan jendela moderasi dengan alasan. Ini hanya membuka revisi final yang sudah ada. Penilaian awal dan pengumpulan tidak ikut terbuka.
4. Publikasi memerlukan paket lengkap/current, peserta/pasangan aktif, dua final current, tanpa draf/kendala terbuka, moderasi selesai, serta wawancara completed bila gate aktif. Pengelola menyiapkan kekuatan, saran, feedback tiga komponen dan opsi skor. Tinjau pratinjau peserta dan konfirmasi; perubahan state mengharuskan pratinjau ulang.
5. Penerbitan idempotent dengan request key dan isi yang sama. Koreksi membuat vN+1; penarikan memerlukan alasan. Peserta hanya menerima snapshot aktif miliknya, tidak memperoleh isi internal assessment atau versi publik yang ditarik melalui halaman hasil. Dashboard mengikuti snapshot terbit.
6. Pergantian penugasan menyimpan assessment lama, mengarsipkan kasus terbuka, menarik publikasi dan membatalkan wawancara terkait. Slot penguji yang tetap dipertahankan tidak kehilangan assessment. Revisi paket memakai invalidasi yang sama; versi bukti baru memulai penilaian baru.
7. Wawancara terikat paket/pasangan, jadwal/status dan riwayat. Peserta melihat jadwal/status/link sendiri; catatan internal hanya penguji terkait/pengelola. Selesai hanya dicatat setelah waktu DemoClock mencapai jadwal. Domain meet.demo.invalid hanya contoh dan tidak membuka konferensi.
8. Periode/akun mempunyai CRUD ringan. Konfigurasi yang dipakai dibekukan; duplikasi membuat aturan baru tanpa mengubah data lama. Akun noninteraktif tambahan tidak menambah login. Pengumuman draft tidak terlihat sampai diterbitkan; arsip mempertahankan read markers.

Status arsip pada kasus moderasi adalah pembatalan akibat perubahan paket/pasangan, bukan keputusan nilai. Semua batas akses hanyalah simulasi frontend.
