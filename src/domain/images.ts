export function uniqueImageUrls(urls: string[]): string[] {
  const seen = new Set<string>()
  const unique: string[] = []

  for (const url of urls) {
    if (!isLikelyPropertyImageUrl(url)) {
      continue
    }

    const key = imageIdentityKey(url)
    if (!key || seen.has(key)) {
      continue
    }

    seen.add(key)
    unique.push(url)
  }

  return unique
}

export function listingPreviewImages(urls: string[]): { primary?: string; thumbnails: string[] } {
  const unique = uniqueImageUrls(urls)
  return {
    primary: unique[0],
    thumbnails: unique.slice(1, 4),
  }
}

export function imageIdentityKey(url: string): string | undefined {
  try {
    const parsed = new URL(url)
    const hostname = parsed.hostname.toLowerCase()
    const pathname = safeDecode(parsed.pathname)
      .toLowerCase()
      .replace(/\/img\/(?:xsm|sml|med|lrg|xlg|xxl)\//g, '/img/')
      .replace(/\/(?:thumb|thumbnail|small|medium|large|xlarge|xxlarge)\//g, '/')
      .replace(/([_-])(?:\d{2,4}x\d{2,4}|\d{2,4}w|\d{2,4}h)(?=\.)/g, '')

    return `${hostname}${pathname}`
  } catch {
    return url.trim().toLowerCase() || undefined
  }
}

export function isLikelyPropertyImageUrl(url: string): boolean {
  const decoded = safeDecode(url).trim().toLowerCase()
  if (!decoded) {
    return false
  }

  if (
    decoded.includes('<svg') ||
    /\.(?:svg)(?:[?#]|$)/i.test(decoded) ||
    /(?:logo|sprite|icon|placeholder|avatar|symbol|cozy-static|default\/logo)/i.test(decoded)
  ) {
    return false
  }

  return /\.(?:avif|gif|jpe?g|png|webp)(?:[?#]|$)/i.test(decoded) || /cloudfront|zapimoveis|vivareal/i.test(decoded)
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}
