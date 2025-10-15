<script setup lang="ts">
defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  cancelBtn: {
    type: String,
    default: 'Отмена',
  },
  confirmBtn: {
    type: String,
    default: 'Подтвердить',
  },
  isSubmitting: Boolean
})
const emit = defineEmits(['cancel', 'confirm'])
const isVisible = defineModel<boolean>('visible', { required: true })

function onCancel() {
  emit('cancel')
  isVisible.value = false
}

function onConfirm() {
  emit('confirm')
}
</script>

<template>
  <Dialog
    v-model:visible="isVisible"
    less-rounded
    :close-btn="false"
    :content-padding="false"
    :mobile-full-width="false"
    max-width="500px"
  >
    <slot name="title">
      <p class="text-center text-lg mt-5">{{ title }}</p>
    </slot>
    <slot name="description">
      <p class="text-center opacity-70 mx-2">{{ description }}</p>
    </slot>
    <div class="flex flex-col mt-6">
      <PrimeButton text class="action-btn" :loading="isSubmitting" @click="onConfirm">
        {{ confirmBtn }}
      </PrimeButton>
      <PrimeButton severity="secondary" text class="action-btn" :loading="isSubmitting" @click="onCancel">
        {{ cancelBtn }}
      </PrimeButton>
    </div>
  </Dialog>
</template>

<style scoped>
.action-btn {
  border-top: 1px solid var(--border);
  border-radius: 0;
  height: 3rem;
}
</style>
