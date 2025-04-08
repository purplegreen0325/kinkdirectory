<script setup lang="ts">
import { computed } from 'vue'
import { useKinkListState } from '../composables/useKinkList'

import AppFooter from './kinklist/footer/AppFooter.vue'
// Import the new modular components
import AppHeader from './kinklist/header/AppHeader.vue'
import KinkLegend from './kinklist/kink/KinkLegend.vue'
import QuizCard from './kinklist/kink/QuizCard.vue'
import EmptyState from './kinklist/list/EmptyState.vue'
import ListContent from './kinklist/list/ListContent.vue'
import ListControls from './kinklist/list/ListControls.vue'
import ViewOnlyBanner from './kinklist/view/ViewOnlyBanner.vue'

// Only need the basic state variables here
const { activeList, isViewMode } = useKinkListState()

// Check if the current list has any selections (kinks already rated)
const hasSelections = computed(() => {
  if (!activeList.value)
    return false
  return Object.keys(activeList.value.selections).length > 0
})
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Header section with distinct background -->
    <div class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div class="w-full py-3 px-3 sm:px-4">
        <AppHeader />
      </div>
    </div>

    <!-- Content section -->
    <div class="flex-1 bg-gray-50 dark:bg-gray-950 flex-row">
      <div class="flex-1 p-2 sm:p-3 mx-auto">
        <!-- No list message when no active list -->
        <div v-if="!activeList" class="bg-white dark:bg-gray-900 rounded-lg shadow p-4 sm:p-6">
          <EmptyState />
        </div>

        <!-- Active list content -->
        <div v-else>
          <!-- Controls component -->
          <ListControls v-if="!isViewMode" />

          <!-- View-only notice -->
          <ViewOnlyBanner v-if="isViewMode" />

          <!-- List content in a card-like container -->
          <div class="bg-white dark:bg-gray-900 rounded-lg shadow p-3">
            <!-- Legend and quiz section -->
            <div v-if="activeList" class="mb-3">
              <div class="flex flex-col md:flex-row md:items-center md:justify-between flex-wrap gap-2">
                <!-- Legend inside the card, at the top -->
                <KinkLegend class="flex-1" />

                <!-- Quiz button with matching styling to legend -->
                <QuizCard
                  v-if="!isViewMode && hasSelections"
                  :compact="true"
                  class="flex-none"
                />
              </div>
            </div>

            <!-- Full quiz card when no selections yet -->
            <QuizCard v-if="!isViewMode && !hasSelections && activeList" :compact="false" class="mb-3" />

            <div class="overflow-x-auto">
              <ListContent />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer section -->
    <AppFooter />
  </div>
</template>
