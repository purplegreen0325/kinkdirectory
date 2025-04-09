<script setup lang="ts">
import type { KinkChoice as KinkChoiceType } from '../../../types'
import KinkChoice from './KinkChoice.vue'

defineProps<{
  value: KinkChoiceType
  position: string
  kinkName: string
  positionLabel?: string
  isEmpty?: boolean
  isGeneral?: boolean
  tooltip?: string
  onClick: (value: KinkChoiceType) => void
}>()
</script>

<template>
  <td
    class="text-center whitespace-nowrap py-2 px-0 sm:px-2 min-w-[40px] sm:min-w-[50px]" :class="[
      isGeneral ? 'text-center' : '',
    ]"
  >
    <div class="flex justify-center items-center">
      <slot />
      <KinkChoice
        v-if="!isEmpty"
        :value="value"
        :on-click="onClick"
        :tooltip="tooltip"
        :kink-name="positionLabel ? `${kinkName} (${positionLabel})` : kinkName"
      />
      <div v-else class="w-4.5 h-4.5" />
    </div>
  </td>
</template>
