# Prompt pertama — UKIN PPG UNJ

Salin isi di bawah ke sesi Codex yang membuka **root repository UKIN**, bukan repository LMS.

---

Bangun mock **UKIN PPG UNJ — Uji Kinerja Pendidikan Profesi Guru, Universitas Negeri Jakarta** dari paket konteks pada repository ini.

Baca `AGENTS.md`, `docs/PROGRESS.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/PRD.md`, `docs/DECISIONS_AND_SOURCES.md`, `docs/PPG_UNJ_DESIGN_FOUNDATION.md`, `docs/DESIGN_SYSTEM.md`, dan referensi screenshot sebelum implementasi. Pahami `docs/ASSESSMENT_AND_WORKFLOW.md` serta `docs/ARCHITECTURE.md` untuk fondasi data.

**Kerjakan hanya Tahap 0 dan Tahap 1 sekarang.**

Sasaran sesi ini:
1. Periksa workspace/repository UKIN. Jangan menyentuh repository LMS atau memakai remote/deployment-nya.
2. Siapkan Nuxt, TypeScript, Nuxt UI, dan Tailwind versi stabil yang kompatibel. Catat versi yang benar-benar dipilih. Verifikasi akses npm registry dan instalasi bersih sejak awal; jangan mengimpor node_modules atau lockfile lama dari LMS.
3. Gunakan token pada `references/brand.tokens.json` dan prinsip bersama sebagai fondasi identitas. Nilai dapat diperluas untuk kebutuhan UKIN, bukan diganti dengan tema baru.
4. Buat landing page, halaman login terpisah, shell responsif, dan dashboard awal peserta, penguji, serta pengelola. Penguji dosen/guru memakai pengalaman yang sama dengan akun dan penugasan terpisah. Sediakan empat akun demo dari `docs/DEMO_GUIDE.md`.
5. Siapkan fixture PPG fiktif, layanan mock, state versioned, jam demo, pergantian akun, dan reset yang hanya menyentuh data UKIN.
6. Dashboard awal menjelaskan fungsi peran serta tiga komponen penilaian. Aksi tahap berikutnya jangan dibuat seolah sudah bekerja. Jangan membangun form paket lengkap, seluruh rubrik, moderasi, dan wawancara sekarang.
7. Buat satu arah visual matang yang konsisten dengan LMS dan web ujian, tanpa mengunci layout seperti referensi. Landing dan login boleh ekspresif dengan ilustrasi/karakter/animasi yang menarik untuk mahasiswa. Area penilaian nantinya perlu mendukung fokus. Jangan menganggap profesional harus kaku atau datar.
8. Pertahankan nama dan konteks UKIN, bukan judul Learning Management System. Jangan membuat profil/berita website utama, pembayaran, atau SSO lintas produk. Website PPG lama bukan referensi.
9. Lakukan pemeriksaan proporsional untuk mock: typecheck, generate, aset, serta login/role-switch/reset yang tersedia. Coba browser desktop/mobile bila bisa, tanpa mengulang kegagalan alat berkali-kali atau mengklaim tes yang tidak dilakukan.
10. Perbarui `docs/PROGRESS.md`, versi dependency, keputusan desain, serta daftar pemeriksaan manual. Berhenti untuk review Tahap 1.

Konteks produk jangka lengkap: peserta menyerahkan perangkat, video YouTube, dan studi kasus; dosen dan guru menilai secara independen; pengelola menangani kelengkapan, penugasan, monitoring, moderasi, dan publikasi hasil. Wawancara hanya ketika periode mengaktifkannya. Rubrik paket adalah contoh simulasi, bukan instrumen resmi dan bukan mesin penentu kelulusan.

Kebebasanmu meliputi layout, komposisi, copywriting, ilustrasi, komponen khusus, serta micro-interactions. Batasnya adalah identitas satu keluarga, keterbacaan, aksesibilitas dasar, dan aturan proses yang konsisten. Jangan menyalin layout screenshot nasional atau nama/foto orang di dalamnya.

Rujukan desain sudah tersedia lokal. Jika situs referensi tidak dapat dibuka, gunakan screenshot dan token yang tersedia serta catat batasnya; jangan mengarang inspeksi live.

**Tidak ada deployment atau push ke repository lain pada sesi ini.**
