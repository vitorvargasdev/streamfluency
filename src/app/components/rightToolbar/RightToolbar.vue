<script setup lang="ts">
import SettingButton from './SettingButton.vue';
import LanguageSwitcher from './LanguageSwitcher.vue';
</script>

<template>
  <div class="side-button">
    <img class="side-button__icon" src="@/app/assets/images/texts.svg" />
    <LanguageSwitcher />
    <SettingButton />
  </div>
</template>

<style lang="scss" scoped>
@forward '@/app/assets/scss/side-buttons';
</style>
