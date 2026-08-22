import { computed, reactive } from 'vue'

import {
  exchangeGoogleCode,
  fetchMe,
  fetchSearchHistory,
  getGoogleLoginUrl,
  refreshAccessToken
} from '@/api/auth.js'

const ACCESS_TOKEN_KEY = 'youindexer_access_token'
const REFRESH_TOKEN_KEY = 'youindexer_refresh_token'

function getStored(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function setStored(key, value) {
  try {
    if (value) {
      localStorage.setItem(key, value)
    } else {
      localStorage.removeItem(key)
    }
  } catch {
    // ignore
  }
}

function decodeJwtPayload(token) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(base64)
    return JSON.parse(json)
  } catch {
    return null
  }
}

function isTokenExpired(token) {
  const payload = decodeJwtPayload(token)
  if (!payload?.exp) return false
  // Expire 30 seconds early to avoid edge cases.
  return payload.exp * 1000 < Date.now() + 30_000
}

const state = reactive({
  accessToken: getStored(ACCESS_TOKEN_KEY),
  refreshToken: getStored(REFRESH_TOKEN_KEY),
  user: null,
  initialized: false
})

export const isLoggedIn = computed(() => !!state.accessToken)
export const currentUser = computed(() => state.user)
export const authInitialized = computed(() => state.initialized)

export function setTokens({ access_token, refresh_token }) {
  state.accessToken = access_token
  state.refreshToken = refresh_token
  setStored(ACCESS_TOKEN_KEY, access_token)
  setStored(REFRESH_TOKEN_KEY, refresh_token)
}

export function clearAuth() {
  state.accessToken = null
  state.refreshToken = null
  state.user = null
  setStored(ACCESS_TOKEN_KEY, null)
  setStored(REFRESH_TOKEN_KEY, null)
}

export function getAuthHeaders() {
  return state.accessToken
    ? { Authorization: `Bearer ${state.accessToken}` }
    : {}
}

export async function ensureValidAccessToken() {
  if (!state.accessToken) return null

  if (!isTokenExpired(state.accessToken)) {
    return state.accessToken
  }

  if (!state.refreshToken) {
    clearAuth()
    throw new Error('登入階段已過期，請重新登入')
  }

  try {
    const tokens = await refreshAccessToken(state.refreshToken)
    setTokens(tokens)
    return tokens.access_token
  } catch (error) {
    clearAuth()
    throw new Error('登入階段已過期，請重新登入')
  }
}

export async function initAuth() {
  if (state.accessToken) {
    try {
      await ensureValidAccessToken()
      if (state.accessToken) {
        state.user = await fetchMe(state.accessToken)
      }
    } catch {
      clearAuth()
    }
  }
  state.initialized = true
}

export async function loginWithGoogle() {
  const redirectUri = `${window.location.origin}/login`
  const { authorization_url: authorizationUrl } = await getGoogleLoginUrl(redirectUri)
  window.location.href = authorizationUrl
}

export async function handleGoogleCallback(code, redirectUri) {
  const tokens = await exchangeGoogleCode(code, redirectUri)
  setTokens(tokens)
  state.user = await fetchMe(tokens.access_token)
  return state.user
}

export async function logout() {
  clearAuth()
}

export async function fetchUserSearchHistory(pagination = {}) {
  const token = await ensureValidAccessToken()
  if (!token) {
    clearAuth()
    throw new Error('請先登入')
  }
  return fetchSearchHistory(token, pagination)
}
