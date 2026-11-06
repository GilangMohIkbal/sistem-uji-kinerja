<script setup lang="ts">
import { evidenceChoices } from '~/domain/assessment'
import { allEvidenceFiles } from '~/domain/evidence'
import type { ComponentId, EvidenceVersion } from '~/domain/types'
const props = defineProps<{ assignmentId: string; evidence: EvidenceVersion; component: ComponentId }>()
const { getAssessmentFileUrl, snapshot } = useUkin()
const choices = computed(() => evidenceChoices(props.evidence, props.component))
const selected = ref(choices.value[0]?.id ?? '')
const file = computed(() => allEvidenceFiles(props.evidence.content).find(f => f.id === selected.value))
const url = computed(() => { void snapshot.value; if (!file.value) return null; try { return getAssessmentFileUrl(props.assignmentId, file.value.id) } catch { return null } })
const parts = [{ key: 'context' as const, label: 'Konteks dan tantangan' }, { key: 'action' as const, label: 'Tindakan yang dilakukan' }, { key: 'result' as const, label: 'Bukti hasil' }, { key: 'reflection' as const, label: 'Refleksi' }]
</script>
<template>
  <div>
    <label v-if="choices.length > 1" class="assess-field">Pilih bukti<select v-model="selected"><option v-for="c in choices" :key="c.id" :value="c.id">{{ c.label }}</option></select></label>
    <template v-if="file">
      <div class="assess-evidence-head"><strong>{{ file.name }}</strong><span class="assess-caption">{{ file.source === 'sample' ? 'Dokumen contoh fiktif' : 'File lokal sementara' }}</span><a v-if="url" :href="url" target="_blank" rel="noopener noreferrer">Buka dokumen di tab baru ↗</a></div>
      <iframe v-if="url && file.mime === 'application/pdf'" :src="url" :title="`Bukti ${file.name}`" class="assess-document" />
      <img v-else-if="url && file.mime.startsWith('image/')" :src="url" :alt="file.name" class="assess-image" />
      <p v-else-if="!url" class="assess-notice">File lokal tidak tersedia pada sesi ini. Tandai kendala teknis dan minta peserta memilih ulang file identik melalui paketnya. Jangan memberi skor nol.</p>
      <p v-else class="assess-caption">Pratinjau format ini tidak tersedia. Gunakan tautan dokumen di atas.</p>
    </template>
    <div v-else-if="component === 'studi_kasus' && evidence.content.caseStudy.mode !== 'document'" class="case-reading">
      <p v-if="evidence.content.caseStudy.provenance" class="assess-notice">{{ evidence.content.caseStudy.provenance }}</p>
      <section v-for="p in parts" :key="p.key"><h3>{{ p.label }}</h3><p>{{ evidence.content.caseStudy[p.key] || 'Belum tersedia.' }}</p></section>
    </div>
    <p v-else class="assess-notice">Bukti komponen ini tidak tersedia.</p>
    <p class="assess-caption">Snapshot paket v{{ evidence.version }} · {{ evidence.receipt }}. File dan tautan mengikuti batas penyimpanan demo.</p>
  </div>
</template>
