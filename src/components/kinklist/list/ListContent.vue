<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useKinkListState } from '../../../composables/useKinkList'
import { kinkList } from '../../../data/kinks'
import KinkSection from '../../kinklist/kink/KinkSection.vue'

const { t } = useI18n()
const { activeList, isKinkVisibleForRole, kinkModalState, closeKinkModal } = useKinkListState()

// Get categories with type assertion to ensure TypeScript knows the structure

// Filter categories to only show those with visible kinks
const visibleCategories = computed(() => {
  if (!activeList.value)
    return []

  return kinkList.filter((category) => {
    // Check if any kink in this category is visible for the current role
    return category.kinks.some(kink =>
      isKinkVisibleForRole(kink, activeList.value!.role),
    )
  })
})
</script>

<template>
  <div>
    <!-- List content for screenshot -->
    <div id="kink-list-content" class="max-w-full overflow-x-hidden p-0">
      <!-- Masonry-style layout for better space filling -->
      <div class="columns-1 md:columns-2 xl:columns-3 gap-6 space-y-6">
        <div v-for="category in visibleCategories" :key="category.id" class="category-container inline-block w-full mb-2">
          <h2 class="text-base font-bold mb-1.5 pb-1.5 border-b-1 border-gray-200 dark:border-gray-700">
            {{ t(`categories.${category.id}`) }}
          </h2>

          <!-- Kinks section -->
          <KinkSection
            :category-id="category.id"
            :kinks="category.kinks"
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
