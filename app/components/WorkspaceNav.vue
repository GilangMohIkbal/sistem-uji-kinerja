<script setup lang="ts">
import { roleLabel } from '~/domain/selectors'
const { user, home, snapshot } = useUkin()
const interviewEnabled = computed(() => snapshot.value.data.periods.some(p => p.interviewEnabled && !p.archived && (user.value?.role === 'pengelola' ? user.value.managedPeriodIds?.includes(p.id) : snapshot.value.data.attempts.some(a => a.periodId === p.id && (user.value?.role === 'peserta' ? a.participantId === user.value.id : snapshot.value.data.assignments.some(x => x.active && x.attemptId === a.id && x.examinerId === user.value?.id))))))
defineEmits<{ navigate: [] }>()
</script>
<template>
  <div class="nav-content">
    <div><BrandMark /><div class="nav-context"><p class="eyebrow">Ruang kinerja</p><h2>{{ user ? roleLabel(user) : 'UKIN' }}</h2><p>Simulasi periode 2026</p></div></div>
    <nav aria-label="Navigasi ruang kerja">
      <NuxtLink :to="home" @click="$emit('navigate')"><AppIcon name="grid" /> Ringkasan</NuxtLink>
      <NuxtLink v-if="user?.role === 'peserta'" to="/app/paket" @click="$emit('navigate')"><AppIcon name="file" /> Paket UKIN</NuxtLink>
      <NuxtLink v-if="user?.role === 'pengelola'" to="/app/pemeriksaan" @click="$emit('navigate')"><AppIcon name="check" /> Kelengkapan paket</NuxtLink>
      <NuxtLink v-if="user?.role === 'penguji'" to="/app/penugasan" @click="$emit('navigate')"><AppIcon name="file" /> Penugasan saya</NuxtLink>
      <NuxtLink v-if="user?.role === 'penguji'" to="/app/riwayat" @click="$emit('navigate')"><AppIcon name="book" /> Riwayat penilaian</NuxtLink>
      <NuxtLink v-if="user?.role === 'pengelola'" to="/app/progres-penilaian" @click="$emit('navigate')"><AppIcon name="grid" /> Progres penilaian</NuxtLink>
      <NuxtLink v-if="user?.role === 'pengelola'" to="/app/pengelolaan" @click="$emit('navigate')"><AppIcon name="book" /> Pengelolaan</NuxtLink>
      <NuxtLink v-if="user?.role === 'pengelola'" to="/app/monitoring" @click="$emit('navigate')"><AppIcon name="grid" /> Monitoring</NuxtLink>
      <NuxtLink v-if="user?.role !== 'peserta'" to="/app/moderasi" @click="$emit('navigate')"><AppIcon name="shield" /> Moderasi</NuxtLink>
      <NuxtLink v-if="user?.role === 'pengelola'" to="/app/publikasi" @click="$emit('navigate')"><AppIcon name="check" /> Publikasi hasil</NuxtLink>
      <NuxtLink v-if="user?.role === 'peserta'" to="/app/hasil" @click="$emit('navigate')"><AppIcon name="check" /> Hasil publikasi</NuxtLink>
      <NuxtLink v-if="interviewEnabled" to="/app/wawancara" @click="$emit('navigate')"><AppIcon name="clock" /> Wawancara</NuxtLink>
      <NuxtLink to="/app/panduan" @click="$emit('navigate')"><AppIcon name="help" /> Panduan demo</NuxtLink>
    </nav>
    <div class="nav-bottom"><div class="nav-note"><AppIcon name="book" :size="26" /><strong>Praktik yang bermakna.</strong><p>Hadirkan bukti, temukan refleksi, tumbuh sebagai pendidik.</p></div><p class="nav-caption">Prototipe UKIN · Semua data fiktif</p></div>
  </div>
</template>
<style scoped>
.nav-content{display:flex;flex-direction:column;min-height:100%;padding:28px 20px;gap:28px}.nav-context{padding:35px 10px 0}.nav-context h2{font-size:21px;margin:10px 0 8px;font-weight:700}.nav-context>p:last-child{font-size:12px;color:var(--muted)}nav{display:grid;gap:8px}nav a{display:flex;align-items:center;gap:12px;padding:13px 14px;border-radius:9px;color:var(--muted);font-size:14px;font-weight:600}nav a:hover{background:var(--canvas)}nav a.router-link-exact-active{background:var(--brand);color:white;box-shadow:0 6px 18px #007f6d18}.nav-bottom{margin-top:auto;padding-top:60px}.nav-note{padding:20px 16px;background:var(--tint);border:1px solid #c2e6da;border-radius:12px;color:var(--brand-dark)}.nav-note strong{display:block;font-size:13px;margin:12px 0 7px}.nav-note p{font-size:12px;line-height:1.8;color:var(--muted)}.nav-caption{font-size:10px;color:var(--muted);margin-top:22px;text-align:center}
</style>
