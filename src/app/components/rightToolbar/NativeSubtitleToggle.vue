<script setup lang="ts">
import { useSettingStore } from '@/app/stores/setting'
import eyeOpen from '@/app/assets/images/eye-open.svg'
import eyeClosed from '@/app/assets/images/eye-closed.svg'

const settingStore = useSettingStore()

const toggleNativeSubtitle = () => {
  settingStore.toggleNativeSubtitleVisibility()
}
</script>

<template>
  <img
    @click="toggleNativeSubtitle"
    class="side-button__icon"
    :src="settingStore.isNativeSubtitleVisible ? eyeOpen : eyeClosed"
    :title="
      settingStore.isNativeSubtitleVisible
        ? 'Ocultar legenda nativa'
        : 'Mostrar legenda nativa'
    "
  />
</template>

<style lang="scss" scoped>
@forward '@/app/assets/scss/side-buttons';
</style>
