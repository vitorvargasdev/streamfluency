export interface PlatformMatcher {
  name: string
  match: (hostname: string) => boolean
  getVideoId: (url: URL) => string | null
}

// Define platform matchers
const PLATFORM_MATCHERS: PlatformMatcher[] = [
  {
    name: 'youtube',
    match: (hostname) =>
      hostname.includes('youtube.com') || hostname.includes('youtu.be'),
    getVideoId: (url) => {
      const params = new URLSearchParams(url.search)
      // Standard YouTube URL
      const videoId = params.get('v')
      if (videoId) return videoId

      // Short YouTube URL (youtu.be/VIDEO_ID)
      if (url.hostname === 'youtu.be') {
        return url.pathname.slice(1)
      }

      return null
    },
  },
]

/**
 * Detects the platform from a URL
 */
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

/**
 * Gets a unique video identifier from a URL
 */
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

    // Fallback for unknown platforms: use origin + pathname
    return `${urlObj.origin}${urlObj.pathname}`
  } catch {
    // If URL parsing fails, return the original URL
    return url
  }
}

/**
 * Checks if two URLs point to the same video
 */
export function isSameVideo(
  url1: string | undefined,
  url2: string | undefined
): boolean {
  if (!url1 || !url2) return false
  return getVideoIdentifier(url1) === getVideoIdentifier(url2)
}

/**
 * Formats seconds to MM:SS format
 */
export function formatVideoTime(seconds: number | undefined): string {
  if (seconds === undefined) return ''
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
