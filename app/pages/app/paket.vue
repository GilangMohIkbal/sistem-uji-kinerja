<script setup lang="ts">
import type { EvidenceContent, EvidenceFile } from '~/domain/types'
import { MAX_TEXT_LENGTH, normalizeYouTubeUrl } from '~/domain/evidence'
import { SAMPLE_FILES } from '~/data/sample-files'
import { formatDemoTime } from '~/domain/selectors'

definePageMeta({ layout: 'workspace' })
useHead({ title: 'Paket bukti Anda · UKIN PPG UNJ' })
const ukin = useUkin()
const route = useRoute()
const myPackages = computed(() => ukin.user.value?.role === 'peserta' ? ukin.listMyAttempts().filter(a => !a.archived) : [])
async function changePackage(event: Event) {
  if (!ukin.confirmDiscardChanges()) { (event.target as HTMLSelectElement).value = view.value?.attempt.id ?? ''; return }
  await navigateTo({ path: '/app/paket', query: { id: (event.target as HTMLSelectElement).value } })
}
const requestedId = computed(() => typeof route.query.id === 'string' ? route.query.id : undefined)
const result = computed(() => {
  void ukin.snapshot.value
  void ukin.user.value
  try { return { view: ukin.getPackage(requestedId.value), error: '' } }
  catch (cause) { return { view: null, error: cause instanceof Error ? cause.message : 'Paket belum dapat dibuka.' } }
})
const view = computed(() => result.value.view)
const isOwner = computed(() => view.value?.participant.id === ukin.user.value?.id)
const draft = ref<EvidenceContent | null>(null)
const savedContent = ref('')
const revision = ref(0)
const message = ref('')
const error = ref('')
const busy = ref(false)
const confirmDialog = ref<HTMLDialogElement | null>(null)
const confirmed = ref(false)
const dirty = computed(() => !!draft.value && JSON.stringify(draft.value) !== savedContent.value)
const latest = computed(() => [...(view.value?.versions ?? [])].sort((a, b) => b.version - a.version)[0])
const correction = computed(() => [...(view.value?.reviews ?? [])].reverse().find(item => item.outcome === 'needs_correction'))
const componentLabels = { perangkat: 'Perangkat pembelajaran', video: 'Video praktik', studi_kasus: 'Studi kasus' }
const preview = computed(() => {
  void ukin.snapshot.value
  if (!view.value || !draft.value) return { value: null, error: '' }
  try { return { value: ukin.previewContent(view.value.attempt.id, plainDraft()), error: '' } }
  catch (cause) { return { value: null, error: cause instanceof Error ? cause.message : 'Periksa isian paket.' } }
})
const packageLabels = { draft: 'Draf', submitted: 'Terkirim', revision_requested: 'Perlu perbaikan', resubmitted: 'Dikirim ulang' }
const completenessLabels = { pending: 'Menunggu pemeriksaan', complete: 'Lengkap secara administratif', needs_correction: 'Perlu perbaikan teknis' }
const fields = [
  { id: 'context', label: 'Konteks dan masalah', hint: 'Jelaskan situasi pembelajaran dan masalah yang Anda temukan.' },
  { id: 'action', label: 'Tindakan yang dilakukan', hint: 'Ceritakan langkah dan alasan pemilihan tindakan.' },
  { id: 'result', label: 'Bukti atau hasil', hint: 'Uraikan hasil yang dapat ditinjau tanpa identitas peserta didik.' },
  { id: 'reflection', label: 'Refleksi dan tindak lanjut', hint: 'Apa yang dipelajari dan apa yang akan diperbaiki?' },
] as const
function plainDraft(): EvidenceContent { return JSON.parse(JSON.stringify(draft.value)) as EvidenceContent }
function loadEditor() {
  const content = view.value?.draft?.content
  draft.value = content ? JSON.parse(JSON.stringify(content)) as EvidenceContent : null
  savedContent.value = JSON.stringify(draft.value)
  revision.value = view.value?.draft?.revision ?? 0
  message.value = error.value = ''
  ukin.setUnsavedChanges(false)
}
watch([requestedId, () => ukin.user.value?.id], loadEditor, { immediate: true })
watch(dirty, value => ukin.setUnsavedChanges(value))
onBeforeRouteLeave(() => ukin.confirmDiscardChanges())
onBeforeRouteUpdate(() => ukin.confirmDiscardChanges())
function beforeUnload(event: BeforeUnloadEvent) {
  if (!dirty.value) return
  event.preventDefault()
  event.returnValue = ''
}
onMounted(() => window.addEventListener('beforeunload', beforeUnload))
onBeforeUnmount(() => { window.removeEventListener('beforeunload', beforeUnload); ukin.setUnsavedChanges(false) })
function report(cause: unknown) { error.value = cause instanceof Error ? cause.message : 'Perubahan belum dapat disimpan.'; message.value = '' }
function save() {
  if (!view.value || !draft.value || busy.value) return false
  try {
    const saved = ukin.saveDraft(view.value.attempt.id, plainDraft(), revision.value)
    draft.value = saved.content
    savedContent.value = JSON.stringify(saved.content)
    revision.value = saved.revision
    ukin.setUnsavedChanges(false)
    error.value = ''
    message.value = `Draf diperbarui pada ${formatDemoTime(saved.updatedAt)}. Periksa pemberitahuan penyimpanan di atas bila tersedia.`
    return true
  } catch (cause) { report(cause); return false }
}
function chooseSample(target: 'main' | 'attachment' | 'case', id: string) {
  const sample = SAMPLE_FILES.find(file => file.id === id)
  if (!sample || !draft.value) return
  const file = structuredClone(sample) as EvidenceFile
  if (target === 'main') draft.value.mainDocument = file
  else if (target === 'case') draft.value.caseStudy.document = file
  else if (!draft.value.attachments.some(item => item.id === file.id)) draft.value.attachments.push(file)
  message.value = ''
}
async function chooseLocal(target: 'main' | 'attachment' | 'case', event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || !view.value || !draft.value) return
  if ((target === 'main' || target === 'case') && file.type !== 'application/pdf') { error.value = 'Dokumen utama dan laporan studi kasus harus berupa PDF. Lampiran mendukung PDF, PNG, dan JPEG.'; return }
  busy.value = true
  error.value = ''
  try {
    const registered = await ukin.registerLocalFile(view.value.attempt.id, file)
    if (!draft.value) return
    if (target === 'main') draft.value.mainDocument = registered
    else if (target === 'case') draft.value.caseStudy.document = registered
    else draft.value.attachments.push(registered)
    message.value = 'File dipilih dari perangkat. Isi file hanya tersedia selama sesi halaman ini; simpan draf untuk menyimpan metadatanya.'
  } catch (cause) { report(cause) }
  finally { busy.value = false }
}
function videoId(url: string) { try { return normalizeYouTubeUrl(url)?.videoId ?? '' } catch { return '' } }
function videoError(url: string) { try { normalizeYouTubeUrl(url); return '' } catch (cause) { return cause instanceof Error ? cause.message : 'Tautan YouTube tidak sesuai.' } }
function fileUrl(file: EvidenceFile) { void ukin.snapshot.value; try { return ukin.getFileUrl(file.id) } catch { return null } }
function reviewSubmission() {
  confirmed.value = false
  error.value = ''
  confirmDialog.value?.showModal()
}
async function submit() {
  if (busy.value || !view.value || !draft.value || !confirmed.value) return
  if (dirty.value && !save()) { confirmDialog.value?.close(); return }
  busy.value = true
  try {
    const version = ukin.submitPackage(view.value.attempt.id, revision.value, confirmed.value)
    ukin.setUnsavedChanges(false)
    savedContent.value = JSON.stringify(draft.value)
    confirmDialog.value?.close()
    await navigateTo(`/app/bukti-kirim?id=${encodeURIComponent(version.id)}`)
  } catch (cause) { report(cause); confirmDialog.value?.close() }
  finally { busy.value = false }
}
</script>

<template>
  <div v-if="view" class="package-page">
    <label v-if="myPackages.length > 1" class="op-field">Paket periode Anda<select :value="view.attempt.id" @change="changePackage"><option v-for="a in myPackages" :key="a.id" :value="a.id">{{ ukin.snapshot.value.data.periods.find(p => p.id === a.periodId)?.name }} / {{ a.subject }}</option></select></label>
    <header class="page-heading"><p class="eyebrow">PAKET BUKTI · {{ view.period.year }}</p><h1>Susun cerita praktik baik Anda<span>.</span></h1><p>Tiga komponen yang saling melengkapi, dalam satu paket bukti kinerja.</p></header>
    <section class="package-summary" aria-label="Identitas dan status paket">
      <div><span class="meta-label">Peserta</span><strong>{{ view.participant.displayName }}</strong><span>{{ view.attempt.subject }}</span></div>
      <div><span class="meta-label">Periode</span><strong>{{ view.period.name }}</strong><span>Percobaan {{ view.attempt.attemptNumber }}{{ view.attempt.previousAttemptId ? ' · Retaker' : '' }}</span></div>
      <div class="package-states"><span class="status-badge">Paket: {{ packageLabels[view.attempt.packageStatus] }}</span><span class="review-status">Kelengkapan: {{ completenessLabels[view.attempt.completeness] }}</span></div>
    </section>
    <p v-if="!view.collectionOpen" class="notice warning" role="status"><strong>Pengumpulan sedang tertutup.</strong> Draf dan bukti tetap dapat dibaca. Penyimpanan atau pengiriman hanya tersedia dalam jendela pengumpulan demo.</p>
    <section v-if="view.attempt.packageStatus === 'revision_requested'" class="notice correction" aria-labelledby="correction-title"><h2 id="correction-title">Perbaikan teknis diperlukan</h2><p>Tinjau catatan pemeriksaan, lalu perbaiki draf ini. Pengiriman berikutnya membuat versi baru; bukti lama tetap tersimpan.</p><ul v-if="correction" class="correction-list"><li v-for="(reason, component) in correction.issues" :key="component"><strong>{{ componentLabels[component] }}:</strong> {{ reason }}</li></ul><NuxtLink v-if="latest" :to="`/app/bukti-kirim?id=${latest.id}`" class="text-link">Lihat catatan pada versi {{ latest.version }} <AppIcon name="arrow-right" :size="16" /></NuxtLink></section>
    <p v-if="error" class="notice error" role="alert">{{ error }}</p>
    <p v-if="message" class="notice" role="status">{{ message }}</p>

    <AttemptHistory :attempts="view.attemptHistory" :current-attempt-id="view.attempt.id" />
    <div v-if="draft && ['draft', 'revision_requested'].includes(view.attempt.packageStatus)" class="package-grid">
      <div class="editor-sections">
        <section id="perangkat" class="panel evidence-section" aria-labelledby="perangkat-title">
          <header class="component-heading"><span class="component-number">01</span><div><p class="eyebrow">RANCANG PEMBELAJARAN</p><h2 id="perangkat-title">Perangkat pembelajaran</h2><p>Dokumen utama PDF dan lampiran pendukung yang relevan.</p></div></header>
          <fieldset :disabled="!view.editable || busy" class="editor-fieldset">
            <legend class="sr-only">Dokumen perangkat pembelajaran</legend>
            <div class="field-heading"><h3>Dokumen utama <span>Wajib · PDF</span></h3><p>Gunakan contoh fiktif untuk demo yang tetap dapat dibuka setelah refresh.</p></div>
            <div class="file-actions"><UButton color="primary" variant="soft" :disabled="!view.editable || busy" @click="chooseSample('main', 'sample-perangkat')"><AppIcon name="book" :size="17" />Gunakan PDF contoh</UButton><label class="file-picker">Pilih PDF perangkat<input type="file" accept="application/pdf,.pdf" aria-label="Pilih dokumen utama PDF" @change="chooseLocal('main', $event)"></label></div>
            <EvidenceFileCard v-if="draft.mainDocument" :file="draft.mainDocument" :url="fileUrl(draft.mainDocument)" :can-remove="view.editable" @remove="draft.mainDocument = null" />
            <p v-else class="empty-file">Dokumen utama belum dipilih.</p>
            <div class="field-heading attachment-heading"><h3>Lampiran pendukung <span>Opsional</span></h3><p>Bahan ajar, LKPD, asesmen, atau media. Batas teknis demo: maksimal 10 lampiran, 10 MiB per file.</p></div>
            <div class="file-actions"><UButton color="neutral" variant="outline" :disabled="!view.editable || busy" @click="chooseSample('attachment', 'sample-lkpd')">Tambah LKPD contoh</UButton><label class="file-picker">Tambah lampiran<input type="file" accept="application/pdf,image/png,image/jpeg,.pdf,.png,.jpg,.jpeg" aria-label="Tambah lampiran PDF PNG atau JPEG" @change="chooseLocal('attachment', $event)"></label></div>
            <div v-if="draft.attachments.length" class="file-list"><EvidenceFileCard v-for="file in draft.attachments" :key="file.id" :file="file" :url="fileUrl(file)" :can-remove="view.editable" @remove="draft.attachments = draft.attachments.filter(item => item.id !== file.id)" /></div>
          </fieldset>
          <p class="component-footnote"><AppIcon name="help" :size="16" />File dari perangkat tidak diunggah ke server. Setelah refresh, isi file perlu dipilih ulang. Nama dan ukuran saja tidak membuktikan isi file sama.</p>
        </section>

        <section id="video" class="panel evidence-section" aria-labelledby="video-title">
          <header class="component-heading"><span class="component-number">02</span><div><p class="eyebrow">HADIRKAN PRAKTIK</p><h2 id="video-title">Video praktik pembelajaran</h2><p>Tambahkan tautan YouTube, kemudian periksa pratinjaunya.</p></div></header>
          <fieldset :disabled="!view.editable || busy" class="editor-fieldset"><legend class="sr-only">Tautan video pembelajaran</legend>
            <div v-for="kind in (['full', 'summary'] as const)" :key="kind" class="video-field"><label :for="`video-${kind}`">{{ kind === 'full' ? 'Video utuh' : 'Video ringkasan' }} <span>{{ (kind === 'full' ? view.period.requirements.fullVideo : view.period.requirements.summaryVideo) ? 'Wajib' : 'Opsional' }}</span></label><input :id="`video-${kind}`" v-model="draft.video[kind]" type="url" placeholder="https://www.youtube.com/watch?v=..." :aria-invalid="!!videoError(draft.video[kind])" :aria-describedby="`video-${kind}-hint`"><p :id="`video-${kind}-hint`" :class="{ 'field-error': !!videoError(draft.video[kind]) }">{{ videoError(draft.video[kind]) || (videoId(draft.video[kind]) ? 'Format tautan valid. Pemutaran dan pemeriksaan bukti adalah langkah terpisah.' : 'Mendukung youtube.com/watch, youtu.be, dan youtube.com/embed.') }}</p><UButton v-if="kind === 'full'" color="neutral" variant="outline" size="sm" :disabled="!view.editable || busy" @click="draft.video.full = 'https://www.youtube.com/watch?v=M7lc1UVf-VE'">Isi video contoh integrasi</UButton></div>
          </fieldset>
          <div v-for="kind in (['full', 'summary'] as const)" :key="`preview-${kind}`" class="video-preview"><EvidenceVideo v-if="videoId(draft.video[kind])" :video-id="videoId(draft.video[kind])" :title="kind === 'full' ? 'Pratinjau video utuh' : 'Pratinjau video ringkasan'" :demo="videoId(draft.video[kind]) === 'M7lc1UVf-VE'" /></div>
          <p class="component-footnote"><AppIcon name="help" :size="16" />Contoh integrasi bukan praktik mengajar peserta nyata. UKIN menyimpan tautan; isi video di YouTube dapat berubah dan memerlukan internet.</p>
        </section>

        <section id="studi_kasus" class="panel evidence-section" aria-labelledby="case-title">
          <header class="component-heading"><span class="component-number">03</span><div><p class="eyebrow">TEMUKAN PEMBELAJARAN</p><h2 id="case-title">Studi kasus</h2><p>Hubungkan masalah, tindakan, bukti hasil, dan refleksi Anda.</p></div></header>
          <template v-if="view.period.caseStudySource === 'exam_snapshot'"><p class="notice">Laporan ini adalah simulasi data dari web ujian dan hanya dapat dibaca. Anda tidak perlu mengerjakan ulang.</p><dl class="case-readonly"><div v-for="field in fields" :key="field.id"><dt>{{ field.label }}</dt><dd>{{ draft.caseStudy[field.id] || 'Belum tersedia' }}</dd></div></dl><p class="component-footnote">Sumber: {{ draft.caseStudy.provenance || 'Snapshot ujian fiktif — tidak ada integrasi nyata.' }}</p></template>
          <fieldset v-else :disabled="!view.editable || busy" class="editor-fieldset"><legend class="sr-only">Cara menyiapkan studi kasus</legend>
            <div class="case-modes"><label :class="{ selected: draft.caseStudy.mode === 'text' }"><input v-model="draft.caseStudy.mode" type="radio" value="text" name="case-mode">Laporan teks</label><label :class="{ selected: draft.caseStudy.mode === 'document' }"><input v-model="draft.caseStudy.mode" type="radio" value="document" name="case-mode">Dokumen laporan</label></div>
            <div v-if="draft.caseStudy.mode === 'text'" class="case-fields"><div v-for="field in fields" :key="field.id" class="text-field"><label :for="`case-${field.id}`">{{ field.label }}</label><p :id="`case-${field.id}-hint`">{{ field.hint }}</p><textarea :id="`case-${field.id}`" v-model="draft.caseStudy[field.id]" rows="5" :maxlength="MAX_TEXT_LENGTH" :aria-describedby="`case-${field.id}-hint`" /></div><p class="report-hint">Batas teknis demo: {{ MAX_TEXT_LENGTH.toLocaleString('id-ID') }} karakter per bagian, bukan ketentuan jumlah kata nasional.</p></div>
            <div v-else><p class="report-hint">Dokumen laporan mendukung PDF hingga 10 MiB.</p><div class="file-actions"><UButton color="primary" variant="soft" :disabled="!view.editable || busy" @click="chooseSample('case', 'sample-kasus')">Gunakan laporan contoh</UButton><label class="file-picker">Pilih laporan<input type="file" accept="application/pdf,.pdf" aria-label="Pilih dokumen PDF laporan studi kasus" @change="chooseLocal('case', $event)"></label></div><EvidenceFileCard v-if="draft.caseStudy.document" :file="draft.caseStudy.document" :url="fileUrl(draft.caseStudy.document)" :can-remove="view.editable" @remove="draft.caseStudy.document = null" /><p v-else class="empty-file">Dokumen laporan belum dipilih.</p></div>
          </fieldset>
          <p class="component-footnote">Gunakan pengalaman/data fiktif untuk demo. Tidak ada ketentuan jumlah kata atau standar nasional yang ditetapkan oleh prototipe ini.</p>
        </section>
      </div>

      <aside class="package-aside">
        <section class="panel checklist-panel" aria-labelledby="checklist-title"><p class="eyebrow">LANGKAH BERIKUTNYA</p><h2 id="checklist-title">Siapkan, tinjau, kirim.</h2><p class="deadline-label">Batas pengumpulan</p><strong class="deadline">{{ formatDemoTime(view.period.collectionClosesAt) }}</strong><p class="muted deadline-hint">Mengikuti waktu demo di bagian atas.</p>
          <ul v-if="preview.value" class="checklist"><li v-for="item in preview.value.checklist" :key="item.id"><a :href="`#${item.id}`"><span class="check-icon" :class="{ complete: item.complete }"><AppIcon :name="item.complete ? 'check' : 'file'" :size="16" /></span><span><strong>{{ item.label }}</strong><small>{{ item.complete ? 'Persyaratan isi terpenuhi' : item.issues[0] || 'Belum lengkap' }}</small></span></a></li></ul>
          <p v-if="preview.error" class="field-error preview-error">{{ preview.error }}</p><p class="checklist-note">Kelengkapan isi belum berarti bukti telah diperiksa pengelola.</p>
          <div class="save-state" role="status"><span :class="{ unsaved: dirty }" />{{ dirty ? 'Ada perubahan belum disimpan' : 'Tidak ada perubahan belum disimpan' }}</div>
          <div class="package-actions"><UButton color="neutral" variant="outline" block :disabled="!view.editable || busy || !dirty" @click="() => { save() }">Simpan draf</UButton><UButton block :disabled="!view.editable || busy" @click="reviewSubmission">Tinjau pengiriman <AppIcon name="arrow-right" :size="17" /></UButton></div>
          <p v-if="!view.editable" class="checklist-note">{{ view.collectionOpen ? 'Paket ini terkunci. Pengelola perlu membuka perbaikan untuk mengubahnya.' : 'Periode tertutup; paket hanya dapat dibaca.' }}</p>
        </section>
        <section v-if="view.versions.length" class="panel versions-panel"><h2>Riwayat pengiriman</h2><NuxtLink v-for="version in [...view.versions].sort((a,b) => b.version - a.version)" :key="version.id" :to="`/app/bukti-kirim?id=${version.id}`"><span><strong>Versi {{ version.version }}</strong><small>{{ formatDemoTime(version.submittedAt) }}</small></span><AppIcon name="arrow-right" :size="16" /></NuxtLink><p>Setiap versi menyimpan bukti pengiriman tersendiri.</p></section>
        <p class="privacy-note"><AppIcon name="shield" :size="18" />Draf Anda belum dapat dibaca pengelola atau penguji.</p>
      </aside>
    </div>

    <template v-else-if="latest"><section class="panel locked-panel"><AppIcon name="check" :size="30" /><div><h2>Paket versi {{ latest.version }} sudah dikirim.</h2><p>Bukti terkunci dan menunggu proses sesuai status kelengkapan di atas. Pengiriman tidak berarti peserta telah dinilai atau lulus.</p></div><UButton :to="`/app/bukti-kirim?id=${latest.id}`">Buka bukti pengiriman</UButton></section><EvidenceReadView :content="latest.content" :version-id="latest.id" :can-restore="isOwner" /><section class="panel versions-panel"><h2>Riwayat pengiriman</h2><NuxtLink v-for="version in view.versions" :key="version.id" :to="`/app/bukti-kirim?id=${version.id}`"><span><strong>Versi {{ version.version }}</strong><small>{{ formatDemoTime(version.submittedAt) }}</small></span><AppIcon name="arrow-right" :size="16" /></NuxtLink></section></template>

    <dialog ref="confirmDialog" class="submission-dialog" aria-labelledby="submit-title" aria-describedby="submit-description"><div class="dialog-heading"><span class="component-number"><AppIcon name="file" /></span><button class="dialog-close" aria-label="Tutup pratinjau pengiriman" @click="confirmDialog?.close()"><AppIcon name="close" /></button></div><p class="eyebrow">TINJAU PAKET BUKTI</p><h2 id="submit-title">Siap mengirim paket ini?</h2><p id="submit-description">Paket akan dikunci sebagai versi baru. Setelah dikirim, perubahan hanya melalui pembukaan perbaikan oleh pengelola.</p><ul v-if="preview.value" class="submission-checks"><li v-for="item in preview.value.checklist" :key="item.id"><strong><AppIcon :name="item.complete ? 'check' : 'help'" :size="18" />{{ item.label }}</strong><span v-if="item.complete">Persyaratan isi terpenuhi</span><ul v-else><li v-for="issue in item.issues" :key="issue">{{ issue }}</li></ul></li></ul><p v-if="preview.error" class="notice error">{{ preview.error }}</p><dl v-if="draft" class="submit-summary"><div><dt>Dokumen utama</dt><dd>{{ draft.mainDocument?.name || 'Belum dipilih' }}</dd></div><div><dt>Lampiran</dt><dd>{{ draft.attachments.length }} file</dd></div><div><dt>Video utuh</dt><dd>{{ draft.video.full || 'Belum diisi' }}</dd></div><div><dt>Video ringkasan</dt><dd>{{ draft.video.summary || 'Tidak disertakan' }}</dd></div><div><dt>Studi kasus</dt><dd>{{ draft.caseStudy.mode === 'text' ? 'Laporan teks terstruktur' : draft.caseStudy.mode === 'exam_snapshot' ? 'Snapshot ujian simulasi' : draft.caseStudy.document?.name || 'Dokumen belum dipilih' }}</dd></div></dl><p class="dialog-footnote">File lokal tetap sementara. Snapshot URL tidak membekukan isi video YouTube. Data tersimpan pada browser ini, bukan server.</p><label class="consent"><input v-model="confirmed" type="checkbox">Saya sudah meninjau isi paket, menggunakan data simulasi, dan memahami bahwa versi yang dikirim dikunci.</label><div class="dialog-actions"><UButton color="neutral" variant="outline" :disabled="busy" @click="confirmDialog?.close()">Kembali periksa</UButton><UButton :disabled="!confirmed || !preview.value?.ready || !view.editable || busy" @click="submit">{{ busy ? 'Menyimpan…' : 'Kirim paket final' }}</UButton></div></dialog>
  </div>
  <section v-else class="panel unavailable"><AppIcon name="file" :size="36" /><h1>Paket tidak tersedia.</h1><p>{{ result.error }}</p><UButton :to="ukin.home.value">Kembali ke ringkasan</UButton></section>
</template>

<style scoped>
.correction-list{padding-left:20px;list-style:disc;margin:14px 0;display:grid;gap:7px}
.checklist small,.save-state,.deadline-hint,.versions-panel small{font-size:12px}
.package-page{display:grid;gap:24px}.page-heading{margin-bottom:0}.page-heading h1 span{color:var(--brand)}h2,h3{font-weight:700}.package-summary{display:grid;grid-template-columns:1fr 1.3fr 1fr;gap:24px;border:1px solid var(--line);border-radius:16px;background:white;padding:24px}.package-summary>div{display:flex;flex-direction:column;gap:5px}.meta-label{font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:750;color:var(--muted)}.package-summary strong{font-size:14px}.package-summary>div>span:not(.meta-label):not(.status-badge){color:var(--muted);font-size:12px}.package-states{align-items:flex-start;justify-content:center}.review-status{font-size:12px;line-height:1.6}.package-grid{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:24px;align-items:start}.editor-sections{display:grid;gap:24px;min-width:0}.evidence-section{padding:28px;scroll-margin-top:24px}.component-heading{display:flex;gap:16px;align-items:flex-start;margin-bottom:26px}.component-number{display:grid;place-items:center;flex:0 0 43px;height:43px;width:43px;border-radius:12px;background:var(--tint);color:var(--brand);font-size:14px;font-weight:750}.component-heading .eyebrow{font-size:10px;margin-bottom:6px}.component-heading h2{font-size:23px;margin-bottom:9px}.component-heading p:last-child{font-size:14px;line-height:1.7;color:var(--muted)}.editor-fieldset{border:0;padding:0;margin:0;min-width:0}.editor-fieldset:disabled .file-picker{opacity:.5;cursor:not-allowed}.field-heading h3{font-size:15px;letter-spacing:0;line-height:1.6}.field-heading h3 span,.video-field label span{font-size:11px;color:var(--muted);font-weight:500;margin-left:8px}.field-heading p{font-size:13px;line-height:1.7;color:var(--muted);margin-top:6px}.attachment-heading{margin-top:27px;padding-top:25px;border-top:1px solid var(--line)}.file-actions{display:flex;align-items:center;flex-wrap:wrap;gap:10px;margin:15px 0}.file-picker{position:relative;display:inline-flex;align-items:center;min-height:38px;border:1px dashed var(--control-border);border-radius:8px;padding:8px 12px;color:var(--brand-dark);font-size:13px;font-weight:650;cursor:pointer}.file-picker input{position:absolute;inset:0;opacity:0;width:100%;cursor:pointer}.file-picker:focus-within{outline:3px solid var(--focus);outline-offset:3px}.empty-file{padding:21px;border:1px dashed var(--line);border-radius:10px;color:var(--muted);font-size:13px;text-align:center;background:#fbfcfd}.file-list{display:grid;gap:12px}.component-footnote{display:flex;gap:8px;align-items:flex-start;font-size:12px;line-height:1.8;color:var(--muted);padding-top:21px;margin-top:23px;border-top:1px solid var(--line)}.component-footnote>svg{margin-top:3px;flex-shrink:0}.video-field{margin-bottom:23px}.video-field label,.text-field label{display:block;font-size:14px;font-weight:700;margin-bottom:9px}.video-field input,.text-field textarea{display:block;width:100%;border:1px solid var(--control-border);border-radius:9px;padding:11px 13px;font-size:14px;background:#fff;color:var(--ink);line-height:1.7}.video-field input:disabled,.text-field textarea:disabled{background:var(--canvas);color:var(--muted)}.video-field p{font-size:12px;line-height:1.7;color:var(--muted);margin:7px 0 11px}.video-preview:has(>*){margin-top:18px}.field-error,.video-field .field-error{color:var(--danger);font-size:13px;line-height:1.7}.case-modes{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:25px}.case-modes label{display:flex;gap:8px;align-items:center;padding:12px 16px;border:1px solid var(--line);border-radius:9px;font-size:13px;cursor:pointer}.case-modes label.selected{border-color:var(--brand);background:var(--tint);color:var(--brand-dark)}input[type=radio],input[type=checkbox]{accent-color:var(--brand)}.case-fields{display:grid;gap:24px}.text-field p{font-size:12px;color:var(--muted);margin-top:-3px;margin-bottom:10px;line-height:1.7}.text-field textarea{resize:vertical;min-height:120px}.report-hint{font-size:13px;line-height:1.7;color:var(--muted)}.case-readonly>div{margin-top:22px}.case-readonly dt{font-size:14px;font-weight:700}.case-readonly dd{font-size:14px;color:var(--muted);white-space:pre-wrap;margin:8px 0 0}.package-aside{display:grid;gap:20px;position:sticky;top:24px}.checklist-panel{padding:25px}.checklist-panel h2{font-size:23px;line-height:1.3;margin:10px 0 25px}.deadline-label{font-size:12px;color:var(--muted)}.deadline{display:block;font-size:14px;margin-top:5px}.deadline-hint{font-size:11px;margin-top:5px}.checklist{list-style:none;padding:0;margin:25px 0 0;border-top:1px solid var(--line)}.checklist li{border-bottom:1px solid var(--line)}.checklist a{display:flex;gap:11px;padding:16px 0;text-decoration:none}.check-icon{height:28px;width:28px;border-radius:8px;display:grid;place-items:center;flex-shrink:0;background:var(--canvas);color:var(--muted);margin-top:1px}.check-icon.complete{background:var(--tint);color:var(--brand)}.checklist strong{display:block;font-size:13px;line-height:1.5}.checklist small{display:block;font-size:11px;line-height:1.7;color:var(--muted);margin-top:3px}.checklist-note{font-size:12px;line-height:1.8;color:var(--muted);margin-top:16px}.save-state{display:flex;align-items:center;gap:7px;font-size:11px;color:var(--muted);margin:22px 0 12px}.save-state>span{width:6px;height:6px;background:var(--brand);border-radius:50%}.save-state>span.unsaved{background:var(--warning)}.package-actions{display:grid;gap:10px}.versions-panel h2{font-size:18px;margin-bottom:15px}.versions-panel a{display:flex;justify-content:space-between;align-items:center;gap:12px;border-top:1px solid var(--line);padding:15px 0;color:var(--brand-dark)}.versions-panel strong{display:block;font-size:13px}.versions-panel small{display:block;font-size:11px;color:var(--muted);margin-top:3px}.versions-panel p{font-size:12px;color:var(--muted);line-height:1.8}.privacy-note{display:flex;align-items:flex-start;gap:10px;padding:0 10px;font-size:12px;line-height:1.8;color:var(--muted)}.privacy-note svg{margin-top:3px;color:var(--brand)}.notice.warning{background:#fff8ed;border-color:#ead4b4;color:var(--warning)}.notice.error{background:#fff5f6;border-color:#e6c2ca;color:var(--danger)}.correction h2{font-size:18px;margin-bottom:10px}.correction p{margin-bottom:10px}.locked-panel{display:flex;gap:20px;align-items:center}.locked-panel>svg{color:var(--brand)}.locked-panel h2{font-size:22px;margin-bottom:10px}.locked-panel p{font-size:14px;line-height:1.8;color:var(--muted)}.locked-panel>a{flex-shrink:0}.unavailable{max-width:650px;margin:30px auto;text-align:center;padding:44px}.unavailable>svg{color:var(--brand);margin:auto}.unavailable h1{font-size:28px;margin:24px 0 16px;font-weight:700}.unavailable p{color:var(--muted);margin-bottom:24px}.submission-dialog{border:1px solid var(--line);border-radius:20px;padding:28px;width:min(610px,calc(100vw - 32px));max-height:calc(100dvh - 40px);overflow:auto;margin:auto;color:var(--ink)}.submission-dialog::backdrop{background:#142b4066;backdrop-filter:blur(3px)}.dialog-heading{display:flex;justify-content:space-between;align-items:center;margin-bottom:19px}.dialog-close{display:grid;place-items:center;border:1px solid var(--line);width:36px;height:36px;border-radius:8px;background:white}.submission-dialog h2{font-size:27px;margin:8px 0 14px}.submission-dialog>p:not(.eyebrow){font-size:14px;line-height:1.8;color:var(--muted)}.submission-checks{list-style:none;padding:0;margin:23px 0}.submission-checks>li{padding:12px 0;border-top:1px solid var(--line)}.submission-checks strong{display:flex;align-items:center;gap:9px;font-size:14px}.submission-checks span,.submission-checks ul{display:block;font-size:12px;color:var(--muted);margin:7px 0 0 27px}.submission-checks ul{color:var(--warning);list-style:disc;padding-left:15px}.submit-summary{padding:17px;background:var(--canvas);border-radius:10px;margin:18px 0}.submit-summary>div{display:grid;grid-template-columns:130px 1fr;gap:12px;margin:7px 0;font-size:12px}.submit-summary dt{color:var(--muted)}.submit-summary dd{margin:0;word-break:break-word}.submission-dialog .dialog-footnote{font-size:12px}.consent{display:flex;gap:11px;align-items:flex-start;font-size:13px;line-height:1.8;margin:20px 0}.consent input{margin-top:6px;width:16px;height:16px;flex-shrink:0}.dialog-actions{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:10px;margin-top:22px}.preview-error{margin-top:20px}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
@media(max-width:1200px){.package-grid{grid-template-columns:minmax(0,1fr) 270px;gap:18px}.evidence-section{padding:24px}.package-summary{grid-template-columns:1fr 1fr}.package-states{grid-column:1/-1;flex-direction:row!important;align-items:center;justify-content:flex-start;gap:16px!important}.checklist-panel{padding:21px}}
@media(max-width:1000px){.package-grid{grid-template-columns:1fr}.package-aside{position:static;grid-template-columns:1fr 1fr}.checklist-panel{grid-row:span 2}.privacy-note{align-self:start}.locked-panel{align-items:flex-start;flex-wrap:wrap}.locked-panel>div{flex:1;min-width:220px}}
@media(max-width:650px){.package-summary{grid-template-columns:1fr;padding:21px;gap:18px}.package-states{flex-direction:column!important;align-items:flex-start;gap:6px!important}.package-aside{grid-template-columns:1fr}.checklist-panel{grid-row:auto}.evidence-section{padding:21px}.component-heading{gap:12px}.component-heading h2{font-size:21px}.component-number{width:35px;height:35px;flex-basis:35px;border-radius:10px;font-size:12px}.component-heading .eyebrow{font-size:9px}.file-actions{align-items:stretch;flex-direction:column}.file-picker{justify-content:center}.submission-dialog{padding:23px}.submit-summary>div{grid-template-columns:1fr;gap:2px;margin:12px 0}.dialog-actions>*{flex:1;justify-content:center}.case-modes label{flex:1;justify-content:center;padding:11px}.locked-panel{padding:22px}}
.checklist small,.save-state,.deadline-hint,.versions-panel small{font-size:12px}
</style>
