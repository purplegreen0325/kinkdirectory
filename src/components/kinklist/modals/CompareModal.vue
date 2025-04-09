<script setup lang="ts">
import type { KinkChoice, KinkDefinition, KinkList } from '../../../types'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useKinkListState } from '../../../composables/useKinkList'
import { kinkList } from '../../../data/kinks'
import KinkChoiceComponent from '../kink/KinkChoice.vue'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { t } = useI18n()
const { kinkLists, isViewMode, isKinkVisibleForRole, getKinkPositions } = useKinkListState()

// Access viewOnlyList from state
const state = useKinkListState() as any
const viewOnlyList = computed<KinkList | null>(() => state.viewOnlyList || null)

// If in view mode, always use the viewed list as the first list
const inViewMode = computed(() => isViewMode.value && viewOnlyList.value !== null)

// Helper function to get a choice from a specific list
function getKinkChoiceFromList(kink: KinkDefinition, position: string, listId: string): KinkChoice {
  // Find the correct list to use
  const list = kinkLists.value.find(l => l.id === listId)
    || (viewOnlyList.value && viewOnlyList.value.id === listId ? viewOnlyList.value : null)

  if (!list)
    return 0

  // Access using key%position format
  const key = `${kink.key}%${position}`
  return list.selections[key] || 0
}

// Selection state for both lists
const firstListId = ref('')
const secondListId = ref('')

// Filter to only show matching kinks
const showOnlyMatches = ref(false)

// Get all available lists (including the viewed list if in view mode)
const availableLists = computed(() => {
  const lists = [...kinkLists.value]

  // Add the viewed list if in view mode
  if (inViewMode.value && viewOnlyList.value) {
    if (!lists.some(list => list.id === viewOnlyList.value?.id)) {
      lists.push(viewOnlyList.value)
    }
  }

  return lists
})

// Filter lists for first dropdown to exclude "both" role lists
const filteredFirstLists = computed(() => {
  // If in view mode, we need to include the viewed list regardless of role
  if (inViewMode.value && viewOnlyList.value) {
    return availableLists.value.filter(list =>
      list.role !== 'both' || list.id === viewOnlyList.value?.id,
    )
  }

  // Otherwise, filter out all "both" role lists
  return availableLists.value.filter(list => list.role !== 'both')
})

// Get the selected lists
const firstList = computed(() => {
  // If in view mode, always use the viewed list
  if (inViewMode.value) {
    return viewOnlyList.value
  }
  return filteredFirstLists.value.find(list => list.id === firstListId.value) || null
})

const secondList = computed(() => {
  return availableLists.value.find(list => list.id === secondListId.value) || null
})

// Check if the second list is compatible with the first list
const compatibleLists = computed(() => {
  // If no first list, return all lists
  if (!firstList.value)
    return availableLists.value

  // At this point TypeScript knows firstList.value is not null
  const currentFirstList = firstList.value

  // Allow comparing roles: sub with dom, dom with sub, sub with sub, dom with dom
  // 'both' role lists cannot be compared with any other lists
  return availableLists.value.filter((list) => {
    // Don't allow comparing with the same list
    if (list.id === (inViewMode.value && viewOnlyList.value ? viewOnlyList.value.id : firstListId.value)) {
      return false
    }

    // Do not allow comparing 'both' role with any other list
    if (currentFirstList.role === 'both' || list.role === 'both') {
      return false
    }

    // Otherwise, allow only compatible roles
    return true // dom can compare with dom, sub with sub, dom with sub, sub with dom
  })
})

// If we're in view mode, auto-select the viewed list as the first list
onMounted(() => {
  if (inViewMode.value && viewOnlyList.value) {
    firstListId.value = viewOnlyList.value.id
  }
})

// Process kink data for comparison view
const processedCategories = computed(() => {
  if (!firstList.value || !secondList.value)
    return []

  const categories: {
    id: string
    kinks: {
      id: string
      key: number
      firstChoice: KinkChoice
      secondChoice: KinkChoice
      firstPosition: string
      secondPosition: string
      matches: boolean
    }[]
  }[] = []

  // Loop through all categories
  kinkList.forEach((category) => {
    const processedKinks: {
      id: string
      key: number
      firstChoice: KinkChoice
      secondChoice: KinkChoice
      firstPosition: string
      secondPosition: string
      matches: boolean
    }[] = []

    // Loop through kinks in this category
    category.kinks.forEach((kink) => {
      // Check if kink is visible for both roles
      const isVisibleForFirst = isKinkVisibleForRole(kink, firstList.value!.role)
      const isVisibleForSecond = isKinkVisibleForRole(kink, secondList.value!.role)

      if (isVisibleForFirst && isVisibleForSecond) {
        // Get positions for this kink
        const firstPositions = getKinkPositions(kink, firstList.value!.role)
        const secondPositions = getKinkPositions(kink, secondList.value!.role)

        // Only include if there are positions for both lists
        if (firstPositions.length > 0 && secondPositions.length > 0) {
          // Different comparison logic based on whether roles are the same or opposite
          const isSameRole = firstList.value!.role === secondList.value!.role
          const isDomSubComparison
            = (firstList.value!.role === 'dom' && secondList.value!.role === 'sub')
              || (firstList.value!.role === 'sub' && secondList.value!.role === 'dom')

          // For each position in the first list, find the corresponding position in the second list
          for (const firstPos of firstPositions) {
            // For dom-sub comparison, we want to match giving with receiving
            for (const secondPos of secondPositions) {
              // Get choices for each list
              const firstChoice = getKinkChoiceFromList(kink, firstPos, firstList.value!.id)
              const secondChoice = getKinkChoiceFromList(kink, secondPos, secondList.value!.id)

              // Whether this is a valid perspective match
              let isValidMatch = true

              // For dom-sub comparison, ensure we're matching complementary perspectives
              if (isDomSubComparison) {
                // For role-specific kinks in dom-sub comparison, match giving with receiving
                if (kink.format === 'role_specific') {
                  const isComplementary
                    = (firstPos === 'giving' && secondPos === 'receiving')
                      || (firstPos === 'receiving' && secondPos === 'giving')

                  if (!isComplementary) {
                    isValidMatch = false
                  }
                }
              }

              // Check if this is a match (both have selected values and they match)
              const isMatch = firstChoice !== 0 && secondChoice !== 0 && firstChoice === secondChoice && isValidMatch

              // Only include if showing all or it's a match
              if (!showOnlyMatches.value || isMatch) {
                processedKinks.push({
                  id: kink.id,
                  key: kink.key,
                  firstChoice,
                  secondChoice,
                  firstPosition: firstPos,
                  secondPosition: secondPos,
                  matches: isMatch,
                })
              }
            }
          }
        }
      }
    })

    // Only add category if it has visible kinks
    if (processedKinks.length > 0) {
      categories.push({
        id: category.id,
        kinks: processedKinks,
      })
    }
  })

  return categories
})

// Check if comparison can be made
const canCompare = computed(() => {
  return firstList.value !== null && secondList.value !== null
})

function handleCancel() {
  emit('close')
}

// Reset second list when first list changes
watch(firstListId, () => {
  secondListId.value = ''
})
</script>

<template>
  <UModal
    :title="t('app.compare_lists')"
    :description="t('app.compare_lists_description')"
    size="4xl"
    :ui="{ content: 'max-w-11.5/12' }"
  >
    <template #body>
      <div class="space-y-4 overflow-y-auto max-h-[70vh] overflow-x-hidden pr-2">
        <!-- List Selection -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">{{ t('app.first_list') }}</label>
            <UTooltip :text="t('app.lists_with_both_role_cannot_be_compared')">
              <USelect
                v-model="firstListId"
                :items="filteredFirstLists.map(list => ({
                  value: list.id,
                  label: list.name,
                  role: list.role,
                }))"
                size="sm"
                :placeholder="t('app.select_list')"
                class="w-full"
                :disabled="inViewMode"
              >
                <template #item-label="{ item }">
                  <div class="flex items-center gap-2">
                    <span class="font-medium">{{ item.label }}</span>
                    <UBadge v-if="item.role" size="xs" color="primary">
                      {{ t(`roles.${item.role}`) }}
                    </UBadge>
                  </div>
                </template>
              </USelect>
            </UTooltip>
            <div v-if="inViewMode" class="text-xs text-gray-500 mt-1">
              {{ t('app.comparing_view_only_list') }}
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">{{ t('app.second_list') }}</label>
            <USelect
              v-model="secondListId"
              :items="compatibleLists.map(list => ({
                value: list.id,
                label: list.name,
                role: list.role,
              }))"
              :placeholder="t('app.select_list')"
              class="w-full"
              size="sm"
              :disabled="!firstList"
            >
              <template #item-label="{ item }">
                <div class="flex items-center gap-2">
                  <span class="font-medium">{{ item.label }}</span>
                  <UBadge v-if="item.role" size="xs" color="primary">
                    {{ t(`roles.${item.role}`) }}
                  </UBadge>
                </div>
              </template>
            </USelect>
          </div>
        </div>

        <!-- Filter Toggle -->
        <div v-if="canCompare" class="flex items-center justify-start">
          <USwitch
            v-model="showOnlyMatches"
            size="sm"
            :label="t('app.show_only_matches')"
            :description="t('app.show_only_matches_description')"
          />
        </div>

        <!-- Comparison View -->
        <div v-if="canCompare" class="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
            <h3 class="text-lg font-semibold">
              {{ t('app.comparison_results') }}
            </h3>

            <div class="flex items-center gap-4 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0">
              <div class="flex items-center gap-2 shrink-0">
                <span class="text-sm font-medium truncate max-w-[120px]">{{ firstList?.name }}</span>
                <UBadge size="xs" color="primary">
                  {{ t(`roles.${firstList?.role}`) }}
                </UBadge>
              </div>

              <UIcon name="i-lucide-arrow-right" class="text-gray-500 shrink-0" />

              <div class="flex items-center gap-2 shrink-0">
                <span class="text-sm font-medium truncate max-w-[120px]">{{ secondList?.name }}</span>
                <UBadge size="xs" color="primary">
                  {{ t(`roles.${secondList?.role}`) }}
                </UBadge>
              </div>
            </div>
          </div>

          <!-- Empty state when no matches are found -->
          <div v-if="processedCategories.length === 0" class="text-center py-8">
            <UIcon name="i-lucide-search-x" class="text-4xl text-gray-400 dark:text-gray-600 mx-auto mb-2" />
            <p class="text-gray-500 dark:text-gray-400">
              {{ t('app.no_matching_kinks_found') }}
            </p>
            <UButton
              v-if="showOnlyMatches"
              size="sm"
              color="neutral"
              class="mt-4"
              @click="showOnlyMatches = false"
            >
              {{ t('app.show_all_kinks') }}
            </UButton>
          </div>

          <!-- Categories and Kinks -->
          <div v-else class="space-y-8">
            <div v-for="category in processedCategories" :key="category.id" class="category-container">
              <h2 class="text-base font-bold mb-3 pb-1.5 border-b border-gray-200 dark:border-gray-700">
                {{ t(`categories.${category.id}`) }}
              </h2>

              <div class="space-y-2">
                <div
                  v-for="kink in category.kinks" :key="`${category.id}_${kink.id}`"
                  class="p-3 rounded-md flex justify-between"
                  :class="kink.matches ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-800/50'"
                >
                  <!-- Left side: Kink Label -->
                  <div class="flex items-center flex-1">
                    <div v-if="kink.matches" class="mr-1 flex-shrink-0">
                      <UIcon
                        name="i-lucide-check"
                        class="text-green-500 dark:text-green-400"
                      />
                    </div>
                    <div>
                      <div class="font-medium text-sm">
                        {{ t(`${category.id}.${kink.id}.label`) }}
                      </div>
                      <div v-if="firstList?.role !== secondList?.role" class="text-xs text-gray-500 mt-0.5">
                        {{ t(`app.${kink.firstPosition}`) }} → {{ t(`app.${kink.secondPosition}`) }}
                      </div>
                    </div>
                  </div>

                  <!-- Right side: Choice Components -->
                  <div class="flex items-center">
                    <KinkChoiceComponent :value="kink.firstChoice" class="mx-1" />
                    <UIcon name="i-lucide-arrow-right" class="text-gray-400 mx-1" />
                    <KinkChoiceComponent :value="kink.secondChoice" class="mx-1" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Instructions when no lists are selected -->
        <div v-else-if="firstList && !secondList" class="text-center py-8">
          <UIcon name="i-lucide-arrow-right" class="text-4xl text-gray-400 dark:text-gray-600 mx-auto mb-2" />
          <p class="text-gray-500 dark:text-gray-400">
            {{ t('app.select_second_list') }}
          </p>
        </div>

        <div v-else-if="!firstList" class="text-center py-8">
          <UIcon name="i-lucide-list" class="text-4xl text-gray-400 dark:text-gray-600 mx-auto mb-2" />
          <p class="text-gray-500 dark:text-gray-400">
            {{ filteredFirstLists.length > 0 ? t('app.select_lists_to_compare') : t('app.no_compatible_lists_to_compare') }}
          </p>
          <p v-if="filteredFirstLists.length === 0" class="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {{ t('app.lists_with_both_role_cannot_be_compared') }}
          </p>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div class="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <UButton
          variant="ghost"
          @click="handleCancel"
        >
          {{ t('app.close') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<style scoped>
.category-container {
  break-inside: avoid;
  page-break-inside: avoid;
}
</style>
