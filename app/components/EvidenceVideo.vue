<script lang="ts">
interface VideoPlayer {
  destroy(): void
  getIframe(): HTMLIFrameElement
  getCurrentTime(): number
  getDuration(): number
  seekTo(seconds: number, allowSeekAhead: boolean): void
}
interface PlayerEvent { target: VideoPlayer; data?: number }
interface VideoApi {
  Player: new (element: HTMLElement, options: {
    width: string; height: string; videoId: string
    playerVars: { autoplay: number; playsinline: number; origin: string; rel: number }
    events: { onReady: (event: PlayerEvent) => void; onStateChange: (event: PlayerEvent) => void; onError: (event: PlayerEvent) => void }
  }) => VideoPlayer
}
type VideoWindow = Window & { YT?: VideoApi; onYouTubeIframeAPIReady?: () => void }
let apiPromise: Promise<VideoApi> | null = null

function loadVideoApi(): Promise<VideoApi> {
  const host = window as VideoWindow
  if (host.YT?.Player) return Promise.resolve(host.YT)
  if (apiPromise) return apiPromise
  apiPromise = new Promise<VideoApi>((resolve, reject) => {
    let settled = false
    const previousReady = host.onYouTubeIframeAPIReady
    const scriptId = 'ukin-youtube-iframe-api'
    let script = document.getElementById(scriptId) as HTMLScriptElement | null
    const timeout = window.setTimeout(() => fail(), 15000)
    function complete() {
      if (!host.YT?.Player || settled) return
      settled = true
      window.clearTimeout(timeout)
      if (script) script.onerror = null
      resolve(host.YT)
    }
    function fail() {
      if (settled) return
      settled = true
      window.clearTimeout(timeout)
      apiPromise = null
      script?.remove()
      reject(new Error('Koneksi ke pemutar YouTube belum berhasil. Periksa internet atau buka video langsung di YouTube.'))
    }
    host.onYouTubeIframeAPIReady = () => {
      try { previousReady?.() } finally { complete() }
    }
    if (!script) {
      script = document.createElement('script')
      script.id = scriptId
      script.src = 'https://www.youtube.com/iframe_api'
      script.async = true
      script.onerror = fail
      document.head.append(script)
    } else script.onerror = fail
    complete()
  })
  return apiPromise
}
</script>

<script setup lang="ts">
const props = withDefaults(defineProps<{ videoId: string; title?: string; demo?: boolean }>(), {
  title: 'Video praktik pembelajaran', demo: false,
})
const emit = defineEmits<{ played: [] }>()
const opened = ref(false)
const loading = ref(false)
const ready = ref(false)
const played = ref(false)
const error = ref('')
const playerHost = ref<HTMLDivElement | null>(null)
const valid = computed(() => /^[A-Za-z0-9_-]{11}$/.test(props.videoId))
const canonicalUrl = computed(() => valid.value ? `https://www.youtube.com/watch?v=${props.videoId}` : '')
const isDemo = computed(() => props.demo || props.videoId === 'M7lc1UVf-VE')
let player: VideoPlayer | null = null
let loadToken = 0
let timeout: ReturnType<typeof setTimeout> | undefined

function stop() {
  loadToken++
  if (timeout) clearTimeout(timeout)
  timeout = undefined
  try { player?.destroy() } catch { /* Player may already have detached its iframe. */ }
  player = null
  playerHost.value?.replaceChildren()
}
function failed(message: string, token: number) {
  if (token !== loadToken) return
  if (timeout) clearTimeout(timeout)
  timeout = undefined
  loading.value = false
  ready.value = false
  error.value = message
}
async function openPlayer() {
  if (!valid.value || loading.value) return
  stop()
  const token = loadToken
  const videoId = props.videoId
  error.value = ''
  ready.value = false
  opened.value = true
  loading.value = true
  if (!navigator.onLine) { failed('Perangkat sedang offline. Pemutaran YouTube memerlukan koneksi internet.', token); return }
  await nextTick()
  try {
    const api = await loadVideoApi()
    if (token !== loadToken || !playerHost.value) return
    const mount = document.createElement('div')
    playerHost.value.replaceChildren(mount)
    timeout = setTimeout(() => failed('Pemutar belum merespons. Periksa koneksi atau izin pemutaran, lalu coba lagi atau buka di YouTube.', token), 15000)
    player = new api.Player(mount, {
      width: '100%', height: '100%', videoId,
      playerVars: { autoplay: 0, playsinline: 1, origin: window.location.origin, rel: 0 },
      events: {
        onReady(event) {
          if (token !== loadToken) return
          if (timeout) clearTimeout(timeout)
          timeout = undefined
          loading.value = false
          ready.value = true
          error.value = ''
          event.target.getIframe().title = props.title
          // Keep browser's default referrer behavior; YouTube requires client identity.
        },
        onStateChange(event) {
          if (token !== loadToken || event.data !== 1) return
          if (!played.value) { played.value = true; emit('played') }
        },
        onError(event) {
          const messages: Record<number, string> = {
            2: 'ID video tidak diterima YouTube. Periksa kembali tautannya.',
            5: 'Video tidak dapat diputar oleh pemutar HTML5 ini. Coba buka langsung di YouTube.',
            100: 'Video tidak ditemukan, telah dihapus, atau bersifat private. Minta tautan yang dapat diakses.',
            101: 'Pemilik video tidak mengizinkan pemutaran tertanam. Buka di YouTube dan periksa kembali pengaturan berbagi.',
            150: 'Pemilik video tidak mengizinkan pemutaran tertanam. Buka di YouTube dan periksa kembali pengaturan berbagi.',
            153: 'YouTube tidak menerima identitas halaman pemutar. Buka aplikasi melalui alamat HTTP/HTTPS lokal atau buka langsung di YouTube.',
          }
          failed(messages[event.data ?? 0] ?? 'Video belum dapat diputar. Periksa koneksi dan izin video, atau buka langsung di YouTube.', token)
        },
      },
    })
  } catch (cause) {
    failed(cause instanceof Error ? cause.message : 'Pemutar belum dapat dimuat. Buka video langsung di YouTube.', token)
  }
}
watch(() => props.videoId, () => { stop(); opened.value = false; loading.value = false; ready.value = false; played.value = false; error.value = '' })
onBeforeUnmount(stop)
function position() {
  if (!ready.value || error.value || !player) return null
  try {
    const seconds = Math.floor(player.getCurrentTime()), duration = player.getDuration()
    return Number.isFinite(seconds) && seconds >= 0 ? { seconds, durationSeconds: Number.isFinite(duration) && duration > 0 ? duration : null } : null
  } catch { return null }
}
function seek(seconds: number) {
  if (!ready.value || error.value || !player || !Number.isSafeInteger(seconds) || seconds < 0) return false
  try { player.seekTo(seconds, true); return true } catch { return false }
}
defineExpose({ position, seek })
</script>

<template>
  <section class="evidence-video" :aria-label="title">
    <div class="video-heading"><AppIcon name="video" :size="20" /><h4>{{ title }}</h4><span v-if="valid" class="format-label">Format tautan valid</span></div>
    <p v-if="isDemo" class="demo-video-note">Video contoh integrasi dari dokumentasi YouTube, bukan praktik mengajar peserta nyata.</p>
    <div v-if="!valid" class="video-invalid" role="status">Pratinjau belum tersedia. Simpan tautan YouTube dengan format yang didukung terlebih dahulu.</div>
    <template v-else>
      <div v-if="!opened" class="video-cover"><span class="play-symbol"><AppIcon name="video" :size="31" /></span><strong>Pratinjau video Anda</strong><p>Pemutar YouTube dimuat saat Anda memilih tombol berikut. Pemutaran membutuhkan internet.</p><UButton color="primary" variant="solid" @click="openPlayer">Muat pratinjau video</UButton></div>
      <div v-show="opened" class="player-frame"><div ref="playerHost" class="player-host" /><div v-if="loading" class="video-loading" role="status">Menghubungkan pemutar YouTube…</div></div>
      <div v-if="error" class="video-error" role="status"><p>{{ error }}</p><button type="button" @click="openPlayer">Coba muat kembali</button></div>
      <div class="video-bottom"><span class="playback-status">{{ played ? 'Pemutaran teramati pada sesi ini' : ready ? 'Pemutar siap · belum teramati diputar' : 'Pemutaran belum teramati' }}</span><a :href="canonicalUrl" target="_blank" rel="noopener noreferrer">Buka di YouTube <AppIcon name="arrow-right" :size="16" /></a></div>
      <p class="video-caution">Tautan valid atau video yang diputar belum berarti bukti telah diperiksa pengelola. Isi video di YouTube dapat berubah meskipun tautannya tersimpan dalam paket.</p>
    </template>
  </section>
</template>

<style scoped>
.evidence-video{border:1px solid var(--line);border-radius:13px;overflow:hidden;background:white}.video-heading{display:flex;align-items:center;gap:10px;padding:17px 20px}.video-heading>svg{color:var(--brand)}.video-heading h4{font-size:14px;font-weight:700;letter-spacing:0;line-height:1.4}.format-label{font-size:11px;padding:4px 7px;border-radius:6px;color:var(--brand-dark);background:var(--tint);margin-left:auto;white-space:nowrap}.demo-video-note{margin:0 20px 17px;padding:10px 12px;border-radius:7px;background:#f3f7fa;color:var(--muted);font-size:12px;line-height:1.6}.video-cover{display:flex;flex-direction:column;align-items:center;text-align:center;padding:29px 24px 32px;background:linear-gradient(120deg,#063d39,#005c53);color:white}.play-symbol{width:58px;height:58px;border:1px solid #ffffff40;border-radius:17px;display:grid;place-items:center;color:var(--accent);background:#ffffff0d;margin-bottom:15px}.video-cover strong{font-size:18px;font-weight:700}.video-cover p{font-size:13px;line-height:1.7;color:#d6eee5;max-width:430px;margin:11px 0 21px}.video-cover :deep(button){background:white;color:var(--brand-dark)}.player-frame{position:relative;width:100%;aspect-ratio:16/9;background:#102b36}.player-host{width:100%;height:100%}.player-host :deep(iframe){display:block;width:100%;height:100%;border:0}.video-loading{position:absolute;inset:0;display:grid;place-items:center;pointer-events:none;color:white;background:#102b36;font-size:13px;padding:20px;text-align:center}.video-bottom{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:15px 20px}.video-bottom a{display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:700;color:var(--brand-dark);white-space:nowrap}.video-bottom a:hover{text-decoration:underline}.playback-status{font-size:12px;color:var(--muted)}.video-caution{font-size:12px;line-height:1.8;color:var(--muted);padding:0 20px 18px}.video-error,.video-invalid{margin:16px 20px;padding:14px;border-radius:9px;border:1px solid #e4cbac;background:#fff9ee;color:var(--warning);font-size:13px;line-height:1.7}.video-error button{font-size:12px;font-weight:700;color:var(--brand-dark);border:1px solid var(--control-border);background:white;border-radius:6px;padding:7px 11px;margin-top:12px}@media(max-width:540px){.video-heading{flex-wrap:wrap;padding:16px}.format-label{margin-left:30px}.video-bottom{align-items:flex-start;flex-direction:column;padding:15px 16px}.video-caution{padding-inline:16px}.video-cover{padding:25px 20px}.demo-video-note{margin-inline:16px}}
</style>
