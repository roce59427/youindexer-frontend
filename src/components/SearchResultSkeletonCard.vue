<template>
  <article
    class="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden flex flex-col h-full animate-pulse"
    aria-hidden="true"
  >
    <!-- Thumbnail placeholder -->
    <div class="relative w-full h-40 shrink-0 bg-surface-container-high">
      <div class="absolute inset-0 bg-surface/70 flex items-center justify-center">
        <ThinkingOrb state="shaping" :size="64" />
      </div>
    </div>

    <!-- Content placeholder -->
    <div class="p-4 flex flex-col flex-grow">
      <div class="h-4 bg-surface-container-high rounded w-full mb-2" />
      <div class="h-4 bg-surface-container-high rounded w-2/3 mb-4" />
      <div class="h-3 bg-surface-container-high rounded w-1/3 mb-4" />

      <div class="border-t border-outline-variant pt-3 mt-auto space-y-2">
        <div class="h-3 bg-surface-container-high rounded w-1/4" />
        <div class="h-3 bg-surface-container-high rounded w-full" />
        <div class="h-3 bg-surface-container-high rounded w-5/6" />
      </div>
    </div>
  </article>
</template>

<script setup>
import ThinkingOrb from '@/components/ThinkingOrb.vue'
</script>
