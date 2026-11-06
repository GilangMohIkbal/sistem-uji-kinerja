<script setup lang="ts">
withDefaults(defineProps<{ name: string; size?: number }>(), { size: 20 })
const paths: Record<string, string> = {
 'arrow-right': 'M4 12h16m-6-6 6 6-6 6', 'arrow-left':'M20 12H4m6-6-6 6 6 6',
 check: 'm5 12 4 4L19 6', book: 'M12 5c-3-3-7-2-9-1v15c3-1 6-1 9 1m0-15c3-3 7-2 9-1v15c-3-1-6-1-9 1V5',
 video: 'M3 5h12v14H3V5Zm12 5 6-4v12l-6-4', file: 'M14 3H5v18h14V8l-5-5Zm0 0v5h5M8 12h8M8 16h6',
 user: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2',
 users: 'M14 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM4 20v-2a7 7 0 0 1 14 0v2M18 4a3 3 0 0 1 0 6m2 4a5 5 0 0 1 2 4v2',
 grid: 'M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z',
 calendar: 'M4 5h16v16H4V5Zm0 5h16M8 3v4m8-4v4M8 14h2m4 0h2m-8 3h2',
 clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4v5l3 2',
 help: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM9.5 9a2.5 2.5 0 1 1 4 2c-1.5.8-1.5 1.4-1.5 2M12 17h.01',
 logout: 'M9 4H4v16h5m-1-8h13m-5-5 5 5-5 5', switch: 'M4 7h16m-4-4 4 4-4 4M20 17H4m4-4-4 4 4 4',
 menu: 'M4 6h16M4 12h16M4 18h16', close:'m6 6 12 12M6 18 18 6', reset:'M3 10a9 9 0 1 1 1 8M3 4v6h6',
 shield:'m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Zm-4 9 3 3 5-6', 'chevron-down':'m6 9 6 6 6-6'
}
</script>
<template><svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="paths[name] || paths.file" /></svg></template>
