import { inject, remove } from "./injection"

let miniPlayerObserver: MutationObserver | null = null

const miniPlayerMutationHandler = (mutations: MutationRecord[]) => {
  const watchOnPageAttribute = mutations.find(
    (mutation) => mutation.attributeName == 'is-watch-page'
  )

  if (!watchOnPageAttribute) {
    return
  }

  const miniPlayer = watchOnPageAttribute.target as HTMLElement
  const isWatchingOnPage = miniPlayer.hasAttribute('is-watch-page')

  if (!isWatchingOnPage) {
    remove()
    return
  }
  const head = document.querySelector("head") as HTMLElement
  const player = document.querySelector("#movie_player") as HTMLElement

  inject(head, player)
}

const observeYoutubePlayerPosition = () => {
  miniPlayerObserver = new MutationObserver(miniPlayerMutationHandler)
  const miniPlayer = document.querySelector('ytd-miniplayer') as HTMLElement
  miniPlayerObserver.observe(miniPlayer, {
    attributes: true,
  })
}

const startObservation = () => {
  observeYoutubePlayerPosition()
}

startObservation()
