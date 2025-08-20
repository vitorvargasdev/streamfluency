<script setup lang="ts">
import { useSettingStore } from '@/app/stores/setting'
import eyeOpen from '@/app/assets/images/eye-open.svg'
import eyeClosed from '@/app/assets/images/eye-closed.svg'

const settingStore = useSettingStore()

const toggleLearningSubtitle = () => {
  settingStore.toggleLearningSubtitleVisibility()
}
</script>

<template>
  <img
    @click="toggleLearningSubtitle"
    class="side-button__icon"
    :src="settingStore.isLearningSubtitleVisible ? eyeOpen : eyeClosed"
    :title="
      settingStore.isLearningSubtitleVisible
        ? 'Ocultar legenda de aprendizado'
        : 'Mostrar legenda de aprendizado'
    "
  />
</template>

<style lang="scss" scoped>
@forward '@/app/assets/scss/side-buttons';
</style>
