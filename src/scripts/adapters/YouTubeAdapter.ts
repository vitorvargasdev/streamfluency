import { PLATFORMS } from '../injection'
import { IPlatformAdapter, PlatformSelectors } from './IPlatformAdapter'

export class YouTubeAdapter implements IPlatformAdapter {
  platform = PLATFORMS.YOUTUBE
  selectors: PlatformSelectors = {
    head: 'head',
    player: 'ytd-player',
    video: 'video',
    captions: '.ytp-caption-window-container',
    miniPlayer: 'ytd-miniplayer',
  }

  private miniPlayerObserver: MutationObserver | null = null
  private videoObserver: MutationObserver | null = null
  private navigationObserver: MutationObserver | null = null

  isVideoPage(): boolean {
    return window.location.pathname === '/watch'
  }

  shouldEnableApp(): boolean {
    const miniPlayer = document.querySelector('ytd-miniplayer')
    if (
      miniPlayer &&
      (miniPlayer.hasAttribute('active') ||
        miniPlayer.classList.contains('active'))
    ) {
      return false
    }

    if (window.location.pathname.startsWith('/shorts/')) {
      return false
    }

    if (!this.isVideoPage()) {
      return false
    }

    return true
  }

  async waitForElements(): Promise<{
    head: HTMLElement
    player: HTMLElement
    video: HTMLVideoElement
  }> {
    const waitForElement = (
      selector: string,
      timeout = 10000
    ): Promise<Element | null> => {
      return new Promise((resolve) => {
        const element = document.querySelector(selector)
        if (element) {
          resolve(element)
          return
        }

        let timeoutId: NodeJS.Timeout | null = null

        const observer = new MutationObserver((_, obs) => {
          const element = document.querySelector(selector)
          if (element) {
            if (timeoutId) clearTimeout(timeoutId)
            obs.disconnect()
            resolve(element)
          }
        })

        observer.observe(document.body, {
          childList: true,
          subtree: true,
        })

        timeoutId = setTimeout(() => {
          observer.disconnect()
          resolve(null)
        }, timeout)
      })
    }

    const playerSelectors = [
      'ytd-player',
      '#movie_player',
      '.html5-video-player',
      '#player',
    ]

    let player: Element | null = null
    for (const selector of playerSelectors) {
      player = await waitForElement(selector, 2000)
      if (player) break
    }

    if (!player) {
      player = await waitForElement(this.selectors.player, 5000)
    }

    const [head, video] = await Promise.all([
      waitForElement(this.selectors.head),
      waitForElement(this.selectors.video),
    ])

    if (!head || !player || !video) {
      throw new Error('Failed to find required YouTube elements')
    }

    return {
      head: head as HTMLElement,
      player: player as HTMLElement,
      video: video as HTMLVideoElement,
    }
  }

  private setupMiniPlayerObserver(
    onInject: () => void,
    onRemove: () => void
  ): void {
    const miniPlayer = document.querySelector(
      this.selectors.miniPlayer!
    ) as HTMLElement

    if (!miniPlayer || this.miniPlayerObserver) return

    this.miniPlayerObserver = new MutationObserver(() => {
      if (!this.shouldEnableApp()) {
        onRemove()
        return
      }

      const isWatchingOnPage = miniPlayer.hasAttribute('is-watch-page')
      if (!isWatchingOnPage) {
        onRemove()
        return
      }

      onInject()
    })

    this.miniPlayerObserver.observe(miniPlayer, {
      attributes: true,
      attributeFilter: ['is-watch-page', 'active'],
    })
  }

  private setupVideoObserver(onInject: () => void, onRemove: () => void): void {
    const video = document.querySelector(
      this.selectors.video
    ) as HTMLVideoElement

    if (!video || this.videoObserver) return

    let lastSrc = video.src

    this.videoObserver = new MutationObserver(() => {
      if (video.src === lastSrc) return

      lastSrc = video.src
      onRemove()

      if (!this.shouldEnableApp()) return

      setTimeout(() => onInject(), 500)
    })

    this.videoObserver.observe(video, {
      attributes: true,
      attributeFilter: ['src'],
    })
  }

  setupObservers(onInject: () => void, onRemove: () => void): void {
    this.setupMiniPlayerObserver(onInject, onRemove)
    this.setupVideoObserver(onInject, onRemove)

    if (!this.navigationObserver) {
      this.navigationObserver = new MutationObserver(() => {
        if (!this.miniPlayerObserver)
          this.setupMiniPlayerObserver(onInject, onRemove)
        if (!this.videoObserver) this.setupVideoObserver(onInject, onRemove)
      })

      this.navigationObserver.observe(document.body, {
        childList: true,
        subtree: true,
      })
    }
  }

  cleanupObservers(): void {
    this.miniPlayerObserver?.disconnect()
    this.videoObserver?.disconnect()
    this.navigationObserver?.disconnect()
    this.miniPlayerObserver = null
    this.videoObserver = null
    this.navigationObserver = null
  }
}
