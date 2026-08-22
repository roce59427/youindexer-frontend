<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import TopNavBar from '@/components/TopNavBar.vue'
import AppFooter from '@/components/AppFooter.vue'
import { getKeywordSearchJob } from '@/api/youtube.js'

const route = useRoute()
const router = useRouter()

const taskId = computed(() => route.query.task_id)
const videoId = computed(() => route.query.video_id)
const query = computed(() => route.query.q || '')

const job = ref(null)
const loading = ref(false)
const error = ref('')
const activeMatchIndex = ref(-1)
const activeGroupIndex = ref(-1)
const activeTab = ref('insights')
const currentSeekSeconds = ref(0)
const followEnabled = ref(false)
const transcriptSearchQuery = ref('')

const player = ref(null)
const playerReady = ref(false)
const transcriptListRef = ref(null)
const groupRefs = ref([])
let timeTrackingInterval = null
let ytApiPromise = null
let scrollHandler = null

const video = computed(() => {
  if (!job.value?.videos || !videoId.value) return null
  return job.value.videos[videoId.value]
})

const metadata = computed(() => video.value?.metadata)
const matches = computed(() => {
  const items = video.value?.keyword_matches || []
  return [...items].sort((a, b) => a.seek_seconds - b.seek_seconds)
})

const transcripts = computed(() => {
  if (!video.value?.transcripts) return []
  return video.value.transcripts
})

const allSegments = computed(() => {
  const segments = []
  for (const transcript of transcripts.value) {
    for (const segment of transcript.segments || []) {
      segments.push(segment)
    }
  }
  return segments.sort((a, b) => a.start_ms - b.start_ms)
})

const GROUP_WINDOW_MS = 30_000

const groupedSegments = computed(() => {
  const groups = []
  let currentGroup = null

  for (const segment of allSegments.value) {
    const windowStart = Math.floor(segment.start_ms / GROUP_WINDOW_MS) * GROUP_WINDOW_MS
    if (!currentGroup || currentGroup.start_ms !== windowStart) {
      currentGroup = {
        start_ms: windowStart,
        end_ms: windowStart + GROUP_WINDOW_MS,
        segments: []
      }
      groups.push(currentGroup)
    }
    currentGroup.segments.push(segment)
  }

  return groups.map((group) => ({
    ...group,
    text: group.segments.map((s) => s.text).join(' ')
  }))
})

function loadYouTubeApi() {
  if (ytApiPromise) return ytApiPromise
  ytApiPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve()
      return
    }
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)
    window.onYouTubeIframeAPIReady = () => resolve()
  })
  return ytApiPromise
}

async function initPlayer() {
  if (!videoId.value) return
  await loadYouTubeApi()
  if (player.value) return
  player.value = new window.YT.Player('yt-player', {
    videoId: videoId.value,
    playerVars: {
      rel: 0,
      autoplay: 0,
      enablejsapi: 1
    },
    events: {
      onReady: () => {
        playerReady.value = true
        if (currentSeekSeconds.value > 0) {
          seekPlayer(currentSeekSeconds.value)
        }
      },
      onStateChange: trackCurrentTime
    }
  })
}

function seekPlayer(seconds) {
  if (!player.value || !playerReady.value) return
  player.value.seekTo(seconds, true)
  player.value.playVideo()
}

function trackCurrentTime() {
  if (timeTrackingInterval) {
    window.clearInterval(timeTrackingInterval)
  }
  timeTrackingInterval = window.setInterval(() => {
    if (!player.value || !playerReady.value) return
    try {
      const seconds = player.value.getCurrentTime()
      updateActiveGroupByTime(seconds)
    } catch {
      // ignore
    }
  }, 500)
}

function updateActiveGroupByTime(seconds) {
  const ms = seconds * 1000
  const index = groupedSegments.value.findIndex(
    (group, i) =>
      ms >= group.start_ms &&
      (i === groupedSegments.value.length - 1 || ms < groupedSegments.value[i + 1].start_ms)
  )
  if (index !== -1 && index !== activeGroupIndex.value) {
    activeGroupIndex.value = index
    activeMatchIndex.value = -1
    if (followEnabled.value) {
      scrollToActiveGroup()
    }
  }
}

function findGroupIndexByTime(seconds) {
  const ms = seconds * 1000
  return groupedSegments.value.findIndex(
    (group, i) =>
      ms >= group.start_ms &&
      (i === groupedSegments.value.length - 1 || ms < groupedSegments.value[i + 1].start_ms)
  )
}

function formatTimestamp(seconds) {
  const total = Math.floor(seconds)
  const hrs = Math.floor(total / 3600)
    .toString()
    .padStart(2, '0')
  const mins = Math.floor((total % 3600) / 60)
    .toString()
    .padStart(2, '0')
  const secs = (total % 60).toString().padStart(2, '0')
  return hrs === '00' ? `${mins}:${secs}` : `${hrs}:${mins}:${secs}`
}

function goBack() {
  router.push({
    name: 'home',
    query: { task_id: taskId.value, q: query.value }
  })
}

function handleHeaderSearch(newQuery) {
  router.push({ name: 'search-results', query: { q: newQuery } })
}

async function loadJob() {
  if (!taskId.value) {
    error.value = '缺少任務 ID'
    return
  }
  loading.value = true
  error.value = ''
  try {
    job.value = await getKeywordSearchJob(taskId.value)
    if (!video.value) {
      error.value = '找不到指定的影片'
    }
  } catch (err) {
    error.value = err.message || '無法載入任務資料'
  } finally {
    loading.value = false
  }
}

function selectMatch(index) {
  activeMatchIndex.value = index
  const seconds = matches.value[index].seek_seconds
  activeGroupIndex.value = findGroupIndexByTime(seconds)
  currentSeekSeconds.value = seconds
  seekPlayer(seconds)
}

function selectGroup(index) {
  activeGroupIndex.value = index
  activeMatchIndex.value = -1
  const seconds = groupedSegments.value[index].start_ms / 1000
  currentSeekSeconds.value = seconds
  seekPlayer(seconds)
}

function scrollToActiveGroup() {
  nextTick(() => {
    const el = groupRefs.value[activeGroupIndex.value]
    if (el && transcriptListRef.value) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  })
}

function toggleFollow() {
  followEnabled.value = !followEnabled.value
  if (followEnabled.value) {
    scrollToActiveGroup()
  }
}

function highlightText(text, query) {
  if (!query || !text) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  return text.replace(regex, '<mark class="transcript-highlight">$1</mark>')
}

const filteredGroups = computed(() => {
  if (!transcriptSearchQuery.value.trim()) return groupedSegments.value
  const q = transcriptSearchQuery.value.toLowerCase()
  return groupedSegments.value.filter((g) => g.text.toLowerCase().includes(q))
})

function handleTranscriptScroll() {
  if (followEnabled.value) {
    followEnabled.value = false
  }
}

watch(
  () => route.query.task_id,
  async () => {
    await loadJob()
    if (!player.value && videoId.value) {
      await initPlayer()
    }
  }
)

onMounted(async () => {
  await loadJob()
  await initPlayer()
  scrollHandler = handleTranscriptScroll
  transcriptListRef.value?.addEventListener('scroll', scrollHandler)
})

onUnmounted(() => {
  if (timeTrackingInterval) {
    window.clearInterval(timeTrackingInterval)
  }
  if (player.value) {
    try {
      player.value.destroy()
    } catch {
      // ignore
    }
  }
  if (scrollHandler && transcriptListRef.value) {
    transcriptListRef.value.removeEventListener('scroll', scrollHandler)
  }
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-surface text-on-surface font-body-lg">
    <TopNavBar :show-search="true" :search-query="query" @search="handleHeaderSearch" />

    <main
      class="flex-grow flex flex-col lg:flex-row max-w-[1440px] mx-auto w-full px-margin-mobile md:px-margin-desktop py-stack-lg gap-gutter"
    >
      <!-- Left Column -->
      <section class="w-full lg:w-[60%] flex flex-col gap-stack-md">
        <!-- Header -->
        <div>
          <button
            type="button"
            class="mb-stack-sm flex items-center gap-1 text-primary font-label-lg text-label-lg hover:underline"
            @click="goBack"
          >
            <span class="material-symbols-outlined text-[18px]">arrow_back</span>
            返回結果
          </button>
          <div class="flex items-center gap-2 mb-2">
            <span class="bg-surface-container px-3 py-1 rounded-full font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
              <span class="material-symbols-outlined text-[14px]">videocam</span>
              YouTube
            </span>
            <span class="text-on-surface-variant font-label-sm text-label-sm">發布於 {{ metadata?.published_text || '-' }}</span>
          </div>
          <h1 class="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-1">
            {{ metadata?.title || '載入中...' }}
          </h1>
          <p class="font-body-md text-body-md text-on-surface-variant">
            {{ metadata?.channel_name || 'YouTube' }}
            <span v-if="metadata?.view_count_text"> • {{ metadata.view_count_text }}</span>
          </p>
        </div>

        <!-- Loading / Error -->
        <div
          v-if="loading"
          class="w-full aspect-video bg-surface-container rounded-xl flex items-center justify-center"
        >
          <span class="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
        </div>
        <div
          v-else-if="error"
          class="p-stack-md bg-error-container text-on-error-container rounded-xl border border-error/20"
        >
          <p class="font-body-md text-body-md">{{ error }}</p>
          <button
            type="button"
            class="mt-stack-sm px-4 py-2 bg-error text-on-error rounded-DEFAULT font-label-lg text-label-lg hover:opacity-90 transition-opacity"
            @click="loadJob"
          >
            重試
          </button>
        </div>

        <!-- Video Player -->
        <div
          v-else
          class="w-full aspect-video bg-inverse-surface rounded-xl overflow-hidden relative shadow-sm border border-outline-variant"
        >
          <div id="yt-player" class="absolute inset-0 w-full h-full" />
        </div>

        <!-- Analytics Card -->
        <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
          <h2 class="font-title-lg text-title-lg text-on-surface mb-6 flex items-center gap-2">
            <span class="material-symbols-outlined text-google-blue">bar_chart</span>
            情感分析與核心要點
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Sentiment Bars (placeholder) -->
            <div class="flex flex-col gap-4">
              <h3 class="font-title-md text-title-md text-on-surface-variant mb-2">整體情感</h3>
              <div class="flex items-center gap-4">
                <div class="w-20 font-label-lg text-label-lg text-on-surface">正面</div>
                <div class="flex-grow h-2 bg-surface-container-high rounded-full overflow-hidden">
                  <div class="h-full bg-google-green w-[65%] rounded-full"></div>
                </div>
                <div class="w-10 text-right font-label-lg text-label-lg text-on-surface-variant">65%</div>
              </div>
              <div class="flex items-center gap-4">
                <div class="w-20 font-label-lg text-label-lg text-on-surface">中立</div>
                <div class="flex-grow h-2 bg-surface-container-high rounded-full overflow-hidden">
                  <div class="h-full bg-google-yellow w-[25%] rounded-full"></div>
                </div>
                <div class="w-10 text-right font-label-lg text-label-lg text-on-surface-variant">25%</div>
              </div>
              <div class="flex items-center gap-4">
                <div class="w-20 font-label-lg text-label-lg text-on-surface">負面</div>
                <div class="flex-grow h-2 bg-surface-container-high rounded-full overflow-hidden">
                  <div class="h-full bg-google-red w-[10%] rounded-full"></div>
                </div>
                <div class="w-10 text-right font-label-lg text-label-lg text-on-surface-variant">10%</div>
              </div>
              <p class="font-label-sm text-label-sm text-on-surface-variant mt-2">
                * 情感比例為示意資料，未來將由 NLP 模型分析產生。
              </p>
            </div>

            <!-- Key Takeaways (placeholder) -->
            <div>
              <h3 class="font-title-md text-title-md text-on-surface-variant mb-4">AI 摘要內容</h3>
              <ul class="flex flex-col gap-3">
                <li class="flex gap-3 items-start">
                  <span class="material-symbols-outlined text-google-green text-[20px] mt-0.5">check_circle</span>
                  <span class="font-body-md text-body-md text-on-surface">評論者高度讚揚了新版電池續航的改進，指出日常使用時間增加了 30%。</span>
                </li>
                <li class="flex gap-3 items-start">
                  <span class="material-symbols-outlined text-google-yellow text-[20px] mt-0.5">warning</span>
                  <span class="font-body-md text-body-md text-on-surface">相較於競爭對手，定價被視為入門級消費者潛在的購買門檻。</span>
                </li>
                <li class="flex gap-3 items-start">
                  <span class="material-symbols-outlined text-google-blue text-[20px] mt-0.5">info</span>
                  <span class="font-body-md text-body-md text-on-surface">軟體使用者介面的更新評價兩極；重度使用者喜歡其資訊密度，而一般使用者則覺得過於複雜。</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- Right Column: Analysis Panel -->
      <section class="w-full lg:w-[40%] flex flex-col bg-surface rounded-xl border border-outline-variant shadow-sm h-[calc(100vh-140px)] overflow-hidden relative">
        <!-- Tabs -->
        <div class="flex border-b border-outline-variant bg-surface-container-lowest shrink-0">
          <button
            type="button"
            :class="[
              'flex-1 py-4 text-center font-title-md text-title-md transition-colors cursor-pointer',
              activeTab === 'insights'
                ? 'text-primary font-bold border-b-2 border-primary bg-primary-container/5'
                : 'text-on-surface-variant hover:bg-surface-variant/30'
            ]"
            @click="activeTab = 'insights'"
          >
            洞察提及
          </button>
          <button
            type="button"
            :class="[
              'flex-1 py-4 text-center font-title-md text-title-md transition-colors cursor-pointer',
              activeTab === 'transcript'
                ? 'text-primary font-bold border-b-2 border-primary bg-primary-container/5'
                : 'text-on-surface-variant hover:bg-surface-variant/30'
            ]"
            @click="activeTab = 'transcript'"
          >
            完整台詞
          </button>
        </div>

        <!-- Follow Toggle (transcript only) -->
        <div
          v-if="activeTab === 'transcript'"
          class="flex justify-end px-4 py-2 border-b border-outline-variant bg-surface-container-lowest shrink-0"
        >
          <button
            type="button"
            :class="[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label-lg text-label-lg transition-colors',
              followEnabled
                ? 'bg-primary text-on-primary'
                : 'text-on-surface-variant hover:bg-surface-container'
            ]"
            @click="toggleFollow"
          >
            <span class="material-symbols-outlined text-[18px]">
              {{ followEnabled ? 'sync' : 'sync_disabled' }}
            </span>
            {{ followEnabled ? '跟隨中' : '跟隨播放' }}
          </button>
        </div>

        <!-- Tab Content -->
        <div
          ref="transcriptListRef"
          class="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-2"
        >
          <!-- Insights Tab -->
          <template v-if="activeTab === 'insights'">
            <div
              v-for="(match, index) in matches"
              :key="`match-${index}`"
              :class="[
                'rounded-lg p-3 cursor-pointer transition-colors relative overflow-hidden group border',
                index === activeMatchIndex
                  ? 'bg-primary-fixed border-primary/20'
                  : 'bg-surface-container-lowest border-outline-variant hover:bg-surface-container-low'
              ]"
              @click="selectMatch(index)"
            >
              <div
                v-if="index === activeMatchIndex"
                class="absolute left-0 top-0 bottom-0 w-1 bg-primary"
              />
              <div class="flex justify-between items-start mb-2 pl-2">
                <span
                  :class="[
                    'font-label-sm text-label-sm px-2 py-0.5 rounded flex items-center gap-1 shadow-sm',
                    index === activeMatchIndex
                      ? 'bg-white text-primary border border-primary/20'
                      : 'bg-surface-container text-on-surface-variant'
                  ]"
                >
                  <span class="material-symbols-outlined text-[12px]">schedule</span>
                  {{ formatTimestamp(match.seek_seconds) }}
                </span>
                <span class="bg-secondary-container text-on-secondary-container font-label-sm text-label-sm px-2 py-0.5 rounded-full border border-secondary/10">
                  提及
                </span>
              </div>
              <p
                :class="[
                  'font-body-md text-body-md pl-2 line-clamp-3',
                  index === activeMatchIndex ? 'text-on-surface' : 'text-on-surface-variant group-hover:text-on-surface'
                ]"
              >
                <span v-if="match.highlighted_text" v-html="`&quot;${match.highlighted_text}&quot;`" />
                <template v-else>"{{ match.text }}"</template>
              </p>
            </div>

            <div v-if="!loading && matches.length === 0" class="text-center py-stack-lg">
              <p class="font-body-md text-body-md text-on-surface-variant">此影片尚未找到關鍵字提及。</p>
            </div>
          </template>

          <!-- Transcript Tab -->
          <template v-else>
            <!-- Search within transcript -->
            <div class="mb-4 sticky top-0 bg-surface z-10 pb-2">
              <div class="flex items-center bg-surface-container-low rounded-lg px-3 py-2 border border-outline-variant/50 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                <span class="material-symbols-outlined text-on-surface-variant text-[20px] mr-2">search</span>
                <input
                  v-model="transcriptSearchQuery"
                  type="text"
                  class="bg-transparent border-none outline-none text-on-surface font-body-md w-full placeholder:text-on-surface-variant focus:ring-0 p-0 text-sm"
                  placeholder="搜尋台詞..."
                />
              </div>
            </div>

            <!-- Grouped Transcript Paragraphs -->
            <div
              v-for="(group, index) in filteredGroups"
              :key="`group-${index}`"
              ref="groupRefs"
              :class="[
                'flex gap-4 p-3 rounded-lg transition-colors group cursor-pointer',
                index === activeGroupIndex
                  ? 'bg-primary-container/10 border-l-2 border-primary -ml-[2px]'
                  : 'hover:bg-surface-variant/30'
              ]"
              @click="selectGroup(index)"
            >
              <span class="text-google-blue font-label-lg text-label-lg shrink-0 mt-0.5 group-hover:underline">
                {{ formatTimestamp(group.start_ms / 1000) }}
              </span>
              <p
                class="text-on-surface font-body-md text-body-md leading-relaxed"
                v-html="highlightText(group.text, transcriptSearchQuery)"
              />
            </div>

            <div v-if="!loading && filteredGroups.length === 0" class="text-center py-stack-lg">
              <p class="font-body-md text-body-md text-on-surface-variant">
                {{ transcriptSearchQuery ? '找不到符合的台詞' : '此影片尚未有完整台詞資料' }}
              </p>
            </div>
          </template>
        </div>

        <!-- Bottom Fade for scroll hint -->
        <div class="h-8 bg-gradient-to-t from-surface to-transparent absolute bottom-0 w-full pointer-events-none" />
      </section>
    </main>

    <AppFooter />
  </div>
</template>
