<script setup>
import ThinkingOrb from '@/components/ThinkingOrb.vue'

defineProps({
  video: {
    type: Object,
    required: true
  },
  status: {
    type: String,
    default: 'loading'
  }
})

const emit = defineEmits(['click'])
const orbSpeed = 0.3 + Math.random() * 0.3

function formatTimestamp(seconds) {
  const total = Math.floor(seconds)
  const mins = Math.floor(total / 60)
    .toString()
    .padStart(2, '0')
  const secs = (total % 60).toString().padStart(2, '0')
  return `${mins}:${secs}`
}
</script>

<template>
  <article
    class="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full"
    @click="emit('click', video.metadata.video_id)"
  >
    <!-- Thumbnail -->
    <div class="relative w-full h-40 shrink-0">
      <img
        :src="video.metadata.thumbnail_url || `https://i.ytimg.com/vi/${video.metadata.video_id}/hqdefault.jpg`"
        :alt="video.metadata.title"
        class="w-full h-full object-cover"
      />
      <div
        class="absolute top-3 left-3 bg-white/90 backdrop-blur-sm p-1.5 rounded-lg flex items-center gap-1 shadow-sm"
      >
        <span class="material-symbols-outlined text-google-red text-sm">play_circle</span>
        <span class="font-label-sm text-label-sm text-on-surface font-semibold">YouTube</span>
      </div>
      <div
        v-if="status === 'loading'"
        class="absolute inset-0 bg-surface/70 flex items-center justify-center"
      >
        <ThinkingOrb :speed="orbSpeed" />
      </div>
    </div>

    <!-- Content -->
    <div class="p-4 flex flex-col flex-grow">
      <h3 class="font-title-md text-title-md text-on-surface mb-1 line-clamp-2">
        {{ video.metadata.title }}
      </h3>
      <p class="font-body-md text-body-md text-on-surface-variant mb-4 text-sm">
        {{ video.metadata.channel_name || 'YouTube' }}
        <span v-if="video.metadata.view_count_text"> • {{ video.metadata.view_count_text }}</span>
      </p>

      <!-- Mentions -->
      <div
        v-if="video.keyword_matches && video.keyword_matches.length"
        class="space-y-2 border-t border-outline-variant pt-3 mt-auto"
      >
        <h4 class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
          提及
        </h4>
        <div
          v-for="(match, index) in video.keyword_matches.slice(0, 2)"
          :key="index"
          class="flex items-start gap-2"
        >
          <span
            class="bg-primary-container text-on-primary-container px-2 py-0.5 rounded font-label-sm text-label-sm shrink-0 mt-0.5"
          >
            {{ formatTimestamp(match.seek_seconds) }}
          </span>
          <p
            class="font-body-md text-body-md text-on-surface text-sm line-clamp-2 [&>mark]:bg-primary-container [&>mark]:text-on-primary-container [&>mark]:px-0.5 [&>mark]:rounded"
          >
            <template v-if="match.highlighted_text">
              <span>&quot;...</span>
              <span v-html="match.highlighted_text" />
              <span>...&quot;</span>
            </template>
            <template v-else>&quot;...{{ match.text }}...&quot;</template>
          </p>
        </div>
      </div>

      <div
        v-else-if="status !== 'loading'"
        class="space-y-2 border-t border-outline-variant pt-3 mt-auto"
      >
        <p class="font-body-md text-body-md text-on-surface-variant text-sm">
          <span v-if="status === 'failed'">處理失敗：{{ video.error || '未知錯誤' }}</span>
          <span v-else>未找到關鍵字提及。</span>
        </p>
      </div>
    </div>
  </article>
</template>
