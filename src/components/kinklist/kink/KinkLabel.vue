<script setup lang="ts">
import { computed } from 'vue'
import { useKinkListState } from '../../../composables/useKinkList'

const props = defineProps<{
  label: string
  tooltip: string
  addedAt?: number
}>()

const { openKinkModal } = useKinkListState()

// Check if kink was added within the last 2 days
const isNewKink = computed(() => {
  if (!props.addedAt)
    return false
  const twoDaysAgo = Math.floor(Date.now() / 1000) - (2 * 24 * 60 * 60)
  return props.addedAt > twoDaysAgo
})

function handleClick() {
  openKinkModal(props.label, props.tooltip)
}
</script>

<template>
  <div class="min-w-0 max-w-full">
    <div class="w-fit max-w-full">
      <UTooltip
        :text="tooltip"
        :delay-duration="200"
        :content="{
          side: 'bottom',
          align: 'center',
          sideOffset: 4,
        }"
        arrow
      >
        <div class="flex items-center cursor-pointer" @click="handleClick">
          <span class="text-[0.875rem] md:text-[0.8rem] break-all hyphens-auto">
            <span data-kink-label>{{ label }}</span>
            <UIcon name="i-heroicons-question-mark-circle-solid" class="inline-block w-3 h-3 text-gray-400 align-middle" />
            <span v-if="isNewKink" class="inline-flex items-center ml-0.5 px-1.25 py-0.25 rounded-full text-[0.7rem] leading-[1.3] font-medium bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300">
              New!
            </span>
          </span>
        </div>
      </UTooltip>
    </div>
  </div>
</template>
