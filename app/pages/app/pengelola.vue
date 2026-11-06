<script setup lang="ts">
import { ACTIVE_CLOCK, CLOSED_CLOCK } from '../../data/fixtures'
import { formatDemoTime } from '../../domain/selectors'

definePageMeta({ layout: 'workspace' })
useHead({ title: 'Dashboard pengelola · UKIN PPG UNJ' })

const { user, snapshot, dashboard, announcements, markAnnouncementRead, setClock } = useUkin()
type Filter = 'all' | 'complete' | 'attention'
const filter = ref<Filter>('all')
const search = ref('')
const clockMessage = ref('')
const clockError = ref(false)
const filterKeys: Filter[] = ['all', 'complete', 'attention']
const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Semua peserta' },
  { value: 'complete', label: 'Paket lengkap' },
  { value: 'attention', label: 'Perlu perhatian' },
]
const filteredRows = computed(() => (dashboard.value?.rows ?? []).filter((row) => {
  const matchesState = filter.value === 'all'
    || (filter.value === 'complete' && row.completeness === 'complete')
    || (filter.value === 'attention' && (row.completeness === 'needs_correction' || row.moderation === 'open'))
  const query = search.value.trim().toLocaleLowerCase('id-ID')
  return matchesState && (!query || `${row.name} ${row.subject}`.toLocaleLowerCase('id-ID').includes(query))
}))

function clearFilters() {
  filter.value = 'all'
  search.value = ''
}

function changeClock(scenario: 'active' | 'closed') {
  try {
    setClock(scenario)
    clockError.value = false
    clockMessage.value = scenario === 'active' ? 'Jam demo kembali ke periode aktif.' : 'Jam demo berpindah ke periode tertutup.'
  } catch (error) {
    clockError.value = true
    clockMessage.value = error instanceof Error ? error.message : 'Waktu demo belum dapat diubah.'
  }
}
</script>

<template>
  <div v-if="dashboard && user" class="manager-page">
    <header class="page-heading">
      <p class="eyebrow">RUANG PENGELOLA · PPG UNJ</p>
      <h1>Jaga setiap langkah tetap terarah<span>.</span></h1>
      <p class="muted">Selamat datang, {{ user.displayName }}. Berikut gambaran proses UKIN pada periode demo.</p>
    </header>

    <section class="period-banner" aria-labelledby="period-title">
      <div class="period-copy">
        <p class="eyebrow">PERIODE SIMULASI</p>
        <h2 id="period-title">{{ dashboard.period.name }}</h2>
        <p>Amati kesiapan paket, penugasan penguji, dan proses yang membutuhkan perhatian dari satu ringkasan.</p>
        <div class="period-states">
          <span><span class="state-dot" :class="{ closed: !dashboard.collectionOpen }"></span>Pengumpulan {{ dashboard.collectionOpen ? 'terbuka' : 'tertutup' }}</span>
          <span><span class="state-dot" :class="{ closed: !dashboard.assessmentOpen }"></span>Penilaian {{ dashboard.assessmentOpen ? 'terbuka' : 'tertutup' }}</span>
        </div>
      </div>
      <div class="period-emblem" aria-hidden="true"><AppIcon name="users" /><span>RUANG UNTUK<br>BERPROSES</span></div>
    </section>

    <section class="metrics" aria-label="Ringkasan peserta, pilih untuk menyaring daftar">
      <button v-for="(metric, index) in dashboard.metrics" :key="metric.label" type="button" class="metric" :class="{ selected: filter === filterKeys[index] }" :aria-pressed="filter === filterKeys[index]" aria-controls="participant-list" @click="filter = filterKeys[index] ?? 'all'; search = ''">
        <span class="metric-top"><span>{{ metric.label }}</span><AppIcon :name="index === 0 ? 'users' : index === 1 ? 'check' : 'help'" /></span>
        <strong>{{ metric.value }}<small>{{ metric.suffix }}</small></strong>
        <span class="metric-link">Lihat daftar <AppIcon name="arrow-right" /></span>
      </button>
    </section>

    <section id="participant-list" class="panel participants" aria-labelledby="participants-title">
      <div class="panel-heading">
        <div><p class="eyebrow">MONITORING AWAL</p><h2 id="participants-title" class="section-heading">Perjalanan peserta</h2></div>
        <span class="status-badge">Data simulasi</span>
      </div>
      <p class="intro muted">Ringkasan mengikuti paket pada periode demo. Buka antrean kelengkapan untuk memeriksa bukti yang telah dikirim peserta.</p>
      <UButton to="/app/pemeriksaan" class="mb-5">Periksa paket terkirim <AppIcon name="arrow-right" /></UButton>
      <div class="list-toolbar">
        <div class="filter-buttons" aria-label="Filter status paket">
          <button v-for="item in filters" :key="item.value" type="button" :class="{ active: filter === item.value }" :aria-pressed="filter === item.value" @click="filter = item.value">{{ item.label }}</button>
        </div>
        <div class="search-field"><label for="participant-search">Cari peserta</label><input id="participant-search" v-model="search" type="search" placeholder="Nama atau bidang studi" autocomplete="off"></div>
      </div>
      <p class="list-count" aria-live="polite">{{ filteredRows.length }} dari {{ dashboard.rows.length }} peserta ditampilkan</p>
      <div v-if="filteredRows.length" class="table-scroll" tabindex="0" role="region" aria-label="Daftar peserta simulasi, dapat digulir horizontal">
        <table>
          <caption class="sr-only">Ringkasan paket peserta UKIN fiktif pada periode aktif</caption>
          <thead><tr><th scope="col">Peserta / bidang studi</th><th scope="col">Percobaan</th><th scope="col">Versi paket</th><th scope="col">Status proses</th></tr></thead>
          <tbody><tr v-for="row in filteredRows" :key="row.id">
            <td><span class="participant-name">{{ row.name }}</span><span class="subject">{{ row.subject }}</span></td>
            <td><span class="attempt-label">Ke-{{ row.attemptNumber }}</span><span v-if="row.attemptNumber > 1" class="retaker-label">Retaker</span></td>
            <td><NuxtLink v-if="row.evidenceVersionId" class="text-link" :to="{ path: '/app/pemeriksaan', query: { id: row.evidenceVersionId } }">Versi {{ row.evidenceVersion }} <AppIcon name="arrow-right" :size="14" /></NuxtLink><span v-else>Belum dikirim</span></td>
            <td><span class="process-badge" :class="{ attention: row.completeness === 'needs_correction' || row.moderation === 'open', draft: row.evidenceVersion === null }">{{ row.status }}</span></td>
          </tr></tbody>
        </table>
      </div>
      <div v-else class="empty-state"><AppIcon name="users" /><h3>Belum ada peserta yang cocok.</h3><p>Ubah nama pencarian atau tampilkan kembali seluruh peserta.</p><UButton color="primary" variant="soft" @click="clearFilters">Hapus filter</UButton></div>
      <p class="table-note"><AppIcon name="help" /> Kelengkapan adalah status administratif. Tidak ada keputusan lulus atau tidak lulus pada demo ini.</p>
    </section>

    <div class="manager-columns">
      <section class="panel clock-panel" aria-labelledby="clock-title">
        <div class="aside-heading"><span class="small-icon"><AppIcon name="clock" /></span><span class="eyebrow">KONTROL SIMULASI</span></div>
        <h2 id="clock-title" class="section-heading">Jelajahi dua keadaan periode.</h2>
        <p>Ubah waktu contoh untuk melihat status periode pada semua akun. Jam perangkat Anda tetap sama.</p>
        <div class="current-clock"><span>WAKTU DEMO SAAT INI</span><strong>{{ formatDemoTime(snapshot.data.clockNow) }}</strong></div>
        <div class="clock-buttons">
          <UButton color="primary" :variant="snapshot.data.clockNow === ACTIVE_CLOCK ? 'solid' : 'outline'" :aria-pressed="snapshot.data.clockNow === ACTIVE_CLOCK" @click="changeClock('active')">Periode aktif</UButton>
          <UButton color="primary" :variant="snapshot.data.clockNow === CLOSED_CLOCK ? 'solid' : 'outline'" :aria-pressed="snapshot.data.clockNow === CLOSED_CLOCK" @click="changeClock('closed')">Periode tertutup</UButton>
        </div>
        <p class="clock-feedback" :class="{ error: clockError }" role="status">{{ clockMessage }}</p>
      </section>
      <section class="panel role-panel" aria-labelledby="role-title">
        <AppIcon name="shield" />
        <h2 id="role-title">Dukung proses yang tertib.</h2>
        <p>Pengelola mendampingi kelengkapan dan alur penilaian. Penguji dosen dan guru tetap memiliki penilaian masing-masing.</p>
        <p>Tiga komponen yang ditinjau: perangkat pembelajaran, video praktik, dan studi kasus.</p>
        <NuxtLink class="text-link guide-link" to="/app/panduan">Baca panduan demo <AppIcon name="arrow-right" /></NuxtLink>
      </section>
    </div>

    <section class="panel announcements" aria-labelledby="announcements-title">
      <div class="panel-heading"><h2 id="announcements-title" class="section-heading">Informasi pengelola</h2><span class="status-badge">{{ dashboard.unreadAnnouncements }} belum dibaca</span></div>
      <article v-for="announcement in announcements" :key="announcement.id" class="announcement-row">
        <div><h3>{{ announcement.title }}</h3><p>{{ announcement.body }}</p></div>
        <UButton v-if="!announcement.read" color="primary" variant="soft" @click="markAnnouncementRead(announcement.id)">Tandai dibaca</UButton>
        <span v-else class="read-label"><AppIcon name="check" /> Sudah dibaca</span>
      </article>
    </section>
  </div>
</template>

<style scoped>
.page-heading{margin-bottom:0}.section-heading{display:block;font-size:21px;font-weight:700;margin-bottom:0}.period-copy h2,.role-panel h2,.announcement-row h3,.empty-state h3{font-weight:700}
.manager-page{display:grid;gap:28px}.page-heading h1{max-width:760px}.page-heading h1 span{color:var(--brand)}.period-banner{display:flex;align-items:center;justify-content:space-between;gap:35px;padding:32px 36px;border-radius:20px;background:linear-gradient(115deg,var(--brand-deep),var(--brand-dark));color:white;overflow:hidden}.period-copy{max-width:680px}.period-copy .eyebrow{color:var(--accent)}.period-copy h2{font-size:28px;letter-spacing:-.6px;line-height:1.2;margin:14px 0}.period-copy>p:last-of-type{font-size:14px;line-height:1.8;color:#dcefe9}.period-states{display:flex;flex-wrap:wrap;gap:12px 24px;margin-top:23px}.period-states>span{display:flex;align-items:center;gap:7px;font-size:12px;color:#e9f6f0}.state-dot{width:6px;height:6px;border-radius:50%;background:var(--accent)}.state-dot.closed{background:#f5ca8c}.period-emblem{flex:0 0 145px;display:flex;flex-direction:column;align-items:center;gap:16px;padding:28px 16px;border:1px solid #ffffff20;border-radius:70px;color:#a5ead8}.period-emblem svg{width:44px;height:44px}.period-emblem span{text-align:center;line-height:1.6;letter-spacing:1.3px;font-size:12px;font-weight:700}.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}.metric{text-align:left;background:white;border:1px solid var(--line);padding:23px;border-radius:14px;cursor:pointer;transition:border-color .16s,background .16s}.metric:hover,.metric.selected{border-color:var(--brand);background:#f8fdfb}.metric-top{display:flex;align-items:center;justify-content:space-between;gap:12px;color:var(--muted);font-size:14px}.metric-top svg{width:19px;height:19px;color:var(--brand)}.metric strong{display:block;font-size:35px;line-height:1.3;letter-spacing:-1px;margin:13px 0 16px}.metric strong small{font-size:16px}.metric-link{display:flex;align-items:center;gap:9px;font-size:12px;font-weight:650;color:var(--brand)}.metric-link svg{width:14px;height:14px}.participants,.announcements{padding:28px}.panel-heading{display:flex;justify-content:space-between;align-items:center;gap:18px}.panel-heading .eyebrow{font-size:12px;margin-bottom:7px}.panel-heading .status-badge{flex-shrink:0}.intro{font-size:14px;line-height:1.8;margin:16px 0 24px;max-width:780px}.list-toolbar{display:flex;justify-content:space-between;align-items:end;gap:20px;flex-wrap:wrap}.filter-buttons{display:flex;gap:5px;flex-wrap:wrap;padding:4px;background:var(--canvas);border-radius:9px}.filter-buttons button{font-size:12px;font-weight:650;color:var(--muted);padding:10px 12px;border-radius:6px;cursor:pointer}.filter-buttons button.active{color:var(--brand-dark);background:white;box-shadow:0 2px 5px #142b400a}.search-field{display:grid;gap:6px;min-width:220px}.search-field label{font-size:12px;font-weight:650}.search-field input{border:1px solid var(--control-border);border-radius:8px;padding:11px 12px;font-size:12px;background:white;min-height:42px;color:var(--ink)}.search-field input::placeholder{color:var(--muted)}.list-count{color:var(--muted);font-size:12px;margin:21px 0 12px}.table-scroll{overflow:auto;border-top:1px solid var(--line)}table{width:100%;border-collapse:collapse;text-align:left;min-width:690px}th{font-size:12px;letter-spacing:.4px;color:var(--muted);font-weight:700;background:var(--canvas);padding:13px 14px}td{font-size:12px;padding:18px 14px;border-bottom:1px solid var(--line)}th:first-child,td:first-child{padding-left:13px}tbody tr:last-child td{border-bottom:0}.participant-name{display:block;font-size:14px;font-weight:700}.subject{display:block;font-size:12px;color:var(--muted);margin-top:5px;line-height:1.6}.attempt-label{display:block}.retaker-label{display:inline-block;background:var(--canvas);color:var(--muted);border:1px solid var(--line);padding:3px 5px;border-radius:4px;font-size:12px;margin-top:5px}.process-badge{display:inline-block;font-size:12px;font-weight:650;padding:6px 9px;border-radius:6px;background:var(--tint);color:var(--brand-dark);white-space:nowrap}.process-badge.attention{background:#fff3e6;color:var(--warning)}.process-badge.draft{background:var(--canvas);color:var(--muted)}.table-note{display:flex;align-items:flex-start;gap:8px;font-size:12px;line-height:1.7;color:var(--muted);padding-top:18px;margin-top:14px;border-top:1px solid var(--line)}.table-note svg{flex:0 0 15px;width:15px;height:15px;margin-top:2px}.empty-state{text-align:center;padding:40px 20px;border-top:1px solid var(--line)}.empty-state>svg{width:30px;height:30px;color:var(--brand);margin:auto}.empty-state h3{font-size:16px;margin:15px 0 8px}.empty-state p{font-size:14px;color:var(--muted);margin-bottom:20px}.manager-columns{display:grid;grid-template-columns:1.4fr 1fr;gap:24px}.clock-panel,.role-panel{padding:28px}.aside-heading{display:flex;align-items:center;gap:10px;margin-bottom:17px}.aside-heading .eyebrow{font-size:12px}.small-icon{display:grid;place-items:center;width:34px;height:34px;background:var(--tint);color:var(--brand);border-radius:9px}.small-icon svg{width:19px;height:19px}.clock-panel>p,.role-panel>p{font-size:14px;color:var(--muted);line-height:1.8;margin-top:13px}.current-clock{padding:17px 18px;margin:22px 0 18px;background:var(--canvas);border-left:3px solid var(--brand);border-radius:0 8px 8px 0}.current-clock span{display:block;font-size:12px;letter-spacing:1px;color:var(--muted);font-weight:650}.current-clock strong{display:block;margin-top:8px;font-size:15px}.clock-buttons{display:flex;flex-wrap:wrap;gap:10px}.clock-panel .clock-feedback{color:var(--brand-dark);font-size:12px;min-height:20px;margin:12px 0 0}.clock-panel .clock-feedback.error{color:var(--danger)}.role-panel{background:var(--tint);border-color:#c4e5db}.role-panel>svg{width:27px;height:27px;color:var(--brand);margin-bottom:20px}.role-panel h2{font-size:23px;line-height:1.3;margin:0;letter-spacing:-.4px}.guide-link{display:inline-flex;align-items:center;gap:12px;margin-top:22px;font-size:12px;font-weight:700}.guide-link svg{width:16px;height:16px}.announcement-row{display:flex;justify-content:space-between;align-items:center;gap:28px;border-top:1px solid var(--line);padding-top:22px;margin-top:22px}.announcement-row>div{max-width:750px}.announcement-row h3{font-size:15px;margin:0 0 9px}.announcement-row p{font-size:12px;line-height:1.8;color:var(--muted);margin:0}.announcement-row>button{flex-shrink:0}.read-label{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--brand-dark);white-space:nowrap}.read-label svg{width:15px;height:15px}.metric:focus-visible,.filter-buttons button:focus-visible,.search-field input:focus-visible,.table-scroll:focus-visible{outline:3px solid var(--focus);outline-offset:3px}@media(max-width:1000px){.manager-columns{grid-template-columns:1fr}.period-emblem{display:none}}@media(max-width:650px){.period-banner{padding:26px}.period-copy h2{font-size:24px}.metrics{gap:10px}.metric{padding:15px 12px}.metric-top{font-size:12px}.metric-top svg{display:none}.metric strong{font-size:29px;margin:13px 0}.metric-link{font-size:12px;gap:5px}.participants,.announcements,.clock-panel,.role-panel{padding:22px}.panel-heading{align-items:flex-start;flex-wrap:wrap}.list-toolbar{align-items:stretch}.search-field{width:100%}.filter-buttons{width:100%}.filter-buttons button{flex:1;font-size:12px;padding:9px 6px}.announcement-row{flex-direction:column;align-items:flex-start;gap:16px}.period-states{gap:10px 18px}}@media(prefers-reduced-motion:reduce){.metric{transition:none}}
</style>

