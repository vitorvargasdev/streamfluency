import { inject, remove } from './injection'
import { IPlatformAdapter } from './adapters/IPlatformAdapter'

export class PlatformScript {
  private adapter: IPlatformAdapter
  private isInjected = false
  private retryInterval: NodeJS.Timeout | null = null
  private initAttempts = 0
  private maxAttempts = 10

  constructor(adapter: IPlatformAdapter) {
    this.adapter = adapter
  }

  private async injectApp() {
    if (this.isInjected) return

    if (this.adapter.shouldEnableApp && !this.adapter.shouldEnableApp()) {
      console.log('StreamFluency: App disabled for current page context')
      return false
    }

    try {
      const { head, player, video } = await this.adapter.waitForElements()

      if (!video.src) {
        console.log('StreamFluency: Video source not ready, retrying...')
        return false
      }

      inject(this.adapter.platform, head, player)
      this.isInjected = true
      console.log(
        `StreamFluency: Successfully injected on ${this.adapter.platform}`
      )
      return true
    } catch (error) {
      console.error('StreamFluency: Failed to inject app', error)
      return false
    }
  }

  private removeApp() {
    if (!this.isInjected) return

    remove()
    this.isInjected = false
    console.log('StreamFluency: App removed')
  }

  private async tryInitialize() {
    this.initAttempts++

    const hasVideo = document.querySelector('video') !== null
    const isVideoPage = this.adapter.isVideoPage()

    if (hasVideo || isVideoPage) {
      console.log(
        `StreamFluency: Attempting to initialize (attempt ${this.initAttempts}/${this.maxAttempts})`
      )

      const success = await this.injectApp()

      if (success) {
        if (this.retryInterval) {
          clearInterval(this.retryInterval)
          this.retryInterval = null
        }

        this.adapter.setupObservers(
          () => this.injectApp(),
          () => this.removeApp()
        )

        return true
      }
    }

    if (this.initAttempts >= this.maxAttempts && this.retryInterval) {
      console.log('StreamFluency: Max initialization attempts reached')
      clearInterval(this.retryInterval)
      this.retryInterval = null

      this.adapter.setupObservers(
        () => this.injectApp(),
        () => this.removeApp()
      )
    }

    return false
  }

  private async initializeWithRetry() {
    await this.tryInitialize()

    if (!this.isInjected && !this.retryInterval) {
      this.retryInterval = setInterval(() => {
        this.tryInitialize()
      }, 3000)
    }
  }

  start() {
    console.log('StreamFluency: Starting platform script')

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () =>
        this.initializeWithRetry()
      )
      this.setupNavigationListener()
      return
    }

    this.initializeWithRetry()
    this.setupNavigationListener()
  }

  private setupNavigationListener() {
    let lastUrl = location.href

    const checkUrlChange = () => {
      const currentUrl = location.href
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl
        console.log('StreamFluency: URL changed, reinitializing...')
        this.initAttempts = 0
        this.removeApp()
        this.initializeWithRetry()
      }
    }

    setInterval(checkUrlChange, 1000)

    window.addEventListener('popstate', checkUrlChange)

    window.addEventListener('yt-navigate-finish', () => {
      console.log('StreamFluency: YouTube navigation detected')
      this.initAttempts = 0
      this.removeApp()
      this.initializeWithRetry()
    })
  }

  cleanup() {
    if (this.retryInterval) {
      clearInterval(this.retryInterval)
      this.retryInterval = null
    }
    this.adapter.cleanupObservers()
    this.removeApp()
  }
}
