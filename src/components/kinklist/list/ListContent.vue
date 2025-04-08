<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useKinkListState } from '../../../composables/useKinkList'
import { kinkList } from '../../../data/kinks'
import KinkSection from '../../kinklist/kink/KinkSection.vue'

const { t } = useI18n()
const { activeList, isKinkVisibleForRole, kinkModalState, closeKinkModal, shouldShowKink, filters } = useKinkListState()

// Filter categories to only show those with visible kinks
const visibleCategories = computed(() => {
  if (!activeList.value)
    return []

  return kinkList.filter((category) => {
    // Check if any kink in this category is visible for the current role
    // and passes the active filters
    return category.kinks.some(kink =>
      isKinkVisibleForRole(kink, activeList.value!.role) && shouldShowKink(kink),
    )
  })
})
</script>

<template>
  <div>
    <!-- Combined filter notice when any filters are active -->

    <!-- List content for screenshot -->
    <div id="kink-list-content" class="max-w-full overflow-x-hidden p-0">
      <!-- Empty state when filters return no results -->
      <div v-if="visibleCategories.length === 0 && (filters.showOnlyNew || filters.showOnlyUnfilled)" class="text-center py-8">
        <UIcon name="i-lucide-filter-x" class="text-4xl text-gray-400 dark:text-gray-600 mx-auto mb-2" />
        <p class="text-gray-500 dark:text-gray-400">
          <template v-if="filters.showOnlyNew && filters.showOnlyUnfilled">
            {{ t('app.no_results_with_filters') }}
          </template>
          <template v-else-if="filters.showOnlyNew">
            {{ t('app.no_new_items_found') }}
          </template>
          <template v-else-if="filters.showOnlyUnfilled">
            {{ t('app.no_unfilled_items_found') }}
          </template>
        </p>
        <UButton size="sm" color="neutral" class="mt-4" @click="() => { 
          filters.showOnlyNew = false; 
          filters.showOnlyUnfilled = false; 
        }">
          {{ t('app.clear_filters') }}
        </UButton>
      </div>

      <!-- Masonry-style layout for better space filling -->
      <div v-else class="columns-1 md:columns-2 xl:columns-3 gap-6 space-y-6">
        <div v-for="category in visibleCategories" :key="category.id" class="category-container inline-block w-full mb-2">
          <h2 class="text-base font-bold mb-1.5 pb-1.5 border-b-1 border-gray-200 dark:border-gray-700">
            {{ t(`categories.${category.id}`) }}
          </h2>

          <!-- Kinks section -->
          <KinkSection
            :category-id="category.id"
            :kinks="category.kinks.filter(kink => shouldShowKink(kink) && isKinkVisibleForRole(kink, activeList?.role || 'both'))"
          />
        </div>
      </div>
    </div>

    <!-- Kink Detail Modal -->
    <UModal v-model:open="kinkModalState.isOpen" :title="kinkModalState.title">
      <template #body>
        <p>{{ kinkModalState.description }}</p>
      </template>

      <template #footer>
        <div class="flex justify-end">
          <UButton color="primary" @click="closeKinkModal">
            Close
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<style scoped>
.category-container {
  break-inside: avoid;
  page-break-inside: avoid;
}
</style>
