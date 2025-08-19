import { inject, remove } from './injection'
import { IPlatformAdapter } from './adapters/IPlatformAdapter'

export class PlatformScript {
  private adapter: IPlatformAdapter
  private isInjected = false

  constructor(adapter: IPlatformAdapter) {
    this.adapter = adapter
  }

  private async injectApp() {
    if (this.isInjected) return

    try {
      const { head, player } = await this.adapter.waitForElements()
      inject(this.adapter.platform, head, player)
      this.isInjected = true
    } catch (error) {
      console.error('StreamFluency: Failed to inject app', error)
    }
  }

  private removeApp() {
    if (!this.isInjected) return

    remove()
    this.isInjected = false
  }

  private async initializeWithDelay() {
    // Wait for platform to fully load
    await new Promise((resolve) => setTimeout(resolve, 2000))

    if (this.adapter.isVideoPage()) {
      const elements = await this.adapter.waitForElements()
      if (elements.video.src) {
        console.log(
          `StreamFluency: Injecting on ${this.adapter.platform} page load after delay`
        )
        await this.injectApp()
      }
    }

    // Setup observers for future navigation
    this.adapter.setupObservers(
      () => this.injectApp(),
      () => this.removeApp()
    )
  }

  start() {
    if (document.readyState === 'complete') {
      this.initializeWithDelay()
    } else {
      window.addEventListener('load', () => this.initializeWithDelay())
    }
  }

  cleanup() {
    this.adapter.cleanupObservers()
    this.removeApp()
  }
}
