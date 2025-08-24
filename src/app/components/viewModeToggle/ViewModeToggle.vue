<script setup lang="ts">
import { computed } from 'vue'
import { useSettingStore } from '@/app/stores/setting'

const settingStore = useSettingStore()
const currentMode = computed(() => settingStore.getSubtitleViewMode)

const handleToggle = () => {
  settingStore.toggleSubtitleViewMode()
}
</script>

<template>
  <button
    class="view-toggle"
    @click="handleToggle"
    :aria-label="`Modo: ${currentMode === 'unified' ? 'Juntos' : 'Separados'}`"
  >
    <span class="toggle-option" :class="{ active: currentMode === 'unified' }">
      Juntos
    </span>
    <span class="toggle-divider"></span>
    <span class="toggle-option" :class="{ active: currentMode === 'tabs' }">
      Separados
    </span>
  </button>
</template>

<style scoped lang="scss">
.view-toggle {
  display: inline-flex;
  align-items: center;
  padding: 4px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  &:focus-visible {
    outline: 2px solid #667eea;
    outline-offset: 2px;
  }
}

.toggle-option {
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
  transition: all 0.2s;
  border-radius: 4px;

  &.active {
    background: #667eea;
    color: white;
  }
}

.toggle-divider {
  width: 1px;
  height: 16px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 2px;
}
</style>
