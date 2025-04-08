<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useKinkListState } from '../../../composables/useKinkList'
import SettingsButton from '../ui/SettingsButton.vue'

const { t } = useI18n()
const { isViewMode, exitViewMode, activeListId } = useKinkListState()

function handleTitleClick() {
  isViewMode.value ? exitViewMode() : (activeListId.value = null)
}
</script>

<template>
  <div>
    <!-- Header with title and theme toggles -->
    <div class="flex items-center justify-center sm:justify-between flex-wrap gap-2">
      <h1
        class="flex items-center text-xl font-bold cursor-pointer transition-all hover:opacity-90"
        @click="handleTitleClick"
      >
        <span class="text-primary-500 mr-1">✨</span>
        <span class="bg-gradient-to-r from-primary-500 to-primary-400 bg-clip-text text-transparent">{{ t('title') }}</span>
      </h1>

      <div class="flex items-center gap-2 flex-wrap justify-center">
        <SettingsButton />
        <LanguageSwitcher />
        <DarkModeToggle />
      </div>
    </div>
  </div>
</template>
