<script setup lang="ts">
import { DEMO_PASSWORD } from '../data/fixtures'
definePageMeta({ layout: false })
useSeoMeta({ title: 'Masuk ke demo — UKIN PPG UNJ', description: 'Pilih akun demo peserta, penguji dosen, penguji guru, atau pengelola untuk menjelajahi UKIN PPG UNJ.' })
const ukin = useUkin()
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const selectedEmail = ref('')
const error = ref('')
const emailError = ref('')
const passwordError = ref('')
const submitting = ref(false)
const emailInput = ref<HTMLInputElement | null>(null)
const passwordInput = ref<HTMLInputElement | null>(null)
const formStatus = ref('')
const options = ukin.accounts.map(account => ({
  email: account.email,
  label: account.role === 'peserta' ? 'Peserta' : account.role === 'pengelola' ? 'Pengelola' : `Penguji ${account.examinerKind}`,
  icon: account.role === 'peserta' ? 'user' : account.role === 'pengelola' ? 'grid' : account.examinerKind === 'dosen' ? 'book' : 'users',
  description: account.displayName,
}))
function fillAccount(account: typeof options[number]) {
  email.value = account.email
  password.value = DEMO_PASSWORD
  selectedEmail.value = account.email
  error.value = emailError.value = passwordError.value = ''
  formStatus.value = `Akun ${account.label.toLowerCase()} telah diisi. Pilih Masuk ke UKIN untuk melanjutkan.`
}
async function submit() {
  if (submitting.value) return
  error.value = emailError.value = passwordError.value = ''
  formStatus.value = ''
  if (!email.value.trim()) emailError.value = 'Isi email akun demo atau pilih akun contoh di bawah.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) emailError.value = 'Format email belum sesuai.'
  if (!password.value) passwordError.value = 'Isi kata sandi dummy akun demo.'
  if (emailError.value || passwordError.value) {
    await nextTick()
    if (emailError.value) emailInput.value?.focus()
    else passwordInput.value?.focus()
    return
  }
  submitting.value = true
  try {
    ukin.login(email.value.trim(), password.value)
    await navigateTo(ukin.home.value)
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Akun belum dapat masuk. Coba pilih kembali akun demo.'
    await nextTick()
    emailInput.value?.focus()
  } finally { submitting.value = false }
}
</script>

<template>
  <div class="login-page">
    <aside class="login-story" aria-label="Tentang UKIN PPG UNJ">
      <div class="story-brand"><BrandMark light /></div>
      <div class="story-content"><p class="story-eyebrow">PENDIDIKAN PROFESI GURU</p><h1>Setiap praktik<br>punya cerita.<br><span>Tunjukkan<br>maknanya.</span></h1><p class="story-description">Dari rencana pembelajaran hingga refleksi. Satu ruang untuk mengenali perjalanan praktik baik Anda.</p><UkinIllustration compact /></div>
      <div class="story-footer"><span>01 &nbsp; Rencanakan</span><span>02 &nbsp; Praktikkan</span><span>03 &nbsp; Refleksikan</span></div>
    </aside>
    <main id="main-content" class="login-main">
      <NuxtLink to="/" class="back-link"><AppIcon name="arrow-left" /> Kembali ke beranda</NuxtLink>
      <div class="login-form-wrap">
        <div class="login-heading"><p class="form-eyebrow">SELAMAT DATANG DI UKIN</p><h2>Ruang praktik baik<br>menanti Anda.</h2><p>Masuk untuk melihat ringkasan sesuai peran Anda.</p></div>
        <div class="demo-notice"><AppIcon name="help" /><p><strong>Anda berada dalam mode demo.</strong><span>Gunakan akun contoh. Seluruh data fiktif; jangan masukkan kata sandi asli.</span></p></div>
        <div v-if="ukin.notices.value.length" class="storage-notices" role="status"><p v-for="notice in ukin.notices.value" :key="notice">{{ notice }}</p></div>
        <div v-if="ukin.user.value" class="existing-session"><p>Sesi demo Anda masih aktif.</p><NuxtLink :to="ukin.home.value">Lanjutkan sebagai {{ ukin.user.value.displayName }} <span aria-hidden="true">→</span></NuxtLink><span>Atau masuk dengan akun contoh lainnya di bawah.</span></div>
        <form novalidate @submit.prevent="submit">
          <div class="form-field"><label for="demo-email">Email akun demo</label><input id="demo-email" ref="emailInput" v-model="email" type="email" name="demo-email" autocomplete="off" inputmode="email" placeholder="nama@demo.invalid" :aria-invalid="!!emailError" :aria-describedby="emailError ? 'email-error' : undefined" @input="selectedEmail = ''"><p v-if="emailError" id="email-error" class="field-error">{{ emailError }}</p></div>
          <div class="form-field"><div class="password-label"><label for="demo-password">Kata sandi dummy</label><a href="#akun-contoh">Gunakan akun contoh</a></div><div class="password-control"><input id="demo-password" ref="passwordInput" v-model="password" :type="showPassword ? 'text' : 'password'" name="demo-password" autocomplete="off" placeholder="Kata sandi demo" :aria-invalid="!!passwordError" :aria-describedby="passwordError ? 'password-error' : undefined" @input="selectedEmail = ''"><button type="button" :aria-label="showPassword ? 'Sembunyikan kata sandi dummy' : 'Tampilkan kata sandi dummy'" :aria-pressed="showPassword" @click="showPassword = !showPassword">{{ showPassword ? 'Sembunyikan' : 'Lihat' }}</button></div><p v-if="passwordError" id="password-error" class="field-error">{{ passwordError }}</p></div>
          <p v-if="error" class="login-error" role="alert">{{ error }}</p>
          <UButton type="submit" size="xl" block :disabled="submitting" class="submit-button"><span>{{ submitting ? 'Membuka ruang UKIN…' : 'Masuk ke UKIN' }}</span><AppIcon name="arrow-right" /></UButton>
        </form>
        <div id="akun-contoh" class="demo-accounts"><h3><span>COBA DENGAN AKUN CONTOH</span></h3><div class="account-grid"><button v-for="account in options" :key="account.email" type="button" class="account-button" :class="{ selected: selectedEmail === account.email }" :aria-pressed="selectedEmail === account.email" @click="fillAccount(account)"><span class="account-icon"><AppIcon :name="account.icon" /></span><span><strong>{{ account.label }}</strong><small>{{ account.description }}</small></span><span class="account-plus" aria-hidden="true">{{ selectedEmail === account.email ? '✓' : '+' }}</span></button></div><p class="form-status" role="status" aria-live="polite">{{ formStatus || 'Pilih akun untuk mengisi email dan kata sandi secara otomatis.' }}</p></div>
        <p class="session-note"><AppIcon name="shield" /> Sesi berlaku di tab ini. Data demo tetap saat berganti akun.</p>
      </div>
      <footer class="login-footer">PPG · Universitas Negeri Jakarta <span>Prototipe UKIN 2026</span></footer>
    </main>
  </div>
</template>

<style scoped>
.login-page{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);min-height:100vh;background:#fff;color:var(--ink,#142B40)}.login-story{color:#fff;background:radial-gradient(ellipse at 12% 74%,#168b7425,transparent 60%),linear-gradient(145deg,#063D39,#006E60);padding:36px 58px 30px;display:flex;flex-direction:column;overflow:hidden}.story-brand{display:block;text-decoration:none;align-self:flex-start}.story-content{width:min(100%,445px);margin:63px auto 20px}.story-eyebrow{font-size:10px;font-weight:750;letter-spacing:1.4px;color:#B3F2DE;margin:0 0 21px}.story-content h1{font-size:clamp(40px,4vw,59px);letter-spacing:-2.2px;line-height:1.08;font-weight:750;margin:0}.story-content h1 span{color:#74E7C9}.story-description{max-width:350px;font-size:13px;line-height:1.9;color:#D6F5EC;margin:22px 0 16px}.story-footer{display:flex;justify-content:space-between;gap:15px;border-top:1px solid #b3f2de30;padding-top:20px;font-size:10px;font-weight:600;color:#D9F9F0;margin-top:auto}.login-main{display:flex;flex-direction:column;min-width:0;padding:43px 48px 20px}.back-link{display:inline-flex;align-items:center;gap:10px;align-self:flex-start;text-decoration:none;color:var(--muted,#506579);font-size:12px;min-height:32px}.back-link :deep(svg){width:16px;height:16px}.login-form-wrap{width:100%;max-width:428px;margin:51px auto 42px}.form-eyebrow{font-size:10px;font-weight:750;letter-spacing:1.4px;color:var(--brand,#007F6D);margin:0 0 19px}.login-heading h2{font-size:36px;letter-spacing:-1.25px;line-height:1.17;font-weight:750;margin:0}.login-heading>p:last-child{font-size:13px;line-height:1.8;color:var(--muted,#506579);margin:18px 0 25px}.demo-notice{display:flex;gap:12px;background:#EFFAF6;border:1px solid #B9E5D8;border-radius:10px;padding:16px;color:var(--brand-dark,#005C53);margin-bottom:26px}.demo-notice :deep(svg){width:19px;height:19px;flex-shrink:0;margin-top:1px}.demo-notice p{margin:0;font-size:11px;line-height:1.8}.demo-notice strong{display:block;font-size:12px;font-weight:700;margin-bottom:2px}.demo-notice span{display:block}.form-field{margin-bottom:20px}.form-field label{display:block;font-size:12px;font-weight:700;margin-bottom:9px}.form-field input{font:inherit;font-size:14px;display:block;width:100%;min-height:47px;border:1px solid var(--control-border,#7A8E9E);border-radius:8px;background:#fff;color:var(--ink,#142B40);padding:11px 13px;box-sizing:border-box}.form-field input::placeholder{color:#6E8292}.form-field input:focus-visible{outline:3px solid #2376D240;outline-offset:1px;border-color:#2376D2}.form-field input[aria-invalid=true]{border-color:var(--danger,#B42335)}.password-label{display:flex;justify-content:space-between;gap:12px}.password-label>a{font-size:10px;color:var(--brand-dark,#005C53);font-weight:650;text-decoration:none}.password-control{position:relative}.password-control input{padding-right:99px}.password-control button{position:absolute;right:8px;top:5px;bottom:5px;padding:0 8px;border:0;background:transparent;font-size:10px;font-weight:600;color:var(--muted,#506579);cursor:pointer;border-radius:4px}.submit-button{display:flex;justify-content:space-between;gap:20px;padding:14px 17px;margin-top:3px}.submit-button :deep(svg){width:21px;height:21px}.field-error{color:var(--danger,#B42335);font-size:11px;line-height:1.6;margin:7px 0 0}.login-error,.storage-notices{font-size:12px;line-height:1.7;padding:12px;border:1px solid #E1B2BA;color:var(--danger,#B42335);border-radius:8px;background:#FFF6F7;margin-bottom:16px}.storage-notices{border-color:#E3CBAB;color:#93450D;background:#FFF9EF}.storage-notices p{margin:0}.existing-session{background:#F3F7FA;border-radius:8px;padding:12px 14px;margin-bottom:22px;font-size:11px;line-height:1.8}.existing-session p{margin:0}.existing-session a{display:block;font-weight:700;color:var(--brand-dark,#005C53);text-decoration:none;padding:5px 0}.existing-session span{color:var(--muted,#506579)}.demo-accounts{scroll-margin-top:25px}.demo-accounts h3{display:flex;gap:12px;align-items:center;margin:27px 0 17px;font-size:8px;letter-spacing:1px;font-weight:650;color:var(--muted,#506579);white-space:nowrap}.demo-accounts h3:before,.demo-accounts h3:after{content:'';height:1px;flex:1;background:var(--line,#D7E2E8)}.account-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.account-button{display:flex;gap:10px;align-items:center;text-align:left;border:1px solid var(--line,#D7E2E8);background:#F8FAFB;border-radius:9px;padding:13px 11px;cursor:pointer;min-height:73px;color:var(--ink,#142B40);transition:background .15s ease,border-color .15s ease}.account-button:hover,.account-button.selected{background:#E8F7F2;border-color:#80C6B4}.account-icon{color:var(--brand,#007F6D);flex-shrink:0}.account-icon :deep(svg){width:21px;height:21px}.account-button strong{font-size:11px;font-weight:700;display:block}.account-button small{font-size:9px;color:var(--muted,#506579);line-height:1.6;display:block;margin-top:4px}.account-plus{margin-left:auto;font-size:15px;color:var(--brand-dark,#005C53)}.form-status{min-height:34px;font-size:10px;line-height:1.7;color:var(--muted,#506579);margin:11px 0 0}.session-note{font-size:10px;line-height:1.7;color:var(--muted,#506579);margin:20px 0 0;display:flex;align-items:center;justify-content:center;gap:8px;text-align:center}.session-note :deep(svg){width:14px;height:14px;flex-shrink:0}.login-footer{margin-top:auto;font-size:9px;color:var(--muted,#506579);text-align:center;line-height:1.8;display:flex;justify-content:center;gap:14px;flex-wrap:wrap}.login-footer span{color:#607889}.login-page a:focus-visible,.login-page button:focus-visible{outline:3px solid #2376D2;outline-offset:4px;border-radius:4px}.story-brand:focus-visible{outline-color:#80DFFF!important}
@media(min-width:1600px){.login-story{padding-inline:80px}.story-content{max-width:485px}.login-form-wrap{max-width:455px;margin-top:73px}.login-heading h2{font-size:41px}.account-button{min-height:79px}.login-main{padding-top:49px}}
@media(max-width:1100px){.login-story{padding-inline:34px}.login-main{padding-inline:32px}.story-content{margin-top:70px}.story-content h1{font-size:49px}.account-grid{grid-template-columns:1fr}.account-button{min-height:63px;padding:12px 14px}.account-button strong{font-size:12px}.account-button small{font-size:10px}.login-form-wrap{margin-top:37px}.story-footer{font-size:9px}.login-heading h2{font-size:33px}}
@media(max-width:760px){.login-page{grid-template-columns:1fr}.login-story{padding:24px 26px 27px}.story-content{margin:31px 0 0;width:100%}.story-content h1{font-size:36px;letter-spacing:-1px;line-height:1.16}.story-content h1 br{display:none}.story-content h1 span{display:block}.story-eyebrow{font-size:9px;margin-bottom:12px}.story-description{font-size:12px;max-width:450px;margin:14px 0 0}.story-content :deep(.evidence-art),.story-footer{display:none}.login-main{padding:21px 26px 24px}.login-form-wrap{margin:24px auto 37px;max-width:460px}.login-heading h2{font-size:31px}.login-heading h2 br{display:none}.login-heading>p:last-child{font-size:12px;margin-block:13px 21px}.form-eyebrow{margin-bottom:13px}.account-grid{grid-template-columns:1fr 1fr}.account-button{padding:13px 10px;gap:8px}.account-button strong{font-size:11px}.account-button small{font-size:9px}.account-icon :deep(svg){width:18px;height:18px}.account-plus{font-size:13px}.session-note{font-size:9px}.login-footer{font-size:9px}}
@media(max-width:380px){.login-main,.login-story{padding-inline:20px}.account-grid{grid-template-columns:1fr}.story-content h1{font-size:31px}.login-heading h2{font-size:28px}.account-button strong{font-size:12px}.account-button small{font-size:10px}}
@media(prefers-reduced-motion:reduce){.account-button{transition:none}}
/* Keep primary copy, form labels, and account identities readable at every breakpoint. */
.back-link{font-size:14px}.form-eyebrow,.story-eyebrow{font-size:11px}.story-description{font-size:15px}.story-footer{font-size:12px}.login-heading>p:last-child{font-size:15px}.demo-notice p{font-size:13px}.demo-notice strong{font-size:14px}.form-field label{font-size:14px}.form-field input{font-size:15px;min-height:49px}.password-label>a{font-size:12px}.password-control button{font-size:12px}.password-control input{padding-right:106px}.submit-button{font-size:15px;min-height:50px}.field-error,.login-error,.storage-notices{font-size:13px}.existing-session{font-size:13px}.demo-accounts h3{font-size:11px;letter-spacing:.7px}.account-button{min-height:85px}.account-button strong{font-size:14px}.account-button small{font-size:12px;line-height:1.5}.account-plus{font-size:17px}.form-status{font-size:12px;min-height:41px}.session-note{font-size:12px;align-items:flex-start}.session-note :deep(svg){margin-top:3px}.login-footer{font-size:11px}
@media(max-width:1100px){.account-button{min-height:76px}}
@media(max-width:760px){.story-description{font-size:14px}.account-button{min-height:90px}.account-button strong{font-size:14px}.account-button small{font-size:12px}.login-heading>p:last-child{font-size:15px}.session-note{font-size:12px}}
@media(max-width:420px){.account-grid{grid-template-columns:1fr}.account-button{min-height:76px}.password-label{flex-wrap:wrap;gap:0 12px}.password-label>a{margin-bottom:9px}.demo-accounts h3{font-size:10px}}
</style>
