<script setup lang="ts">
import type { AssignmentRow } from '~/domain/assessment-types'
definePageMeta({ layout: 'workspace' })
useHead({ title: 'Penugasan penguji · UKIN PPG UNJ' })
const ukin = useUkin()
const period = ref(''), subject = ref(''), status = ref(''), search = ref('')
const all = computed<AssignmentRow[]>(() => ukin.user.value?.role === 'penguji' ? ukin.listAssignments() : [])
const periods = computed(() => [...new Map(all.value.map(r => [r.periodId, r.periodName])).entries()])
const subjects = computed(() => [...new Set(all.value.map(r => r.subject))])
const rows = computed(() => all.value.filter(r => (!period.value || r.periodId === period.value) && (!subject.value || r.subject === subject.value) && (!status.value || (status.value === 'blocked' ? r.blocked : r.status === status.value)) && `${r.participant} ${r.subject}`.toLocaleLowerCase('id').includes(search.value.toLocaleLowerCase('id').trim())))
const labels = { not_started: 'Belum dimulai', draft: 'Draf pribadi', final: 'Sudah final' }
function clear() { period.value = ''; subject.value = ''; status.value = ''; search.value = '' }
</script>
<template>
  <div class="assessment-page">
    <header class="page-heading"><p class="eyebrow">PENUGASAN ANDA · PENGUJI {{ ukin.user.value?.examinerKind?.toUpperCase() }}</p><h1>Setiap bukti, satu perhatian.</h1><p class="muted">Periksa paket, tulis pengamatan, dan finalisasi penilaian Anda secara independen.</p></header>
    <section class="assessment-intro"><AppIcon name="shield" :size="34" /><div><h2>Ruang pribadi penguji</h2><p>Skor dan catatan pasangan tidak tersedia di ruang ini. Paket yang belum lengkap hanya dapat ditinjau; penilaian dibuka setelah pemeriksaan pengelola.</p></div><NuxtLink to="/app/riwayat">Riwayat saya →</NuxtLink></section>
    <section class="panel assess-filters" aria-label="Filter penugasan">
      <label class="assess-field">Cari peserta<input v-model="search" type="search" placeholder="Nama peserta" /></label>
      <label class="assess-field">Periode<select v-model="period"><option value="">Semua periode</option><option v-for="[id, name] in periods" :key="id" :value="id">{{ name }}</option></select></label>
      <label class="assess-field">Bidang studi<select v-model="subject"><option value="">Semua bidang</option><option v-for="s in subjects" :key="s">{{ s }}</option></select></label>
      <label class="assess-field">Status saya<select v-model="status"><option value="">Semua status</option><option value="not_started">Belum dimulai</option><option value="draft">Draf pribadi</option><option value="final">Sudah final</option><option value="blocked">Tertahan / terkunci</option></select></label>
    </section>
    <p class="assess-caption">{{ rows.length }} dari {{ all.length }} penugasan aktif pada akun ini.</p>
    <div class="assignment-cards">
      <article v-for="r in rows" :key="r.id" class="panel assignment-card">
        <div class="assess-card-top"><span class="status-badge" :class="{ pending: r.status !== 'final' }">{{ labels[r.status] }}{{ r.revisionDraft ? ' · revisi' : '' }}</span><span class="assess-caption">Paket v{{ r.evidenceVersion }}</span></div>
        <h2>{{ r.participant }}</h2><p>{{ r.subject }} · Percobaan {{ r.attemptNumber }}</p><p class="assess-caption">{{ r.periodName }}</p>
        <div class="assignment-detail"><span>Kelengkapan bukti</span><strong>{{ r.completeness === 'complete' ? 'Sudah diperiksa · lengkap' : r.completeness === 'needs_correction' ? 'Perlu perbaikan teknis' : 'Menunggu pemeriksaan' }}</strong></div>
        <p v-if="r.blocked" class="assess-notice">{{ r.blocker }}</p><p v-if="r.fixture" class="assess-caption">Final contoh skenario, bukan penilaian pengguna.</p>
        <NuxtLink class="assess-open" :to="{ path: '/app/penilaian', query: { id: r.id } }">{{ r.status === 'final' ? 'Buka penilaian saya' : r.blocked ? 'Tinjau penugasan' : r.status === 'draft' ? 'Lanjutkan draf' : 'Mulai penilaian' }} <AppIcon name="arrow-right" :size="18" /></NuxtLink>
      </article>
    </div>
    <div v-if="!rows.length" class="panel assess-empty"><AppIcon name="file" :size="36" /><h2>Tidak ada penugasan yang cocok.</h2><p>Ubah filter untuk melihat pekerjaan yang tersedia.</p><UButton variant="soft" @click="clear">Bersihkan filter</UButton></div>
  </div>
</template>
