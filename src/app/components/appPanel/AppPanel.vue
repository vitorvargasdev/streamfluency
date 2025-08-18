<script setup lang="ts">
import { computed, ref } from 'vue'
import SubtitleDisplay from '@/app/components/subtitleDisplay/SubtitleDisplay.vue'
import LeftToolbar from '@/app/components/leftToolbar/LeftToolbar.vue'
import RightToolbar from '@/app/components/rightToolbar/RightToolbar.vue'
import SubtitleListModal from '@/app/components/subtitleListModal/SubtitleListModal.vue'
import getPlatform from '@/app/utils/getPlatform'
import { useSettingStore } from '@/app/stores/setting'

const platform = getPlatform()
const settingStore = useSettingStore()

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
          src="@/app/assets/images/openfluency-logo.svg"
          title="Ativar OpenFluency"
          alt="OpenFluency"
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
