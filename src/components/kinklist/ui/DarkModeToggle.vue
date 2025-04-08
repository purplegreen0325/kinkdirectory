<script setup lang="ts">
import { useDark, useLocalStorage } from '@vueuse/core'
import { computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// Use VueUse's useDark for handling the color mode
const isDark = useDark()

// Store the preference in localStorage
const colorMode = useLocalStorage('color-scheme', 'auto')

// Format options for the dropdown
const items = computed(() => [
  {
    label: t('theme.light'),
    value: 'light',
    icon: 'i-lucide-sun',
  },
  {
    label: t('theme.dark'),
    value: 'dark',
    icon: 'i-lucide-moon',
  },
  {
    label: t('theme.auto'),
    value: 'auto',
    icon: 'i-lucide-monitor',
  },
])

// Apply the color mode
function applyColorMode() {
  if (colorMode.value === 'auto') {
    // Let useDark handle it based on system preference
    // We don't need to do anything here
  }
  else if (colorMode.value === 'dark') {
    isDark.value = true
  }
  else {
    isDark.value = false
  }
}

// Apply on mount
onMounted(() => {
  applyColorMode()
})

// Update when the preference changes
watch(colorMode, () => {
  applyColorMode()
})
</script>

<template>
  <div>
    <USelectMenu
      v-model="colorMode"
      :items="items"
      value-key="value"
      class="w-32"
      size="sm"
      :search-input="false"
    >
      <template #leading>
        <UIcon v-if="colorMode === 'light'" name="i-lucide-sun" class="w-4 h-4" />
        <UIcon v-else-if="colorMode === 'dark'" name="i-lucide-moon" class="w-4 h-4" />
        <UIcon v-else name="i-lucide-monitor" class="w-4 h-4" />
      </template>
    </USelectMenu>
  </div>
</template>
