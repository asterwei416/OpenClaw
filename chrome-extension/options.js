const DEFAULT_URL = 'http://127.0.0.1:18792/'

function formatUrl(value) {
  if (!value || typeof value !== 'string') return DEFAULT_URL
  let url = value.trim()
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'http://' + url
  }
  if (!url.endsWith('/')) {
    url += '/'
  }
  return url
}

function setStatus(kind, message) {
  const status = document.getElementById('status')
  if (!status) return
  status.dataset.kind = kind || ''
  status.textContent = message || ''
}

async function checkRelayReachable(url) {
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
  const stored = await chrome.storage.local.get(['relayUrl'])
  const url = formatUrl(stored.relayUrl)
  document.getElementById('url').value = url
  await checkRelayReachable(url)
}

async function save() {
  const input = document.getElementById('url')
  const url = formatUrl(input.value)
  await chrome.storage.local.set({ relayUrl: url })
  input.value = url
  await checkRelayReachable(url)
}

document.getElementById('save').addEventListener('click', () => void save())
void load()
