<script>
export default {
  name: 'SearchResultsView'
}
</script>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import PlatformSideNav from '@/components/PlatformSideNav.vue'
import SearchTaskResults from '@/components/SearchTaskResults.vue'
import TopNavBar from '@/components/TopNavBar.vue'

const route = useRoute()
const router = useRouter()
const query = computed(() => {
  const value = route.query.q
  return Array.isArray(value) ? value[0] : value || ''
})

function handleHeaderSearch(value) {
  router.push({ name: 'search-results', query: { q: value } })
}
</script>

<template>
  <div class="h-screen overflow-hidden flex flex-col bg-surface text-on-surface font-body-lg">
    <TopNavBar :show-search="true" :search-query="query" @search="handleHeaderSearch" />
    <div class="flex flex-1 min-h-0 overflow-hidden">
      <PlatformSideNav />
      <main class="flex-1 min-h-0 overflow-y-auto bg-surface-container-low">
        <SearchTaskResults />
      </main>
    </div>
  </div>
</template>
