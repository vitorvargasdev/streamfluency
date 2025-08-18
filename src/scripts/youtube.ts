import { PlatformScript } from './platformScript'
import { YouTubeAdapter } from './adapters/YouTubeAdapter'

// Create and start YouTube platform script
const adapter = new YouTubeAdapter()
const platformScript = new PlatformScript(adapter)
platformScript.start()
