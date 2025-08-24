<script setup lang="ts">
import { useSettingStore } from '../../stores/setting'

defineProps<{
  selectedText: string
  isDragging: boolean
}>()

const emit = defineEmits<{
  close: []
  startDrag: [event: MouseEvent | TouchEvent]
  openDictionary: []
}>()

const settingStore = useSettingStore()

const openFreeDictionary = () => {
  emit('openDictionary')
}
</script>

<template>
  <div
    class="popup-header"
    @mousedown="$emit('startDrag', $event)"
    @touchstart="$emit('startDrag', $event)"
  >
    <div class="header-content">
      <div class="selected-text">{{ selectedText }}</div>
      <button
        v-if="settingStore.providers.dictionary === 'freedictionary'"
        class="dictionary-link"
        @click.stop="openFreeDictionary"
        title="Abrir no FreeDictionary"
      >
        📖
      </button>
    </div>
    <button class="close-btn" @click="$emit('close')" title="Fechar">×</button>
  </div>
</template>

<style scoped lang="scss">
.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.15),
    rgba(102, 126, 234, 0.05)
  );
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px 12px 0 0;
  cursor: move;
  user-select: none;

  &:hover {
    background: linear-gradient(
      135deg,
      rgba(102, 126, 234, 0.2),
      rgba(102, 126, 234, 0.08)
    );
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    margin-right: 10px;

    .selected-text {
      color: #667eea;
      font-size: 16px;
      font-weight: 600;
      word-break: break-word;
    }

    .dictionary-link {
      background: rgba(102, 126, 234, 0.2);
      border: 1px solid rgba(102, 126, 234, 0.3);
      border-radius: 6px;
      padding: 4px 8px;
      cursor: pointer;
      font-size: 16px;
      transition: all 0.2s;
      flex-shrink: 0;

      &:hover {
        background: rgba(102, 126, 234, 0.3);
        transform: scale(1.05);
      }
    }
  }

  .close-btn {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.5);
    font-size: 24px;
    cursor: pointer;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    transition: all 0.2s;
    flex-shrink: 0;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.8);
    }
  }
}
</style>
