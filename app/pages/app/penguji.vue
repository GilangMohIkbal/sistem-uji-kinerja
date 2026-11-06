<script setup lang="ts">
definePageMeta({ layout: 'workspace' })
useHead({ title: 'Dashboard penguji · UKIN PPG UNJ' })
const { user, dashboard, announcements, markAnnouncementRead } = useUkin()
const selectedFilter = ref<'all' | 'pending' | 'final'>('all')
const search = ref('')
const filters = ['all', 'pending', 'final'] as const
const rows = computed(() => (dashboard.value?.rows ?? []).filter((row) => {
  const matchesState = selectedFilter.value === 'all' || (selectedFilter.value === 'final' ? row.assessmentStatus === 'final' : row.assessmentStatus !== 'final')
  return matchesState && `${row.name} ${row.subject}`.toLocaleLowerCase('id').includes(search.value.trim().toLocaleLowerCase('id'))
}))
const clearFilters = () => { selectedFilter.value = 'all'; search.value = '' }
const formatDate = (iso: string) => new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(new Date(iso))
</script>

<template>
  <div v-if="dashboard && user" class="examiner-page">
    <header class="page-heading">
      <p class="eyebrow">RUANG PENGUJI {{ user.examinerKind?.toUpperCase() }} · PPG UNJ</p>
      <h1>Selamat datang, {{ user.displayName }}<span>.</span></h1>
      <p class="muted">Tinjau setiap bukti dengan cermat, berikan umpan balik yang bermakna.</p>
    </header>

    <section class="examiner-banner" aria-labelledby="focus-title">
      <div>
        <p class="eyebrow">{{ dashboard.period.name }}</p>
        <h2 id="focus-title">Sudut pandang Anda berarti.</h2>
        <p>Penguji dosen dan guru bekerja secara independen. Anda melihat penugasan dan status pekerjaan akun Anda sendiri.</p>
      </div>
      <div class="banner-symbol" aria-hidden="true"><AppIcon name="book" /><span>BERBASIS BUKTI<br />BERMAKNA BAGI GURU</span></div>
    </section>

    <section class="metrics" aria-label="Filter ringkasan penugasan">
      <button v-for="(metric, index) in dashboard.metrics" :key="metric.label" class="metric panel" :class="{ selected: selectedFilter === filters[index] }" :aria-pressed="selectedFilter === filters[index]" @click="selectedFilter = filters[index] ?? 'all'">
        <span class="metric-top">{{ metric.label }}<AppIcon name="arrow-right" /></span>
        <strong>{{ metric.value }} <small>{{ metric.suffix }}</small></strong>
        <span class="metric-foot">Lihat daftar terkait</span>
      </button>
    </section>

    <section class="panel assignment-panel" aria-labelledby="assignment-title">
      <div class="panel-heading">
        <div><h2 id="assignment-title" class="section-heading">Penugasan Anda</h2><p class="muted">Buka paket yang ditugaskan, simpan draf pribadi, dan tinjau final Anda.</p></div>
        <span class="status-badge">{{ dashboard.assessmentOpen ? 'Periode penilaian terbuka' : 'Periode penilaian tertutup' }}</span>
      </div>
      <div class="table-toolbar">
        <div class="filter-buttons" aria-label="Status penugasan">
          <button :aria-pressed="selectedFilter === 'all'" :class="{ active: selectedFilter === 'all' }" @click="selectedFilter = 'all'">Semua</button>
          <button :aria-pressed="selectedFilter === 'pending'" :class="{ active: selectedFilter === 'pending' }" @click="selectedFilter = 'pending'">Belum final</button>
          <button :aria-pressed="selectedFilter === 'final'" :class="{ active: selectedFilter === 'final' }" @click="selectedFilter = 'final'">Final simulasi</button>
        </div>
        <label class="search-field"><span class="sr-only">Cari peserta atau bidang studi</span><input v-model="search" type="search" placeholder="Cari peserta atau bidang studi" /></label>
      </div>
      <div v-if="rows.length" class="table-scroll" tabindex="0" role="region" aria-label="Daftar penugasan simulasi, dapat digulir mendatar">
        <table>
          <thead><tr><th scope="col">Peserta</th><th scope="col">Paket bukti</th><th scope="col">Status Anda</th></tr></thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id">
              <td><strong>{{ row.name }}</strong><span>{{ row.subject }}</span><small v-if="row.attemptNumber > 1" class="retaker">Percobaan {{ row.attemptNumber }} · Retaker</small></td>
              <td><NuxtLink v-if="row.assignmentId" class="text-link" :to="{ path: '/app/penilaian', query: { id: row.assignmentId } }">Nilai paket v{{ row.evidenceVersion }} <AppIcon name="arrow-right" :size="14" /></NuxtLink><span v-else>Bukti belum tersedia</span></td>
              <td><span class="status-badge" :class="{ pending: row.assessmentStatus !== 'final' }">{{ row.status }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-state"><AppIcon name="file" /><h3>Tidak ada penugasan yang sesuai.</h3><p>Ubah kata pencarian atau tampilkan semua status.</p><UButton color="primary" variant="soft" @click="clearFilters">Tampilkan semua</UButton></div>
      <p class="table-note"><AppIcon name="shield" /> Status berasal dari assessment Anda. Contoh skenario diberi label di ruang penilaian; draf dan skor pasangan tidak ditampilkan.</p>
    </section>

    <div class="examiner-columns">
      <section class="panel components-panel" aria-labelledby="components-title">
        <p class="eyebrow">FOKUS PENILAIAN</p>
        <h2 id="components-title" class="section-heading">Tiga komponen bukti</h2>
        <ComponentOverview :components="dashboard.components" />
      </section>
      <section class="panel announcement-panel" aria-labelledby="announcement-title">
        <div class="panel-heading"><h2 id="announcement-title" class="section-heading">Informasi penguji</h2><span class="status-badge">{{ dashboard.unreadAnnouncements }} baru</span></div>
        <article v-for="announcement in announcements" :key="announcement.id" class="announcement-item">
          <p class="announcement-date">{{ formatDate(announcement.publishedAt) }} · Demo</p>
          <h3>{{ announcement.title }}</h3><p>{{ announcement.body }}</p>
          <UButton v-if="!announcement.read" color="primary" variant="soft" @click="markAnnouncementRead(announcement.id)">Tandai dibaca</UButton>
          <span v-else class="read-label"><AppIcon name="check" /> Sudah dibaca</span>
        </article>
      </section>
    </div>
  </div>
</template>

<style scoped>
.section-heading{display:block;font-size:21px;font-weight:700;line-height:1.3;margin-bottom:0}h2,h3{font-weight:700}
.page-heading{margin-bottom:0}.assignment-panel{padding:0}
.examiner-page{display:grid;gap:28px}.page-heading h1 span{color:var(--brand)}.examiner-banner{display:flex;justify-content:space-between;align-items:center;gap:35px;background:linear-gradient(120deg,var(--brand-deep),var(--brand-dark));color:white;border-radius:20px;padding:32px 36px}.examiner-banner .eyebrow{color:var(--accent);font-size:12px}.examiner-banner h2{font-size:30px;letter-spacing:-.7px;line-height:1.2;margin:17px 0 13px}.examiner-banner p:last-child{max-width:600px;color:#def2eb;line-height:1.8;font-size:14px}.banner-symbol{display:grid;justify-items:center;text-align:center;gap:15px;flex-shrink:0;border-left:1px solid #ffffff30;padding:10px 8px 10px 40px}.banner-symbol>svg{width:45px;height:45px;color:var(--accent)}.banner-symbol span{font-size:12px;line-height:1.9;letter-spacing:1.1px;font-weight:700;color:#cef0e6}.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}.metric{text-align:left;padding:23px;cursor:pointer;transition:border-color .15s,box-shadow .15s}.metric:hover{border-color:var(--brand)}.metric.selected{border-color:var(--brand);box-shadow:inset 0 3px 0 var(--brand)}.metric-top{display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:14px;color:var(--muted)}.metric-top svg{width:16px;height:16px;color:var(--brand)}.metric strong{display:block;font-size:34px;letter-spacing:-1px;font-weight:750;margin:13px 0 3px}.metric small{font-size:15px}.metric-foot{font-size:12px;color:var(--brand-dark)}.assignment-panel{overflow:hidden}.panel-heading{display:flex;justify-content:space-between;align-items:center;gap:16px}.assignment-panel>.panel-heading{padding:28px 28px 22px}.panel-heading p{font-size:14px;margin:7px 0 0;line-height:1.5}.panel-heading>.status-badge{flex-shrink:0}.table-toolbar{padding:0 28px 24px;display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap}.filter-buttons{display:flex;gap:5px;background:var(--canvas);padding:4px;border-radius:9px}.filter-buttons button{min-height:36px;padding:8px 13px;border-radius:6px;font-size:12px;font-weight:650;color:var(--muted);cursor:pointer}.filter-buttons button.active{background:white;color:var(--brand-dark);box-shadow:0 1px 4px #102d4012}.search-field{flex:1;max-width:300px;min-width:210px}.search-field input{width:100%;min-height:42px;border:1px solid var(--control-border);border-radius:8px;padding:9px 12px;font-size:12px;background:white;color:var(--ink)}.table-scroll{overflow:auto}table{border-collapse:collapse;width:100%;text-align:left;min-width:600px}thead{background:var(--canvas)}th{padding:13px 28px;font-size:12px;text-transform:uppercase;letter-spacing:.65px;font-weight:750;color:var(--muted)}td{padding:22px 28px;border-bottom:1px solid var(--line);vertical-align:middle}td strong{display:block;font-size:14px;font-weight:650}td>span:not(.status-badge){display:block;color:var(--muted);font-size:12px;margin-top:6px}td .status-badge{font-size:12px;white-space:nowrap}.status-badge.pending{color:var(--muted);background:var(--canvas)}.retaker{display:inline-block;margin-top:9px;color:var(--brand-dark);background:var(--tint);border-radius:4px;padding:3px 6px;font-size:12px}.table-note{display:flex;gap:9px;align-items:center;margin:0;padding:18px 28px;color:var(--muted);font-size:12px;line-height:1.7}.table-note svg{flex:0 0 16px;width:16px;height:16px;color:var(--brand)}.empty-state{text-align:center;padding:35px 24px 45px;border-top:1px solid var(--line)}.empty-state>svg{width:32px;height:32px;color:var(--muted);margin:0 auto 12px}.empty-state h3{font-size:17px;margin:0}.empty-state p{color:var(--muted);font-size:14px;margin:8px 0 19px}.examiner-columns{display:grid;grid-template-columns:1fr 1fr;gap:24px}.components-panel,.announcement-panel{padding:28px}.components-panel>.eyebrow{font-size:12px;margin-bottom:9px}.announcement-item{border-top:1px solid var(--line);margin-top:22px;padding-top:20px}.announcement-item h3{font-size:15px;line-height:1.5;margin:5px 0 9px}.announcement-item p{font-size:14px;color:var(--muted);line-height:1.8;margin:0}.announcement-item .announcement-date{font-size:12px}.announcement-item>button{margin-top:15px}.read-label{display:flex;align-items:center;gap:6px;color:var(--brand-dark);font-size:12px;margin-top:15px}.read-label svg{width:16px;height:16px}.metric:focus-visible,.filter-buttons button:focus-visible,.search-field input:focus-visible,.table-scroll:focus-visible{outline:3px solid var(--focus);outline-offset:3px}@media(max-width:1000px){.examiner-columns{grid-template-columns:1fr}.assignment-panel>.panel-heading{align-items:flex-start;flex-direction:column}}@media(max-width:650px){.examiner-banner{padding:27px}.examiner-banner h2{font-size:27px}.banner-symbol{display:none}.metrics{gap:10px}.metric{padding:15px 12px}.metric-top{font-size:12px}.metric-top svg{display:none}.metric strong{font-size:28px}.metric-foot{font-size:12px}.assignment-panel>.panel-heading,.components-panel,.announcement-panel{padding:22px}.table-toolbar{padding:0 22px 22px;gap:14px}.search-field{max-width:none;flex-basis:100%}.filter-buttons{flex-wrap:wrap}.filter-buttons button{font-size:12px;padding:8px 10px}.table-note{padding:16px 22px;align-items:flex-start}th,td{padding-left:22px;padding-right:22px}}@media(prefers-reduced-motion:reduce){.metric{transition:none}}
</style>


