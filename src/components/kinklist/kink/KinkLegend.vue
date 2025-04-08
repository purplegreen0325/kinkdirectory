<script setup lang="ts">
import type { KinkChoice as KinkChoiceType } from '../../../types'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// Include all choices including "Not Entered" (0)
const choices: KinkChoiceType[] = [0, 1, 2, 3, 4, 5]
</script>

<template>
  <div class="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-2 transition-all duration-200">
    <div class="flex flex-wrap items-center gap-2">
      <!-- Legend Title -->
      <div class="flex items-center gap-1 mr-1">
        <UIcon name="i-lucide-info" class="text-primary-500 flex-shrink-0 text-sm" />
        <span class="text-sm font-medium">{{ t('app.legend') }}:</span>
      </div>

      <!-- Legend Items -->
      <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
        <div
          v-for="choice in choices"
          :key="choice"
          class="flex items-center gap-1 group transition-all duration-200"
        >
          <div
            class="w-3 h-3 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
            :class="{
              'bg-gray-300 dark:bg-gray-600 border border-gray-400 dark:border-gray-500': choice === 0,
              'bg-blue-500 border border-blue-600': choice === 1,
              'bg-green-500 border border-green-600': choice === 2,
              'bg-yellow-500 border border-yellow-600': choice === 3,
              'bg-orange-500 border border-orange-600': choice === 4,
              'bg-red-500 border border-red-600': choice === 5,
            }"
          />
          <span class="text-xs text-gray-700 dark:text-gray-300">
            {{ t(`choices.${choice === 0 ? 'not_entered' : choice === 1 ? 'favorite' : choice === 2 ? 'like' : choice === 3 ? 'indifferent' : choice === 4 ? 'maybe' : 'limit'}`) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
