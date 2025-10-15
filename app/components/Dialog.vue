<script setup lang="ts">
const props = defineProps({
  backBtn: {
    type: Boolean,
    default: false,
  },
  closeBtn: {
    type: Boolean,
    default: true,
  },
  contentPadding: {
    type: Boolean,
    default: true,
  },
  lessRounded: {
    type: Boolean,
    default: false,
  },
  maxWidth: {
    type: [String],
    default: '600px',
  },
  mobileFullWidth: {
    type: Boolean,
    default: true,
  },
  title: String,
})
const isVisible = defineModel<boolean>('visible', { required: true })
</script>

<template>
  <PrimeDialog
    v-model:visible="isVisible"
    modal
    :style="{ maxWidth: maxWidth }"
    :draggable="false"
    dismissable-mask
    :pt="{
      root: {class: 'border-none'},
      header: {class: 'p-0'},
      content: {class: contentPadding ? 'p-4' : 'p-0'}
    }"
    :closable="false"
    :class="{'rounded-lg': lessRounded, 'rounded-2xl': !lessRounded, 'w-full': mobileFullWidth, 'w-[90%]': !mobileFullWidth}"
  >
    <template #header>
      <div class="relative w-full h-[3rem] empty:hidden">
        <PrimeButton
          v-if="backBtn"
          icon="pi pi-arrow-left"
          severity="secondary"
          rounded
          text
          class="cursor-pointer absolute left-0 top-1/2 -translate-y-1/2 ml-1"
        />

        <slot name="header">
          <p v-if="title"
             class="font-semibold absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none text-center">
            {{ title }}
          </p>
        </slot>

        <PrimeButton
          v-if="closeBtn"
          icon="pi pi-times"
          severity="secondary"
          rounded
          text
          class="cursor-pointer absolute right-0 top-1/2 -translate-y-1/2 mr-1"
          @click="isVisible = false"
        />
      </div>
    </template>

    <slot/>
  </PrimeDialog>
</template>

<style scoped>

</style>
