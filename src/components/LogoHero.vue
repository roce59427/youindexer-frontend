<script setup>
import logoUrl from '../assets/logo.png'

defineProps({
  alt: {
    type: String,
    default: 'YouIndexer Logo'
  }
})
</script>

<template>
  <div class="mb-stack-lg flex flex-col items-center">
    <img
      :alt="alt"
      :src="logoUrl"
      class="h-20 md:h-28 w-auto object-contain mb-4"
    />
    <h1 class="font-display-lg text-display-lg text-on-surface hidden">YouIndexer</h1>
  </div>
</template>
