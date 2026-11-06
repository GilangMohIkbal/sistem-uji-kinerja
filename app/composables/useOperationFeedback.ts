export function useOperationFeedback() {
  const error = ref(''), message = ref('')
  function act<T>(operation: () => T, success = 'Perubahan tersimpan pada demo UKIN.'): T | undefined {
    error.value = ''; message.value = ''
    try { const value = operation(); message.value = success; return value }
    catch (cause) { error.value = cause instanceof Error ? cause.message : 'Aksi belum dapat diselesaikan.' }
  }
  return { error, message, act }
}
export function wibInput(iso: string) { return new Date(Date.parse(iso) + 7 * 3600000).toISOString().slice(0, 16) }
export function fromWib(value: string) { return value ? new Date(value + ':00+07:00').toISOString() : '' }
