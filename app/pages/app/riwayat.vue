<script setup lang="ts">
import { assessmentSummary, formatTimestamp } from '~/domain/assessment'
import { formatDemoTime } from '~/domain/selectors'
definePageMeta({ layout: 'workspace' })
useHead({ title: 'Riwayat penilaian saya · UKIN PPG UNJ' })
const ukin = useUkin()
const records = computed(() => ukin.user.value?.role === 'penguji' ? ukin.getAssessmentHistory() : [])
</script>
<template>
  <div class="assessment-page">
    <header class="page-heading"><p class="eyebrow">JEJAK PENILAIAN PRIBADI</p><h1>Keputusan yang tercatat.</h1><p class="muted">Final dan revisi Anda disimpan sebagai versi terpisah. Riwayat pasangan tidak ditampilkan.</p></header>
    <NuxtLink to="/app/penugasan" class="assess-back">← Ke penugasan aktif</NuxtLink>
    <article v-for="r in records" :key="r.id" class="panel assessment-history">
      <div class="assess-card-top"><div><h2>{{ r.participant }}</h2><p>{{ r.subject }} · Percobaan {{ r.attemptNumber }} · Paket v{{ r.evidenceVersion }} · {{ r.rubricVersionId }}</p></div><NuxtLink :to="{ path: '/app/penilaian', query: { id: r.id } }">Buka ruang bukti →</NuxtLink></div>
      <p v-if="r.blocked" class="assess-notice">{{ r.blocker }}</p>
      <details v-for="f in [...r.assessment.finals].reverse()" :key="f.id" class="history-version">
        <summary><strong>Final v{{ f.version }}{{ f.fixture ? ' · Contoh skenario' : '' }}</strong><span>{{ formatDemoTime(f.finalizedAt) }}</span></summary>
        <div class="history-version-body"><p>Aktor: {{ ukin.user.value?.displayName }} · Paket {{ f.evidenceVersionId }} · Rubrik {{ f.rubricVersionId }}</p><p v-if="f.fixture" class="assess-notice">Skor dan feedback ini merupakan contoh simulasi dari metadata lama, bukan hasil penilaian pengguna yang dipulihkan.</p><p v-if="f.revisionReason"><strong>Alasan revisi:</strong> {{ f.revisionReason }}</p><p v-if="f.permissionId" class="assess-caption">Izin pengelola: {{ r.assessment.permissions.find(p => p.id === f.permissionId)?.reason }}</p>
          <section v-for="c in r.assessment.rubric.components" :key="c.id" class="history-component"><h3>{{ c.title }}</h3><p>{{ assessmentSummary(f.content, r.assessment.rubric).find(s => s.id === c.id)?.score }} / {{ c.indicators.length * 4 }} · Ringkasan demo per komponen</p><dl><template v-for="i in c.indicators" :key="i.id"><dt>{{ i.id }} · {{ i.title }} <strong>{{ f.content.ratings[i.id]?.score ?? 'Kosong' }}/4</strong></dt><dd><p>{{ i.descriptors[String(f.content.ratings[i.id]?.score)] }}</p><p>{{ f.content.ratings[i.id]?.note || 'Tanpa catatan indikator.' }}</p><small>Bukti: {{ f.content.ratings[i.id]?.evidenceId }}</small></dd></template></dl><p class="history-feedback">{{ f.content.feedback[c.id] }}</p></section>
          <h3 v-if="f.content.videoNotes.length">Catatan video versi ini</h3><p v-for="n in f.content.videoNotes" :key="n.id"><a :href="`https://www.youtube.com/watch?v=${n.videoId}&t=${n.seconds}s`" target="_blank" rel="noopener noreferrer">{{ formatTimestamp(n.seconds) }}</a> · {{ n.indicatorId || 'Umum' }} · {{ n.text }}</p>
        </div>
      </details>
      <details class="history-version"><summary>Jejak proses dan revisi</summary><ol class="assessment-events"><li v-for="e in [...r.assessment.events].reverse()" :key="e.id"><strong>{{ e.action }}</strong><span>{{ formatDemoTime(e.at) }} · {{ e.actorId }}</span><p v-if="e.reason">{{ e.reason }}</p></li></ol></details>
    </article>
    <div v-if="!records.length" class="panel assess-empty"><h2>Belum ada penilaian final.</h2><p>Draf tetap tersedia pada ruang penugasan Anda.</p></div>
  </div>
</template>
