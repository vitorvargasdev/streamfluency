<script setup lang="ts">
import { PlayerService } from './services/player/player.service'
import { SubtitleService } from './services/subtitles/subtitle.service'
import { LANGUAGES } from './services/subtitles/types'
import { PLATFORM } from './services/types'
import { onMounted, ref } from 'vue'

const currentSubtitle = ref('')

onMounted(async () => {
  const playerService = new PlayerService(PLATFORM.YOUTUBE)
  const subtitleService = new SubtitleService(PLATFORM.YOUTUBE)
  const subtitles = await subtitleService.fetchSubtitles(LANGUAGES.EN)

  setInterval(() => {
    const currentTime = playerService.currentTime()
    currentSubtitle.value = subtitleService.getCurrentSubtitle(
      subtitles,
      currentTime
    )
  }, 100)
})
</script>

<template>
  <div style="font-size: 30px; background-color: red; text-align: center">
    {{ currentSubtitle }}
  </div>
</template>
