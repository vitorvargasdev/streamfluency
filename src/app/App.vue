<script setup lang="ts">
import { PlayerService } from '@/app/services/player/player.service';
import { SubtitleService } from '@/app/services/subtitles/subtitle.service';
import { PLATFORM } from '@/app/services/types';
import { GLOBAL_LANGUAGES } from '@/app/assets/constants';
import { onMounted, ref } from 'vue'

const currentSubtitle = ref('')

onMounted(async () => {
  const playerService = new PlayerService(PLATFORM.YOUTUBE)
  const subtitleService = new SubtitleService(PLATFORM.YOUTUBE)
  const subtitles = await subtitleService.fetchSubtitles(GLOBAL_LANGUAGES.EN)

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
