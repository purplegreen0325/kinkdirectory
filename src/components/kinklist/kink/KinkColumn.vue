<script setup lang="ts">
import KinkChoice from './KinkChoice.vue'
import type { KinkChoice as KinkChoiceType } from '../../../types'

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
  <td :class="[
    'text-center whitespace-nowrap py-2 px-0 sm:px-2 min-w-[40px] sm:min-w-[50px]',
    isGeneral ? 'text-center' : ''
  ]">
    <div class="flex justify-center items-center">
      <KinkChoice 
        v-if="!isEmpty"
        :value="value" 
        :onClick="onClick" 
        :tooltip="tooltip"
        :kinkName="positionLabel ? `${kinkName} (${positionLabel})` : kinkName"
      />
      <div v-else class="w-4.5 h-4.5"></div>
    </div>
  </td>
</template> 