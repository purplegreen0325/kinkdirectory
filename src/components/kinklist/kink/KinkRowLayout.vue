<script setup lang="ts">
defineProps<{
  isLastItem?: boolean
}>()
</script>

<template>
  <tr :class="{ 'border-b border-gray-200 dark:border-gray-700': !isLastItem }">
    <td class="py-1 px-2 w-[55%] sm:w-[65%] lg:w-[70%]">
      <slot name="label" />
    </td>
    <slot name="choices" />
  </tr>
</template>
