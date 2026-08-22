<script setup>
const emit = defineEmits(['action'])

const actions = [
  { id: 'deep-scan', label: '深度掃描' },
  { id: 'quick-report', label: '快速報告' }
]

function handleClick(actionId) {
  emit('action', actionId)
}
</script>

<template>
  <div class="flex flex-wrap justify-center gap-4 mb-12">
    <button
      v-for="action in actions"
      :key="action.id"
      type="button"
      class="px-6 py-2 bg-surface-container-low hover:bg-surface-container border border-transparent rounded-DEFAULT font-label-lg text-label-lg text-on-surface transition-colors"
      @click="handleClick(action.id)"
    >
      {{ action.label }}
    </button>
  </div>
</template>
