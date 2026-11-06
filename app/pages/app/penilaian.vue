<script setup lang="ts">
import { assessmentSummary, evidenceChoices } from '~/domain/assessment'
import { formatDemoTime } from '~/domain/selectors'
import type { AssessmentContent, AssessmentView } from '~/domain/assessment-types'
import type { ComponentId } from '~/domain/types'
definePageMeta({ layout: 'workspace' })
useHead({ title: 'Ruang penilaian pribadi · UKIN PPG UNJ' })
const ukin = useUkin(), route = useRoute()
const id = computed(() => typeof route.query.id === 'string' ? route.query.id : '')
const view = shallowRef<AssessmentView | null>(null), content = ref<AssessmentContent | null>(null)
const active = ref<ComponentId>('perangkat'), error = ref(''), message = ref(''), saved = ref('')
const finalDialog = ref<HTMLDialogElement | null>(null), confirmed = ref(false), problems = ref<string[]>([])
const issueReason = ref(''), revisionReason = ref(''), resolutions = ref<Record<string, string>>({})
const dirty = computed(() => !!content.value && JSON.stringify(content.value) !== saved.value)
const summary = computed(() => content.value && view.value ? assessmentSummary(content.value, view.value.rubric) : [])
const lastFinal = computed(() => view.value?.assessment?.finals.at(-1))
function load(replaceEditor = true) {
  try {
    const next = ukin.getAssessment(id.value); view.value = next
    if (replaceEditor) { content.value = structuredClone(next.draft.content); saved.value = JSON.stringify(next.draft.content) }
  } catch (e) { view.value = null; content.value = null; error.value = e instanceof Error ? e.message : 'Penugasan tidak tersedia.' }
}
watch([id, () => ukin.user.value?.id], () => { finalDialog.value?.close(); error.value = ''; message.value = ''; active.value = 'perangkat'; issueReason.value = ''; revisionReason.value = ''; load() }, { immediate: true })
watch(dirty, value => ukin.setUnsavedChanges(value))
onBeforeRouteLeave(() => ukin.confirmDiscardChanges())
onBeforeRouteUpdate(() => ukin.confirmDiscardChanges())
const unload = (e: BeforeUnloadEvent) => { if (dirty.value) { e.preventDefault(); e.returnValue = '' } }
onMounted(() => window.addEventListener('beforeunload', unload))
onBeforeUnmount(() => { window.removeEventListener('beforeunload', unload); ukin.setUnsavedChanges(false) })
function act(operation: () => void) { error.value = ''; message.value = ''; try { operation() } catch (e) { error.value = e instanceof Error ? e.message : 'Tindakan belum berhasil.' } }
function save() {
  if (!view.value || !content.value) return false
  try { ukin.saveAssessmentDraft(id.value, content.value, view.value.draft.revision); load(); message.value = 'Draf pribadi tersimpan pada browser ini.'; return true }
  catch (e) { error.value = e instanceof Error ? e.message : 'Draf belum tersimpan.'; return false }
}
function preview() {
  error.value = ''
  if (!save() || !view.value) return
  act(() => { problems.value = ukin.previewAssessmentFinal(id.value, view.value!.draft.revision).problems; confirmed.value = false; finalDialog.value?.showModal() })
}
function finalize() { act(() => { ukin.finalizeAssessment(id.value, view.value!.draft.revision, confirmed.value); finalDialog.value?.close(); load(); message.value = 'Penilaian Anda difinalisasi. Riwayat dan versi tersimpan; hasil belum dipublikasikan kepada peserta.' }) }
function report() { act(() => { ukin.reportAssessmentIssue(id.value, active.value, issueReason.value); issueReason.value = ''; load(false); message.value = 'Kendala diteruskan ke ringkasan pengelola. Skor tidak diubah.' }) }
function resolve(issueId: string) { act(() => { ukin.resolveAssessmentIssue(id.value, issueId, resolutions.value[issueId] ?? ''); load(false); message.value = 'Penyelesaian kendala dicatat. Tinjau bukti kembali sebelum finalisasi.' }) }
function revise() { act(() => { ukin.beginAssessmentRevision(id.value, lastFinal.value!.version, revisionReason.value); load(); message.value = 'Draf revisi dibuka. Final sebelumnya tetap tersimpan; tinjau ulang tiga komponen.' }) }
</script>
<template>
  <div class="assessment-page">
    <NuxtLink to="/app/penugasan" class="assess-back">← Kembali ke penugasan</NuxtLink>
    <p v-if="error" class="assess-error" role="alert">{{ error }}</p><p v-if="message" class="assess-notice" role="status">{{ message }}</p>
    <template v-if="view && content">
      <header class="assessment-work-header"><div><p class="eyebrow">PENILAIAN INDEPENDEN · {{ view.examiner.examinerKind?.toUpperCase() }}</p><h1>{{ view.participant.displayName }}</h1><p>{{ view.attempt.subject }} · Percobaan {{ view.attempt.attemptNumber }} · {{ view.period.name }}</p></div><div class="assessment-version"><strong>Paket v{{ view.evidence.version }}</strong><span>Rubrik {{ view.rubric.version }}</span><small>{{ view.rubric.id }}</small></div></header>
      <p class="assess-caption"><AppIcon name="shield" :size="15" /> Anda menilai sebagai {{ view.examiner.displayName }}. Pasangan: {{ view.partnerName }}. Draf, skor, dan catatan pasangan tetap tersembunyi.</p>
      <p class="assess-notice">Rubrik demo, skala 1–4. Bukan instrumen resmi UKPPPG atau standar tersertifikasi. Tidak ada nilai gabungan atau ambang kelulusan.</p>
      <p v-for="blocker in view.blockers" :key="blocker" class="assess-notice">{{ blocker }}</p>
      <section v-if="lastFinal" class="panel assess-final-banner"><h2>Final pribadi v{{ lastFinal.version }}{{ view.assessment?.draft ? ' · revisi sedang dikerjakan' : '' }}</h2><p>{{ formatDemoTime(lastFinal.finalizedAt) }} · Aktor {{ view.examiner.displayName }}</p><p v-if="lastFinal.fixture" class="assess-caption">Contoh assessment dari metadata skenario lama. Skor dan feedback contoh bukan rekonstruksi penilaian pengguna.</p><NuxtLink to="/app/riwayat">Baca seluruh riwayat saya →</NuxtLink><form v-if="view.canBeginRevision" @submit.prevent="revise"><label class="assess-field">Alasan revisi Anda (izin pengelola tersedia)<textarea v-model="revisionReason" required maxlength="5000" rows="2" /></label><UButton type="submit" variant="soft">Buka draf revisi beralasan</UButton></form><p v-else-if="!view.assessment?.draft" class="assess-caption">Final terkunci. Pengelola harus mengizinkan revisi versi ini sebelum Anda membuka draf baru.</p></section>
      <nav class="assessment-tabs" aria-label="Komponen penilaian"><button v-for="(c, index) in view.rubric.components" :key="c.id" :class="{ active: active === c.id }" :aria-pressed="active === c.id" @click="active = c.id"><span>0{{ index + 1 }}</span><div>{{ c.title }}<small>{{ summary.find(s => s.id === c.id)?.filled }} / {{ c.indicators.length }} indikator terisi</small></div><AppIcon v-if="content.reviewed[c.id]" name="check" :size="18" /></button></nav>
      <div class="assessment-grid">
        <aside class="assessment-evidence panel"><div class="assess-pane-heading"><p class="eyebrow">BUKTI YANG DINILAI</p><h2>{{ view.rubric.components.find(c => c.id === active)?.title }}</h2></div>
          <div v-for="c in view.rubric.components" v-show="active === c.id" :key="c.id" class="assess-pane-body">
            <AssessmentVideoNotes v-if="c.id === 'video'" v-model="content.videoNotes" :evidence="view.evidence" :rubric="view.rubric" :readonly="!view.editable" />
            <AssessmentEvidence v-else :assignment-id="id" :evidence="view.evidence" :component="c.id" />
          </div>
        </aside>
        <section class="rubric-column" aria-label="Instrumen dan catatan pribadi">
          <section v-for="c in view.rubric.components" v-show="active === c.id" :key="c.id">
            <div class="rubric-intro"><p class="eyebrow">INSTRUMEN {{ view.rubric.version }}</p><h2>{{ c.title }}</h2><p>Pilih tingkat yang didukung bukti. Kolom kosong belum dinilai; skor 1 adalah tingkat minimum demo.</p></div>
            <fieldset v-for="(i, index) in c.indicators" :key="i.id" class="panel rubric-indicator" :disabled="!view.editable">
              <legend><span>{{ i.id }}</span> {{ index + 1 }}. {{ i.title }}</legend><p class="indicator-focus">{{ i.focus }}</p>
              <div class="rubric-scale"><label v-for="score in [1, 2, 3, 4]" :key="score" :class="{ chosen: content.ratings[i.id]!.score === score }"><input v-model="content.ratings[i.id]!.score" type="radio" :name="i.id" :value="score" /><strong>{{ score }}</strong><span>{{ i.descriptors[String(score)] }}</span></label></div>
              <div class="score-state"><span>{{ content.ratings[i.id]!.score === null ? 'Belum diberi skor' : `Skor dipilih: ${content.ratings[i.id]!.score} / 4` }}</span><button v-if="view.editable && content.ratings[i.id]!.score !== null" type="button" @click="content.ratings[i.id]!.score = null">Kosongkan skor</button></div>
              <label class="assess-field">Bukti rujukan<select v-model="content.ratings[i.id]!.evidenceId"><option value="">Pilih bukti</option><option v-for="e in evidenceChoices(view.evidence, c.id)" :key="e.id" :value="e.id">{{ e.label }}</option></select></label>
              <label class="assess-field">Catatan indikator<textarea v-model="content.ratings[i.id]!.note" rows="2" maxlength="5000" placeholder="Catat dasar penilaian atau bagian bukti yang relevan (opsional)." /></label>
            </fieldset>
            <fieldset class="panel component-feedback" :disabled="!view.editable"><legend>Umpan balik komponen</legend><label class="assess-field">Feedback {{ c.title.toLowerCase() }} (wajib)<textarea v-model="content.feedback[c.id]" rows="4" maxlength="5000" placeholder="Tuliskan kekuatan dan saran perbaikan berdasarkan bukti." /></label><label class="assess-check"><input v-model="content.reviewed[c.id]" type="checkbox" />Saya telah meninjau bukti komponen ini, termasuk melalui tautan eksternal bila diperlukan.</label><p class="assess-caption">Konfirmasi manual penguji; aplikasi tidak menyimpulkan kualitas atau kelengkapan dari playback video.</p></fieldset>
          </section>
        </section>
      </div>
      <section class="panel technical-panel"><h2>Kendala pemeriksaan</h2><p>Laporkan bukti yang tidak dapat diperiksa. Alasan teknis terlihat oleh pengelola; skor dan catatan rubrik tetap pribadi. Kendala terbuka menahan finalisasi dan tidak memberi skor nol.</p>
        <form v-if="view.editable" class="assess-inline" @submit.prevent="report"><label class="assess-field">Alasan untuk {{ view.rubric.components.find(c => c.id === active)?.title }}<textarea v-model="issueReason" rows="2" maxlength="5000" required placeholder="Contoh: video private saat dibuka di YouTube." /></label><UButton type="submit" variant="soft">Tandai kendala</UButton></form>
        <article v-for="i in view.assessment?.technicalIssues" :key="i.id" class="technical-issue"><strong>{{ i.component }} · {{ i.resolvedAt ? 'Selesai' : 'Tertahan' }}</strong><p>{{ i.reason }}</p><small>{{ formatDemoTime(i.reportedAt) }}</small><p v-if="i.resolvedAt">Penyelesaian: {{ i.resolution }}</p><form v-else-if="view.editable" class="assess-inline" @submit.prevent="resolve(i.id)"><label class="assess-field">Alasan penyelesaian<input v-model="resolutions[i.id]" required maxlength="5000" placeholder="Jelaskan setelah bukti kembali dapat diperiksa" /></label><UButton type="submit" variant="soft">Tandai terselesaikan</UButton></form></article>
        <p v-if="!view.assessment?.technicalIssues.length" class="assess-caption">Belum ada kendala yang dilaporkan pada assessment Anda.</p>
      </section>
      <footer class="assessment-savebar"><div><strong>{{ dirty ? 'Perubahan belum disimpan' : view.assessment?.draft ? 'Draf pribadi tersimpan' : lastFinal ? 'Penilaian terkunci' : 'Belum ada draf tersimpan' }}</strong><span v-if="view.assessment?.draft">{{ formatDemoTime(view.draft.updatedAt) }} · Draf r{{ view.draft.revision }}</span><span v-else>Hanya akun Anda yang dapat mengubah penilaian ini.</span></div><div v-if="view.editable" class="assess-inline"><UButton variant="soft" @click="error = ''; save()">Simpan draf</UButton><UButton @click="preview">Tinjau & finalisasi <AppIcon name="arrow-right" :size="16" /></UButton></div></footer>
      <dialog ref="finalDialog" class="assessment-dialog"><form @submit.prevent="finalize"><p class="eyebrow">KONFIRMASI PENGUJI</p><h2>Finalisasi penilaian Anda?</h2><p>{{ view.participant.displayName }} · Paket v{{ view.evidence.version }} · {{ view.rubric.id }} · Draf r{{ view.draft.revision }}</p><div class="summary-lines"><div v-for="s in summary" :key="s.id"><strong>{{ s.title }}</strong><span>{{ s.filled }}/{{ s.count }} indikator · {{ s.score === null ? 'Belum lengkap' : `${s.score}/${s.maximum} (ringkasan demo)` }}</span><p>{{ content.feedback[s.id] || 'Feedback belum diisi.' }}</p></div></div><p class="assess-caption">Tidak ada nilai gabungan atau keputusan kelulusan. Catatan dan skor rinci telah ditinjau pada ruang kerja; hasil tidak dikirim kepada peserta.</p><ul v-if="problems.length" class="assess-error"><li v-for="p in problems" :key="p">{{ p }}</li></ul><label class="assess-check"><input v-model="confirmed" type="checkbox" :disabled="!!problems.length" />Saya mengonfirmasi seluruh skor dan feedback pribadi untuk versi paket dan rubrik di atas.</label><p v-if="error" class="assess-error" role="alert">{{ error }}</p><div class="assess-inline"><UButton type="button" variant="soft" @click="finalDialog?.close()">Kembali meninjau</UButton><UButton type="submit" :disabled="!confirmed || !!problems.length">Finalisasi penilaian saya</UButton></div></form></dialog>
    </template>
  </div>
</template>
