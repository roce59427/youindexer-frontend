<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import SearchResultCard from '@/components/SearchResultCard.vue'
import SearchResultSkeletonCard from '@/components/SearchResultSkeletonCard.vue'
import {
  createKeywordSearchJob,
  getKeywordSearchJob,
  streamKeywordSearchJobEvents
} from '@/api/youtube.js'

const route = useRoute()
const router = useRouter()
const job = ref(null)
const error = ref('')
const isCreating = ref(false)
const cleanupSSE = ref(null)

const query = computed(() => {
  const value = route.query.q
  return (Array.isArray(value) ? value[0] : value || '')
})

const taskId = computed(() => {
  const value = route.query.task_id
  return Array.isArray(value) ? value[0] : value || ''
})

const videoList = computed(() => Object.values(job.value?.videos || {}))

const progressText = computed(() => {
  if (!job.value) return ''
  if (job.value.status === 'completed') {
    return `搜尋完成，可能提及您搜尋內容的影片有 ${job.value.matched_count} 部`
  }
  if (job.value.status === 'failed') return '搜尋失敗'
  return `處理中 ${job.value.completed_count || 0} / ${job.value.video_count || 0} 部影片...`
})

const showSkeletons = computed(() => {
  if (error.value) return false
  return !job.value || (job.value.status === 'processing' && videoList.value.length === 0)
})

const skeletonCount = computed(() => job.value?.video_count || 6)

function goToVideo(videoId) {
  if (!job.value?.task_id || !videoId) return
  router.push({
    name: 'video-insight',
    query: { task_id: job.value.task_id, video_id: videoId, q: query.value }
  })
}

function subscribeToJob(id) {
  cleanupSSE.value = streamKeywordSearchJobEvents(id, {
    onSnapshot: (data) => { job.value = data },
    onUpdate: (data) => { job.value = data },
    onError: (detail) => { error.value = detail || '串流發生錯誤' }
  })
}

async function loadTask() {
  const id = taskId.value
  const keyword = query.value.trim()
  if (!id && !keyword) return

  cleanupSSE.value?.()
  cleanupSSE.value = null
  job.value = null
  error.value = ''
  isCreating.value = !id

  try {
    const initial = id
      ? await getKeywordSearchJob(id)
      : await createKeywordSearchJob(keyword, 'zh-TW', 5)

    if (!id) {
      await router.replace({
        name: 'search-results',
        query: { q: keyword, task_id: initial.task_id }
      })
      return
    }

    job.value = initial
    isCreating.value = false
    subscribeToJob(initial.task_id)
  } catch (err) {
    error.value = err.message || (id ? '無法載入搜尋任務' : '無法建立搜尋任務')
    isCreating.value = false
  }
}

onMounted(loadTask)
onUnmounted(() => cleanupSSE.value?.())
watch([() => route.query.q, () => route.query.task_id], loadTask)
</script>

<template>
  <div class="max-w-[1024px] mx-auto p-margin-mobile md:p-margin-desktop">
    <div class="mb-stack-lg">
      <h1 class="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">
        「{{ query || '...' }}」的搜尋結果
      </h1>
      <p v-if="progressText" class="font-body-md text-body-md text-on-surface-variant">{{ progressText }}</p>
    </div>

    <div v-if="job?.status === 'processing'" class="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden mb-stack-lg">
      <div class="h-full bg-primary transition-all duration-500" :style="{ width: job.video_count ? `${(job.completed_count / job.video_count) * 100}%` : '0%' }" />
    </div>

    <div v-if="error" class="mb-stack-lg p-stack-md bg-error-container text-on-error-container rounded-xl border border-error/20">
      <p class="font-body-md text-body-md">{{ error }}</p>
      <button type="button" class="mt-stack-sm px-4 py-2 bg-error text-on-error rounded-DEFAULT font-label-lg text-label-lg hover:opacity-90 transition-opacity" @click="loadTask">
        重試
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter items-start">
      <template v-if="showSkeletons">
        <SearchResultSkeletonCard v-for="n in skeletonCount" :key="`skeleton-${n}`" />
      </template>
      <template v-else>
        <SearchResultCard v-for="video in videoList" :key="video.metadata.video_id" :video="video" :status="video.status" @click="goToVideo" />
      </template>
    </div>
    <p v-if="showSkeletons" class="sr-only" role="status">搜尋載入中</p>
    <div v-if="!isCreating && !error && videoList.length === 0 && job?.status === 'completed'" class="mt-stack-lg text-center">
      <p class="font-body-lg text-body-lg text-on-surface-variant">未找到任何影片結果。</p>
    </div>
  </div>
</template>
