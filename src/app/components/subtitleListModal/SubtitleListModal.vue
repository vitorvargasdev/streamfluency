<script lang="ts">
import {
  defineComponent,
  computed,
  ref,
  watch,
  onMounted,
  onUnmounted,
  nextTick,
} from 'vue'
import { useSubtitleStore } from '@/app/stores/subtitle'
import { usePlayerStore } from '@/app/stores/player'
import { useSettingStore } from '@/app/stores/setting'
import { Subtitle } from '@/app/services/subtitle/types'
import GenericModal from '@/app/components/genericModal/GenericModal.vue'
import ViewModeToggle from '@/app/components/viewModeToggle/ViewModeToggle.vue'

interface CombinedSubtitle {
  time: number
  endTime: number
  learningText: string | null
  nativeText: string | null
  isCurrent: boolean
}

export default defineComponent({
  name: 'SubtitleListModal',
  components: {
    GenericModal,
    ViewModeToggle,
  },
  props: {
    isOpen: {
      type: Boolean,
      required: true,
    },
  },
  emits: ['close'],
  setup(props, { emit }) {
    const subtitleStore = useSubtitleStore()
    const playerStore = usePlayerStore()
    const settingStore = useSettingStore()

    const currentTime = ref(0)
    const subtitleListRef = ref<HTMLElement | null>(null)
    const currentSubtitleElement = ref<HTMLElement | null>(null)
    const viewMode = computed(() => settingStore.getSubtitleViewMode)
    const activeTab = ref<'learning' | 'native'>('learning')
    const hasScrolledToCurrentOnOpen = ref(false)
    const hasScrolledToCurrentOnTabChange = ref<Record<string, boolean>>({
      learning: false,
      native: false,
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

    const isOnlyBracketsOrParentheses = (text: string | null): boolean => {
      if (!text) return false
      const trimmed = text.trim()
      // Check if text is only brackets/parentheses with content inside
      // Matches [xxx], (xxx), or combinations like [Music], (Applause), etc.
      return /^\[[^\]]*\]$/.test(trimmed) || /^\([^)]*\)$/.test(trimmed)
    }

    const sanitizeHtml = (text: string): string => {
      // Simple sanitization: escape all HTML except <br> and <br/>
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/&lt;br\s*\/?&gt;/gi, '<br />') // Restore br tags
    }

    const combinedSubtitles = computed((): CombinedSubtitle[] => {
      const combined: CombinedSubtitle[] = []
      const timeMap = new Map<number, CombinedSubtitle>()

      // Add learning subtitles
      learningSubtitles.value.forEach((sub) => {
        // Skip subtitles that are only brackets or parentheses
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
        } else {
          const existing = timeMap.get(key)!
          existing.learningText = sanitizedText
          existing.endTime = Math.max(existing.endTime, sub.end)
        }
      })

      // Add native subtitles
      nativeSubtitles.value.forEach((sub) => {
        // Skip subtitles that are only brackets or parentheses
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
        } else {
          const existing = timeMap.get(key)!
          existing.nativeText = sanitizedText
          existing.endTime = Math.max(existing.endTime, sub.end)
        }
      })

      // Filter out entries where both texts are null or only brackets/parentheses
      const filtered = Array.from(timeMap.values()).filter((item) => {
        const hasValidLearning =
          item.learningText && !isOnlyBracketsOrParentheses(item.learningText)
        const hasValidNative =
          item.nativeText && !isOnlyBracketsOrParentheses(item.nativeText)
        return hasValidLearning || hasValidNative
      })

      // Sort by time
      const sorted = filtered.sort((a, b) => a.time - b.time)

      // Mark current subtitle
      sorted.forEach((item, index) => {
        if (
          currentTime.value >= item.time &&
          currentTime.value <= item.endTime
        ) {
          item.isCurrent = true
        } else if (index === 0 && currentTime.value < item.time) {
          item.isCurrent = true
        } else if (
          index === sorted.length - 1 &&
          currentTime.value > item.endTime
        ) {
          item.isCurrent = true
        } else if (index > 0) {
          const prevItem = sorted[index - 1]
          if (
            currentTime.value > prevItem.endTime &&
            currentTime.value < item.time
          ) {
            const distToPrev = currentTime.value - prevItem.endTime
            const distToCurrent = item.time - currentTime.value
            item.isCurrent = distToCurrent < distToPrev
          }
        }
      })

      return sorted
    })

    const handleClose = () => {
      emit('close')
    }

    const formatTime = (seconds: number): string => {
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const jumpToTime = (time: number) => {
      playerStore.seekTo(time)
      handleClose()
    }

    const updateCurrentTime = () => {
      currentTime.value = playerStore.currentTime()
    }

    const isCurrentTime = (subtitle: Subtitle): boolean => {
      return (
        currentTime.value >= subtitle.begin && currentTime.value <= subtitle.end
      )
    }

    const scrollToCurrentSubtitle = async () => {
      if (!props.isOpen) return

      await nextTick()

      if (currentSubtitleElement.value && subtitleListRef.value) {
        const elementTop = currentSubtitleElement.value.offsetTop
        const containerHeight = subtitleListRef.value.clientHeight
        const elementHeight = currentSubtitleElement.value.clientHeight

        const scrollPosition =
          elementTop - containerHeight / 2 + elementHeight / 2

        subtitleListRef.value.scrollTo({
          top: scrollPosition,
          behavior: 'smooth',
        })
      }
    }

    // Watch for tab changes and scroll to current subtitle only first time
    watch(activeTab, async (newTab) => {
      if (!hasScrolledToCurrentOnTabChange.value[newTab]) {
        currentSubtitleElement.value = null // Reset the ref
        await nextTick()
        await nextTick() // Double nextTick to ensure DOM is fully updated
        scrollToCurrentSubtitle()
        hasScrolledToCurrentOnTabChange.value[newTab] = true
      }
    })

    // Watch for view mode changes - reset scroll flags for tabs
    watch(
      () => settingStore.getSubtitleViewMode,
      async (newMode) => {
        if (newMode === 'tabs') {
          // Reset tab scroll flags when switching to tabs mode
          hasScrolledToCurrentOnTabChange.value = {
            learning: false,
            native: false,
          }
        }
        await nextTick()
        // Scroll to current on mode change only if not scrolled yet
        if (!hasScrolledToCurrentOnOpen.value) {
          scrollToCurrentSubtitle()
          hasScrolledToCurrentOnOpen.value = true
        }
      }
    )

    watch(
      () => props.isOpen,
      (isOpen) => {
        if (isOpen) {
          updateCurrentTime()

          // Only scroll to current if it's the first time opening
          if (!hasScrolledToCurrentOnOpen.value) {
            nextTick(() => {
              scrollToCurrentSubtitle()
              hasScrolledToCurrentOnOpen.value = true
            })
          }

          updateInterval = window.setInterval(() => {
            updateCurrentTime()
          }, 500)
        } else {
          // Reset flags when modal closes
          hasScrolledToCurrentOnOpen.value = false
          hasScrolledToCurrentOnTabChange.value = {
            learning: false,
            native: false,
          }

          if (updateInterval) {
            clearInterval(updateInterval)
            updateInterval = null
          }
        }
      }
    )

    onMounted(() => {
      if (props.isOpen) {
        updateCurrentTime()

        // Only scroll if first time
        if (!hasScrolledToCurrentOnOpen.value) {
          nextTick(() => {
            scrollToCurrentSubtitle()
            hasScrolledToCurrentOnOpen.value = true
          })
        }

        updateInterval = window.setInterval(() => {
          updateCurrentTime()
        }, 500)
      }
    })

    onUnmounted(() => {
      if (updateInterval) {
        clearInterval(updateInterval)
      }
    })

    return {
      combinedSubtitles,
      filteredLearningSubtitles,
      filteredNativeSubtitles,
      nativeLanguageLabel,
      learningLanguageLabel,
      subtitleListRef,
      currentSubtitleElement,
      viewMode,
      activeTab,
      handleClose,
      formatTime,
      jumpToTime,
      isCurrentTime,
      sanitizeHtml,
    }
  },
})
</script>

<template>
  <GenericModal
    :modelValue="isOpen"
    @update:modelValue="handleClose"
    size="xlarge"
    title="Legendas"
    :showCancelButton="false"
    :showConfirmButton="false"
  >
    <template #body>
      <div class="subtitle-container">
        <!-- Fixed tabs header -->
        <div v-if="viewMode === 'tabs'" class="tabs-header">
          <button
            :class="['tab-button', { active: activeTab === 'learning' }]"
            @click="activeTab = 'learning'"
          >
            {{ learningLanguageLabel }}
          </button>
          <button
            :class="['tab-button', { active: activeTab === 'native' }]"
            @click="activeTab = 'native'"
          >
            {{ nativeLanguageLabel }}
          </button>
        </div>

        <!-- Scrollable content area -->
        <div
          class="subtitle-list-wrapper"
          :class="{ 'with-tabs': viewMode === 'tabs' }"
        >
          <!-- Unified view -->
          <div
            v-if="viewMode === 'unified'"
            class="subtitle-list"
            ref="subtitleListRef"
          >
            <div
              v-for="(item, index) in combinedSubtitles"
              :key="`subtitle-${index}`"
              :ref="
                (el) =>
                  item.isCurrent && (currentSubtitleElement = el as HTMLElement)
              "
              :class="['subtitle-item', { current: item.isCurrent }]"
              @click="jumpToTime(item.time)"
            >
              <span class="time">{{ formatTime(item.time) }}</span>
              <div class="texts">
                <span class="learning" v-html="item.learningText || '—'"></span>
                <span class="native" v-html="item.nativeText || '—'"></span>
              </div>
            </div>
            <div v-if="combinedSubtitles.length === 0" class="no-subtitles">
              Nenhuma legenda disponível
            </div>
          </div>

          <!-- Tabs view -->
          <div v-else class="subtitle-list" ref="subtitleListRef">
            <!-- Learning language tab content -->
            <div v-show="activeTab === 'learning'">
              <div
                v-for="(subtitle, index) in filteredLearningSubtitles"
                :key="`learning-${index}`"
                :ref="
                  (el) =>
                    isCurrentTime(subtitle) &&
                    activeTab === 'learning' &&
                    (currentSubtitleElement = el as HTMLElement)
                "
                :class="[
                  'subtitle-item',
                  'single',
                  { current: isCurrentTime(subtitle) },
                ]"
                @click="jumpToTime(subtitle.begin)"
              >
                <span class="time">{{ formatTime(subtitle.begin) }}</span>
                <div class="texts">
                  <span
                    class="learning single"
                    v-html="sanitizeHtml(subtitle.text)"
                  ></span>
                </div>
              </div>
              <div
                v-if="filteredLearningSubtitles.length === 0"
                class="no-subtitles"
              >
                Nenhuma legenda disponível em {{ learningLanguageLabel }}
              </div>
            </div>

            <!-- Native language tab content -->
            <div v-show="activeTab === 'native'">
              <div
                v-for="(subtitle, index) in filteredNativeSubtitles"
                :key="`native-${index}`"
                :ref="
                  (el) =>
                    isCurrentTime(subtitle) &&
                    activeTab === 'native' &&
                    (currentSubtitleElement = el as HTMLElement)
                "
                :class="[
                  'subtitle-item',
                  'single',
                  { current: isCurrentTime(subtitle) },
                ]"
                @click="jumpToTime(subtitle.begin)"
              >
                <span class="time">{{ formatTime(subtitle.begin) }}</span>
                <div class="texts">
                  <span
                    class="native single"
                    v-html="sanitizeHtml(subtitle.text)"
                  ></span>
                </div>
              </div>
              <div
                v-if="filteredNativeSubtitles.length === 0"
                class="no-subtitles"
              >
                Nenhuma legenda disponível em {{ nativeLanguageLabel }}
              </div>
            </div>
          </div>
        </div>

        <!-- Fixed footer with toggle -->
        <div class="modal-subtitle-footer">
          <ViewModeToggle />
        </div>
      </div>
    </template>
  </GenericModal>
</template>

<style scoped lang="scss">
.subtitle-container {
  display: flex;
  flex-direction: column;
  height: 65vh;
  margin: -18px;
  background: #1e1e1e;
  position: relative;
}

.tabs-header {
  display: flex;
  gap: 4px;
  padding: 8px 12px;
  background: #1a1a1a;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
  flex-shrink: 0;
}

.tab-button {
  flex: 1;
  padding: 8px 16px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;

  &:hover:not(.active) {
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.8);
  }

  &.active {
    background: rgba(102, 126, 234, 0.2);
    color: #667eea;
    font-weight: 600;
  }
}

.subtitle-list-wrapper {
  flex: 1;
  overflow: hidden;
  position: relative;
  min-height: 0; // Important for flex children

  &.with-tabs {
    // Tabs header is already accounted for by flex
  }
}

.subtitle-list {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 12px;
  position: relative;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 4px;

    &:hover {
      background: rgba(255, 255, 255, 0.25);
    }
  }
}

.subtitle-item {
  display: flex;
  gap: 12px;
  padding: 8px 10px;
  margin-bottom: 4px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  align-items: flex-start;

  &:hover {
    background: rgba(255, 255, 255, 0.06);

    .time {
      color: #667eea;
    }
  }

  &.current {
    background: rgba(102, 126, 234, 0.15);
    border-left: 3px solid #667eea;
    padding-left: 7px;

    .time {
      color: #667eea;
      font-weight: 600;
    }

    .learning {
      color: white;
      font-weight: 500;
    }

    .native {
      color: rgba(255, 255, 255, 0.65);
      font-size: 13px;
      line-height: 1.4;
      word-break: break-word;

      &.single {
        color: rgba(255, 255, 255, 0.85);
        font-size: 14px;
      }

      :deep(br) {
        display: block;
        content: '';
        margin-top: 2px;
      }
    }

    .learning.single {
      font-size: 15px;
      color: rgba(255, 255, 255, 0.95);
    }
  }
}

.no-subtitles {
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  padding: 40px 20px;
  font-size: 14px;
}

.modal-subtitle-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px;
  background: linear-gradient(
    to bottom,
    rgba(26, 26, 26, 0.95),
    rgba(26, 26, 26, 1)
  );
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
  backdrop-filter: blur(10px);
}

.time {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  font-family: monospace;
  min-width: 45px;
  flex-shrink: 0;
  padding-top: 2px;
}

.texts {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.learning {
  color: rgba(255, 255, 255, 0.95);
  font-size: 14px;
  line-height: 1.4;
  word-break: break-word;

  :deep(br) {
    display: block;
    content: '';
    margin-top: 2px;
  }
}

.native {
  color: rgba(255, 255, 255, 0.65);
  font-size: 13px;
  line-height: 1.4;
  word-break: break-word;

  :deep(br) {
    display: block;
    content: '';
    margin-top: 2px;
  }
}

.no-subtitles {
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  padding: 40px 20px;
  font-size: 14px;
}

@media (max-width: 768px) {
  .subtitle-container {
    height: 70vh;
  }

  .subtitle-list {
    padding: 6px 8px;
  }

  .subtitle-item {
    padding: 6px 8px;
    margin-bottom: 3px;

    &.current {
      padding-left: 5px;
    }
  }

  .time {
    font-size: 11px;
    min-width: 40px;
  }

  .learning {
    font-size: 13px;
  }

  .native {
    font-size: 12px;
  }

  .modal-subtitle-footer {
    padding: 10px;
  }
}
</style>
