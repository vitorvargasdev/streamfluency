<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useSubtitleStore } from '@/app/stores/subtitle'
import { useSettingStore } from '@/app/stores/setting'
import { useVocabularyStore } from '@/app/stores/vocabulary'
import { useSubtitleHighlighting } from '@/app/composables/useSubtitleHighlighting'
import SelectionPopup from '../selectionPopup/SelectionPopup.vue'

const subtitleStore = useSubtitleStore()
const settingStore = useSettingStore()
const vocabularyStore = useVocabularyStore()
const { highlightSubtitle } = useSubtitleHighlighting()

onMounted(() => {
  if (vocabularyStore.items.length || vocabularyStore.isLoading) return
  vocabularyStore.init()
})
const highlightedLearningSubtitle = computed(() => {
  const vocabCount = vocabularyStore.items.length
  const isEnabled = settingStore.isVocabularyHighlightEnabled
  const subtitle = subtitleStore.getCurrentLearningSubtitle

  if (!isEnabled || vocabCount === 0 || !subtitle) return subtitle
  return highlightSubtitle.value(subtitle)
})

const highlightedNativeSubtitle = computed(() => {
  const vocabCount = vocabularyStore.items.length
  const isEnabled = settingStore.isVocabularyHighlightEnabled
  const subtitle = subtitleStore.getCurrentNativeSubtitle

  if (!isEnabled || vocabCount === 0 || !subtitle) return subtitle
  return highlightSubtitle.value(subtitle)
})
</script>

<template>
  <div class="subtitle subtitle-display">
    <div
      v-if="settingStore.isLearningSubtitleVisible"
      class="subtitle__primary subtitle__text subtitle-line"
      v-html="highlightedLearningSubtitle"
    />
    <div
      v-if="
        subtitleStore.getCurrentNativeSubtitle &&
        settingStore.isNativeSubtitleVisible
      "
      class="subtitle__secondary subtitle__text subtitle-line"
      :class="{ 'subtitle__text--blur': settingStore.isNativeSubtitleBlurred }"
      v-html="highlightedNativeSubtitle"
    />
    <SelectionPopup />
  </div>
</template>

<style lang="scss" scoped src="./style.scss" />
