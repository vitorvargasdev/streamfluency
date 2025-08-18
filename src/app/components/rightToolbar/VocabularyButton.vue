<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useVocabularyStore } from '../../stores/vocabulary'
import VocabularyModal from '../vocabularyModal/VocabularyModal.vue'

const vocabularyStore = useVocabularyStore()
const isModalOpen = ref(false)

const itemCount = computed(() => vocabularyStore.items.length)

const handleClick = () => {
  isModalOpen.value = true
}

onMounted(() => {
  vocabularyStore.init()
})
</script>

<template>
  <div class="vocabulary-button-wrapper">
    <img
      @click="handleClick"
      class="side-button__icon"
      :title="`Vocabulário (${itemCount} ${itemCount === 1 ? 'palavra' : 'palavras'})`"
      src="../../assets/images/book.svg"
      alt="Vocabulário"
    />
  </div>

  <VocabularyModal
    :is-visible="isModalOpen"
    @update:is-visible="isModalOpen = $event"
    @close="isModalOpen = false"
  />
</template>

<style scoped lang="scss">
@forward '@/app/assets/scss/side-buttons';

.vocabulary-button-wrapper {
  position: relative;
  display: inline-block;
}
</style>
