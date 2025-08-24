import {
  POPUP_CONFIG,
  CSS_SELECTORS,
} from '../components/selectionPopup/constants'

declare global {
  interface Window {
    __streamfluencyPopupInstance?: string
  }
}

export interface SelectionHandler {
  onTextSelected: (text: string, context: string) => void
}

export function useTextSelection(
  instanceId: string,
  mode: string | undefined,
  handler: SelectionHandler
) {
  let selectionDebounceTimer: ReturnType<typeof setTimeout> | null = null

  const extractContext = (element: HTMLElement | null): string => {
    if (!element) return ''

    const clone = element.cloneNode(true) as HTMLElement
    clone.querySelectorAll('br').forEach((br) => {
      br.replaceWith(' ')
    })
    return clone.textContent?.replace(/\s+/g, ' ').trim() || ''
  }

  const getSelectionInfo = () => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) return null

    const text = selection.toString().trim()
    if (!text) return null

    const range = selection.getRangeAt(0)
    const container = range.commonAncestorContainer

    return { selection, text, range, container }
  }

  const isValidSelection = (container: Node): boolean => {
    const subtitleDisplay = document.querySelector(
      CSS_SELECTORS.SUBTITLE_DISPLAY
    )
    if (!subtitleDisplay) return false

    const isInSubtitle =
      subtitleDisplay.contains(container) || subtitleDisplay === container
    if (!isInSubtitle) return false

    const subtitleElement =
      container.nodeType === Node.TEXT_NODE
        ? container.parentElement?.closest(CSS_SELECTORS.SUBTITLE_LINE)
        : (container as HTMLElement).closest(CSS_SELECTORS.SUBTITLE_LINE)

    return !subtitleElement?.classList.contains(
      CSS_SELECTORS.SUBTITLE_SECONDARY
    )
  }

  const handleSelectionChange = () => {
    if (selectionDebounceTimer) {
      clearTimeout(selectionDebounceTimer)
      selectionDebounceTimer = null
    }

    if (window.__streamfluencyPopupInstance !== instanceId) return

    const selectionInfo = getSelectionInfo()
    if (!selectionInfo) return

    selectionDebounceTimer = setTimeout(() => {
      const currentInfo = getSelectionInfo()
      if (!currentInfo || currentInfo.text !== selectionInfo.text) return

      if (!isValidSelection(currentInfo.container)) return

      const subtitleElement =
        currentInfo.container.nodeType === Node.TEXT_NODE
          ? currentInfo.container.parentElement?.closest(
              CSS_SELECTORS.SUBTITLE_LINE
            )
          : (currentInfo.container as HTMLElement).closest(
              CSS_SELECTORS.SUBTITLE_LINE
            )

      const context = extractContext(subtitleElement as HTMLElement)

      handler.onTextSelected(currentInfo.text, context)
    }, POPUP_CONFIG.DEBOUNCE.SELECTION)
  }

  const setupSelectionListener = () => {
    if (mode !== 'vocabulary') {
      if (window.__streamfluencyPopupInstance) return false

      window.__streamfluencyPopupInstance = instanceId
      document.addEventListener('selectionchange', handleSelectionChange)
      return true
    }
    return false
  }

  const cleanupSelectionListener = () => {
    if (selectionDebounceTimer) {
      clearTimeout(selectionDebounceTimer)
    }

    if (
      mode !== 'vocabulary' &&
      window.__streamfluencyPopupInstance === instanceId
    ) {
      delete window.__streamfluencyPopupInstance
      document.removeEventListener('selectionchange', handleSelectionChange)
    }
  }

  return {
    setupSelectionListener,
    cleanupSelectionListener,
  }
}
