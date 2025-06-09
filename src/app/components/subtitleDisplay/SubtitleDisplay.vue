<script setup lang="ts">
import { ref } from 'vue'

const nativeSubtitle = ref('lorem ipsum')
const learningSubtitle = ref('lorem ipsum')
</script>

<template>
  <div class="subtitle">
    <div class="subtitle__primary subtitle__text" v-html="nativeSubtitle" />
    <div v-if="learningSubtitle" class="subtitle__secondary subtitle__text" v-html="learningSubtitle" />
  </div>
</template>

<style lang="scss" scoped src="./style.scss" />
