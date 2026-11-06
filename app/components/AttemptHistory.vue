<script setup lang="ts">
import type { AttemptHistoryRow } from '~/domain/types'
defineProps<{ attempts: AttemptHistoryRow[]; currentAttemptId: string }>()
</script>

<template>
  <section v-if="attempts.some(attempt => attempt.attemptId !== currentAttemptId)" class="panel attempt-history" aria-label="Riwayat percobaan peserta">
    <p class="eyebrow">RIWAYAT PERCOBAAN</p>
    <h2>Bukti lama tetap terpisah.</h2>
    <p>Setiap percobaan memiliki paket dan nomor pengirimannya sendiri. Perbaikan versi tidak menimpa percobaan sebelumnya.</p>
    <ul>
      <li v-for="attempt in attempts" :key="attempt.attemptId">
        <div><strong>Percobaan {{ attempt.attemptNumber }} <span v-if="attempt.attemptId === currentAttemptId">· Sedang dibuka</span></strong><small>{{ attempt.periodName }} · {{ attempt.archived ? 'Arsip' : 'Aktif' }}</small></div>
        <NuxtLink :to="{ path: '/app/bukti-kirim', query: { id: attempt.evidenceVersionId } }" class="text-link">Buka bukti versi {{ attempt.version }} <AppIcon name="arrow-right" :size="16" /></NuxtLink>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.attempt-history h2{font-size:22px;font-weight:700;margin:8px 0 12px}.attempt-history>p:not(.eyebrow){font-size:14px;line-height:1.8;color:var(--muted)}.attempt-history ul{list-style:none;padding:0;margin:20px 0 0}.attempt-history li{display:flex;align-items:center;justify-content:space-between;gap:18px;border-top:1px solid var(--line);padding:16px 0}.attempt-history strong{display:block;font-size:14px}.attempt-history strong span{color:var(--brand-dark);font-weight:500}.attempt-history small{display:block;font-size:12px;color:var(--muted);margin-top:6px}.attempt-history a{font-size:13px;flex-shrink:0}@media(max-width:650px){.attempt-history li{align-items:flex-start;flex-direction:column;gap:12px}}
</style>
