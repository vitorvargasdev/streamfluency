<script setup lang="ts">
import SettingButton from './SettingButton.vue'
import LanguageSwitcher from './LanguageSwitcher.vue'
import NativeSubtitleToggle from './NativeSubtitleToggle.vue'
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
    <NativeSubtitleToggle />
    <LanguageSwitcher />
    <SettingButton />
  </div>
</template>

<style lang="scss" scoped>
@forward '@/app/assets/scss/side-buttons';
</style>
