<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-3 px-3 sm:px-4 mt-auto">
    <div class="w-full flex justify-between items-center flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400">
      <div>
        © {{ currentYear }} {{ t('title') }}
      </div>
      <div>
        <a
          href="https://github.com/kdirectoryxo/kinkdirectory"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center hover:text-primary-500 transition-colors"
        >
          <span class="mr-1">GitHub</span>
          <UIcon name="i-lucide-github" class="w-4 h-4" />
        </a>
      </div>
    </div>
  </footer>
</template>
