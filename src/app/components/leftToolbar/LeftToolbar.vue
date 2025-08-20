<script setup lang="ts">
import { computed } from 'vue'
import PowerToggle from '@/app/components/rightToolbar/PowerToggle.vue'
import { useSubtitleStore } from '@/app/stores/subtitle'

const subtitleStore = useSubtitleStore()

const isLooping = computed(() => subtitleStore.isLoopingSubtitle)

const handlePreviousSubtitle = () => {
  subtitleStore.goToPreviousSubtitle()
}

const handleToggleLoop = () => {
  subtitleStore.toggleLoopSubtitle()
}

const handleNextSubtitle = () => {
  subtitleStore.goToNextSubtitle()
}
</script>

<template>
  <div class="side-button">
    <PowerToggle />
    <img
      class="side-button__icon"
      src="@/app/assets/images/right-arrow.svg"
      @click="handleNextSubtitle"
      title="Próxima legenda"
    />
    <img
      class="side-button__icon"
      :class="{ 'side-button__icon--active': isLooping }"
      src="@/app/assets/images/reload.svg"
      @click="handleToggleLoop"
      :title="
        isLooping ? 'Parar repetição contínua' : 'Repetir legenda continuamente'
      "
    />
    <img
      class="side-button__icon"
      src="@/app/assets/images/left-arrow.svg"
      @click="handlePreviousSubtitle"
      title="Legenda anterior"
    />
  </div>
</template>

<style lang="scss" scoped>
@forward '@/app/assets/scss/side-buttons';
</style>
