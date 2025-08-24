<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import SubtitleDisplay from '@/app/components/subtitleDisplay/SubtitleDisplay.vue'
import LeftToolbar from '@/app/components/leftToolbar/LeftToolbar.vue'
import RightToolbar from '@/app/components/rightToolbar/RightToolbar.vue'
import SubtitleListModal from '@/app/components/subtitleListModal/SubtitleListModal.vue'
import getPlatform from '@/app/utils/getPlatform'
import { useSettingStore } from '@/app/stores/setting'
import { useSubtitleStore } from '@/app/stores/subtitle'

const platform = getPlatform()
const settingStore = useSettingStore()
const subtitleStore = useSubtitleStore()

const isEnabled = computed(() => settingStore.isAppEnabled)
const isSubtitleListOpen = ref(false)

const togglePower = () => {
  settingStore.toggleAppEnabled()
}

const openSubtitleList = () => {
  isSubtitleListOpen.value = true
}

const closeSubtitleList = () => {
  isSubtitleListOpen.value = false
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!settingStore.isArrowKeyNavigationEnabled || !isEnabled.value) return

  const target = event.target as HTMLElement
  if (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable
  )
    return

  if (
    target.closest('[contenteditable="true"]') ||
    target.closest('input') ||
    target.closest('textarea')
  )
    return

  const videoElement = document.querySelector('video')
  if (!videoElement) return

  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      subtitleStore.goToPreviousSubtitle()
      break
    case 'ArrowRight':
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      subtitleStore.goToNextSubtitle()
      break
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown, true)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown, true)
})
</script>

<template>
  <div class="panel">
    <template v-if="isEnabled">
      <LeftToolbar
        :class="`panel__toolbar panel__toolbar--left panel__toolbar--${platform}`"
      />
      <SubtitleDisplay
        :class="`panel__subtitle-display panel__subtitle-display--${platform}`"
      />
      <RightToolbar
        :class="`panel__toolbar panel__toolbar--right panel__toolbar--${platform}`"
        @openSubtitleList="openSubtitleList"
      />
    </template>

    <div v-else :class="`panel__power-off panel__power-off--${platform}`">
      <div class="panel__power-off-wrapper">
        <img
          @click="togglePower"
          class="panel__power-off-button"
          src="@/app/assets/images/streamfluency-logo.svg"
          title="Ativar StreamFluency"
          alt="StreamFluency"
        />
        <span class="panel__power-off-indicator"></span>
      </div>
    </div>

    <SubtitleListModal
      :isOpen="isSubtitleListOpen"
      @close="closeSubtitleList"
    />
  </div>
</template>

<style lang="scss" scoped src="./style.scss" />
