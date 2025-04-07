<script setup lang="ts">
import { useKinkListState } from '../../../composables/useKinkList'

const props = defineProps<{
  label: string
  tooltip: string
}>()

const { openKinkModal } = useKinkListState()

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
          sideOffset: 4
        }"
        arrow
      >
        <div class="flex items-center cursor-pointer" @click="handleClick">
          <span class="text-[0.875rem] md:text-[0.8rem] break-all hyphens-auto">
            {{ label }} <UIcon name="i-heroicons-question-mark-circle-solid" class="inline-block w-3 h-3 text-gray-400 align-middle" />
          </span>
        </div>
      </UTooltip>
    </div>
  </div>
</template> 