<script setup lang="ts">
import { formatDemoTime, roleLabel } from '~/domain/selectors'
const { user, snapshot, notices, accounts, switchAccount, reset, logout, home, confirmDiscardChanges } = useUkin()
const route = useRoute()
const drawer = ref<HTMLDialogElement | null>(null)
const resetDialog = ref<HTMLDialogElement | null>(null)
const actionError = ref('')
const pageTitles: Record<string, string> = { '/app/panduan': 'Panduan demo', '/app/paket': 'Paket UKIN', '/app/bukti-kirim': 'Bukti pengiriman', '/app/pemeriksaan': 'Pemeriksaan kelengkapan', '/app/bukti': 'Bukti peserta', '/app/penugasan': 'Penugasan saya', '/app/penilaian': 'Penilaian pribadi', '/app/riwayat': 'Riwayat penilaian', '/app/progres-penilaian': 'Progres penilaian', '/app/pengelolaan': 'Pengelolaan', '/app/monitoring': 'Monitoring', '/app/moderasi': 'Moderasi', '/app/publikasi': 'Publikasi hasil', '/app/hasil': 'Hasil publikasi', '/app/wawancara': 'Wawancara' }
const pageTitle = computed(() => pageTitles[route.path.replace(/\/+$/, '')] ?? 'Ringkasan')
const initials = computed(() => user.value?.displayName.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('') ?? '')
async function changeAccount(event: Event) {
  if (!confirmDiscardChanges()) { (event.target as HTMLSelectElement).value = user.value?.id ?? ''; return }
  try { switchAccount((event.target as HTMLSelectElement).value); await navigateTo(home.value) }
  catch (error) { actionError.value = error instanceof Error ? error.message : 'Pergantian akun belum berhasil.' }
}
async function leave() { if (!confirmDiscardChanges()) return; logout(); await navigateTo('/login') }
async function resetDemo() { if (!confirmDiscardChanges()) return; reset(); resetDialog.value?.close(); await navigateTo('/login') }
watch(() => route.fullPath, async () => {
  drawer.value?.close()
  await nextTick()
  document.getElementById('workspace-main')?.focus()
})
</script>
<template>
  <div v-if="user" class="workspace">
    <a class="skip-link" href="#workspace-main">Lewati ke konten</a>
    <aside class="desktop-sidebar"><WorkspaceNav /></aside>
    <div class="workspace-body">
      <header class="workspace-header">
        <div class="breadcrumb"><button class="icon-button mobile-menu" aria-label="Buka navigasi" @click="drawer?.showModal()"><AppIcon name="menu" /></button><span>UKIN PPG UNJ</span><span class="crumb-divider">/</span><strong>{{ pageTitle }}</strong></div>
        <div class="header-actions"><span class="demo-pill"><span />Mode demo</span><label class="account-control"><AppIcon name="switch" /><span class="sr-only">Ganti akun demo</span><select :value="user.id" aria-label="Ganti akun demo" @change="changeAccount"><option v-for="account in accounts" :key="account.id" :value="account.id">{{ roleLabel(account) }}</option></select></label></div>
      </header>
      <main id="workspace-main" tabindex="-1" class="workspace-main">
        <div class="demo-clock"><AppIcon name="clock" :size="16" /><span>Waktu demo: <strong>{{ formatDemoTime(snapshot.data.clockNow) }}</strong></span><span class="clock-note">Bukan jadwal resmi</span></div>
        <div v-if="notices.length" class="storage-notices" role="status"><p v-for="notice in notices" :key="notice" class="notice">{{ notice }}</p></div>
        <p v-if="actionError" role="alert" class="notice">{{ actionError }}</p>
        <slot />
        <footer class="workspace-footer"><span>UKIN · Pendidikan Profesi Guru UNJ</span><span>Prototipe interaktif · Data simulasi</span></footer>
      </main>
      <div class="session-bar"><div class="session-user"><span class="avatar">{{ initials }}</span><div><strong>{{ user.displayName }}</strong><small>{{ roleLabel(user) }} · Akun fiktif</small></div></div><div class="session-actions"><button @click="resetDialog?.showModal()"><AppIcon name="reset" :size="16" />Reset demo</button><button @click="leave"><AppIcon name="logout" :size="16" />Keluar</button></div></div>
    </div>
    <dialog ref="drawer" class="nav-dialog" aria-label="Navigasi UKIN"><button class="icon-button drawer-close" aria-label="Tutup navigasi" @click="drawer?.close()"><AppIcon name="close" /></button><WorkspaceNav @navigate="drawer?.close()" /></dialog>
    <dialog ref="resetDialog" class="confirm-dialog" aria-labelledby="reset-title" aria-describedby="reset-description"><div class="reset-symbol"><AppIcon name="reset" :size="26" /></div><h2 id="reset-title">Mulai ulang demo UKIN?</h2><p id="reset-description">Data simulasi, tanda baca pengumuman, dan waktu demo UKIN akan kembali ke kondisi awal. Anda akan keluar dari akun ini.</p><p class="reset-scope">Data aplikasi lain tidak ikut dihapus.</p><div class="confirm-actions"><UButton color="neutral" variant="outline" autofocus @click="resetDialog?.close()">Batal</UButton><UButton color="error" @click="resetDemo">Ya, reset UKIN</UButton></div></dialog>
  </div>
</template>
<style scoped>
.workspace{min-height:100dvh;background:var(--canvas)}.desktop-sidebar{position:fixed;inset:0 auto 0 0;width:248px;background:white;border-right:1px solid var(--line);overflow:auto;z-index:20}.workspace-body{margin-left:248px;min-width:0}.workspace-header{background:white;min-height:78px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;padding:14px 36px;gap:18px}.breadcrumb{display:flex;align-items:center;gap:14px;font-size:12px}.breadcrumb>span:first-of-type{color:var(--muted)}.crumb-divider{color:var(--line)}.header-actions{display:flex;align-items:center;gap:24px}.demo-pill{display:inline-flex;align-items:center;gap:6px;background:var(--tint);color:var(--brand-dark);padding:5px 10px;border-radius:20px;font-size:11px;font-weight:600;border:1px solid #b8dfd3;white-space:nowrap}.demo-pill>span{height:5px;width:5px;background:var(--brand);border-radius:50%}.account-control{display:flex;align-items:center;gap:8px;color:var(--ink)}.account-control select{max-width:160px;padding:8px 5px;font-size:12px;border:0;background:transparent;cursor:pointer}.workspace-main{max-width:1350px;margin:auto;padding:28px 40px 24px;min-height:calc(100dvh - 164px)}.workspace-main:focus{outline:none}.demo-clock{display:flex;gap:8px;align-items:center;flex-wrap:wrap;color:var(--muted);font-size:11px;margin-bottom:28px}.demo-clock>svg{color:var(--brand)}.clock-note{padding-left:8px;border-left:1px solid var(--line);margin-left:5px}.storage-notices{display:grid;gap:8px;margin-bottom:20px}.workspace-footer{border-top:1px solid var(--line);margin-top:40px;padding-top:20px;display:flex;justify-content:space-between;gap:16px;font-size:11px;color:var(--muted)}.session-bar{border-top:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;gap:20px;padding:16px 36px;background:#fff}.session-user{display:flex;gap:12px;align-items:center}.avatar{background:var(--tint);border:1px solid #c2e6da;color:var(--brand-dark);height:38px;width:38px;display:grid;place-items:center;font-weight:700;font-size:12px;border-radius:10px}.session-user strong{font-size:12px;display:block}.session-user small{font-size:10px;color:var(--muted);display:block}.session-actions{display:flex;gap:20px}.session-actions button{display:flex;align-items:center;gap:7px;color:var(--muted);background:none;border:0;font-size:12px;min-height:40px}.session-actions button:hover{color:var(--brand)}.icon-button{width:40px;height:40px;display:grid;place-items:center;background:white;border:1px solid var(--line);border-radius:9px}.mobile-menu{display:none}dialog{color:var(--ink);border:1px solid var(--line);padding:0}dialog::backdrop{background:#142b4066;backdrop-filter:blur(3px)}.nav-dialog{width:min(320px,90vw);height:100dvh;max-height:100dvh;margin:0;border:0}.drawer-close{position:absolute;right:16px;top:88px;z-index:2}.confirm-dialog{width:min(440px,calc(100vw - 32px));border-radius:20px;padding:30px;margin:auto;box-shadow:0 24px 100px #142b4033}.reset-symbol{width:50px;height:50px;border-radius:14px;background:#fff1ed;color:var(--danger);display:grid;place-items:center;margin-bottom:18px}.confirm-dialog h2{font-size:24px;font-weight:700}.confirm-dialog p{margin-top:16px;color:var(--muted);font-size:14px}.confirm-dialog .reset-scope{font-size:12px}.confirm-actions{margin-top:28px;display:flex;justify-content:flex-end;gap:12px}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
@media(max-width:1100px){.desktop-sidebar{width:228px}.workspace-body{margin-left:228px}.workspace-main{padding:28px}.workspace-header{padding:16px 28px}.header-actions{gap:14px}}
@media(max-width:850px){.desktop-sidebar{display:none}.workspace-body{margin-left:0}.mobile-menu{display:grid}.workspace-header{padding:12px 20px}.workspace-main{padding:24px 20px}.breadcrumb>span:first-of-type,.crumb-divider{display:none}.session-bar{padding:14px 20px}.demo-clock{margin-bottom:22px}.clock-note{display:none}}
@media(max-width:480px){.workspace-header{gap:8px;padding:12px 16px}.header-actions{gap:8px}.demo-pill{font-size:10px;padding:5px 8px}.account-control{gap:2px}.account-control select{font-size:11px;max-width:127px}.account-control>svg{display:none}.workspace-main{padding:24px 16px}.session-bar{align-items:flex-start;flex-wrap:wrap;padding:16px}.session-actions{margin-left:auto;gap:16px}.workspace-footer{flex-direction:column;gap:4px}.confirm-dialog{padding:24px}}
</style>

