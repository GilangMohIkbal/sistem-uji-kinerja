<script setup lang="ts">
import type { EvidenceContent, EvidenceFile } from '~/domain/types'
import { normalizeYouTubeUrl } from '~/domain/evidence'

const props = withDefaults(defineProps<{ content: EvidenceContent; canRestore?: boolean; versionId?: string }>(), { canRestore: false, versionId: '' })
const ukin = useUkin()
const restoringId = ref('')
const fileMessage = ref('')
const restoreFailed = ref(false)
const sections = [
  { key: 'context', label: 'Konteks dan masalah' },
  { key: 'action', label: 'Tindakan yang dilakukan' },
  { key: 'result', label: 'Bukti atau hasil' },
  { key: 'reflection', label: 'Refleksi dan tindak lanjut' },
] as const

function fileUrl(file: EvidenceFile) {
  void ukin.snapshot.value
  try { return ukin.getFileUrl(file.id) } catch { return null }
}
function videoId(url: string): string {
  if (!url) return ''
  try { return normalizeYouTubeUrl(url)?.videoId ?? '' } catch { return '' }
}
async function restore(file: EvidenceFile, selected: File) {
  if (!props.canRestore || !props.versionId || restoringId.value) return
  restoringId.value = file.id
  fileMessage.value = ''
  try {
    await ukin.restoreLocalFile(props.versionId, file.id, selected)
    restoreFailed.value = false
    fileMessage.value = 'Isi file cocok. Bukti dapat dibuka kembali selama halaman ini aktif.'
  } catch (error) {
    restoreFailed.value = true
    fileMessage.value = error instanceof Error ? error.message : 'File belum dapat dipulihkan.'
  } finally { restoringId.value = '' }
}
watch(() => props.versionId, () => { fileMessage.value = ''; restoringId.value = '' })
</script>

<template>
  <div class="evidence-read-view">
    <p v-if="fileMessage" class="notice restore-message" :class="{ error: restoreFailed }" role="status">{{ fileMessage }}</p>
    <section class="panel evidence-component" aria-labelledby="read-perangkat-title">
      <div class="component-heading"><span class="component-number">01</span><div><p class="eyebrow">PERANGKAT</p><h2 id="read-perangkat-title">Rencana di balik praktik baik</h2></div><AppIcon name="book" /></div>
      <p class="component-copy">Dokumen utama dan lampiran pendukung yang disertakan pada versi paket ini.</p>
      <EvidenceFileCard v-if="content.mainDocument" :file="content.mainDocument" :url="fileUrl(content.mainDocument)" :can-restore="canRestore" :restoring="restoringId === content.mainDocument.id" @restore="restore(content.mainDocument!, $event)" />
      <p v-else class="missing-content">Dokumen utama belum tersedia pada snapshot ini.</p>
      <div v-if="content.attachments.length" class="attachment-list"><h3>Lampiran pendukung</h3><EvidenceFileCard v-for="file in content.attachments" :key="file.id" :file="file" :url="fileUrl(file)" :can-restore="canRestore" :restoring="restoringId === file.id" @restore="restore(file, $event)" /></div>
      <p v-else class="small-note">Tidak ada lampiran pendukung. Lampiran bersifat opsional.</p>
    </section>

    <section class="panel evidence-component" aria-labelledby="read-video-title">
      <div class="component-heading"><span class="component-number">02</span><div><p class="eyebrow">VIDEO PRAKTIK</p><h2 id="read-video-title">Lihat proses pembelajaran</h2></div><AppIcon name="video" /></div>
      <p class="component-copy">Snapshot menyimpan tautan. Isi video di YouTube dapat berubah di luar aplikasi ini.</p>
      <div class="video-list"><div><h3>Video utuh</h3><EvidenceVideo v-if="videoId(content.video.full)" :video-id="videoId(content.video.full)" title="Video utuh" :demo="videoId(content.video.full) === 'M7lc1UVf-VE'" /><p v-else class="missing-content">Tautan video utuh tidak tersedia atau formatnya belum sesuai.</p></div><div v-if="content.video.summary"><h3>Video ringkasan</h3><EvidenceVideo v-if="videoId(content.video.summary)" :video-id="videoId(content.video.summary)" title="Video ringkasan" :demo="videoId(content.video.summary) === 'M7lc1UVf-VE'" /><p v-else class="missing-content">Format tautan video ringkasan belum sesuai.</p></div><p v-else class="small-note">Video ringkasan tidak disertakan.</p></div>
    </section>

    <section class="panel evidence-component" aria-labelledby="read-case-title">
      <div class="component-heading"><span class="component-number">03</span><div><p class="eyebrow">STUDI KASUS</p><h2 id="read-case-title">Belajar dari pengalaman</h2></div><AppIcon name="file" /></div>
      <p v-if="content.caseStudy.mode === 'exam_snapshot'" class="notice case-provenance">{{ content.caseStudy.provenance || 'Simulasi data dari web ujian. Tidak ada integrasi ke sistem ujian nyata.' }}</p>
      <template v-if="content.caseStudy.mode === 'document'"><p class="component-copy">Laporan studi kasus disertakan sebagai dokumen.</p><EvidenceFileCard v-if="content.caseStudy.document" :file="content.caseStudy.document" :url="fileUrl(content.caseStudy.document)" :can-restore="canRestore" :restoring="restoringId === content.caseStudy.document.id" @restore="restore(content.caseStudy.document!, $event)" /><p v-else class="missing-content">Dokumen laporan belum tersedia.</p></template>
      <div v-else class="case-sections"><section v-for="section in sections" :key="section.key"><h3>{{ section.label }}</h3><p>{{ content.caseStudy[section.key] || 'Belum diisi pada snapshot ini.' }}</p></section></div>
    </section>
  </div>
</template>

<style scoped>
.evidence-read-view{display:grid;gap:22px;min-width:0}.evidence-component{min-width:0;padding:28px}.component-heading{display:flex;align-items:center;gap:15px}.component-heading>svg{margin-left:auto;color:var(--brand);width:25px;height:25px}.component-number{width:42px;height:42px;flex:0 0 42px;border-radius:12px;background:var(--tint);color:var(--brand-dark);display:grid;place-items:center;font-weight:750;font-size:14px}.component-heading .eyebrow{font-size:11px;margin-bottom:5px}.component-heading h2{font-size:21px;font-weight:750;line-height:1.3}.component-copy{font-size:14px;line-height:1.8;color:var(--muted);margin:20px 0}.attachment-list{display:grid;gap:12px;margin-top:24px}.attachment-list h3,.video-list h3,.case-sections h3{font-size:15px;font-weight:700;line-height:1.5}.small-note{font-size:12px;color:var(--muted);margin-top:16px;line-height:1.7}.video-list{display:grid;gap:24px}.video-list h3{margin-bottom:12px}.missing-content{padding:15px 18px;border-radius:9px;background:#fff8ef;color:var(--warning);font-size:14px;line-height:1.7;margin-top:16px}.case-provenance{margin-top:20px}.case-sections{display:grid;gap:24px;margin-top:25px}.case-sections section+section{border-top:1px solid var(--line);padding-top:24px}.case-sections p{white-space:pre-wrap;overflow-wrap:anywhere;color:var(--muted);font-size:15px;line-height:1.85;margin-top:10px}.restore-message.error{background:#fff5f5;border-color:#e6bdc2;color:var(--danger)}@media(max-width:600px){.evidence-component{padding:21px}.component-heading{gap:11px}.component-heading h2{font-size:19px}.component-heading>svg{display:none}.component-number{width:35px;height:35px;flex-basis:35px}.component-copy{font-size:14px}}
</style>
