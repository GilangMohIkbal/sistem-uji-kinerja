<script setup lang="ts">
defineProps<{ error: { statusCode: number } }>()
</script>
<template><main class="error-page"><BrandMark /><p class="eyebrow">{{ error.statusCode }}</p><h1>Halaman belum tersedia.</h1><p>Ruang UKIN masih bertumbuh. Kembali ke beranda untuk melanjutkan demo.</p><button @click="clearError({ redirect: '/' })">Kembali ke beranda <AppIcon name="arrow-right" /></button></main></template>
<style scoped>.error-page{max-width:700px;margin:10vh auto;padding:24px}.eyebrow{margin:60px 0 18px}h1{font-size:40px;font-weight:750}p:not(.eyebrow){margin:20px 0;color:var(--muted)}button{display:flex;gap:12px;align-items:center;background:var(--brand);color:white;border:0;border-radius:9px;padding:13px 20px;font-weight:600}</style>
