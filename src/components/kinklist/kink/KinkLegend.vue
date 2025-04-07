<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { KinkChoice as KinkChoiceType } from '../../../types';

const { t } = useI18n()

// Include all choices including "Not Entered" (0)
const choices: KinkChoiceType[] = [0, 1, 2, 3, 4, 5]

const getIconForChoice = (choice: KinkChoiceType) => {
  switch(choice) {
    case 0: return 'i-lucide-circle-dashed'
    case 1: return 'i-lucide-heart'
    case 2: return 'i-lucide-thumbs-up'
    case 3: return 'i-lucide-minus'
    case 4: return 'i-lucide-help-circle'
    case 5: return 'i-lucide-x-circle'
    default: return 'i-lucide-circle'
  }
}
</script>

<template>
  <div class="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-2 mb-3 transition-all duration-200">
    <div class="flex items-center flex-wrap gap-3">
      <!-- Legend Title -->
      <div class="flex items-center gap-1.5 mr-1">
        <UIcon name="i-lucide-info" class="text-primary-500 flex-shrink-0 text-sm" />
        <span class="text-sm font-medium">{{ t('app.legend') }}:</span>
      </div>
      
      <!-- Legend Items -->
      <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <div 
          v-for="choice in choices" 
          :key="choice" 
          class="flex items-center gap-1.5 group transition-all duration-200"
        >
          <div 
            class="w-3 h-3 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
            :class="{
              'bg-gray-300 dark:bg-gray-600 border border-gray-400 dark:border-gray-500': choice === 0,
              'bg-blue-500 border border-blue-600': choice === 1,
              'bg-green-500 border border-green-600': choice === 2,
              'bg-yellow-500 border border-yellow-600': choice === 3,
              'bg-orange-500 border border-orange-600': choice === 4,
              'bg-red-500 border border-red-600': choice === 5
            }"
          ></div>
          <span class="text-xs text-gray-700 dark:text-gray-300">
            {{ t(`choices.${choice === 0 ? 'not_entered' : choice === 1 ? 'favorite' : choice === 2 ? 'like' : choice === 3 ? 'indifferent' : choice === 4 ? 'maybe' : 'limit'}`) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template> 