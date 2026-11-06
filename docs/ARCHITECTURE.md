# Arsitektur frontend UKIN

**v1.0 · Rekomendasi implementasi; struktur folder boleh disesuaikan tanpa mengubah batas domain.**

## 1. Proyek mandiri

Repository dan dependency UKIN terpisah dari LMS. Gunakan Nuxt + TypeScript + Nuxt UI + Tailwind. Pilih versi stabil kompatibel saat implementasi, simpan versi nyata dan lockfile hasil registry, dan uji Linux sejak Tahap 0. Jangan menyalin `node_modules`, `.git`, `.nuxt`, `.output`, atau package-lock LMS sebagai shortcut.

Nuxt UI pada LMS masih tercatat `4.0.0-alpha.1` saat sumber diperiksa. Identitas visual boleh diadaptasi tanpa mewarisi versi prerelease itu. Berbagi desain tidak mengharuskan versi paket identik.

SPA/static dengan `ssr: false` adalah default mock. Tidak ada API backend/server routes bisnis. Target menghasilkan `.output/public` dan dapat disajikan sebagai aset statis. Penggunaan runtime deployment tidak menciptakan database atau sinkronisasi data dengan sendirinya.

## 2. Pemisahan lapisan

```text
app/
  components/       # komponen identitas, bukti, rubrik, status, player
  pages/            # halaman Nuxt
  layouts/          # public dan workspace
  composables/      # useSession, useUkin, useDemoClock, useVideoPlayer
  domain/           # types, aturan transisi, scoring, permission, validation
  services/         # antarmuka operasi + implementasi mock
  data/             # fixture dan instrumen versi tetap
  assets/css/       # tokens dan styling UKIN
public/samples/     # dokumen demo asli/fiktif, selalu tersedia
scripts/           # pemeriksaan output yang memang diperlukan
```

Komponen UI memanggil operasi service/composable, tidak langsung membaca/menulis localStorage di banyak tempat. Kontrak operasi boleh Promise untuk memudahkan backend nanti, tetapi jangan membuat loading palsu. Domain validation harus tetap dipanggil dari service, bukan hanya dari tombol/form.

Tidak perlu clean architecture berlapis berlebihan, microservices, ORM, API server dummy, atau paket monorepo bersama untuk mock ini.

## 3. Model data minimum

| Entity | Isi pokok |
|---|---|
| User | id, displayName fiktif, role, examinerKind opsional, active |
| Period | id, tahun, nama, windows, requirements, rubricVersionId, caseStudySource, interview flags, quota |
| Attempt | id, participantId, periodId, bidangStudi, attemptNumber, previousAttemptId |
| EvidenceDraft | attemptId, tiga komponen, revision counter, updatedAt |
| EvidenceVersion | id, attemptId, version, snapshot tiga komponen, submittedAt, receipt |
| CompletenessReview | evidenceVersionId, status, per-component issues, actor, time |
| Assignment | id, attemptId, examinerId, kind, active, reason/history |
| RubricVersion | id, schemaVersion, demo flag, scale, indicators/descriptors |
| Assessment | assignmentId, evidenceVersionId, rubricVersionId, draft, final versions |
| EvidenceNote | examinerId, evidenceVersionId, componentId, indicatorId, timestampSeconds opsional, body |
| ModerationCase | active version, alasan, indikator, responses, status, timestamps |
| Interview | attemptId, assignments, jadwal, status, notes, simulation flag |
| Publication | attempt/version, final assessment ids, feedback snapshot, visibility, publishedAt |
| Announcement | period/audience, draft/published/archived, content |
| ReadMarker | announcementId + userId |
| ActivityEvent | actor, action, entity, version, time, reason |

Enums/types diturunkan dari kontrak workflow. Jangan menyimpan angka dashboard sebagai koleksi terpisah. Penugasan dan akses dihitung lewat identitas user, bukan hanya label dosen/guru.

## 4. Persistence dan sesi

Sesi per tab di `sessionStorage` dengan key **`ppg-unj-ukin:v1:session`**. Snapshot JSON data bersama di `localStorage` dengan key **`ppg-unj-ukin:v1:state`**. Envelope memiliki `schemaVersion`, `seedVersion`, `savedAt`, dan `data`.

Data penilaian/read marker harus dikunci pada userId. Role switch tidak menghapus snapshot. Namespace UKIN tidak berbagi key LMS. Reset memakai daftar key UKIN yang dimiliki, bukan `localStorage.clear()` atau penghapusan semua key `ppg-unj-*`.

Persist JSON atomik lewat satu snapshot untuk alur yang saling terkait. Jika schema berubah, buat migrasi yang menjaga paket, penilaian, dan publikasi. Parse defensif, tampilkan notice bila data dipulihkan, jangan mengklaim pemulihan sempurna. Storage penuh/diblokir: fallback memori dengan peringatan jelas.

Batas demo: satu tab, satu origin, bukan multiuser realtime. Akun lain/perangkat lain tidak tersinkron. Session login tidak berisi password asli; fixture password dummy hanya untuk UX.

## 5. File dan versi bukti

Default aset contoh lokal agar presentasi tetap bekerja setelah refresh. File yang dipilih dari perangkat menggunakan File/object URL dalam registry memori terpisah; JSON hanya menyimpan metadata dan localFileId, bukan URL blob persisten yang tidak valid.

Setelah refresh, `availability = needs_reselection`; sembunyikan aksi buka yang tidak dapat bekerja dan tampilkan cara memilih ulang. Jangan menandai upload permanen. Lepaskan URL ketika tidak dipakai/reset; pertahankan URL versi final yang masih dipakai selama sesi agar penggantian draft tidak merusak bukti lama.

Pemulihan file untuk versi terkirim dilakukan oleh pemilik paket, bukan penguji. Simpan SHA-256 file lewat Web Crypto bila tersedia; pilih ulang harus cocok digest untuk memulihkan snapshot lama. File berbeda memerlukan revisi paket. Jika digest tidak tersedia, jangan mengklaim nama/ukuran membuktikan file sama: gunakan file bawaan untuk skenario final atau minta revisi paket. Ini fitur demo, bukan tanda tangan digital.

Untuk versi pertama tidak memakai IndexedDB sebagai storage file persisten. Boleh dievaluasi nanti, tetapi tidak diperlukan agar alur berjalan. Tidak ada file/video asli peserta atau siswa.

## 6. Video YouTube

Implementasi IFrame API di client saja; script satu kali, cleanup player saat unmount. Simpan canonical videoId dan URL, bukan HTML iframe dari pengguna. Allowlist hostname YouTube yang disepakati; validasi HTTPS dan format ID, jangan hanya menguji substring.

Dukung `watch?v=`, `youtu.be/`, dan `/embed/`; bentuk lain boleh ditolak dengan petunjuk. API `getCurrentTime`/`seekTo` untuk catatan. Jangan membutuhkan YouTube Data API/key untuk embed dan kontrol dasar. Tunda pemuatan sampai klik, `autoplay: 0`, `playsinline: 1`, `origin` dari host saat runtime. Tangani unavailable/private/embed denied/identifikasi client dan kegagalan jaringan; jangan menggunakan kebijakan referrer yang sengaja menghilangkan identitas yang dibutuhkan player.

Valid URL, player ready, playback observed, dan manually reviewed adalah keadaan berbeda. Jangan menulis reviewedAt dari event load otomatis. Privacy-enhanced embedding boleh dipakai bila kompatibel; itu bukan kontrol akses video. Jangan menyalin/mengunduh video dari YouTube ke aset proyek.

Untuk tes teknis tersedia ID contoh resmi dokumentasi YouTube `M7lc1UVf-VE`. Label sebagai **video contoh integrasi, bukan praktik mengajar peserta**. Pemutar belum diuji pada sesi penyusunan paket. Untuk presentasi pedagogi pilih video simulasi yang memang boleh ditampilkan dan cek embed ketika implementasi. Jangan mengarang ID video atau memakai rekaman anak yang sensitif.

Jika internet tidak tersedia, shell/rubrik/catatan tetap bisa dibuka; penilaian video baru tidak boleh diam-diam difinalisasi seolah video telah dilihat. Skenario fixture hasil yang sudah selesai bisa ditampilkan dengan penanda simulasi.

## 7. Routing usulan

Gunakan route tetap + query ID agar bukti baru tidak menuntut prerender ulang:

```text
/
/login
/app/peserta
/app/penguji
/app/pengelola
/app/paket?id=attemptId
/app/bukti-kirim?id=evidenceVersionId
/app/penugasan
/app/penilaian?id=assignmentId
/app/riwayat
/app/hasil?id=attemptId
/app/periode
/app/peserta-list
/app/pemeriksaan?id=attemptId
/app/monitoring
/app/moderasi?id=caseId
/app/wawancara
/app/pengguna
/app/pengumuman
/app/panduan
```

Ini daftar usulan, bukan kode sudah ada. Saat implementasi buat daftar route canonical lalu prerender route yang benar-benar tersedia. Unknown ID, draft yang tidak berhak dilihat, dan assignment lama mempunyai state tidak tersedia + jalan kembali. Guard login menyimpan return target relatif yang diizinkan, tidak menerima URL redirect eksternal.

## 8. Data dan batas aman minimum

Plain text dengan escaping, tanpa render HTML mentah pengguna. URL hanya HTTPS/domain yang tepat. File type/size check, tidak berpura-pura antivirus. CSV escape formula. Jangan masukkan token, NIK, nomor siswa nyata, password institusi, atau konten sensitif.

Persyaratan lintas peran tetap diterapkan pada service frontend, walaupun bukan keamanan nyata. Backend di masa depan harus memvalidasi ulang semua aturan; jangan menyalin guard frontend sebagai otorisasi production.

## 9. Verifikasi proporsional

Test selektif domain: state transition, skor, versi, draft visibility, publication gate, role switch, reset, validasi URL dan migrasi. Typecheck dan static generate. Clean install registry-backed di Linux sejak awal, bukan menunggu deployment.

Manual utama: satu alur empat akun, satu revisi teknis, satu moderasi, dan refresh/reset. Laptop/ponsel dasar; keyboard/focus/reduced motion yang memungkinkan. Jangan membangun suite E2E besar atau mengejar jumlah tes tertentu.

## Bentuk source Tahap 0-1 (catatan checkpoint terdahulu)

Nuxt SPA (ssr:false), module @nuxt/ui, Tailwind4, tanpa server business routes. Runtime injection app/plugins/ukin.client.ts membuat service satu kali untuk tab; useUkin menjadi adaptor reaktif tunggal. UI tidak mengakses storage secara langsung. Middleware session.global.ts menjaga akun/peran dan menormalkan trailing slash.

Types/fixtures pada tahap ini hanya model metadata: User, Period, Attempt, Assignment, Announcement, ReadMarker. Versi bukti/final/publication dalam fixture adalah metadata skenario, bukan implementasi snapshot bukti/assessment lengkap. Operasi upload/submit/finalisasi/moderasi/publikasi belum dibuat. Jangan menganggap type tipis ini menggantikan kontrak target lengkap di atas.

Reset hanya memakai STATE_KEY dan SESSION_KEY yang dideklarasikan services/mock.ts. Domain/selectors.ts menurunkan dashboard dan membatasi feedback/perspektif akun. Pengujian Node dengan type stripping mencakup service/domain; tidak membuktikan Nuxt/plugin/template berjalan. Belum ada migrasi karena belum ada schema sebelumnya. Rincian keterbatasan ada pada PROGRESS.md.

## Implementasi aktual Tahap 2 — 6 November 2026

Bagian ini menggantikan batas implementasi checkpoint di atas. Model kini memiliki EvidenceContent, EvidenceDraft, EvidenceVersion, CompletenessReview, ActivityEvent, serta FileRuntime. Tiga dimensi paket/kelengkapan/hasil tetap terpisah. Metadata assessment/publication fixture dipertahankan, tanpa editor penilaian atau publikasi baru.

- Snapshot schema 2, seed 2026-11-stage2; namespace key tidak berubah. domain/snapshot.ts memvalidasi schema 1 sebelum hydrateEvidence membentuk bukti simulasi, mempertahankan akun/jam/read markers/attempt/assignment/publication. Teks pengumuman bawaan yang persis sama dimutakhirkan; teks kustom tidak diubah. Snapshot tak dikenal/rusak tidak ditimpa otomatis.
- services/mock.ts adalah otoritas operasi frontend: validasi pemilik/scope/periode/revisi, normalisasi isi, finalisasi idempotent, kelengkapan manual, pembukaan revisi, dan riwayat. UI tidak boleh memutasi salinan snapshot untuk menyimpan perubahan.
- Plugin memakai plain JSON untuk melewatkan objek Vue ke domain; operasi mengirim salinan terpisah dan menyegarkan satu snapshot reaktif. Status perubahan belum disimpan dipakai guard rute, unload, logout, reset dan pergantian akun.
- services/files.ts menyimpan Blob/object URL hanya dalam memori. Ukuran 10 MiB, MIME/ekstensi/signature PDF-PNG-JPEG diperiksa. Bukti final dipulihkan pemilik memakai SHA-256, bukan nama/ukuran. Jika crypto tidak tersedia, file lokal dapat menjadi draf tetapi tidak memenuhi syarat final. Ini pemeriksaan teknis demo, bukan validasi keamanan isi PDF atau tanda tangan digital.
- Pengiriman menyimpan sourceDraftRevision, versi monoton per attempt, receipt, aktor dan DemoClock. Retry terhadap revisi yang sama mengembalikan receipt yang sama. Revisi baru mengarsipkan penugasan lama; setelah lengkap, pasangan fixture mengacu versi baru. Tidak ada input skor.
- Scope pengelola memakai managedPeriodIds. Penguji membaca hanya evidenceVersion sesuai assignment aktif. AttemptHistoryRow adalah proyeksi baca, bukan koleksi baru; histori retaker dibatasi akses masing-masing versi.
- Semua file contoh pada public/samples dan metadata digest pada data/sample-files.ts. Pemutar YouTube dimuat saat klik, memiliki timeout/error dan cleanup; keadaan player tidak menulis hasil pemeriksaan pengelola.

Route aktual tambahan: /app/paket?id=attemptId, /app/bukti-kirim?id=evidenceVersionId, /app/pemeriksaan?id=evidenceVersionId, /app/bukti?id=evidenceVersionId. Tanpa id, pemeriksaan/bukti menampilkan daftar. Perhatikan pemeriksaan memakai **ID versi**, bukan usulan attemptId pada daftar rute awal. Semua route tetap masuk konfigurasi generate dan pemeriksa output.

Typecheck/generate Windows lulus pada instalasi yang tersedia. Browser dan clean install Linux belum diverifikasi. Jangan menganggap keberhasilan build sebagai bukti alur UI. Script watchdog/preview di tmp hanya alat verifikasi lokal, bukan API bisnis atau bagian deployment.

## Implementasi aktual Tahap 3 — 6 November 2026

Bagian Tahap 2 di atas adalah checkpoint sebelumnya. Struktur terbaru menambahkan `domain/assessment-types.ts`, `domain/assessment.ts`, dan `services/assessments.ts`; operasi paket/bukti lama tetap digunakan.

- Envelope: `schemaVersion: 3`, `seedVersion: 2026-11-stage3`. Key `ppg-unj-ukin:v1:state`/`ppg-unj-ukin:v1:session` tetap; schema sesi tetap 1. Migrasi schema 2 menyalin seluruh data lama lalu menambah assessments: final bukti, hash, receipt, reviews, activities/revisi, retaker, assignments, jam, read markers, akun dipertahankan. Schema 1 melalui hidrasi bukti Tahap 2 dahulu. Snapshot tidak valid/tak dikenal tidak ditimpa otomatis.
- Metadata final fixture Tahap 2 belum berisi nilai. Migrasi membentuk assessment **contoh**, `fixture: true`, skor/feedback berlabel simulasi; bukan rekonstruksi penilaian pengguna. Assignment belum mulai dibuat lazy saat draf/kendala disimpan; draf metadata lama menjadi draf kosong dengan event fixture. Rubrik tidak dikenal ditahan tanpa mengarang nilai.
- Rubrik runtime disalin persis dari `references/rubric-demo.v1.json`, diverifikasi oleh `npm run verify`. ID periode lama `demo-12-v1` adalah alias `ukin-demo-rubric-v1` versi 1.0. Assessment mencatat ID serta snapshot rubrik dengan sourceId. Skala/isi/bobot tidak diubah. Null belum dinilai; integer 1–4; jumlah per komponen terhadap maksimum tanpa agregasi atau kelulusan.
- Assessment mengikat assignmentId/examinerId/evidenceVersionId/rubricVersionId. Draf mempunyai revisi optimistis, indikator/rujukan, feedback, pernyataan tinjauan dan catatan video. Final terpisah menyimpan aktor, DemoClock, versi dan sourceDraftRevision. Retry final yang sama mengembalikan record yang sama tanpa versi/event tambahan.
- Service menerima callback data/user/save/file runtime agar mengikuti akun/reset/clock terbaru. Semua baca/tulis pribadi memeriksa pemilik assignment. Pengelola dalam managedPeriodIds hanya menerima progres, metadata final dan alasan teknis; tidak menerima ratings/feedback/videoNotes/draf pasangan.
- Plugin memakai `getClientSnapshot`, bukan snapshot penuh: hanya assessment penguji aktif; seluruh assessment disembunyikan dari peserta/pengelola. Draf/bukti disaring menurut akses, feedback yang belum published disembunyikan. Dashboard dihitung melalui getDashboard dari state lengkap agar proyeksi tidak merusak hitungan. getSnapshot lengkap dipakai tes/persistensi domain, tidak diekspos melalui plugin. Proyeksi client bukan envelope untuk migrasi.
- **Batas keamanan:** JSON semua akun masih disimpan lokal. Pengguna developer tools dapat membaca storage. Service/selector/guard hanyalah simulasi frontend, bukan autentikasi/otorisasi production. Satu tab/origin; penulisan paralel lintas tab tidak didukung.
- Gate: assignment/attempt/versi aktif, submitted/resubmitted, completeness dan review terakhir complete, jendela penilaian DemoClock, rubric masih sama, bukan moderasi terbuka/published. Di luar jendela baca saja. Final ditambah seluruh skor/rujukan/feedback/konfirmasi tinjauan, bukti tersedia dan kendala terbuka kosong. Playback tidak otomatis membuktikan tinjauan; menonton via YouTube lalu mengonfirmasi manual diperbolehkan.
- Revisi minimal: pengelola mengizinkan versi final tertentu dengan alasan; hanya pemilik membuka draf revisi dengan alasan sendiri. Izin dikonsumsi sekali. Salinan final mereset tiga pernyataan tinjauan. Final lama tetap utuh dan ada di riwayat. Tidak ada perbandingan pasangan, penutupan moderasi, atau publikasi baru. Kasus moderasi terbuka/published/assignment usang tidak bisa direvisi melalui kontrol minimal ini.
- Revisi paket Tahap 2 tetap mengarsipkan assignment lama. Penilaian lama tidak dipindahkan; finalisasi draft lama ditolak. Pemilik assessment dapat membaca bukti arsip melalui service penilaian khusus; akses umum `/app/bukti` tetap assignment aktif. Kedua penguji mulai baru pada versi bukti yang diperiksa ulang.
- Kendala mencatat komponen/alasan/aktor/waktu dan alasan penyelesaian pemilik. Pengelola melihat alasan teknis, tidak mengganti skor atau menyelesaikan kendala penguji. Kendala menahan final tanpa memberi nol. File lokal setelah refresh tetap mengikuti pemulihan SHA-256 peserta Tahap 2.
- EvidenceVideo dipakai kembali dengan wrapper position()/seek() untuk getCurrentTime/getDuration/seekTo. AssessmentVideoNotes mengikat video/versi/indikator opsional; timestamp integer detik, source manual/player. Durasi 0/tidak tersedia berarti belum diketahui. Input detik/mm:ss/hh:mm:ss; jika API tidak siap, ada link YouTube bertimestamp. URL eksternal tidak membekukan isi video. Rujukan API: https://developers.google.com/youtube/iframe_api_reference (dibaca 6 November 2026); playback aktual belum diuji.
- Kuota default null tanpa editor periode. Guard final awal per penguji/attempt/versi/hari WIB; retry/revisi tidak memakai slot baru dan fixture tidak dihitung sebagai kerja aktual. Batas teknis teks 5.000 karakter dan 100 catatan video bukan aturan nasional.

Route baru didaftarkan pada middleware, navigasi, generate dan verifikasi output. `npm run verify` memeriksa source/aset/rubrik; `npm run verify:output` dijalankan setelah generate. Watchdog tmp/run-bounded.mjs memberi batas 60/120/180 detik dan heartbeat 20 detik.


## Implementasi aktual Tahap 4 - 6 November 2026

Bagian ini menggantikan batas checkpoint Tahap 3. Source tetap Nuxt SPA, TypeScript, Nuxt UI dan Tailwind; tanpa dependency baru atau server bisnis.

- Schema **4**, seed `2026-11-stage4`, menambah moderations, publications, interviews dan adminEvents. Stage3Data/Stage3Snapshot mendeskripsikan envelope lama. hydrateOperations menyalin semua koleksi lama tanpa mengubah assessment, final, draf, receipt, retaker, penugasan, akun atau jam. Schema 1/2 melewati migrasi sebelumnya. Namespace UKIN dan schema sesi 1 tetap. Koleksi, relasi versi/final dan tipe divalidasi sebelum menerima snapshot. Data rusak tetap disimpan tanpa ditimpa otomatis.
- Metadata moderasi lama dengan dua final menjadi **kasus contoh** beralasan migrasi. Metadata publikasi lama dengan bukti menjadi snapshot publik contoh tanpa skor baru. Ini bukan deteksi selisih otomatis atau rekonstruksi keputusan pengguna. Tes migrasi membandingkan semua koleksi lama.
- services/operations.ts menerima callback data/user/save yang sama dengan service assessment. domain/operations-types.ts dan domain/operations.ts memuat kontrak, migrasi, validasi, jendela moderasi, pengarsipan workflow dan CSV. Plugin menyediakan facade operasi bertipe. Pembacaan mengikuti snapshot reaktif; mutasi menyegarkan proyeksi. Dashboard tidak mempunyai state angka tersendiri.
- getClientSnapshot mengosongkan koleksi moderasi/publikasi/wawancara/log administratif. Selector khusus memeriksa akun dan lingkup sebelum mengembalikan salinan. getModeration hanya membuka indikator terpilih pada final kasus kepada pasangan terkait/pengelola; feedback komponen, catatan video, draf dan indikator lain tidak ikut dibuka. Monitoring pengelola menampilkan jumlah skor komponen hanya setelah dua final sesuai versi tanpa draf revisi.
- Penugasan manual memakai pratinjau dan token state. Pasangan dosen/guru harus aktif, berbeda dan bukan peserta sendiri; paket harus lolos pemeriksaan. Penggantian mempertahankan assignment/assessment lama sebagai arsip. Penguji baru tidak menerima skor lama. Slot yang tidak diganti tetap mempunyai penilaian sendiri. Moderasi terbuka diarsipkan, publikasi ditarik, wawancara dibatalkan dengan alasan. Revisi paket Tahap 2 memakai invalidasi workflow yang sama.
- Kasus moderasi menyimpan assignment/final awal, versi bukti/rubrik, indikator, aktor, alasan dan DemoClock. Pembukaan kasus mengotorisasi revisi sendiri; RevisionPermission.moderationCaseId mengikat izin ke kasus. Revisi memakai service assessment lama: alasan penguji, tinjauan ulang, final baru. Respons hanya menunjuk final sendiri terkini. Penutupan mensyaratkan kedua respons terkini, tanpa draf revisi dan catatan penyelesaian. Skor berbeda diperbolehkan. Kasus selesai menampilkan final yang dirujuk saat penutupan, bukan final revisi masa depan.
- Periode menambah jalur/bidang, revisi konfigurasi, arsip dan jendela moderasi beralasan. Aturan penilaian dibekukan setelah assessment ada; sumber kasus/rubrik/kebutuhan video dibekukan lebih awal bila paket sudah dipakai. Duplikasi membuat periode baru tanpa menyalin peserta/assessment. Penambahan peserta ke periode membuat paket kosong, bukan sistem registrasi/retaker baru. Arsip menutup pengumpulan dan penilaian. Jendela moderasi membuka revisi **final yang sudah ada**, bukan finalisasi awal setelah deadline.
- Publikasi menyimpan feedback publik, referensi dua final/assignment, versi bukti/rubrik, aktor/waktu, versi monoton dan status. Token pratinjau berubah bila final, penugasan, kasus, wawancara, konfigurasi atau publikasi berubah. Request key + fingerprint isi memberi idempotensi penerbitan. Koreksi membuat versi baru dan menandai versi lama superseded; penarikan mencatat alasan/aktor/waktu. Isi snapshot lama tidak ditimpa. Skor opsional berupa dua jumlah komponen terpisah, tanpa rata-rata/agregat/kelulusan.
- getPublishedResults hanya mengembalikan isi publik aktif milik peserta, tanpa referensi final internal atau riwayat penarikan mentah. Dashboard peserta mengambil hitungan/feedback dari snapshot publikasi aktif. Metadata feedback lama boleh tetap ada sebagai riwayat, tetapi proyeksi menyembunyikannya bila tidak ada publikasi aktif.
- Wawancara hanya muncul pada periode yang mengaktifkannya. Record mengikat paket/pasangan, jadwal UTC dengan input/tampilan WIB, URL HTTPS, status, revisi optimistis dan riwayat. Peserta menerima jadwal/status/link sendiri; catatan dan riwayat internal disembunyikan. Penyelesaian hanya setelah waktu jadwal tercapai menurut DemoClock. Gate publikasi hanya bila interviewRequiredForRelease aktif. Tidak ada skor keempat, konferensi atau perekaman.
- Akun tambahan selalu interactive:false; hanya empat akun bawaan bisa login/switch. Email tambahan wajib .invalid. Identitas login/peran yang dipakai tidak diganti; pengelola utama tetap aktif. Akun/periode yang direferensikan menggunakan nonaktif/arsip, bukan hapus. Tidak ada undangan atau password reset sungguhan.
- Pengumuman mempunyai draft/published/archived, periode/peran penerima, revisi dan penanda baca per akun. Draft/arsip tidak masuk proyeksi penerima. Pengumuman terbit tidak disunting diam-diam; koreksi memakai pengumuman baru. CSV mengikuti lingkup/filter periode, hanya status fiktif tanpa catatan internal/skor. Formula spreadsheet dinetralkan; kutip dan koma di-escape.

**Pembatasan ini tetap simulasi frontend.** Semua JSON dapat dibaca lewat developer tools/localStorage. Tidak ada otorisasi production, audit tahan manipulasi, sinkronisasi lintas tab atau persistence server. Draf disimpan eksplisit; formulir administrasi/publikasi bukan autosave. Browser UAT, clean install Linux, Tahap 5, push dan deployment belum dilakukan.
