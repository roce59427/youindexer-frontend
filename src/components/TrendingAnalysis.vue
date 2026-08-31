<script setup>
defineProps({
  tags: {
    type: Array,
    default: () => [
      { icon: 'menu_book', label: '納瓦爾寶典' },
      { icon: 'palette', label: 'Maybelline 睫毛膏' }
    ]
  }
})

const emit = defineEmits(['select'])
</script>

<template>
  <div class="w-full max-w-[680px] flex flex-col items-center opacity-80">
    <span class="font-label-sm text-label-sm text-on-surface-variant mb-3 uppercase tracking-wider">
      熱門趨勢分析
    </span>
    <div class="flex flex-wrap justify-center gap-2">
      <a
        v-for="tag in tags"
        :key="tag.label"
        href="#"
        class="px-4 py-1.5 rounded-full bg-surface-container-low hover:bg-surface-container border border-outline-variant text-on-surface-variant hover:text-on-surface text-label-lg font-label-lg transition-colors flex items-center gap-2"
        @click.prevent="emit('select', tag.label)"
      >
        <span class="material-symbols-outlined text-[16px]">{{ tag.icon }}</span>
        {{ tag.label }}
      </a>
    </div>
  </div>
</template>
