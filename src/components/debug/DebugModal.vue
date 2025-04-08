<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMagicKeys } from '@vueuse/core'
import { useKinkListState } from '../../composables/useKinkList'
import type { KinkChoice } from '../../types'
import { kinkList } from '../../data/kinks'
const { t } = useI18n()
const { activeList } = useKinkListState()

// State for the modal
const isOpen = ref(false)

// Debug tabs
const tabs = computed(() => {
  const allTabs = [
    { name: 'general', label: 'General', slot: 'general' },
    { name: 'kinks', label: 'Kinks JSON', slot: 'kinks' }
  ]
  
  // Only add the active list tab if there's a list selected
  if (activeList.value) {
    allTabs.push({ name: 'list', label: `List: ${activeList.value.name}`, slot: 'list' })
    allTabs.push({ name: 'selections', label: 'Selections', slot: 'selections' })
    allTabs.push({ name: 'stats', label: 'Statistics', slot: 'stats' })
  }
  
  return allTabs
})

const activeTab = ref('general')

// Initialize the keyboard shortcut (Ctrl+Shift+O)
const { Ctrl_Shift_O } = useMagicKeys()

// Watch for keyboard combo
watch(Ctrl_Shift_O, (pressed: boolean) => {
    console.log('Ctrl_Shift_O', pressed)
  if (pressed) {
    console.log('Toggling modal')
    isOpen.value = !isOpen.value
  }
})

// Computed properties for debug data
const generalInfo = computed(() => {
  return {
    appVersion: '1.0.0',
    vueVersion: '3.5.13',
    nuxtUI: '3.0.2',
    kinkCategories: (kinkList || []).length,
    totalKinks: (kinkList || []).reduce(
      (acc, cat) => acc + cat.kinks.length, 0
    ),
    activeListId: activeList.value?.id || 'none',
    userRole: activeList.value?.role || 'none',
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  }
})

const listInfo = computed(() => {
  if (!activeList.value) return null
  
  const selections = Object.entries(activeList.value.selections)
    .filter(([_, val]) => val !== 0)
    .length
  
  return {
    ...activeList.value,
    selectionCount: selections
  }
})

// Only get active selections (non-zero values)
const activeSelections = computed(() => {
  if (!activeList.value) return {}
  
  return Object.entries(activeList.value.selections)
    .filter(([_, val]) => val !== 0)
    .reduce((obj, [key, val]) => {
      obj[key] = val
      return obj
    }, {} as Record<string, KinkChoice>)
})

// Calculate statistics for the kink list
const kinkStats = computed(() => {
  if (!activeList.value) return null
  
  const stats = {
    total: 0,
    byRating: {
      1: 0, // Favorite
      2: 0, // Like
      3: 0, // Indifferent
      4: 0, // Maybe
      5: 0  // Limit
    },
    byPosition: {
      general: 0,
      as_dom: 0,
      as_sub: 0,
      for_dom: 0,
      for_sub: 0
    }
  }
  
  // Count selections by position and rating
  Object.entries(activeList.value.selections).forEach(([key, value]) => {
    if (value === 0) return // Skip unrated
    
    stats.total++
    
    // Increment rating counter
    if (stats.byRating[value as keyof typeof stats.byRating] !== undefined) {
      stats.byRating[value as keyof typeof stats.byRating]++
    }
    
    // Increment position counter
    const position = key.split('_')[2]
    if (stats.byPosition[position as keyof typeof stats.byPosition] !== undefined) {
      stats.byPosition[position as keyof typeof stats.byPosition]++
    }
  })
  
  return stats
})

// Format JSON for display
function formatJson(obj: any): string {
  return JSON.stringify(obj, null, 2)
}

function closeModal() {
  isOpen.value = false
}

// Rating labels
const ratingLabels = {
  0: 'Not entered',
  1: 'Favorite',
  2: 'Like',
  3: 'Indifferent',
  4: 'Maybe',
  5: 'Limit'
}

// Display a humanized key
function humanizeKey(key: string): string {
  const [categoryId, kinkId, position] = key.split('_')
  let category = t(`categories.${categoryId}`)
  if (category === `categories.${categoryId}`) {
    category = categoryId
  }
  
  let label = t(`${categoryId}.${kinkId}.label`)
  if (label === `${categoryId}.${kinkId}.label`) {
    label = kinkId
  }
  
  return `${category}: ${label} (${position})`
}

// Prettier position names
function formatPosition(position: string): string {
  switch (position) {
    case 'general': return 'General'
    case 'as_dom': return 'As Dom'
    case 'as_sub': return 'As Sub'
    case 'for_dom': return 'For Dom'
    case 'for_sub': return 'For Sub'
    default: return position
  }
}
</script>

<template>
  <UModal v-model:open="isOpen" size="2xl" :dismissible="false" fullscreen>
    <template #header>
      <div class="flex justify-between items-center w-full">
        <h3 class="text-xl font-semibold">Debug Console</h3>
        <p class="text-sm text-gray-500">Press Ctrl+Shift+O to toggle</p>
      </div>
    </template>
    
    <template #body>
      <UTabs v-model="activeTab" :items="tabs" class="w-full">
        <!-- General tab content -->
        <template #general>
          <div class="p-6 space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div v-for="(value, key) in generalInfo" :key="key" class="flex">
                <span class="font-semibold w-40 text-gray-600 dark:text-gray-300">{{ key }}:</span>
                <span class="font-mono">{{ value }}</span>
              </div>
            </div>
          </div>
        </template>
        
        <!-- Kinks JSON tab content -->
        <template #kinks>
          <div class="p-6">
            <pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto max-h-[60vh] text-xs font-mono">{{ formatJson(kinkList) }}</pre>
          </div>
        </template>
        
        <!-- List tab content -->
        <template #list>
          <div class="p-6" v-if="listInfo">
            <pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto max-h-[60vh] text-xs font-mono">{{ formatJson(listInfo) }}</pre>
          </div>
        </template>
        
        <!-- Selections tab content -->
        <template #selections>
          <div class="p-6 space-y-4" v-if="activeList">
            <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <p class="font-medium">Number of selections: {{ Object.keys(activeSelections).length }}</p>
            </div>
            <div class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
              <div v-for="(value, key) in activeSelections" :key="key" class="p-3 grid grid-cols-5 gap-4">
                <span class="text-sm col-span-3">{{ humanizeKey(key) }}</span>
                <span class="text-sm font-medium flex items-center">
                  {{ value }} - {{ ratingLabels[value as keyof typeof ratingLabels] }}
                </span>
                <span class="flex justify-end">
                  <div 
                    class="w-5 h-5 rounded-full" 
                    :class="{
                      'bg-blue-500': value === 1,
                      'bg-green-500': value === 2,
                      'bg-yellow-500': value === 3,
                      'bg-orange-500': value === 4,
                      'bg-red-500': value === 5,
                    }"
                  ></div>
                </span>
              </div>
            </div>
            <div v-if="Object.keys(activeSelections).length === 0" class="text-center py-8 text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg">
              No selections made yet
            </div>
          </div>
        </template>
        
        <!-- Statistics tab content -->
        <template #stats>
          <div class="p-6 space-y-6" v-if="kinkStats">
            <div class="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm">
              <h3 class="text-lg font-medium mb-3">Ratings Distribution</h3>
              <div class="flex items-end gap-2 mt-4 justify-center">
                <div v-for="(count, rating) in kinkStats.byRating" :key="rating" class="flex flex-col items-center w-14">
                  <div class="text-xs mb-1 font-medium">{{ count }}</div>
                  <div 
                    class="w-10 rounded-t-lg transition-all duration-300" 
                    :style="`height: ${Math.max(count / (kinkStats.total || 1) * 100, 5)}%;`"
                    :class="{
                      'bg-blue-500': Number(rating) === 1,
                      'bg-green-500': Number(rating) === 2,
                      'bg-yellow-500': Number(rating) === 3,
                      'bg-orange-500': Number(rating) === 4,
                      'bg-red-500': Number(rating) === 5,
                    }"
                  ></div>
                  <div class="text-xs mt-1 font-medium">{{ ratingLabels[Number(rating) as keyof typeof ratingLabels] }}</div>
                </div>
              </div>
            </div>
            
            <div class="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm">
              <h3 class="text-lg font-medium mb-3">By Position</h3>
              <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div v-for="(count, position) in kinkStats.byPosition" :key="position" 
                     class="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
                  <p class="text-sm font-medium mb-1">{{ formatPosition(position) }}</p>
                  <p class="text-xl font-bold">{{ count }}</p>
                  <p class="text-xs mt-1">{{ Math.round(count / (kinkStats.total || 1) * 100) }}%</p>
                </div>
              </div>
            </div>
          </div>
        </template>
      </UTabs>
    </template>
    
    <template #footer>
      <div class="flex justify-end">
        <UButton @click="closeModal" color="neutral">Close</UButton>
      </div>
    </template>
  </UModal>
</template> 