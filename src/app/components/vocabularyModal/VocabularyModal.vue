<script setup lang="ts">
import { ref, watch } from 'vue'
import { useVocabularyModal } from '../../composables/useVocabularyModal'
import GenericModal from '../genericModal/GenericModal.vue'
import SelectionPopup from '../selectionPopup/SelectionPopup.vue'
import VocabularyFilters from './VocabularyFilters.vue'
import VocabularyItem from './VocabularyItem.vue'
import { MESSAGES } from './constants'
import type { VocabularyItem as VocabularyItemType } from '../../stores/vocabulary/types'

const props = defineProps<{
  isVisible: boolean
}>()

const emit = defineEmits<{
  'update:isVisible': [value: boolean]
  close: []
}>()

const selectionPopupRef = ref<InstanceType<typeof SelectionPopup>>()

const {
  searchQuery,
  dateFilter,
  sortBy,
  videoFilter,
  uniqueVideos,
  filteredItems,
  hasActiveFilters,
  clearAllFilters,
  resetVideoFilter,
  editingTranslation,
  editingNotes,
  editingContext,
  startEdit,
  cancelEdit,
  saveEdit,
  isEditing,
  vocabularyStore,
  formatDate,
  getVideoButtonText,
  handleDelete,
  handleClearAll,
  handleVideoClick,
} = useVocabularyModal(emit)

const handleShowWordDetails = (item: VocabularyItemType) => {
  if (!selectionPopupRef.value) return
  selectionPopupRef.value.showVocabularyItem(item)
}

watch(
  () => props.isVisible,
  (isVisible, wasVisible) => {
    if (!isVisible || wasVisible) return
    if (videoFilter.value === 'all') return

    const currentFilterValid = uniqueVideos.value.includes(videoFilter.value)
    if (!currentFilterValid) {
      resetVideoFilter()
    }
  }
)
</script>

<template>
  <GenericModal
    :model-value="isVisible"
    title="Vocabulário"
    size="xlarge"
    :show-cancel-button="false"
    :show-confirm-button="false"
    @update:model-value="$emit('update:isVisible', $event)"
    @close="$emit('close')"
  >
    <template #body>
      <div class="vocabulary-container">
        <VocabularyFilters
          v-model:search-query="searchQuery"
          v-model:date-filter="dateFilter"
          v-model:sort-by="sortBy"
          v-model:video-filter="videoFilter"
          :unique-videos="uniqueVideos"
          :has-active-filters="hasActiveFilters"
          :has-items="vocabularyStore.items.length > 0"
          @clear-all="handleClearAll"
          @clear-filters="clearAllFilters"
        />

        <div class="vocabulary-list-wrapper">
          <div v-if="filteredItems.length === 0" class="empty-state">
            <p>
              {{ searchQuery ? MESSAGES.NO_RESULTS : MESSAGES.NO_ITEMS }}
            </p>
            <p class="hint">{{ MESSAGES.HINT }}</p>
          </div>

          <div v-else class="vocabulary-list">
            <VocabularyItem
              v-for="item in filteredItems"
              :key="item.id"
              :item="item"
              :is-editing="isEditing(item.id)"
              :editing-translation="editingTranslation"
              :editing-notes="editingNotes"
              :editing-context="editingContext"
              :date-label="formatDate(item.timestamp)"
              :video-button-text="getVideoButtonText(item)"
              @start-edit="startEdit(item)"
              @save-edit="saveEdit(item.id)"
              @cancel-edit="cancelEdit"
              @delete="handleDelete(item.id)"
              @video-click="handleVideoClick(item, $event)"
              @show-details="handleShowWordDetails(item)"
              @update-translation="editingTranslation = $event"
              @update-notes="editingNotes = $event"
              @update-context="editingContext = $event"
            />
          </div>
        </div>

        <div class="vocabulary-footer">
          <span class="item-count">
            {{ filteredItems.length }}
            {{ filteredItems.length === 1 ? 'palavra' : 'palavras' }}
            <span
              v-if="filteredItems.length !== vocabularyStore.items.length"
              class="filter-info"
            >
              (de {{ vocabularyStore.items.length }} total)
            </span>
          </span>
        </div>
      </div>
    </template>
  </GenericModal>

  <SelectionPopup ref="selectionPopupRef" mode="vocabulary" />
</template>

<style scoped lang="scss">
.vocabulary-container {
  display: flex;
  flex-direction: column;
  height: 65vh;
  margin: -18px;
  background: #1e1e1e;
  position: relative;
}

.vocabulary-list-wrapper {
  flex: 1;
  overflow: hidden;
  position: relative;
  min-height: 0;
}

.vocabulary-list {
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

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.4);

  p {
    margin: 10px 0;
    font-size: 14px;
  }

  .hint {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.3);
  }
}

.vocabulary-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px;
  background: linear-gradient(
    to bottom,
    rgba(26, 26, 26, 0.95),
    rgba(26, 26, 26, 1)
  );
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
  backdrop-filter: blur(10px);

  .item-count {
    color: rgba(255, 255, 255, 0.5);
    font-size: 13px;
    font-weight: 500;

    .filter-info {
      color: rgba(102, 126, 234, 0.7);
      font-size: 12px;
    }
  }
}

@media (max-width: 768px) {
  .vocabulary-container {
    height: 70vh;
  }

  .vocabulary-list {
    padding: 6px 8px;
  }

  .vocabulary-footer {
    padding: 10px;
  }
}
</style>
