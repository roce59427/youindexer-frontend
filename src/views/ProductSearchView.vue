<script setup>
import { computed, ref } from 'vue'

import AppFooter from '@/components/AppFooter.vue'
import TopNavBar from '@/components/TopNavBar.vue'

const SOURCE_META = {
  youtube: { label: 'YouTube', icon: 'play_circle', color: 'text-google-red' },
  instagram: { label: 'Instagram', icon: 'photo_camera', color: 'text-pink-500' },
  threads: { label: 'Threads', icon: 'alternate_email', color: 'text-on-surface' }
}

// 雛型展示用的假資料，尚未接後端（跨來源統一搜尋／AI 摘要皆待 YOUINDEXER-23／24）。
const DEMO_MENTIONS = [
  {
    source: 'youtube',
    author: '美妝頻道 A',
    snippet: '這款粉底液的持妝表現在悶熱天氣下依然穩定，遮瑕力適中，敏感肌使用起來也算溫和。',
    timestamp: '12:45',
    sentiment: 'positive'
  },
  {
    source: 'instagram',
    author: '@makeup_daily_tw',
    snippet: '囤貨清單新成員，質地偏濕潤，比較適合秋冬季節，夏天可能會需要搭配定妝噴霧。',
    sentiment: 'neutral'
  },
  {
    source: 'threads',
    author: '@skincare_note',
    snippet: '價格比同類產品高一截，但持妝時間換算下來 CP 值還算合理，回購中。',
    sentiment: 'positive'
  },
  {
    source: 'youtube',
    author: '生活好物開箱',
    snippet: '色號選擇不算多，亞洲膚色可能要多花點時間試色，建議先索取試用包。',
    timestamp: '03:20',
    sentiment: 'warning'
  }
]

const DEMO_SUMMARY = [
  {
    icon: 'check_circle',
    color: 'text-google-green',
    text: '多數來源肯定持妝力與遮瑕表現，敏感肌接受度也偏高。'
  },
  {
    icon: 'warning',
    color: 'text-google-yellow',
    text: '色號選擇偏少、定價偏高是重複被提到的兩個保留意見。'
  },
  {
    icon: 'info',
    color: 'text-google-blue',
    text: '質地偏濕潤，較適合秋冬；夏天使用者建議搭配定妝產品。'
  }
]

const query = ref('')
const hasSearched = ref(false)

const mentionCountBySource = computed(() => {
  const counts = { youtube: 0, instagram: 0, threads: 0 }
  for (const mention of DEMO_MENTIONS) counts[mention.source] += 1
  return counts
})

function handleSearch() {
  if (!query.value.trim()) return
  hasSearched.value = true
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-surface text-on-surface font-body-lg">
    <TopNavBar />

    <main class="flex-grow max-w-[960px] mx-auto w-full px-margin-mobile md:px-margin-desktop py-stack-lg">
      <h1 class="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">
        搜尋產品，看所有來源怎麼說
      </h1>
      <p class="font-body-md text-body-md text-on-surface-variant mb-stack-lg">
        跨 YouTube／Instagram／Threads 找出提及這個產品的內容，並自動整理成一段摘要。
      </p>

      <form class="flex gap-2 mb-stack-lg" @submit.prevent="handleSearch">
        <div class="flex-1 flex items-center bg-surface-container-low rounded-full px-4 py-2 border border-outline-variant focus-within:border-primary">
          <span class="material-symbols-outlined text-on-surface-variant mr-2 text-[20px]">search</span>
          <input
            v-model="query"
            type="text"
            placeholder="搜尋產品名稱，例如：Maybelline 睫毛膏"
            class="bg-transparent border-none focus:ring-0 text-body-md font-body-md text-on-surface p-0 w-full outline-none"
          />
        </div>
        <button
          type="submit"
          class="px-6 py-2 rounded-full bg-primary text-on-primary font-label-lg text-label-lg hover:opacity-90 transition-opacity"
        >
          搜尋
        </button>
      </form>

      <template v-if="hasSearched">
        <!-- AI Summary -->
        <section class="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm mb-stack-lg">
          <h2 class="font-title-lg text-title-lg text-on-surface mb-4 flex items-center gap-2">
            <span class="material-symbols-outlined text-google-blue">auto_awesome</span>
            AI 綜合摘要
          </h2>
          <ul class="flex flex-col gap-3">
            <li v-for="(point, index) in DEMO_SUMMARY" :key="index" class="flex gap-3 items-start">
              <span class="material-symbols-outlined text-[20px] mt-0.5" :class="point.color">{{ point.icon }}</span>
              <span class="font-body-md text-body-md text-on-surface">{{ point.text }}</span>
            </li>
          </ul>
          <p class="font-label-sm text-label-sm text-on-surface-variant mt-4">
            * 示意資料，AI 摘要功能尚未實作（YOUINDEXER-24）。
          </p>
        </section>

        <!-- Source breakdown -->
        <div class="flex gap-3 mb-stack-md">
          <span
            v-for="(count, source) in mentionCountBySource"
            :key="source"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low text-on-surface-variant font-label-lg text-label-lg"
          >
            <span class="material-symbols-outlined text-[16px]" :class="SOURCE_META[source].color">
              {{ SOURCE_META[source].icon }}
            </span>
            {{ SOURCE_META[source].label }} {{ count }}
          </span>
        </div>

        <!-- Mentions list -->
        <section class="flex flex-col gap-3">
          <article
            v-for="(mention, index) in DEMO_MENTIONS"
            :key="index"
            class="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant">
                <span class="material-symbols-outlined text-[16px]" :class="SOURCE_META[mention.source].color">
                  {{ SOURCE_META[mention.source].icon }}
                </span>
                {{ SOURCE_META[mention.source].label }} · {{ mention.author }}
              </span>
              <span v-if="mention.timestamp" class="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                <span class="material-symbols-outlined text-[14px]">schedule</span>
                {{ mention.timestamp }}
              </span>
            </div>
            <p class="font-body-md text-body-md text-on-surface">"{{ mention.snippet }}"</p>
          </article>
        </section>

        <p class="font-label-sm text-label-sm text-on-surface-variant mt-stack-md text-center">
          * 以上為雛型示意資料。真實資料僅 YouTube 可搜尋；Instagram／Threads 尚未可搜尋（YOUINDEXER-22），跨來源合併搜尋尚未實作（YOUINDEXER-23）。
        </p>
      </template>
    </main>

    <AppFooter />
  </div>
</template>
