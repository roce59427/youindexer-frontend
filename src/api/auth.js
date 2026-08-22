import { getApiErrorMessage, handleApiResponse } from '@/api/response.js'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'

async function _handleResponse(response) {
  return handleApiResponse(response)
}

/**
 * Get the Google OAuth2 consent URL.
 * @param {string} redirectUri
 */
export async function getGoogleLoginUrl(redirectUri) {
  const params = new URLSearchParams({ redirect_uri: redirectUri })
  const response = await fetch(`${API_BASE}/auth/google/login?${params}`)
  return _handleResponse(response)
}

/**
 * Exchange a Google authorization code for local JWT tokens.
 * @param {string} code
 * @param {string} redirectUri
 */
export async function exchangeGoogleCode(code, redirectUri) {
  const response = await fetch(`${API_BASE}/auth/google/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, redirect_uri: redirectUri })
  })
  return _handleResponse(response)
}

/**
 * Refresh the access token.
 * @param {string} refreshToken
 */
export async function refreshAccessToken(refreshToken) {
  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken })
  })
  return _handleResponse(response)
}

/**
 * Fetch the current user profile.
 * @param {string} accessToken
 */
export async function fetchMe(accessToken) {
  const response = await fetch(`${API_BASE}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  return _handleResponse(response)
}

/**
 * Fetch the current user's search history.
 * @param {string} accessToken
 * @param {object} [pagination]
 * @param {number} [pagination.limit]
 * @param {number} [pagination.offset]
 */
export async function fetchSearchHistory(accessToken, { limit = 20, offset = 0 } = {}) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
  const response = await fetch(`${API_BASE}/me/search-history?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  return _handleResponse(response)
}

/**
 * Delete one search-history item belonging to the authenticated user.
 * @param {string} accessToken
 * @param {string} taskId
 */
export async function deleteSearchHistoryItem(accessToken, taskId) {
  const response = await fetch(`${API_BASE}/me/search-history/${encodeURIComponent(taskId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  return _handleResponse(response)
}

/**
 * Subscribe to authenticated search-history snapshots.
 * EventSource cannot send an Authorization header, so this uses fetch streaming.
 * @param {string} accessToken
 * @param {object} callbacks
 * @param {(data: object) => void} callbacks.onSnapshot
 * @param {(data: object) => void} callbacks.onUpdate
 * @param {(detail: string) => void} callbacks.onError
 * @returns {() => void} cleanup function
 */
export function streamSearchHistoryEvents(accessToken, callbacks, { limit = 20, offset = 0 } = {}) {
  const controller = new AbortController()
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
  const url = `${API_BASE}/me/search-history/events?${params}`
  let stopped = false

  function handleEvent(block) {
    const lines = block.split('\n')
    let eventName = 'message'
    const dataLines = []
    for (const line of lines) {
      if (line.startsWith('event:')) eventName = line.slice(6).trim()
      if (line.startsWith('data:')) dataLines.push(line.slice(5).trim())
    }
    if (!dataLines.length) return

    try {
      const data = JSON.parse(dataLines.join('\n'))
      if (eventName === 'snapshot') callbacks.onSnapshot?.(data)
      if (eventName === 'update') callbacks.onUpdate?.(data)
      if (eventName === 'error') callbacks.onError?.(data.detail || '歷史紀錄串流發生錯誤')
    } catch (error) {
      callbacks.onError?.(`Invalid history SSE payload: ${error.message}`)
    }
  }

  async function connect() {
    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: controller.signal
      })
      if (!response.ok) {
        let body = null
        try {
          body = await response.json()
        } catch {
          // Fall back to the HTTP status when the response is not JSON.
        }
        throw new Error(getApiErrorMessage(body, response.status))
      }
      if (!response.body) throw new Error('瀏覽器不支援 SSE response stream')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      while (!stopped) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const blocks = buffer.split('\n\n')
        buffer = blocks.pop() || ''
        blocks.forEach(handleEvent)
      }
    } catch (error) {
      if (!stopped && error.name !== 'AbortError') {
        callbacks.onError?.(error.message || '歷史紀錄串流中斷')
      }
    }
  }

  connect()
  return () => {
    stopped = true
    controller.abort()
  }
}
