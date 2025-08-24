<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useSelectionPopup } from '../../composables/useSelectionPopup'
import PopupHeader from './PopupHeader.vue'
import TranslationSection from './TranslationSection.vue'
import DictionarySection from './DictionarySection.vue'

declare global {
  interface Window {
    __streamfluencyPopupInstance?: string
  }
}

const props = defineProps<{
  mode?: 'selection' | 'vocabulary'
}>()

const popupRef = ref<HTMLDivElement>()

const {
  isVisible,
  selectedText,
  contextText,
  isSaving,
  isLoading,
  dictionaryData,
  isTranslating,
  translationData,
  targetLanguage,
  isTranslatingContext,
  contextTranslationData,
  translatedMeanings,
  loadingTranslations,
  showAllMeanings,
  isDragging,
  alreadyExists,
  popupStyle,
  show,
  hide,
  handleSave,
  showVocabularyItem,
  translateContext,
  translateMeaning,
  openFreeDictionary,
  startDrag,
  handleClickOutside,
} = useSelectionPopup({ mode: props.mode })

const handleClickOutsideWrapper = (event: MouseEvent) => {
  handleClickOutside(event, popupRef.value)
}

onMounted(() => {
  if (props.mode === 'vocabulary' || !window.__streamfluencyPopupInstance) {
    document.addEventListener('mousedown', handleClickOutsideWrapper)
  }
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutsideWrapper)
})

defineExpose({
  show,
  hide,
  showVocabularyItem,
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isVisible"
      ref="popupRef"
      class="selection-popup"
      :class="{ dragging: isDragging }"
      :style="popupStyle"
      @mousedown.stop
    >
      <PopupHeader
        :selected-text="selectedText"
        :is-dragging="isDragging"
        @close="hide"
        @start-drag="startDrag"
        @open-dictionary="openFreeDictionary"
      />

      <div class="popup-content">
        <div
          v-if="contextText && props.mode === 'vocabulary'"
          class="context-section"
        >
          <div class="context-header">
            <div class="context-label">Contexto</div>
            <button
              @click="translateContext"
              class="translate-context-btn"
              :disabled="isTranslatingContext"
              title="Traduzir frase de contexto"
            >
              {{ isTranslatingContext ? '⏳' : '🌐' }} Traduzir Frase
            </button>
          </div>
          <div class="context-text">"{{ contextText }}"</div>
          <div v-if="contextTranslationData" class="context-translation">
            <div class="translation-label">Tradução do contexto</div>
            <div class="translated-text">
              "{{ contextTranslationData.translatedText }}"
            </div>
          </div>
        </div>

        <TranslationSection
          :translation-data="translationData"
          :is-translating="isTranslating"
          :target-language="targetLanguage"
        />

        <DictionarySection
          :dictionary-data="dictionaryData"
          :is-loading="isLoading"
          :show-all-meanings="showAllMeanings"
          :translated-meanings="translatedMeanings"
          :loading-translations="loadingTranslations"
          @toggle-meanings="showAllMeanings = !showAllMeanings"
          @translate-meaning="translateMeaning"
        />

        <div v-if="props.mode !== 'vocabulary'" class="actions">
          <button class="save-button" @click="handleSave" :disabled="isSaving">
            {{
              isSaving ? 'Salvando...' : alreadyExists ? 'Já salvo ✓' : 'Salvar'
            }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.selection-popup {
  position: fixed;
  z-index: 10000;
  background: #1a1a1a;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(20px);
  width: 400px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;

  &.dragging {
    cursor: move;
    user-select: none;
  }

  .popup-content {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
    flex: 1;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;

      &:hover {
        background: rgba(255, 255, 255, 0.3);
      }
    }
  }

  .context-section {
    margin-bottom: 12px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    border-left: 3px solid rgba(102, 126, 234, 0.4);

    .context-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      .context-label {
        color: rgba(102, 126, 234, 0.8);
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .translate-context-btn {
        padding: 4px 10px;
        background: rgba(102, 126, 234, 0.15);
        color: #667eea;
        border: 1px solid rgba(102, 126, 234, 0.3);
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;

        &:hover:not(:disabled) {
          background: rgba(102, 126, 234, 0.25);
          border-color: rgba(102, 126, 234, 0.5);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }
    }

    .context-text {
      color: rgba(255, 255, 255, 0.85);
      font-size: 14px;
      font-style: italic;
      line-height: 1.6;
    }

    .context-translation {
      margin-top: 12px;
      padding: 10px;
      background: rgba(102, 126, 234, 0.08);
      border-radius: 6px;
      border: 1px solid rgba(102, 126, 234, 0.15);

      .translation-label {
        color: rgba(102, 126, 234, 0.9);
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 6px;
      }

      .translated-text {
        color: rgba(255, 255, 255, 0.95);
        font-size: 13px;
        line-height: 1.5;
        font-style: italic;
      }
    }
  }

  .actions {
    display: flex;
    justify-content: center;
    padding: 12px 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.2);
    margin: 0 -16px -16px;
    border-radius: 0 0 12px 12px;

    .save-button {
      background: rgba(102, 126, 234, 0.2);
      color: #8fa1f3;
      border: 1px solid rgba(102, 126, 234, 0.3);
      padding: 8px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s;
      white-space: nowrap;

      &:hover:not(:disabled) {
        background: rgba(102, 126, 234, 0.25);
        border-color: rgba(102, 126, 234, 0.4);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;

        &:not(.saving) {
          background: rgba(76, 175, 80, 0.15);
          color: rgba(76, 175, 80, 0.9);
          border-color: rgba(76, 175, 80, 0.3);
        }
      }
    }
  }
}
</style>
