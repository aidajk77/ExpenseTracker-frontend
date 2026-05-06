/**
 * Get a cookie value by name
 * @param name - Cookie name
 * @returns Cookie value or null if not found
 */
export function getCookie(name: string): string | null {
  const nameEQ = name + '='
  const cookies = document.cookie.split(';')

  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i].trim()
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length))
    }
  }

  return null
}

/**
 * Set a cookie with optional expiration
 * @param name - Cookie name
 * @param value - Cookie value
 * @param maxAge - Max age in seconds (optional)
 */
export function setCookie(
  name: string,
  value: string,
  maxAge?: number
): void {
  let cookieString = `${name}=${encodeURIComponent(value)}`

  if (maxAge) {
    cookieString += `; Max-Age=${maxAge}`
  }

  cookieString += '; Path=/'

  document.cookie = cookieString
}

/**
 * Remove a cookie by name
 * @param name - Cookie name
 */
export function removeCookie(name: string): void {
  setCookie(name, '', 0)
}