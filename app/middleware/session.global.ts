export default defineNuxtRouteMiddleware((to) => {
  const path = to.path.replace(/\/+$/, '') || '/'
  if (import.meta.server || (path !== '/app' && !path.startsWith('/app/'))) return
  const { user, home } = useUkin()
  if (!user.value) return navigateTo('/login', { replace: true })
  const restricted: Record<string, string[]> = { '/app/paket': ['peserta'], '/app/pemeriksaan': ['pengelola'], '/app/penugasan': ['penguji'], '/app/penilaian': ['penguji'], '/app/riwayat': ['penguji'], '/app/progres-penilaian': ['pengelola'], '/app/pengelolaan': ['pengelola'], '/app/monitoring': ['pengelola'], '/app/moderasi': ['pengelola', 'penguji'], '/app/publikasi': ['pengelola'], '/app/hasil': ['peserta'] }
  if (restricted[path] && !restricted[path]!.includes(user.value.role)) return navigateTo(home.value, { replace: true })
  const dashboards = ['/app/peserta', '/app/penguji', '/app/pengelola']
  if (path === '/app' || (dashboards.includes(path) && path !== home.value)) {
    return navigateTo(home.value, { replace: true })
  }
})
