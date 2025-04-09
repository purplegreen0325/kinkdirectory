<script setup lang="ts">
import type { KinkChoice } from '../../../types'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useKinkListState } from '../../../composables/useKinkList'
import { useSettings } from '../../../composables/useSettings'

const { t } = useI18n()
const { filters, hasActiveFilters, activeFilterCount, clearChoiceFilters, clearAllFilters } = useKinkListState()
const { kinkChoiceOrder } = useSettings()
const popoverOpen = ref(false)

// Custom UI for the checkbox to make the label not bold
const checkboxUi = {
  wrapper: 'ms-2',
  label: 'block font-normal text-(--ui-text) !cursor-pointer',
  base: '!cursor-pointer',
}

// Include empty (0) and choices from settings in correct order
const allChoices = computed<KinkChoice[]>(() => [0, ...kinkChoiceOrder.value])

// Toggle a choice filter
function toggleChoiceFilter(choice: KinkChoice) {
  const index = filters.value.choiceFilters.indexOf(choice)
  if (index === -1) {
    // Add the choice
    filters.value.choiceFilters.push(choice)
  }
  else {
    // Remove the choice
    filters.value.choiceFilters.splice(index, 1)
  }
}

// Handle clear all filters and close dropdown
function handleClearAll() {
  clearAllFilters()
  popoverOpen.value = false
}

// Color classes for the choice dots
const choiceColorClasses = {
  0: 'bg-gray-300 dark:bg-gray-600 border-gray-400 dark:border-gray-500',
  1: 'bg-blue-500 border-blue-600',
  2: 'bg-green-500 border-green-600',
  3: 'bg-yellow-500 border-yellow-600',
  4: 'bg-orange-500 border-orange-600',
  5: 'bg-red-500 border-red-600',
  6: 'bg-purple-500 border-purple-600',
}
</script>

<template>
  <UPopover v-model:open="popoverOpen" :ui="{ content: 'p-3 w-72' }">
    <!-- Trigger button with preserved styling -->
    <button
      type="button"
      class="h-full bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-2 transition-all duration-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center"
      :class="{ 'ring-2 ring-primary-500 dark:ring-primary-400': popoverOpen }"
    >
      <div class="flex items-center gap-1.5">
        <UIcon name="i-lucide-filter" class="text-gray-600 dark:text-gray-400 flex-shrink-0 text-sm" />
        <span class="text-xs font-medium">{{ t('app.filter') }}</span>
        <UBadge v-if="hasActiveFilters" size="sm" color="primary" class="ml-1">
          {{ activeFilterCount }}
        </UBadge>
      </div>
    </button>

    <!-- Popover content -->
    <template #content>
      <div class="space-y-4">
        <div class="text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ t('app.filter_options') }}
        </div>

        <!-- Basic filters -->
        <div class="space-y-2">
          <div class="flex items-center !cursor-pointer">
            <UCheckbox
              v-model="filters.showOnlyNew"
              :label="t('app.only_new_items')"
              :ui="checkboxUi"
            />
          </div>
          <div class="flex items-center !cursor-pointer">
            <UCheckbox
              v-model="filters.showOnlyUnfilled"
              :label="t('app.only_unfilled_items')"
              :ui="checkboxUi"
            />
          </div>
        </div>

        <!-- Choice filters -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <div class="text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ t('app.filter_by_choice') }}
            </div>
            <button
              v-if="filters.choiceFilters.length > 0"
              class="text-xs text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300"
              @click="clearChoiceFilters"
            >
              {{ t('app.clear') }}
            </button>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              v-for="choice in allChoices"
              :key="choice"
              class="p-1 rounded hover:bg-primary-200 dark:hover:bg-primary-700 transition-all duration-200"
              :class="{ 'bg-primary-100 dark:bg-primary-800': filters.choiceFilters.includes(choice) }"
              @click="toggleChoiceFilter(choice)"
            >
              <div
                class="w-5 h-5 rounded-full border flex items-center justify-center"
                :class="[choiceColorClasses[choice], filters.choiceFilters.includes(choice) ? 'opacity-100' : 'opacity-25']"
              />
            </button>
          </div>
        </div>

        <!-- Clear all button -->
        <div v-if="hasActiveFilters" class="pt-2 border-t border-gray-200 dark:border-gray-700">
          <button
            class="w-full py-1.5 px-3 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-all duration-200 text-gray-700 dark:text-gray-300"
            @click="handleClearAll"
          >
            {{ t('app.clear_all_filters') }}
          </button>
        </div>
      </div>
    </template>
  </UPopover>
</template>
