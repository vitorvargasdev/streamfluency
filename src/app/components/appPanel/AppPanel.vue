<script setup lang="ts">
import SubtitleDisplay from '@/app/components/subtitleDisplay/SubtitleDisplay.vue'
import LeftToolbar from '@/app/components/leftToolbar/LeftToolbar.vue'
import RightToolbar from '@/app/components/rightToolbar/RightToolbar.vue'
import getPlatform from '@/app/utils/getPlatform'

const platform = getPlatform()
</script>

<template>
  <div class="panel">
    <!-- <div> -->
    <!--   <NextSubtitleButton /> -->
    <!--   <ReplaySubtitleButton /> -->
    <!--   <PreviousSubtitleButton /> -->
    <!--  </div> -->

    <LeftToolbar :class="`panel__toolbar panel__toolbar--${platform}`" />
    <SubtitleDisplay :class="`panel__subtitle-display panel__subtitle-display--${platform}`" />
    <RightToolbar :class="`panel__toolbar panel__toolbar--${platform}`" />

    <!-- <div> -->
    <!--   <ConfigurationButton /> -->
    <!-- </div> -->
  </div>
</template>

<style lang="scss" scoped src="./style.scss" />
