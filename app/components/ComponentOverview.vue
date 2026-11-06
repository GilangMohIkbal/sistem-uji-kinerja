<script setup lang="ts">
import type { ComponentId } from '../domain/types'

defineProps<{
  components: { id: ComponentId; label: string; description: string; prepared: boolean | null }[]
  showPrepared?: boolean
}>()
const iconFor = { perangkat: 'book', video: 'video', studi_kasus: 'file' } as const
</script>

<template>
  <div class="component-list">
    <article v-for="(component, index) in components" :key="component.id" class="component-item">
      <span class="component-icon"><AppIcon :name="iconFor[component.id]" /></span>
      <div class="component-copy">
        <p class="component-number">KOMPONEN 0{{ index + 1 }}</p>
        <h3>{{ component.label }}</h3>
        <p>{{ component.description }}</p>
        <span v-if="showPrepared" class="component-state" :class="{ prepared: component.prepared }">
          <AppIcon v-if="component.prepared" name="check" />
          {{ component.prepared ? 'Disiapkan' : 'Belum disiapkan' }}
        </span>
      </div>
    </article>
  </div>
</template>

<style scoped>
h3{font-weight:700}
.component-list{display:grid;gap:0}.component-item{display:flex;gap:20px;padding:25px 0;border-bottom:1px solid var(--line)}.component-item:last-child{border-bottom:0;padding-bottom:0}.component-icon{display:grid;place-items:center;flex:0 0 48px;height:48px;background:var(--tint);color:var(--brand);border-radius:13px}.component-icon svg{width:24px;height:24px}.component-number{font-size:12px!important;letter-spacing:1.1px;font-weight:750;color:var(--brand)!important;margin:1px 0 6px!important}.component-copy h3{font-size:17px;margin:0 0 7px;line-height:1.4}.component-copy>p{margin:0;color:var(--muted);font-size:14px;line-height:1.7}.component-state{display:inline-flex;align-items:center;gap:5px;margin-top:11px;font-size:12px;font-weight:650;color:var(--muted);background:var(--canvas);padding:5px 9px;border-radius:6px}.component-state.prepared{color:var(--brand-dark);background:var(--tint)}.component-state svg{width:14px;height:14px}@media(max-width:560px){.component-item{gap:14px}.component-icon{flex-basis:40px;height:40px}.component-copy h3{font-size:16px}}
</style>

