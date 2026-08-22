<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <router-view v-slot="{ Component }">
    <KeepAlive include="SearchResultsView">
      <component :is="Component" />
    </KeepAlive>
  </router-view>
</template>
