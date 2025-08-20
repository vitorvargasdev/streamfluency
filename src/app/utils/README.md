# Platform Matcher Utility

This utility helps identify and compare videos across different streaming platforms.

## Adding Support for a New Platform

To add support for a new video platform, simply add a new entry to the `PLATFORM_MATCHERS` array in `platformMatcher.ts`:

```typescript
{
  name: 'your-platform',
  match: (hostname) => hostname.includes('your-platform.com'),
  getVideoId: (url) => {
    // Extract unique video ID from URL
    // Return null if no video ID found
    const match = url.pathname.match(/your-pattern/)
    return match ? match[1] : null
  }
}
```

## Supported Platforms

- **YouTube** - youtube.com, youtu.be

## Usage

```typescript
import { isSameVideo, formatVideoTime } from '@/app/utils/platformMatcher'

// Check if two URLs point to the same video
if (isSameVideo(url1, url2)) {
  console.log('Same video!')
}

// Format seconds to MM:SS
const timeString = formatVideoTime(125) // "2:05"
```

## How It Works

1. Each platform has a matcher that identifies if a URL belongs to it
2. The matcher extracts a unique video ID from the URL
3. Videos are compared using the format `platform:videoId`
4. Unknown platforms fallback to comparing origin + pathname
