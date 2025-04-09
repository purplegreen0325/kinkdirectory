<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useKinkListState } from '../../../composables/useKinkList'
import CompareModal from '../../kinklist/modals/CompareModal.vue'
import ConfirmModal from '../../kinklist/modals/ConfirmModal.vue'

const { t } = useI18n()
const toast = useToast()
const overlay = useOverlay()
const { importViewedList, exitViewMode } = useKinkListState()

async function handleImportViewedList() {
  // Create the confirm modal
  const confirmModal = overlay.create(ConfirmModal, {
    props: {
      title: t('app.import_confirm_title'),
      message: t('app.import_confirm_message'),
      confirmColor: 'primary',
    },
  })

  try {
    // Open the modal and await user response
    const confirmed = await confirmModal.open()

    if (confirmed) {
      const importedId = importViewedList()
      if (importedId) {
        // Show success message with toast
        toast.add({
          title: t('app.list_imported'),
          description: t('app.imported_from_shared'),
          icon: 'i-lucide-clipboard-copy',
          color: 'success',
          duration: 3000,
        })
        exitViewMode()
      }
    }
  }
  catch (e) {
    console.error('Error in import confirmation', e)
  }
}

async function handleCompare() {
  // Create the compare modal
  const compareModal = overlay.create(CompareModal)
  await compareModal.open()
}
</script>

<template>
  <div class="border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/30 rounded-md p-3 mb-4 flex items-center justify-between flex-wrap gap-2">
    <div class="flex items-center">
      <UIcon name="i-lucide-eye" class="mr-2 text-blue-500" />
      <p class="text-sm">
        {{ t('app.view_only_mode') }}
      </p>
    </div>
    <div class="flex gap-2">
      <UButton
        icon="i-lucide-x"
        size="sm"
        color="secondary"
        @click="exitViewMode"
      >
        {{ t('app.exit_view_mode') }}
      </UButton>
      <UButton
        icon="i-lucide-clipboard-copy"
        size="sm"
        color="primary"
        @click="handleImportViewedList"
      >
        {{ t('app.import_list') }}
      </UButton>
      <UButton
        icon="material-symbols:compare-arrows-rounded"
        size="sm"
        color="primary"
        @click="handleCompare"
      >
        {{ t('app.compare') }}
      </UButton>
    </div>
  </div>
</template>
