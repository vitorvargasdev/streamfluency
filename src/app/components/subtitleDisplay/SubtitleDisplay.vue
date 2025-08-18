<script setup lang="ts">
import { useSubtitleStore } from '@/app/stores/subtitle'
import { useSettingStore } from '@/app/stores/setting'
import SelectionPopup from '../selectionPopup/SelectionPopup.vue'

const subtitleStore = useSubtitleStore()
const settingStore = useSettingStore()
</script>

<template>
  <div class="subtitle subtitle-display">
    <div
      class="subtitle__primary subtitle__text subtitle-line"
      v-html="subtitleStore.getCurrentLearningSubtitle"
    />
    <div
      v-if="
        subtitleStore.getCurrentNativeSubtitle &&
        settingStore.isNativeSubtitleVisible
      "
      class="subtitle__secondary subtitle__text subtitle-line"
      :class="{ 'subtitle__text--blur': settingStore.isNativeSubtitleBlurred }"
      v-html="subtitleStore.getCurrentNativeSubtitle"
    />
    <SelectionPopup />
  </div>
</template>

<style lang="scss" scoped src="./style.scss" />
