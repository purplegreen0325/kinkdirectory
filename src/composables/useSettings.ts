import type { KinkChoice } from '../types'
import { createGlobalState, useStorage } from '@vueuse/core'
import { computed } from 'vue'

// Settings interface
export interface AppSettings {
  reverseKinkOrder: boolean
  showNumbersInChoices: boolean
}

export const useSettings = createGlobalState(() => {
  // Define default settings
  const defaultSettings: AppSettings = {
    reverseKinkOrder: false, // Default: 0,5,4,3,2,1 (false), Alternative: 0,1,2,3,4,5 (true)
    showNumbersInChoices: false, // Default: don't show numbers in choice boxes
  }

  // Store settings in localStorage
  const settings = useStorage<AppSettings>('kinklist-settings', defaultSettings)

  // Basic kink choice order (without zero)
  const kinkChoiceOrder = computed((): KinkChoice[] => {
    return settings.value.reverseKinkOrder ? [1, 2, 3, 4, 5] : [5, 4, 3, 2, 1]
  })

  return {
    settings,
    kinkChoiceOrder,
  }
})
