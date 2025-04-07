<script setup lang="ts">
import { useKinkListState } from '../composables/useKinkList'

// Import the new modular components
import AppHeader from './kinklist/header/AppHeader.vue'
import EmptyState from './kinklist/list/EmptyState.vue'
import ListControls from './kinklist/list/ListControls.vue'
import ViewOnlyBanner from './kinklist/view/ViewOnlyBanner.vue'
import ListContent from './kinklist/list/ListContent.vue'
import KinkLegend from './kinklist/kink/KinkLegend.vue'
import AppFooter from './kinklist/footer/AppFooter.vue'

// Only need the basic state variables here
const { activeList, isViewMode } = useKinkListState()
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
            <!-- Legend inside the card, at the top -->
            <KinkLegend v-if="activeList" />
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