import { computed, ref, Ref, watch, nextTick } from 'vue'
import { useSubtitleStore } from '@/app/stores/subtitle'
import { usePlayerStore } from '@/app/stores/player'
import { useSettingStore } from '@/app/stores/setting'
import type { Subtitle } from '@/app/services/subtitle/types'
import type {
  CombinedSubtitle,
  TabType,
  ScrollState,
} from '../components/subtitleListModal/types'
import {
  isOnlyBracketsOrParentheses,
  sanitizeHtml,
} from '../components/subtitleListModal/utils'

export function useSubtitleList(isOpen: Ref<boolean>) {
  const subtitleStore = useSubtitleStore()
  const playerStore = usePlayerStore()
  const settingStore = useSettingStore()

  const currentTime = ref(0)
  const subtitleListRef = ref<HTMLElement | null>(null)
  const currentSubtitleElement = ref<HTMLElement | null>(null)
  const viewMode = computed(() => settingStore.getSubtitleViewMode)
  const activeTab = ref<TabType>('learning')

  const scrollState = ref<ScrollState>({
    hasScrolledToCurrentOnOpen: false,
    hasScrolledToCurrentOnTabChange: {
      learning: false,
      native: false,
    },
  })

  let updateInterval: number | null = null

  const nativeSubtitles = computed(() => subtitleStore.nativeSubtitles)
  const learningSubtitles = computed(() => subtitleStore.learningSubtitles)

  const filteredLearningSubtitles = computed(() =>
    learningSubtitles.value.filter(
      (sub) => !isOnlyBracketsOrParentheses(sub.text)
    )
  )

  const filteredNativeSubtitles = computed(() =>
    nativeSubtitles.value.filter(
      (sub) => !isOnlyBracketsOrParentheses(sub.text)
    )
  )

  const nativeLanguageLabel = computed(() => {
    const lang = settingStore.nativeLanguage
    return lang ? lang.charAt(0).toUpperCase() + lang.slice(1) : 'Português'
  })

  const learningLanguageLabel = computed(() => {
    const lang = settingStore.learningLanguage
    return lang ? lang.charAt(0).toUpperCase() + lang.slice(1) : 'English'
  })

  const combinedSubtitles = computed((): CombinedSubtitle[] => {
    const timeMap = new Map<number, CombinedSubtitle>()

    learningSubtitles.value.forEach((sub) => {
      if (isOnlyBracketsOrParentheses(sub.text)) return

      const key = sub.begin
      const sanitizedText = sanitizeHtml(sub.text)

      if (!timeMap.has(key)) {
        timeMap.set(key, {
          time: sub.begin,
          endTime: sub.end,
          learningText: sanitizedText,
          nativeText: null,
          isCurrent: false,
        })
        return
      }

      const existing = timeMap.get(key)!
      existing.learningText = sanitizedText
      existing.endTime = Math.max(existing.endTime, sub.end)
    })

    nativeSubtitles.value.forEach((sub) => {
      if (isOnlyBracketsOrParentheses(sub.text)) return

      const key = sub.begin
      const sanitizedText = sanitizeHtml(sub.text)

      if (!timeMap.has(key)) {
        timeMap.set(key, {
          time: sub.begin,
          endTime: sub.end,
          learningText: null,
          nativeText: sanitizedText,
          isCurrent: false,
        })
        return
      }

      const existing = timeMap.get(key)!
      existing.nativeText = sanitizedText
      existing.endTime = Math.max(existing.endTime, sub.end)
    })

    const filtered = Array.from(timeMap.values()).filter((item) => {
      const hasValidLearning =
        item.learningText && !isOnlyBracketsOrParentheses(item.learningText)
      const hasValidNative =
        item.nativeText && !isOnlyBracketsOrParentheses(item.nativeText)
      return hasValidLearning || hasValidNative
    })

    const sorted = filtered.sort((a, b) => a.time - b.time)

    sorted.forEach((item, index) => {
      if (currentTime.value >= item.time && currentTime.value <= item.endTime) {
        item.isCurrent = true
        return
      }

      if (index === 0 && currentTime.value < item.time) {
        item.isCurrent = true
        return
      }

      if (index === sorted.length - 1 && currentTime.value > item.endTime) {
        item.isCurrent = true
        return
      }

      if (index <= 0) return

      const prevItem = sorted[index - 1]
      if (
        currentTime.value <= prevItem.endTime ||
        currentTime.value >= item.time
      )
        return

      const distToPrev = currentTime.value - prevItem.endTime
      const distToCurrent = item.time - currentTime.value
      item.isCurrent = distToCurrent < distToPrev
    })

    return sorted
  })

  const updateCurrentTime = () => {
    currentTime.value = playerStore.currentTime()
  }

  const isCurrentTime = (subtitle: Subtitle): boolean => {
    return (
      currentTime.value >= subtitle.begin && currentTime.value <= subtitle.end
    )
  }

  const scrollToCurrentSubtitle = async () => {
    if (!isOpen.value) return

    await nextTick()

    if (!currentSubtitleElement.value || !subtitleListRef.value) return

    const elementTop = currentSubtitleElement.value.offsetTop
    const containerHeight = subtitleListRef.value.clientHeight
    const elementHeight = currentSubtitleElement.value.clientHeight

    const scrollPosition = elementTop - containerHeight / 2 + elementHeight / 2

    subtitleListRef.value.scrollTo({
      top: scrollPosition,
      behavior: 'smooth',
    })
  }

  const jumpToTime = (time: number, onClose: () => void) => {
    playerStore.seekTo(time)
    onClose()
  }

  const startUpdateInterval = () => {
    updateInterval = window.setInterval(() => {
      updateCurrentTime()
    }, 500)
  }

  const stopUpdateInterval = () => {
    if (!updateInterval) return
    clearInterval(updateInterval)
    updateInterval = null
  }

  watch(activeTab, async (newTab) => {
    if (scrollState.value.hasScrolledToCurrentOnTabChange[newTab]) return

    currentSubtitleElement.value = null
    await nextTick()
    await nextTick()
    scrollToCurrentSubtitle()
    scrollState.value.hasScrolledToCurrentOnTabChange[newTab] = true
  })

  watch(
    () => settingStore.getSubtitleViewMode,
    async (newMode) => {
      if (newMode === 'tabs') {
        scrollState.value.hasScrolledToCurrentOnTabChange = {
          learning: false,
          native: false,
        }
      }
      await nextTick()

      if (scrollState.value.hasScrolledToCurrentOnOpen) return

      scrollToCurrentSubtitle()
      scrollState.value.hasScrolledToCurrentOnOpen = true
    }
  )

  return {
    currentTime,
    subtitleListRef,
    currentSubtitleElement,
    viewMode,
    activeTab,
    scrollState,
    nativeLanguageLabel,
    learningLanguageLabel,
    combinedSubtitles,
    filteredLearningSubtitles,
    filteredNativeSubtitles,
    updateCurrentTime,
    isCurrentTime,
    scrollToCurrentSubtitle,
    jumpToTime,
    startUpdateInterval,
    stopUpdateInterval,
  }
}
