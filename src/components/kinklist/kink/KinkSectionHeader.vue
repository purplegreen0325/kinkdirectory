<script setup lang="ts">
defineProps<{
  title: string
  columnLabels: string[]
  isGeneralSection?: boolean
}>()
</script>

<template>
  <thead class="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
    <tr>
      <th class="text-left py-1 px-2 sm:px-2 w-[55%] sm:w-[65%] lg:w-[70%]">
      </th>
      
      <!-- General section has only one column -->
      <template v-if="isGeneralSection">
        <th class="text-center py-1 px-0 sm:px-2">
          <div class="text-xs font-medium">
            {{ columnLabels[0] }}
          </div>
        </th>
      </template>
      
      <!-- Role-specific section has multiple columns -->
      <template v-else>
        <th 
          v-for="(label, index) in columnLabels" 
          :key="index"
          class="text-center whitespace-nowrap py-1 px-0 sm:px-2"
        >
          <div class="text-[0.65rem] sm:text-[0.75rem] font-medium">
            {{ label }}
          </div>
        </th>
      </template>
    </tr>
  </thead>
</template> 