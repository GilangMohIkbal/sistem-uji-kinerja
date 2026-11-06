import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createHash } from 'node:crypto'

const root = fileURLToPath(new URL('../', import.meta.url))
const read = relative => readFile(path.join(root, relative), 'utf8')
async function walk(relative) {
  const entries = await readdir(path.join(root, relative), { withFileTypes: true })
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? walk(path.join(relative, entry.name)) : path.join(relative, entry.name)))).flat()
}
const tokens = JSON.parse(await read('references/brand.tokens.json'))
const css = await read('app/assets/css/main.css')
for (const [name, color] of Object.entries(tokens.colors)) {
  assert.ok(css.includes(`--${name}: ${color};`), `Shared token changed: ${name}`)
}
const routes = ['index.vue', 'login.vue', 'app/peserta.vue', 'app/penguji.vue', 'app/pengelola.vue', 'app/panduan.vue', 'app/paket.vue', 'app/bukti-kirim.vue', 'app/pemeriksaan.vue', 'app/bukti.vue', 'app/penugasan.vue', 'app/penilaian.vue', 'app/riwayat.vue', 'app/progres-penilaian.vue', 'app/pengelolaan.vue', 'app/monitoring.vue', 'app/moderasi.vue', 'app/publikasi.vue', 'app/hasil.vue', 'app/wawancara.vue']
assert.equal(await read('app/data/rubric-demo.v1.json'), await read('references/rubric-demo.v1.json'), 'Demo rubric must match its reference exactly')
for (const route of routes) assert.ok((await read(`app/pages/${route}`)).includes('<template>'), `Missing route: ${route}`)
const files = [...await walk('app'), ...await walk('public')]
for (const file of files) {
  assert.ok(!/screenshots|lms-landing|national-assessment/.test(file), `Reference leaked to app assets: ${file}`)
  if (file.endsWith('.pdf')) {
    const bytes = await readFile(path.join(root, file))
    assert.ok(bytes.subarray(0, 5).toString() === '%PDF-', `Invalid sample PDF: ${file}`)
    assert.ok(bytes.subarray(-30).toString().includes('%%EOF'), `Incomplete PDF: ${file}`)
    const metadata = await read('app/data/sample-files.ts')
    assert.ok(metadata.includes(createHash('sha256').update(bytes).digest('hex')), `Sample digest not catalogued: ${file}`)
    continue
  }
  const source = await read(file)
  assert.ok(!source.includes('\uFFFD'), `Invalid UTF-8 replacement character: ${file}`)
  assert.ok(!/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(source), `Unexpected control character: ${file}`)
  assert.ok(!/\.(?:localStorage|sessionStorage)\.clear\s*\(/.test(source), `Unsafe broad reset: ${file}`)
  assert.ok(!source.includes('v-html'), `Raw HTML interpolation: ${file}`)
}
assert.ok((await read('public/favicon.svg')).includes('<svg'), 'Missing local favicon')
console.log(`Source check passed: ${routes.length} routes, ${Object.keys(tokens.colors).length} unchanged brand colors, ${files.length} app/asset files. This is not a Vue compile or browser test.`)
