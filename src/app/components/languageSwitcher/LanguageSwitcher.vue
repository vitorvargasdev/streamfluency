<script setup lang="ts">
const emits = defineEmits(['update:modelValue'])

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
})

const close = () => {
  emits('update:modelValue', false)
}
</script>

<template>
  <GenericModal
    v-if="props.modelValue"
    title="Language Switcher"
    size="medium"
    @close="close"
  >
    <template #body>
      <div>Body</div>
    </template>
  </GenericModal>
</template>
