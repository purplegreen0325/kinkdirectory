<script setup lang="ts">
defineProps<{
  isLastSection?: boolean
}>()
</script>

<template>
  <div
    class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
    :class="{ 'mb-2': !isLastSection }"
  >
    <table class="w-full border-collapse table-auto">
      <slot name="header" />
      <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
        <slot name="content" />
      </tbody>
    </table>
  </div>
</template>
