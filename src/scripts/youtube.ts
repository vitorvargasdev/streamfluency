import { inject, remove } from './injection'

let miniPlayerObserver: MutationObserver | null = null
let videoObserver: MutationObserver | null = null

const injectApp = () => {
  const head = document.querySelector('head') as HTMLElement
  const player = document.querySelector('#movie_player') as HTMLElement
  inject(head, player)
  removeYoutubeCaptions()
}

const removeYoutubeCaptions = () => {
  document.querySelector('.ytp-caption-window-container')?.remove()
}

const miniPlayerMutationHandler = () => {
  const miniPlayer = document.querySelector('ytd-miniplayer') as HTMLElement
  const isWatchingOnPage = miniPlayer.hasAttribute('is-watch-page')

  if (!isWatchingOnPage) {
    remove()
    return
  }

  injectApp()
}

const videoMutationHandler = () => {
  remove()
  injectApp()
}

const observeYoutubePlayerPosition = () => {
  miniPlayerObserver = new MutationObserver(miniPlayerMutationHandler)
  const miniPlayer = document.querySelector('ytd-miniplayer') as HTMLElement

  if (!miniPlayer) {
    console.error('Mini player not found')
    return
  }

  miniPlayerObserver.observe(miniPlayer, {
    attributes: true,
    attributeFilter: ['is-watch-page'],
  })
}

const observeVideoChanged = () => {
  videoObserver = new MutationObserver(videoMutationHandler)
  const video = document.querySelector('video') as HTMLVideoElement

  if (!video) {
    console.error('Video not found')
    return
  }

  videoObserver.observe(video, {
    attributes: true,
    attributeFilter: ['src'],
  })
}

const startObservation = () => {
  observeYoutubePlayerPosition()
  observeVideoChanged()
}

startObservation()
