import { computed } from 'vue'
import { useVocabularyStore } from '../stores/vocabulary'
import { useSettingStore } from '../stores/setting'
import type { VocabularyItem } from '../stores/vocabulary/types'

export function useSubtitleHighlighting() {
  const vocabularyStore = useVocabularyStore()
  const settingStore = useSettingStore()

  if (vocabularyStore.items.length === 0 && !vocabularyStore.isLoading) {
    vocabularyStore.init()
  }

  const escapeRegex = (text: string): string => {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  const highlightSubtitleInHtml = (
    html: string,
    vocabularyItems: VocabularyItem[]
  ): string => {
    try {
      const container = document.createElement('div')
      container.innerHTML = html

      const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            const parent = (node as Text).parentElement
            return parent?.classList?.contains('vocabulary-highlight')
              ? NodeFilter.FILTER_REJECT
              : NodeFilter.FILTER_ACCEPT
          },
        }
      )

      const textNodes: Text[] = []
      let node
      while ((node = walker.nextNode())) {
        textNodes.push(node as Text)
      }

      const sortedVocabulary = [...vocabularyItems].sort(
        (a, b) => b.text.length - a.text.length
      )

      textNodes.forEach((textNode) => {
        const text = textNode.textContent || ''
        let hasChanges = false
        const fragments: (string | { highlight: string })[] = []
        let lastIndex = 0

        sortedVocabulary.forEach((item) => {
          const escapedText = escapeRegex(item.text)
          const regex = new RegExp(`\\b${escapedText}\\b`, 'gi')

          let match
          regex.lastIndex = 0
          while ((match = regex.exec(text)) !== null) {
            if (match.index < lastIndex) continue

            hasChanges = true
            if (match.index > lastIndex) {
              fragments.push(text.substring(lastIndex, match.index))
            }
            fragments.push({ highlight: match[0] })
            lastIndex = match.index + match[0].length
          }
        })

        if (!hasChanges) return

        if (lastIndex < text.length) {
          fragments.push(text.substring(lastIndex))
        }

        const fragment = document.createDocumentFragment()
        fragments.forEach((part) => {
          if (typeof part === 'string') {
            fragment.appendChild(document.createTextNode(part))
            return
          }
          const span = document.createElement('span')
          span.className = 'vocabulary-highlight'
          span.textContent = part.highlight
          fragment.appendChild(span)
        })

        if (textNode.parentNode) {
          textNode.parentNode.replaceChild(fragment, textNode)
        }
      })

      return container.innerHTML
    } catch {
      return html
    }
  }

  const highlightSubtitle = computed(() => {
    return (subtitleText: string): string => {
      if (!settingStore.isVocabularyHighlightEnabled || !subtitleText) {
        return subtitleText
      }

      const vocabularyItems = vocabularyStore.itemsSortedByLength
      if (!vocabularyItems?.length) return subtitleText

      const hasHtml = /<[^>]*>/.test(subtitleText)
      if (hasHtml) {
        return highlightSubtitleInHtml(subtitleText, vocabularyItems)
      }

      let highlightedText = subtitleText
      const alreadyHighlighted = new Set<string>()

      vocabularyItems.forEach((item) => {
        const vocabText = item.text
        if (alreadyHighlighted.has(vocabText.toLowerCase())) return

        const escapedText = escapeRegex(vocabText)
        const regex = new RegExp(`\\b${escapedText}\\b`, 'gi')

        highlightedText = highlightedText.replace(
          regex,
          (match, offset, string) => {
            const beforeMatch = string.substring(0, offset)
            const afterMatch = string.substring(offset + match.length)

            if (
              beforeMatch.lastIndexOf('<span') >
                beforeMatch.lastIndexOf('</span>') ||
              afterMatch.indexOf('</span>') < afterMatch.indexOf('<span')
            ) {
              return match
            }

            alreadyHighlighted.add(match.toLowerCase())
            return `<span class="vocabulary-highlight">${match}</span>`
          }
        )
      })

      return highlightedText
    }
  })

  const highlightSubtitleWithContext = computed(() => {
    return (subtitleText: string, context?: string): string => {
      if (!settingStore.isVocabularyHighlightEnabled || !subtitleText) {
        return subtitleText
      }

      const vocabularyItems = vocabularyStore.itemsSortedByLength
      if (!vocabularyItems?.length) return subtitleText

      const relevantItems = context
        ? vocabularyItems.filter(
            (item) =>
              !item.context ||
              item.context.toLowerCase().includes(context.toLowerCase()) ||
              context.toLowerCase().includes(item.context.toLowerCase())
          )
        : vocabularyItems

      if (!relevantItems.length) return subtitleText

      const hasHtml = /<[^>]*>/.test(subtitleText)
      if (hasHtml) {
        return highlightSubtitleInHtml(subtitleText, relevantItems)
      }

      let highlightedText = subtitleText
      const alreadyHighlighted = new Set<string>()

      relevantItems.forEach((item) => {
        const vocabText = item.text
        if (alreadyHighlighted.has(vocabText.toLowerCase())) return

        const escapedText = escapeRegex(vocabText)
        const regex = new RegExp(`\\b${escapedText}\\b`, 'gi')

        highlightedText = highlightedText.replace(
          regex,
          (match, offset, string) => {
            const beforeMatch = string.substring(0, offset)
            const afterMatch = string.substring(offset + match.length)

            if (
              beforeMatch.lastIndexOf('<span') >
                beforeMatch.lastIndexOf('</span>') ||
              afterMatch.indexOf('</span>') < afterMatch.indexOf('<span')
            ) {
              return match
            }

            alreadyHighlighted.add(match.toLowerCase())
            return `<span class="vocabulary-highlight">${match}</span>`
          }
        )
      })

      return highlightedText
    }
  })

  const isHighlightingEnabled = computed(() => {
    return settingStore.isVocabularyHighlightEnabled
  })

  const vocabularyCount = computed(() => {
    return vocabularyStore.items.length
  })

  return {
    highlightSubtitle,
    highlightSubtitleWithContext,
    isHighlightingEnabled,
    vocabularyCount,
  }
}
