<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'SubtitleListButton',
  emits: ['openList'],
  setup(_, { emit }) {
    const openSubtitleList = () => {
      emit('openList')
    }

    return {
      openSubtitleList,
    }
  },
})
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
