import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'))
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
assert.equal(lock.lockfileVersion, 3)
for (const field of ['dependencies', 'devDependencies']) assert.deepEqual(lock.packages[''][field], pkg[field])
const required = ['@oxc-parser/binding-linux-x64-gnu', '@oxc-transform/binding-linux-x64-gnu', '@oxc-minify/binding-linux-x64-gnu', '@tailwindcss/oxide-linux-x64-gnu', '@rollup/rollup-linux-x64-gnu', 'lightningcss-linux-x64-gnu', '@esbuild/linux-x64']
for (const name of required) assert.ok(lock.packages['node_modules/' + name], `Missing ${name}`)
let checked = 0
for (const [location, parent] of Object.entries(lock.packages)) {
  for (const [name, version] of Object.entries(parent.optionalDependencies ?? {})) {
    if (!name.includes('linux') || !name.includes('x64')) continue
    const candidates = [location + '/node_modules/' + name]
    let ancestor = location
    while (ancestor.includes('/node_modules/')) { ancestor = ancestor.slice(0, ancestor.lastIndexOf('/node_modules/')); candidates.push(ancestor + '/node_modules/' + name) }
    candidates.push('node_modules/' + name)
    const binding = candidates.map(p => lock.packages[p]).find(Boolean)
    assert.ok(binding, `Missing optional ${location} -> ${name}`)
    assert.equal(binding.version, version, `Version mismatch ${name}`)
    assert.ok(binding.optional && binding.integrity?.startsWith('sha512-') && binding.resolved?.startsWith('https://registry.npmjs.org/'), `Incomplete registry metadata ${name}`)
    checked++
  }
}
console.log(`Lockfile metadata passed: ${checked} Linux x64 optional references, including nested versions. This is NOT a Linux npm ci test.`)
