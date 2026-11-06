# Persiapan deployment UKIN PPG UNJ

**6 November 2026 — source dan build Windows diperiksa; belum dipublikasikan.** Direktori ini belum merupakan repository Git. URL repository, branch tujuan, akun/proyek Cloudflare, versi Wrangler dan URL publik belum ditentukan. Tidak ada push, deployment, atau perubahan LMS.

## Target hosting

Gunakan **Cloudflare Workers Static Assets**, proyek dan akun UKIN baru sesuai pilihan pengguna. Nuxt memakai ssr:false; npm run generate menghasilkan .output/public. Tidak ada Worker bisnis, backend, database, atau server Nitro yang perlu dijalankan. Jangan memakai preset server Cloudflare atau konfigurasi Pages pada jalur ini.

Permintaan aset statis gratis dan tidak dibatasi jumlahnya menurut [dokumentasi Cloudflare](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/), diperiksa 6 November 2026. Ini tidak menyatakan semua layanan tambahan gratis; kuota build/platform dan domain tambahan mengikuti akun yang dipilih. Mock tetap memakai penyimpanan browser lokal.

## Status preflight nyata

| Pemeriksaan | Hasil sesi Tahap 5 |
|---|---|
| Runtime lokal | Node 22.17.0, npm 11.21.1; .nvmrc dan packageManager sesuai. |
| Test / typecheck | 47 tes lulus; Nuxt typecheck exit 0. |
| Source / generate / output | Lulus; 20 route, 23 entry prerender termasuk fallback, 76 file, 198 referensi aset. |
| Lockfile | Tidak diubah. node scripts/verify-lock.mjs memeriksa 21 referensi optional Linux x64, termasuk versi nested. Ini bukan bukti instalasi Linux. |
| Linux clean install | Belum dijalankan: Docker Linux engine dan WSL menolak akses. |
| Registry | Satu npm view wrangler version dengan fetch-retries=0 dan fetch-timeout=10000 gagal ENOTFOUND. Tidak diulang; Wrangler tidak dipasang atau diklaim teruji. |
| Browser | Chrome dapat dibaca, tetapi preview terisolasi 127.0.0.1:3212/login gagal ERR_CONNECTION_TIMED_OUT. UI empat akun, mobile dan YouTube masih perlu diperiksa. |

Build mengeluarkan warning Nitro cache-driver.js sebagai external serta informasi ssr:false; generate dan verifikasi output tetap lulus. Ini tidak membuktikan perilaku browser.

Build ulang setelah koreksi CSS sempat gagal EPERM pada direktori cache prerender. Setelah direktori teramati ada dan probe tulis berhasil, satu retry lulus tanpa penghapusan dependency/cache. Lihat PROGRESS.md untuk log dan batas pemeriksaan.

## Repository baru — langkah setelah tujuan disepakati

1. Buat repository **UKIN tersendiri** pada akun GitHub yang dipilih pengguna. Jangan memakai remote LMS atau menebak URL.
2. Dari root UKIN, inisialisasi Git bila masih belum ada. Periksa .gitignore, daftar staged dan diff sebelum commit. Source, public, scripts, tests, dokumentasi, package/lockfile, .nvmrc dan workflow perlu masuk; dependency, output build, cache, .env, log dan tmp tidak masuk.
3. Tetapkan remote hanya ke URL UKIN yang telah dikonfirmasi. Periksa git remote -v sebelum push. Push belum diotorisasi pada sesi ini.
4. Setelah repository tersedia, jalankan manual workflow **UKIN Linux preflight (no deployment)** melalui GitHub Actions. Workflow hanya membaca source dan menjalankan pemeriksaan; tidak berisi credential atau perintah deployment.

.github/workflows/verify-linux.yml memakai Ubuntu, Node dari .nvmrc, npm 11.21.1, npm ci --include=optional dan timeout job 15 menit. Workflow belum dieksekusi. Catat URL run dan hasil aktual sebelum menyatakan Linux lulus.

Untuk clone Linux bersih dengan registry yang dapat diakses:

~~~sh
node --version
npm --version
npm ci --include=optional --fetch-retries=0 --fetch-timeout=30000
node scripts/verify-lock.mjs
npm run test
npm run typecheck
npm run verify
npm run generate
npm run verify
npm run verify:output
~~~

Jangan menjalankan clean install di workspace presentasi yang masih dipakai hanya untuk mencoba ulang jaringan. Jangan menghapus lockfile, mengabaikan lifecycle scripts, atau membuang optional dependencies untuk menyamarkan kegagalan native binding. Bila Linux gagal, simpan log dan versi; perbaikan lockfile hanya dilakukan setelah penyebab terbukti, di clone terisolasi dengan registry online, lalu review diff dan ulangi npm ci. Cache yang dibersihkan, bila terbukti perlu, hanya milik proyek UKIN baru.

## Pengaturan Workers Builds setelah otorisasi

| Pengaturan | Nilai |
|---|---|
| Repository / branch | Repository UKIN baru dan branch yang disetujui; belum tersedia. |
| Root directory | Root repository (/). |
| Runtime | Node 22.17.0 melalui .nvmrc atau NODE_VERSION; npm 11.21.1 melalui packageManager di package.json. |
| Dependency install | SKIP_DEPENDENCY_INSTALL=1, karena build command di bawah menjalankan npm ci secara eksplisit. |
| Build command | Command berikut. |
| Assets directory | ./.output/public, di konfigurasi Wrangler. |
| Deploy command | Wrangler versi exact yang telah diverifikasi, deploy --config wrangler.jsonc; masih menunggu pemilihan versi dan target. |

~~~sh
npm ci --include=optional --fetch-retries=0 --fetch-timeout=30000 && node scripts/verify-lock.mjs && npm run test && npm run typecheck && npm run verify && npm run generate && npm run verify:output
~~~

Pengaturan runtime mengacu pada [Workers Builds build image](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/). engines.npm bukan pengatur versi npm di Workers Builds; gunakan packageManager. Jangan mengandalkan NPM_VERSION dari panduan hosting lain.

wrangler.example.jsonc hanya template. Setelah pengguna menetapkan target, salin ke wrangler.jsonc, ganti nama placeholder dengan nama proyek UKIN yang sama di dashboard, lalu pilih/pin versi Wrangler yang benar-benar dapat diuji. Jangan mengeksekusi template atau memakai versi latest tanpa pencatatan. Credential tetap pada integrasi/secret platform, bukan source atau form login mock.

Template memakai assets.directory, tanpa main atau run_worker_first. html_handling: auto-trailing-slash melayani folder route hasil generate; not_found_handling: 404-page menjaga aset/path tidak dikenal tetap 404. Semua 20 route resmi sudah disertakan dalam prerender. ID memakai query, bukan route dinamis baru. Rujukan: [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/) dan [HTML handling](https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/).

## Verifikasi pada URL sebenarnya

Sebelum presentasi, lakukan checklist berikut dan catat hasilnya, jangan menandai lulus dari build Windows:

- Buka /, /login, dashboard empat akun dan seluruh menu. Refresh deep link /app/penilaian?id=... dengan assignment nyata; query dan bundle tetap benar. Tanpa sesi harus diarahkan ke login.
- Buka tiga dokumen PDF contoh. Aset tidak dikenal harus 404, bukan HTML yang dianggap JavaScript/PDF. Periksa console/network browser.
- Jalankan alur sepuluh langkah di DEMO_GUIDE, draf/refresh/ganti akun/reset, lalu layout desktop 1440px dan mobile 390px/320px.
- Putar YouTube, catatan timestamp/seek, serta fallback membuka YouTube di jaringan presentasi. Link valid tidak menjamin pemutaran.
- Catat akun/proyek, URL aktual, branch/commit, Node/npm/Wrangler, perintah dan URL log build/deploy.

Data tidak pindah otomatis antara localhost, preview, domain publik, browser atau perangkat berbeda. File lokal bersifat sementara. Pembatasan role tetap simulasi frontend; publikasi URL bukan otorisasi production. Deployment menunggu repository tujuan, proyek baru dan instruksi pengguna berikutnya.
