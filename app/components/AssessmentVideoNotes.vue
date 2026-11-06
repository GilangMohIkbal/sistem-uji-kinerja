<script setup lang="ts">
import { evidenceChoices, formatTimestamp, parseTimestamp } from '~/domain/assessment'
import type { RubricVersion, VideoNote } from '~/domain/assessment-types'
import type { EvidenceVersion } from '~/domain/types'
const props = defineProps<{ modelValue: VideoNote[]; evidence: EvidenceVersion; rubric: RubricVersion; readonly: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: VideoNote[]] }>()
const videos = computed(() => evidenceChoices(props.evidence, 'video'))
const selectedId = ref(videos.value[0]?.id ?? '')
const selected = computed(() => videos.value.find(v => v.id === selectedId.value))
const player = ref<{ position: () => { seconds: number; durationSeconds: number | null } | null; seek: (seconds: number) => boolean } | null>(null)
const timestamp = ref('00:00'), note = ref(''), indicator = ref(''), message = ref('')
const captured = ref<{ text: string; evidenceId: string; duration: number | null } | null>(null)
const jumpUrl = ref('')
function capture() {
  const p = player.value?.position()
  if (!p || !selected.value) { message.value = 'Pemutar belum tersedia. Isi timestamp manual setelah menonton di YouTube.'; return }
  timestamp.value = formatTimestamp(p.seconds)
  captured.value = { text: timestamp.value, evidenceId: selected.value.id, duration: p.durationSeconds }
  message.value = 'Waktu pemutar diambil. Catatan tetap perlu ditambahkan dan draf disimpan.'
}
function add() {
  try {
    if (!selected.value || !note.value.trim()) throw new Error('Pilih video dan isi catatan pengamatan.')
    const seconds = parseTimestamp(timestamp.value), current = player.value?.position()
    const fromPlayer = captured.value?.text === timestamp.value && captured.value.evidenceId === selected.value.id
    const duration = current?.durationSeconds ?? (fromPlayer ? captured.value?.duration ?? null : null)
    if (duration !== null && seconds > duration) throw new Error('Timestamp melampaui durasi video yang teramati.')
    if (props.modelValue.length >= 100) throw new Error('Batas teknis 100 catatan per assessment tercapai.')
    emit('update:modelValue', [...props.modelValue, { id: crypto.randomUUID(), evidenceVersionId: props.evidence.id, evidenceId: selected.value.id, videoId: selected.value.videoId,
      seconds, durationSeconds: duration, source: fromPlayer ? 'player' : 'manual', indicatorId: indicator.value || null, text: note.value.trim() }])
    note.value = ''; message.value = 'Catatan ditambahkan ke editor. Simpan draf untuk menyimpannya.'
  } catch (e) { message.value = e instanceof Error ? e.message : 'Catatan belum dapat ditambahkan.' }
}
async function jump(n: VideoNote) {
  const sameVideo = selectedId.value === n.evidenceId
  selectedId.value = n.evidenceId
  await nextTick()
  jumpUrl.value = `https://www.youtube.com/watch?v=${n.videoId}&t=${n.seconds}s`
  message.value = sameVideo && player.value?.seek(n.seconds) ? `Pemutar diarahkan ke ${formatTimestamp(n.seconds)}.` : 'Pemutar video terkait belum siap. Muat pemutar lalu tekan catatan kembali, atau buka timestamp di YouTube.'
}
</script>
<template>
  <div class="video-notebook">
    <label class="assess-field">Bukti video<select v-model="selectedId"><option v-for="v in videos" :key="v.id" :value="v.id">{{ v.label }}</option></select></label>
    <EvidenceVideo v-if="selected" ref="player" :video-id="selected.videoId" :title="selected.label" />
    <p v-else class="assess-notice">Tidak ada tautan video yang valid pada versi paket ini.</p>
    <div v-if="!readonly" class="note-composer">
      <h3>Catatan pada momen penting</h3>
      <div class="assess-inline"><label class="assess-field">Waktu (detik / mm:ss)<input v-model="timestamp" inputmode="text" placeholder="01:30" @input="captured = null" /></label><UButton variant="soft" @click="capture">Ambil waktu pemutar</UButton></div>
      <label class="assess-field">Indikator terkait (opsional)<select v-model="indicator"><option value="">Catatan umum video</option><option v-for="i in rubric.components.find(c => c.id === 'video')?.indicators" :key="i.id" :value="i.id">{{ i.id }} · {{ i.title }}</option></select></label>
      <label class="assess-field">Pengamatan Anda<textarea v-model="note" maxlength="5000" rows="3" placeholder="Apa yang tampak pada momen ini dan relevansinya terhadap rubrik?" /></label>
      <UButton variant="soft" :disabled="!selected" @click="add">Tambahkan catatan</UButton>
      <p class="assess-caption">Fallback manual tersedia. Timestamp disimpan sebagai detik pada video dan versi paket ini; bukan verifikasi otomatis isi video.</p>
    </div>
    <p v-if="message" class="assess-notice" role="status">{{ message }} <a v-if="jumpUrl" :href="jumpUrl" target="_blank" rel="noopener noreferrer">Buka timestamp di YouTube</a></p>
    <ol class="video-notes">
      <li v-for="n in modelValue" :key="n.id"><button class="timestamp-link" @click="jump(n)">{{ formatTimestamp(n.seconds) }} <span>{{ videos.find(v => v.id === n.evidenceId)?.label }} · {{ n.indicatorId || 'Umum' }}</span></button><p>{{ n.text }}</p><small>{{ n.source === 'manual' ? 'Timestamp manual' : 'Dari pemutar' }} · Paket v{{ evidence.version }}</small><button v-if="!readonly" class="remove-note" :aria-label="`Hapus catatan ${formatTimestamp(n.seconds)}`" @click="emit('update:modelValue', modelValue.filter(v => v.id !== n.id))">Hapus</button></li>
    </ol>
    <p v-if="!modelValue.length" class="assess-caption">Belum ada catatan video pada assessment Anda.</p>
  </div>
</template>
