<script setup lang="ts">
import { computed } from 'vue'
import { useSettingStore } from '@/app/stores/setting'

const settingStore = useSettingStore()

const isEnabled = computed(() => settingStore.isAppEnabled)

const togglePower = () => {
  settingStore.toggleAppEnabled()
}
</script>

<template>
  <div class="power-toggle">
    <img
      class="power-toggle__logo"
      @click="togglePower"
      src="@/app/assets/images/streamfluency-logo.svg"
      :title="isEnabled ? 'Desligar StreamFluency' : 'Ligar StreamFluency'"
    />
    <span
      class="power-toggle__indicator"
      :class="
        isEnabled
          ? 'power-toggle__indicator--on'
          : 'power-toggle__indicator--off'
      "
    ></span>
  </div>
</template>

<style scoped lang="scss">
.power-toggle {
  position: relative;
  width: 48px;
  height: 48px;

  &__logo {
    width: 48px;
    height: 48px;
    cursor: pointer;
    transition: all 0.3s ease;
    opacity: 0.9;
    border-radius: 8px;

    &:hover {
      opacity: 1;
      transform: scale(1.05);
    }
  }

  &__indicator {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    pointer-events: none;
    transition: all 0.3s ease;
    box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);

    &--on {
      background-color: #10b981;
      box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);
    }

    &--off {
      background-color: #ef4444;
      box-shadow: 0 0 6px rgba(239, 68, 68, 0.6);
    }
  }
}
</style>
