<script setup>
const links = [
  { label: '隱私權', href: '#' },
  { label: '條款', href: '#' },
  { label: '網站地圖', href: '#' }
]
</script>

<template>
  <footer
    class="flex flex-col sm:flex-row justify-between items-center gap-stack-sm w-full px-margin-mobile md:px-margin-desktop py-stack-md mt-auto bottom-0 bg-surface-container-lowest dark:bg-inverse-surface border-t border-outline-variant"
  >
    <div class="font-body-md text-body-md font-bold text-primary dark:text-inverse-primary text-center sm:text-left">
      © 2026 YouIndexer. 保留所有權利。
    </div>
    <div class="flex gap-4">
      <a
        v-for="link in links"
        :key="link.label"
        :href="link.href"
        class="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors opacity-100 hover:opacity-80"
      >
        {{ link.label }}
      </a>
    </div>
  </footer>
</template>
