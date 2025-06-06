<script setup lang="ts">
import AppPanel from './components/appPanel/AppPanel.vue';
</script>

<template>
  <div class="app">
    <AppPanel />
  </div>
</template>

<style lang="scss" scoped>
.app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100vh;
  background: none;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
  pointer-events: none;
}
</style>

