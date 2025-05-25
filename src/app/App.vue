<script setup lang="ts">
import { SubtitleService } from './services/subtitles/subtitle.service'
import { LANGUAGES, PLATFORM } from './services/subtitles/types'
import { onMounted } from 'vue'

onMounted(async () => {
  const subtitleService = new SubtitleService(PLATFORM.YOUTUBE)
  console.log('subtitle service: ', await subtitleService.fetchSubtitles(LANGUAGES.EN))
})
</script>

<template>
  <div>Hello World</div>
</template>
