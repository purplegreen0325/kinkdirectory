<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import KinkListView from './components/KinkListView.vue'
import DebugModal from './components/debug/DebugModal.vue'
import { onMounted } from 'vue'
import { useKinkListState } from './composables/useKinkList'

const { viewListFromUrl } = useKinkListState()

// Check for list parameter in URL
onMounted(() => {
  // Get URL parameters directly from browser's URL API
  const urlParams = new URLSearchParams(window.location.search)
  const listParam = urlParams.get('list')
  
  if (listParam) {
    try {
      viewListFromUrl(listParam)
    } catch (e) {
      console.error('Failed to view list from URL', e)
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
