<script setup lang="ts">
import { formatDemoTime } from '~/domain/selectors'
import type { EvidenceView, SubmittedPackageRow } from '~/domain/types'

definePageMeta({ layout: 'workspace' })
useHead({ title: 'Bukti paket · UKIN PPG UNJ' })
const ukin = useUkin()
const route = useRoute()
const selectedId = computed(() => typeof route.query.id === 'string' ? route.query.id : '')
const search = ref('')
const page = computed((): { rows: SubmittedPackageRow[]; detail: EvidenceView | null; error: string } => {
  void ukin.snapshot.value
  void ukin.user.value
  try {
    return { rows: ukin.listSubmittedPackages(), detail: selectedId.value ? ukin.getEvidence(selectedId.value) : null, error: '' }
  } catch (error) { return { rows: [], detail: null, error: error instanceof Error ? error.message : 'Bukti belum dapat dibuka.' } }
})
const rows = computed(() => page.value.rows.filter(row => `${row.participantName} ${row.subject}`.toLocaleLowerCase('id-ID').includes(search.value.trim().toLocaleLowerCase('id-ID'))))
const statusLabels = { pending: 'Menunggu pemeriksaan', complete: 'Lengkap secara teknis', needs_correction: 'Perlu perbaikan' }
</script>

<template>
  <div class="evidence-page">
    <section v-if="page.error" class="panel unavailable"><AppIcon name="shield" /><h1>Bukti tidak tersedia</h1><p>{{ page.error }}</p><UButton to="/app/bukti">Lihat bukti yang tersedia</UButton><NuxtLink :to="ukin.home.value" class="text-link">Kembali ke ringkasan</NuxtLink></section>
    <template v-else-if="!page.detail">
      <header class="page-heading"><p class="eyebrow">BUKTI KINERJA · BACA SAJA</p><h1>Kenali bukti di balik praktik<span>.</span></h1><p>{{ ukin.user.value?.role === 'penguji' ? 'Paket berikut tersedia sesuai penugasan aktif Anda. Draf peserta dan skor pasangan tidak ditampilkan.' : 'Buka snapshot paket yang sudah dikirim sesuai akses akun demo Anda.' }}</p></header>
      <div class="notice">Ruang ini menampilkan snapshot bukti. Penguji mengisi rubrik melalui Penugasan saya.</div>
      <section class="panel assigned-panel" aria-labelledby="assigned-title"><div class="list-heading"><h2 id="assigned-title">Paket yang dapat dibuka</h2><label><span class="sr-only">Cari peserta atau bidang studi</span><input v-model="search" type="search" placeholder="Cari peserta atau bidang studi"></label></div><p class="count" aria-live="polite">{{ rows.length }} paket ditampilkan</p><div v-if="rows.length" class="package-list"><NuxtLink v-for="row in rows" :key="row.id" :to="{ path: '/app/bukti', query: { id: row.id } }" class="package-row"><span class="row-icon"><AppIcon name="file" /></span><div><h3>{{ row.participantName }}</h3><p>{{ row.subject }}</p><small>Versi {{ row.version }} · Percobaan {{ row.attemptNumber }} <span v-if="row.attemptNumber > 1">· Retaker</span></small><small v-if="row.fixture" class="fixture-note">Bukti contoh bawaan</small></div><span class="status-badge" :class="row.completeness">{{ statusLabels[row.completeness] }}</span><AppIcon name="arrow-right" /></NuxtLink></div><div v-else class="empty-state"><AppIcon name="file" /><h3>{{ search ? 'Paket tidak ditemukan.' : 'Belum ada bukti yang tersedia.' }}</h3><p>{{ search ? 'Coba kata pencarian yang lain.' : 'Paket muncul setelah tersedia versi final yang dapat diakses oleh akun ini.' }}</p><UButton v-if="search" variant="soft" @click="search = ''">Hapus pencarian</UButton></div></section>
    </template>
    <template v-else>
      <NuxtLink to="/app/bukti" class="text-link back-link"><AppIcon name="arrow-left" :size="17" /> Semua bukti yang tersedia</NuxtLink>
      <header class="page-heading"><p class="eyebrow">SNAPSHOT PAKET · VERSI {{ page.detail.version.version }}</p><h1>{{ page.detail.participant.displayName }}</h1><p>{{ page.detail.attempt.subject }} · Percobaan {{ page.detail.attempt.attemptNumber }}</p></header>
      <section class="identity-band"><div><span>Periode</span><strong>{{ page.detail.period.name }}</strong></div><div><span>Nomor bukti pengiriman</span><strong>{{ page.detail.version.receipt }}</strong><small>{{ formatDemoTime(page.detail.version.submittedAt) }}</small></div><div><span>Akses Anda</span><strong>Baca bukti final</strong><small>Isi snapshot tidak dapat diubah dari halaman ini.</small></div></section>
      <p v-if="page.detail.version.fixture" class="notice">Bukti fiktif bawaan untuk demonstrasi. Video contoh merupakan contoh integrasi, bukan rekaman praktik mengajar peserta nyata.</p>
      <p v-if="!page.detail.isCurrent" class="notice archive-notice">Versi ini merupakan arsip. Isi dan nomor pengirimannya tetap dipertahankan.</p>
      <EvidenceReadView :content="page.detail.version.content" />
      <p class="read-note"><AppIcon name="shield" /> Tampilan ini tidak menyediakan skor, draf penguji, atau penilaian pasangan.</p>
    </template>
  </div>
</template>

<style scoped>
.evidence-page{display:grid;gap:24px;max-width:1100px}.page-heading{margin-bottom:0}.page-heading h1 span{color:var(--brand)}.assigned-panel{padding:28px}.list-heading{display:flex;justify-content:space-between;align-items:center;gap:22px}.list-heading h2{font-size:22px;font-weight:750}.list-heading label{max-width:330px;width:100%}.list-heading input{border:1px solid var(--control-border);border-radius:8px;min-height:44px;padding:10px 13px;width:100%;font-size:13px}.count{color:var(--muted);font-size:12px;margin:22px 0 8px}.package-list{display:grid}.package-row{display:flex;align-items:center;gap:18px;padding:24px 0;border-top:1px solid var(--line);color:var(--ink)}.row-icon{height:44px;width:44px;display:grid;place-items:center;border-radius:12px;flex:0 0 44px;background:var(--tint);color:var(--brand)}.package-row>div{flex:1;min-width:0}.package-row h3{font-size:16px;font-weight:700;line-height:1.5}.package-row p{font-size:14px;color:var(--muted);line-height:1.8;margin:4px 0}.package-row small{font-size:12px;color:var(--muted);display:block;line-height:1.7}.package-row .fixture-note{color:var(--brand-dark);margin-top:4px}.package-row>svg{color:var(--brand)}.package-row:hover h3{text-decoration:underline;text-underline-offset:4px}.status-badge.pending{background:var(--canvas);color:var(--muted)}.status-badge.needs_correction{background:#fff1e1;color:var(--warning)}.empty-state{text-align:center;padding:45px 20px}.empty-state>svg{width:32px;height:32px;color:var(--brand);margin:auto}.empty-state h3{font-size:20px;font-weight:700;margin:17px 0 10px}.empty-state p{font-size:14px;color:var(--muted);margin:10px 0 20px;line-height:1.8}.back-link{font-size:13px;justify-self:start}.identity-band{display:grid;grid-template-columns:1.2fr 1.2fr 1fr;gap:24px;padding:25px 28px;background:var(--brand-deep);color:white;border-radius:16px}.identity-band>div{display:grid;gap:7px;align-content:start}.identity-band span{font-size:12px;color:#bfe5da}.identity-band strong{font-size:14px;line-height:1.7;overflow-wrap:anywhere}.identity-band small{font-size:12px;line-height:1.7;color:#d0e7e0}.read-note{display:flex;align-items:flex-start;gap:9px;font-size:13px;line-height:1.8;color:var(--muted)}.read-note svg{flex-basis:17px;margin-top:3px}.archive-notice{background:#fff7eb;border-color:#e5cda7;color:var(--warning)}.unavailable{display:grid;gap:18px;justify-items:start;padding:40px}.unavailable>svg{width:34px;height:34px;color:var(--brand)}.unavailable h1{font-size:30px;font-weight:750}.unavailable p{font-size:15px;color:var(--muted)}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}@media(max-width:900px){.identity-band{grid-template-columns:1fr 1fr}.identity-band>div:first-child{grid-column:1/-1}.package-row{flex-wrap:wrap}.package-row .status-badge{margin-left:62px}.package-row>div{flex-basis:calc(100% - 110px)}.package-row>svg{margin-left:auto}}@media(max-width:600px){.assigned-panel{padding:21px}.list-heading{align-items:stretch;flex-direction:column;gap:18px}.list-heading label{max-width:none}.package-row{gap:12px}.row-icon{height:38px;width:38px;flex-basis:38px}.package-row>svg{width:17px}.package-row h3{font-size:15px}.package-row p{font-size:13px}.identity-band{grid-template-columns:1fr;padding:23px;gap:22px}.identity-band>div:first-child{grid-column:auto}.unavailable{padding:25px}}
</style>
