<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import SettingsModal from '../modals/SettingsModal.vue'

const { t } = useI18n()
const overlay = useOverlay()

// Open settings modal function
async function openSettingsModal() {
  // Create the modal instance
  const settingsModal = overlay.create(SettingsModal)
  await settingsModal.open()
}
</script>

<template>
  <UButton
    variant="outline"
    size="sm"
    color="neutral"
    icon="i-lucide-settings"
    :aria-label="t('app.settings', 'Settings')"
    @click="openSettingsModal"
  />
</template>
