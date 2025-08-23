<script setup lang="ts">
import type { TranslationResult } from '../../services/translation/types'

defineProps<{
  translationData: TranslationResult | null
  isTranslating: boolean
  targetLanguage: string
}>()
</script>

<template>
  <div v-if="translationData" class="translation-section">
    <div class="translation-label">Tradução ({{ targetLanguage }})</div>
    <div class="translation-text">
      {{ translationData.translatedText }}
    </div>
    <div class="translation-service">via {{ translationData.service }}</div>
  </div>

  <div v-else-if="isTranslating" class="loading">
    <span class="loading-spinner"></span>
    Traduzindo...
  </div>
</template>

<style scoped lang="scss">
.translation-section {
  margin-bottom: 12px;
  padding: 12px;
  background: rgba(102, 126, 234, 0.08);
  border-radius: 8px;
  border: 1px solid rgba(102, 126, 234, 0.15);

  .translation-label {
    color: #667eea;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
  }

  .translation-text {
    color: rgba(255, 255, 255, 0.95);
    font-size: 14px;
    line-height: 1.6;
    margin-bottom: 6px;
  }

  .translation-service {
    color: rgba(255, 255, 255, 0.4);
    font-size: 11px;
    font-style: italic;
  }
}

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

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
