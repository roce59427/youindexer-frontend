<script setup>
import { computed, onUnmounted, ref } from 'vue'

import AppFooter from '@/components/AppFooter.vue'
import TopNavBar from '@/components/TopNavBar.vue'
import { getVideoIndexStatus, ingestVideoByUrl } from '@/api/youtube.js'

const url = ref('')
const submitting = ref(false)
const error = ref('')
const result = ref(null)

let pollTimer = null

const STATUS_LABEL = {
  pending: '等待中',
  running: '處理中',
  stored: '已取得字幕',
  unavailable: '沒有可用字幕',
  failed: '失敗'
}

const INDEX_STATUS_LABEL = {
  pending: '等待索引',
  running: '索引中',
  indexed: '已索引',
  failed: '索引失敗'
}

const isSettled = computed(() => {
  if (!result.value) return true
  return result.value.transcripts.every((transcript) => {
    const stillFetching = transcript.status === 'pending' || transcript.status === 'running'
    const stillIndexing =
      transcript.status === 'stored' &&
      (transcript.index_status === 'pending' || transcript.index_status === 'running' || !transcript.index_status)
    return !stillFetching && !stillIndexing
  })
})

function stopPolling() {
  if (pollTimer) {
    window.clearInterval(pollTimer)
    pollTimer = null
  }
}

function startPolling(videoId) {
  stopPolling()
  pollTimer = window.setInterval(async () => {
    try {
      const status = await getVideoIndexStatus(videoId)
      result.value = { ...result.value, transcripts: status.transcripts }
      if (isSettled.value) stopPolling()
    } catch {
      stopPolling()
    }
  }, 2000)
}

async function handleSubmit() {
  const trimmed = url.value.trim()
  if (!trimmed) return

  stopPolling()
  submitting.value = true
  error.value = ''
  result.value = null

  try {
    const response = await ingestVideoByUrl(trimmed)
    result.value = response
    if (!isSettled.value) startPolling(response.video_id)
  } catch (err) {
    error.value = err.message || '無法擷取這支影片'
  } finally {
    submitting.value = false
  }
}

onUnmounted(stopPolling)
</script>

<template>
  <div class="min-h-screen flex flex-col bg-surface text-on-surface font-body-lg">
    <TopNavBar />

    <main class="flex-grow max-w-[720px] mx-auto w-full px-margin-mobile md:px-margin-desktop py-stack-lg">
      <h1 class="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">
        貼網址擷取影片
      </h1>
      <p class="font-body-md text-body-md text-on-surface-variant mb-stack-lg">
        目前僅支援 YouTube 影片網址，貼上後會直接擷取字幕並建立索引。
      </p>

      <form class="flex flex-col sm:flex-row gap-2 mb-stack-lg" @submit.prevent="handleSubmit">
        <input
          v-model="url"
          type="url"
          required
          placeholder="https://www.youtube.com/watch?v=..."
          class="flex-1 bg-surface-container-low border border-outline-variant rounded-full px-4 py-2 text-body-md font-body-md text-on-surface outline-none focus:border-primary"
        />
        <button
          type="submit"
          :disabled="submitting || !url.trim()"
          class="px-6 py-2 rounded-full bg-primary text-on-primary font-label-lg text-label-lg disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {{ submitting ? '擷取中...' : '擷取' }}
        </button>
      </form>

      <div v-if="error" class="p-stack-md bg-error-container text-on-error-container rounded-xl border border-error/20 mb-stack-lg">
        <p class="font-body-md text-body-md">{{ error }}</p>
      </div>

      <div v-if="result" class="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
        <div class="flex gap-4">
          <img
            v-if="result.thumbnail_url"
            :src="result.thumbnail_url"
            :alt="result.title"
            class="w-32 h-20 object-cover rounded-lg shrink-0 bg-surface-container"
          />
          <div class="min-w-0">
            <h2 class="font-title-lg text-title-lg text-on-surface line-clamp-2">{{ result.title }}</h2>
            <p class="font-body-md text-body-md text-on-surface-variant mt-1">
              {{ result.channel_name || 'YouTube' }}
              <span v-if="result.view_count_text"> • {{ result.view_count_text }}</span>
            </p>
          </div>
        </div>

        <div class="mt-stack-md pt-stack-md border-t border-outline-variant">
          <h3 class="font-title-md text-title-md text-on-surface-variant mb-2">字幕索引狀態</h3>
          <ul class="flex flex-col gap-2">
            <li
              v-for="transcript in result.transcripts"
              :key="transcript.language"
              class="flex items-center justify-between font-body-md text-body-md"
            >
              <span class="text-on-surface">{{ transcript.language }}</span>
              <span class="text-on-surface-variant">
                {{ STATUS_LABEL[transcript.status] || transcript.status }}
                <template v-if="transcript.status === 'stored' && transcript.index_status">
                  ・{{ INDEX_STATUS_LABEL[transcript.index_status] || transcript.index_status }}
                </template>
              </span>
            </li>
          </ul>
          <p v-if="!isSettled" class="font-label-sm text-label-sm text-on-surface-variant mt-2">
            背景處理中，狀態每 2 秒自動更新...
          </p>
        </div>
      </div>
    </main>

    <AppFooter />
  </div>
</template>
