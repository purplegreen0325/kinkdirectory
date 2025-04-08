<script setup lang="ts">
import type { KinkChoice as KinkChoiceType } from '../../../types'
import { useKinkListState } from '../../../composables/useKinkList'
import { useSettings } from '../../../composables/useSettings'
import KinkChoiceDrawer from './KinkChoiceDrawer.vue'

const props = defineProps<{
  value: KinkChoiceType
  onClick?: (value: KinkChoiceType) => void
  kinkName?: string
  tooltip?: string
}>()

const { isViewMode } = useKinkListState()
const { kinkChoiceOrder, settings } = useSettings()

// Active color classes (selected)
const activeColorClasses = {
  0: 'border-gray-400 dark:border-gray-500 bg-gray-300 dark:bg-gray-600',
  1: 'border-blue-500 dark:border-blue-400 bg-blue-500 dark:bg-blue-400',
  2: 'border-green-500 dark:border-green-400 bg-green-500 dark:bg-green-400',
  3: 'border-yellow-500 dark:border-yellow-400 bg-yellow-500 dark:bg-yellow-400',
  4: 'border-orange-500 dark:border-orange-400 bg-orange-500 dark:bg-orange-400',
  5: 'border-red-500 dark:border-red-400 bg-red-500 dark:bg-red-400',
}

// Subtle color classes for inactive state (very light background)
const subtleColorClasses = {
  0: 'border-gray-300 dark:border-gray-600 bg-gray-100/30 dark:bg-gray-800/20',
  1: 'border-blue-200 dark:border-blue-700 bg-blue-100/30 dark:bg-blue-900/20',
  2: 'border-green-200 dark:border-green-700 bg-green-100/30 dark:bg-green-900/20',
  3: 'border-yellow-200 dark:border-yellow-700 bg-yellow-100/30 dark:bg-yellow-900/20',
  4: 'border-orange-200 dark:border-orange-700 bg-orange-100/30 dark:bg-orange-900/20',
  5: 'border-red-200 dark:border-red-700 bg-red-100/30 dark:bg-red-900/20',
}

// Handle click for desktop version
function handleClick(rating: KinkChoiceType) {
  if (!isViewMode.value && props.onClick) {
    props.onClick(rating)
  }
}
</script>

<template>
  <!-- Desktop version - circles in a row -->
  <div class="hidden lg:flex space-x-1">
    <!-- Always show "Not Entered" (0) first -->
    <button
      type="button"
      class="w-4 h-4 rounded-full border focus:outline-none relative inline-flex items-center justify-center"
      :class="[
        value === 0 ? activeColorClasses[0] : subtleColorClasses[0],
        !isViewMode ? 'cursor-pointer' : 'cursor-not-allowed opacity-90',
      ]"
      data-rating="0"
      @click.stop="handleClick(0)"
    >
      <span
        v-if="settings.showNumbersInChoices"
        class="text-[8px] font-bold"
        :class="value === 0
          ? 'text-white dark:text-gray-900'
          : 'text-gray-700 dark:text-gray-300'"
      >
        0
      </span>
    </button>

    <!-- Show other ratings in order based on settings -->
    <template v-for="rating in kinkChoiceOrder" :key="rating">
      <button
        type="button"
        class="w-4 h-4 rounded-full border focus:outline-none relative inline-flex items-center justify-center"
        :class="[
          value === rating ? activeColorClasses[rating] : subtleColorClasses[rating],
          !isViewMode ? 'cursor-pointer' : 'cursor-not-allowed opacity-90',
        ]"
        :data-rating="rating"
        @click.stop="handleClick(rating)"
      >
        <span
          v-if="settings.showNumbersInChoices"
          class="text-[8px] font-bold"
          :class="value === rating
            ? 'text-white'
            : 'text-gray-700 dark:text-gray-300'"
        >
          {{ rating }}
        </span>
      </button>
    </template>
  </div>

  <!-- Mobile and Tablet version using the drawer component -->
  <div class="lg:hidden">
    <KinkChoiceDrawer
      :value="value"
      :kink-name="kinkName"
      :is-view-mode="isViewMode"
      :on-click="(value) => props.onClick && props.onClick(value)"
      :tooltip="tooltip"
    />
  </div>
</template>
