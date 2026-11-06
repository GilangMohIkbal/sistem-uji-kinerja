<script setup lang="ts">
definePageMeta({ layout: 'workspace' })
useHead({ title: 'Dashboard peserta · UKIN PPG UNJ' })
const { user, dashboard, announcements, markAnnouncementRead } = useUkin()
const formatDate = (iso: string) => new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(new Date(iso))
const formatTime = (iso: string) => new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).format(new Date(iso))
</script>

<template>
  <div v-if="dashboard && user" class="participant-page">
    <header class="page-heading">
      <p class="eyebrow">RUANG PESERTA · PPG UNJ</p>
      <h1>Selamat datang, {{ user.displayName.split(' ')[0] }}<span>.</span></h1>
      <p class="muted">Setiap praktik baik dimulai dari persiapan yang bermakna.</p>
    </header>

    <section class="welcome-panel" aria-labelledby="welcome-title">
      <div class="welcome-copy">
        <p class="eyebrow">{{ dashboard.period.name }}</p>
        <h2 id="welcome-title">Ceritakan praktik baik Anda.</h2>
        <p>Perangkat, video, dan refleksi menjadi satu cerita tentang perjalanan Anda sebagai pendidik.</p>
        <NuxtLink class="hero-link" to="/app/paket">Buka paket UKIN <AppIcon name="arrow-right" /></NuxtLink>
      </div>
      <div class="journey-art" aria-hidden="true">
        <span class="art-ring"></span>
        <div class="art-sheet back"><AppIcon name="video" /></div>
        <div class="art-sheet front"><AppIcon name="book" /><i></i><i></i><b><AppIcon name="check" /></b></div>
        <span class="art-caption">PERSIAPKAN · PRAKTIKKAN · REFLEKSIKAN</span>
      </div>
    </section>

    <section class="metrics" aria-label="Ringkasan paket simulasi">
      <div v-for="metric in dashboard.metrics" :key="metric.label" class="metric">
        <div class="metric-number">{{ metric.value }} <small>{{ metric.suffix }}</small></div>
        <span>{{ metric.label }}</span>
      </div>
    </section>

    <div class="participant-columns">
      <section class="panel package-panel" aria-labelledby="package-title">
        <div class="panel-heading"><div><p class="eyebrow">PERSIAPAN ANDA</p><h2 id="package-title" class="section-heading">Tiga komponen, satu paket.</h2></div><span class="status-badge">Paket Anda</span></div>
        <p class="intro muted">{{ dashboard.participantStatus }}. Buka paket untuk melengkapi bukti, menyimpan draf, atau meninjau pengiriman.</p>
        <ComponentOverview :components="dashboard.components" show-prepared />
        <p class="preview-note"><AppIcon name="help" /> Ringkasan mengikuti bukti tersimpan. File perangkat bersifat sementara; dokumen contoh tetap tersedia setelah refresh.</p>
      </section>

      <aside class="participant-aside">
        <section class="panel period-panel" aria-labelledby="period-title">
          <div class="aside-title"><h2 id="period-title">Waktu pengumpulan</h2><AppIcon name="calendar" /></div>
          <p class="deadline">{{ formatDate(dashboard.period.collectionClosesAt) }}</p>
          <p class="muted">Pukul {{ formatTime(dashboard.period.collectionClosesAt) }} WIB · jadwal simulasi</p>
          <span class="status-badge" :class="{ closed: !dashboard.collectionOpen }">{{ dashboard.collectionOpen ? 'Periode demo terbuka' : 'Periode demo tertutup' }}</span>
          <div class="period-footnote">Waktu dihitung menggunakan jam demo yang tertera di ruang kerja.</div>
        </section>
        <section class="panel result-panel" aria-labelledby="result-title">
          <span class="result-icon"><AppIcon name="shield" /></span>
          <h2 id="result-title">{{ dashboard.publishedFeedback ? 'Umpan balik Anda' : 'Hasil belum dipublikasikan' }}</h2>
          <p>{{ dashboard.publishedFeedback || 'Umpan balik muncul di sini setelah sengaja diterbitkan oleh pengelola. Status kelengkapan bukan keputusan kelulusan.' }}</p>
        </section>
      </aside>
    </div>

    <section class="panel announcement-panel" aria-labelledby="announcement-title">
      <div class="panel-heading"><h2 id="announcement-title" class="section-heading">Informasi untuk Anda</h2><span class="status-badge">{{ dashboard.unreadAnnouncements }} belum dibaca</span></div>
      <article v-for="announcement in announcements" :key="announcement.id" class="announcement-row">
        <div><p class="announcement-date">{{ formatDate(announcement.publishedAt) }} · Informasi demo</p><h3>{{ announcement.title }}</h3><p>{{ announcement.body }}</p></div>
        <UButton v-if="!announcement.read" color="primary" variant="soft" @click="markAnnouncementRead(announcement.id)">Tandai dibaca</UButton>
        <span v-else class="read-label"><AppIcon name="check" /> Sudah dibaca</span>
      </article>
    </section>
  </div>
</template>

<style scoped>
.section-heading{display:block;font-size:21px;font-weight:700;line-height:1.3;margin-bottom:0}h2,h3{font-weight:700}
.page-heading{margin-bottom:0}
.participant-page{display:grid;gap:28px}.page-heading h1 span{color:var(--brand)}.welcome-panel{position:relative;overflow:hidden;display:grid;grid-template-columns:1.4fr 1fr;align-items:center;min-height:260px;border-radius:20px;background:linear-gradient(118deg,var(--brand-deep),var(--brand));color:white;padding:34px 38px;gap:25px}.welcome-copy{position:relative;z-index:1}.welcome-copy .eyebrow{color:var(--accent);font-size:12px}.welcome-copy h2{font-size:32px;letter-spacing:-.8px;line-height:1.18;margin:18px 0 14px;max-width:410px}.welcome-copy>p:last-of-type{color:#e0f3ee;font-size:15px;line-height:1.8;max-width:430px}.hero-link{display:inline-flex;align-items:center;gap:18px;margin-top:24px;padding:12px 17px;border-radius:9px;background:white;color:var(--brand-dark);font-size:14px;font-weight:750}.hero-link svg{width:17px;height:17px}.journey-art{position:relative;height:215px;min-width:220px}.art-ring{position:absolute;width:210px;height:210px;border:1px solid #ffffff25;border-radius:50%;left:50%;top:44%;transform:translate(-50%,-50%)}.art-ring:after{content:'';position:absolute;inset:-30px;border:1px solid #ffffff12;border-radius:50%}.art-sheet{position:absolute;width:115px;height:145px;border-radius:12px;box-shadow:0 15px 35px #002f3730}.art-sheet.back{background:#99e6d3;right:12%;top:13%;transform:rotate(14deg);color:var(--brand-dark);display:grid;place-items:center}.art-sheet.back svg{width:38px;height:38px}.art-sheet.front{background:white;left:18%;top:8%;transform:rotate(-10deg);padding:20px;color:var(--brand)}.art-sheet.front>svg{width:32px;height:32px;margin-bottom:12px}.art-sheet.front i{display:block;height:5px;margin-top:7px;background:#c4dcd6;border-radius:3px}.art-sheet.front i:last-of-type{width:70%}.art-sheet.front b{position:absolute;bottom:-10px;right:-14px;display:grid;place-items:center;background:var(--accent);border:4px solid var(--brand-dark);width:45px;height:45px;border-radius:50%}.art-sheet.front b svg{width:21px;height:21px}.art-caption{position:absolute;bottom:0;left:0;right:0;text-align:center;font-size:12px;letter-spacing:1px;font-weight:700;color:#d7f5eb}.metrics{display:grid;grid-template-columns:repeat(3,1fr);border-bottom:1px solid var(--line);padding-bottom:26px}.metric{padding:0 28px;border-right:1px solid var(--line)}.metric:first-child{padding-left:0}.metric:last-child{border:0}.metric-number{font-size:30px;letter-spacing:-1px;font-weight:750;line-height:1.3}.metric-number small{font-size:17px;font-weight:500;color:var(--muted)}.metric>span{font-size:14px;color:var(--muted)}.participant-columns{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(260px,1fr);gap:25px}.package-panel,.announcement-panel{padding:28px}.panel-heading{display:flex;gap:16px;justify-content:space-between;align-items:center}.panel-heading .eyebrow{font-size:12px;margin-bottom:7px}.panel-heading .status-badge{flex-shrink:0}.intro{font-size:14px;line-height:1.7;margin-top:16px}.preview-note{display:flex;gap:9px;align-items:flex-start;padding-top:22px;margin-top:24px;border-top:1px solid var(--line);color:var(--muted);font-size:12px;line-height:1.7}.preview-note svg{flex:0 0 16px;width:16px;height:16px;margin-top:2px}.participant-aside{display:grid;align-content:start;gap:24px}.period-panel,.result-panel{padding:25px}.aside-title{display:flex;justify-content:space-between;gap:15px;align-items:center}.aside-title h2,.result-panel h2{font-size:17px;line-height:1.4;margin:0}.aside-title svg{width:21px;height:21px;color:var(--brand)}.deadline{font-size:22px;letter-spacing:-.5px;font-weight:750;margin:26px 0 6px}.period-panel>.muted{font-size:12px}.period-panel .status-badge{margin-top:16px}.status-badge.closed{color:var(--warning);background:#fff2e6}.period-footnote{border-top:1px solid var(--line);margin-top:22px;padding-top:17px;font-size:12px;line-height:1.7;color:var(--muted)}.result-panel{background:var(--tint);border-color:#c7e7dc}.result-icon{display:block;color:var(--brand);margin-bottom:16px}.result-icon svg{width:25px;height:25px}.result-panel p{font-size:14px;line-height:1.8;color:var(--muted);margin:12px 0 0}.announcement-row{display:flex;justify-content:space-between;align-items:center;gap:30px;border-top:1px solid var(--line);padding-top:24px;margin-top:22px}.announcement-row>div{max-width:760px}.announcement-row h3{font-size:16px;margin:6px 0 9px}.announcement-row p{font-size:14px;color:var(--muted);line-height:1.8;margin:0}.announcement-row .announcement-date{font-size:12px}.announcement-row>button{flex-shrink:0}.read-label{display:flex;gap:6px;align-items:center;color:var(--brand-dark);font-size:12px;white-space:nowrap}.read-label svg{width:16px;height:16px}@media(max-width:1000px){.participant-columns{grid-template-columns:1fr}.participant-aside{grid-template-columns:1fr 1fr}}@media(max-width:650px){.welcome-panel{grid-template-columns:1fr;padding:28px}.welcome-copy h2{font-size:29px}.journey-art{display:none}.participant-aside{grid-template-columns:1fr}.metric{padding:0 12px}.metric-number{font-size:25px}.metric>span{font-size:12px}.package-panel,.announcement-panel{padding:22px}.panel-heading{align-items:flex-start}.announcement-row{flex-direction:column;align-items:flex-start;gap:16px}}
</style>

