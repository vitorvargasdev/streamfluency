<script setup lang="ts">
import { onMounted } from 'vue'
import AppPanel from '@/app/components/appPanel/AppPanel.vue'
import { usePlayerStore } from '@/app/stores/player'
import { useSubtitleStore } from '@/app/stores/subtitle'
import { useSettingStore } from '@/app/stores/setting'

const playerStore = usePlayerStore()
const subtitleStore = useSubtitleStore()
const settingStore = useSettingStore()

onMounted(async () => {
  settingStore.loadFromLocalStorage()

  playerStore.load()
  subtitleStore.load()

  if (settingStore.isAppEnabled) {
    subtitleStore.hideNativeCaptions()
  } else {
    subtitleStore.showNativeCaptions()
  }

  await subtitleStore.fetchSubtitles(
    settingStore.nativeLanguage,
    settingStore.learningLanguage
  )
  subtitleStore.setSubtitlesOn(true)
  subtitleStore.subtitlesOn()
})
</script>

<template>
  <div class="app">
    <AppPanel />
  </div>
</template>

<style lang="scss" scoped>
.app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  background: none;
  pointer-events: none;
}
</style>
