export function getApiErrorMessage(body, status) {
  if (Array.isArray(body?.errors) && body.errors.length > 0) {
    return body.errors.join('; ')
  }
  return body?.message || body?.detail || `HTTP ${status}`
}

export async function handleApiResponse(response) {
  if (response.status === 204) return null

  let body = null
  try {
    body = await response.json()
  } catch {
    // Keep the HTTP status as the fallback for empty or non-JSON responses.
  }

  if (!response.ok || body?.success === false) {
    throw new Error(getApiErrorMessage(body, response.status))
  }

  // JSON API endpoints return their payload inside the envelope's data field.
  return body && Object.prototype.hasOwnProperty.call(body, 'data') ? body.data : body
}
