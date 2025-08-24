<script setup lang="ts">
import type { Subtitle } from '@/app/services/subtitle/types'
import type { CombinedSubtitle } from './types'
import { formatTime, sanitizeHtml } from './utils'

interface Props {
  subtitle?: Subtitle
  combinedItem?: CombinedSubtitle
  isCurrent: boolean
  index: number
  type?: 'learning' | 'native' | 'combined'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'combined',
})

const emit = defineEmits<{
  click: [time: number]
}>()

const handleClick = () => {
  const time = props.subtitle?.begin ?? props.combinedItem?.time ?? 0
  emit('click', time)
}

const getTime = () => {
  if (props.subtitle) return formatTime(props.subtitle.begin)
  if (props.combinedItem) return formatTime(props.combinedItem.time)
  return '00:00'
}

const getLearningText = () => {
  if (props.type === 'learning' && props.subtitle) {
    return sanitizeHtml(props.subtitle.text)
  }
  return props.combinedItem?.learningText || '—'
}

const getNativeText = () => {
  if (props.type === 'native' && props.subtitle) {
    return sanitizeHtml(props.subtitle.text)
  }
  return props.combinedItem?.nativeText || '—'
}
</script>

<template>
  <div
    :class="[
      'subtitle-item',
      {
        current: isCurrent,
        single: type !== 'combined',
      },
    ]"
    @click="handleClick"
  >
    <span class="time">{{ getTime() }}</span>
    <div class="texts">
      <span
        v-if="type === 'combined' || type === 'learning'"
        class="learning"
        :class="{ single: type === 'learning' }"
        v-html="getLearningText()"
      />
      <span
        v-if="type === 'combined' || type === 'native'"
        class="native"
        :class="{ single: type === 'native' }"
        v-html="getNativeText()"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.subtitle-item {
  display: flex;
  gap: 12px;
  padding: 8px 10px;
  margin-bottom: 4px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  align-items: flex-start;

  &:hover {
    background: rgba(255, 255, 255, 0.06);

    .time {
      color: #667eea;
    }
  }

  &.current {
    background: rgba(102, 126, 234, 0.15);
    border-left: 3px solid #667eea;
    padding-left: 7px;

    .time {
      color: #667eea;
      font-weight: 600;
    }

    .learning {
      color: white;
      font-weight: 500;
    }

    .native {
      color: rgba(255, 255, 255, 0.65);
      font-size: 13px;
      line-height: 1.4;
      word-break: break-word;

      &.single {
        color: rgba(255, 255, 255, 0.85);
        font-size: 14px;
      }

      :deep(br) {
        display: block;
        content: '';
        margin-top: 2px;
      }
    }

    .learning.single {
      font-size: 15px;
      color: rgba(255, 255, 255, 0.95);
    }
  }
}

.time {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  font-family: monospace;
  min-width: 45px;
  flex-shrink: 0;
  padding-top: 2px;
}

.texts {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.learning {
  color: rgba(255, 255, 255, 0.95);
  font-size: 14px;
  line-height: 1.4;
  word-break: break-word;

  :deep(br) {
    display: block;
    content: '';
    margin-top: 2px;
  }
}

.native {
  color: rgba(255, 255, 255, 0.65);
  font-size: 13px;
  line-height: 1.4;
  word-break: break-word;

  :deep(br) {
    display: block;
    content: '';
    margin-top: 2px;
  }
}

@media (max-width: 768px) {
  .subtitle-item {
    padding: 6px 8px;
    margin-bottom: 3px;

    &.current {
      padding-left: 5px;
    }
  }

  .time {
    font-size: 11px;
    min-width: 40px;
  }

  .learning {
    font-size: 13px;
  }

  .native {
    font-size: 12px;
  }
}
</style>
