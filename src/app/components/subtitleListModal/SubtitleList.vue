<script setup lang="ts">
import { computed } from 'vue'
import type { Subtitle } from '@/app/services/subtitle/types'
import type { CombinedSubtitle, TabType } from './types'
import SubtitleItem from './SubtitleItem.vue'

interface Props {
  viewMode: 'unified' | 'tabs'
  activeTab: TabType
  combinedSubtitles: CombinedSubtitle[]
  filteredLearningSubtitles: Subtitle[]
  filteredNativeSubtitles: Subtitle[]
  learningLanguageLabel: string
  nativeLanguageLabel: string
  currentSubtitleElement: HTMLElement | null
  isCurrentTime: (subtitle: Subtitle) => boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  jumpToTime: [time: number]
  setCurrentElement: [element: HTMLElement | null]
}>()

const handleJumpToTime = (time: number) => {
  emit('jumpToTime', time)
}

const setCurrentElement = (el: unknown, isCurrent: boolean) => {
  if (!isCurrent || !el) return
  emit('setCurrentElement', el as HTMLElement)
}

const setCurrentElementForSubtitle = (el: unknown, subtitle: Subtitle) => {
  if (!props.isCurrentTime(subtitle) || !el) return
  if (props.viewMode !== 'tabs' || props.activeTab !== 'learning') return

  emit('setCurrentElement', el as HTMLElement)
}

const setCurrentElementForNative = (el: unknown, subtitle: Subtitle) => {
  if (!props.isCurrentTime(subtitle) || !el) return
  if (props.viewMode !== 'tabs' || props.activeTab !== 'native') return

  emit('setCurrentElement', el as HTMLElement)
}

const hasNoSubtitles = computed(() => {
  if (props.viewMode === 'unified') {
    return props.combinedSubtitles.length === 0
  }
  if (props.activeTab === 'learning') {
    return props.filteredLearningSubtitles.length === 0
  }
  return props.filteredNativeSubtitles.length === 0
})

const noSubtitleMessage = computed(() => {
  if (props.viewMode === 'unified') {
    return 'Nenhuma legenda disponível'
  }
  const lang =
    props.activeTab === 'learning'
      ? props.learningLanguageLabel
      : props.nativeLanguageLabel
  return `Nenhuma legenda disponível em ${lang}`
})
</script>

<template>
  <div class="subtitle-list">
    <!-- Unified view -->
    <template v-if="viewMode === 'unified'">
      <SubtitleItem
        v-for="(item, index) in combinedSubtitles"
        :key="`subtitle-${index}`"
        :ref="(el) => setCurrentElement(el, item.isCurrent)"
        :combined-item="item"
        :is-current="item.isCurrent"
        :index="index"
        type="combined"
        @click="handleJumpToTime"
      />
    </template>

    <!-- Tabs view -->
    <template v-else>
      <!-- Learning language tab content -->
      <div v-show="activeTab === 'learning'">
        <SubtitleItem
          v-for="(subtitle, index) in filteredLearningSubtitles"
          :key="`learning-${index}`"
          :ref="(el) => setCurrentElementForSubtitle(el, subtitle)"
          :subtitle="subtitle"
          :is-current="isCurrentTime(subtitle)"
          :index="index"
          type="learning"
          @click="handleJumpToTime"
        />
      </div>

      <!-- Native language tab content -->
      <div v-show="activeTab === 'native'">
        <SubtitleItem
          v-for="(subtitle, index) in filteredNativeSubtitles"
          :key="`native-${index}`"
          :ref="(el) => setCurrentElementForNative(el, subtitle)"
          :subtitle="subtitle"
          :is-current="isCurrentTime(subtitle)"
          :index="index"
          type="native"
          @click="handleJumpToTime"
        />
      </div>
    </template>

    <div v-if="hasNoSubtitles" class="no-subtitles">
      {{ noSubtitleMessage }}
    </div>
  </div>
</template>

<style scoped lang="scss">
.subtitle-list {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 12px;
  position: relative;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 4px;

    &:hover {
      background: rgba(255, 255, 255, 0.25);
    }
  }
}

.no-subtitles {
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  padding: 40px 20px;
  font-size: 14px;
}

@media (max-width: 768px) {
  .subtitle-list {
    padding: 6px 8px;
  }
}
</style>
