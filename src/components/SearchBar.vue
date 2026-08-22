<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['search', 'update:modelValue'])

const query = ref(props.modelValue)

watch(
  () => props.modelValue,
  (value) => {
    query.value = value
  }
)

function handleSubmit() {
  const trimmed = query.value.trim()
  if (trimmed) {
    emit('search', trimmed)
  }
}

function handleVoiceClick() {
  // Placeholder for future voice search integration.
  emit('search', query.value.trim())
}

function handleInput() {
  emit('update:modelValue', query.value)
}
</script>

<template>
  <form class="w-full max-w-[680px] relative group" @submit.prevent="handleSubmit">
    <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant">
      <span class="material-symbols-outlined">search</span>
    </div>

    <input
      v-model="query"
      aria-label="Search"
      type="text"
      placeholder="搜尋洞察、平台或趨勢..."
      class="w-full h-14 pl-12 pr-12 rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-0 focus:border-outline search-focus transition-shadow text-body-lg"
      @input="handleInput"
    />

    <div class="absolute inset-y-0 right-0 pr-4 flex items-center gap-2">
      <button
        type="button"
        aria-label="Voice Search"
        class="text-google-blue hover:text-primary transition-colors p-1"
        @click="handleVoiceClick"
      >
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1">mic</span>
      </button>
    </div>
  </form>
</template>
