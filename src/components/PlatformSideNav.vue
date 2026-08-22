<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import {
  deleteSearchHistoryItem,
  fetchSearchHistory,
  streamSearchHistoryEvents
} from '@/api/auth.js'
import { currentUser, ensureValidAccessToken, isLoggedIn } from '@/stores/auth.js'

const router = useRouter()

const history = ref([])
const loading = ref(false)
const error = ref('')
const cleanupHistorySSE = ref(null)
const openMenuTaskId = ref(null)
const deletingTaskId = ref(null)

const displayName = computed(() => currentUser.value?.display_name || currentUser.value?.email || '')

async function loadHistory() {
  if (!isLoggedIn.value) return
  cleanupHistorySSE.value?.()
  cleanupHistorySSE.value = null
  loading.value = true
  error.value = ''
  try {
    const token = await ensureValidAccessToken()
    const initial = await fetchSearchHistory(token, { limit: 20, offset: 0 })
    history.value = initial.items || []
    loading.value = false
    cleanupHistorySSE.value = streamSearchHistoryEvents(token, {
      onSnapshot: (data) => {
        history.value = data.items || []
        loading.value = false
      },
      onUpdate: (data) => {
        history.value = data.items || []
        loading.value = false
      },
      onError: (detail) => {
        error.value = detail || '歷史紀錄即時更新中斷'
        loading.value = false
      }
    })
  } catch (err) {
    error.value = err.message || '無法載入歷史紀錄'
    loading.value = false
  }
}

function goToLogin() {
  router.push({ name: 'login' })
}

function goToResult(taskId) {
  const item = history.value.find((h) => h.task_id === taskId)
  if (item) {
    router.push({
      name: 'home',
      query: { task_id: item.task_id, q: item.query }
    })
  }
}

function toggleMenu(taskId) {
  openMenuTaskId.value = openMenuTaskId.value === taskId ? null : taskId
}

async function deleteResult(item) {
  if (!window.confirm(`確定要刪除「${item.query}」的搜尋結果嗎？`)) return

  deletingTaskId.value = item.task_id
  error.value = ''
  try {
    const token = await ensureValidAccessToken()
    await deleteSearchHistoryItem(token, item.task_id)
    history.value = history.value.filter((entry) => entry.task_id !== item.task_id)
    openMenuTaskId.value = null
    if (router.currentRoute.value.query.task_id === item.task_id) {
      await router.push({ name: 'home' })
    }
  } catch (err) {
    error.value = err.message || '無法刪除搜尋紀錄'
  } finally {
    deletingTaskId.value = null
  }
}

function formatDate(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function statusLabel(status) {
  return {
    processing: '處理中',
    completed: '已完成',
    failed: '失敗'
  }[status] || status
}

function statusClass(status) {
  return {
    processing: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
    completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'
  }[status] || 'bg-surface-container-high text-on-surface-variant'
}

onMounted(loadHistory)

onUnmounted(() => {
  cleanupHistorySSE.value?.()
  cleanupHistorySSE.value = null
})
</script>

<template>
  <aside
    class="bg-surface-container-low dark:bg-inverse-surface h-full min-h-0 max-h-full overflow-y-auto w-64 border-r border-outline-variant shrink-0 hidden md:flex flex-col z-40"
  >
    <div class="flex flex-col gap-unit py-stack-md w-64 min-h-full">
      <div class="px-6 mb-2">
        <h2 class="font-title-md text-title-md font-semibold text-on-surface">歷史紀錄</h2>
        <p class="font-body-md text-body-md text-on-surface-variant mt-1">
          您最近建立的搜尋任務
        </p>
      </div>

      <!-- Anonymous state -->
      <div
        v-if="!isLoggedIn"
        class="mx-6 p-5 rounded-3xl bg-surface-container text-on-surface-variant text-center"
      >
        <span class="material-symbols-outlined text-4xl mb-2">history</span>
        <p class="font-body-md text-body-md">
          登入後可查看歷史紀錄
        </p>
        <button
          type="button"
          class="mt-4 w-full flex justify-center items-center gap-2 bg-primary text-on-primary font-label-lg text-label-lg px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
          @click="goToLogin"
        >
          登入
        </button>
      </div>

      <!-- Authenticated state -->
      <template v-else>
        <div class="px-6 mb-2">
          <div class="flex items-center gap-2 text-on-surface font-body-md text-body-md">
            <span class="material-symbols-outlined">account_circle</span>
            <span class="truncate">{{ displayName }}</span>
          </div>
        </div>

        <div v-if="loading" class="px-6 py-4 text-on-surface-variant font-body-md text-body-md">
          載入中...
        </div>

        <div
          v-else-if="error && !history.length"
          class="mx-6 p-4 rounded-2xl bg-error-container text-on-error-container font-body-md text-body-md"
        >
          {{ error }}
        </div>

        <div
          v-if="error && history.length"
          class="mx-6 mb-2 px-3 py-2 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 font-body-sm text-body-sm"
        >
          歷史紀錄即時更新中斷，已顯示最近資料
        </div>

        <nav v-if="history.length" class="flex-1 flex flex-col gap-1 overflow-y-auto">
          <div
            v-for="item in history"
            :key="item.task_id"
            class="relative flex flex-col gap-1 rounded-[20px] px-4 py-3 mx-2 text-on-surface hover:bg-surface-container-high transition-all scale-95 active:scale-100 transition-transform font-body-md text-body-md cursor-pointer"
            role="button"
            tabindex="0"
            @click="goToResult(item.task_id)"
            @keydown.enter="goToResult(item.task_id)"
          >
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-on-surface-variant">search</span>
              <span class="truncate font-medium pr-5">{{ item.query }}</span>
              <button
                type="button"
                :aria-label="`開啟 ${item.query} 選單`"
                class="absolute top-3 right-3 rounded-full p-1 text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface"
                @click.stop="toggleMenu(item.task_id)"
              >
                <span class="material-symbols-outlined text-[20px]">more_vert</span>
              </button>
            </div>
            <div class="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
              <span
                class="inline-flex items-center rounded-full px-2.5 py-1 font-label-sm text-label-sm font-medium"
                :class="statusClass(item.status)"
              >
                {{ statusLabel(item.status) }}
              </span>
              <span>{{ formatDate(item.created_at) }}</span>
            </div>
            <div
              v-if="openMenuTaskId === item.task_id"
              class="absolute right-3 top-10 z-50 min-w-28 rounded-xl border border-outline-variant bg-surface-container-lowest py-1 shadow-lg"
              @click.stop
            >
              <button
                type="button"
                class="flex w-full items-center gap-2 px-3 py-2 text-left font-body-md text-body-md text-error hover:bg-error-container disabled:opacity-50"
                :disabled="deletingTaskId === item.task_id"
                @click="deleteResult(item)"
              >
                <span class="material-symbols-outlined text-[18px]">delete</span>
                {{ deletingTaskId === item.task_id ? '刪除中...' : '刪除' }}
              </button>
            </div>
          </div>
        </nav>

        <div v-else-if="!error" class="px-6 py-4 text-on-surface-variant font-body-md text-body-md">
          尚無搜尋紀錄
        </div>
      </template>

    </div>
  </aside>
</template>
