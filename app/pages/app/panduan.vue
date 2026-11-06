<script setup lang="ts">
definePageMeta({ layout: 'workspace' })
useHead({ title: 'Panduan demo · UKIN PPG UNJ' })

const steps = [
  { title: 'Kenali ruang tiap peran', text: 'Masuk sebagai peserta, penguji dosen, penguji guru, atau pengelola. Dashboard menunjukkan pekerjaan dan ringkasan yang sesuai dengan akun.' },
  { title: 'Siapkan tiga komponen', text: 'Peserta membuka Paket UKIN, memilih PDF contoh atau file perangkat, memasukkan tautan YouTube, dan menyiapkan laporan studi kasus. Simpan draf sebelum berpindah.' },
  { title: 'Kirim dan periksa', text: 'Peserta meninjau checklist lalu mengonfirmasi kirim final. Ganti ke pengelola untuk memeriksa paket terkirim, menandai lengkap, atau meminta perbaikan per komponen.' },
  { title: 'Perbaiki sebagai versi baru', text: 'Jika diminta, peserta memperbaiki draf dan mengirim ulang. Bukti pengiriman dan versi lama tetap tercatat. Penilaian baru mengacu pada paket yang telah diperiksa kembali.' },
  { title: 'Nilai dari sudut pandang Anda', text: 'Penguji membuka Penugasan saya. Tinjau bukti dan deskriptor 12 indikator, isi skor 1–4, catatan, serta feedback tiga komponen. Video mendukung catatan bertimestamp manual atau dari pemutar. Simpan draf sebelum berpindah halaman atau akun.' },
  { title: 'Tinjau dan finalisasi', text: 'Konfirmasikan bahwa setiap komponen telah ditinjau. Finalisasi hanya tersedia bila indikator lengkap dan tidak ada kendala teknis. Ganti akun dosen/guru untuk melihat draf yang terpisah. Hasil final ada di Riwayat penilaian masing-masing.' },
  { title: 'Revisi dengan jejak yang jelas', text: 'Pengelola melihat Progres penilaian dan dapat memberi izin revisi final dengan alasan. Penguji terkait membuka draf revisi beralasan lalu meninjau ulang tiga komponen. Final sebelumnya tetap tersimpan. Pengelola dapat membuka moderasi indikator setelah dua final, lalu menerbitkan feedback terpilih.' },
  { title: 'Coba pengumuman dan pergantian akun', text: 'Tandai pengumuman sebagai dibaca, lalu pilih Ganti akun. Penanda baca mengikuti akun masing-masing; kembali ke akun awal untuk melihatnya.' },
  { title: 'Diskusikan indikator melalui moderasi', text: 'Setelah dua final tersedia, pengelola memilih peserta pada Publikasi hasil, memilih indikator dan alasan, lalu membuka kasus. Kedua penguji merespons di Moderasi: mempertahankan atau merevisi final sendiri. Pengelola menutup setelah dua tanggapan terkini tersedia.' },
  { title: 'Terbitkan hasil yang dipilih', text: 'Pengelola menyusun kekuatan, saran, dan feedback tiga komponen, meninjau tampilan peserta, lalu mengonfirmasi publikasi. Skor komponen opsional dan terpisah. Ganti ke peserta untuk membuka Hasil publikasi; koreksi memakai versi baru atau penarikan beralasan.' },
  { title: 'Atur kebutuhan periode', text: 'Pengelolaan menyediakan periode, akun fiktif, penugasan, pengumuman, dan jejak aktivitas. Aturan yang telah digunakan dibekukan; duplikasi untuk aturan baru. Aktifkan wawancara di periode baru bila diperlukan. Tautan demo tidak membuat konferensi nyata.' },
  { title: 'Lihat waktu simulasi', text: 'Jam demo memakai jadwal contoh, bukan jam perangkat. Pengelola dapat membandingkan kondisi periode aktif dan periode tertutup.' },
  { title: 'Ulangi dari awal', text: 'Gunakan Reset demo dan konfirmasikan pilihan. Data UKIN kembali ke contoh awal dan sesi akun berakhir.' },
]
</script>

<template>
  <div class="guide-page">
    <header class="page-heading">
      <p class="eyebrow">PUSAT BANTUAN</p>
      <h1>Kenali ruang UKIN Anda.</h1>
      <p class="muted">Panduan singkat untuk menjelajahi prototipe dengan nyaman.</p>
    </header>

    <section class="guide-banner" aria-labelledby="demo-title">
      <div class="guide-icon"><AppIcon name="help" /></div>
      <div>
        <p class="eyebrow">MODE DEMO · DATA FIKTIF</p>
        <h2 id="demo-title">Satu paket, tiga bukti bermakna.</h2>
        <p>Demo ini mendukung paket berversi, pemeriksaan kelengkapan, penilaian independen, dan riwayat revisi. Rubrik skala 1–4 hanya untuk simulasi; bukan instrumen resmi UKPPPG. Moderasi manual dan publikasi hasil tersedia melalui ruang pengelola. Semua akun dan contoh bersifat fiktif.</p>
      </div>
    </section>

    <div class="guide-layout">
      <section class="panel walkthrough" aria-labelledby="walkthrough-title">
        <h2 id="walkthrough-title" class="section-heading">Coba dalam beberapa langkah</h2>
        <ol>
          <li v-for="(step, index) in steps" :key="step.title">
            <span class="step-number" aria-hidden="true">0{{ index + 1 }}</span>
            <div><h3>{{ step.title }}</h3><p>{{ step.text }}</p></div>
          </li>
        </ol>
      </section>
      <aside class="panel demo-notes" aria-labelledby="notes-title">
        <AppIcon name="shield" />
        <h2 id="notes-title">Satu tab untuk seluruh cerita.</h2>
        <p>Gunakan satu tab pada alamat website yang sama. Data tersimpan pada browser ini dan tidak tersinkron ke perangkat atau browser lain.</p>
        <p>Gunakan akun contoh. Jangan memasukkan kata sandi institusi, data peserta, atau dokumen pribadi.</p>
        <p>Jika penyimpanan browser tidak tersedia, aplikasi memberi pemberitahuan. Perubahan saat itu hanya bertahan selama halaman masih terbuka.</p>
        <span class="status-badge">Simulasi frontend</span>
      </aside>
    </div>

    <section class="panel questions" aria-labelledby="questions-title">
      <h2 id="questions-title" class="section-heading">Hal yang perlu Anda ketahui</h2>
      <details open>
        <summary>Apa saja yang menjadi komponen penilaian?</summary>
        <p>Perangkat pembelajaran, video praktik pembelajaran, dan studi kasus. Wawancara hanya digunakan jika diaktifkan pada periode, dan bukan komponen skor keempat.</p>
      </details>
      <details>
        <summary>Apakah status lengkap berarti lulus?</summary>
        <p>Tidak. Kelengkapan, proses penilaian, dan publikasi hasil adalah keadaan berbeda. Prototipe ini tidak menentukan kelulusan atau mengklaim rubrik contoh sebagai instrumen resmi.</p>
      </details>
      <details>
        <summary>Apakah berkas dikirim ke server dan apakah sudah dinilai?</summary>
        <p>Tidak ada upload ke server. File dari perangkat berada sementara dalam memori browser, sedangkan metadata dan teks draf disimpan lokal. Pemeriksaan lengkap adalah pemeriksaan teknis, bukan skor atau keputusan kelulusan.</p>
      </details>
      <details>
        <summary>Bagaimana berkas dan video digunakan?</summary>
        <p>Dokumen contoh bawaan tetap tersedia setelah refresh. File lokal harus dipilih ulang; bukti final hanya dapat dipulihkan oleh pemilik dengan SHA-256 yang sama. Video YouTube memerlukan internet; URL valid, video berhasil diputar, dan pemeriksaan pengelola adalah keadaan berbeda.</p>
      </details>
      <details>
        <summary>Apakah Ganti akun menghapus pekerjaan?</summary>
        <p>Tidak. Pergantian akun mempertahankan data demo. Penanda pengumuman tetap milik akun masing-masing. Reset demo adalah tindakan terpisah yang meminta konfirmasi dan hanya mengembalikan data UKIN ke awal.</p>
      </details>
      <details>
        <summary>Apakah akun ini bisa dipakai di LMS atau web ujian?</summary>
        <p>Akun contoh hanya berlaku di mock UKIN ini. Tidak ada integrasi akun, data, atau hasil dengan layanan PPG UNJ lainnya.</p>
      </details>
    </section>
  </div>
</template>

<style scoped>
.section-heading{display:block;font-size:21px;font-weight:700;line-height:1.3;margin-bottom:0}h2,h3{font-weight:700}
.page-heading{margin-bottom:0}
.guide-page{display:grid;gap:28px}.guide-banner{display:flex;gap:24px;background:linear-gradient(125deg,var(--brand-deep),var(--brand-dark));color:white;border-radius:20px;padding:32px}.guide-banner .eyebrow{color:var(--accent)}.guide-banner h2{font-size:26px;letter-spacing:-.7px;margin:10px 0}.guide-banner p:last-child{max-width:760px;line-height:1.8;color:#e0f3ee}.guide-icon{flex:0 0 58px;height:58px;border:1px solid #ffffff40;border-radius:16px;display:grid;place-items:center;color:var(--accent)}.guide-icon svg{width:28px;height:28px}.guide-layout{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(250px,1fr);gap:24px}.walkthrough,.demo-notes,.questions{padding:28px}.walkthrough ol{list-style:none;margin:28px 0 0;padding:0;display:grid;gap:28px}.walkthrough li{display:flex;gap:18px}.step-number{font-size:14px;font-weight:750;color:var(--brand);background:var(--tint);border-radius:50%;width:38px;height:38px;display:grid;place-items:center;flex-shrink:0}.walkthrough h3{margin:0 0 7px;font-size:17px}.walkthrough p,.demo-notes p,.questions p{color:var(--muted);line-height:1.75;margin:0}.demo-notes{align-self:start;background:var(--tint);border-color:#bfe3d8}.demo-notes>svg{width:29px;height:29px;color:var(--brand)}.demo-notes h2{font-size:23px;line-height:1.3;margin:20px 0 16px;max-width:240px}.demo-notes p+p{margin-top:14px}.demo-notes .status-badge{margin-top:22px;background:white}.questions details{border-top:1px solid var(--line)}.questions details:first-of-type{margin-top:20px}.questions summary{font-weight:650;padding:20px 0;cursor:pointer;line-height:1.5}.questions p{padding:0 22px 22px 0;max-width:820px}.questions summary:focus-visible{outline:3px solid var(--focus);outline-offset:4px;border-radius:4px}@media(max-width:850px){.guide-layout{grid-template-columns:1fr}.demo-notes h2{max-width:none}}@media(max-width:560px){.guide-banner{padding:24px;gap:16px}.guide-icon{display:none}.guide-banner h2{font-size:23px}.walkthrough,.demo-notes,.questions{padding:22px}}
</style>

