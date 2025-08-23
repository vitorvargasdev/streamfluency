<script setup lang="ts">
import { MAX_MEANINGS_PREVIEW } from './constants'
import type {
  DictionaryResult,
  DictionaryDefinition,
} from '../../services/translation/types'

defineProps<{
  dictionaryData: DictionaryResult | null
  isLoading: boolean
  showAllMeanings: boolean
  translatedMeanings: Map<number, { definition?: string; example?: string }>
  loadingTranslations: Set<number>
}>()

const emit = defineEmits<{
  toggleMeanings: []
  translateMeaning: [index: number, meaning: DictionaryDefinition]
}>()
</script>

<template>
  <div v-if="isLoading" class="loading">
    <span class="loading-spinner"></span>
    Buscando definição...
  </div>

  <div
    v-else-if="dictionaryData && dictionaryData.meanings.length > 0"
    class="dictionary-content"
  >
    <div v-if="dictionaryData.phonetic" class="phonetic">
      {{ dictionaryData.phonetic }}
    </div>

    <div class="definitions">
      <div
        v-for="(meaning, index) in showAllMeanings
          ? dictionaryData.meanings
          : dictionaryData.meanings.slice(0, MAX_MEANINGS_PREVIEW)"
        :key="index"
        class="definition-item"
      >
        <div class="definition-header">
          <span v-if="meaning.partOfSpeech" class="part-of-speech">{{
            meaning.partOfSpeech
          }}</span>
          <button
            class="translate-btn"
            @click="$emit('translateMeaning', index, meaning)"
            :disabled="loadingTranslations.has(index)"
            title="Traduzir definição"
          >
            {{ loadingTranslations.has(index) ? '⏳' : '🌐' }}
          </button>
        </div>

        <span class="definition">{{ meaning.definition }}</span>

        <div v-if="translatedMeanings.has(index)" class="translated-content">
          <span class="translated-definition">
            {{ translatedMeanings.get(index)?.definition }}
          </span>
        </div>

        <span v-if="meaning.example" class="example"
          >"{{ meaning.example }}"</span
        >

        <div
          v-if="translatedMeanings.has(index) && meaning.example"
          class="translated-example"
        >
          "{{ translatedMeanings.get(index)?.example }}"
        </div>
      </div>

      <button
        v-if="dictionaryData.meanings.length > MAX_MEANINGS_PREVIEW"
        class="show-more-btn"
        @click="$emit('toggleMeanings')"
      >
        {{
          showAllMeanings
            ? '− Mostrar menos'
            : `+ Mostrar mais ${dictionaryData.meanings.length - MAX_MEANINGS_PREVIEW} significados`
        }}
      </button>
    </div>
  </div>

  <div v-else-if="!isLoading && !dictionaryData" class="no-definition">
    Nenhuma definição encontrada
  </div>
</template>

<style scoped lang="scss">
.loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;

  .loading-spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-top-color: #667eea;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
}

.dictionary-content {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .phonetic {
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
    font-style: italic;
    padding: 8px 12px;
    background: rgba(102, 126, 234, 0.1);
    border-radius: 8px;
    display: inline-block;
    align-self: flex-start;
    border: 1px solid rgba(102, 126, 234, 0.2);
  }

  .definitions {
    .definition-item {
      margin-bottom: 12px;
      padding: 12px;
      background: rgba(255, 255, 255, 0.04);
      border-radius: 8px;
      transition: all 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.06);
        transform: translateX(2px);
      }

      .definition-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 6px;

        .translate-btn {
          background: rgba(102, 126, 234, 0.1);
          border: 1px solid rgba(102, 126, 234, 0.2);
          border-radius: 4px;
          padding: 2px 6px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;

          &:hover:not(:disabled) {
            background: rgba(102, 126, 234, 0.2);
          }

          &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
        }
      }

      .part-of-speech {
        display: inline-block;
        color: #667eea;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        margin-right: 10px;
        letter-spacing: 0.5px;
        padding: 2px 6px;
        background: rgba(102, 126, 234, 0.15);
        border-radius: 4px;
      }

      .definition {
        color: rgba(255, 255, 255, 0.95);
        font-size: 14px;
        line-height: 1.6;
        display: block;
        margin-top: 6px;
      }

      .example {
        display: block;
        color: rgba(255, 255, 255, 0.65);
        font-size: 13px;
        font-style: italic;
        margin-top: 8px;
        padding: 8px 12px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 6px;
      }

      .translated-content {
        margin-top: 8px;
        padding: 8px;
        background: rgba(102, 126, 234, 0.05);
        border-left: 2px solid rgba(102, 126, 234, 0.3);
        border-radius: 4px;

        .translated-definition {
          color: rgba(255, 255, 255, 0.85);
          font-size: 13px;
          font-style: italic;
        }
      }

      .translated-example {
        margin-top: 4px;
        padding: 6px 12px;
        background: rgba(102, 126, 234, 0.03);
        border-radius: 4px;
        color: rgba(255, 255, 255, 0.6);
        font-size: 12px;
        font-style: italic;
      }
    }
  }

  .show-more-btn {
    margin-top: 8px;
    padding: 6px 12px;
    background: rgba(102, 126, 234, 0.1);
    border: 1px solid rgba(102, 126, 234, 0.2);
    border-radius: 6px;
    color: #667eea;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    width: 100%;
    text-align: center;

    &:hover {
      background: rgba(102, 126, 234, 0.15);
      border-color: rgba(102, 126, 234, 0.3);
    }
  }
}

.no-definition {
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
  text-align: center;
  padding: 10px 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
