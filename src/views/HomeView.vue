<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppFooter from '@/components/AppFooter.vue'
import LogoHero from '@/components/LogoHero.vue'
import PlatformSideNav from '@/components/PlatformSideNav.vue'
import SearchActions from '@/components/SearchActions.vue'
import SearchBar from '@/components/SearchBar.vue'
import SearchTaskResults from '@/components/SearchTaskResults.vue'
import TopNavBar from '@/components/TopNavBar.vue'
import TrendingAnalysis from '@/components/TrendingAnalysis.vue'
import { isLoggedIn } from '@/stores/auth.js'

const route = useRoute()
const router = useRouter()

const selectedTaskId = computed(() => {
  const value = route.query.task_id
  return Array.isArray(value) ? value[0] : value || ''
})

const selectedQuery = computed(() => {
  const value = route.query.q
  return Array.isArray(value) ? value[0] : value || ''
})

function goToResults(query) {
  router.push({ name: 'search-results', query: { q: query } })
}

function handleTagSelect(label) {
  goToResults(label)
}
</script>

<template>
  <div class="h-screen overflow-hidden flex flex-col">
    <TopNavBar
      :show-search="Boolean(selectedTaskId)"
      :search-query="selectedQuery"
      @search="goToResults"
    />

    <div class="flex flex-1 min-h-0 overflow-hidden">
      <PlatformSideNav v-if="isLoggedIn" />

      <main class="flex flex-col flex-1 min-h-0 overflow-y-auto bg-surface">
        <SearchTaskResults v-if="selectedTaskId" />
        <div
          v-else
          class="flex-1 flex flex-col items-center justify-center px-margin-mobile md:px-margin-desktop py-12 md:py-24 max-w-[1280px] mx-auto w-full"
        >
          <LogoHero />
          <div class="w-full max-w-[680px] mb-stack-md">
            <SearchBar @search="goToResults" />
          </div>
          <SearchActions @action="goToResults" />
          <TrendingAnalysis @select="handleTagSelect" />
        </div>
        <AppFooter />
      </main>
    </div>
  </div>
</template>
