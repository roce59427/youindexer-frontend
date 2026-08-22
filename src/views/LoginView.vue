<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { handleGoogleCallback, loginWithGoogle } from '@/stores/auth.js'
import logoUrl from '../assets/logo.png'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const error = ref('')

async function startGoogleLogin() {
  try {
    loading.value = true
    await loginWithGoogle()
  } catch (err) {
    error.value = err.message || '無法啟動 Google 登入'
    loading.value = false
  }
}

onMounted(async () => {
  const code = route.query.code
  if (code && typeof code === 'string') {
    loading.value = true
    try {
      const redirectUri = `${window.location.origin}/login`
      await handleGoogleCallback(code, redirectUri)
      router.replace({ name: 'home' })
    } catch (err) {
      error.value = err.message || 'Google 登入失敗'
    } finally {
      loading.value = false
    }
  }
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-surface text-on-surface">
    <header class="w-full border-b border-outline-variant px-6 h-16 flex items-center">
      <router-link to="/" class="flex items-center" aria-label="回到首頁">
        <img :src="logoUrl" alt="YouIndexer" class="h-9 w-auto object-contain" />
      </router-link>
    </header>

    <main class="flex-1 flex items-center justify-center px-6 py-12">
      <div
        class="w-full max-w-md p-8 md:p-10 rounded-[32px] border border-outline-variant bg-surface-container-low shadow-sm"
      >
        <div class="text-center mb-8">
          <img :src="logoUrl" alt="YouIndexer" class="h-12 w-auto object-contain mx-auto mb-4" />
          <h1 class="font-headline-md text-headline-md text-on-surface mb-2">登入 YouIndexer</h1>
          <p class="font-body-md text-body-md text-on-surface-variant">
            登入後可儲存搜尋歷史紀錄並在任何裝置上繼續追蹤。
          </p>
        </div>

        <div
          v-if="error"
          class="mb-6 p-4 rounded-2xl bg-error-container text-on-error-container font-body-md text-body-md"
        >
          {{ error }}
        </div>

        <button
          type="button"
          class="w-full flex items-center justify-center gap-3 rounded-full border border-outline bg-surface px-6 py-3 font-label-lg text-label-lg text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          :disabled="loading"
          @click="startGoogleLogin"
        >
          <svg class="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {{ loading ? '登入中...' : '使用 Google 帳號登入' }}
        </button>

        <p class="mt-6 text-center font-body-md text-body-md text-on-surface-variant">
          尚未擁有帳號？
          <button
            type="button"
            class="text-primary hover:underline font-medium"
            @click="startGoogleLogin"
          >
            立即註冊
          </button>
        </p>
      </div>
    </main>
  </div>
</template>
