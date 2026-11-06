<script setup lang="ts">
defineProps<{ light?: boolean }>()
</script>
<template>
  <NuxtLink to="/" class="brand-mark" :class="{ light }" aria-label="UKIN PPG UNJ, beranda">
    <span class="brand-symbol" aria-hidden="true"><svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M5 5.5h7a3 3 0 0 1 3 3V23a5 5 0 0 0-5-3H5V5.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M15 8.5a3 3 0 0 1 3-3h5v9M18 20l2 2 5-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
    <span><strong>UKIN <span class="brand-separator">·</span> PPG UNJ</strong><small>Universitas Negeri Jakarta</small></span>
  </NuxtLink>
</template>
<style scoped>
.brand-mark{display:inline-flex;align-items:center;gap:12px;text-decoration:none;color:var(--ink);flex-shrink:0}.brand-symbol{width:46px;height:46px;display:grid;place-items:center;background:var(--brand-gradient);color:white;border-radius:13px 13px 13px 4px;box-shadow:0 4px 12px #007f6d1a}.brand-mark strong{display:block;font-size:15px;letter-spacing:-.03em}.brand-mark small{display:block;color:var(--muted);font-size:11px;margin-top:1px}.brand-separator{color:var(--brand)}.light{color:white}.light small{color:#c2e4da}.light .brand-symbol{background:#ffffff14;box-shadow:none;border:1px solid #ffffff28}.light .brand-separator{color:var(--accent)}
</style>
