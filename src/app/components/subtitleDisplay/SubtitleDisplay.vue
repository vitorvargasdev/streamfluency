<script setup lang="ts">
import { useSubtitleStore } from '@/app/stores/subtitle'

const subtitleStore = useSubtitleStore()
</script>

<template>
  <div class="subtitle">
    <div class="subtitle__primary subtitle__text" v-html="subtitleStore.getCurrentLearningSubtitle" />
    <div v-if="subtitleStore.getCurrentNativeSubtitle" class="subtitle__secondary subtitle__text"
      v-html="subtitleStore.getCurrentNativeSubtitle" />
  </div>
</template>

<style lang="scss" scoped src="./style.scss" />
