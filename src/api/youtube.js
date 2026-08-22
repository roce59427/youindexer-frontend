import { ensureValidAccessToken, logout } from '@/stores/auth.js'
import { handleApiResponse } from '@/api/response.js'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'

async function _handleResponse(response) {
  return handleApiResponse(response)
}

async function authFetch(url, options = {}) {
  const token = await ensureValidAccessToken()
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  })

  if (response.status === 401) {
    logout()
    window.location.href = '/login'
    throw new Error('登入階段已過期，請重新登入')
  }

  return _handleResponse(response)
}

/**
 * Create a durable YouTube keyword search job.
 * @param {string} query
 * @param {string} [locale]
 * @param {number} [matchesPerVideo]
 */
export async function createKeywordSearchJob(
  query,
  locale = 'zh-TW',
  matchesPerVideo = 5
) {
  return authFetch(`${API_BASE}/youtube/search-jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: query.trim(),
      locale,
      matches_per_video: matchesPerVideo
    })
  })
}

/**
 * Fetch the latest snapshot for a keyword search job.
 * @param {string} taskId
 */
export async function getKeywordSearchJob(taskId) {
  return authFetch(`${API_BASE}/youtube/search-jobs/${taskId}`)
}

/**
 * Subscribe to a keyword search job via Server-Sent Events.
 *
 * The implementation reconnects automatically on transient network errors and
 * stops once the job reaches a terminal state (`completed` / `failed`) or a
 * backend `error` event is received.
 *
 * @param {string} taskId
 * @param {object} callbacks
 * @param {(data: object) => void} callbacks.onSnapshot
 * @param {(data: object) => void} callbacks.onUpdate
 * @param {(detail: string) => void} callbacks.onError
 * @returns {() => void} cleanup function
 */
export function streamKeywordSearchJobEvents(taskId, callbacks) {
  const url = `${API_BASE}/youtube/search-jobs/${taskId}/events`
  let eventSource = null
  let reconnectTimer = null
  let retryCount = 0
  let finished = false
  const maxRetries = 10
  const maxDelayMs = 30_000

  function isFinished(data) {
    return data?.status === 'completed' || data?.status === 'failed'
  }

  function handleMessage(data) {
    if (isFinished(data)) {
      finished = true
      close()
    }
  }

  function connect() {
    if (finished) return

    eventSource = new EventSource(url)

    eventSource.addEventListener('snapshot', (event) => {
      retryCount = 0
      try {
        const data = JSON.parse(event.data)
        callbacks.onSnapshot?.(data)
        handleMessage(data)
      } catch (error) {
        callbacks.onError?.(`Invalid SSE snapshot payload: ${error.message}`)
      }
    })

    eventSource.addEventListener('update', (event) => {
      retryCount = 0
      try {
        const data = JSON.parse(event.data)
        callbacks.onUpdate?.(data)
        handleMessage(data)
      } catch (error) {
        callbacks.onError?.(`Invalid SSE update payload: ${error.message}`)
      }
    })

    eventSource.addEventListener('error', (event) => {
      if (finished) return

      // Backend explicitly sent an `event: error` message.
      if (event.data) {
        try {
          const data = JSON.parse(event.data)
          finished = true
          close()
          callbacks.onError?.(data.detail || 'Backend SSE error')
          return
        } catch {
          // Fall through to connection-error handling.
        }
      }

      // Connection-level error: let the browser reconnect a few times, then
      // give up and surface a readable message.
      eventSource.close()

      if (retryCount >= maxRetries) {
        finished = true
        callbacks.onError?.('SSE 連線多次重試後仍失敗，請檢查後端是否仍在運行。')
        return
      }

      const delayMs = Math.min(1000 * 2 ** retryCount, maxDelayMs)
      retryCount += 1
      reconnectTimer = window.setTimeout(connect, delayMs)
    })
  }

  function close() {
    finished = true
    if (reconnectTimer) {
      window.clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
  }

  connect()

  return close
}

/**
 * Search indexed subtitles across all videos.
 * @param {string} query
 * @param {string} [language]
 * @param {number} [limit]
 */
export async function searchSubtitles(query, language = null, limit = 20) {
  const params = new URLSearchParams({ q: query.trim(), limit: String(limit) })
  if (language) {
    params.set('language', language)
  }
  return authFetch(`${API_BASE}/youtube/subtitles/search?${params}`)
}
