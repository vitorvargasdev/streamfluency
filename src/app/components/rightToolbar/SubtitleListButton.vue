<script setup lang="ts">
const emit = defineEmits<{
  openList: []
}>()

const openSubtitleList = () => {
  emit('openList')
}
</script>

<template>
  <img
    @click="openSubtitleList"
    class="side-button__icon"
    title="Ver todas as legendas"
    src="../../assets/images/texts.svg"
    alt="Lista de legendas"
  />
</template>

<style lang="scss" scoped>
@forward '@/app/assets/scss/side-buttons';
</style>
