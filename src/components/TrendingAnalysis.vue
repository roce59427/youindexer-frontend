<script setup>
defineProps({
  tags: {
    type: Array,
    default: () => [
      { icon: 'trending_up', label: '2024 AI 採用趨勢' },
      { icon: 'bar_chart', label: 'Q3 SaaS 指標' },
      { icon: 'public', label: '全球隱私權法規' },
      { icon: 'group', label: 'Z 世代消費習慣' }
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
