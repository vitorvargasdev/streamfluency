<script setup lang="ts">
import type { TabType } from './types'

interface Props {
  activeTab: TabType
  learningLabel: string
  nativeLabel: string
}

defineProps<Props>()

const emit = defineEmits<{
  'update:activeTab': [tab: TabType]
}>()

const setActiveTab = (tab: TabType) => {
  emit('update:activeTab', tab)
}
</script>

<template>
  <div class="tabs-header">
    <button
      :class="['tab-button', { active: activeTab === 'learning' }]"
      @click="setActiveTab('learning')"
    >
      {{ learningLabel }}
    </button>
    <button
      :class="['tab-button', { active: activeTab === 'native' }]"
      @click="setActiveTab('native')"
    >
      {{ nativeLabel }}
    </button>
  </div>
</template>

<style scoped lang="scss">
.tabs-header {
  display: flex;
  gap: 4px;
  padding: 8px 12px;
  background: #1a1a1a;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
  flex-shrink: 0;
}

.tab-button {
  flex: 1;
  padding: 8px 16px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;

  &:hover:not(.active) {
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.8);
  }

  &.active {
    background: rgba(102, 126, 234, 0.2);
    color: #667eea;
    font-weight: 600;
  }
}
</style>
