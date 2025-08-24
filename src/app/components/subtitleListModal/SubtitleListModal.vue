<script setup lang="ts">
import { watch, onMounted, onUnmounted, nextTick, toRef } from 'vue'
import GenericModal from '@/app/components/genericModal/GenericModal.vue'
import ViewModeToggle from '@/app/components/viewModeToggle/ViewModeToggle.vue'
import SubtitleTabs from './SubtitleTabs.vue'
import SubtitleList from './SubtitleList.vue'
import { useSubtitleList } from '@/app/composables/useSubtitleList'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const isOpenRef = toRef(props, 'isOpen')

const {
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
} = useSubtitleList(isOpenRef)

const handleClose = () => {
  emit('close')
}

const handleJumpToTime = (time: number) => {
  jumpToTime(time, handleClose)
}

const handleSetCurrentElement = (element: HTMLElement | null) => {
  currentSubtitleElement.value = element
}

const handleTabChange = (tab: 'learning' | 'native') => {
  activeTab.value = tab
}

watch(
  () => props.isOpen,
  (isOpen) => {
    if (!isOpen) {
      scrollState.value.hasScrolledToCurrentOnOpen = false
      scrollState.value.hasScrolledToCurrentOnTabChange = {
        learning: false,
        native: false,
      }
      stopUpdateInterval()
      return
    }

    updateCurrentTime()

    if (!scrollState.value.hasScrolledToCurrentOnOpen) {
      nextTick(() => {
        scrollToCurrentSubtitle()
        scrollState.value.hasScrolledToCurrentOnOpen = true
      })
    }

    startUpdateInterval()
  }
)

onMounted(() => {
  if (!props.isOpen) return

  updateCurrentTime()

  if (!scrollState.value.hasScrolledToCurrentOnOpen) {
    nextTick(() => {
      scrollToCurrentSubtitle()
      scrollState.value.hasScrolledToCurrentOnOpen = true
    })
  }

  startUpdateInterval()
})

onUnmounted(() => {
  stopUpdateInterval()
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
        <SubtitleTabs
          v-if="viewMode === 'tabs'"
          :active-tab="activeTab"
          :learning-label="learningLanguageLabel"
          :native-label="nativeLanguageLabel"
          @update:active-tab="handleTabChange"
        />

        <div
          class="subtitle-list-wrapper"
          :class="{ 'with-tabs': viewMode === 'tabs' }"
          ref="subtitleListRef"
        >
          <SubtitleList
            :view-mode="viewMode"
            :active-tab="activeTab"
            :combined-subtitles="combinedSubtitles"
            :filtered-learning-subtitles="filteredLearningSubtitles"
            :filtered-native-subtitles="filteredNativeSubtitles"
            :learning-language-label="learningLanguageLabel"
            :native-language-label="nativeLanguageLabel"
            :current-subtitle-element="currentSubtitleElement"
            :is-current-time="isCurrentTime"
            @jump-to-time="handleJumpToTime"
            @set-current-element="handleSetCurrentElement"
          />
        </div>

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

.subtitle-list-wrapper {
  flex: 1;
  overflow: hidden;
  position: relative;
  min-height: 0;
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

@media (max-width: 768px) {
  .subtitle-container {
    height: 70vh;
  }

  .modal-subtitle-footer {
    padding: 10px;
  }
}
</style>
