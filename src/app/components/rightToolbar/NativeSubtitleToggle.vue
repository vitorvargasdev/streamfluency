<script setup lang="ts">
import { useSettingStore } from '@/app/stores/setting'
import languages from '@/app/assets/images/languages.svg'
import languagesOff from '@/app/assets/images/languages-off.svg'

const settingStore = useSettingStore()

const toggleNativeSubtitle = () => {
  settingStore.toggleNativeSubtitleVisibility()
}
</script>

<template>
  <img
    @click="toggleNativeSubtitle"
    class="side-button__icon"
    :src="settingStore.isNativeSubtitleVisible ? languages : languagesOff"
    :title="
      settingStore.isNativeSubtitleVisible
        ? 'Ocultar tradução'
        : 'Mostrar tradução'
    "
  />
</template>

<style lang="scss" scoped>
@forward '@/app/assets/scss/side-buttons';
</style>
