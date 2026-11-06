<script setup lang="ts">
import { formatDemoTime } from '~/domain/selectors'
definePageMeta({ layout: 'workspace' })
useHead({ title: 'Progres penilaian · UKIN PPG UNJ' })
const ukin = useUkin()
const rows = computed(() => ukin.user.value?.role === 'pengelola' ? ukin.listAssessmentProgress() : [])
const reasons = ref<Record<string, string>>({}), confirmed = ref<Record<string, boolean>>({}), error = ref(''), message = ref('')
const labels = { not_started: 'Belum dimulai', draft: 'Draf pribadi', final: 'Sudah final' }
function grant(id: string, version: number) {
  error.value = ''; message.value = ''
  try { if (!confirmed.value[id]) throw new Error('Konfirmasi izin revisi diperlukan.'); ukin.grantAssessmentRevision(id, version, reasons.value[id] ?? ''); reasons.value[id] = ''; confirmed.value[id] = false; message.value = 'Izin revisi tercatat. Penguji terkait dapat membuka draf revisi beralasan; final lama tetap tersimpan.' }
  catch (e) { error.value = e instanceof Error ? e.message : 'Izin belum dapat disimpan.' }
}
</script>
<template>
  <div class="assessment-page">
    <header class="page-heading"><p class="eyebrow">PENGELOLA · PROGRES PENILAIAN</p><h1>Pantau proses, jaga independensi.</h1><p class="muted">Ringkasan berasal dari assessment masing-masing penguji. Skor, draf, dan catatan rubrik tidak ditampilkan.</p></header>
    <section class="assessment-intro"><AppIcon name="shield" :size="32" /><div><h2>{{ rows.filter(r => r.status === 'final').length }} dari {{ rows.length }} penugasan sudah final</h2><p>{{ rows.filter(r => r.status === 'draft').length }} draf · {{ rows.filter(r => r.openIssues).length }} penugasan dengan kendala terbuka. Lanjutkan melalui Monitoring, Moderasi, atau Publikasi hasil sesuai kesiapan paket.</p></div></section>
    <p v-if="error" class="assess-error" role="alert">{{ error }}</p><p v-if="message" class="assess-notice" role="status">{{ message }}</p>
    <article v-for="r in rows" :key="r.id" class="panel assessment-progress">
      <div class="assess-card-top"><div><p class="eyebrow">{{ r.kind.toUpperCase() }} · {{ r.examiner }}</p><h2>{{ r.participant }}</h2><p>{{ r.subject }} · Paket v{{ r.evidenceVersion }} · {{ r.rubricVersionId }}</p></div><span class="status-badge">{{ labels[r.status] }}{{ r.revisionDraft ? ' · Revisi' : '' }}</span></div>
      <p v-if="r.finalizedAt" class="assess-caption">Final v{{ r.finalVersion }} · {{ formatDemoTime(r.finalizedAt) }}{{ r.fixture ? ' · Contoh skenario' : '' }}</p>
      <NuxtLink v-if="r.evidenceVersionId" :to="{ path: '/app/pemeriksaan', query: { id: r.evidenceVersionId } }">Periksa paket dan kelengkapan →</NuxtLink>
      <p v-if="r.blocked" class="assess-notice">{{ r.blocker }}</p>
      <section v-for="i in r.issues" :key="i.id" class="technical-issue"><strong>{{ i.component }} · {{ i.resolvedAt ? 'Terselesaikan' : 'Kendala terbuka' }}</strong><p>{{ i.reason }}</p><small>{{ formatDemoTime(i.reportedAt) }}</small><p v-if="i.resolvedAt">{{ i.resolution }}</p></section>
      <p v-if="r.permissionPending" class="assess-notice">Izin revisi tersedia untuk final v{{ r.finalVersion }}. Menunggu penguji membuka draf revisi.</p>
      <details v-else-if="r.canAuthorizeRevision && r.finalVersion" class="revision-permission"><summary>Izinkan revisi final v{{ r.finalVersion }}</summary><p>Izin hanya berlaku pada penguji, versi final, paket, dan rubrik ini. Penguji harus memberikan alasan revisi dan meninjau ulang bukti. Ini bukan proses moderasi atau perubahan nilai oleh pengelola.</p><form @submit.prevent="grant(r.id, r.finalVersion!)"><label class="assess-field">Alasan izin revisi<textarea v-model="reasons[r.id]" rows="2" maxlength="5000" required /></label><label class="assess-check"><input v-model="confirmed[r.id]" type="checkbox" required />Saya mengizinkan penguji terkait merevisi final ini dengan riwayat versi.</label><UButton type="submit" variant="soft">Catat izin revisi</UButton></form></details>
    </article>
    <p v-if="!rows.length" class="panel assess-empty">Belum ada penugasan aktif dalam periode yang Anda kelola.</p>
  </div>
</template>
