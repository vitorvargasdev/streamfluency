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

  isVideoPage(): boolean {
    return window.location.pathname === '/watch'
  }

  async waitForElements(): Promise<{
    head: HTMLElement
    player: HTMLElement
    video: HTMLVideoElement
  }> {
    const waitForElement = (selector: string): Promise<Element> => {
      return new Promise((resolve) => {
        const element = document.querySelector(selector)
        if (element) {
          resolve(element)
          return
        }

        const observer = new MutationObserver((mutations, obs) => {
          const element = document.querySelector(selector)
          if (element) {
            obs.disconnect()
            resolve(element)
          }
        })

        observer.observe(document.body, {
          childList: true,
          subtree: true,
        })
      })
    }

    const [head, player, video] = await Promise.all([
      waitForElement(this.selectors.head),
      waitForElement(this.selectors.player),
      waitForElement(this.selectors.video),
    ])

    return {
      head: head as HTMLElement,
      player: player as HTMLElement,
      video: video as HTMLVideoElement,
    }
  }

  setupObservers(onInject: () => void, onRemove: () => void): void {
    // Observe mini player for page navigation
    this.miniPlayerObserver = new MutationObserver(() => {
      const miniPlayer = document.querySelector(
        this.selectors.miniPlayer!
      ) as HTMLElement
      const isWatchingOnPage = miniPlayer?.hasAttribute('is-watch-page')

      if (!isWatchingOnPage) {
        onRemove()
      } else {
        onInject()
      }
    })

    const miniPlayer = document.querySelector(
      this.selectors.miniPlayer!
    ) as HTMLElement
    if (miniPlayer) {
      this.miniPlayerObserver.observe(miniPlayer, {
        attributes: true,
        attributeFilter: ['is-watch-page'],
      })
    }

    // Observe video src changes
    this.videoObserver = new MutationObserver(() => {
      onRemove()
      onInject()
    })

    const video = document.querySelector(
      this.selectors.video
    ) as HTMLVideoElement
    if (video) {
      this.videoObserver.observe(video, {
        attributes: true,
        attributeFilter: ['src'],
      })
    }
  }

  cleanupObservers(): void {
    this.miniPlayerObserver?.disconnect()
    this.videoObserver?.disconnect()
    this.miniPlayerObserver = null
    this.videoObserver = null
  }
}
