<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { getDisplayValue } from '../../../composables/kink.helpers'
import { useSettings } from '../../../composables/useSettings'

defineProps<{
  openQuizModal: () => void
}>()

const { t } = useI18n()
const { kinkChoiceOrder, settings } = useSettings()

// Remove the recentlyAddedKinks from here
</script>

<template>
  <div class="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-2 transition-all duration-200 md:h-full md:flex md:items-center">
    <div class="flex flex-wrap items-center justify-between gap-2 w-full">
      <div class="flex flex-wrap items-center gap-2">
        <!-- Legend Title -->
        <div class="flex items-center gap-1 mr-1">
          <UIcon name="i-lucide-info" class="text-primary-500 flex-shrink-0 text-sm" />
          <span class="text-sm font-medium">{{ t('app.legend') }}:</span>
        </div>

        <!-- Legend Items -->
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
          <!-- Always show "Not Entered" (0) first -->
          <div
            :key="0"
            class="flex items-center gap-1 group transition-all duration-200"
          >
            <div
              class="w-3 h-3 rounded-full inline-flex items-center justify-center transition-transform duration-200 group-hover:scale-110 bg-gray-300 dark:bg-gray-600 border border-gray-400 dark:border-gray-500"
            >
              <span v-if="settings.showNumbersInChoices" class="text-[8px] font-bold text-white dark:text-gray-900">0</span>
            </div>
            <span class="text-xs text-gray-700 dark:text-gray-300">
              {{ t('choices.not_entered') }}
            </span>
          </div>

          <!-- Then show other choices in order from settings -->
          <div
            v-for="choice in kinkChoiceOrder"
            :key="choice"
            class="flex items-center gap-1 group transition-all duration-200"
          >
            <div
              class="w-3 h-3 rounded-full inline-flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
              :class="{
                'bg-blue-500 border border-blue-600': choice === 1,
                'bg-green-500 border border-green-600': choice === 2,
                'bg-yellow-500 border border-yellow-600': choice === 3,
                'bg-orange-500 border border-orange-600': choice === 4,
                'bg-red-500 border border-red-600': choice === 5,
                'bg-purple-500 border border-purple-600': choice === 6,
              }"
            >
              <span v-if="settings.showNumbersInChoices" class="text-[8px] font-bold text-white">{{ getDisplayValue(choice) }}</span>
            </div>
            <span class="text-xs text-gray-700 dark:text-gray-300">
              {{ t(`choices.${choice === 1 ? 'favorite' : choice === 2 ? 'like' : choice === 3 ? 'indifferent' : choice === 4 ? 'maybe' : choice === 5 ? 'limit' : 'curious'}`) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Remove the Newly Added Kinks Counter -->
    </div>
  </div>
</template>
