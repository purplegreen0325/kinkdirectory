<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useKinkListState } from '../../../composables/useKinkList'

const { t } = useI18n()
const { filters } = useKinkListState()
const popoverOpen = ref(false)

// Custom UI for the checkbox to make the label not bold
const checkboxUi = {
  wrapper: 'ms-2',
  label: 'block font-normal text-(--ui-text) !cursor-pointer',
  base: '!cursor-pointer',
}
</script>

<template>
  <UPopover v-model:open="popoverOpen" :ui="{ content: 'p-3 w-64' }">
    <!-- Trigger button with preserved styling -->
    <button
      type="button"
      class="h-full bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-2 transition-all duration-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center"
      :class="{ 'ring-2 ring-primary-500 dark:ring-primary-400': popoverOpen }"
    >
      <div class="flex items-center gap-1.5">
        <UIcon name="i-lucide-filter" class="text-gray-600 dark:text-gray-400 flex-shrink-0 text-sm" />
        <span class="text-sm font-medium">{{ t('app.filter') }}</span>
        <UBadge v-if="filters.showOnlyNew" size="sm" color="primary" class="ml-1">
          1
        </UBadge>
      </div>
    </button>

    <!-- Popover content -->
    <template #content>
      <div class="space-y-4">
        <div class="text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ t('app.filter_options') }}
        </div>
        <div class="space-y-2">
          <div class="flex items-center !cursor-pointer">
          <UCheckbox
            v-model="filters.showOnlyNew"
            :label="t('app.only_new_items')"
            :ui="checkboxUi"
          />
        </div>
        </div>
      </div>
    </template>
  </UPopover>
</template>
