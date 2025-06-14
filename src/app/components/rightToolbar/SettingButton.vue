<script setup lang="ts">
import genericModal from '@/app/components/genericModal/GenericModal.vue'
import { ref } from 'vue'

const showModal = ref(false)

const onClick = () => {
  showModal.value = true
}
</script>

<template>
  <genericModal v-model="showModal">
    <template #body>
      <div>Testing</div>
    </template>
  </genericModal>
  <img
    class="side-button__icon"
    @click="onClick"
    src="@/app/assets/images/settings.svg"
  />
</template>

<style lang="scss" scoped>
@forward '@/app/assets/scss/side-buttons';
</style>
