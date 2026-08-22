<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { currentUser, isLoggedIn, logout } from '@/stores/auth.js'
import logoUrl from '../assets/logo.png'

const props = defineProps({
  showSearch: {
    type: Boolean,
    default: false
  },
  searchQuery: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['search'])
const router = useRouter()

const navItems = [
  { label: '控制台', href: '#', active: true },
  { label: '數據分析', href: '#', active: false },
  { label: '深度洞察', href: '#', active: false }
]

const iconButtons = [
  { icon: 'notifications', label: 'Notifications' },
  { icon: 'settings', label: 'Settings' }
]

const mobileMenuOpen = ref(false)
const searchText = ref(props.searchQuery)
const userMenuOpen = ref(false)

watch(
  () => props.searchQuery,
  (value) => {
    searchText.value = value
  }
)

const displayName = computed(() => currentUser.value?.display_name || currentUser.value?.email || '')
const initials = computed(() => {
  const name = displayName.value
  if (!name) return ''
  return name.slice(0, 2).toUpperCase()
})

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

function handleSearchSubmit() {
  const trimmed = searchText.value.trim()
  if (trimmed) {
    emit('search', trimmed)
  }
}

function goToLogin() {
  router.push({ name: 'login' })
}

function handleLogout() {
  logout()
  userMenuOpen.value = false
  router.push({ name: 'home' })
}
</script>

<template>
  <header class="w-full bg-surface dark:bg-inverse-surface border-b border-outline-variant dark:border-outline shadow-sm z-50">
    <div
      class="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop h-16"
    >
      <div class="flex items-center gap-4 md:gap-6">
        <router-link to="/" class="flex items-center" aria-label="回到首頁">
          <img :src="logoUrl" alt="YouIndexer" class="h-9 w-auto object-contain" />
        </router-link>
        <nav class="hidden md:flex gap-6">
          <a
            v-for="item in navItems"
            :key="item.label"
            :href="item.href"
            :class="[
              'font-body-md text-body-md pb-1 transition-colors cursor-pointer active:opacity-80 transition-opacity',
              item.active
                ? 'text-primary font-bold border-b-2 border-primary'
                : 'text-on-surface-variant dark:text-surface-variant hover:bg-surface-container dark:hover:bg-surface-container-highest'
            ]"
          >
            {{ item.label }}
          </a>
        </nav>
      </div>

      <div class="flex items-center gap-2 md:gap-4">
        <!-- Header Search -->
        <form
          v-if="showSearch"
          class="hidden md:flex items-center bg-surface-container rounded-full px-4 py-2"
          @submit.prevent="handleSearchSubmit"
        >
          <span class="material-symbols-outlined text-on-surface-variant mr-2 text-[20px]">search</span>
          <input
            v-model="searchText"
            type="text"
            class="bg-transparent border-none focus:ring-0 text-body-md font-body-md text-on-surface p-0 w-48 outline-none"
            placeholder="搜尋提及內容..."
          />
        </form>

        <a
          href="#"
          class="font-body-md text-body-md text-primary dark:text-inverse-primary hover:bg-surface-container dark:hover:bg-surface-container-highest transition-colors cursor-pointer active:opacity-80 transition-opacity hidden md:block"
        >
          說明
        </a>
        <div class="flex gap-1 md:gap-2">
          <button
            v-for="btn in iconButtons"
            :key="btn.icon"
            :aria-label="btn.label"
            class="p-2 rounded-full hover:bg-surface-container transition-colors text-primary dark:text-inverse-primary"
          >
            <span class="material-symbols-outlined">{{ btn.icon }}</span>
          </button>
        </div>

        <!-- Login / User -->
        <div v-if="!isLoggedIn" class="hidden md:flex items-center gap-2">
          <button
            type="button"
            class="font-body-md text-body-md text-primary dark:text-inverse-primary hover:bg-surface-container dark:hover:bg-surface-container-highest transition-colors cursor-pointer active:opacity-80 transition-opacity px-3 py-2 rounded-full"
            @click="goToLogin"
          >
            登入
          </button>
        </div>

        <div v-else class="relative hidden md:block">
          <button
            type="button"
            class="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-surface-container transition-colors"
            @click="userMenuOpen = !userMenuOpen"
          >
            <div
              class="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-md text-label-md"
            >
              {{ initials || 'U' }}
            </div>
            <span class="font-body-md text-body-md text-on-surface max-w-[120px] truncate">
              {{ displayName || '使用者' }}
            </span>
            <span class="material-symbols-outlined text-on-surface-variant">expand_more</span>
          </button>

          <div
            v-if="userMenuOpen"
            class="absolute right-0 mt-2 w-48 rounded-2xl bg-surface-container border border-outline-variant shadow-lg py-2 z-50"
          >
            <button
              type="button"
              class="w-full flex items-center gap-2 text-left px-4 py-2 font-body-md text-body-md text-on-surface hover:bg-surface-container-high transition-colors"
              @click="handleLogout"
            >
              <span class="material-symbols-outlined text-[20px]">logout</span>
              登出
            </button>
          </div>
        </div>

        <button
          type="button"
          aria-label="Open menu"
          class="md:hidden p-2 rounded-full hover:bg-surface-container transition-colors text-primary dark:text-inverse-primary"
          @click="toggleMobileMenu"
        >
          <span class="material-symbols-outlined">menu</span>
        </button>
      </div>
    </div>
  </header>

  <!-- Mobile menu -->
  <nav
    v-if="mobileMenuOpen"
    class="md:hidden w-full bg-surface dark:bg-inverse-surface border-b border-outline-variant"
  >
    <div class="flex flex-col gap-2 px-margin-mobile py-stack-sm max-w-[1280px] mx-auto">
      <a
        v-for="item in navItems"
        :key="item.label"
        :href="item.href"
        :class="[
          'font-body-md text-body-md py-2 px-3 rounded-lg transition-colors',
          item.active
            ? 'text-primary font-bold bg-surface-container dark:bg-surface-container-highest'
            : 'text-on-surface-variant dark:text-surface-variant hover:bg-surface-container dark:hover:bg-surface-container-highest'
        ]"
      >
        {{ item.label }}
      </a>
      <a
        href="#"
        class="font-body-md text-body-md text-primary dark:text-inverse-primary py-2 px-3 rounded-lg hover:bg-surface-container dark:hover:bg-surface-container-highest transition-colors"
      >
        說明
      </a>
      <button
        v-if="!isLoggedIn"
        type="button"
        class="text-left font-body-md text-body-md text-primary dark:text-inverse-primary py-2 px-3 rounded-lg hover:bg-surface-container dark:hover:bg-surface-container-highest transition-colors"
        @click="goToLogin"
      >
        登入
      </button>
      <button
        v-else
        type="button"
        class="flex items-center gap-2 text-left font-body-md text-body-md text-on-surface py-2 px-3 rounded-lg hover:bg-surface-container dark:hover:bg-surface-container-highest transition-colors"
        @click="handleLogout"
      >
        <span class="material-symbols-outlined text-[20px]">logout</span>
        登出 ({{ displayName || '使用者' }})
      </button>
    </div>
  </nav>
</template>
