export default defineNuxtConfig({
  compatibilityDate: '2025-11-01',
  ssr: false,
  devtools: { enabled: false },
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css', '~/assets/css/assessment.css', '~/assets/css/operations.css'],
  ui: { fonts: false, colorMode: false },
  app: {
    head: {
      htmlAttrs: { lang: 'id' },
      title: 'UKIN PPG UNJ · Ruang bukti kinerja',
      meta: [
        { name: 'description', content: 'Prototipe UKIN PPG UNJ: kenali tiga komponen bukti dan ruang peserta, penguji, serta pengelola. Semua data adalah simulasi.' },
        { name: 'theme-color', content: '#007F6D' },
        { name: 'robots', content: 'noindex, nofollow' }
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }]
    }
  },
  nitro: {
    prerender: { routes: ['/', '/login', '/app/peserta', '/app/penguji', '/app/pengelola', '/app/panduan', '/app/paket', '/app/bukti-kirim', '/app/pemeriksaan', '/app/bukti', '/app/penugasan', '/app/penilaian', '/app/riwayat', '/app/progres-penilaian', '/app/pengelolaan', '/app/monitoring', '/app/moderasi', '/app/publikasi', '/app/hasil', '/app/wawancara'] }
  },
  typescript: { strict: true, tsConfig: { compilerOptions: { allowImportingTsExtensions: true } } }
})

