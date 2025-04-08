<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import DebugModal from './components/debug/DebugModal.vue'
import KinkListView from './components/KinkListView.vue'
import { useKinkListState } from './composables/useKinkList'

const { viewListFromUrl } = useKinkListState()
const toast = useToast()
const { t } = useI18n()

// Check for list parameter in URL
onMounted(() => {
  // Get URL parameters directly from browser's URL API
  const urlParams = new URLSearchParams(window.location.search)
  const listParam = urlParams.get('list')

  if (listParam) {
    try {
      const result = viewListFromUrl(listParam)
      if (!result) {
        // Failed to import - show error toast
        toast.add({
          title: t('app.import_error'),
          description: t('app.import_error_old_format'),
          color: 'error',
        })

        // Remove the list parameter from URL to avoid repeated errors
        if (window.history) {
          window.history.replaceState({}, document.title, window.location.pathname)
        }
      }
    }
    catch (e) {
      console.error('Failed to view list from URL', e)

      // Show error toast
      toast.add({
        title: t('app.import_error'),
        description: t('app.import_error_old_format'),
        color: 'error',
      })

      // Remove the list parameter from URL to avoid repeated errors
      if (window.history) {
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }
  }
})
</script>

<template>
  <UApp>
    <div class="min-h-screen">
      <KinkListView />
      <DebugModal />
    </div>
  </UApp>
</template>

<style scoped>
</style>
