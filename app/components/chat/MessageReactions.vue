<script setup lang="ts">
import { defineProps } from 'vue'

const props = defineProps<{
  reactions: string[]
}>()
</script>

<template>
  <div class="reactions">
    <span
      v-for="(r, i) in props.reactions"
      :key="i"
      class="reaction"
    >
      {{ r }}
    </span>
  </div>
</template>

<style scoped>
.reactions {
  display: flex;
  gap: 5px;
  margin-top: 4px;
  font-size: 1rem;
  cursor: pointer;
}

.reaction {
  padding: 0.15rem 0.4rem;
  border-radius: 12px;
  background: #f0f0f0;
}
</style>
