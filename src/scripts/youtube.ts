import { PlatformScript } from './platformScript'
import { YouTubeAdapter } from './adapters/YouTubeAdapter'

const adapter = new YouTubeAdapter()
const platformScript = new PlatformScript(adapter)
platformScript.start()
