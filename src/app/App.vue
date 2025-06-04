<script setup lang="ts">
import SubtitleDisplay from '@/app/components/subtitleDisplay/SubtitleDisplay.vue'
import LeftToolbar from '@/app/components/leftToolbar/LeftToolbar.vue'
import RightToolbar from '@/app/components/rightToolbar/RightToolbar.vue'
</script>

<template>
  <div class="app">
    <div class="panel">
      <!-- <div> -->
      <!--   <NextSubtitleButton /> -->
      <!--   <ReplaySubtitleButton /> -->
      <!--   <PreviousSubtitleButton /> -->
      <!--  </div> -->

      <LeftToolbar />
      <SubtitleDisplay />
      <RightToolbar />

      <!-- <div> -->
      <!--   <ConfigurationButton /> -->
      <!-- </div> -->
    </div>
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

.panel {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  position: absolute;
  bottom: 35vh;
  pointer-events: all;
  font-size: 24px;
}
</style>
