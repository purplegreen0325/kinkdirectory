<script setup lang="ts">
import { useLocalStorage, usePreferredLanguages } from '@vueuse/core'
import { computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale, availableLocales } = useI18n()

// Use VueUse to store language preference in localStorage
const storedLocale = useLocalStorage('user-locale', 'auto')

// Get browser preferred languages
const preferredLanguages = usePreferredLanguages()

// Get flag icon for each language
function getLanguageIcon(locale: string) {
  switch (locale) {
    case 'en': return 'twemoji:flag-united-kingdom'
    case 'nl': return 'twemoji:flag-netherlands'
    case 'es': return 'twemoji:flag-spain'
    case 'fr': return 'twemoji:flag-france'
    case 'de': return 'twemoji:flag-germany'
    case 'it': return 'twemoji:flag-italy'
    case 'pt': return 'twemoji:flag-portugal'
    case 'ru': return 'twemoji:flag-russia'
    case 'zh': return 'twemoji:flag-china'
    case 'ja': return 'twemoji:flag-japan'
    case 'ko': return 'twemoji:flag-south-korea'
    case 'ar': return 'twemoji:flag-saudi-arabia'
    case 'hi': return 'twemoji:flag-india'
    case 'hu': return 'twemoji:flag-hungary'
    default: return 'i-lucide-globe'
  }
}

// Get native name for each language
function getNativeLanguageName(locale: string) {
  switch (locale) {
    case 'en': return 'English'
    case 'nl': return 'Nederlands'
    case 'es': return 'Español'
    case 'fr': return 'Français'
    case 'de': return 'Deutsch'
    case 'it': return 'Italiano'
    case 'pt': return 'Português'
    case 'ru': return 'Русский'
    case 'zh': return '中文'
    case 'ja': return '日本語'
    case 'ko': return '한국어'
    case 'ar': return 'العربية'
    case 'hi': return 'हिन्दी'
    case 'hu': return 'Magyar'
    default: return locale
  }
}

// Format locale options for the dropdown
const items = computed(() => {
  return [
    {
      label: t('language.auto'),
      value: 'auto',
      icon: 'i-lucide-globe',
    },
    ...availableLocales.map(loc => ({
      label: getNativeLanguageName(loc),
      value: loc,
      icon: getLanguageIcon(loc),
    })),
  ]
})

// Get the system's preferred locale from the available ones
function getSystemLocale() {
  for (const lang of preferredLanguages.value) {
    const shortLang = lang.split('-')[0]
    if (availableLocales.includes(shortLang)) {
      return shortLang
    }
  }
  return 'en' // Default fallback
}

// Set the actual locale based on preference
function updateActualLocale() {
  if (storedLocale.value === 'auto') {
    locale.value = getSystemLocale()
  }
  else if (availableLocales.includes(storedLocale.value)) {
    locale.value = storedLocale.value
  }
  else {
    // Fallback to system locale if the stored locale is not available
    console.warn(`Stored locale "${storedLocale.value}" is not available, falling back to system locale`)
    locale.value = getSystemLocale()
    // Update the stored locale to match what we're actually using
    storedLocale.value = 'auto'
  }
}

// Apply locale when component mounts
onMounted(() => {
  updateActualLocale()
})

// Update when stored locale changes
watch(storedLocale, () => {
  updateActualLocale()
})
</script>

<template>
  <div>
    <USelectMenu
      v-model="storedLocale"
      :items="items"
      value-key="value"
      class="w-30 lg:w-40"
      size="sm"
      :search-input="false"
    >
      <template #leading>
        <UIcon v-if="storedLocale === 'auto'" name="i-lucide-globe" class="w-4 h-4" />
        <UIcon v-else :name="getLanguageIcon(storedLocale)" class="w-4 h-4" />
      </template>
    </USelectMenu>
  </div>
</template>
