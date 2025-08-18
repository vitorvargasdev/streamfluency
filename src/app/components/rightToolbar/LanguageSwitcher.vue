<script setup lang="ts">
import genericModal from '@/app/components/genericModal/GenericModal.vue'
import { ref, computed, watch } from 'vue'
import { useSettingStore } from '@/app/stores/setting'
import { GLOBAL_LANGUAGES } from '@/app/assets/constants'

const settingStore = useSettingStore()
const showModal = ref(false)
const selectedNative = ref(settingStore.nativeLanguage)
const selectedLearning = ref(settingStore.learningLanguage)
const errorMessage = ref('')
const isLoading = ref(false)

const languageLabels = {
  [GLOBAL_LANGUAGES.EN]: 'Inglês',
  [GLOBAL_LANGUAGES.ES]: 'Espanhol',
  [GLOBAL_LANGUAGES.PTBR]: 'Português (BR)',
  [GLOBAL_LANGUAGES.JA]: 'Japonês',
}

const availableLanguages = computed(() => [
  GLOBAL_LANGUAGES.EN,
  GLOBAL_LANGUAGES.ES,
  GLOBAL_LANGUAGES.PTBR,
  GLOBAL_LANGUAGES.JA,
])

const onClick = () => {
  selectedNative.value = settingStore.nativeLanguage
  selectedLearning.value = settingStore.learningLanguage
  errorMessage.value = ''
  showModal.value = true
}

const onCancel = () => {
  showModal.value = false
  errorMessage.value = ''
}

const onConfirm = async () => {
  if (selectedNative.value === selectedLearning.value) {
    errorMessage.value = 'Os idiomas devem ser diferentes'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    await settingStore.setLanguages(
      selectedNative.value,
      selectedLearning.value
    )
    showModal.value = false
  } catch (error) {
    errorMessage.value = 'Erro ao carregar legendas'
  } finally {
    isLoading.value = false
  }
}

watch(
  () => settingStore.isFirstTimeUser,
  (isFirstTime) => {
    if (isFirstTime && !settingStore.hasUserSetLanguages()) {
      showModal.value = true
    }
  },
  { immediate: true }
)
</script>

<template>
  <genericModal
    v-model="showModal"
    title="Configurar Idiomas"
    size="small"
    :show-close-button="!settingStore.isFirstTimeUser"
    confirm="Confirmar"
    cancel="Cancelar"
    @confirm="onConfirm"
    @cancel="onCancel"
  >
    <template #body>
      <div class="language-selector">
        <div class="language-selector__group">
          <label class="openfluency-select-label">Idioma Nativo:</label>
          <select
            class="openfluency-select"
            v-model="selectedNative"
            :disabled="isLoading"
          >
            <option
              v-for="lang in availableLanguages"
              :key="lang"
              :value="lang"
            >
              {{ languageLabels[lang] }}
            </option>
          </select>
        </div>

        <div class="language-selector__group">
          <label class="openfluency-select-label">Aprendendo:</label>
          <select
            class="openfluency-select"
            v-model="selectedLearning"
            :disabled="isLoading"
          >
            <option
              v-for="lang in availableLanguages"
              :key="lang"
              :value="lang"
            >
              {{ languageLabels[lang] }}
            </option>
          </select>
        </div>

        <div v-if="errorMessage" class="language-selector__error">
          {{ errorMessage }}
        </div>

        <div v-if="isLoading" class="language-selector__loading">
          Carregando legendas...
        </div>
      </div>
    </template>
  </genericModal>

  <img
    class="side-button__icon"
    @click="onClick"
    src="@/app/assets/images/languages.svg"
  />
</template>

<style lang="scss" scoped>
@forward '@/app/assets/scss/side-buttons';
@use '@/app/assets/scss/components/select';

.language-selector {
  &__group {
    margin-bottom: 20px;
  }

  &__error {
    color: #ff6b6b;
    font-size: 14px;
    margin-top: 10px;
    padding: 8px;
    background: rgba(255, 107, 107, 0.1);
    border-radius: 4px;
    text-align: center;
  }

  &__loading {
    color: #fff;
    font-size: 14px;
    margin-top: 10px;
    text-align: center;
    opacity: 0.8;
  }
}
</style>
