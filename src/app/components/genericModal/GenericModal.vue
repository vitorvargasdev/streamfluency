<script setup lang="ts">
import { defineEmits, defineProps } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  size: {
    type: String,
    default: 'small',
  },
  title: {
    type: String,
    default: 'Modal Title',
  },
  showCloseButton: {
    type: Boolean,
    default: true,
  },
  showCancelButton: {
    type: Boolean,
    default: true,
  },
  showConfirmButton: {
    type: Boolean,
    default: true,
  },
  cancel: {
    type: String,
    default: 'Cancel',
  },
  confirm: {
    type: String,
    default: 'Confirm',
  },
})

const emits = defineEmits(['update:modelValue', 'close', 'cancel', 'confirm'])

const close = () => {
  emits('update:modelValue', false)
  emits('close')
}

const onCancel = () => {
  emits('update:modelValue', false)
  emits('cancel')
}

const onConfirm = () => {
  emits('confirm')
}
</script>

<template>
  <div class="modal__overlay" v-if="props.modelValue" @click="close">
    <div :class="`modal modal--${props.size}`" @click.stop>
      <div class="modal__header">
        <slot name="header">
          <div class="modal__header__title">{{ props.title }}</div>
          <div v-if="props.showCloseButton" class="modal__header__close" @click="close">
            &times;
          </div>
        </slot>
      </div>
      <div class="modal__body">
        <slot name="body" />
      </div>
      <div class="modal__footer">
        <slot name="footer">
          <div v-if="props.showCancelButton" class="modal__footer__cancel" @click="onCancel">
            {{ props.cancel }}
          </div>
          <div v-if="props.showConfirmButton" class="modal__footer__confirm" @click="onConfirm">
            {{ props.confirm }}
          </div>
        </slot>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped src="./style.scss" />
