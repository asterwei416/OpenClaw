const DEFAULT_PORT = 18792

function clampPort(value) {
  const n = Number.parseInt(String(value || ''), 10)
  if (!Number.isFinite(n)) return DEFAULT_PORT
  if (n <= 0 || n > 65535) return DEFAULT_PORT
  return n
}

function updateRelayUrl(port) {
  const el = document.getElementById('relay-url')
  if (!el) return
  el.textContent = `http://127.0.0.1:${port}/`
}

function setStatus(kind, message) {
  const status = document.getElementById('status')
  if (!status) return
  status.dataset.kind = kind || ''
  status.textContent = message || ''
}

async function checkRelayReachable(port) {
  const url = `http://127.0.0.1:${port}/`
  const maxAttempts = 20
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    setStatus('info', `Checking relay... (${attempt}/${maxAttempts})`)
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 2500)
    try {
      const res = await fetch(url, { method: 'HEAD', signal: ctrl.signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setStatus('ok', `Relay reachable at ${url}`)
      return
    } catch {
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 3000))
      }
    } finally {
      clearTimeout(t)
    }
  }

  setStatus(
    'error',
    `Relay not reachable/authenticated at ${url}. Start OpenClaw browser relay and verify token.`,
  )
}

async function load() {
  const stored = await chrome.storage.local.get(['relayPort'])
  const port = clampPort(stored.relayPort)
  document.getElementById('port').value = String(port)
  updateRelayUrl(port)
  await checkRelayReachable(port)
}

async function save() {
  const input = document.getElementById('port')
  const port = clampPort(input.value)
  await chrome.storage.local.set({ relayPort: port })
  input.value = String(port)
  updateRelayUrl(port)
  await checkRelayReachable(port)
}

document.getElementById('save').addEventListener('click', () => void save())
void load()
