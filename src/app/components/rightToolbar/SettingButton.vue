<script setup lang="ts">
import ConfigurationModal from '@/app/components/configurationModal/ConfigurationModal.vue'
import { ref } from 'vue'

const configModal = ref<InstanceType<typeof ConfigurationModal>>()

const onClick = () => {
  configModal.value?.show()
}
</script>

<template>
  <ConfigurationModal ref="configModal" />
  <img
    class="side-button__icon"
    @click="onClick"
    src="@/app/assets/images/settings.svg"
    title="Configurações"
  />
</template>

<style lang="scss" scoped>
@forward '@/app/assets/scss/side-buttons';
</style>
