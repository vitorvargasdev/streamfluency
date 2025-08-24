export interface PlatformMatcher {
  name: string
  match: (hostname: string) => boolean
  getVideoId: (url: URL) => string | null
}

const PLATFORM_MATCHERS: PlatformMatcher[] = [
  {
    name: 'youtube',
    match: (hostname) =>
      hostname.includes('youtube.com') || hostname.includes('youtu.be'),
    getVideoId: (url) => {
      const params = new URLSearchParams(url.search)
      const videoId = params.get('v')
      if (videoId) return videoId

      if (url.hostname === 'youtu.be') {
        return url.pathname.slice(1)
      }

      return null
    },
  },
]

export function detectPlatform(url: string): PlatformMatcher | null {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()

    return (
      PLATFORM_MATCHERS.find((platform) => platform.match(hostname)) || null
    )
  } catch {
    return null
  }
}

export function getVideoIdentifier(url: string): string {
  try {
    const urlObj = new URL(url)
    const platform = detectPlatform(url)

    if (platform) {
      const videoId = platform.getVideoId(urlObj)
      if (videoId) {
        return `${platform.name}:${videoId}`
      }
    }

    return `${urlObj.origin}${urlObj.pathname}`
  } catch {
    return url
  }
}

export function isSameVideo(
  url1: string | undefined,
  url2: string | undefined
): boolean {
  if (!url1 || !url2) return false
  return getVideoIdentifier(url1) === getVideoIdentifier(url2)
}

export function formatVideoTime(seconds: number | undefined): string {
  if (seconds === undefined) return ''
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
