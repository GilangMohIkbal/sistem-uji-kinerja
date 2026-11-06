<script setup lang="ts">
import type { EvidenceFile } from '~/domain/types'

const props = withDefaults(defineProps<{
  file: EvidenceFile
  url: string | null
  canRemove?: boolean
  canRestore?: boolean
  restoring?: boolean
}>(), { canRemove: false, canRestore: false, restoring: false })
const emit = defineEmits<{ remove: []; restore: [file: File] }>()
const picker = ref<HTMLInputElement | null>(null)
const sizeLabel = computed(() => props.file.size >= 1024 * 1024
  ? `${(props.file.size / (1024 * 1024)).toLocaleString('id-ID', { maximumFractionDigits: 2 })} MiB`
  : `${(props.file.size / 1024).toLocaleString('id-ID', { maximumFractionDigits: 1 })} KiB`)
const typeLabel = computed(() => props.file.mime === 'application/pdf' ? 'PDF' : props.file.mime === 'image/png' ? 'PNG' : 'JPEG')
function restore(event: Event) {
  const input = event.target as HTMLInputElement
  const selected = input.files?.[0]
  if (selected) emit('restore', selected)
  input.value = ''
}
</script>

<template>
  <article class="file-card" :class="{ unavailable: !url }">
    <div class="file-card-main">
      <span class="file-symbol"><AppIcon name="file" :size="24" /></span>
      <div class="file-copy"><h4>{{ file.name }}</h4><p>{{ typeLabel }} <span aria-hidden="true">·</span> {{ sizeLabel }} <span aria-hidden="true">·</span> {{ file.source === 'sample' ? 'Dokumen contoh bawaan' : 'Berkas dari perangkat' }}</p></div>
      <span class="file-status" :class="{ missing: !url }">{{ url ? 'Dapat dibuka' : 'Perlu dipilih ulang' }}</span>
    </div>
    <p v-if="file.source === 'sample'" class="file-explanation">Konten pedagogi fiktif untuk demo. Dokumen bawaan tetap tersedia setelah memuat ulang halaman.</p>
    <p v-else-if="url" class="file-explanation">Isi berkas tersedia sementara pada tab ini, bukan unggahan ke server. Setelah memuat ulang, pilih ulang berkas yang sama.</p>
    <p v-else class="file-explanation missing-message">Isi berkas tidak tersedia pada sesi ini. Metadata tetap tersimpan; tautan buka baru tersedia setelah pemilik memulihkan berkas yang sama.</p>
    <p v-if="file.source === 'local' && !file.sha256" class="digest-notice">Sidik isi SHA-256 tidak tersedia. Berkas ini belum dapat dipakai untuk pengiriman final; pilih dokumen bawaan atau pilih ulang pada browser yang mendukung.</p>
    <div class="file-actions">
      <a v-if="url" :href="url" target="_blank" rel="noopener" class="open-file">Buka {{ typeLabel }} <AppIcon name="arrow-right" :size="16" /></a>
      <template v-if="canRestore && !url && file.source === 'local' && file.sha256">
        <input ref="picker" type="file" class="restore-input" accept="application/pdf,image/png,image/jpeg,.pdf,.png,.jpg,.jpeg" :disabled="restoring" :aria-label="`Pilih ulang ${file.name}`" @change="restore">
        <button class="restore-button" type="button" :disabled="restoring" @click="picker?.click()">{{ restoring ? 'Memeriksa isi berkas…' : 'Pilih ulang berkas yang sama' }}</button>
      </template>
      <button v-if="canRemove" class="remove-button" type="button" :disabled="restoring" :aria-label="`Hapus ${file.name} dari draf`" @click="emit('remove')">Hapus dari draf</button>
    </div>
    <p v-if="canRestore && !url && file.sha256" class="restore-help">Isi dibandingkan memakai SHA-256. Berkas berbeda memerlukan revisi paket; nama dan ukuran saja tidak cukup.</p>
  </article>
</template>

<style scoped>
.file-card{background:var(--paper);border:1px solid var(--line);border-radius:12px;padding:19px}.file-card.unavailable{border-color:#d9c6aa;background:#fffdf9}.file-card-main{display:flex;align-items:center;gap:12px}.file-symbol{width:42px;height:48px;display:grid;place-items:center;border-radius:9px;background:var(--tint);color:var(--brand-dark);flex-shrink:0}.file-copy{flex:1;min-width:0}.file-copy h4{font-size:14px;font-weight:700;line-height:1.5;overflow-wrap:anywhere;letter-spacing:0}.file-copy p{font-size:12px;color:var(--muted);line-height:1.6;margin-top:4px}.file-copy p span{margin:0 4px}.file-status{background:var(--tint);color:var(--brand-dark);font-weight:650;font-size:11px;padding:4px 8px;border-radius:6px;flex-shrink:0}.file-status.missing{color:var(--warning);background:#fff1de}.file-explanation{font-size:12px;color:var(--muted);line-height:1.75;margin-top:13px}.missing-message,.digest-notice{color:var(--warning)}.digest-notice{font-size:12px;line-height:1.75;margin-top:9px}.file-actions{display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin-top:13px}.open-file,.restore-button{display:inline-flex;align-items:center;gap:7px;color:var(--brand-dark);font-size:13px;font-weight:700;min-height:35px}.open-file:hover{text-decoration:underline}.restore-button{border:1px solid var(--control-border);border-radius:7px;padding:7px 11px;background:white;min-height:40px}.restore-button:disabled{opacity:.65}.remove-button{font-size:12px;min-height:35px;color:var(--danger);margin-left:auto;padding:4px 6px}.restore-help{font-size:12px;color:var(--muted);line-height:1.7;margin-top:8px}.restore-input{display:none}@media(max-width:540px){.file-card-main{flex-wrap:wrap}.file-status{margin-left:54px}.file-copy{flex-basis:calc(100% - 60px)}.file-card{padding:16px}.remove-button{margin-left:0}}
</style>
