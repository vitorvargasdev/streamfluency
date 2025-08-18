import { PLATFORMS } from '../injection'

export interface PlatformSelectors {
  head: string
  player: string
  video: string
  captions?: string
  miniPlayer?: string
}

export interface IPlatformAdapter {
  platform: PLATFORMS
  selectors: PlatformSelectors

  /**
   * Check if current page is a video page
   */
  isVideoPage(): boolean

  /**
   * Wait for required elements to be available
   */
  waitForElements(): Promise<{
    head: HTMLElement
    player: HTMLElement
    video: HTMLVideoElement
  }>

  /**
   * Setup observers for platform-specific changes
   */
  setupObservers(onInject: () => void, onRemove: () => void): void

  /**
   * Cleanup observers
   */
  cleanupObservers(): void
}
