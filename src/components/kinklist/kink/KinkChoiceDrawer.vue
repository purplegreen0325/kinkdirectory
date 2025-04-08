<script setup lang="ts">
import type { KinkChoice as KinkChoiceType } from '../../../types'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSettings } from '../../../composables/useSettings'

const props = defineProps<{
  value: KinkChoiceType
  kinkName?: string
  tooltip?: string
  isViewMode: boolean
  onClick: (value: KinkChoiceType) => void
}>()

const { t } = useI18n()
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

// Text color classes
const textColorClasses = {
  0: 'text-gray-500 dark:text-gray-400',
  1: 'text-blue-500 dark:text-blue-400',
  2: 'text-green-500 dark:text-green-400',
  3: 'text-yellow-500 dark:text-yellow-400',
  4: 'text-orange-500 dark:text-orange-400',
  5: 'text-red-500 dark:text-red-400',
}

// Combined values with 0 first for the drawer
const drawerValues = computed(() => {
  const reversedOrder = [...kinkChoiceOrder.value].reverse()
  reversedOrder.push(0)
  return reversedOrder as KinkChoiceType[]
})

// Get selected value label
const selectedValueLabel = computed(() => {
  if (props.value === 0)
    return settings.value.showNumbersInChoices ? '0' : '⊘'
  return props.value.toString()
})

// Control drawer state
const isDrawerOpen = ref(false)

// Get description text for a rating value
function getRatingDescription(rating: KinkChoiceType): string {
  if (rating === 0)
    return t('choices.not_entered')
  if (rating === 5)
    return t('choices.limit')
  if (rating === 4)
    return t('choices.maybe')
  if (rating === 3)
    return t('choices.indifferent')
  if (rating === 2)
    return t('choices.like')
  if (rating === 1)
    return t('choices.favorite')
  return t('choices.favorite')
}

// Handle value selection in drawer
function handleSelect(rating: KinkChoiceType) {
  if (!props.isViewMode) {
    props.onClick(rating)
    isDrawerOpen.value = false
  }
}

// Drawer title
const drawerTitle = computed(() => {
  return props.kinkName ? `Rate: ${props.kinkName}` : 'Select Rating'
})
</script>

<template>
  <div class="flex justify-center">
    <UDrawer
      v-model:open="isDrawerOpen"
      :disabled="isViewMode"
      direction="bottom"
      :handle="true"
      :title="drawerTitle"
      :description="tooltip"
      :ui="{
        content: 'fixed bg-(--ui-bg) ring ring-(--ui-border) flex focus:outline-none',
        handle: ['shrink-0 !bg-(--ui-bg-accented)'],
        title: 'break-words pr-4',
      }"
    >
      <!-- Main square button at the top of the drawer -->
      <button
        type="button"
        class="w-6 h-6 rounded border flex items-center justify-center text-xs font-bold focus:outline-none mx-auto"
        :class="[
          value === 0 ? 'border-gray-300 dark:border-gray-600' : activeColorClasses[value],
          !isViewMode ? 'cursor-pointer' : 'cursor-not-allowed opacity-90',
          !settings.showNumbersInChoices && textColorClasses[value],
        ]"
        :data-rating="value"
      >
        <span
          v-if="settings.showNumbersInChoices"
          class="text-xs font-bold"
          :class="value === 0 ? 'text-gray-600 dark:text-gray-300' : 'text-white'"
        >
          {{ value }}
        </span>
        <span v-else>
          {{ selectedValueLabel }}
        </span>
      </button>

      <template #body>
        <div class="flex flex-col space-y-2">
          <button
            v-for="rating in drawerValues"
            :key="rating"
            class="py-3 px-4 text-left rounded-md flex items-center justify-between"
            :class="[
              value === rating ? `bg-gray-100 dark:bg-gray-800 font-medium ${textColorClasses[rating]}` : 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
            ]"
            :data-rating="rating"
            @click="handleSelect(rating)"
          >
            <div class="flex items-center flex-1 min-w-0 mr-2">
              <span
                class="w-5 h-5 rounded-full inline-flex items-center justify-center mr-3 flex-shrink-0"
                :class="rating === 0 ? 'border-2 border-gray-300 dark:border-gray-600' : activeColorClasses[rating]"
                :data-rating="rating"
              >
                <span v-if="settings.showNumbersInChoices" class="text-xs font-bold text-white" :class="{ 'dark:text-gray-900': rating === 0 }">{{ rating }}</span>
              </span>
              <span class="text-sm break-words">{{ getRatingDescription(rating) }}</span>
            </div>
            <span class="text-lg font-bold flex-shrink-0">{{ settings.showNumbersInChoices && rating === 0 ? '0' : rating === 0 ? '⊘' : rating }}</span>
          </button>
        </div>
      </template>
    </UDrawer>
  </div>
</template>
