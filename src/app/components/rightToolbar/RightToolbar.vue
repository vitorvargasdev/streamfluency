<script setup lang="ts">
import SettingButton from './SettingButton.vue'
import NativeSubtitleToggle from './NativeSubtitleToggle.vue'
import LearningSubtitleToggle from './LearningSubtitleToggle.vue'
import SubtitleListButton from './SubtitleListButton.vue'
import VocabularyButton from './VocabularyButton.vue'

const emit = defineEmits(['openSubtitleList'])

const openSubtitleList = () => {
  emit('openSubtitleList')
}
</script>

<template>
  <div class="side-button">
    <SubtitleListButton @openList="openSubtitleList" />
    <VocabularyButton />
    <LearningSubtitleToggle />
    <NativeSubtitleToggle />
    <SettingButton />
  </div>
</template>

<style lang="scss" scoped>
@forward '@/app/assets/scss/side-buttons';
</style>
